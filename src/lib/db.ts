import { openDB, DBSchema, IDBPDatabase } from 'idb';
import {
  GNArea,
  IncidentCase,
  LedgerActionType,
  LedgerEntry,
  OfflineQueuedReport,
  Report,
  SyncHistoryEvent,
} from '../types';
import { INITIAL_GN_AREAS, INITIAL_SYNTHETIC_REPORTS } from './seed';
import {
  assignTriageQueue,
  buildOrUpdateCaseFromReports,
  findMatchingCase,
  geocodeSriLankaPlace,
} from './triage';
import { buildLedgerEntry } from './ledger';
import { extractReportWithGemini } from './ai';
import { getActiveCoordinatorProfile } from './firebase';

function getHumanCoordinatorActor(): string {
  const profile = getActiveCoordinatorProfile();
  if (profile && profile.fullName) {
    return `${profile.fullName} [${profile.badgeNumber}] (${profile.role})`;
  }
  return 'DS Coordinator (Human)';
}

interface DisaLinkDB extends DBSchema {
  reports: {
    key: string;
    value: Report;
  };
  cases: {
    key: string;
    value: IncidentCase;
  };
  offlineQueue: {
    key: string;
    value: OfflineQueuedReport;
  };
  ledger: {
    key: string;
    value: LedgerEntry;
  };
  gnAreas: {
    key: string;
    value: GNArea;
  };
  syncHistory: {
    key: string;
    value: SyncHistoryEvent;
  };
}

const DB_NAME = 'disalink-ai-db-v1';
const DB_VERSION = 2;

let dbPromise: Promise<IDBPDatabase<DisaLinkDB>> | null = null;

export function getDB(): Promise<IDBPDatabase<DisaLinkDB>> {
  if (!dbPromise) {
    dbPromise = openDB<DisaLinkDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('reports')) {
          db.createObjectStore('reports', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('cases')) {
          db.createObjectStore('cases', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('offlineQueue')) {
          db.createObjectStore('offlineQueue', { keyPath: 'idempotencyKey' });
        }
        if (!db.objectStoreNames.contains('ledger')) {
          db.createObjectStore('ledger', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('gnAreas')) {
          db.createObjectStore('gnAreas', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('syncHistory')) {
          db.createObjectStore('syncHistory', { keyPath: 'id' });
        }
      },
    });
  }
  return dbPromise;
}

export interface AppDataSnapshot {
  reports: Report[];
  cases: IncidentCase[];
  offlineQueue: OfflineQueuedReport[];
  ledger: LedgerEntry[];
  gnAreas: GNArea[];
  syncHistory: SyncHistoryEvent[];
}

const INITIAL_SYNC_HISTORY: SyncHistoryEvent[] = [
  {
    id: 'SYNC-001',
    syncedAt: new Date(Date.now() - 19 * 60 * 60 * 1000).toISOString(),
    processedCount: 2,
    reportIds: ['R-013', 'R-014'],
    caseIds: ['C-008', 'C-009'],
    idempotencyKeys: [
      'seed-uuid-0013-rattota-en',
      'seed-uuid-0014-matale-si',
    ],
    trigger: 'auto_reconnect',
  },
  {
    id: 'SYNC-002',
    syncedAt: new Date(Date.now() - 13 * 60 * 60 * 1000).toISOString(),
    processedCount: 3,
    reportIds: ['R-009', 'R-010', 'R-011'],
    caseIds: ['C-006', 'C-007'],
    idempotencyKeys: [
      'seed-uuid-0009-peradeniya-si',
      'seed-uuid-0010-peradeniya-en',
      'seed-uuid-0011-katugastota-si',
    ],
    trigger: 'auto_reconnect',
  },
  {
    id: 'SYNC-003',
    syncedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    processedCount: 2,
    reportIds: ['R-001', 'R-002'],
    caseIds: ['C-001'],
    idempotencyKeys: [
      'seed-uuid-0001-gelioya-rom-si',
      'seed-uuid-0002-gelioya-ta',
    ],
    trigger: 'auto_reconnect',
  },
  {
    id: 'SYNC-004',
    syncedAt: new Date(Date.now() - 95 * 60 * 1000).toISOString(),
    processedCount: 4,
    reportIds: ['R-003', 'R-004', 'R-007', 'R-008'],
    caseIds: ['C-002', 'C-004', 'C-005'],
    idempotencyKeys: [
      'seed-uuid-0003-akurana-si',
      'seed-uuid-0004-akurana-en',
      'seed-uuid-0007-hanthana-si',
      'seed-uuid-0008-kadugannawa-en',
    ],
    trigger: 'auto_reconnect',
  },
  {
    id: 'SYNC-005',
    syncedAt: new Date(Date.now() - 38 * 60 * 1000).toISOString(),
    processedCount: 2,
    reportIds: ['R-005', 'R-006'],
    caseIds: ['C-003'],
    idempotencyKeys: [
      'seed-uuid-0005-nawalapitiya-ta',
      'seed-uuid-0006-nawalapitiya-rom-ta',
    ],
    trigger: 'manual_sync',
  },
];

