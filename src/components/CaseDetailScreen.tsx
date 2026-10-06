import React, { useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { IncidentCase, Report, UILanguage } from '../types';
import {
  UI_TRANSLATIONS,
  localizeCaseReason,
  localizeChannel,
  localizeLocationSource,
  localizeNeed,
  localizePlace,
  localizeSourceType,
  tr,
} from '../lib/i18n';
import { computeNoisyOrConfidence } from '../lib/triage';
import {
  saveCoordinatorRecordToFirestore,
  signInCoordinatorWithGoogle,
} from '../lib/firebase';
import { MapView } from './MapView';
import {
  AlertTriangle,
  ArrowLeft,
  Camera,
  CheckCircle2,
  CloudUpload,
  ExternalLink,
  Loader2,
  MapPin,
  ShieldCheck,
  Sliders,
  TrafficCone,
} from 'lucide-react';

interface CaseDetailScreenProps {
  lang: UILanguage;
  user?: User | null;
  cases: IncidentCase[];
  reports: Report[];
  selectedCaseId: string | null;
  onSelectCase: (caseId: string) => void;
  onBackToDashboard: () => void;
  onCoordinatorAction: (params: {
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
  }) => Promise<void>;
}

export const CaseDetailScreen: React.FC<CaseDetailScreenProps> = ({
  lang,
  user,
  cases,
  reports,
  selectedCaseId,
  onSelectCase,
  onBackToDashboard,
  onCoordinatorAction,
}) => {
  const t = UI_TRANSLATIONS[lang];
  const activeCase =
    cases.find((c) => c.id === selectedCaseId) || cases[0] || null;

  const [editUrgency, setEditUrgency] = useState<number>(
    activeCase?.urgency || 4
  );
  const [editPlace, setEditPlace] = useState<string>(
    activeCase?.place_english || ''
  );
  const [editPin, setEditPin] = useState<{ lat: number; lng: number } | null>(
    activeCase ? { lat: activeCase.lat, lng: activeCase.lng } : null
  );
  const [showPriorityEditor, setShowPriorityEditor] = useState(false);
  const [coordinatorNote, setCoordinatorNote] = useState<string>('');
  const [actionBanner, setActionBanner] = useState<string | null>(null);

  // Inline Google Maps Grounding state for this case
  const [isMapsLoading, setIsMapsLoading] = useState(false);
  const [mapsGroundedData, setMapsGroundedData] = useState<{
    text: string;
    places: Array<{ uri: string; title: string; reviewSnippets: string[] }>;
  } | null>(null);
  const [isSavingCloud, setIsSavingCloud] = useState(false);

  // Keep local state synchronized when the coordinator switches between cases
  useEffect(() => {
    if (activeCase) {
      setEditUrgency(activeCase.urgency);
      setEditPlace(activeCase.place_english);
      setEditPin({ lat: activeCase.lat, lng: activeCase.lng });
      setShowPriorityEditor(false);
      setCoordinatorNote('');
      setActionBanner(null);
      setMapsGroundedData(null);
    }
  }, [activeCase?.id]);

  if (!activeCase) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-8 text-center">
        <p className="text-sm text-slate-600">
          {tr(
            lang,
            'No incident cases available.',
            'සිදුවීම් කිසිවක් නොමැත.',
            'சம்பவங்கள் எதுவும் இல்லை.'
          )}
        </p>
      </div>
    );
  }

  const caseReports = reports
    .filter(
      (r) =>
        r.caseId === activeCase.id || activeCase.reportIds.includes(r.id)
    )
    .sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

  const noisyOr = computeNoisyOrConfidence(caseReports);

  const handleOpenPriorityEdit = () => {
    setEditUrgency(activeCase.urgency);
    setEditPlace(activeCase.place_english);
    setEditPin({ lat: activeCase.lat, lng: activeCase.lng });
    setShowPriorityEditor(!showPriorityEditor);
  };

  const triggerAction = async (
    actionType:
      | 'HUMAN_CONFIRMED_CASE'
      | 'HUMAN_PRIORITY_EDITED'
      | 'HUMAN_MARKED_ROAD_BLOCKED'
      | 'HUMAN_MARKED_VERIFIED',
    extra?: {
      newUrgency?: number;
      newPlaceEnglish?: string;
      newLat?: number;
      newLng?: number;
    }
  ) => {
    await onCoordinatorAction({
      caseId: activeCase.id,
      actionType,
      note: coordinatorNote.trim() || undefined,
      ...extra,
    });
    setShowPriorityEditor(false);
    setCoordinatorNote('');
    setActionBanner(
      tr(
        lang,
        `Decision logged to SHA-256 Ledger (${actionType.replace(/_/g, ' ')}) at ${new Date().toLocaleTimeString()}`,
        `තීරණය SHA-256 ලෙජරයේ (${actionType.replace(/_/g, ' ')}) ${new Date().toLocaleTimeString()} ට සටහන් කරන ලදී`,
        `முடிவு SHA-256 பதிவேட்டில் (${actionType.replace(/_/g, ' ')}) ${new Date().toLocaleTimeString()} மணிக்கு பதிவு செய்யப்பட்டது`
      )
    );
  };

  const handleFindNearbyInfrastructure = async () => {
    setIsMapsLoading(true);
    try {
      const res = await fetch('/api/gemini/maps-grounding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `Nearest hospitals, schools, temples, and emergency relief centres near ${activeCase.place_english}, Sri Lanka`,
          latitude: activeCase.lat,
          longitude: activeCase.lng,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setMapsGroundedData({
        text: data.text,
        places: data.places || [],
      });
    } catch (err: any) {
      setActionBanner(
        `Maps Grounding note: ${err?.message || 'Could not query Maps grounding'}`
      );
    } finally {
      setIsMapsLoading(false);
    }
  };

  const handleSaveCaseToFirestore = async () => {
    setIsSavingCloud(true);
    try {
      let currentUser = user;
      if (!currentUser) {
        currentUser = await signInCoordinatorWithGoogle();
      }
      if (!currentUser) return;

      await saveCoordinatorRecordToFirestore({
        recordType: 'case_snapshot',
        targetId: activeCase.id,
        title: `${activeCase.id} · ${activeCase.place_english} (${activeCase.incident_type.replace('_', ' ')})`,
        summaryText: `${activeCase.reason} | Queue: ${activeCase.queue.toUpperCase()} | Confidence: ${(activeCase.confidence * 100).toFixed(0)}% | Reports: ${activeCase.reportIds.join(', ')}`,
        urgency: activeCase.urgency,
        status: activeCase.verified ? 'verified' : 'active',
      });
      setActionBanner(
        tr(
          lang,
          `Synced case ${activeCase.id} snapshot to Firebase Firestore (/coordinator_records).`,
          `${activeCase.id} සිදුවීම් සටහන Firebase Firestore (/coordinator_records) වෙත සමමුහුර්ත කරන ලදී.`,
          `${activeCase.id} நிகழ்வு பதிவு Firebase Firestore (/coordinator_records) உடன் ஒத்திசைக்கப்பட்டது.`
        )
      );
    } catch (err: any) {
      setActionBanner(
        tr(
          lang,
          `Cloud sync error: ${err?.message || 'Sign in with Google to save to Firestore.'}`,
          `ක්ලවුඩ් සමමුහුර්ත දෝෂය: ${err?.message || 'Firestore වෙත සුරැකීමට Google ගිණුමෙන් පිවිසෙන්න.'}`,
          `கிளவுட் ஒத்திசைவு பிழை: ${err?.message || 'Firestore இல் சேமிக்க Google கணக்கில் உள்நுழையவும்.'}`
        )
      );
    } finally {
      setIsSavingCloud(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      {/* Top Navigation & Case Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBackToDashboard}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-[#0B2A6F]"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>
            {tr(
              lang,
              'Back to Triage Queues & Map',
              'ප්‍රමුඛතා පෝලිම් සහ සිතියම වෙත ආපසු',
              'வரிசைகள் மற்றும் வரைபடத்திற்குத் திரும்பு'
            )}
          </span>
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">
            {tr(lang, 'Inspect Case:', 'සිදුවීම පරීක්ෂා කරන්න:', 'நிகழ்வை ஆய்வு செய்:')}
          </span>
          <select
            value={activeCase.id}
            onChange={(e) => {
              onSelectCase(e.target.value);
              setActionBanner(null);
              setShowPriorityEditor(false);
              setMapsGroundedData(null);
            }}
            className="rounded-md border border-slate-300 bg-white px-2.5 py-1.5 font-mono text-xs font-medium text-slate-900 focus:border-[#0B2A6F] focus:outline-none"
          >
            {cases.map((c) => (
              <option key={c.id} value={c.id}>
                {c.id} — {localizePlace(c.place_english, lang)} (
                {t.queues[c.queue]})
              </option>
            ))}
          </select>
        </div>
      </div>

      {actionBanner && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-medium text-emerald-900">
          <CheckCircle2 className="h-4 w-4 text-emerald-700 shrink-0" />
          <span>{actionBanner}</span>
        </div>
      )}

      {/* Case Summary & Human Decision Controls */}
      <div className="rounded-lg border border-slate-200 bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 font-mono">
              <span className="font-semibold text-slate-900">
                {activeCase.id}
              </span>
              <span aria-hidden="true">·</span>
              <span
                className={`font-sans font-semibold ${
                  activeCase.queue === 'act_now'
                    ? 'text-red-600'
                    : activeCase.queue === 'verify_fast'
                    ? 'text-amber-600'
                    : 'text-slate-600'
                }`}
              >
                {tr(lang, 'Queue:', 'පෝලිම:', 'வரிசை:')} {t.queues[activeCase.queue]}
              </span>
              <span aria-hidden="true">·</span>
              <span className="font-sans">
                {t.incidentTypes[activeCase.incident_type]}
              </span>
              {activeCase.ruleAdjusted && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="font-sans font-semibold text-red-700">
                    {tr(
                      lang,
                      'Rule-adjusted (Urgency ≥ 4)',
                      'ආරක්ෂක රීතියෙන් ඉහළ දැමූ (හදිසිභාවය ≥ 4)',
                      'பாதுகாப்பு விதியால் உயர்த்தப்பட்டது (அவசரம் ≥ 4)'
                    )}
                  </span>
                </>
              )}
            </div>

            <h1 className="text-xl font-bold text-slate-900">
              {localizePlace(activeCase.place_english, lang)}
            </h1>
            <p className="text-sm text-slate-700">
              {localizeCaseReason(activeCase.reason, lang)}
            </p>
            {activeCase.ruleReason && (
              <p className="text-xs font-medium text-red-700">
                {localizeCaseReason(activeCase.ruleReason, lang)}
              </p>
            )}
          </div>

          {/* Separate Urgency and Confidence Readouts */}
          <div className="flex items-center gap-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
            <div>
              <div className="text-[11px] text-slate-500">
                {tr(lang, 'Urgency Score', 'හදිසිභාවය', 'அவசர நிலை')}
              </div>
              <div className="font-mono text-xl font-bold text-slate-900 tabular-nums">
                {activeCase.urgency} / 5
              </div>
            </div>
            <div className="h-8 w-px bg-slate-200" />
            <div>
              <div className="text-[11px] text-slate-500">
                {tr(
                  lang,
                  'Noisy-OR Confidence',
                  'Noisy-OR විශ්වාසනීයත්වය',
                  'Noisy-OR நம்பகத்தன்மை'
                )}
              </div>
              <div className="font-mono text-xl font-bold text-[#0B2A6F] tabular-nums">
                {(activeCase.confidence * 100).toFixed(1)}%
              </div>
            </div>
          </div>
        </div>

        {/* Status Metadata Row */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
          <div className="flex flex-wrap items-center gap-2">
            <span>
              {tr(lang, 'Decision State:', 'තීරණ තත්ත්වය:', 'முடிவு நிலை:')}{' '}
              <strong
                className={
                  activeCase.humanConfirmed
                    ? 'text-[#0B2A6F]'
                    : 'text-amber-700'
                }
              >
                {activeCase.verified
                  ? tr(
                      lang,
                      'Field Verified (Human)',
                      'ක්ෂේත්‍ර තහවුරු කළ (මිනිස්)',
                      'கள சரிபார்ப்பு (மனிதர்)'
                    )
                  : activeCase.humanConfirmed
                  ? tr(
                      lang,
                      'Human Confirmed',
                      'මිනිස් තහවුරු කිරීම',
                      'மனிதர் உறுதிப்படுத்தியது'
                    )
                  : tr(
                      lang,
                      'AI Suggestion (Awaiting Coordinator)',
                      'AI යෝජනාව (සම්බන්ධීකාරක අනුමැතිය අපේක්ෂාවෙන්)',
                      'AI பரிந்துரை (ஒருங்கிணைப்பாளர் ஒப்புதலுக்காக)'
                    )}
              </strong>
            </span>
            <span aria-hidden="true">·</span>
            <span>
              {tr(lang, 'Road Status:', 'මාර්ග තත්ත්වය:', 'சாலை நிலை:')}{' '}
              <strong
                className={
                  activeCase.roadBlocked ? 'text-red-700' : 'text-slate-800'
                }
              >
                {activeCase.roadBlocked
                  ? tr(lang, 'Road Blocked', 'මාර්ගය අවහිරයි', 'சாலை தடை')
                  : tr(
                      lang,
                      'Passable / Normal',
                      'ගමන් කළ හැක / සාමාන්‍යයි',
                      'செல்லக்கூடியது / சாதாரண'
                    )}
              </strong>
            </span>
            <span aria-hidden="true">·</span>
            <span>
              {tr(lang, 'Location Source:', 'ස්ථාන මූලාශ්‍රය:', 'இருப்பிட ஆதாரம்:')}{' '}
              <strong>
                {localizeLocationSource(activeCase.locationSource, lang)}
              </strong>{' '}
              (
              <span className="font-mono">
                {activeCase.lat.toFixed(4)}, {activeCase.lng.toFixed(4)}
              </span>
              )
            </span>
            {activeCase.people_affected !== null && (
              <>
                <span aria-hidden="true">·</span>
                <span className="font-mono">
                  {tr(lang, 'Affected:', 'බලපෑමට ලක්වූ පිරිස:', 'பாதிக்கப்பட்டோர்:')}{' '}
                  <strong>~{activeCase.people_affected}</strong>
                </span>
              </>
            )}
          </div>
          <div>
            {tr(lang, 'Needs:', 'අවශ්‍යතා:', 'தேவைகள்:')}{' '}
            <strong className="text-slate-800">
              {activeCase.needs.length > 0
                ? activeCase.needs.map((n) => localizeNeed(n, lang)).join(', ')
                : tr(lang, 'None specified', 'සඳහන් කර නැත', 'குறிப்பிடப்படவில்லை')}
            </strong>
          </div>
        </div>

        {/* Coordinator Note & Action Buttons (Every button writes to the Decision Ledger) */}
        <div className="mt-4 space-y-3 border-t border-slate-100 pt-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <label className="text-xs font-medium text-slate-600 whitespace-nowrap">
              {tr(
                lang,
                'Coordinator Ledger Note (Optional):',
                'සම්බන්ධීකාරක ලෙජර සටහන (විකල්ප):',
                'ஒருங்கிணைப்பாளர் பதிவேட்டு குறிப்பு (விருப்பம்):'
              )}
            </label>
            <input
              type="text"
              value={coordinatorNote}
              onChange={(e) => setCoordinatorNote(e.target.value)}
              placeholder={tr(
                lang,
                'e.g., Verified via GN officer call; road clearance team notified through District EOC...',
                'උදා: ග්‍රාම නිලධාරී ඇමතුමෙන් තහවුරු කරන ලදී; මාර්ග පිරිසිදු කිරීමේ කණ්ඩායම දැනුවත් කරන ලදී...',
                'எ.கா., கிராம அலுவலர் அழைப்பு மூலம் உறுதிப்படுத்தப்பட்டது; சாலை சீரமைப்பு குழுவிற்கு அறிவிக்கப்பட்டது...'
              )}
              className="flex-1 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#0B2A6F] focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => triggerAction('HUMAN_CONFIRMED_CASE')}
              className="flex items-center gap-1.5 rounded-md bg-[#0B2A6F] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#082054] transition-colors whitespace-nowrap"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>
                {activeCase.humanConfirmed
                  ? tr(
                      lang,
                      'Re-Confirm Case in Ledger',
                      'ලෙජරයේ සිදුවීම නැවත තහවුරු කරන්න',
                      'பதிவேட்டில் நிகழ்வை மீண்டும் உறுதிப்படுத்து'
                    )
                  : tr(
                      lang,
                      'Confirm AI Suggestion',
                      'AI යෝජනාව තහවුරු කරන්න',
                      'AI பரிந்துரையை உறுதிப்படுத்து'
                    )}
              </span>
            </button>

            <button
              type="button"
              onClick={handleOpenPriorityEdit}
              className="flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3.5 py-2 text-xs font-medium text-slate-800 hover:bg-slate-50 transition-colors whitespace-nowrap"
            >
              <Sliders className="h-3.5 w-3.5 text-[#0B2A6F]" />
              <span>
                {tr(
                  lang,
                  'Edit Priority / Location Pin',
                  'ප්‍රමුඛතාවය / ස්ථානය වෙනස් කරන්න',
                  'முன்னுரிமை / இருப்பிடத்தை திருத்து'
                )}
              </span>
            </button>

            <button
              type="button"
              onClick={() => triggerAction('HUMAN_MARKED_ROAD_BLOCKED')}
              className={`flex items-center gap-1.5 rounded-md border px-3.5 py-2 text-xs font-medium transition-colors whitespace-nowrap ${
                activeCase.roadBlocked
                  ? 'border-red-300 bg-red-50 text-red-800 hover:bg-red-100'
                  : 'border-slate-300 bg-white text-slate-800 hover:bg-slate-50'
              }`}
            >
              <TrafficCone className="h-3.5 w-3.5 text-red-600" />
              <span>
                {activeCase.roadBlocked
                  ? tr(
                      lang,
                      'Unmark "Road Blocked"',
                      '"මාර්ගය අවහිරයි" ඉවත් කරන්න',
                      '"சாலை தடை" நீக்கு'
                    )
                  : tr(
                      lang,
                      'Mark "Road Blocked"',
                      '"මාර්ගය අවහිරයි" ලෙස ලකුණු කරන්න',
                      '"சாலை தடை" எனக் குறி'
                    )}
              </span>
            </button>

            <button
              type="button"
              onClick={() => triggerAction('HUMAN_MARKED_VERIFIED')}
              className={`flex items-center gap-1.5 rounded-md border px-3.5 py-2 text-xs font-medium transition-colors whitespace-nowrap ${
                activeCase.verified
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                  : 'border-slate-300 bg-white text-slate-800 hover:bg-slate-50'
              }`}
            >
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              <span>
                {activeCase.verified
                  ? tr(
                      lang,
                      'Marked "Verified" (Toggle)',
                      '"තහවුරු කළ" (වෙනස් කරන්න)',
                      '"சரிபார்க்கப்பட்டது" (மாற்று)'
                    )
                  : tr(
                      lang,
                      'Mark "Verified"',
                      '"තහවුරු කළ" ලෙස ලකුණු කරන්න',
                      '"சரிபார்க்கப்பட்டது" எனக் குறி'
                    )}
              </span>
            </button>

            <button
              type="button"
              onClick={handleFindNearbyInfrastructure}
              disabled={isMapsLoading}
              className="flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-800 hover:bg-slate-50 transition-colors whitespace-nowrap"
            >
              {isMapsLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-[#0B2A6F]" />
              ) : (
                <MapPin className="h-3.5 w-3.5 text-[#0B2A6F]" />
              )}
              <span>
                {tr(
                  lang,
                  'Nearby Shelters & Hospitals (Maps)',
                  'ආසන්න රෝහල් සහ සහන මධ්‍යස්ථාන (සිතියම්)',
                  'அருகிலுள்ள மருத்துவமனைகள் & முகாம்கள்'
                )}
              </span>
            </button>

            <button
              type="button"
              onClick={handleSaveCaseToFirestore}
              disabled={isSavingCloud}
              className="flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-800 hover:bg-slate-50 transition-colors whitespace-nowrap"
            >
              <CloudUpload className="h-3.5 w-3.5 text-[#0B2A6F]" />
              <span>
                {isSavingCloud
                  ? tr(lang, 'Saving...', 'සුරකිමින්...', 'சேமிக்கிறது...')
                  : tr(
                      lang,
                      'Sync Snapshot to Cloud',
                      'ක්ලවුඩ් වෙත සමමුහුර්ත කරන්න',
                      'கிளவுட்டில் ஒத்திசை'
                    )}
              </span>
            </button>
          </div>
        </div>

        {/* Inline Google Maps Grounding Result for Case */}
        {mapsGroundedData && (
          <div className="mt-4 space-y-2.5 rounded-md border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center justify-between">
              <div className="font-mono text-xs font-semibold text-[#0B2A6F]">
                {tr(
                  lang,
                  'GOOGLE MAPS GROUNDING · NEARBY CRITICAL FACILITIES',
                  'GOOGLE සිතියම් පදනම · ආසන්න අත්‍යවශ්‍ය මධ්‍යස්ථාන',
                  'கூகிள் வரைபட ஆதாரம் · அருகிலுள்ள முக்கிய மையங்கள்'
                )}
              </div>
              <button
                type="button"
                onClick={() => setMapsGroundedData(null)}
                className="text-xs text-slate-500 hover:text-slate-800"
              >
                {tr(lang, 'Close', 'වසන්න', 'மூடு')}
              </button>
            </div>
            <p className="text-xs leading-relaxed text-slate-800 whitespace-pre-wrap">
              {mapsGroundedData.text}
            </p>
            {mapsGroundedData.places.length > 0 && (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 pt-1">
                {mapsGroundedData.places.map((pl, idx) => (
                  <a
                    key={idx}
                    href={pl.uri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between gap-2 rounded border border-slate-200 bg-white p-2 text-xs font-semibold text-[#0B2A6F] hover:border-[#0B2A6F]"
                  >
                    <span className="truncate">{pl.title}</span>
                    <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                  </a>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Inline Priority, Place & Map Coordinate Editor */}
        {showPriorityEditor && (
          <div className="mt-4 space-y-3 rounded-md border border-slate-200 bg-slate-50 p-4">
            <h4 className="text-xs font-semibold text-slate-800">
              {tr(
                lang,
                'Coordinator Override — Edit Priority, Standardized Place & Map Coordinates',
                'සම්බන්ධීකාරක සංශෝධනය — ප්‍රමුඛතාවය, ස්ථාන නාමය සහ සිතියම් ඛණ්ඩාංක වෙනස් කරන්න',
                'ஒருங்கிணைப்பாளர் மாற்றம் — முன்னுரிமை, இடத்தின் பெயர் மற்றும் வரைபட ஆயங்களை திருத்து'
              )}
            </h4>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <label className="block text-xs font-medium text-slate-700">
                  {tr(lang, 'Urgency Score (1–5)', 'හදිසිභාවය (1–5)', 'அவசர நிலை (1–5)')}
                </label>
                <select
                  value={editUrgency}
                  onChange={(e) => setEditUrgency(Number(e.target.value))}
                  className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 font-mono text-xs text-slate-900"
                >
                  <option value={5}>
                    {tr(
                      lang,
                      '5 — Immediate Life Threat',
                      '5 — ක්ෂණික ජීවිත අවදානම',
                      '5 — உடனடி உயிர் ஆபத்து'
                    )}
                  </option>
                  <option value={4}>
                    {tr(lang, '4 — High Urgency', '4 — ඉහළ හදිසිභාවය', '4 — அதிக அவசரம்')}
                  </option>
                  <option value={3}>
                    {tr(lang, '3 — Moderate', '3 — මධ්‍යම', '3 — மிதமான')}
                  </option>
                  <option value={2}>
                    {tr(lang, '2 — Low / Minor', '2 — අඩු / සුළු', '2 — குறைந்த / சிறிய')}
                  </option>
                  <option value={1}>
                    {tr(lang, '1 — Informational', '1 — තොරතුරු පමණි', '1 — தகவல் மட்டும்')}
                  </option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700">
                  {tr(
                    lang,
                    'Standardized Place Name',
                    'සම්මත ස්ථාන නාමය',
                    'தரப்படுத்தப்பட்ட இடத்தின் பெயர்'
                  )}
                </label>
                <input
                  type="text"
                  value={editPlace}
                  onChange={(e) => setEditPlace(e.target.value)}
                  className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700">
                  {tr(
                    lang,
                    'GPS Pin (Click map below to refine)',
                    'GPS ලක්ෂ්‍යය (වෙනස් කිරීමට පහත සිතියම ක්ලික් කරන්න)',
                    'GPS புள்ளி (மாற்ற கீழே உள்ள வரைபடத்தை கிளிக் செய்க)'
                  )}
                </label>
                <div className="mt-1 rounded-md border border-slate-300 bg-white px-3 py-1.5 font-mono text-xs text-slate-800">
                  {editPin
                    ? `${editPin.lat.toFixed(4)}, ${editPin.lng.toFixed(4)}`
                    : `${activeCase.lat.toFixed(4)}, ${activeCase.lng.toFixed(4)}`}
                </div>
              </div>
            </div>

            <MapView
              lang={lang}
              pinPickerMode
              pickedPin={
                editPin || { lat: activeCase.lat, lng: activeCase.lng }
              }
              onPickPin={(coords) => setEditPin(coords)}
              heightClass="h-[220px]"
            />

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowPriorityEditor(false)}
                className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-700"
              >
                {tr(lang, 'Cancel', 'අවලංගු කරන්න', 'ரத்து செய்')}
              </button>
              <button
                type="button"
                onClick={() =>
                  triggerAction('HUMAN_PRIORITY_EDITED', {
                    newUrgency: editUrgency,
                    newPlaceEnglish: editPlace,
                    newLat: editPin?.lat,
                    newLng: editPin?.lng,
                  })
                }
                className="rounded-md bg-[#0B2A6F] px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-[#082054]"
              >
                {tr(
                  lang,
                  'Save Override to Ledger',
                  'සංශෝධනය ලෙජරයේ සුරකින්න',
                  'மாற்றத்தை பதிவேட்டில் சேமி'
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Corroboration Breakdown (Noisy-OR Formula and Terms) */}
      <div className="rounded-lg border border-slate-200 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              {tr(
                lang,
                'Corroboration Breakdown (Transparent Noisy-OR Formula)',
                'සත්‍යාපන විශ්ලේෂණය (විනිවිද පෙනෙන Noisy-OR සූත්‍රය)',
                'உறுதிப்படுத்தல் பகுப்பாய்வு (வெளிப்படையான Noisy-OR சூத்திரம்)'
              )}
            </h2>
            <p className="text-xs text-slate-500">
              {tr(
                lang,
                'Weights: GN officer 0.60 · Agency 0.60 · Volunteer 0.40 · Citizen 0.25 · +0.10 GPS Pin · +0.10 Photo (capped at 0.90 per report)',
                'බර තැබීම්: ග්‍රාම නිලධාරී 0.60 · ආයතනය 0.60 · ස්වේච්ඡා 0.40 · පුරවැසි 0.25 · +0.10 GPS · +0.10 ඡායාරූප (උපරිම 0.90)',
                'எடைகள்: கிராம அலுவலர் 0.60 · நிறுவனம் 0.60 · தன்னார்வலர் 0.40 · குடிமகன் 0.25 · +0.10 GPS · +0.10 புகைப்படம் (அதிகபட்சம் 0.90)'
              )}
            </p>
          </div>
          <div className="rounded-md bg-slate-100 px-3 py-1.5 font-mono text-xs font-semibold text-slate-900">
            C = 1 − Π(1 − w_i) = 1 − {noisyOr.productComplement.toFixed(4)} ={' '}
            {noisyOr.confidence.toFixed(3)} (
            {(noisyOr.confidence * 100).toFixed(1)}%)
          </div>
        </div>

        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="py-2 pr-3 font-medium">
                  {tr(lang, 'Report ID', 'වාර්තා අංකය', 'அறிக்கை எண்')}
                </th>
                <th className="py-2 px-3 font-medium">
                  {tr(lang, 'Source Type', 'මූලාශ්‍ර වර්ගය', 'ஆதார வகை')}
                </th>
                <th className="py-2 px-3 text-right font-medium">
                  {tr(lang, 'Base Weight', 'මූලික බර', 'அடிப்படை எடை')}
                </th>
                <th className="py-2 px-3 text-right font-medium">
                  {tr(lang, 'Pin Bonus', 'GPS ප්‍රසාද', 'GPS கூடுதல்')}
                </th>
                <th className="py-2 px-3 text-right font-medium">
                  {tr(lang, 'Photo Bonus', 'ඡායාරූප ප්‍රසාද', 'புகைப்பட கூடுதல்')}
                </th>
                <th className="py-2 px-3 text-right font-medium">
                  w_i (≤ 0.9)
                </th>
                <th className="py-2 pl-3 text-right font-medium">
                  {tr(lang, 'Complement (1 − w_i)', 'අනුපූරකය (1 − w_i)', 'நிரப்பு (1 − w_i)')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono tabular-nums">
              {noisyOr.terms.map((term) => (
                <tr key={term.reportId} className="hover:bg-slate-50">
                  <td className="py-2 pr-3 font-semibold text-slate-900">
                    {term.reportId}
                  </td>
                  <td className="py-2 px-3 font-sans text-slate-700">
                    {localizeSourceType(term.sourceType, lang)}
                  </td>
                  <td className="py-2 px-3 text-right text-slate-700">
                    {term.baseWeight.toFixed(2)}
                  </td>
                  <td className="py-2 px-3 text-right text-slate-700">
                    +{term.pinBonus.toFixed(2)}
                  </td>
                  <td className="py-2 px-3 text-right text-slate-700">
                    +{term.photoBonus.toFixed(2)}
                  </td>
                  <td className="py-2 px-3 text-right font-semibold text-[#0B2A6F]">
                    {term.totalWeight.toFixed(2)}
                  </td>
                  <td className="py-2 pl-3 text-right text-slate-600">
                    {(1 - term.totalWeight).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* All Merged Reports for This Case */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">
            {tr(
              lang,
              `Merged Corroborating Reports (${caseReports.length})`,
              `ඒකාබද්ධ කළ සත්‍යාපන වාර්තා (${caseReports.length})`,
              `இணைக்கப்பட்ட உறுதிப்படுத்தும் அறிக்கைகள் (${caseReports.length})`
            )}
          </h2>
          <span className="text-xs text-slate-500">
            {tr(
              lang,
              'Merged across Sinhala, Tamil, English & Romanized text within 500 m / fuzzy place & 3h window',
              'මීටර් 500 / ආසන්න ස්ථාන සහ පැය 3ක කාල රාමුව තුළ සිංහල, දෙමළ, ඉංග්‍රීසි සහ රෝමානුකරණය කළ වාර්තා ඒකාබද්ධ කර ඇත',
              '500 மீ / அருகிலுள்ள இடம் மற்றும் 3 மணி நேர இடைவெளியில் சிங்களம், தமிழ், ஆங்கிலம் & ரோமனைஸ் அறிக்கைகள் இணைக்கப்பட்டன'
            )}
          </span>
        </div>

        <div className="space-y-3">
          {caseReports.map((r) => (
            <div
              key={r.id}
              className="rounded-lg border border-slate-200 bg-white p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                <div className="flex flex-wrap items-center gap-2 font-mono">
                  <span className="font-semibold text-slate-900">{r.id}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-sans font-semibold text-[#0B2A6F]">
                    {tr(lang, 'Source:', 'මූලාශ්‍රය:', 'ஆதாரம்:')}{' '}
                    {localizeSourceType(r.sourceType, lang)}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="font-sans">
                    {tr(lang, 'Channel:', 'නාලිකාව:', 'வழி:')}{' '}
                    {localizeChannel(r.channel, lang)}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>
                    {tr(lang, 'Lang:', 'භාෂාව:', 'மொழி:')}{' '}
                    {r.extraction.language.toUpperCase()}
                  </span>
                </div>
                <div className="flex items-center gap-3 font-mono text-[11px]">
                  {r.hasPin && (
                    <span className="inline-flex items-center gap-1 text-slate-700">
                      <MapPin className="h-3 w-3 text-[#0B2A6F]" />{' '}
                      {tr(lang, 'GPS Pin', 'GPS ලක්ෂ්‍යය', 'GPS புள்ளி')}
                    </span>
                  )}
                  {r.hasPhoto && (
                    <span className="inline-flex items-center gap-1 text-slate-700">
                      <Camera className="h-3 w-3 text-[#0B2A6F]" />{' '}
                      {tr(lang, 'Photo', 'ඡායාරූපය', 'புகைப்படம்')}
                    </span>
                  )}
                  <span>{new Date(r.timestamp).toLocaleTimeString()}</span>
                </div>
              </div>

              <div className="mt-2.5 grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="rounded-md bg-slate-50 p-3">
                  <div className="text-[11px] font-medium text-slate-500">
                    {tr(
                      lang,
                      `Original Report Text (${r.extraction.language})`,
                      `මුල් වාර්තා පෙළ (${r.extraction.language})`,
                      `அசல் அறிக்கை உரை (${r.extraction.language})`
                    )}
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-slate-900">
                    {r.rawText}
                  </p>
                </div>

                <div className="rounded-md bg-blue-50/40 p-3">
                  <div className="text-[11px] font-medium text-slate-500">
                    {tr(
                      lang,
                      'AI Standardized Summary & Extraction',
                      'AI සම්මත පරිවර්තනය සහ ව්‍යුහගත දත්ත',
                      'AI தரப்படுத்தப்பட்ட சுருக்கம் & பிரித்தெடுப்பு'
                    )}
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-slate-800">
                    {localizeCaseReason(r.extraction.english_translation, lang)}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-slate-600 font-mono">
                    <span>
                      {tr(lang, 'Place:', 'ස්ථානය:', 'இடம்:')}{' '}
                      {localizePlace(r.extraction.place_english, lang)}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>
                      {tr(lang, 'Urgency:', 'හදිසිභාවය:', 'அவசரம்:')}{' '}
                      {r.extraction.urgency}/5
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>
                      {tr(lang, 'AI Conf:', 'AI විශ්වාසය:', 'AI நம்பகத்தன்மை:')}{' '}
                      {(r.extraction.confidence_in_extraction * 100).toFixed(0)}
                      %
                    </span>
                  </div>
                </div>
              </div>

              {r.photoDataUrl && (
                <div className="mt-2.5 flex items-center gap-3 rounded-md border border-slate-200 bg-slate-50 p-2.5">
                  <img
                    src={r.photoDataUrl}
                    alt={`Attached field evidence for ${r.id}`}
                    className="h-16 w-24 rounded object-cover border border-slate-300 shrink-0"
                  />
                  <div className="text-xs text-slate-600">
                    <div className="font-semibold text-slate-800">
                      {tr(
                        lang,
                        `Attached Field Photo Evidence (${r.id})`,
                        `අමුණා ඇති ක්ෂේත්‍ර ඡායාරූප සාක්ෂිය (${r.id})`,
                        `இணைக்கப்பட்ட கள புகைப்பட ஆதாரம் (${r.id})`
                      )}
                    </div>
                    <div className="font-mono text-[11px] text-slate-500">
                      {tr(
                        lang,
                        'Contributes +0.10 to Noisy-OR source weight w_i',
                        'Noisy-OR මූලාශ්‍ර බර w_i සඳහා +0.10 ක දායකත්වයක් ලබා දෙයි',
                        'Noisy-OR ஆதார எடை w_i க்கு +0.10 பங்களிக்கிறது'
                      )}
                    </div>
                  </div>
                </div>
              )}

              {r.extraction.ruleAdjusted && (
                <div className="mt-2 flex items-center gap-1.5 text-xs font-medium text-red-700">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  <span>
                    {r.extraction.ruleReason
                      ? localizeCaseReason(r.extraction.ruleReason, lang)
                      : ''}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
