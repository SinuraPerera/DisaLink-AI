/**
 * Firestore Security Rules Test Specification for the "Dirty Dozen" Payloads.
 * Verifies that all 12 adversarial payloads return PERMISSION_DENIED.
 */

export interface DirtyDozenTestCase {
  id: number;
  name: string;
  operation: 'create' | 'update' | 'get' | 'list';
  path: string;
  auth: { uid: string; email_verified: boolean } | null;
  payload?: Record<string, unknown>;
  expectedOutcome: 'PERMISSION_DENIED';
}

export const DIRTY_DOZEN_TESTS: DirtyDozenTestCase[] = [
  {
    id: 1,
    name: 'Unauthenticated Write',
    operation: 'create',
    path: '/coordinator_records/rec_01',
    auth: null,
    payload: { uid: 'u1' },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 2,
    name: 'Unverified Email Spoof',
    operation: 'create',
    path: '/coordinator_records/rec_02',
    auth: { uid: 'u1', email_verified: false },
    payload: { uid: 'u1' },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 3,
    name: 'Identity Spoofing on Create',
    operation: 'create',
    path: '/coordinator_records/rec_03',
    auth: { uid: 'u1', email_verified: true },
    payload: { uid: 'u2', recordType: 'case_snapshot' },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 4,
    name: 'Shadow Field Injection',
    operation: 'create',
    path: '/coordinator_records/rec_04',
    auth: { uid: 'u1', email_verified: true },
    payload: { uid: 'u1', ghostField: true },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 5,
    name: 'Path Variable ID Poisoning',
    operation: 'create',
    path: '/coordinator_records/bad$id!@#',
    auth: { uid: 'u1', email_verified: true },
    payload: { uid: 'u1' },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 6,
    name: 'Volumetric String Overflow',
    operation: 'create',
    path: '/coordinator_records/rec_06',
    auth: { uid: 'u1', email_verified: true },
    payload: { uid: 'u1', summaryText: 'x'.repeat(5000) },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 7,
    name: 'Invalid Enum Value',
    operation: 'create',
    path: '/coordinator_records/rec_07',
    auth: { uid: 'u1', email_verified: true },
    payload: { uid: 'u1', recordType: 'invalid_enum' },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 8,
    name: 'Urgency Out of Bounds',
    operation: 'create',
    path: '/coordinator_records/rec_08',
    auth: { uid: 'u1', email_verified: true },
    payload: { uid: 'u1', urgency: 99 },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 9,
    name: 'Forged Client Timestamp',
    operation: 'create',
    path: '/coordinator_records/rec_09',
    auth: { uid: 'u1', email_verified: true },
    payload: { uid: 'u1', createdAt: '1999-01-01T00:00:00Z' },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 10,
    name: 'Cross-Tenant Read Attempt',
    operation: 'get',
    path: '/coordinator_records/rec_owned_by_u2',
    auth: { uid: 'u1', email_verified: true },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 11,
    name: 'Immutable Field Mutation on Update',
    operation: 'update',
    path: '/coordinator_records/rec_11',
    auth: { uid: 'u1', email_verified: true },
    payload: { uid: 'u2' },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 12,
    name: 'Terminal State Bypass on Archived Record',
    operation: 'update',
    path: '/coordinator_records/rec_archived',
    auth: { uid: 'u1', email_verified: true },
    payload: { status: 'active' },
    expectedOutcome: 'PERMISSION_DENIED',
  },
];