export async function loadAllData(): Promise<AppDataSnapshot> {
  const db = await getDB();
  const [reports, cases, offlineQueue, ledger, gnAreas, rawSyncHistory] =
    await Promise.all([
      db.getAll('reports'),
      db.getAll('cases'),
      db.getAll('offlineQueue'),
      db.getAll('ledger'),
      db.getAll('gnAreas'),
      db.getAll('syncHistory'),
    ]);

  let syncHistory = rawSyncHistory;
  if (syncHistory.length < 3 && reports.length > 0) {
    const tx = db.transaction('syncHistory', 'readwrite');
    for (const sh of INITIAL_SYNC_HISTORY) {
      await tx.objectStore('syncHistory').put(sh);
    }
    await tx.done;
    syncHistory = await db.getAll('syncHistory');
  }

  return {
    reports: reports.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    ),
    cases: cases.sort((a, b) => {
      if (b.urgency !== a.urgency) return b.urgency - a.urgency;
      return b.confidence - a.confidence;
    }),
    offlineQueue: offlineQueue.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    ),
    ledger: ledger.sort((a, b) => a.seq - b.seq),
    gnAreas,
    syncHistory: syncHistory.sort(
      (a, b) => new Date(b.syncedAt).getTime() - new Date(a.syncedAt).getTime()
    ),
  };
}

