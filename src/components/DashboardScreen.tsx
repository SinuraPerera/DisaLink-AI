import React, { useState } from 'react';
import {
  GNSilenceEvaluation,
  IncidentCase,
  IncidentType,
  OfflineQueuedReport,
  Report,
  TriageQueue,
  UILanguage,
} from '../types';
import {
  UI_TRANSLATIONS,
  localizeCaseReason,
  localizeLocationSource,
  localizeNeed,
  localizePlace,
  tr,
} from '../lib/i18n';
import { MapView } from './MapView';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Download,
  Eye,
  ListFilter,
  Map as MapIcon,
  MapPin,
  Radio,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';

interface DashboardScreenProps {
  lang: UILanguage;
  reports: Report[];
  cases: IncidentCase[];
  quietAreas: GNSilenceEvaluation[];
  offlineQueue: OfflineQueuedReport[];
  ledgerIntact: boolean;
  tamperedEntryNumber: number | null;
  onSelectCase: (caseId: string) => void;
  onQuickConfirmCase: (caseId: string) => Promise<void>;
  onNavigateToSilenceRadar: () => void;
  onNavigateToLedger: () => void;
  onNavigateToSubmit: () => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  lang,
  reports,
  cases,
  quietAreas,
  offlineQueue,
  ledgerIntact,
  tamperedEntryNumber,
  onSelectCase,
  onQuickConfirmCase,
  onNavigateToSilenceRadar,
  onNavigateToLedger,
  onNavigateToSubmit,
}) => {
  const t = UI_TRANSLATIONS[lang];
  const [activeQueueFilter, setActiveQueueFilter] = useState<
    'all' | TriageQueue
  >('all');
  const [incidentTypeFilter, setIncidentTypeFilter] = useState<
    'all' | IncidentType
  >('all');
  const [roadBlockedOnly, setRoadBlockedOnly] = useState(false);
  const [unconfirmedOnly, setUnconfirmedOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileViewMode, setMobileViewMode] = useState<
    'split' | 'queues' | 'map'
  >('split');

  const flaggedQuietAreas = quietAreas.filter((g) => g.isQuiet);

  const filteredCases = cases.filter((c) => {
    if (activeQueueFilter !== 'all' && c.queue !== activeQueueFilter) {
      return false;
    }
    if (
      incidentTypeFilter !== 'all' &&
      c.incident_type !== incidentTypeFilter
    ) {
      return false;
    }
    if (roadBlockedOnly && !c.roadBlocked) {
      return false;
    }
    if (unconfirmedOnly && c.humanConfirmed) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        c.place_english.toLowerCase().includes(q) ||
        c.place_text.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q) ||
        c.reason.toLowerCase().includes(q) ||
        c.incident_type.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const actNowCases = filteredCases.filter((c) => c.queue === 'act_now');
  const verifyFastCases = filteredCases.filter(
    (c) => c.queue === 'verify_fast'
  );
  const watchCases = filteredCases.filter((c) => c.queue === 'watch');

  const handleExportCSV = () => {
    const headers = [
      'CaseID',
      'Queue',
      'IncidentType',
      'Place',
      'Urgency',
      'Confidence',
      'PeopleAffected',
      'RoadBlocked',
      'HumanConfirmed',
      'Verified',
      'LocationSource',
      'Lat',
      'Lng',
      'ReportsCount',
      'Reason',
    ];
    const rows = filteredCases.map((c) => [
      c.id,
      c.queue,
      c.incident_type,
      `"${c.place_english.replace(/"/g, '""')}"`,
      c.urgency,
      c.confidence.toFixed(3),
      c.people_affected ?? '',
      c.roadBlocked ? 'YES' : 'NO',
      c.humanConfirmed ? 'YES' : 'NO',
      c.verified ? 'YES' : 'NO',
      c.locationSource,
      c.lat,
      c.lng,
      c.reportIds.length,
      `"${c.reason.replace(/"/g, '""')}"`,
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `disalink-triage-cases-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const renderCaseCard = (c: IncidentCase) => {
    const borderAccent =
      c.queue === 'act_now'
        ? 'border-l-4 border-l-red-600'
        : c.queue === 'verify_fast'
        ? 'border-l-4 border-l-amber-600'
        : 'border-l-4 border-l-slate-500';

    const urgencyBarColor =
      c.urgency >= 5
        ? 'bg-red-600'
        : c.urgency === 4
        ? 'bg-amber-600'
        : 'bg-slate-600';

    const confidenceBarColor =
      c.confidence >= 0.7
        ? 'bg-[#0B2A6F]'
        : c.confidence >= 0.5
        ? 'bg-blue-600'
        : 'bg-amber-600';

    return (
      <div
        key={c.id}
        onClick={() => onSelectCase(c.id)}
        className={`group cursor-pointer rounded-md border border-slate-200 bg-white p-3.5 transition-colors hover:border-[#0B2A6F] ${borderAccent}`}
      >
        {/* Top metadata row — unboxed clean text with · separators */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
          <div className="flex flex-wrap items-center gap-1.5 font-mono">
            <span className="font-semibold text-slate-800">{c.id}</span>
            <span aria-hidden="true">·</span>
            <span className="font-sans font-medium text-slate-700">
              {t.incidentTypes[c.incident_type]}
            </span>
            {c.roadBlocked && (
              <>
                <span aria-hidden="true">·</span>
                <span className="font-sans font-semibold text-red-700">
                  {t.status.roadBlocked}
                </span>
              </>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-[11px]">
            {c.verified ? (
              <span className="font-semibold text-emerald-700">
                {t.status.verified}
              </span>
            ) : c.humanConfirmed ? (
              <span className="font-medium text-[#0B2A6F]">
                {t.status.humanConfirmed}
              </span>
            ) : (
              <span className="font-medium text-amber-700">
                {t.status.aiSuggestion}
              </span>
            )}
            {c.ruleAdjusted && (
              <>
                <span aria-hidden="true">·</span>
                <span className="font-medium text-red-700">
                  {t.status.ruleAdjusted}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Primary Place Title */}
        <div className="mt-1 flex items-baseline justify-between gap-2">
          <h4 className="text-sm font-semibold text-slate-900 group-hover:text-[#0B2A6F]">
            {localizePlace(c.place_english, lang)}
          </h4>
          {c.people_affected !== null && (
            <span className="font-mono text-xs text-slate-600 tabular-nums whitespace-nowrap">
              ~{c.people_affected}{' '}
              {tr(lang, 'affected', 'බලපෑමට ලක්වූ', 'பாதிக்கப்பட்டோர்')}
            </span>
          )}
        </div>

        {/* Two Separate Meters: Urgency Score and Confidence Score */}
        <div className="mt-2.5 grid grid-cols-2 gap-3 border-y border-slate-100 py-2">
          <div>
            <div className="flex items-center justify-between text-[11px] text-slate-600">
              <span>{tr(lang, 'Urgency Score', 'හදිසි බව', 'அவசர நிலை')}</span>
              <span className="font-mono font-semibold text-slate-900 tabular-nums">
                {c.urgency} / 5
              </span>
            </div>
            <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full ${urgencyBarColor}`}
                style={{ width: `${(c.urgency / 5) * 100}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between text-[11px] text-slate-600">
              <span>
                {tr(
                  lang,
                  'Confidence (Noisy-OR)',
                  'විශ්වාසය (Noisy-OR)',
                  'நம்பகத்தன்மை (Noisy-OR)'
                )}
              </span>
              <span className="font-mono font-semibold text-slate-900 tabular-nums">
                {(c.confidence * 100).toFixed(0)}%
              </span>
            </div>
            <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full ${confidenceBarColor}`}
                style={{ width: `${Math.min(100, c.confidence * 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* AI One-line Reason */}
        <p className="mt-2 text-xs leading-relaxed text-slate-700">
          {localizeCaseReason(c.reason, lang)}
        </p>

        {/* Extracted Relief Needs */}
        {c.needs.length > 0 && (
          <div className="mt-1.5 text-[11px] text-slate-600">
            <span className="font-medium text-slate-500">
              {tr(lang, 'Needs:', 'අවශ්‍යතා:', 'தேவைகள்:')}
            </span>{' '}
            <span className="font-mono text-slate-800">
              {c.needs.map((n) => localizeNeed(n, lang)).join(', ')}
            </span>
          </div>
        )}

        {/* Bottom Metadata Row + Quick Confirm Action */}
        <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-mono font-medium text-slate-700 tabular-nums">
              {c.reportIds.length}{' '}
              {tr(
                lang,
                c.reportIds.length === 1 ? 'report' : 'corroborating reports',
                c.reportIds.length === 1 ? 'වාර්තාවක්' : 'තහවුරු වාර්තා',
                c.reportIds.length === 1 ? 'அறிக்கை' : 'உறுதிப்படுத்தும் அறிக்கைகள்'
              )}
            </span>
            <span aria-hidden="true">·</span>
            <span>
              {tr(lang, 'Lang:', 'භාෂා:', 'மொழி:')}{' '}
              {c.languages.join(', ').toUpperCase()}
            </span>
            <span aria-hidden="true">·</span>
            <span className="inline-flex items-center gap-0.5 text-slate-700">
              <MapPin className="h-3 w-3 text-slate-400" />
              {tr(lang, 'Loc:', 'ස්ථානය:', 'இடம்:')}{' '}
              <strong>{localizeLocationSource(c.locationSource, lang)}</strong>
            </span>
          </div>
          <div className="flex items-center gap-2.5">
            {!c.humanConfirmed && (
              <button
                type="button"
                onClick={async (e) => {
                  e.stopPropagation();
                  await onQuickConfirmCase(c.id);
                }}
                className="rounded border border-[#0B2A6F] bg-white px-2.5 py-1 text-[11px] font-semibold text-[#0B2A6F] hover:bg-[#0B2A6F] hover:text-white transition-colors"
              >
                {tr(
                  lang,
                  'Confirm AI Suggestion',
                  'AI යෝජනාව තහවුරු කරන්න',
                  'AI பரிந்துரையை உறுதிப்படுத்து'
                )}
              </button>
            )}
            <span className="inline-flex items-center gap-1 font-medium text-[#0B2A6F] group-hover:underline">
              {tr(lang, 'Inspect', 'පරීක්ෂා කරන්න', 'ஆய்வு')}{' '}
              <ArrowRight className="h-3 w-3" />
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-5">
      {/* Header Stats Bar */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-lg border border-slate-200 bg-white p-3.5">
          <div className="text-xs text-slate-500">{t.stats.reportsToday}</div>
          <div className="mt-1 flex flex-wrap items-baseline justify-between gap-1">
            <span className="font-mono text-2xl font-semibold text-slate-900 tabular-nums">
              {reports.length}
            </span>
            <span className="text-[11px] text-slate-500">
              {offlineQueue.length > 0
                ? tr(
                    lang,
                    `+${offlineQueue.length} queued offline`,
                    `+${offlineQueue.length} Offline පෝලිමේ`,
                    `+${offlineQueue.length} Offline வரிசையில்`
                  )
                : tr(
                    lang,
                    'si · ta · en · romanized',
                    'සිං · දෙ · ඉං · Singlish',
                    'சிங் · தமிழ் · ஆங் · Tanglish'
                  )}
            </span>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-3.5">
          <div className="text-xs text-slate-500">{t.stats.openCases}</div>
          <div className="mt-1 flex flex-wrap items-baseline justify-between gap-1">
            <span className="font-mono text-2xl font-semibold text-slate-900 tabular-nums">
              {cases.length}
            </span>
            <span className="font-mono text-[11px] text-slate-600 tabular-nums">
              <strong className="text-red-600">
                {cases.filter((c) => c.queue === 'act_now').length}
              </strong>{' '}
              {tr(lang, 'Act', 'ක්‍රියාත්මක', 'உடனடி')} ·{' '}
              <strong className="text-amber-600">
                {cases.filter((c) => c.queue === 'verify_fast').length}
              </strong>{' '}
              {tr(lang, 'Verify', 'තහවුරු', 'சரிபார்')}
            </span>
          </div>
        </div>

        <div
          onClick={onNavigateToSilenceRadar}
          className="cursor-pointer rounded-lg border border-slate-200 bg-white p-3.5 transition-colors hover:border-amber-500"
        >
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>{t.stats.quietAreas}</span>
            <Radio className="h-3.5 w-3.5 text-amber-600 shrink-0" />
          </div>
          <div className="mt-1 flex flex-wrap items-baseline justify-between gap-1">
            <span className="font-mono text-2xl font-semibold text-amber-700 tabular-nums">
              {flaggedQuietAreas.length}
            </span>
            <span className="text-[11px] font-medium text-amber-700 hover:underline">
              {t.nav.silenceRadar} →
            </span>
          </div>
        </div>

        <div
          onClick={onNavigateToLedger}
          className="cursor-pointer rounded-lg border border-slate-200 bg-white p-3.5 transition-colors hover:border-[#0B2A6F]"
        >
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>{t.stats.ledgerStatus}</span>
            {ledgerIntact ? (
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
            ) : (
              <ShieldAlert className="h-3.5 w-3.5 text-red-600 shrink-0" />
            )}
          </div>
          <div className="mt-1 flex flex-wrap items-baseline justify-between gap-1">
            <span
              className={`text-sm font-semibold ${
                ledgerIntact ? 'text-emerald-700' : 'text-red-700'
              }`}
            >
              {ledgerIntact
                ? t.stats.intact
                : `${t.stats.tampered} #${tamperedEntryNumber}`}
            </span>
            <span className="font-mono text-[11px] text-slate-500">SHA-256</span>
          </div>
        </div>
      </div>

      {/* Layout View Switcher (Visible across mobile, tablet, and compact laptop screens) */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white p-2 xl:hidden">
        <span className="px-2 text-xs font-medium text-slate-600">
          {tr(lang, 'Layout View:', 'පෙනුම:', 'காட்சி முறை:')}
        </span>
        <div className="flex items-center gap-1 rounded-md bg-slate-100 p-1 text-xs">
          <button
            type="button"
            onClick={() => setMobileViewMode('split')}
            className={`rounded px-2.5 py-1 font-medium transition-colors ${
              mobileViewMode === 'split'
                ? 'bg-white text-[#0B2A6F] shadow-xs'
                : 'text-slate-600'
            }`}
          >
            {tr(lang, 'Split', 'දෙකම', 'இரண்டும்')}
          </button>
          <button
            type="button"
            onClick={() => setMobileViewMode('queues')}
            className={`inline-flex items-center gap-1 rounded px-2.5 py-1 font-medium transition-colors ${
              mobileViewMode === 'queues'
                ? 'bg-white text-[#0B2A6F] shadow-xs'
                : 'text-slate-600'
            }`}
          >
            <ListFilter className="h-3 w-3" />
            <span>{tr(lang, 'Queues', 'පෝලිම්', 'வரிசைகள்')}</span>
          </button>
          <button
            type="button"
            onClick={() => setMobileViewMode('map')}
            className={`inline-flex items-center gap-1 rounded px-2.5 py-1 font-medium transition-colors ${
              mobileViewMode === 'map'
                ? 'bg-white text-[#0B2A6F] shadow-xs'
                : 'text-slate-600'
            }`}
          >
            <MapIcon className="h-3 w-3" />
            <span>{tr(lang, 'Map', 'සිතියම', 'வரைபடம்')}</span>
          </button>
        </div>
      </div>

      {/* Main Split View: Left Map, Right Three Queues */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
        {/* Left: Map View (5 cols on wide desktop) */}
        <div
          className={`space-y-3 min-w-0 xl:col-span-5 ${
            mobileViewMode === 'queues' ? 'hidden xl:block' : 'block'
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-slate-900">
                {tr(
                  lang,
                  'Divisional Situational Map (Kandy & Central Highlands)',
                  'ප්‍රාදේශීය තත්ත්ව සිතියම (මහනුවර සහ මධ්‍යම කඳුකරය)',
                  'பிரதேச நிலைமை வரைபடம் (கண்டி மற்றும் மத்திய மலைநாடு)'
                )}
              </h2>
              <p className="text-xs text-slate-500">
                {tr(
                  lang,
                  'Case markers colored by queue · Dashed amber circles mark quiet GN areas',
                  'සිදුවීම් සලකුණු පෝලිම අනුව වර්ණ ගන්වා ඇත · කහ පැහැති කව මගින් නිහඬ වසම් දක්වයි',
                  'சம்பவ குறியீடுகள் வரிசைப்படி வண்ணமிடப்பட்டுள்ளன · மஞ்சள் வட்டங்கள் மௌன பிரிவுகளைக் குறிக்கின்றன'
                )}
              </p>
            </div>
            <button
              type="button"
              onClick={onNavigateToSubmit}
              className="rounded-md bg-[#0B2A6F] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#082054] transition-colors whitespace-nowrap shrink-0"
            >
              + {t.nav.submit}
            </button>
          </div>

          <MapView
            lang={lang}
            cases={filteredCases}
            quietAreas={quietAreas}
            onSelectCase={onSelectCase}
            onSelectQuietArea={() => onNavigateToSilenceRadar()}
            heightClass="h-[320px] sm:h-[420px] xl:h-[620px]"
          />
        </div>

        {/* Right: Three Triage Queues (7 cols on wide desktop) */}
        <div
          className={`space-y-4 min-w-0 xl:col-span-7 ${
            mobileViewMode === 'map' ? 'hidden xl:block' : 'block'
          }`}
        >
          {/* Controls Bar: Queue Filter Tabs + Route/Confirmation Filters + Search + CSV Export */}
          <div className="space-y-2.5">
            <div className="flex flex-col gap-2.5 md:flex-row md:items-center md:justify-between">
              <div className="flex w-full md:w-auto items-center gap-1 overflow-x-auto no-scrollbar rounded-lg bg-slate-100 p-1">
                <button
                  type="button"
                  onClick={() => setActiveQueueFilter('all')}
                  className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                    activeQueueFilter === 'all'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tr(lang, 'All Queues', 'සියලුම පෝලිම්', 'அனைத்து வரிசைகள்')} (
                  {cases.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveQueueFilter('act_now')}
                  className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                    activeQueueFilter === 'act_now'
                      ? 'bg-red-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {t.queues.act_now} (
                  {cases.filter((c) => c.queue === 'act_now').length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveQueueFilter('verify_fast')}
                  className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                    activeQueueFilter === 'verify_fast'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {t.queues.verify_fast} (
                  {cases.filter((c) => c.queue === 'verify_fast').length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveQueueFilter('watch')}
                  className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                    activeQueueFilter === 'watch'
                      ? 'bg-slate-700 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {t.queues.watch} (
                  {cases.filter((c) => c.queue === 'watch').length})
                </button>
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto">
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={tr(
                    lang,
                    'Filter village, road, ID...',
                    'ගම, මාර්ගය, අංකය සොයන්න...',
                    'கிராமம், வீதி, எண் தேடுக...'
                  )}
                  className="flex-1 md:w-44 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#0B2A6F] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap shrink-0"
                >
                  <Download className="h-3.5 w-3.5 text-slate-500" />
                  <span>
                    {tr(lang, 'Export CSV', 'CSV බාගන්න', 'CSV பதிவிறக்கு')}
                  </span>
                </button>
              </div>
            </div>

            {/* Secondary Operational Filter Bar */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <select
                value={incidentTypeFilter}
                onChange={(e) =>
                  setIncidentTypeFilter(
                    e.target.value as 'all' | IncidentType
                  )
                }
                className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 focus:border-[#0B2A6F] focus:outline-none"
              >
                <option value="all">
                  {tr(
                    lang,
                    'All Incident Types',
                    'සියලුම සිදුවීම් වර්ග',
                    'அனைத்து சம்பவ வகைகள்'
                  )}{' '}
                  ({cases.length})
                </option>
                {(Object.keys(t.incidentTypes) as IncidentType[]).map((type) => (
                  <option key={type} value={type}>
                    {t.incidentTypes[type]} (
                    {cases.filter((c) => c.incident_type === type).length})
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => setRoadBlockedOnly(!roadBlockedOnly)}
                className={`rounded-md border px-2.5 py-1 font-medium transition-colors ${
                  roadBlockedOnly
                    ? 'border-red-600 bg-red-50 text-red-800'
                    : 'border-slate-200 bg-white text-slate-600 hover:text-slate-900'
                }`}
              >
                {tr(
                  lang,
                  'Road Blocked Only',
                  'මාර්ග අවහිරතා පමණක්',
                  'வீதித் தடை மட்டுமே'
                )}{' '}
                ({cases.filter((c) => c.roadBlocked).length})
              </button>
              <button
                type="button"
                onClick={() => setUnconfirmedOnly(!unconfirmedOnly)}
                className={`rounded-md border px-2.5 py-1 font-medium transition-colors ${
                  unconfirmedOnly
                    ? 'border-amber-600 bg-amber-50 text-amber-800'
                    : 'border-slate-200 bg-white text-slate-600 hover:text-slate-900'
                }`}
              >
                {tr(
                  lang,
                  'Unconfirmed AI Suggestions Only',
                  'තහවුරු නොකළ AI යෝජනා පමණක්',
                  'உறுதிப்படுத்தப்படாத AI பரிந்துரைகள் மட்டுமே'
                )}{' '}
                ({cases.filter((c) => !c.humanConfirmed).length})
              </button>
            </div>
          </div>

          {/* Queue 1: ACT NOW */}
          {(activeQueueFilter === 'all' || activeQueueFilter === 'act_now') && (
            <section className="space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-1 border-b border-red-200 pb-1.5">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
                  <h3 className="text-sm font-semibold text-red-700">
                    {t.queues.act_now}
                  </h3>
                  <span className="font-mono text-xs text-slate-500">
                    ({actNowCases.length})
                  </span>
                </div>
                <span className="font-mono text-[11px] text-slate-500">
                  {t.queues.act_now_desc}
                </span>
              </div>
              {actNowCases.length === 0 ? (
                <div className="rounded-md border border-dashed border-slate-200 p-4 text-center text-xs text-slate-500">
                  {tr(
                    lang,
                    'No cases matching current filters in the Act Now queue.',
                    'වත්මන් පෙරහනට අදාළව "වහාම ක්‍රියාත්මක වන්න" පෝලිමේ සිදුවීම් නොමැත.',
                    'தற்போதைய வடிகட்டிகளுக்குப் பொருந்தும் "உடனடி நடவடிக்கை" சம்பவங்கள் எதுவுமில்லை.'
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2.5 xl:grid-cols-2">
                  {actNowCases.map(renderCaseCard)}
                </div>
              )}
            </section>
          )}

          {/* Queue 2: VERIFY FAST */}
          {(activeQueueFilter === 'all' ||
            activeQueueFilter === 'verify_fast') && (
            <section className="space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-1 border-b border-amber-200 pb-1.5">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-amber-600 shrink-0" />
                  <h3 className="text-sm font-semibold text-amber-700">
                    {t.queues.verify_fast}
                  </h3>
                  <span className="font-mono text-xs text-slate-500">
                    ({verifyFastCases.length})
                  </span>
                </div>
                <span className="font-mono text-[11px] text-slate-500">
                  {t.queues.verify_fast_desc}
                </span>
              </div>
              {verifyFastCases.length === 0 ? (
                <div className="rounded-md border border-dashed border-slate-200 p-4 text-center text-xs text-slate-500">
                  {tr(
                    lang,
                    'No high-urgency low-confidence cases awaiting fast verification.',
                    'ඉක්මන් තහවුරු කිරීමක් අපේක්ෂා කරන සිදුවීම් නොමැත.',
                    'விரைவான சரிபார்ப்புக்காகக் காத்திருக்கும் சம்பவங்கள் எதுவுமில்லை.'
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2.5 xl:grid-cols-2">
                  {verifyFastCases.map(renderCaseCard)}
                </div>
              )}
            </section>
          )}

          {/* Queue 3: WATCH */}
          {(activeQueueFilter === 'all' || activeQueueFilter === 'watch') && (
            <section className="space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-1 border-b border-slate-200 pb-1.5">
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4 text-slate-600 shrink-0" />
                  <h3 className="text-sm font-semibold text-slate-700">
                    {t.queues.watch}
                  </h3>
                  <span className="font-mono text-xs text-slate-500">
                    ({watchCases.length})
                  </span>
                </div>
                <span className="font-mono text-[11px] text-slate-500">
                  {t.queues.watch_desc}
                </span>
              </div>
              {watchCases.length === 0 ? (
                <div className="rounded-md border border-dashed border-slate-200 p-4 text-center text-xs text-slate-500">
                  {tr(
                    lang,
                    'No cases in the Watch queue.',
                    'විමසිල්ලෙන් සිටින පෝලිමේ සිදුවීම් නොමැත.',
                    'கண்காணிப்பு வரிசையில் சம்பவங்கள் எதுவுமில்லை.'
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2.5 xl:grid-cols-2">
                  {watchCases.map(renderCaseCard)}
                </div>
              )}
            </section>
          )}
        </div>
      </div>
    </div>
  );
};
