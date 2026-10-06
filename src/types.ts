export type UILanguage = 'en' | 'si' | 'ta';

export type ThemeMode = 'light' | 'dark';

export type CoordinatorRole =
  | 'DS Coordinator'
  | 'GN Officer'
  | 'DMC Liaison'
  | 'Field Relief Officer';

export type DutyStatus = 'on_duty' | 'standby' | 'off_duty';

export interface CoordinatorProfile {
  uid: string;
  fullName: string;
  email: string;
  role: CoordinatorRole;
  division: string;
  district: string;
  badgeNumber: string;
  dutyStatus: DutyStatus;
  authMethod: 'google' | 'email' | 'local_registry';
  createdAt: string;
  updatedAt: string;
}

export type ReportLanguage =
  | 'si'
  | 'ta'
  | 'en'
  | 'romanized_si'
  | 'romanized_ta'
  | 'mixed';

export type IncidentType =
  | 'trapped_people'
  | 'road_blocked'
  | 'landslide'
  | 'flooding'
  | 'medical'
  | 'missing_person'
  | 'shelter_need'
  | 'other';

export type SourceType = 'GN officer' | 'Agency' | 'Volunteer' | 'Citizen';

export type IntakeChannel = 'web_form' | 'whatsapp' | 'sms';

export type LocationSource = 'pin' | 'geocoded' | 'text';

export type TriageQueue = 'act_now' | 'verify_fast' | 'watch';

export type HazardLevel = 'low' | 'medium' | 'high';

export interface ExtractionResult {
  language: ReportLanguage;
  incident_type: IncidentType;
  place_text: string;
  place_english: string;
  people_affected: number | null;
  needs: string[];
  urgency: number; // 1-5
  ai_raw_urgency?: number; // original AI urgency before rule layer
  ruleAdjusted?: boolean;
  ruleReason?: string;
  reason: string;
  confidence_in_extraction: number; // 0-1
  english_translation: string;
}

export interface Report {
  id: string; // e.g. R-001
  idempotencyKey: string; // UUID for offline deduplication
  timestamp: string; // ISO string
  rawText: string;
  sourceType: SourceType;
  channel: IntakeChannel;
  lat: number | null;
  lng: number | null;
  hasPin: boolean;
  hasPhoto: boolean;
  photoDataUrl?: string;
  contact?: string;
  locationSource: LocationSource;
  extraction: ExtractionResult;
  humanConfirmed: boolean;
  syncStatus: 'synced' | 'queued_offline';
  caseId?: string;
}

export interface OfflineQueuedReport {
  idempotencyKey: string;
  reportId: string;
  timestamp: string;
  rawText: string;
  sourceType: SourceType;
  channel: IntakeChannel;
  lat: number | null;
  lng: number | null;
  hasPin: boolean;
  hasPhoto: boolean;
  photoDataUrl?: string;
  contact?: string;
}

export interface SyncHistoryEvent {
  id: string; // e.g. SYNC-001
  syncedAt: string; // ISO timestamp of successful synchronization
  processedCount: number; // count of processed reports
  reportIds: string[]; // e.g. ['R-016', 'R-017']
  caseIds: string[]; // e.g. ['C-001', 'C-004']
  idempotencyKeys: string[]; // UUID keys verified
  trigger: 'auto_reconnect' | 'manual_sync';
}

export interface CorroborationTerm {
  reportId: string;
  sourceType: SourceType;
  baseWeight: number;
  pinBonus: number;
  photoBonus: number;
  totalWeight: number; // capped at 0.9
}

export interface IncidentCase {
  id: string; // e.g. C-001
  incident_type: IncidentType;
  place_english: string;
  place_text: string;
  lat: number;
  lng: number;
  locationSource: LocationSource;
  urgency: number; // 1-5
  ruleAdjusted: boolean;
  ruleReason?: string;
  confidence: number; // 0-1 noisy-OR
  queue: TriageQueue;
  reason: string;
  needs: string[];
  people_affected: number | null;
  reportIds: string[];
  languages: ReportLanguage[];
  createdAt: string;
  updatedAt: string;
  status: 'ai_suggestion' | 'confirmed' | 'verified';
  roadBlocked: boolean;
  verified: boolean;
  humanConfirmed: boolean;
}

export interface GNArea {
  id: string; // e.g. GN-01
  name: string;
  division: string; // DS Division
  district: string;
  lat: number;
  lng: number;
  baselinePerHour: number; // normal storm reporting rate per hour
  observedLastWindow: number; // reports in last window
  windowHours: number; // e.g. 2 hours
  hazardLevel: HazardLevel;
  gnOfficerName: string;
  gnOfficerPhone: string;
  contactedAt?: string;
  contactedBy?: string;
  statusNote?: string;
}

export interface GNSilenceEvaluation extends GNArea {
  expectedLambda: number;
  rawPValue: number; // P(X <= observed) under Poisson(lambda)
  hazardMultiplier: number;
  scaledPValue: number;
  isQuiet: boolean;
}

export type LedgerActionType =
  | 'AI_EXTRACTION_SUGGESTED'
  | 'CASE_MERGED_OR_CREATED'
  | 'HUMAN_CONFIRMED_REPORT'
  | 'HUMAN_CONFIRMED_CASE'
  | 'HUMAN_PRIORITY_EDITED'
  | 'HUMAN_MARKED_ROAD_BLOCKED'
  | 'HUMAN_MARKED_VERIFIED'
  | 'HUMAN_CONTACTED_GN_OFFICER'
  | 'OFFLINE_REPORT_QUEUED'
  | 'OFFLINE_REPORT_SYNCED'
  | 'AI_SUMMARY_GENERATED';

export interface LedgerEntry {
  id: string; // e.g. L-0001
  seq: number;
  timestamp: string;
  actor: string; // 'Gemini Flash (AI Suggestion)' | 'DS Coordinator (Human)' | 'System (Rule Engine)'
  type: LedgerActionType;
  targetId: string; // Report ID, Case ID, or GN ID
  summary: string;
  payload: Record<string, unknown>;
  prevHash: string;
  hash: string;
}

export interface SituationSummaryDraft {
  generatedAt: string;
  headline: string;
  confirmedSituation: string[];
  priorityActions: string[];
  uncertaintySection: string[];
  editableMarkdown: string;
}

export interface GoldEvalItem {
  id: string;
  category: 'Sinhala Script' | 'Tamil Script' | 'English' | 'Romanized (Singlish/Tanglish)';
  rawText: string;
  expectedLanguage: ReportLanguage;
  expectedIncidentType: IncidentType;
  expectedPlaceEnglish: string;
  expectedUrgencyMin: number;
  expectedUrgencyMax: number;
  expectedNeeds: string[];
}

export interface EvalRunItemResult {
  item: GoldEvalItem;
  predicted: ExtractionResult;
  languageMatch: boolean;
  incidentTypeMatch: boolean;
  placeMatch: boolean;
  urgencyMatch: boolean;
  latencyMs: number;
}