export async function initAndSeedDatabase(
  forceReset = false
): Promise<AppDataSnapshot> {
  const db = await getDB();
  const existingReports = await db.getAll('reports');

  if (!forceReset && existingReports.length > 0) {
    return loadAllData();
  }

  // Clear all stores for a clean seed
  const tx = db.transaction(
    ['reports', 'cases', 'offlineQueue', 'ledger', 'gnAreas', 'syncHistory'],
    'readwrite'
  );
  await Promise.all([
    tx.objectStore('reports').clear(),
    tx.objectStore('cases').clear(),
    tx.objectStore('offlineQueue').clear(),
    tx.objectStore('ledger').clear(),
    tx.objectStore('gnAreas').clear(),
    tx.objectStore('syncHistory').clear(),
    tx.done,
  ]);

  const seededReports: Report[] = [];
  const seededCases: IncidentCase[] = [];
  const seededLedger: LedgerEntry[] = [];
  let seq = 1;
  let prevHash = '0';

  const appendSeedLedger = async (params: {
    timestamp: string;
    actor: string;
    type: LedgerActionType;
    targetId: string;
    summary: string;
    payload: Record<string, unknown>;
  }) => {
    const entry = await buildLedgerEntry({
      seq,
      timestamp: params.timestamp,
      actor: params.actor,
      type: params.type,
      targetId: params.targetId,
      summary: params.summary,
      payload: params.payload,
      prevHash,
    });
    seededLedger.push(entry);
    prevHash = entry.hash;
    seq += 1;
  };

  for (const rawReport of INITIAL_SYNTHETIC_REPORTS) {
    const report: Report = { ...rawReport };
    const matchedCase = findMatchingCase(report, seededCases);

    await appendSeedLedger({
      timestamp: report.timestamp,
      actor: 'Gemini Flash (AI Suggestion)',
      type: 'AI_EXTRACTION_SUGGESTED',
      targetId: report.id,
      summary: `AI extracted ${report.extraction.incident_type} at ${report.extraction.place_english} (lang: ${report.extraction.language}, urgency: ${report.extraction.urgency}/5${report.extraction.ruleAdjusted ? ', rule-adjusted' : ''})`,
      payload: {
        reportId: report.id,
        language: report.extraction.language,
        incident_type: report.extraction.incident_type,
        place_english: report.extraction.place_english,
        urgency: report.extraction.urgency,
        ruleAdjusted: Boolean(report.extraction.ruleAdjusted),
      },
    });

    if (matchedCase) {
      report.caseId = matchedCase.id;
      seededReports.push(report);
      const caseReports = seededReports.filter(
        (r) => r.caseId === matchedCase.id
      );
      const updated = buildOrUpdateCaseFromReports(
        matchedCase.id,
        caseReports,
        matchedCase
      );
      if (report.humanConfirmed) {
        updated.humanConfirmed = true;
        updated.status = 'confirmed';
      }
      const idx = seededCases.findIndex((c) => c.id === matchedCase.id);
      seededCases[idx] = updated;

      await appendSeedLedger({
        timestamp: report.timestamp,
        actor: 'System (Rule Engine)',
        type: 'CASE_MERGED_OR_CREATED',
        targetId: updated.id,
        summary: `Merged ${report.id} (${report.extraction.language}) into ${updated.id} (${updated.place_english}); noisy-OR confidence rose to ${(updated.confidence * 100).toFixed(0)}% [${updated.queue}]`,
        payload: {
          caseId: updated.id,
          mergedReportId: report.id,
          reportCount: updated.reportIds.length,
          confidence: updated.confidence,
          queue: updated.queue,
        },
      });
    } else {
      const newCaseId = `C-${String(seededCases.length + 1).padStart(3, '0')}`;
      report.caseId = newCaseId;
      seededReports.push(report);
      const created = buildOrUpdateCaseFromReports(newCaseId, [report]);
      if (report.humanConfirmed) {
        created.humanConfirmed = true;
        created.status = 'confirmed';
      }
      seededCases.push(created);

      await appendSeedLedger({
        timestamp: report.timestamp,
        actor: 'System (Rule Engine)',
        type: 'CASE_MERGED_OR_CREATED',
        targetId: created.id,
        summary: `Created case ${created.id} from ${report.id} at ${created.place_english}; confidence ${(created.confidence * 100).toFixed(0)}% -> queue: ${created.queue}`,
        payload: {
          caseId: created.id,
          reportId: report.id,
          confidence: created.confidence,
          queue: created.queue,
        },
      });
    }

    if (report.humanConfirmed) {
      await appendSeedLedger({
        timestamp: report.timestamp,
        actor: 'DS Coordinator (Human)',
        type: 'HUMAN_CONFIRMED_CASE',
        targetId: report.caseId!,
        summary: `Coordinator reviewed and confirmed case ${report.caseId} (${report.extraction.place_english})`,
        payload: {
          caseId: report.caseId,
          reportId: report.id,
          confirmedUrgency: report.extraction.urgency,
        },
      });
    }
  }

  const writeTx = db.transaction(
    ['reports', 'cases', 'ledger', 'gnAreas', 'syncHistory'],
    'readwrite'
  );
  for (const r of seededReports) {
    await writeTx.objectStore('reports').put(r);
  }
  for (const c of seededCases) {
    await writeTx.objectStore('cases').put(c);
  }
  for (const l of seededLedger) {
    await writeTx.objectStore('ledger').put(l);
  }
  for (const g of INITIAL_GN_AREAS) {
    await writeTx.objectStore('gnAreas').put({ ...g });
  }
  for (const sh of INITIAL_SYNC_HISTORY) {
    await writeTx.objectStore('syncHistory').put({ ...sh });
  }
  await writeTx.done;

  return loadAllData();
}

export async function appendLedgerRecord(params: {
  actor: string;
  type: LedgerActionType;
  targetId: string;
  summary: string;
  payload: Record<string, unknown>;
}): Promise<LedgerEntry> {
  const db = await getDB();
  const allEntries = await db.getAll('ledger');
  const sorted = allEntries.sort((a, b) => a.seq - b.seq);
  const last = sorted[sorted.length - 1];
  const nextSeq = last ? last.seq + 1 : 1;
  const prevHash = last ? last.hash : '0';

  const entry = await buildLedgerEntry({
    seq: nextSeq,
    actor: params.actor,
    type: params.type,
    targetId: params.targetId,
    summary: params.summary,
    payload: params.payload,
    prevHash,
  });

  await db.put('ledger', entry);
  return entry;
}

