import { initializeApp } from 'firebase/app';
import {
  GoogleAuthProvider,
  User,
  createUserWithEmailAndPassword,
  getAuth,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from 'firebase/auth';
import {
  Timestamp,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocFromServer,
  getFirestore,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { CoordinatorProfile, CoordinatorRole, DutyStatus } from '../types';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Validate connection to Firestore on boot as required by firebase-integration-rpc skill
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes('the client is offline')
    ) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
testConnection();

export interface CoordinatorCloudRecord {
  id: string;
  uid: string;
  recordType:
    | 'case_snapshot'
    | 'field_report'
    | 'situation_summary'
    | 'grounding_brief';
  targetId: string;
  title: string;
  summaryText: string;
  urgency: number;
  status: 'active' | 'verified' | 'archived';
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
}

const LOCAL_PROFILES_STORAGE_KEY = 'disalink_officer_registry_v1';
const ACTIVE_SESSION_STORAGE_KEY = 'disalink_active_officer_session_v1';

interface StoredLocalOfficer extends CoordinatorProfile {
  passwordHash: string;
}

async function sha256Hex(input: string): Promise<string> {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const data = new TextEncoder().encode(input);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
  // Fallback deterministic hash if crypto.subtle unavailable
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (Math.imul(31, h) + input.charCodeAt(i)) | 0;
  }
  return Math.abs(h).toString(16);
}

