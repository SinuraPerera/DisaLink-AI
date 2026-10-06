import React, { useEffect, useMemo, useState } from 'react';
import {
  GNSilenceEvaluation,
  IncidentCase,
  Report,
  ThemeMode,
  UILanguage,
} from '../types';
import {
  UI_TRANSLATIONS,
  localizeGNName,
  localizePlace,
  tr,
} from '../lib/i18n';
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Command,
  Download,
  FileSpreadsheet,
  FolderKanban,
  Globe,
  LayoutDashboard,
  Moon,
  PlusCircle,
  Radio,
  Search,
  ShieldCheck,
  Sparkles,
  Sun,
  UserCheck,
  WifiOff,
  X,
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

interface CommandPaletteModalProps {
  isOpen: boolean;
  lang: UILanguage;
  theme: ThemeMode;
  cases: IncidentCase[];
  reports: Report[];
  quietAreas: GNSilenceEvaluation[];
  simulateOffline: boolean;
  onClose: () => void;
  onNavigate: (screen: ScreenId) => void;
  onSelectCase: (caseId: string) => void;
  onToggleTheme: () => void;
  onChangeLang: (lang: UILanguage) => void;
  onToggleOffline: () => void;
  onOpenOfficerPortal: () => void;
  onExportWorkspaceSnapshot: () => void;
}