/**
 * Saves and merges a new report after extraction and coordinator review/confirmation.
 * Enforces idempotency via idempotencyKey.
 */
export async function saveAndMergeReport(params: {
  idempotencyKey: string;
  rawText: string;
  sourceType: Report['sourceType'];
  channel: Report['channel'];
  lat: number | null;
  lng: number | null;
  hasPin: boolean;
  hasPhoto: boolean;
  photoDataUrl?: string;
  contact?: string;
  extraction: Report['extraction'];
  humanConfirmed: boolean;
  customReportId?: string;
  customTimestamp?: string;
}): Promise<{ report: Report; mergedCase: IncidentCase; isNewCase: boolean }> {
  const db = await getDB();
  const existingReports = await db.getAll('reports');

  // Idempotency check: prevent duplicate insertion on retry/sync
  const existingByKey = existingReports.find(
    (r) => r.idempotencyKey === params.idempotencyKey
  );
  if (existingByKey) {
    const existingCase = await db.get('cases', existingByKey.caseId || '');
    if (existingCase) {
      return {
        report: existingByKey,
        mergedCase: existingCase,
        isNewCase: false,
      };
    }
  }

  const nextReportNum = existingReports.length + 1;
  const reportId =
    params.customReportId || `R-${String(nextReportNum).padStart(3, '0')}`;

  let finalLat = params.lat;
  let finalLng = params.lng;
  let locationSource: Report['locationSource'] = 'text';

  if (params.hasPin && finalLat !== null && finalLng !== null) {
    locationSource = 'pin';
  } else {
    const geo = geocodeSriLankaPlace(
      params.extraction.place_english,
      params.extraction.place_text
    );
    finalLat = geo.lat;
    finalLng = geo.lng;
    locationSource = geo.matched ? 'geocoded' : 'text';
  }

  const report: Report = {
    id: reportId,
    idempotencyKey: params.idempotencyKey,
    timestamp: params.customTimestamp || new Date().toISOString(),
    rawText: params.rawText,
    sourceType: params.sourceType,
    channel: params.channel,
    lat: finalLat,
    lng: finalLng,
    hasPin: params.hasPin,
    hasPhoto: params.hasPhoto,
    photoDataUrl: params.photoDataUrl,
    contact: params.contact,
    locationSource,
    extraction: params.extraction,
    humanConfirmed: params.humanConfirmed,
    syncStatus: 'synced',
  };

  await appendLedgerRecord({
    actor: 'Gemini Flash (AI Suggestion)',
    type: 'AI_EXTRACTION_SUGGESTED',
    targetId: report.id,
    summary: `AI extracted ${report.extraction.incident_type} at ${report.extraction.place_english} (lang: ${report.extraction.language}, urgency: ${report.extraction.urgency}/5${report.extraction.ruleAdjusted ? ', rule-adjusted' : ''})`,
    payload: {
      reportId: report.id,
      language: report.extraction.language,
      incident_type: report.extraction.incident_type,
      place_english: report.extraction.place_english,
      urgency: report.extraction.urgency,
      ruleAdjusted: Boolean(report.extraction.ruleAdjusted),
    },
  });

  const existingCases = await db.getAll('cases');
  const matchedCase = findMatchingCase(report, existingCases);
  let mergedCase: IncidentCase;
  let isNewCase = false;

  if (matchedCase) {
    report.caseId = matchedCase.id;
    await db.put('reports', report);

    const caseReports = [
      ...existingReports.filter((r) => r.caseId === matchedCase.id),
      report,
    ];
    mergedCase = buildOrUpdateCaseFromReports(
      matchedCase.id,
      caseReports,
      matchedCase
    );
    if (params.humanConfirmed) {
      mergedCase.humanConfirmed = true;
      if (mergedCase.status === 'ai_suggestion') {
        mergedCase.status = 'confirmed';
      }
    }
    await db.put('cases', mergedCase);

    await appendLedgerRecord({
      actor: 'System (Rule Engine)',
      type: 'CASE_MERGED_OR_CREATED',
      targetId: mergedCase.id,
      summary: `Merged ${report.id} (${report.extraction.language}) into ${mergedCase.id} (${mergedCase.place_english}); corroboration confidence now ${(mergedCase.confidence * 100).toFixed(0)}% [${mergedCase.queue}]`,
      payload: {
        caseId: mergedCase.id,
        mergedReportId: report.id,
        reportCount: mergedCase.reportIds.length,
        confidence: mergedCase.confidence,
        queue: mergedCase.queue,
      },
    });
  } else {
    isNewCase = true;
    const newCaseId = `C-${String(existingCases.length + 1).padStart(3, '0')}`;
    report.caseId = newCaseId;
    await db.put('reports', report);

    mergedCase = buildOrUpdateCaseFromReports(newCaseId, [report]);
    if (params.humanConfirmed) {
      mergedCase.humanConfirmed = true;
      mergedCase.status = 'confirmed';
    }
    await db.put('cases', mergedCase);

    await appendLedgerRecord({
      actor: 'System (Rule Engine)',
      type: 'CASE_MERGED_OR_CREATED',
      targetId: mergedCase.id,
      summary: `Created case ${mergedCase.id} from ${report.id} at ${mergedCase.place_english}; confidence ${(mergedCase.confidence * 100).toFixed(0)}% -> queue: ${mergedCase.queue}`,
      payload: {
        caseId: mergedCase.id,
        reportId: report.id,
        confidence: mergedCase.confidence,
        queue: mergedCase.queue,
      },
    });
  }

  if (params.humanConfirmed) {
    await appendLedgerRecord({
      actor: getHumanCoordinatorActor(),
      type: 'HUMAN_CONFIRMED_REPORT',
      targetId: report.id,
      summary: `Coordinator reviewed and confirmed report ${report.id} into case ${mergedCase.id}`,
      payload: {
        reportId: report.id,
        caseId: mergedCase.id,
        urgency: report.extraction.urgency,
        place_english: report.extraction.place_english,
      },
    });
  }

  return { report, mergedCase, isNewCase };
}