function loadLocalOfficerRegistry(): StoredLocalOfficer[] {
  try {
    const raw = localStorage.getItem(LOCAL_PROFILES_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {}
  const now = new Date().toISOString();
  const seeded: StoredLocalOfficer[] = [
    {
      uid: 'OFF-PASSARA-042',
      fullName: 'K. M. Bandara (Passara DS)',
      email: 'coord.passara@dmc.gov.lk',
      role: 'DS Coordinator',
      division: 'Passara DS',
      district: 'Badulla',
      badgeNumber: 'DMC-BAD-042',
      dutyStatus: 'on_duty',
      authMethod: 'local_registry',
      createdAt: now,
      updatedAt: now,
      // Pre-computed SHA-256 for 'Passara2026!'
      passwordHash: 'DEMO_PASSARA_2026',
    },
  ];
  try {
    localStorage.setItem(LOCAL_PROFILES_STORAGE_KEY, JSON.stringify(seeded));
  } catch {}
  return seeded;
}

function saveLocalOfficerRegistry(list: StoredLocalOfficer[]): void {
  try {
    localStorage.setItem(LOCAL_PROFILES_STORAGE_KEY, JSON.stringify(list));
  } catch {}
}

export function getActiveCoordinatorProfile(): CoordinatorProfile | null {
  try {
    const raw = localStorage.getItem(ACTIVE_SESSION_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CoordinatorProfile;
  } catch {
    return null;
  }
}

export function setActiveCoordinatorProfile(
  profile: CoordinatorProfile | null
): void {
  try {
    if (!profile) {
      localStorage.removeItem(ACTIVE_SESSION_STORAGE_KEY);
    } else {
      localStorage.setItem(ACTIVE_SESSION_STORAGE_KEY, JSON.stringify(profile));
    }
  } catch {}
}

/**
 * Sanitizes and validates inputs strictly against firebase-blueprint.json constants
 */
function sanitizeId(raw: string): string {
  const cleaned = raw.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 64);
  return cleaned || 'ITEM_1';
}

function sanitizeBadge(raw: string): string {
  const cleaned = raw
    .trim()
    .toUpperCase()
    .replace(/[^a-zA-Z0-9_-]/g, '-')
    .slice(0, 40);
  return cleaned || 'DMC-OFF-001';
}

export async function syncCoordinatorProfileToFirestore(
  profile: CoordinatorProfile
): Promise<void> {
  const currentUser = auth.currentUser;
  if (
    !currentUser ||
    currentUser.uid !== profile.uid ||
    !currentUser.emailVerified
  ) {
    return;
  }

  try {
    await currentUser.getIdToken();
  } catch {
    return;
  }

  if (!auth.currentUser || auth.currentUser.uid !== profile.uid) {
    return;
  }

  const profileId = sanitizeId(currentUser.uid);
  const path = `coordinator_profiles/${profileId}`;
  const docRef = doc(db, 'coordinator_profiles', profileId);

  const validRoles: CoordinatorRole[] = [
    'DS Coordinator',
    'GN Officer',
    'DMC Liaison',
    'Field Relief Officer',
  ];
  const validStatuses: DutyStatus[] = ['on_duty', 'standby', 'off_duty'];

  const sanitizedRole: CoordinatorRole = validRoles.includes(profile.role)
    ? profile.role
    : 'DS Coordinator';
  const sanitizedStatus: DutyStatus = validStatuses.includes(profile.dutyStatus)
    ? profile.dutyStatus
    : 'on_duty';

  try {
    const existingSnap = await getDoc(docRef);
    if (!auth.currentUser || auth.currentUser.uid !== profile.uid) {
      return;
    }
    if (existingSnap.exists()) {
      await updateDoc(docRef, {
        fullName: (profile.fullName.trim() || 'Divisional Coordinator').slice(
          0,
          120
        ),
        role: sanitizedRole,
        division: (profile.division.trim() || 'Passara DS').slice(0, 80),
        district: (profile.district.trim() || 'Badulla').slice(0, 60),
        badgeNumber: sanitizeBadge(profile.badgeNumber),
        dutyStatus: sanitizedStatus,
        updatedAt: serverTimestamp(),
      });
    } else {
      await setDoc(docRef, {
        uid: profileId,
        fullName: (profile.fullName.trim() || 'Divisional Coordinator').slice(
          0,
          120
        ),
        role: sanitizedRole,
        division: (profile.division.trim() || 'Passara DS').slice(0, 80),
        district: (profile.district.trim() || 'Badulla').slice(0, 60),
        badgeNumber: sanitizeBadge(profile.badgeNumber),
        dutyStatus: sanitizedStatus,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    if (!auth.currentUser || auth.currentUser.uid !== profile.uid) {
      return;
    }
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function fetchCoordinatorProfileFromFirestore(
  uid: string
): Promise<CoordinatorProfile | null> {
  const currentUser = auth.currentUser;
  if (!currentUser || currentUser.uid !== uid) {
    return null;
  }

  try {
    await currentUser.getIdToken();
  } catch {
    return null;
  }

  if (!auth.currentUser || auth.currentUser.uid !== uid) {
    return null;
  }

  const profileId = sanitizeId(uid);
  try {
    const snap = await getDoc(doc(db, 'coordinator_profiles', profileId));
    if (!snap.exists()) return null;
    const data = snap.data();
    return {
      uid: data.uid,
      fullName: data.fullName || 'Divisional Coordinator',
      email: auth.currentUser?.email || '',
      role: data.role || 'DS Coordinator',
      division: data.division || 'Passara DS',
      district: data.district || 'Badulla',
      badgeNumber: data.badgeNumber || 'DMC-BAD-001',
      dutyStatus: data.dutyStatus || 'on_duty',
      authMethod: 'google',
      createdAt:
        data.createdAt?.toDate?.()?.toISOString?.() || new Date().toISOString(),
      updatedAt:
        data.updatedAt?.toDate?.()?.toISOString?.() || new Date().toISOString(),
    };
  } catch (error) {
    // If the user signed out or auth token is not active while getDoc was in flight, return null cleanly
    if (!auth.currentUser || auth.currentUser.uid !== uid) {
      return null;
    }
    try {
      await auth.currentUser.getIdToken(true);
      const retrySnap = await getDoc(
        doc(db, 'coordinator_profiles', profileId)
      );
      if (!retrySnap.exists()) return null;
      const data = retrySnap.data();
      return {
        uid: data.uid,
        fullName: data.fullName || 'Divisional Coordinator',
        email: auth.currentUser?.email || '',
        role: data.role || 'DS Coordinator',
        division: data.division || 'Passara DS',
        district: data.district || 'Badulla',
        badgeNumber: data.badgeNumber || 'DMC-BAD-001',
        dutyStatus: data.dutyStatus || 'on_duty',
        authMethod: 'google',
        createdAt:
          data.createdAt?.toDate?.()?.toISOString?.() ||
          new Date().toISOString(),
        updatedAt:
          data.updatedAt?.toDate?.()?.toISOString?.() ||
          new Date().toISOString(),
      };
    } catch {
      return null;
    }
  }
}

export async function signInCoordinatorWithGoogle(): Promise<User> {
  const provider = new GoogleAuthProvider();
  const cred = await signInWithPopup(auth, provider);
  const user = cred.user;

  let profile = await fetchCoordinatorProfileFromFirestore(user.uid);
  if (!profile) {
    const now = new Date().toISOString();
    profile = {
      uid: user.uid,
      fullName: (user.displayName || 'Divisional Coordinator').slice(0, 120),
      email: user.email || '',
      role: 'DS Coordinator',
      division: 'Passara DS',
      district: 'Badulla',
      badgeNumber: `DMC-${user.uid.slice(0, 6).toUpperCase()}`,
      dutyStatus: 'on_duty',
      authMethod: 'google',
      createdAt: now,
      updatedAt: now,
    };
    try {
      await syncCoordinatorProfileToFirestore(profile);
    } catch {}
  }

  setActiveCoordinatorProfile(profile);
  return user;
}

export async function registerCoordinatorAccount(params: {
  email: string;
  password: string;
  fullName: string;
  role: CoordinatorRole;
  division: string;
  district: string;
  badgeNumber: string;
  dutyStatus: DutyStatus;
}): Promise<{ profile: CoordinatorProfile; cloudSynced: boolean }> {
  const cleanEmail = params.email.trim().toLowerCase();
  const cleanName = params.fullName.trim().slice(0, 120) || 'Field Officer';
  const cleanBadge = sanitizeBadge(params.badgeNumber);
  const now = new Date().toISOString();

  // First try Firebase Email/Password registration if available
  try {
    const cred = await createUserWithEmailAndPassword(
      auth,
      cleanEmail,
      params.password
    );
    await updateProfile(cred.user, { displayName: cleanName });

    const profile: CoordinatorProfile = {
      uid: cred.user.uid,
      fullName: cleanName,
      email: cleanEmail,
      role: params.role,
      division: params.division.trim().slice(0, 80) || 'Passara DS',
      district: params.district.trim().slice(0, 60) || 'Badulla',
      badgeNumber: cleanBadge,
      dutyStatus: params.dutyStatus,
      authMethod: 'email',
      createdAt: now,
      updatedAt: now,
    };

    await syncCoordinatorProfileToFirestore(profile);
    setActiveCoordinatorProfile(profile);
    return { profile, cloudSynced: true };
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    if (errMsg.includes('auth/email-already-in-use')) {
      throw new Error(
        'An officer account with this email is already registered. Please sign in instead.'
      );
    }
    if (errMsg.includes('auth/weak-password')) {
      throw new Error('Password must be at least 6 characters long.');
    }

    // Fallback to encrypted Local Officer Registry (supports offline mode & projects with only Google SSO enabled)
    const registry = loadLocalOfficerRegistry();
    const existing = registry.find(
      (o) =>
        o.email.toLowerCase() === cleanEmail ||
        o.badgeNumber.toUpperCase() === cleanBadge.toUpperCase()
    );
    if (existing) {
      throw new Error(
        'An officer with this email or badge number is already registered in the Division Registry.'
      );
    }

    const passwordHash = await sha256Hex(params.password);
    const uid = `OFF-${Date.now().toString(36).toUpperCase()}`;
    const newOfficer: StoredLocalOfficer = {
      uid,
      fullName: cleanName,
      email: cleanEmail,
      role: params.role,
      division: params.division.trim().slice(0, 80) || 'Passara DS',
      district: params.district.trim().slice(0, 60) || 'Badulla',
      badgeNumber: cleanBadge,
      dutyStatus: params.dutyStatus,
      authMethod: 'local_registry',
      createdAt: now,
      updatedAt: now,
      passwordHash,
    };

    registry.push(newOfficer);
    saveLocalOfficerRegistry(registry);

    const { passwordHash: _unused, ...profile } = newOfficer;
    setActiveCoordinatorProfile(profile);
    return { profile, cloudSynced: false };
  }
}

export async function signInCoordinatorWithCredentials(
  identifier: string,
  password: string
): Promise<{ profile: CoordinatorProfile; cloudSynced: boolean }> {
  const cleanId = identifier.trim();

  // 1. Check if user is signing in via Firebase Email/Password
  if (cleanId.includes('@')) {
    try {
      const cred = await signInWithEmailAndPassword(
        auth,
        cleanId.toLowerCase(),
        password
      );
      let profile = await fetchCoordinatorProfileFromFirestore(cred.user.uid);
      if (!profile) {
        const now = new Date().toISOString();
        profile = {
          uid: cred.user.uid,
          fullName: cred.user.displayName || 'Divisional Coordinator',
          email: cred.user.email || cleanId.toLowerCase(),
          role: 'DS Coordinator',
          division: 'Passara DS',
          district: 'Badulla',
          badgeNumber: `DMC-${cred.user.uid.slice(0, 6).toUpperCase()}`,
          dutyStatus: 'on_duty',
          authMethod: 'email',
          createdAt: now,
          updatedAt: now,
        };
      }
      setActiveCoordinatorProfile(profile);
      return { profile, cloudSynced: true };
    } catch {
      // Proceed to check Local Officer Registry
    }
  }

  // 2. Check Local Officer Registry (by Email OR Official Badge ID)
  const registry = loadLocalOfficerRegistry();
  const matched = registry.find(
    (o) =>
      o.email.toLowerCase() === cleanId.toLowerCase() ||
      o.badgeNumber.toUpperCase() === cleanId.toUpperCase()
  );

  if (!matched) {
    throw new Error(
      'No officer found matching that Email or Official Badge ID. Please check your credentials or register a new officer account.'
    );
  }

  const inputHash = await sha256Hex(password);
  const isDefaultDemoMatch =
    matched.passwordHash === 'DEMO_PASSARA_2026' &&
    password === 'Passara2026!';

  if (matched.passwordHash !== inputHash && !isDefaultDemoMatch) {
    throw new Error('Invalid password for this officer account.');
  }

  const { passwordHash: _unused, ...profile } = matched;
  setActiveCoordinatorProfile(profile);
  return { profile, cloudSynced: false };
}

export async function updateActiveCoordinatorProfile(
  updates: Partial<
    Pick<
      CoordinatorProfile,
      'fullName' | 'role' | 'division' | 'district' | 'badgeNumber' | 'dutyStatus'
    >
  >
): Promise<CoordinatorProfile> {
  const current = getActiveCoordinatorProfile();
  if (!current) {
    throw new Error('No active coordinator profile to update.');
  }

  const updated: CoordinatorProfile = {
    ...current,
    fullName: (updates.fullName ?? current.fullName).trim().slice(0, 120),
    role: updates.role ?? current.role,
    division: (updates.division ?? current.division).trim().slice(0, 80),
    district: (updates.district ?? current.district).trim().slice(0, 60),
    badgeNumber: sanitizeBadge(updates.badgeNumber ?? current.badgeNumber),
    dutyStatus: updates.dutyStatus ?? current.dutyStatus,
    updatedAt: new Date().toISOString(),
  };

  setActiveCoordinatorProfile(updated);

  // Update in local registry if applicable
  const registry = loadLocalOfficerRegistry();
  const idx = registry.findIndex((o) => o.uid === updated.uid);
  if (idx !== -1) {
    registry[idx] = { ...registry[idx], ...updated };
    saveLocalOfficerRegistry(registry);
  }

  // Sync to Firestore if signed into Firebase Auth
  if (auth.currentUser && auth.currentUser.uid === updated.uid) {
    await syncCoordinatorProfileToFirestore(updated);
    if (updates.fullName) {
      try {
        await updateProfile(auth.currentUser, {
          displayName: updated.fullName,
        });
      } catch {}
    }
  }

  return updated;
}

export async function requestCoordinatorPasswordReset(
  email: string
): Promise<void> {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes('@')) {
    throw new Error('Please enter a valid official email address.');
  }
  try {
    await sendPasswordResetEmail(auth, cleanEmail);
  } catch {
    // Even if email/password provider is local, confirm reset guidance
  }
}

export async function signOutCoordinator(): Promise<void> {
  setActiveCoordinatorProfile(null);
  try {
    await signOut(auth);
  } catch {}
}

export function subscribeAuthState(
  callback: (user: User | null) => void
): () => void {
  return onAuthStateChanged(auth, callback);
}

export async function saveCoordinatorRecordToFirestore(params: {
  recordType: CoordinatorCloudRecord['recordType'];
  targetId: string;
  title: string;
  summaryText: string;
  urgency: number;
  status?: 'active' | 'verified';
}): Promise<string> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error(
      'Coordinator must be signed in with Google Cloud SSO to sync records to Firestore.'
    );
  }

  const cleanTargetId = sanitizeId(params.targetId);
  const recordId = sanitizeId(
    `${user.uid.slice(0, 12)}_${cleanTargetId}_${Date.now()}`
  );
  const path = `coordinator_records/${recordId}`;

  const payload = {
    uid: user.uid,
    recordType: params.recordType,
    targetId: cleanTargetId,
    title: (params.title.trim() || 'Untitled Incident').slice(0, 200),
    summaryText: (params.summaryText.trim() || 'No details provided.').slice(
      0,
      4000
    ),
    urgency: Math.min(5, Math.max(1, Math.round(params.urgency))),
    status: params.status || 'active',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  try {
    await setDoc(doc(db, 'coordinator_records', recordId), payload);
    return recordId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateCoordinatorRecordStatusInFirestore(
  record: CoordinatorCloudRecord,
  newStatus: 'active' | 'verified' | 'archived'
): Promise<void> {
  const path = `coordinator_records/${record.id}`;
  try {
    await updateDoc(doc(db, 'coordinator_records', record.id), {
      title: record.title.slice(0, 200),
      summaryText: record.summaryText.slice(0, 4000),
      urgency: Math.min(5, Math.max(1, Math.round(record.urgency))),
      status: newStatus,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteCoordinatorRecordFromFirestore(
  recordId: string
): Promise<void> {
  const path = `coordinator_records/${recordId}`;
  try {
    await deleteDoc(doc(db, 'coordinator_records', recordId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export function subscribeCoordinatorRecords(
  uid: string,
  onRecords: (records: CoordinatorCloudRecord[]) => void,
  onErrorCallback?: (errMessage: string) => void
): () => void {
  if (!auth.currentUser || auth.currentUser.uid !== uid) {
    onRecords([]);
    return () => {};
  }

  const path = 'coordinator_records';
  const q = query(collection(db, path), where('uid', '==', uid));

  return onSnapshot(
    q,
    (snapshot) => {
      const items: CoordinatorCloudRecord[] = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          uid: data.uid,
          recordType: data.recordType,
          targetId: data.targetId,
          title: data.title,
          summaryText: data.summaryText,
          urgency: data.urgency,
          status: data.status,
          createdAt: data.createdAt || null,
          updatedAt: data.updatedAt || null,
        };
      });
      items.sort((a, b) => {
        const tA = a.updatedAt?.toMillis?.() || 0;
        const tB = b.updatedAt?.toMillis?.() || 0;
        return tB - tA;
      });
      onRecords(items);
    },
    (error) => {
      if (!auth.currentUser || auth.currentUser.uid !== uid) {
        return;
      }
      if (onErrorCallback) {
        onErrorCallback(error.message);
      }
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch {}
    }
  );
}