export const CommandPaletteModal: React.FC<CommandPaletteModalProps> = ({
  isOpen,
  lang,
  theme,
  cases,
  quietAreas,
  simulateOffline,
  onClose,
  onNavigate,
  onSelectCase,
  onToggleTheme,
  onChangeLang,
  onToggleOffline,
  onOpenOfficerPortal,
  onExportWorkspaceSnapshot,
}) => {
  const [query, setQuery] = useState('');
  const t = UI_TRANSLATIONS[lang];

  useEffect(() => {
    if (isOpen) {
      setQuery('');
    }
  }, [isOpen]);

  const actions = useMemo(() => {
    const navItems = [
      {
        id: 'nav-dashboard',
        category: tr(lang, 'Navigation', 'පිටු යොමුව', 'வழிசெலுத்தல்'),
        title: t.nav.dashboard,
        subtitle: tr(
          lang,
          'Act Now, Verify Fast & Watch triage queues + interactive district map',
          'ප්‍රමුඛතා පෝලිම් 3 සහ දිස්ත්‍රික් සිතියම',
          'முன்னுரிமை வரிசைகள் மற்றும் மாவட்ட வரைபடம்'
        ),
        shortcut: 'Alt+2',
        icon: LayoutDashboard,
        run: () => {
          onNavigate('dashboard');
          onClose();
        },
      },
      {
        id: 'nav-submit',
        category: tr(lang, 'Navigation', 'පිටු යොමුව', 'வழிசெலுத்தல்'),
        title: t.nav.submit,
        subtitle: tr(
          lang,
          'Ingest Sinhala, Tamil, English, or Singlish/Tanglish reports',
          'සිංහල, දෙමළ, ඉංග්‍රීසි හෝ Singlish/Tanglish වාර්තා ඇතුළත් කරන්න',
          'சிங்களம், தமிழ், ஆங்கிலம் அல்லது தங்கிலீஷ் அறிக்கைகளை உள்ளிடவும்'
        ),
        shortcut: 'Alt+3',
        icon: PlusCircle,
        run: () => {
          onNavigate('submit');
          onClose();
        },
      },
      {
        id: 'nav-silence',
        category: tr(lang, 'Navigation', 'පිටු යොමුව', 'வழிசெலுத்தல்'),
        title: t.nav.silenceRadar,
        subtitle: tr(
          lang,
          'Inspect GN divisions with Poisson tail p < 0.05 communication blackout',
          'Poisson p < 0.05 මගින් හඳුනාගත් නිහඬ ග්‍රාම නිලධාරී වසම්',
          'Poisson p < 0.05 மூலம் கண்டறியப்பட்ட மௌனப் பிரிவுகள்'
        ),
        shortcut: 'Alt+5',
        icon: Radio,
        run: () => {
          onNavigate('silenceRadar');
          onClose();
        },
      },
      {
        id: 'nav-ledger',
        category: tr(lang, 'Navigation', 'පිටු යොමුව', 'வழிசெலுத்தல்'),
        title: t.nav.ledger,
        subtitle: tr(
          lang,
          'Verify SHA-256 cryptographic hash chain & human coordinator attributions',
          'SHA-256 ආරක්ෂිත දාමය සහ නිලධාරී තීරණ පරීක්ෂා කරන්න',
          'SHA-256 சங்கிலி பாதுகாப்பு மற்றும் அதிகாரி முடிவுகளை சரிபார்க்கவும்'
        ),
        shortcut: 'Alt+7',
        icon: ShieldCheck,
        run: () => {
          onNavigate('ledger');
          onClose();
        },
      },
      {
        id: 'nav-aihub',
        category: tr(lang, 'Navigation', 'පිටු යොමුව', 'வழிசெலுத்தல்'),
        title: t.nav.aiHub,
        subtitle: tr(
          lang,
          'Gemini Assistant, Live Voice, Google Search/Maps Grounding & Cloud Vault',
          'Gemini සහායක, සජීවී හඬ, සෙවුම්/සිතියම් තොරතුරු සහ Cloud ගබඩාව',
          'Gemini உதவியாளர், நேரடி குரல், தேடல்/வரைபட விவரங்கள் மற்றும் Cloud'
        ),
        shortcut: 'Alt+8',
        icon: Sparkles,
        run: () => {
          onNavigate('aiHub');
          onClose();
        },
      },
      {
        id: 'nav-summary',
        category: tr(lang, 'Navigation', 'පිටු යොමුව', 'வழிசெலுத்தல்'),
        title: t.nav.summary,
        subtitle: tr(
          lang,
          'Generate [R-xxx] sourced Situation Reports with Uncertainty section',
          '[R-xxx] මූලාශ්‍ර සහිත නිල තත්ත්ව වාර්තා උත්පාදනය කරන්න',
          '[R-xxx] ஆதாரங்களுடன் கூடிய நிலைமை அறிக்கைகளை உருவாக்கவும்'
        ),
        shortcut: 'Alt+6',
        icon: FileSpreadsheet,
        run: () => {
          onNavigate('summary');
          onClose();
        },
      },
      {
        id: 'nav-eval',
        category: tr(lang, 'Navigation', 'පිටු යොමුව', 'வழிசெலுத்தல்'),
        title: t.nav.evaluation,
        subtitle: tr(
          lang,
          '20-item multilingual extraction benchmark & safety rule verification',
          'වාර්තා 20ක බහුභාෂා නිරවද්‍යතා ඇගයීම',
          '20-உருப்படி பன்மொழி துல்லிய மதிப்பீடு'
        ),
        shortcut: 'Alt+9',
        icon: BarChart3,
        run: () => {
          onNavigate('evaluation');
          onClose();
        },
      },
      {
        id: 'nav-overview',
        category: tr(lang, 'Navigation', 'පිටු යොමුව', 'வழிசெலுத்தல்'),
        title: t.nav.overview,
        subtitle: tr(
          lang,
          'System architecture, Cyclone Ditwah context & interactive walkthrough',
          'පද්ධති ව්‍යුහය සහ Cyclone Ditwah පසුබිම',
          'கணினி கட்டமைப்பு மற்றும் Cyclone Ditwah பின்னணி'
        ),
        shortcut: 'Alt+1',
        icon: BookOpen,
        run: () => {
          onNavigate('overview');
          onClose();
        },
      },
    ];

    const quickOps = [
      {
        id: 'op-officer',
        category: tr(
          lang,
          'System & Officer Controls',
          'නිලධාරී සහ පද්ධති පාලන',
          'அதிகாரி மற்றும் கணினி கட்டுப்பாடுகள்'
        ),
        title: tr(
          lang,
          'Open Officer Registration & Login Portal',
          'නිලධාරී ලියාපදිංචි සහ පිවිසුම් ද්වාරය විවෘත කරන්න',
          'அதிகாரி பதிவு மற்றும் உள்நுழைவு நுழைவாயிலைத் திறக்கவும்'
        ),
        subtitle: tr(
          lang,
          'Google Cloud SSO, Division Badge Login, or Register New Officer',
          'Google Cloud SSO, නිල හැඳුනුම්පත් පිවිසුම හෝ නව ලියාපදිංචිය',
          'Google Cloud SSO, அடையாள எண் உள்நுழைவு அல்லது புதிய பதிவு'
        ),
        shortcut: 'Auth',
        icon: UserCheck,
        run: () => {
          onClose();
          onOpenOfficerPortal();
        },
      },
      {
        id: 'op-theme',
        category: tr(
          lang,
          'System & Officer Controls',
          'නිලධාරී සහ පද්ධති පාලන',
          'அதிகாரி மற்றும் கணினி கட்டுப்பாடுகள்'
        ),
        title:
          theme === 'dark'
            ? tr(
                lang,
                'Switch to Daylight Theme (Light Mode)',
                'දිවා ආලෝක තේමාවට මාරු වන්න (Light Mode)',
                'பகல் வெளிச்சத் தோற்றத்திற்கு மாற்றுக (Light Mode)'
              )
            : tr(
                lang,
                'Switch to Night Operations Theme (Dark Mode)',
                'රාත්‍රී මෙහෙයුම් අඳුරු තේමාවට මාරු වන්න (Dark Mode)',
                'இரவு செயல்பாட்டு இருள் தோற்றத்திற்கு மாற்றுக (Dark Mode)'
              ),
        subtitle: tr(
          lang,
          'High-contrast Carbon-Slate / Daylight surface toggle',
          'දිවා / රාත්‍රී මෙහෙයුම් තේමා මාරුව',
          'பகல் / இரவு செயல்பாட்டுத் தோற்றம்'
        ),
        shortcut: 'Theme',
        icon: theme === 'dark' ? Sun : Moon,
        run: () => {
          onToggleTheme();
          onClose();
        },
      },
      {
        id: 'op-offline',
        category: tr(
          lang,
          'System & Officer Controls',
          'නිලධාරී සහ පද්ධති පාලන',
          'அதிகாரி மற்றும் கணினி கட்டுப்பாடுகள்'
        ),
        title: simulateOffline
          ? tr(
              lang,
              'Reconnect & Auto-Sync Offline Queue',
              'නැවත සම්බන්ධ වී Offline පෝලිම සමමුහුර්ත කරන්න',
              'மீண்டும் இணைத்து Offline வரிசையை ஒத்திசைக்கவும்'
            )
          : tr(
              lang,
              'Simulate Offline Queue Mode (IndexedDB)',
              'Offline පෝලිම් ප්‍රකාරය අත්හදා බලන්න (IndexedDB)',
              'Offline வரிசை முறையை உருவகப்படுத்துக (IndexedDB)'
            ),
        subtitle: tr(
          lang,
          'Test zero-loss idempotent report queuing during tower blackouts',
          'සන්නිවේදන බිඳවැටීම්වලදී දත්ත සුරැකීම පරීක්ෂා කරන්න',
          'தொடர்பு துண்டிப்பின் போது தரவு சேமிப்பை சோதிக்கவும்'
        ),
        shortcut: 'Queue',
        icon: WifiOff,
        run: () => {
          onToggleOffline();
          onClose();
        },
      },
      {
        id: 'op-export-snapshot',
        category: tr(
          lang,
          'System & Officer Controls',
          'නිලධාරී සහ පද්ධති පාලන',
          'அதிகாரி மற்றும் கணினி கட்டுப்பாடுகள்'
        ),
        title: tr(
          lang,
          'Export Full Divisional Operational Snapshot (.JSON)',
          'සම්පූර්ණ මෙහෙයුම් දත්ත පිටපත බාගන්න (.JSON)',
          'முழு செயல்பாட்டு தரவு தொகுப்பைப் பதிவிறக்குக (.JSON)'
        ),
        subtitle: tr(
          lang,
          'Download all cases, reports, silence telemetry & SHA-256 ledger for handoff',
          'සියලුම සිදුවීම්, වාර්තා සහ SHA-256 ලෙජරය JSON ගොනුවක් ලෙස බාගන්න',
          'அனைத்து சம்பவங்கள், அறிக்கைகள் மற்றும் SHA-256 பதிவேட்டை JSON ஆகப் பதிவிறக்கவும்'
        ),
        shortcut: 'JSON',
        icon: Download,
        run: () => {
          onExportWorkspaceSnapshot();
          onClose();
        },
      },
      {
        id: 'op-lang-cycle',
        category: tr(
          lang,
          'System & Officer Controls',
          'නිලධාරී සහ පද්ධති පාලන',
          'அதிகாரி மற்றும் கணினி கட்டுப்பாடுகள்'
        ),
        title: tr(
          lang,
          'Switch Language: English / සිංහල / தமிழ்',
          'භාෂාව මාරු කරන්න: English / සිංහල / தமிழ்',
          'மொழியை மாற்றுக: English / සිංහල / தமிழ்'
        ),
        subtitle: tr(
          lang,
          'Cycle active interface language across all 9 operational screens',
          'පද්ධතියේ භාෂාව ක්ෂණිකව මාරු කරන්න',
          'அனைத்து திரைகளின் மொழியையும் உடனடியாக மாற்றவும்'
        ),
        shortcut: lang.toUpperCase(),
        icon: Globe,
        run: () => {
          const next: UILanguage =
            lang === 'en' ? 'si' : lang === 'si' ? 'ta' : 'en';
          onChangeLang(next);
          onClose();
        },
      },
    ];

    const caseItems = cases.map((c) => ({
      id: `case-${c.id}`,
      category: tr(
        lang,
        'Active Incident Cases',
        'සක්‍රීය ආපදා සිදුවීම්',
        'செயலில் உள்ள சம்பவங்கள்'
      ),
      title: `${c.id} · ${localizePlace(c.place_english, lang)} (${t.incidentTypes[c.incident_type]})`,
      subtitle: `${tr(lang, 'Urgency', 'හදිසි බව', 'அவசரம்')}: ${c.urgency}/5 · Noisy-OR: ${(c.confidence * 100).toFixed(0)}% · ${c.reportIds.length} ${tr(lang, 'reports', 'වාර්තා', 'அறிக்கைகள்')}`,
      shortcut: c.queue === 'act_now' ? 'ACT NOW' : c.queue.toUpperCase(),
      icon: FolderKanban,
      run: () => {
        onSelectCase(c.id);
        onClose();
      },
    }));

    const silentItems = quietAreas
      .filter((g) => g.isQuiet)
      .map((g) => ({
        id: `gn-${g.id}`,
        category: tr(
          lang,
          'Flagged Silent GN Divisions',
          'නිහඬ ග්‍රාම නිලධාරී වසම්',
          'மௌனமான கிராம பிரிவுகள்'
        ),
        title: `${g.id} · ${localizeGNName(g.name, lang)}`,
        subtitle: `p = ${g.scaledPValue.toFixed(4)} · ${g.gnOfficerName} (${g.gnOfficerPhone})`,
        shortcut: 'SILENT',
        icon: Radio,
        run: () => {
          onNavigate('silenceRadar');
          onClose();
        },
      }));

    return [...navItems, ...quickOps, ...caseItems, ...silentItems];
  }, [
    lang,
    t,
    theme,
    simulateOffline,
    cases,
    quietAreas,
    onNavigate,
    onSelectCase,
    onToggleTheme,
    onChangeLang,
    onToggleOffline,
    onOpenOfficerPortal,
    onExportWorkspaceSnapshot,
    onClose,
  ]);

  const filtered = useMemo(() => {
    if (!query.trim()) return actions;
    const q = query.toLowerCase();
    return actions.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.subtitle.toLowerCase().includes(q) ||
        a.category.toLowerCase().includes(q) ||
        a.shortcut.toLowerCase().includes(q)
    );
  }, [actions, query]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-6 pt-14 sm:pt-20"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-2xl rounded-xl border border-slate-200 bg-white shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Header */}
        <div className="flex items-center gap-3 border-b border-slate-200 px-4 py-3">
          <Search className="h-4 w-4 text-[#0B2A6F] shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={tr(
              lang,
              'Search cases (C-001, Gelioya), silent GN divisions, screens, or officer commands...',
              'සිදුවීම් (C-001, ගෙලිඔය), නිහඬ වසම්, පිටු හෝ විධාන සොයන්න...',
              'சம்பவங்கள் (C-001, கெலிஓயா), மௌனப் பிரிவுகள், திரைகள் அல்லது கட்டளைகளைத் தேடுங்கள்...'
            )}
            className="w-full bg-transparent text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden"
          />
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-[65vh] overflow-y-auto divide-y divide-slate-100 p-2">
          {filtered.length === 0 ? (
            <div className="py-10 text-center text-xs text-slate-500">
              {tr(
                lang,
                'No matching cases, GN divisions, or commands found.',
                'ගැලපෙන සිදුවීම් හෝ විධාන හමු නොවීය.',
                'பொருந்தும் சம்பவங்கள் அல்லது கட்டளைகள் எதுவும் கிடைக்கவில்லை.'
              )}
            </div>
          ) : (
            filtered.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={item.run}
                  className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-slate-50 transition-colors group"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-[#0B2A6F] group-hover:border-[#0B2A6F]">
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                          {item.category}
                        </span>
                      </div>
                      <div className="text-xs font-semibold text-slate-900 truncate group-hover:text-[#0B2A6F]">
                        {item.title}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate">
                        {item.subtitle}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="rounded border border-slate-200 bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-slate-600">
                      {item.shortcut}
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-[#0B2A6F]" />
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer Shortcut Legend */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 bg-slate-50 px-4 py-2 text-[11px] text-slate-500">
          <div className="flex items-center gap-1.5">
            <Command className="h-3.5 w-3.5 text-[#0B2A6F]" />
            <span>
              {tr(
                lang,
                'Press Ctrl+K / Cmd+K anytime for instant Coordinator Command Palette',
                'ඕනෑම විටක ක්ෂණික විධාන පුවරුව සඳහා Ctrl+K / Cmd+K ඔබන්න',
                'எந்த நேரத்திலும் உடனடி கட்டளைப் பலகைக்கு Ctrl+K / Cmd+K ஐ அழுத்தவும்'
              )}
            </span>
          </div>
          <span className="font-mono text-[10px]">
            Alt+1..9 {tr(lang, 'Quick Screen Jump', 'ක්ෂණික පිටු මාරුව', 'விரைவுத் திரை மாற்றம்')}
          </span>
        </div>
      </div>
    </div>
  );
};