/**
 * Enqueues a report into the IndexedDB offline queue with a UUID idempotency key.
 */
export async function enqueueReportOffline(
  item: Omit<OfflineQueuedReport, 'reportId'>
): Promise<OfflineQueuedReport> {
  const db = await getDB();
  const existing = await db.get('offlineQueue', item.idempotencyKey);
  if (existing) return existing;

  const allReports = await db.getAll('reports');
  const allQueued = await db.getAll('offlineQueue');
  const reportId = `R-${String(
    allReports.length + allQueued.length + 1
  ).padStart(3, '0')}`;

  const queued: OfflineQueuedReport = {
    ...item,
    reportId,
  };

  await db.put('offlineQueue', queued);
  await appendLedgerRecord({
    actor: 'Field Device (Offline Queue)',
    type: 'OFFLINE_REPORT_QUEUED',
    targetId: reportId,
    summary: `Queued offline report ${reportId} (${item.sourceType}, channel: ${item.channel}) with idempotency key ${item.idempotencyKey.slice(0, 8)}...`,
    payload: {
      reportId,
      idempotencyKey: item.idempotencyKey,
      sourceType: item.sourceType,
      channel: item.channel,
    },
  });

  return queued;
}

/**
 * Syncs all queued offline reports when connectivity returns.
 * Uses idempotencyKey so no duplicates or losses occur.
 */
export async function syncOfflineQueuedReports(
  trigger: 'auto_reconnect' | 'manual_sync' = 'auto_reconnect'
): Promise<number> {
  const db = await getDB();
  const queueItems = await db.getAll('offlineQueue');
  if (queueItems.length === 0) return 0;

  const sorted = queueItems.sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  let syncedCount = 0;
  const syncedReportIds: string[] = [];
  const syncedCaseIds = new Set<string>();
  const syncedKeys: string[] = [];

  for (const item of sorted) {
    const { extraction } = await extractReportWithGemini(item.rawText);
    const { report, mergedCase } = await saveAndMergeReport({
      idempotencyKey: item.idempotencyKey,
      rawText: item.rawText,
      sourceType: item.sourceType,
      channel: item.channel,
      lat: item.lat,
      lng: item.lng,
      hasPin: item.hasPin,
      hasPhoto: item.hasPhoto,
      photoDataUrl: item.photoDataUrl,
      contact: item.contact,
      extraction,
      humanConfirmed: false,
      customReportId: item.reportId,
      customTimestamp: item.timestamp,
    });

    await db.delete('offlineQueue', item.idempotencyKey);
    await appendLedgerRecord({
      actor: 'System (Offline Sync)',
      type: 'OFFLINE_REPORT_SYNCED',
      targetId: item.reportId,
      summary: `Synced offline report ${item.reportId} (idempotencyKey ${item.idempotencyKey.slice(0, 8)}...) and ran AI extraction`,
      payload: {
        reportId: item.reportId,
        idempotencyKey: item.idempotencyKey,
      },
    });
    syncedCount += 1;
    syncedReportIds.push(report.id);
    syncedCaseIds.add(mergedCase.id);
    syncedKeys.push(item.idempotencyKey);
  }

  if (syncedCount > 0) {
    const existingHistory = await db.getAll('syncHistory');
    const syncEvent: SyncHistoryEvent = {
      id: `SYNC-${String(existingHistory.length + 1).padStart(3, '0')}`,
      syncedAt: new Date().toISOString(),
      processedCount: syncedCount,
      reportIds: syncedReportIds,
      caseIds: Array.from(syncedCaseIds),
      idempotencyKeys: syncedKeys,
      trigger,
    };
    await db.put('syncHistory', syncEvent);
  }

  return syncedCount;
}

