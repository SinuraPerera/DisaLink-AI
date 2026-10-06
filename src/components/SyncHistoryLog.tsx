import React, { useMemo } from 'react';
import {
  OfflineQueuedReport,
  SyncHistoryEvent,
  UILanguage,
} from '../types';
import { tr } from '../lib/i18n';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Clock,
  History,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';

interface SyncHistoryLogProps {
  lang?: UILanguage;
  syncHistory: SyncHistoryEvent[];
  offlineQueue: OfflineQueuedReport[];
  isEffectiveOffline: boolean;
  onManualSyncNow?: () => Promise<void>;
  onNavigateToCase: (caseId: string) => void;
}

interface SyncChartBucket {
  slotLabel: string;
  windowRange: string;
  events: number;
  reports: number;
}

function formatRelativeTime(isoString: string): string {
  const diffMs = Date.now() - new Date(isoString).getTime();
  const diffSec = Math.max(0, Math.floor(diffMs / 1000));
  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ${diffMin % 60}m ago`;
  return `${Math.floor(diffHr / 24)}d ago`;
}

export const SyncHistoryLog: React.FC<SyncHistoryLogProps> = ({
  lang = 'en',
  syncHistory,
  offlineQueue,
  isEffectiveOffline,
  onManualSyncNow,
  onNavigateToCase,
}) => {
  const totalReportsSynced = syncHistory.reduce(
    (sum, item) => sum + item.processedCount,
    0
  );

  // Build 12 two-hour buckets across the last 24 hours for the Recharts mini-bar chart
  const { chartData, peakBucket } = useMemo(() => {
    const now = Date.now();
    const bucketDurationMs = 2 * 60 * 60 * 1000; // 2-hour windows over 24h
    const numBuckets = 12;

    const buckets: SyncChartBucket[] = [];
    for (let i = numBuckets - 1; i >= 0; i--) {
      const endMs = now - i * bucketDurationMs;
      const startMs = endMs - bucketDurationMs;
      const endDate = new Date(endMs);
      const startDate = new Date(startMs);

      const endHour = endDate.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
      const startHour = startDate.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });

      const slotLabel = i === 0 ? 'Now' : `-${i * 2}h`;
      const windowRange = `${startHour} – ${endHour}`;

      let events = 0;
      let reports = 0;
      for (const item of syncHistory) {
        const t = new Date(item.syncedAt).getTime();
        if (t > startMs && t <= endMs + (i === 0 ? 60000 : 0)) {
          events += 1;
          reports += item.processedCount;
        }
      }

      buckets.push({
        slotLabel,
        windowRange,
        events,
        reports,
      });
    }

    let peak: SyncChartBucket | null = null;
    for (const b of buckets) {
      if (!peak || b.reports > peak.reports) {
        peak = b;
      }
    }

    return {
      chartData: buckets,
      peakBucket: peak && peak.reports > 0 ? peak : null,
    };
  }, [syncHistory]);

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 sm:p-5 space-y-4">
      {/* Header & Summary Counters */}
      <div className="flex flex-col gap-3 border-b border-slate-200 pb-3.5 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-[#0B2A6F] shrink-0" />
            <h2 className="text-sm font-semibold text-slate-900">
              {tr(
                lang,
                'Sync History & 24-Hour Activity Volume',
                'සමමුහුර්ත ඉතිහාසය සහ පැය 24 ක්‍රියාකාරකම් පරිමාව',
                'ஒத்திசைவு வரலாறு மற்றும் 24 மணிநேர செயல்பாட்டு அளவு'
              )}
            </h2>
          </div>
          <p className="text-xs text-slate-500">
            {tr(
              lang,
              'Tracks offline-to-online synchronization frequency, report volume, and peak field reconnection windows over the last 24 hours.',
              'පසුගිය පැය 24 තුළ Offline සිට Online දක්වා සමමුහුර්ත වූ වාර ගණන, වාර්තා පරිමාව සහ උපරිම ක්ෂේත්‍ර සම්බන්ධතා කාලසීමාවන් පෙන්වයි.',
              'கடந்த 24 மணிநேரத்தில் ஆஃப்லைன்-ஆன்லைன் ஒத்திசைவு அதிர்வெண், அறிக்கை அளவு மற்றும் உச்ச செயல்பாட்டு நேரங்களைக் காட்டுகிறது.'
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 font-mono">
            <span className="text-slate-500">
              {tr(lang, 'Sync Events:', 'සමමුහුර්ත වාර:', 'ஒத்திசைவு நிகழ்வுகள்:')}
            </span>{' '}
            <strong className="text-slate-900 tabular-nums">
              {syncHistory.length}
            </strong>
          </div>
          <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 font-mono">
            <span className="text-slate-500">
              {tr(
                lang,
                'Processed Reports:',
                'සැකසූ වාර්තා:',
                'செயலாக்கப்பட்ட அறிக்கைகள்:'
              )}
            </span>{' '}
            <strong className="text-emerald-700 tabular-nums">
              {totalReportsSynced}
            </strong>
          </div>
          {offlineQueue.length > 0 && !isEffectiveOffline && onManualSyncNow && (
            <button
              type="button"
              onClick={onManualSyncNow}
              className="inline-flex items-center gap-1.5 rounded-md bg-[#0B2A6F] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#082054] transition-colors"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>
                {tr(
                  lang,
                  `Sync ${offlineQueue.length} Queued Now`,
                  `පෝලිමේ ඇති ${offlineQueue.length} දැන් සමමුහුර්ත කරන්න`,
                  `வரிசையில் உள்ள ${offlineQueue.length} அறிக்கைகளை ஒத்திசை`
                )}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Recharts 24-Hour Sync Frequency & Volume Mini-Bar Chart */}
      <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3.5">
        <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-3.5 w-3.5 text-[#0B2A6F]" />
            <span className="font-semibold text-slate-800">
              {tr(
                lang,
                'Last 24 Hours — Sync Frequency & Processed Report Volume (2h Windows)',
                'පසුගිය පැය 24 — සමමුහුර්ත වාර සහ සැකසූ වාර්තා පරිමාව (පැය 2 කවුළු)',
                'கடந்த 24 மணிநேரம் — ஒத்திசைவு அதிர்வெண் மற்றும் அறிக்கை அளவு (2 மணிநேர இடைவெளி)'
              )}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-600">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-xs bg-[#0B2A6F]" />
              <span>
                {tr(lang, 'Processed Reports', 'සැකසූ වාර්තා', 'செயலாக்கப்பட்ட அறிக்கைகள்')}
              </span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-xs bg-emerald-600" />
              <span>
                {tr(lang, 'Sync Events', 'සමමුහුර්ත වාර', 'ஒத்திசைவு நிகழ்வுகள்')}
              </span>
            </span>
            {peakBucket && (
              <span className="font-mono font-semibold text-[#0B2A6F]">
                {tr(lang, 'Peak:', 'උපරිමය:', 'உச்சம்:')} {peakBucket.slotLabel}{' '}
                ({peakBucket.windowRange}) · {peakBucket.reports}
              </span>
            )}
          </div>
        </div>

        <div className="h-40 w-full min-w-0">
          <ResponsiveContainer width="100%" height={160} minWidth={0}>
            <BarChart
              data={chartData}
              margin={{ top: 6, right: 8, left: -24, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#E2E8F0"
              />
              <XAxis
                dataKey="slotLabel"
                tick={{ fontSize: 11, fill: '#64748B' }}
                axisLine={{ stroke: '#CBD5E1' }}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 11, fill: '#64748B' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                cursor={{ fill: '#F1F5F9' }}
                content={({ active, payload }) => {
                  if (!active || !payload || payload.length === 0) return null;
                  const data = payload[0].payload as SyncChartBucket;
                  return (
                    <div className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs shadow-sm">
                      <div className="font-semibold text-slate-900">
                        {tr(lang, 'Window:', 'කාල කවුළුව:', 'கால இடைவெளி:')}{' '}
                        {data.slotLabel} ({data.windowRange})
                      </div>
                      <div className="mt-1 font-mono text-[11px] text-[#0B2A6F]">
                        {tr(
                          lang,
                          'Processed Reports:',
                          'සැකසූ වාර්තා:',
                          'செயலாக்கப்பட்ட அறிக்கைகள்:'
                        )}{' '}
                        <strong>{data.reports}</strong>
                      </div>
                      <div className="font-mono text-[11px] text-emerald-700">
                        {tr(
                          lang,
                          'Sync Events:',
                          'සමමුහුර්ත වාර:',
                          'ஒத்திசைவு நிகழ்வுகள்:'
                        )}{' '}
                        <strong>{data.events}</strong>
                      </div>
                    </div>
                  );
                }}
              />
              <Bar
                dataKey="reports"
                name={tr(
                  lang,
                  'Processed Reports',
                  'සැකසූ වාර්තා',
                  'செயலாக்கப்பட்ட அறிக்கைகள்'
                )}
                fill="#0B2A6F"
                radius={[3, 3, 0, 0]}
                maxBarSize={24}
              />
              <Bar
                dataKey="events"
                name={tr(lang, 'Sync Events', 'සමමුහුර්ත වාර', 'ஒத்திசைவு நிகழ்வுகள்')}
                fill="#059669"
                radius={[3, 3, 0, 0]}
                maxBarSize={24}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Sync Events Log */}
      {syncHistory.length === 0 ? (
        <div className="rounded-md border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-xs text-slate-500">
          {tr(
            lang,
            'No offline-to-online sync events recorded yet. Reports queued while offline or in Offline Queue Mode automatically synchronize and log here when connectivity returns.',
            'මෙතෙක් Offline-සිට-Online සමමුහුර්ත වීම් වාර්තා වී නොමැත. Offline පෝලිම් ප්‍රකාරයේදී යොමු කරන වාර්තා නැවත අන්තර්ජාල සම්බන්ධතාවය ලැබුණු විගස ස්වයංක්‍රීයව සමමුහුර්ත වී මෙහි සටහන් වේ.',
            'ஆஃப்லைன்-ஆன்லைன் ஒத்திசைவு நிகழ்வுகள் எதுவும் இதுவரை பதிவாகவில்லை. ஆஃப்லைன் வரிசையில் சேர்க்கப்படும் அறிக்கைகள் இணைப்பு திரும்பியதும் தானாகவே ஒத்திசைக்கப்பட்டு இங்கே பதிவு செய்யப்படும்.'
          )}
        </div>
      ) : (
        <>
          {/* Mobile Card Layout (< md) */}
          <div className="space-y-2.5 md:hidden">
            {syncHistory.map((evt) => (
              <div
                key={evt.id}
                className="rounded-lg border border-slate-200 bg-slate-50/70 p-3.5 space-y-2 text-xs"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 font-mono font-semibold text-slate-900">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                    <span>{evt.id}</span>
                  </div>
                  <span className="font-mono font-semibold text-emerald-700 tabular-nums">
                    {evt.processedCount}{' '}
                    {tr(
                      lang,
                      evt.processedCount === 1
                        ? 'report synced'
                        : 'reports synced',
                      'වාර්තා සමමුහුර්ත විය',
                      'அறிக்கைகள் ஒத்திசைக்கப்பட்டன'
                    )}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-600">
                  <Clock className="h-3 w-3 text-slate-400 shrink-0" />
                  <span>{new Date(evt.syncedAt).toLocaleString()}</span>
                  <span className="font-sans text-slate-400">
                    ({formatRelativeTime(evt.syncedAt)})
                  </span>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200/80 pt-2">
                  <div className="font-mono text-[11px] text-slate-700">
                    {tr(lang, 'Reports:', 'වාර්තා:', 'அறிக்கைகள்:')}{' '}
                    <strong>{evt.reportIds.join(', ')}</strong>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {evt.caseIds.map((cId) => (
                      <button
                        key={cId}
                        type="button"
                        onClick={() => onNavigateToCase(cId)}
                        className="inline-flex items-center gap-1 rounded border border-slate-300 bg-white px-2.5 py-1 font-mono text-[11px] font-semibold text-[#0B2A6F] hover:border-[#0B2A6F]"
                      >
                        <span>
                          {tr(lang, 'Case', 'සිදුවීම', 'சம்பவம்')} {cId}
                        </span>
                        <ArrowRight className="h-3 w-3" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table Layout (md+) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="py-2 pr-3 font-medium">
                    {tr(lang, 'Sync Event', 'සමමුහුර්ත අංකය', 'ஒத்திசைவு எண்')}
                  </th>
                  <th className="py-2 px-3 font-medium">
                    {tr(
                      lang,
                      'Synchronization Timestamp',
                      'සමමුහුර්ත කළ වේලාව',
                      'ஒத்திசைவு நேரம்'
                    )}
                  </th>
                  <th className="py-2 px-3 text-right font-medium">
                    {tr(
                      lang,
                      'Processed Reports',
                      'සැකසූ වාර්තා ගණන',
                      'செயலாக்கப்பட்ட அறிக்கைகள்'
                    )}
                  </th>
                  <th className="py-2 px-3 font-medium">
                    {tr(
                      lang,
                      'Synced Report IDs',
                      'සමමුහුර්ත වාර්තා අංක',
                      'அறிக்கை எண்கள்'
                    )}
                  </th>
                  <th className="py-2 px-3 font-medium">
                    {tr(
                      lang,
                      'Merged Case(s)',
                      'ඒකාබද්ධ වූ සිදුවීම්',
                      'இணைக்கப்பட்ட சம்பவங்கள்'
                    )}
                  </th>
                  <th className="py-2 pl-3 text-right font-medium">
                    {tr(
                      lang,
                      'Idempotency Status',
                      'අනුපිටපත් පරීක්ෂාව',
                      'தனித்துவ நிலை'
                    )}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {syncHistory.map((evt) => (
                  <tr key={evt.id} className="hover:bg-slate-50/80">
                    <td className="py-2.5 pr-3 font-mono font-semibold text-slate-900 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                        <span>{evt.id}</span>
                      </div>
                    </td>

                    <td className="py-2.5 px-3 font-mono text-slate-700 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3 w-3 text-slate-400 shrink-0" />
                        <span>{new Date(evt.syncedAt).toLocaleString()}</span>
                        <span className="font-sans text-[11px] text-slate-400">
                          ({formatRelativeTime(evt.syncedAt)})
                        </span>
                      </div>
                    </td>

                    <td className="py-2.5 px-3 text-right font-mono font-semibold text-emerald-700 tabular-nums whitespace-nowrap">
                      {evt.processedCount}{' '}
                      {evt.processedCount === 1 ? 'report' : 'reports'}
                    </td>

                    <td className="py-2.5 px-3 font-mono text-slate-700">
                      {evt.reportIds.join(', ')}
                    </td>

                    <td className="py-2.5 px-3 font-mono">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {evt.caseIds.map((cId) => (
                          <button
                            key={cId}
                            type="button"
                            onClick={() => onNavigateToCase(cId)}
                            className="inline-flex items-center gap-0.5 rounded border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-semibold text-[#0B2A6F] hover:border-[#0B2A6F] hover:bg-blue-50 transition-colors"
                          >
                            <span>{cId}</span>
                            <ArrowRight className="h-2.5 w-2.5" />
                          </button>
                        ))}
                      </div>
                    </td>

                    <td className="py-2.5 pl-3 text-right whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 font-mono text-[11px] text-emerald-700">
                        <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                        <span>
                          {evt.trigger === 'manual_sync'
                            ? 'Manual Sync'
                            : 'Auto-Reconnect'}{' '}
                          · 0 dupes
                        </span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};
