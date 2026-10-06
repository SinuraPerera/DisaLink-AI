import { LedgerActionType, LedgerEntry } from '../types';

/**
 * Produces deterministic canonical JSON with sorted object keys at every depth
 * so SHA-256 verification is 100% reproducible.
 */
export function canonicalizeJSON(value: unknown): string {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return '[' + value.map((item) => canonicalizeJSON(item)).join(',') + ']';
  }
  const obj = value as Record<string, unknown>;
  const sortedKeys = Object.keys(obj).sort();
  const pairs = sortedKeys
    .filter((k) => obj[k] !== undefined)
    .map((k) => `${JSON.stringify(k)}:${canonicalizeJSON(obj[k])}`);
  return '{' + pairs.join(',') + '}';
}

/**
 * Computes SHA-256 hex digest using the Web Crypto API.
 */
export async function sha256Hex(message: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Computes hash = SHA256(prevHash + canonical JSON of the record without hash).
 */
export async function computeLedgerRecordHash(
  recordWithoutHash: Omit<LedgerEntry, 'hash'>
): Promise<string> {
  const canonicalRecord = canonicalizeJSON({
    id: recordWithoutHash.id,
    seq: recordWithoutHash.seq,
    timestamp: recordWithoutHash.timestamp,
    actor: recordWithoutHash.actor,
    type: recordWithoutHash.type,
    targetId: recordWithoutHash.targetId,
    summary: recordWithoutHash.summary,
    payload: recordWithoutHash.payload,
    prevHash: recordWithoutHash.prevHash,
  });
  return sha256Hex(recordWithoutHash.prevHash + canonicalRecord);
}

export async function buildLedgerEntry(params: {
  seq: number;
  timestamp?: string;
  actor: string;
  type: LedgerActionType;
  targetId: string;
  summary: string;
  payload: Record<string, unknown>;
  prevHash: string;
}): Promise<LedgerEntry> {
  const id = `L-${String(params.seq).padStart(4, '0')}`;
  const timestamp = params.timestamp || new Date().toISOString();
  const baseRecord: Omit<LedgerEntry, 'hash'> = {
    id,
    seq: params.seq,
    timestamp,
    actor: params.actor,
    type: params.type,
    targetId: params.targetId,
    summary: params.summary,
    payload: params.payload,
    prevHash: params.prevHash,
  };
  const hash = await computeLedgerRecordHash(baseRecord);
  return {
    ...baseRecord,
    hash,
  };
}

export interface ChainVerificationResult {
  valid: boolean;
  totalChecked: number;
  tamperedIndex: number | null; // 1-based entry number
  tamperedEntryId: string | null;
  reason?: string;
}

/**
 * Recomputes every hash from Genesis (prevHash = "0") forward and verifies both
 * prevHash links and SHA-256 content hashes.
 */
export async function verifyLedgerChain(
  entries: LedgerEntry[]
): Promise<ChainVerificationResult> {
  const sorted = [...entries].sort((a, b) => a.seq - b.seq);
  let expectedPrevHash = '0';

  for (let i = 0; i < sorted.length; i++) {
    const entry = sorted[i];
    if (entry.prevHash !== expectedPrevHash) {
      return {
        valid: false,
        totalChecked: i + 1,
        tamperedIndex: entry.seq,
        tamperedEntryId: entry.id,
        reason: `Broken chain link at entry #${entry.seq} (${entry.id}): expected prevHash ${expectedPrevHash.slice(0, 12)}..., found ${entry.prevHash.slice(0, 12)}...`,
      };
    }

    const recomputedHash = await computeLedgerRecordHash(entry);
    if (recomputedHash !== entry.hash) {
      return {
        valid: false,
        totalChecked: i + 1,
        tamperedIndex: entry.seq,
        tamperedEntryId: entry.id,
        reason: `Hash mismatch at entry #${entry.seq} (${entry.id}): stored hash ${entry.hash.slice(0, 12)}... does not match recomputed SHA-256 ${recomputedHash.slice(0, 12)}...`,
      };
    }

    expectedPrevHash = entry.hash;
  }

  return {
    valid: true,
    totalChecked: sorted.length,
    tamperedIndex: null,
    tamperedEntryId: null,
  };
}
