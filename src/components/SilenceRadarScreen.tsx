import React, { useState } from 'react';
import { GNSilenceEvaluation, UILanguage } from '../types';
import {
  localizeDivision,
  localizeGNName,
  localizeHazardLevel,
  tr,
} from '../lib/i18n';
import {
  AlertTriangle,
  CheckCircle2,
  CloudLightning,
  Download,
  PhoneCall,
  Radio,
} from 'lucide-react';

interface SilenceRadarScreenProps {
  lang?: UILanguage;
  evaluatedAreas: GNSilenceEvaluation[];
  onSimulateStorm: (silentIds?: string[]) => Promise<void>;
  onContactGNOfficer: (gnId: string, note: string) => Promise<void>;
}

const STORM_SCENARIOS: Array<{ label: string; silentIds: string[] }> = [
  {
    label: 'Storm Scenario A (Kotmale, Ududumbara & Deltota Silent)',
    silentIds: ['GN-01', 'GN-02', 'GN-03'],
  },
  {
    label: 'Storm Scenario B (Hanthana, Nawalapitiya & Kadugannawa Silent)',
    silentIds: ['GN-07', 'GN-09', 'GN-10'],
  },
];

export const SilenceRadarScreen: React.FC<SilenceRadarScreenProps> = ({
  lang = 'en',
  evaluatedAreas,
  onSimulateStorm,
  onContactGNOfficer,
}) => {
  const [scenarioIndex, setScenarioIndex] = useState(0);
  const [contactNotes, setContactNotes] = useState<Record<string, string>>({});
  const [banner, setBanner] = useState<string | null>(null);
  const [hazardFilter, setHazardFilter] = useState<
    'all' | 'quiet_only' | 'high' | 'medium' | 'low'
  >('all');
  const [searchQuery, setSearchQuery] = useState('');

  const quietTasks = evaluatedAreas.filter((g) => g.isQuiet);

  const filteredAreas = evaluatedAreas.filter((g) => {
    if (hazardFilter === 'quiet_only' && !g.isQuiet) return false;
    if (
      (hazardFilter === 'high' ||
        hazardFilter === 'medium' ||
        hazardFilter === 'low') &&
      g.hazardLevel !== hazardFilter
    ) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        g.name.toLowerCase().includes(q) ||
        localizeGNName(g.name, lang).toLowerCase().includes(q) ||
        g.division.toLowerCase().includes(q) ||
        localizeDivision(g.division, lang).toLowerCase().includes(q) ||
        g.id.toLowerCase().includes(q) ||
        g.gnOfficerName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleExportSilenceCSV = () => {
    const headers = [
      'GN_ID',
      'GN_Name',
      'DS_Division',
      'Hazard_Level',
      'Baseline_Per_Hr',
      'Expected_2h_Lambda',
      'Observed_2h',
      'Raw_Poisson_P',
      'Scaled_P_Value',
      'Status',
      'GN_Officer',
      'Phone',
      'Contacted_At',
    ];
    const rows = evaluatedAreas.map((g) => [
      g.id,
      `"${g.name}"`,
      `"${g.division}"`,
      g.hazardLevel.toUpperCase(),
      g.baselinePerHour.toFixed(1),
      g.expectedLambda.toFixed(1),
      g.observedLastWindow,
      g.rawPValue.toFixed(4),
      g.scaledPValue.toFixed(4),
      g.isQuiet ? 'QUIET_ALERT' : 'NORMAL',
      `"${g.gnOfficerName}"`,
      `"${g.gnOfficerPhone}"`,
      g.contactedAt || '',
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `disalink-silence-radar-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleSimulateStormClick = async () => {
    const nextIdx = (scenarioIndex + 1) % STORM_SCENARIOS.length;
    setScenarioIndex(nextIdx);
    const chosen = STORM_SCENARIOS[nextIdx];
    await onSimulateStorm(chosen.silentIds);
    setBanner(
      tr(
        lang,
        `Monsoon telemetry sweep completed across 12 GN divisions: 9 areas reporting active storm volume while 3 high/medium-hazard GN areas (${chosen.silentIds.join(', ')}) went silent (0 reports in 2h window).`,
        `ග්‍රාම නිලධාරී වසම් 12 පුරා මෝසම් දත්ත පරීක්ෂාව අවසන්: වසම් 9ක සක්‍රීය වාර්තා ලැබෙන අතර අධි/මධ්‍යම අවදානම් වසම් 3ක් (${chosen.silentIds.join(', ')}) නිහඬ වී ඇත (පැය 2 තුළ වාර්තා 0).`,
        `12 கிராம அலுவலர் பிரிவுகளில் பருவமழை தரவு ஆய்வு முடிந்தது: 9 பகுதிகள் செயலில் உள்ள நிலையில், 3 அதிக/மிதமான ஆபத்து பகுதிகள் (${chosen.silentIds.join(', ')}) தொடர்பற்று உள்ளன (2 மணி நேரத்தில் 0 அறிக்கைகள்).`
      )
    );
  };

  const handleContactSubmit = async (gn: GNSilenceEvaluation) => {
    const note =
      contactNotes[gn.id]?.trim() ||
      `Coordinator phoned ${gn.gnOfficerName} (${gn.gnOfficerPhone}); verified cell tower outage in ${gn.name}.`;
    await onContactGNOfficer(gn.id, note);
    setBanner(
      tr(
        lang,
        `Logged "Coordinator contacted GN officer" for ${gn.name} to the SHA-256 Decision Ledger.`,
        `${localizeGNName(gn.name, lang)} සඳහා "සම්බන්ධීකාරක ග්‍රාම නිලධාරී සම්බන්ධ කර ගත්තා" යන්න SHA-256 තීරණ ලෙජරයේ සටහන් කරන ලදී.`,
        `${localizeGNName(gn.name, lang)} க்கான "ஒருங்கிணைப்பாளர் கிராம அலுவலரைத் தொடர்பு கொண்டார்" என்பது SHA-256 முடிவு பதிவேட்டில் பதிவு செய்யப்பட்டது.`
      )
    );
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Header & Simulate Storm Control */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Radio className="h-5 w-5 text-amber-600 shrink-0" />
            <h1 className="text-lg font-semibold text-slate-900">
              {tr(
                lang,
                'Silence Radar — Detecting Cut-Off Villages During Storms',
                'නිහඬතා රේඩාර් (Silence Radar) — කුණාටු අතරතුර සන්නිවේදනය බිඳවැටුණු ගම්මාන හඳුනා ගැනීම',
                'மௌன ரேடார் (Silence Radar) — புயலின் போது தொடர்பு துண்டிக்கப்பட்ட கிராமங்களைக் கண்டறிதல்'
              )}
            </h1>
          </div>
          <p className="mt-0.5 text-xs text-slate-600">
            {tr(
              lang,
              'Flags any Grama Niladhari (GN) division as QUIET when Hazard is High or Medium and Poisson tail probability ',
              'අවදානම් මට්ටම ඉහළ හෝ මධ්‍යම වන විට සහ Poisson සම්භාවිතාව ',
              'ஆபத்து நிலை அதிகம் அல்லது மிதமானதாக இருந்து Poisson நிகழ்தகவு '
            )}
            <span className="font-mono">
              P(X ≤ observed | λ = baseline × window) × hazard_scale &lt; 0.05
            </span>
            {tr(
              lang,
              '.',
              ' වන විට එම ග්‍රාම නිලධාරී වසම නිහඬ (QUIET) ලෙස ලකුණු කරයි.',
              ' ஆக இருக்கும்போது அந்த கிராம அலுவலர் பிரிவை மௌனம் (QUIET) எனக் குறிக்கிறது.'
            )}
          </p>
        </div>

        <button
          type="button"
          onClick={handleSimulateStormClick}
          className="flex items-center justify-center gap-2 rounded-md bg-[#0B2A6F] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#082054] transition-colors whitespace-nowrap"
        >
          <CloudLightning className="h-4 w-4 text-amber-300 shrink-0" />
          <span>
            {tr(
              lang,
              'Run Monsoon Telemetry Sweep (12 GN Areas)',
              'මෝසම් දත්ත පරීක්ෂාව ක්‍රියාත්මක කරන්න (ග්‍රා.නි. වසම් 12)',
              'பருவமழை தரவு ஆய்வை இயக்கு (12 கி.அ. பிரிவுகள்)'
            )}
          </span>
        </button>
      </div>

      {banner && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-4 py-2.5 text-xs font-medium text-amber-900">
          <CheckCircle2 className="h-4 w-4 text-amber-700 shrink-0" />
          <span>{banner}</span>
        </div>
      )}

      {/* Active "Check on this area" Tasks */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-200 pb-2">
          <h2 className="text-sm font-semibold text-amber-900">
            {tr(
              lang,
              `Active "Check on this area" Tasks (${quietTasks.length} Flagged Quiet GN Areas)`,
              `සක්‍රීය "මෙම ප්‍රදේශය පරීක්ෂා කරන්න" කාර්යයන් (නිහඬ ග්‍රා.නි. වසම් ${quietTasks.length})`,
              `செயலில் உள்ள "இந்தப் பகுதியைச் சரிபார்" பணிகள் (${quietTasks.length} மௌன கி.அ. பிரிவுகள்)`
            )}
          </h2>
          <span className="font-mono text-xs text-slate-500">
            {tr(
              lang,
              'Silence looks like safety — verify communication lines',
              'නිහඬතාවය ආරක්ෂාව ලෙස පෙනිය හැක — සන්නිවේදන මාර්ග තහවුරු කරන්න',
              'மௌனம் பாதுகாப்பாகத் தோன்றலாம் — தகவல் தொடர்பைச் சரிபார்க்கவும்'
            )}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {quietTasks.map((gn) => (
            <div
              key={gn.id}
              className="flex flex-col justify-between rounded-lg border border-amber-300 border-l-4 border-l-amber-600 bg-white p-4"
            >
              <div>
                <div className="flex items-center justify-between text-xs font-mono text-slate-500">
                  <span className="font-semibold text-amber-800">
                    {gn.id} ·{' '}
                    {tr(lang, 'QUIET ALERT', 'නිහඬ අනතුරු ඇඟවීම', 'மௌன எச்சரிக்கை')}
                  </span>
                  <span className="font-sans font-semibold text-red-700">
                    {tr(lang, 'Hazard:', 'අවදානම:', 'ஆபத்து:')}{' '}
                    {localizeHazardLevel(gn.hazardLevel, lang)}
                  </span>
                </div>

                <h3 className="mt-1 text-base font-bold text-slate-900">
                  {localizeGNName(gn.name, lang)}
                </h3>
                <p className="text-xs text-slate-600">
                  {localizeDivision(gn.division, lang)} ·{' '}
                  {tr(
                    lang,
                    `${gn.district} District`,
                    `${localizeDivision(gn.district, lang)} දිස්ත්‍රික්කය`,
                    `${localizeDivision(gn.district, lang)} மாவட்டம்`
                  )}
                </p>

                {/* Statistical Evidence Box */}
                <div className="mt-3 rounded-md bg-slate-50 p-2.5 font-mono text-xs text-slate-700 tabular-nums space-y-1">
                  <div className="flex justify-between">
                    <span>
                      {tr(lang, 'Baseline rate:', 'සාමාන්‍ය අනුපාතය:', 'அடிப்படை விகிதம்:')}
                    </span>
                    <strong>
                      {gn.baselinePerHour.toFixed(1)}{' '}
                      {tr(lang, 'reports/hr', 'වාර්තා/පැයට', 'அறிக்கைகள்/மணி')}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span>
                      {tr(
                        lang,
                        `Expected (${gn.windowHours}h window λ):`,
                        `අපේක්ෂිත (පැය ${gn.windowHours} කවුළුව λ):`,
                        `எதிர்பார்க்கப்படும் (${gn.windowHours} மணி λ):`
                      )}
                    </span>
                    <strong>
                      {gn.expectedLambda.toFixed(1)}{' '}
                      {tr(lang, 'reports', 'වාර්තා', 'அறிக்கைகள்')}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span>
                      {tr(
                        lang,
                        `Observed (${gn.windowHours}h window):`,
                        `නිරීක්ෂිත (පැය ${gn.windowHours} කවුළුව):`,
                        `கண்டறியப்பட்டது (${gn.windowHours} மணி):`
                      )}
                    </span>
                    <strong className="text-red-600">
                      {gn.observedLastWindow}{' '}
                      {tr(lang, 'reports', 'වාර්තා', 'அறிக்கைகள்')}
                    </strong>
                  </div>
                  <div className="flex justify-between border-t border-slate-200 pt-1">
                    <span>Poisson P(X ≤ {gn.observedLastWindow}):</span>
                    <strong>{gn.rawPValue.toFixed(4)}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>
                      {tr(
                        lang,
                        'Hazard-scaled p-value:',
                        'අවදානම්-ගැලපූ p-අගය:',
                        'ஆபத்து-அளவிடப்பட்ட p-மதிப்பு:'
                      )}
                    </span>
                    <strong className="text-amber-800">
                      {gn.scaledPValue.toFixed(4)} (&lt; 0.05)
                    </strong>
                  </div>
                </div>

                <div className="mt-3 text-xs text-slate-600">
                  {tr(lang, 'GN Officer:', 'ග්‍රාම නිලධාරී:', 'கிராம அலுவலர்:')}{' '}
                  <strong>{gn.gnOfficerName}</strong> (
                  <span className="font-mono">{gn.gnOfficerPhone}</span>)
                </div>

                {gn.contactedAt ? (
                  <div className="mt-3 rounded-md border border-emerald-200 bg-emerald-50 p-2.5 text-xs text-emerald-900">
                    <div className="font-semibold">
                      ✓{' '}
                      {tr(
                        lang,
                        'Coordinator contacted GN officer',
                        'සම්බන්ධීකාරක ග්‍රාම නිලධාරී සම්බන්ධ කර ගත්තා',
                        'ஒருங்கிணைப்பாளர் கிராம அலுவலரைத் தொடர்பு கொண்டார்'
                      )}{' '}
                      ({new Date(gn.contactedAt).toLocaleTimeString()})
                    </div>
                    <div className="mt-0.5 text-[11px]">{gn.statusNote}</div>
                  </div>
                ) : (
                  <div className="mt-3">
                    <input
                      type="text"
                      value={contactNotes[gn.id] || ''}
                      onChange={(e) =>
                        setContactNotes({
                          ...contactNotes,
                          [gn.id]: e.target.value,
                        })
                      }
                      placeholder={tr(
                        lang,
                        'Optional call note (e.g. tower down, landline ok)...',
                        'විකල්ප ඇමතුම් සටහන (උදා: කුළුණ බිඳවැටී ඇත, ස්ථාවර දුරකථන වැඩ)...',
                        'விருப்ப அழைப்பு குறிப்பு (எ.கா. கோபுரம் செயலிழந்தது)...'
                      )}
                      className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#0B2A6F] focus:outline-none"
                    />
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => handleContactSubmit(gn)}
                className={`mt-3 flex w-full items-center justify-center gap-1.5 rounded-md px-3 py-2 text-xs font-semibold transition-colors ${
                  gn.contactedAt
                    ? 'border border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                    : 'bg-[#0B2A6F] text-white hover:bg-[#082054]'
                }`}
              >
                <PhoneCall className="h-3.5 w-3.5" />
                <span>
                  {gn.contactedAt
                    ? tr(
                        lang,
                        'Update Contact Log in Ledger',
                        'ලෙජරයේ ඇමතුම් සටහන යාවත්කාලීන කරන්න',
                        'பதிவேட்டில் தொடர்பு பதிவைப் புதுப்பி'
                      )
                    : tr(
                        lang,
                        'Coordinator contacted GN officer',
                        'සම්බන්ධීකාරක ග්‍රාම නිලධාරී සම්බන්ධ කර ගත්තා',
                        'கிராம அலுவலரைத் தொடர்பு கொண்டதைப் பதிவு செய்'
                      )}
                </span>
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Full List / Table of 12 Monitored GN Areas */}
      <section className="rounded-lg border border-slate-200 bg-white p-4 sm:p-5 space-y-4">
        <div className="flex flex-col gap-3 border-b border-slate-200 pb-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              {tr(
                lang,
                `All Monitored Grama Niladhari (GN) Divisions (${filteredAreas.length} / ${evaluatedAreas.length})`,
                `නිරීක්ෂණය කරන සියලුම ග්‍රාම නිලධාරී (GN) වසම් (${filteredAreas.length} / ${evaluatedAreas.length})`,
                `கண்காணிக்கப்படும் அனைத்து கிராம அலுவலர் (GN) பிரிவுகள் (${filteredAreas.length} / ${evaluatedAreas.length})`
              )}
            </h2>
            <p className="text-xs text-slate-500">
              {tr(
                lang,
                'GN-12 (Kundasale) also has 0 observed reports, but is NOT flagged because its hazard level is Low and baseline is small.',
                'GN-12 (කුණ්ඩසාලේ) හිද නිරීක්ෂිත වාර්තා 0ක් ඇති නමුත් එහි අවදානම් මට්ටම අඩු (Low) සහ සාමාන්‍ය අනුපාතය කුඩා බැවින් අනතුරු ඇඟවීමක් ලෙස ලකුණු නොවේ.',
                'GN-12 (குண்டசாலை) பிரிவிலும் 0 அறிக்கைகள் உள்ளன, ஆனால் அதன் ஆபத்து நிலை குறைவாக (Low) இருப்பதால் எச்சரிக்கையாகக் குறிக்கப்படவில்லை.'
              )}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={hazardFilter}
              onChange={(e) =>
                setHazardFilter(
                  e.target.value as
                    | 'all'
                    | 'quiet_only'
                    | 'high'
                    | 'medium'
                    | 'low'
                )
              }
              className="rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:border-[#0B2A6F] focus:outline-none"
            >
              <option value="all">
                {tr(
                  lang,
                  `All Divisions (${evaluatedAreas.length})`,
                  `සියලුම වසම් (${evaluatedAreas.length})`,
                  `அனைத்து பிரிவுகளும் (${evaluatedAreas.length})`
                )}
              </option>
              <option value="quiet_only">
                {tr(
                  lang,
                  `Quiet Alerts Only (${quietTasks.length})`,
                  `නිහඬ අනතුරු ඇඟවීම් පමණි (${quietTasks.length})`,
                  `மௌன எச்சரிக்கைகள் மட்டும் (${quietTasks.length})`
                )}
              </option>
              <option value="high">
                {tr(lang, 'High Hazard', 'ඉහළ අවදානම', 'அதிக ஆபத்து')}
              </option>
              <option value="medium">
                {tr(lang, 'Medium Hazard', 'මධ්‍යම අවදානම', 'மிதமான ஆபத்து')}
              </option>
              <option value="low">
                {tr(lang, 'Low Hazard', 'අඩු අවදානම', 'குறைந்த ஆபத்து')}
              </option>
            </select>
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={tr(
                lang,
                'Search division or officer...',
                'වසම හෝ නිලධාරියා සොයන්න...',
                'பிரிவு அல்லது அலுவலரைத் தேடு...'
              )}
              className="rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#0B2A6F] focus:outline-none"
            />
            <button
              type="button"
              onClick={handleExportSilenceCSV}
              className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              <Download className="h-3.5 w-3.5 text-slate-500" />
              <span>{tr(lang, 'Export CSV', 'CSV බාගන්න', 'CSV பதிவிறக்கு')}</span>
            </button>
          </div>
        </div>

        {/* Mobile Card View (< md) */}
        <div className="space-y-2.5 md:hidden">
          {filteredAreas.map((g) => (
            <div
              key={g.id}
              className={`rounded-lg border p-3.5 text-xs space-y-2 ${
                g.isQuiet
                  ? 'border-amber-300 bg-amber-50/70'
                  : 'border-slate-200 bg-slate-50/40'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div>
                  <span className="font-mono text-[11px] font-semibold text-slate-500">
                    {g.id} ·{' '}
                  </span>
                  <strong className="text-slate-900">
                    {localizeGNName(g.name, lang)}
                  </strong>
                  <div className="text-[11px] text-slate-500">
                    {localizeDivision(g.division, lang)}
                  </div>
                </div>
                {g.isQuiet ? (
                  <span className="inline-flex items-center gap-1 font-semibold text-amber-800">
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                    {tr(lang, 'QUIET', 'නිහඬයි', 'மௌனம்')}
                  </span>
                ) : (
                  <span className="font-medium text-emerald-700">
                    {tr(lang, 'Normal', 'සාමාන්‍යයි', 'சாதாரண')}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2 rounded bg-white p-2 font-mono text-[11px] tabular-nums border border-slate-100">
                <div>
                  <div className="font-sans text-[10px] text-slate-400">
                    {tr(lang, 'Hazard', 'අවදානම', 'ஆபத்து')}
                  </div>
                  <div className="font-semibold text-slate-800">
                    {localizeHazardLevel(g.hazardLevel, lang)}
                  </div>
                </div>
                <div>
                  <div className="font-sans text-[10px] text-slate-400">
                    {tr(lang, 'Obs / Exp (λ)', 'නිරීක්ෂිත / අපේක්ෂිත', 'கண்ட / எதிர் (λ)')}
                  </div>
                  <div className="font-semibold text-slate-800">
                    {g.observedLastWindow} / {g.expectedLambda.toFixed(1)}
                  </div>
                </div>
                <div>
                  <div className="font-sans text-[10px] text-slate-400">
                    {tr(lang, 'Scaled p', 'ගැලපූ p', 'அளவிடப்பட்ட p')}
                  </div>
                  <div
                    className={`font-semibold ${
                      g.isQuiet ? 'text-amber-800' : 'text-slate-800'
                    }`}
                  >
                    {g.scaledPValue.toFixed(4)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop Table View (md+) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="py-2.5 pr-3 font-medium">
                  {tr(lang, 'GN Area', 'ග්‍රා.නි. වසම', 'கி.அ. பிரிவு')}
                </th>
                <th className="py-2.5 px-3 font-medium">
                  {tr(lang, 'DS Division', 'ප්‍රා.ලේ. කොට්ඨාසය', 'பிரதேச செயலகம்')}
                </th>
                <th className="py-2.5 px-3 font-medium">
                  {tr(lang, 'Hazard Level', 'අවදානම් මට්ටම', 'ஆபத்து நிலை')}
                </th>
                <th className="py-2.5 px-3 text-right font-medium">
                  {tr(lang, 'Baseline / hr', 'සාමාන්‍ය / පැයට', 'அடிப்படை / மணி')}
                </th>
                <th className="py-2.5 px-3 text-right font-medium">
                  {tr(lang, 'Expected (2h λ)', 'අපේක්ෂිත (පැය 2 λ)', 'எதிர்பார்ப்பு (2ம λ)')}
                </th>
                <th className="py-2.5 px-3 text-right font-medium">
                  {tr(lang, 'Observed (2h)', 'නිරීක්ෂිත (පැය 2)', 'கண்டறியப்பட்டது (2ம)')}
                </th>
                <th className="py-2.5 px-3 text-right font-medium">
                  {tr(lang, 'Raw Poisson P(X ≤ k)', 'Poisson P(X ≤ k)', 'Poisson P(X ≤ k)')}
                </th>
                <th className="py-2.5 px-3 text-right font-medium">
                  {tr(lang, 'Scaled p-value', 'ගැලපූ p-අගය', 'அளவிடப்பட்ட p-மதிப்பு')}
                </th>
                <th className="py-2.5 pl-3 font-medium">
                  {tr(lang, 'Radar Status', 'රේඩාර් තත්ත්වය', 'ரேடார் நிலை')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono tabular-nums">
              {filteredAreas.map((g) => (
                <tr
                  key={g.id}
                  className={
                    g.isQuiet
                      ? 'bg-amber-50/60 hover:bg-amber-50'
                      : 'hover:bg-slate-50'
                  }
                >
                  <td className="py-2.5 pr-3 font-sans font-semibold text-slate-900">
                    {localizeGNName(g.name, lang)}
                  </td>
                  <td className="py-2.5 px-3 font-sans text-slate-600">
                    {localizeDivision(g.division, lang)}
                  </td>
                  <td className="py-2.5 px-3 font-sans">
                    <span
                      className={`font-semibold ${
                        g.hazardLevel === 'high'
                          ? 'text-red-700'
                          : g.hazardLevel === 'medium'
                          ? 'text-amber-700'
                          : 'text-slate-600'
                      }`}
                    >
                      {localizeHazardLevel(g.hazardLevel, lang)}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right text-slate-700">
                    {g.baselinePerHour.toFixed(1)}
                  </td>
                  <td className="py-2.5 px-3 text-right text-slate-700">
                    {g.expectedLambda.toFixed(1)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-semibold text-slate-900">
                    {g.observedLastWindow}
                  </td>
                  <td className="py-2.5 px-3 text-right text-slate-600">
                    {g.rawPValue.toFixed(4)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-semibold text-slate-900">
                    {g.scaledPValue.toFixed(4)}
                  </td>
                  <td className="py-2.5 pl-3 font-sans">
                    {g.isQuiet ? (
                      <span className="inline-flex items-center gap-1 font-semibold text-amber-800">
                        <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                        {tr(
                          lang,
                          'QUIET — Check Area',
                          'නිහඬයි — ප්‍රදේශය පරීක්ෂා කරන්න',
                          'மௌனம் — பகுதியைச் சரிபார்'
                        )}
                      </span>
                    ) : (
                      <span className="text-emerald-700">
                        {tr(
                          lang,
                          'Normal Reporting',
                          'සාමාන්‍ය වාර්තාකරණය',
                          'சாதாரண அறிக்கையிடல்'
                        )}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