/**
 * Coordinator actions on a Case Detail page (confirm, edit priority, mark road blocked, mark verified).
 */
export async function performCaseCoordinatorAction(params: {
  caseId: string;
  actionType:
    | 'HUMAN_CONFIRMED_CASE'
    | 'HUMAN_PRIORITY_EDITED'
    | 'HUMAN_MARKED_ROAD_BLOCKED'
    | 'HUMAN_MARKED_VERIFIED';
  newUrgency?: number;
  newPlaceEnglish?: string;
  newLat?: number;
  newLng?: number;
  roadBlocked?: boolean;
  verified?: boolean;
  note?: string;
}): Promise<IncidentCase | null> {
  const db = await getDB();
  const existing = await db.get('cases', params.caseId);
  if (!existing) return null;

  const updated: IncidentCase = { ...existing };
  updated.updatedAt = new Date().toISOString();

  let summary = '';
  if (params.actionType === 'HUMAN_CONFIRMED_CASE') {
    updated.humanConfirmed = true;
    if (updated.status === 'ai_suggestion') {
      updated.status = 'confirmed';
    }
    summary = `Coordinator confirmed AI suggestion for case ${updated.id} (${updated.place_english})`;
  } else if (params.actionType === 'HUMAN_PRIORITY_EDITED') {
    if (typeof params.newUrgency === 'number') {
      updated.urgency = Math.min(5, Math.max(1, params.newUrgency));
      updated.queue = assignTriageQueue(updated.urgency, updated.confidence);
    }
    if (params.newPlaceEnglish && params.newPlaceEnglish.trim()) {
      updated.place_english = params.newPlaceEnglish.trim();
    }
    if (
      typeof params.newLat === 'number' &&
      typeof params.newLng === 'number'
    ) {
      updated.lat = params.newLat;
      updated.lng = params.newLng;
      updated.locationSource = 'pin';
    }
    updated.humanConfirmed = true;
    if (updated.status === 'ai_suggestion') {
      updated.status = 'confirmed';
    }
    summary = `Coordinator updated case ${updated.id} (Urgency ${updated.urgency}/5 -> Queue: ${updated.queue}, Location: ${updated.place_english} [${updated.lat.toFixed(4)}, ${updated.lng.toFixed(4)}])`;
  } else if (params.actionType === 'HUMAN_MARKED_ROAD_BLOCKED') {
    updated.roadBlocked =
      params.roadBlocked !== undefined
        ? params.roadBlocked
        : !existing.roadBlocked;
    updated.humanConfirmed = true;
    summary = `Coordinator marked road status at ${updated.place_english} (${updated.id}) as ${updated.roadBlocked ? 'ROAD BLOCKED' : 'ROAD PASSABLE'}`;
  } else if (params.actionType === 'HUMAN_MARKED_VERIFIED') {
    updated.verified =
      params.verified !== undefined ? params.verified : !existing.verified;
    updated.humanConfirmed = true;
    updated.status = updated.verified ? 'verified' : 'confirmed';
    summary = `Coordinator marked case ${updated.id} (${updated.place_english}) as ${updated.verified ? 'FIELD VERIFIED' : 'UNVERIFIED'}`;
  }

  await db.put('cases', updated);
  await appendLedgerRecord({
    actor: getHumanCoordinatorActor(),
    type: params.actionType,
    targetId: updated.id,
    summary,
    payload: {
      caseId: updated.id,
      place_english: updated.place_english,
      urgency: updated.urgency,
      confidence: updated.confidence,
      queue: updated.queue,
      roadBlocked: updated.roadBlocked,
      verified: updated.verified,
      note: params.note || undefined,
    },
  });

  return updated;
}

