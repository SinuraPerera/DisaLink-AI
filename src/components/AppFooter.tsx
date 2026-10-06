import React from 'react';
import { ThemeMode, UILanguage } from '../types';
import { UI_TRANSLATIONS, tr } from '../lib/i18n';
import {
  ArrowUp,
  CheckCircle2,
  Command,
  Download,
  ExternalLink,
  Moon,
  PhoneCall,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  Sun,
  UserCheck,
} from 'lucide-react';

type ScreenId =
  | 'overview'
  | 'dashboard'
  | 'submit'
  | 'caseDetail'
  | 'silenceRadar'
  | 'aiHub'
  | 'ledger'
  | 'summary'
  | 'evaluation';

interface AppFooterProps {
  lang: UILanguage;
  theme: ThemeMode;
  activeScreen: ScreenId;
  casesCount: number;
  reportsCount: number;
  quietAreaCount: number;
  ledgerCount: number;
  ledgerIntact: boolean;
  onNavigate: (screen: ScreenId) => void;
  onChangeLang: (lang: UILanguage) => void;
  onToggleTheme: () => void;
  onOpenCommandPalette: () => void;
  onOpenOfficerPortal: () => void;
  onExportWorkspaceSnapshot: () => void;
  onResetDemo: () => void;
}

export const AppFooter: React.FC<AppFooterProps> = ({
  lang,
  theme,
  activeScreen,
  casesCount,
  reportsCount,
  quietAreaCount,
  ledgerCount,
  ledgerIntact,
  onNavigate,
  onChangeLang,
  onToggleTheme,
  onOpenCommandPalette,
  onOpenOfficerPortal,
  onExportWorkspaceSnapshot,
  onResetDemo,
}) => {
  const t = UI_TRANSLATIONS[lang];

  const handleScrollTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="border-t border-slate-200 bg-white pb-20 lg:pb-0 text-slate-600">
      {/* Top Emergency Hotlines & Institutional Readiness Strip */}
      <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-800">
            <PhoneCall className="h-3.5 w-3.5 text-[#0B2A6F] shrink-0" />
            <span>
              {tr(
                lang,
                'Sri Lanka National Emergency Operations Hotlines:',
                'ශ්‍රී ලංකා ජාතික හදිසි ආපදා ඇමතුම් අංක:',
                'இலங்கை தேசிய அவசரத் தொடர்பு எண்கள்:'
              )}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs">
            <a
              href="tel:117"
              className="inline-flex items-center gap-1.5 font-medium text-slate-700 hover:text-[#0B2A6F]"
            >
              <span className="font-mono font-bold text-[#0B2A6F]">117</span>
              <span>
                {tr(
                  lang,
                  'DMC Emergency Call Centre',
                  'ආපදා කළමනාකරණ මධ්‍යස්ථානය (DMC)',
                  'அனர்த்த முகாமைத்துவ நிலையம் (DMC)'
                )}
              </span>
            </a>
            <span className="text-slate-300" aria-hidden="true">
              ·
            </span>
            <a
              href="tel:1990"
              className="inline-flex items-center gap-1.5 font-medium text-slate-700 hover:text-[#0B2A6F]"
            >
              <span className="font-mono font-bold text-red-700">1990</span>
              <span>
                {tr(
                  lang,
                  'Suwa Seriya Ambulance',
                  'සුව සැරිය ගිලන්රථ සේවාව',
                  'சுவ செரிய அம்புலன்ஸ்'
                )}
              </span>
            </a>
            <span className="text-slate-300" aria-hidden="true">
              ·
            </span>
            <a
              href="tel:119"
              className="inline-flex items-center gap-1.5 font-medium text-slate-700 hover:text-[#0B2A6F]"
            >
              <span className="font-mono font-bold text-slate-900">119</span>
              <span>
                {tr(
                  lang,
                  'Police Emergency',
                  'පොලිස් හදිසි ඇමතුම්',
                  'பொலிஸ் அவசரப் பிரிவு'
                )}
              </span>
            </a>
            <span className="text-slate-300" aria-hidden="true">
              ·
            </span>
            <a
              href="tel:110"
              className="inline-flex items-center gap-1.5 font-medium text-slate-700 hover:text-[#0B2A6F]"
            >
              <span className="font-mono font-bold text-slate-900">110</span>
              <span>
                {tr(
                  lang,
                  'Fire & Rescue',
                  'ගිනි නිවීමේ සහ මුදාගැනීමේ සේවය',
                  'தீயணைப்பு & மீட்பு'
                )}
              </span>
            </a>
          </div>
        </div>
      </div>

      {/* Main 4-Column Institutional Footer Grid */}
      <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8 lg:py-10">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-12">
          {/* Column 1: Brand Identity, Governance & Live Ledger Integrity (4 cols) */}
          <div className="space-y-3.5 lg:col-span-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[#0B2A6F] text-white shrink-0">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div>
                <div className="text-sm font-bold tracking-tight text-slate-900">
                  DisaLink AI
                </div>
                <div className="text-[11px] text-slate-500">
                  {tr(
                    lang,
                    'Divisional Secretariat Decision-Support Layer',
                    'ප්‍රාදේශීය ලේකම් කාර්යාලයීය තීරණ සහාය පද්ධතිය',
                    'பிரதேச செயலக தீர்மான ஆதரவு அமைப்பு'
                  )}
                </div>
              </div>
            </div>

            <p className="text-xs leading-relaxed text-slate-600 max-w-sm">
              {tr(
                lang,
                'Built for Divisional Secretariat (DS) coordinators and Grama Niladhari (GN) officers across Kandy, Nuwara Eliya, and Matale Districts. Unifies Sinhala, Tamil, English, Singlish, and Tanglish field reports into calibrated triage queues.',
                'මහනුවර, නුවරඑළිය සහ මාතලේ දිස්ත්‍රික්කවල ප්‍රාදේශීය ලේකම් කාර්යාල සහ ග්‍රාම නිලධාරීන් සඳහා නිර්මාණය කර ඇත. සිංහල, දෙමළ, ඉංග්‍රීසි සහ Singlish/Tanglish ක්ෂේත්‍ර වාර්තා ප්‍රමුඛතා පෝලිම් බවට පත් කරයි.',
                'கண்டி, நுவரெலியா மற்றும் மாத்தளை மாவட்டங்களின் பிரதேச செயலக ஒருங்கிணைப்பாளர்கள் மற்றும் கிராம அலுவலர்களுக்காக உருவாக்கப்பட்டது.'
              )}
            </p>

            {/* Governance & Audit Callout */}
            <div className="space-y-1.5 border-l-2 border-[#0B2A6F] pl-3 text-xs">
              <div className="font-semibold text-slate-800">
                {t.footerNotice}
              </div>
              <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 font-mono tabular-nums">
                <span>
                  {casesCount} {tr(lang, 'Cases', 'සිදුවීම්', 'நிகழ்வுகள்')}
                </span>
                <span aria-hidden="true">·</span>
                <span>
                  {reportsCount} {tr(lang, 'Reports', 'වාර්තා', 'அறிக்கைகள்')}
                </span>
                <span aria-hidden="true">·</span>
                <span>
                  {quietAreaCount}{' '}
                  {tr(lang, 'Quiet GN', 'නිහඬ ග්‍රා.නි.', 'மௌன கி.அ.')}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  onNavigate('ledger');
                  handleScrollTop();
                }}
                className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#0B2A6F] hover:underline"
              >
                {ledgerIntact ? (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    <span>
                      {tr(
                        lang,
                        `SHA-256 Chain Intact (${ledgerCount} Verified Blocks)`,
                        `SHA-256 දාමය සුරක්ෂිතයි (සටහන් ${ledgerCount})`,
                        `SHA-256 சங்கிலி பாதுகாப்பானது (${ledgerCount} பதிவுகள்)`
                      )}
                    </span>
                  </>
                ) : (
                  <>
                    <ShieldAlert className="h-3.5 w-3.5 text-red-600" />
                    <span className="text-red-700">
                      {tr(
                        lang,
                        'SHA-256 Ledger Integrity Alert — Inspect Now',
                        'SHA-256 ලෙජරයේ වෙනස්කමක් හඳුනාගැනුණි — පරීක්ෂා කරන්න',
                        'SHA-256 பதிவேடு எச்சரிக்கை — உடனே ஆய்வு செய்க'
                      )}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Column 2: Field Triage & Operations (3 cols) */}
          <div className="space-y-3 lg:col-span-3">
            <h3 className="text-xs font-semibold text-slate-900">
              {tr(
                lang,
                '01. Field Triage & Operations',
                '01. ක්ෂේත්‍ර ප්‍රමුඛතා සහ මෙහෙයුම්',
                '01. கள முன்னுரிமை & செயல்பாடுகள்'
              )}
            </h3>
            <ul className="space-y-2 text-xs">
              {(
                [
                  { id: 'overview', label: t.nav.overview, shortcut: 'Alt+1' },
                  {
                    id: 'dashboard',
                    label: t.nav.dashboard,
                    shortcut: 'Alt+2',
                  },
                  { id: 'submit', label: t.nav.submit, shortcut: 'Alt+3' },
                  {
                    id: 'caseDetail',
                    label: t.nav.caseDetail,
                    shortcut: 'Alt+4',
                  },
                  {
                    id: 'silenceRadar',
                    label: t.nav.silenceRadar,
                    shortcut: 'Alt+5',
                  },
                ] as const
              ).map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => {
                      onNavigate(item.id);
                      handleScrollTop();
                    }}
                    className={`flex w-full items-center justify-between text-left transition-colors hover:text-[#0B2A6F] hover:underline ${
                      activeScreen === item.id
                        ? 'font-semibold text-[#0B2A6F]'
                        : 'text-slate-600'
                    }`}
                  >
                    <span className="truncate pr-2">{item.label}</span>
                    <span className="font-mono text-[10px] text-slate-400 shrink-0">
                      {item.shortcut}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Audit, Intelligence & Coordinator Tools (3 cols) */}
          <div className="space-y-3 lg:col-span-3">
            <h3 className="text-xs font-semibold text-slate-900">
              {tr(
                lang,
                '02. Audit, Intelligence & Tools',
                '02. විගණන, බුද්ධිමය සහ නිලධාරී මෙවලම්',
                '02. தணிக்கை, நுண்ணறிவு & கருவிகள்'
              )}
            </h3>
            <ul className="space-y-2 text-xs">
              {(
                [
                  { id: 'summary', label: t.nav.summary, shortcut: 'Alt+6' },
                  { id: 'ledger', label: t.nav.ledger, shortcut: 'Alt+7' },
                  { id: 'aiHub', label: t.nav.aiHub, shortcut: 'Alt+8' },
                  {
                    id: 'evaluation',
                    label: t.nav.evaluation,
                    shortcut: 'Alt+9',
                  },
                ] as const
              ).map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => {
                      onNavigate(item.id);
                      handleScrollTop();
                    }}
                    className={`flex w-full items-center justify-between text-left transition-colors hover:text-[#0B2A6F] hover:underline ${
                      activeScreen === item.id
                        ? 'font-semibold text-[#0B2A6F]'
                        : 'text-slate-600'
                    }`}
                  >
                    <span className="truncate pr-2">{item.label}</span>
                    <span className="font-mono text-[10px] text-slate-400 shrink-0">
                      {item.shortcut}
                    </span>
                  </button>
                </li>
              ))}
            </ul>

            <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={onOpenCommandPalette}
                className="inline-flex items-center gap-1.5 rounded border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-700 hover:border-[#0B2A6F] hover:text-[#0B2A6F]"
              >
                <Command className="h-3 w-3" />
                <span>
                  {tr(lang, 'Command (Ctrl+K)', 'විධාන (Ctrl+K)', 'கட்டளை (Ctrl+K)')}
                </span>
              </button>
              <button
                type="button"
                onClick={onOpenOfficerPortal}
                className="inline-flex items-center gap-1.5 rounded border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-700 hover:border-[#0B2A6F] hover:text-[#0B2A6F]"
              >
                <UserCheck className="h-3 w-3" />
                <span>
                  {tr(lang, 'Officer Portal', 'නිලධාරී ද්වාරය', 'அதிகாரி தளம்')}
                </span>
              </button>
              <button
                type="button"
                onClick={onExportWorkspaceSnapshot}
                className="inline-flex items-center gap-1.5 rounded border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-700 hover:border-[#0B2A6F] hover:text-[#0B2A6F]"
              >
                <Download className="h-3 w-3" />
                <span>
                  {tr(lang, 'Export JSON', 'JSON බාගන්න', 'JSON பதிவிறக்கு')}
                </span>
              </button>
            </div>
          </div>

          {/* Column 4: Official National Disaster Portals (2 cols) */}
          <div className="space-y-3 lg:col-span-2">
            <h3 className="text-xs font-semibold text-slate-900">
              {tr(
                lang,
                '03. Official Agencies',
                '03. නිල ආපදා ආයතන',
                '03. அதிகாரப்பூர்வ நிறுவனங்கள்'
              )}
            </h3>
            <ul className="space-y-2 text-xs">
              <li>
                <a
                  href="https://www.dmc.gov.lk/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-slate-600 hover:text-[#0B2A6F] hover:underline"
                >
                  <span>DMC Sri Lanka</span>
                  <ExternalLink className="h-3 w-3 text-slate-400" />
                </a>
              </li>
              <li>
                <a
                  href="https://www.nbro.gov.lk/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-slate-600 hover:text-[#0B2A6F] hover:underline"
                >
                  <span>NBRO Landslide Watch</span>
                  <ExternalLink className="h-3 w-3 text-slate-400" />
                </a>
              </li>
              <li>
                <a
                  href="https://www.meteo.gov.lk/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-slate-600 hover:text-[#0B2A6F] hover:underline"
                >
                  <span>Dept. of Meteorology</span>
                  <ExternalLink className="h-3 w-3 text-slate-400" />
                </a>
              </li>
              <li>
                <a
                  href="https://www.irrigation.gov.lk/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-slate-600 hover:text-[#0B2A6F] hover:underline"
                >
                  <span>Dept. of Irrigation</span>
                  <ExternalLink className="h-3 w-3 text-slate-400" />
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Legal, Language, Theme & Scroll-to-Top Bar */}
      <div className="border-t border-slate-200 bg-slate-50/70 px-4 py-3.5 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between text-xs text-slate-500">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="font-semibold text-slate-700">
              © {new Date().getFullYear()} DisaLink AI
            </span>
            <span aria-hidden="true">·</span>
            <span>
              {tr(
                lang,
                'Central Province Divisional Secretariat Decision Support (Never Dispatches Resources)',
                'මධ්‍යම පළාත් ප්‍රාදේශීය ලේකම් කාර්යාලයීය තීරණ සහාය පද්ධතිය (ස්වයංක්‍රීයව සම්පත් පිටත් නොකරයි)',
                'மத்திய மாகாண பிரதேச செயலக தீர்மான ஆதரவு அமைப்பு (தன்னிச்சையாக வளங்களை அனுப்பாது)'
              )}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Quick Language Switcher */}
            <div className="flex items-center gap-1.5 font-medium">
              <button
                type="button"
                onClick={() => onChangeLang('en')}
                className={`hover:text-[#0B2A6F] ${
                  lang === 'en' ? 'font-bold text-[#0B2A6F] underline' : ''
                }`}
              >
                English
              </button>
              <span aria-hidden="true">·</span>
              <button
                type="button"
                onClick={() => onChangeLang('si')}
                className={`hover:text-[#0B2A6F] ${
                  lang === 'si' ? 'font-bold text-[#0B2A6F] underline' : ''
                }`}
              >
                සිංහල
              </button>
              <span aria-hidden="true">·</span>
              <button
                type="button"
                onClick={() => onChangeLang('ta')}
                className={`hover:text-[#0B2A6F] ${
                  lang === 'ta' ? 'font-bold text-[#0B2A6F] underline' : ''
                }`}
              >
                தமிழ்
              </button>
            </div>

            <span className="text-slate-300" aria-hidden="true">
              |
            </span>

            {/* Theme Switcher */}
            <button
              type="button"
              onClick={onToggleTheme}
              className="inline-flex items-center gap-1 font-medium text-slate-600 hover:text-[#0B2A6F]"
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="h-3.5 w-3.5 text-amber-500" />
                  <span>
                    {tr(lang, 'Daylight Mode', 'දිවා තේමාව', 'பகல் பயன்முறை')}
                  </span>
                </>
              ) : (
                <>
                  <Moon className="h-3.5 w-3.5 text-slate-600" />
                  <span>
                    {tr(lang, 'Night Mode', 'රාත්‍රී තේමාව', 'இரவு பயன்முறை')}
                  </span>
                </>
              )}
            </button>

            <span className="text-slate-300" aria-hidden="true">
              |
            </span>

            {/* Reset Demo Data */}
            <button
              type="button"
              onClick={onResetDemo}
              className="inline-flex items-center gap-1 font-medium text-slate-600 hover:text-[#0B2A6F]"
            >
              <RotateCcw className="h-3 w-3" />
              <span>{t.status.resetDemo}</span>
            </button>

            <span className="text-slate-300" aria-hidden="true">
              |
            </span>

            {/* Scroll to Top */}
            <button
              type="button"
              onClick={handleScrollTop}
              className="inline-flex items-center gap-1 font-semibold text-[#0B2A6F] hover:underline"
            >
              <ArrowUp className="h-3.5 w-3.5" />
              <span>{tr(lang, 'Top', 'ඉහළට', 'மேலே')}</span>
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