/**
 * Logs when the Coordinator contacts a silent GN area's officer.
 */
export async function markSilentGNAreaContacted(
  gnId: string,
  statusNote: string
): Promise<GNArea | null> {
  const db = await getDB();
  const area = await db.get('gnAreas', gnId);
  if (!area) return null;

  const profile = getActiveCoordinatorProfile();
  const updated: GNArea = {
    ...area,
    contactedAt: new Date().toISOString(),
    contactedBy: profile
      ? `${profile.fullName} (${profile.badgeNumber})`
      : 'DS Coordinator',
    statusNote:
      statusNote ||
      'Contacted GN Officer via radio/landline relay; mobile tower blackout confirmed.',
  };

  await db.put('gnAreas', updated);
  await appendLedgerRecord({
    actor: getHumanCoordinatorActor(),
    type: 'HUMAN_CONTACTED_GN_OFFICER',
    targetId: updated.id,
    summary: `Coordinator contacted GN officer ${updated.gnOfficerName} for silent area ${updated.name} (${updated.division})`,
    payload: {
      gnId: updated.id,
      gnName: updated.name,
      gnOfficer: updated.gnOfficerName,
      observedLastWindow: updated.observedLastWindow,
      baselinePerHour: updated.baselinePerHour,
      statusNote: updated.statusNote,
    },
  });

  return updated;
}

/**
 * Simulates a monsoon storm burst across the 12 GN areas:
 * Generates elevated report counts in 9 areas while seeding 3 high/medium-hazard GN areas
 * with 0 observed reports (communication blackout), so the Silence Radar flags them live.
 */
export async function simulateStormInSilenceRadar(
  silentAreaIds: string[] = ['GN-01', 'GN-02', 'GN-03']
): Promise<GNArea[]> {
  const db = await getDB();
  const areas = await db.getAll('gnAreas');
  const updatedAreas: GNArea[] = [];

  for (const area of areas) {
    const isSeededSilent = silentAreaIds.includes(area.id);
    let observed = 0;
    let hazard = area.hazardLevel;

    if (isSeededSilent) {
      observed = 0;
      hazard = area.id === 'GN-03' ? 'medium' : 'high';
    } else if (area.hazardLevel === 'low') {
      observed = Math.max(2, Math.round(area.baselinePerHour * area.windowHours));
    } else {
      // Active storm reporting: 1.5x to 2.4x baseline
      observed = Math.round(area.baselinePerHour * area.windowHours * 1.9);
    }

    const updated: GNArea = {
      ...area,
      observedLastWindow: observed,
      hazardLevel: hazard,
      contactedAt: undefined,
      contactedBy: undefined,
      statusNote: undefined,
    };
    updatedAreas.push(updated);
    await db.put('gnAreas', updated);
  }

  return updatedAreas;
}

/**
 * Demo button action: edits a random stored ledger record in IndexedDB WITHOUT rehashing,
 * so clicking "Verify chain" detects the tampering at entry #N.
 */
export async function tamperWithRandomLedgerRecord(): Promise<LedgerEntry | null> {
  const db = await getDB();
  const all = await db.getAll('ledger');
  if (all.length === 0) return null;

  const sorted = all.sort((a, b) => a.seq - b.seq);
  // Pick an entry near the middle of the chain so downstream links are also exposed
  const targetIdx = Math.min(
    sorted.length - 1,
    Math.max(1, Math.floor(sorted.length / 2))
  );
  const target = sorted[targetIdx];

  const tampered: LedgerEntry = {
    ...target,
    summary: `${target.summary} [UNAUTHORIZED EDIT: Urgency downgraded to 1 without rehash]`,
    payload: {
      ...target.payload,
      urgency: 1,
      tamperedDemo: true,
    },
    // Intentionally keep target.hash unchanged so SHA-256 verification fails!
  };

  await db.put('ledger', tampered);
  return tampered;
}
