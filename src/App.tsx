import React, { useCallback, useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import {
  CoordinatorProfile,
  GNArea,
  IncidentCase,
  LedgerEntry,
  OfflineQueuedReport,
  Report,
  SyncHistoryEvent,
  ThemeMode,
  UILanguage,
} from './types';
import { UI_TRANSLATIONS, tr } from './lib/i18n';
import {
  appendLedgerRecord,
  enqueueReportOffline,
  initAndSeedDatabase,
  loadAllData,
  markSilentGNAreaContacted,
  performCaseCoordinatorAction,
  saveAndMergeReport,
  simulateStormInSilenceRadar,
  syncOfflineQueuedReports,
  tamperWithRandomLedgerRecord,
} from './lib/db';
import {
  fetchCoordinatorProfileFromFirestore,
  getActiveCoordinatorProfile,
  setActiveCoordinatorProfile,
  signOutCoordinator,
  subscribeAuthState,
} from './lib/firebase';
import { evaluateAllGNAreas } from './lib/silence';
import { ChainVerificationResult, verifyLedgerChain } from './lib/ledger';
import { LandingScreen } from './components/LandingScreen';
import { DashboardScreen } from './components/DashboardScreen';
import { SubmitReportScreen } from './components/SubmitReportScreen';
import { CaseDetailScreen } from './components/CaseDetailScreen';
import { SilenceRadarScreen } from './components/SilenceRadarScreen';
import { AIIntelligenceHubScreen } from './components/AIIntelligenceHubScreen';
import { LedgerScreen } from './components/LedgerScreen';
import { SummaryScreen } from './components/SummaryScreen';
import { EvaluationScreen } from './components/EvaluationScreen';
import { PWAInstallButton } from './components/PWAInstallButton';
import { CoordinatorAuthModal } from './components/CoordinatorAuthModal';
import { CommandPaletteModal } from './components/CommandPaletteModal';
import { AppFooter } from './components/AppFooter';
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  BarChart3,
  BookOpen,
  CheckCircle2,
  ClipboardCheck,
  Command,
  Compass,
  FileSpreadsheet,
  FolderKanban,
  HelpCircle,
  LayoutDashboard,
  LogIn,
  LogOut,
  Menu,
  Moon,
  PlusCircle,
  Radio,
  RotateCcw,
  Search,
  ShieldCheck,
  Sparkles,
  Sun,
  UserCheck,
  UserPlus,
  Wifi,
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

function getWorkflowSteps(lang: UILanguage): Array<{
  step: number;
  title: string;
  screen: ScreenId;
  hint: string;
}> {
  return [
    {
      step: 1,
      title: tr(lang, 'Multilingual Intake', 'බහුභාෂා වාර්තා ඇතුළත් කිරීම', 'பன்மொழி அறிக்கை உள்ளீடு'),
      screen: 'submit',
      hint: tr(
        lang,
        'Ingest Sinhala, Tamil, English, or Singlish/Tanglish reports via form, WhatsApp, or SMS.',
        'සිංහල, දෙමළ, ඉංග්‍රීසි හෝ Singlish/Tanglish වාර්තා පෝරමය, WhatsApp හෝ SMS මගින් ඇතුළත් කරන්න.',
        'சிங்களம், தமிழ், ஆங்கிலம் அல்லது தங்கிலீஷ் அறிக்கைகளை படிவம், WhatsApp அல்லது SMS மூலம் உள்ளிடவும்.'
      ),
    },
    {
      step: 2,
      title: tr(lang, 'Case Merging & Noisy-OR', 'සිදුවීම් ඒකාබද්ධ කිරීම සහ Noisy-OR', 'சம்பவ இணைப்பு மற்றும் Noisy-OR'),
      screen: 'caseDetail',
      hint: tr(
        lang,
        'Inspect C = 1 - Π(1 - w_i) corroboration scores, Maps Grounding & coordinator overrides.',
        'C = 1 - Π(1 - w_i) විශ්වාසනීයත්ව ලකුණු, සිතියම් තහවුරු කිරීම් සහ නිලධාරී තීරණ පරීක්ෂා කරන්න.',
        'C = 1 - Π(1 - w_i) நம்பகத்தன்மை மதிப்பெண்கள், வரைபட சரிபார்ப்பு மற்றும் அதிகாரி முடிவுகளை ஆய்வு செய்க.'
      ),
    },
    {
      step: 3,
      title: tr(lang, 'Triage Queues & Map', 'ප්‍රමුඛතා පෝලිම් සහ සිතියම', 'முன்னுரிமை வரிசைகள் மற்றும் வரைபடம்'),
      screen: 'dashboard',
      hint: tr(
        lang,
        'Prioritize Act Now, Verify Fast & Watch queues alongside the auto-fitting district map.',
        'ස්වයංක්‍රීය දිස්ත්‍රික් සිතියම සමඟ ප්‍රමුඛතා පෝලිම් 3 නිරීක්ෂණය කරන්න.',
        'மாவட்ட வரைபடத்துடன் உடனடி நடவடிக்கை, விரைந்து சரிபார் மற்றும் கண்காணிப்பு வரிசைகளை நிர்வகிக்கவும்.'
      ),
    },
    {
      step: 4,
      title: tr(lang, 'Silence Radar', 'නිහඬතා රේඩාර් පද්ධතිය', 'மௌன ரேடார் அமைப்பு'),
      screen: 'silenceRadar',
      hint: tr(
        lang,
        'Run monsoon telemetry sweeps to detect cut-off GN divisions via Poisson tail p < 0.05.',
        'සන්නිවේදනය බිඳවැටුණු ග්‍රාම නිලධාරී වසම් Poisson p < 0.05 මගින් හඳුනා ගන්න.',
        'தொடர்பு துண்டிக்கப்பட்ட கிராம சேவகர் பிரிவுகளை Poisson p < 0.05 மூலம் கண்டறியவும்.'
      ),
    },
    {
      step: 5,
      title: tr(lang, 'SHA-256 Decision Ledger', 'SHA-256 තීරණ ලෙජරය', 'SHA-256 முடிவுப் பதிவேடு'),
      screen: 'ledger',
      hint: tr(
        lang,
        'Verify cryptographic hash chain integrity across all AI suggestions and coordinator decisions.',
        'සියලුම AI යෝජනා සහ නිලධාරී තීරණවල SHA-256 ආරක්ෂිත දාමය තහවුරු කරන්න.',
        'அனைத்து AI பரிந்துரைகள் மற்றும் அதிகாரி முடிவுகளின் SHA-256 சங்கிலி பாதுகாப்பை சரிபார்க்கவும்.'
      ),
    },
    {
      step: 6,
      title: tr(lang, 'AI Hub & Live Voice', 'AI මධ්‍යස්ථානය සහ සජීවී හඬ', 'AI மையம் மற்றும் நேரடி குரல்'),
      screen: 'aiHub',
      hint: tr(
        lang,
        'Multi-turn Gemini Assistant, Gemini 3.1 Live Voice, Search/Maps Grounding & Cloud Sync.',
        'Gemini සහායක, සජීවී හඬ සංවාද, සෙවුම්/සිතියම් තොරතුරු සහ Cloud සමමුහුර්තකරණය.',
        'Gemini உதவியாளர், நேரடி குரல் உரையாடல், தேடல்/வரைபட விவரங்கள் மற்றும் Cloud ஒத்திசைவு.'
      ),
    },
    {
      step: 7,
      title: tr(lang, 'Sourced SitRep & Calibration', 'මූලාශ්‍ර සහිත තත්ත්ව වාර්තාව', 'ஆதாரங்களுடன் கூடிய நிலைமை அறிக்கை'),
      screen: 'summary',
      hint: tr(
        lang,
        'Generate [R-xxx] sourced Situation Reports with Uncertainty tracking and model calibration.',
        '[R-xxx] මූලාශ්‍ර සහිත නිල තත්ත්ව වාර්තා සහ නිරවද්‍යතා ඇගයීම් උත්පාදනය කරන්න.',
        '[R-xxx] ஆதாரங்களுடன் கூடிய நிலைமை அறிக்கைகள் மற்றும் துல்லிய மதிப்பீட்டை உருவாக்கவும்.'
      ),
    },
  ];
}

export default function App() {
  const [lang, setLang] = useState<UILanguage>('en');
  const [theme, setTheme] = useState<ThemeMode>(() => {
    try {
      const saved = localStorage.getItem('disalink_theme_v1');
      if (saved === 'dark' || saved === 'light') return saved;
    } catch {}
    return 'light';
  });
  const [activeScreen, setActiveScreen] = useState<ScreenId>('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showDemoGuide, setShowDemoGuide] = useState(false);

  // Firebase Auth & Coordinator Profile state
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [activeProfile, setActiveProfile] = useState<CoordinatorProfile | null>(
    () => getActiveCoordinatorProfile()
  );
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<
    'login' | 'register' | 'profile'
  >('login');
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [showQuickHelper, setShowQuickHelper] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [prefillTranscriptText, setPrefillTranscriptText] = useState<
    string | null
  >(null);

  const triggerToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 4000);
  }, []);

  // Global keyboard shortcuts: Ctrl+K / Cmd+K for Command Palette, Alt+1..9 for screen jump
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      } else if (e.key === 'Escape') {
        setCommandPaletteOpen(false);
      } else if (e.altKey && !e.ctrlKey && !e.metaKey) {
        const screenMap: Record<string, ScreenId> = {
          '1': 'overview',
          '2': 'dashboard',
          '3': 'submit',
          '4': 'caseDetail',
          '5': 'silenceRadar',
          '6': 'summary',
          '7': 'ledger',
          '8': 'aiHub',
          '9': 'evaluation',
        };
        if (screenMap[e.key]) {
          e.preventDefault();
          setActiveScreen(screenMap[e.key]);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      localStorage.setItem('disalink_theme_v1', theme);
    } catch {}
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => {
      const next = prev === 'light' ? 'dark' : 'light';
      triggerToast(
        next === 'dark'
          ? tr(
              lang,
              'Switched to Night Operations Dark Theme',
              'රාත්‍රී මෙහෙයුම් අඳුරු තේමාව සක්‍රීය විය',
              'இரவு செயல்பாட்டு இருள் தோற்றம் செயல்படுத்தப்பட்டது'
            )
          : tr(
              lang,
              'Switched to Daylight Light Theme',
              'දිවා ආලෝක තේමාව සක්‍රීය විය',
              'பகல் வெளிச்சத் தோற்றம் செயல்படுத்தப்பட்டது'
            )
      );
      return next;
    });
  };

  // Data state backed by IndexedDB
  const [isLoading, setIsLoading] = useState(true);
  const [reports, setReports] = useState<Report[]>([]);
  const [cases, setCases] = useState<IncidentCase[]>([]);
  const [offlineQueue, setOfflineQueue] = useState<OfflineQueuedReport[]>([]);
  const [syncHistory, setSyncHistory] = useState<SyncHistoryEvent[]>([]);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [gnAreas, setGnAreas] = useState<GNArea[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>('C-001');

  // Chain verification state
  const [chainVerification, setChainVerification] =
    useState<ChainVerificationResult>({
      valid: true,
      totalChecked: 0,
      tamperedIndex: null,
      tamperedEntryId: null,
    });

  // Connectivity & "Simulate offline" demo state
  const [browserOnline, setBrowserOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [simulateOffline, setSimulateOffline] = useState<boolean>(false);
  const [syncBanner, setSyncBanner] = useState<string | null>(null);

  const isEffectiveOffline = !browserOnline || simulateOffline;
  const t = UI_TRANSLATIONS[lang];

  useEffect(() => {
    const unsub = subscribeAuthState(async (u) => {
      setFirebaseUser(u);
      if (u) {
        const cloudProfile = await fetchCoordinatorProfileFromFirestore(u.uid);
        if (cloudProfile) {
          setActiveCoordinatorProfile(cloudProfile);
          setActiveProfile(cloudProfile);
        } else {
          const existingLocal = getActiveCoordinatorProfile();
          if (!existingLocal) {
            const now = new Date().toISOString();
            const fallbackProfile: CoordinatorProfile = {
              uid: u.uid,
              fullName: u.displayName || 'Divisional Coordinator',
              email: u.email || '',
              role: 'DS Coordinator',
              division: 'Passara DS',
              district: 'Badulla',
              badgeNumber: `DMC-${u.uid.slice(0, 6).toUpperCase()}`,
              dutyStatus: 'on_duty',
              authMethod: 'google',
              createdAt: now,
              updatedAt: now,
            };
            setActiveCoordinatorProfile(fallbackProfile);
            setActiveProfile(fallbackProfile);
          }
        }
      }
    });
    return () => unsub();
  }, []);

  const refreshStateFromDB = useCallback(async () => {
    const snapshot = await loadAllData();
    setReports(snapshot.reports);
    setCases(snapshot.cases);
    setOfflineQueue(snapshot.offlineQueue);
    setSyncHistory(snapshot.syncHistory);
    setLedger(snapshot.ledger);
    setGnAreas(snapshot.gnAreas);

    const verification = await verifyLedgerChain(snapshot.ledger);
    setChainVerification(verification);
  }, []);

  // Initialize & seed IndexedDB on first load
  useEffect(() => {
    let mounted = true;
    (async () => {
      setIsLoading(true);
      const snapshot = await initAndSeedDatabase(false);
      if (!mounted) return;
      setReports(snapshot.reports);
      setCases(snapshot.cases);
      setOfflineQueue(snapshot.offlineQueue);
      setSyncHistory(snapshot.syncHistory);
      setLedger(snapshot.ledger);
      setGnAreas(snapshot.gnAreas);
      if (snapshot.cases.length > 0) {
        setSelectedCaseId(snapshot.cases[0].id);
      }
      const verification = await verifyLedgerChain(snapshot.ledger);
      setChainVerification(verification);
      setIsLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Track real browser online/offline events
  useEffect(() => {
    const handleOnline = () => setBrowserOnline(true);
    const handleOffline = () => setBrowserOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Automatically sync offline queue when connectivity returns
  useEffect(() => {
    if (!isEffectiveOffline && offlineQueue.length > 0) {
      (async () => {
        setSyncBanner(
          tr(
            lang,
            `Connection restored — syncing ${offlineQueue.length} offline report(s) and running Gemini extraction...`,
            `අන්තර්ජාල සම්බන්ධතාවය යථා තත්ත්වයට පත් විය — Offline වාර්තා ${offlineQueue.length}ක් සමමුහුර්ත කරමින්...`,
            `இணைய இணைப்பு மீட்டமைக்கப்பட்டது — ${offlineQueue.length} Offline அறிக்கைகள் ஒத்திசைக்கப்படுகின்றன...`
          )
        );
        const syncedCount = await syncOfflineQueuedReports();
        await refreshStateFromDB();
        if (syncedCount > 0) {
          setSyncBanner(
            tr(
              lang,
              `Synced ${syncedCount} queued offline report(s) with zero duplicates or losses. AI extraction and case merging complete.`,
              `Offline පෝලිමේ තිබූ වාර්තා ${syncedCount}ක් අනුපිටපත් හෝ හානියකින් තොරව සමමුහුර්ත කරන ලදී. AI විශ්ලේෂණය සහ ඒකාබද්ධ කිරීම අවසන්.`,
              `வரிசையில் இருந்த ${syncedCount} அறிக்கைகள் நகல்கள் இன்றி ஒத்திசைக்கப்பட்டன. AI பிரித்தெடுப்பு மற்றும் இணைப்பு முடிந்தது.`
            )
          );
          setTimeout(() => setSyncBanner(null), 6000);
        } else {
          setSyncBanner(null);
        }
      })();
    }
  }, [isEffectiveOffline, offlineQueue.length, refreshStateFromDB, lang]);

  const handleResetDemo = async () => {
    setIsLoading(true);
    setSimulateOffline(false);
    const snapshot = await initAndSeedDatabase(true);
    setReports(snapshot.reports);
    setCases(snapshot.cases);
    setOfflineQueue(snapshot.offlineQueue);
    setSyncHistory(snapshot.syncHistory);
    setLedger(snapshot.ledger);
    setGnAreas(snapshot.gnAreas);
    if (snapshot.cases.length > 0) {
      setSelectedCaseId(snapshot.cases[0].id);
    }
    const verification = await verifyLedgerChain(snapshot.ledger);
    setChainVerification(verification);
    setIsLoading(false);
  };

  const handleExportWorkspaceSnapshot = () => {
    const snapshot = {
      exportedAt: new Date().toISOString(),
      system: 'DisaLink AI — Divisional Secretariat Decision-Support Layer',
      exportedBy: activeProfile || {
        role: 'DS Coordinator',
        division: 'Passara DS',
      },
      ledgerIntegrity: chainVerification,
      counts: {
        reports: reports.length,
        cases: cases.length,
        silentDivisions: evaluatedGNAreas.filter((g) => g.isQuiet).length,
        ledgerEntries: ledger.length,
        offlineQueue: offlineQueue.length,
      },
      cases,
      reports,
      silenceRadar: evaluatedGNAreas,
      ledger,
      syncHistory,
    };
    const blob = new Blob([JSON.stringify(snapshot, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `disalink-division-snapshot-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const evaluatedGNAreas = evaluateAllGNAreas(gnAreas);
  const quietAreaCount = evaluatedGNAreas.filter((g) => g.isQuiet).length;

  const navItems: Array<{
    id: ScreenId;
    label: string;
    icon: React.FC<{ className?: string }>;
    count?: number | string;
    section: 'operations' | 'intelligence';
  }> = [
    {
      id: 'overview',
      label: t.nav.overview,
      icon: BookOpen,
      section: 'operations',
    },
    {
      id: 'dashboard',
      label: t.nav.dashboard,
      icon: LayoutDashboard,
      count: cases.length,
      section: 'operations',
    },
    {
      id: 'submit',
      label: t.nav.submit,
      icon: PlusCircle,
      count: offlineQueue.length > 0 ? `${offlineQueue.length}Q` : undefined,
      section: 'operations',
    },
    {
      id: 'caseDetail',
      label: t.nav.caseDetail,
      icon: FolderKanban,
      section: 'operations',
    },
    {
      id: 'silenceRadar',
      label: t.nav.silenceRadar,
      icon: Radio,
      count: quietAreaCount,
      section: 'operations',
    },
    {
      id: 'summary',
      label: t.nav.summary,
      icon: FileSpreadsheet,
      section: 'intelligence',
    },
    {
      id: 'ledger',
      label: t.nav.ledger,
      icon: ShieldCheck,
      count: ledger.length,
      section: 'intelligence',
    },
    {
      id: 'aiHub',
      label: t.nav.aiHub,
      icon: Sparkles,
      count: 'LIVE',
      section: 'intelligence',
    },
    {
      id: 'evaluation',
      label: t.nav.evaluation,
      icon: BarChart3,
      count: 20,
      section: 'intelligence',
    },
  ];

  const operationalNavItems = navItems.filter(
    (item) => item.section === 'operations'
  );
  const intelligenceNavItems = navItems.filter(
    (item) => item.section === 'intelligence'
  );

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Synthetic Data & Non-Dispatch Safety Banner */}
      <div className="bg-[#0B2A6F] px-3 py-1.5 text-center text-[11px] sm:text-xs font-medium text-white">
        {t.syntheticBanner}
      </div>

      {/* Offline Auto-Sync Notification Banner */}
      {syncBanner && (
        <div className="bg-emerald-700 px-4 py-2 text-center text-xs font-medium text-white">
          {syncBanner}
        </div>
      )}

      {/* Top Header Bar: Clean Brand Wordmark + Essential Operational Controls */}
      <header className="sticky top-0 z-30 flex items-center justify-between gap-2 border-b border-slate-200 bg-white px-2.5 py-2 sm:px-4 sm:py-2.5 lg:px-6">
        {/* Left: Mobile Drawer Trigger + Brand Wordmark */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-md text-slate-600 hover:bg-slate-100 lg:hidden"
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveScreen('overview')}
            className="flex items-baseline gap-2 text-left min-w-0"
          >
            <span className="text-sm sm:text-lg font-bold tracking-tight text-[#0B2A6F] whitespace-nowrap truncate">
              {t.appName}
            </span>
            <span className="hidden xl:inline text-xs text-slate-500 truncate">
              {t.tagline}
            </span>
          </button>
        </div>

        {/* Right: Persistent Online/Offline Badge + Simulate Offline Toggle + Language + Demo Guide */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* Persistent Online/Offline Status Indicator */}
          <div
            className={`flex items-center gap-1 rounded-md border px-1.5 sm:px-2.5 py-1 text-[11px] sm:text-xs font-semibold whitespace-nowrap ${
              isEffectiveOffline
                ? 'border-amber-300 bg-amber-50 text-amber-800'
                : 'border-emerald-200 bg-emerald-50 text-emerald-800'
            }`}
          >
            {isEffectiveOffline ? (
              <>
                <WifiOff className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                <span className="hidden md:inline">
                  {simulateOffline
                    ? t.status.simulatedOffline
                    : t.status.offline}
                </span>
                <span className="hidden sm:inline md:hidden">Offline</span>
              </>
            ) : (
              <>
                <Wifi className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                <span className="hidden sm:inline">{t.status.online}</span>
              </>
            )}
          </div>

          {/* Simulate Offline Toggle Button (Visible on sm+, and inside mobile drawer on < sm) */}
          <button
            type="button"
            onClick={() => setSimulateOffline(!simulateOffline)}
            className={`hidden sm:inline-flex items-center gap-1 rounded-md border px-2 sm:px-2.5 py-1 text-[11px] sm:text-xs font-medium transition-colors whitespace-nowrap ${
              simulateOffline
                ? 'border-amber-600 bg-amber-600 text-white'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            <span className="hidden lg:inline">
              {t.status.simulateOfflineToggle}:{' '}
            </span>
            <span className="lg:hidden">Offline Sim: </span>
            <strong>{simulateOffline ? 'ON' : 'OFF'}</strong>
          </button>

          {/* Language Toggle: English / සිංහල / தமிழ் */}
          <div className="flex items-center rounded-md border border-slate-200 bg-slate-100 p-0.5 text-[10px] sm:text-xs">
            <button
              type="button"
              onClick={() => setLang('en')}
              className={`rounded px-1.5 sm:px-2 py-0.5 sm:py-1 font-medium transition-colors whitespace-nowrap ${
                lang === 'en'
                  ? 'bg-white text-[#0B2A6F] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => setLang('si')}
              className={`rounded px-1.5 sm:px-2 py-0.5 sm:py-1 font-medium transition-colors whitespace-nowrap ${
                lang === 'si'
                  ? 'bg-white text-[#0B2A6F] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              සිංහල
            </button>
            <button
              type="button"
              onClick={() => setLang('ta')}
              className={`rounded px-1.5 sm:px-2 py-0.5 sm:py-1 font-medium transition-colors whitespace-nowrap ${
                lang === 'ta'
                  ? 'bg-white text-[#0B2A6F] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              தமிழ்
            </button>
          </div>

          {/* Command Palette Trigger (Ctrl+K) */}
          <button
            type="button"
            onClick={() => setCommandPaletteOpen(true)}
            title={tr(
              lang,
              'Quick Search & Command Palette (Ctrl+K)',
              'ක්ෂණික සෙවුම් සහ විධාන පුවරුව (Ctrl+K)',
              'விரைவுத் தேடல் மற்றும் கட்டளைப் பலகை (Ctrl+K)'
            )}
            className="flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-2 sm:px-2.5 py-1 text-xs font-medium text-slate-600 hover:border-[#0B2A6F] hover:text-[#0B2A6F] transition-colors whitespace-nowrap"
            aria-label="Open Command Palette"
          >
            <Search className="h-3.5 w-3.5 text-[#0B2A6F] shrink-0" />
            <span className="hidden xl:inline">
              {tr(lang, 'Command', 'විධාන', 'கட்டளை')}
            </span>
            <kbd className="hidden md:inline rounded border border-slate-300 bg-white px-1 py-0.2 font-mono text-[10px] text-slate-500">
              ⌘K
            </kbd>
          </button>

          {/* Theme Toggler Button (Light / Dark Mode) */}
          <button
            type="button"
            onClick={toggleTheme}
            title={
              theme === 'dark'
                ? tr(
                    lang,
                    'Switch to Daylight Theme',
                    'දිවා ආලෝක තේමාවට මාරු වන්න',
                    'பகல் வெளிச்சத் தோற்றத்திற்கு மாற்றுக'
                  )
                : tr(
                    lang,
                    'Switch to Night Operations Dark Theme',
                    'රාත්‍රී මෙහෙයුම් අඳුරු තේමාවට මාරු වන්න',
                    'இரவு செயல்பாட்டு இருள் தோற்றத்திற்கு மாற்றுக'
                  )
            }
            className="flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 sm:px-2.5 py-1 text-[11px] sm:text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap"
            aria-label="Toggle Theme"
          >
            {theme === 'dark' ? (
              <>
                <Sun className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                <span className="hidden xl:inline">
                  {tr(lang, 'Light', 'ආලෝකමත්', 'ஒளி')}
                </span>
              </>
            ) : (
              <>
                <Moon className="h-3.5 w-3.5 text-[#0B2A6F] shrink-0" />
                <span className="hidden xl:inline">
                  {tr(lang, 'Dark', 'අඳුරු', 'இருள்')}
                </span>
              </>
            )}
          </button>

          {/* Coordinator Auth / Registration Portal Trigger */}
          {activeProfile || firebaseUser ? (
            <button
              type="button"
              onClick={() => {
                setAuthModalTab('profile');
                setAuthModalOpen(true);
              }}
              className="flex items-center gap-1 sm:gap-1.5 rounded-md border border-blue-200 bg-blue-50 px-2 sm:px-2.5 py-1 text-[11px] sm:text-xs font-semibold text-[#0B2A6F] hover:bg-blue-100/70 transition-colors whitespace-nowrap"
            >
              <BadgeCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
              <span className="hidden md:inline max-w-[110px] truncate">
                {activeProfile?.fullName ||
                  firebaseUser?.displayName ||
                  'Coordinator'}
              </span>
              <span className="font-mono text-[10px] font-bold">
                {activeProfile?.badgeNumber || 'DMC-042'}
              </span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setAuthModalTab('login');
                setAuthModalOpen(true);
              }}
              className="flex items-center gap-1 sm:gap-1.5 rounded-md bg-[#0B2A6F] px-2 sm:px-2.5 py-1 text-[11px] sm:text-xs font-semibold text-white hover:bg-[#081f54] transition-colors whitespace-nowrap shadow-xs"
            >
              <LogIn className="h-3.5 w-3.5 shrink-0" />
              <span className="hidden sm:inline">
                {tr(
                  lang,
                  'Sign In / Register',
                  'පිවිසෙන්න / ලියාපදිංචි වන්න',
                  'உள்நுழைக / பதிவு'
                )}
              </span>
              <span className="sm:hidden">
                {tr(lang, 'Sign In', 'පිවිසුම', 'உள்நுழை')}
              </span>
            </button>
          )}

          {/* Coordinator SOP Workflow Toggle */}
          <button
            type="button"
            onClick={() => setShowDemoGuide(!showDemoGuide)}
            className={`hidden md:flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap ${
              showDemoGuide
                ? 'border-[#0B2A6F] bg-blue-50 text-[#0B2A6F]'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Compass className="h-3.5 w-3.5 text-[#0B2A6F]" />
            <span className="hidden lg:inline">{t.sections.sopWorkflow}</span>
          </button>

          {/* Reset Workspace Button */}
          <button
            type="button"
            onClick={handleResetDemo}
            title={t.status.resetDemo}
            className="hidden md:flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap"
          >
            <RotateCcw className="h-3.5 w-3.5 text-slate-500" />
            <span className="hidden xl:inline">{t.status.resetDemo}</span>
          </button>
        </div>
      </header>

      {/* Collapsible 7-Step Coordinator SOP Strip */}
      {showDemoGuide && (
        <div className="border-b border-slate-200 bg-blue-50/60 px-3 py-3 sm:px-4 lg:px-6">
          <div className="mx-auto flex max-w-7xl flex-col gap-2.5">
            <div className="flex items-center justify-between gap-2">
              <div className="text-xs font-semibold text-[#0B2A6F]">
                {t.sections.sopHeader}
              </div>
              <button
                type="button"
                onClick={() => setShowDemoGuide(false)}
                className="text-xs text-slate-500 hover:text-slate-800 shrink-0"
              >
                {t.sections.closeSop}
              </button>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-7">
              {getWorkflowSteps(lang).map((s) => (
                <button
                  key={s.step}
                  type="button"
                  onClick={() => setActiveScreen(s.screen)}
                  className={`rounded-md border p-2.5 text-left transition-colors ${
                    activeScreen === s.screen
                      ? 'border-[#0B2A6F] bg-white shadow-xs'
                      : 'border-slate-200 bg-white/80 hover:border-slate-300'
                  }`}
                >
                  <div className="font-mono text-[11px] font-bold text-[#0B2A6F]">
                    {tr(lang, 'STEP', 'පියවර', 'படி')} 0{s.step}
                  </div>
                  <div className="mt-0.5 text-xs font-semibold text-slate-900">
                    {s.title}
                  </div>
                  <p className="mt-1 text-[11px] leading-snug text-slate-600">
                    {s.hint}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Layout: Sidebar + Content Viewport */}
      <div className="flex flex-1 relative min-w-0">
        {/* Mobile Backdrop Overlay */}
        {mobileMenuOpen && (
          <div
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-[1px] lg:hidden"
            aria-hidden="true"
          />
        )}

        {/* Sidebar Navigation */}
        <aside
          className={`${
            mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          } fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] border-r border-slate-200 bg-white transition-transform duration-200 ease-in-out lg:static lg:z-auto lg:block lg:w-60 lg:max-w-none shrink-0 overflow-y-auto`}
        >
          <div className="flex h-full flex-col justify-between p-3">
            <div className="space-y-4">
              {/* Mobile Drawer Top Header (< lg) */}
              <div className="flex items-center justify-between border-b border-slate-200 pb-2.5 lg:hidden">
                <div className="min-w-0">
                  <div className="text-sm font-bold text-[#0B2A6F] truncate">
                    {t.appName}
                  </div>
                  <div className="text-[10px] text-slate-500 truncate">
                    {t.tagline}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100"
                  aria-label="Close Menu"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              {/* Operations Section */}
              <div>
                <div className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  {t.sections.operations}
                </div>
                <nav className="space-y-1">
                  {operationalNavItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeScreen === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setActiveScreen(item.id);
                          setMobileMenuOpen(false);
                        }}
                        className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-xs font-medium transition-colors ${
                          isActive
                            ? 'bg-[#0B2A6F] text-white'
                            : 'text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <span className="flex items-center gap-2.5 truncate">
                          <Icon
                            className={`h-4 w-4 shrink-0 ${
                              isActive ? 'text-white' : 'text-slate-500'
                            }`}
                          />
                          <span className="truncate">{item.label}</span>
                        </span>
                        {item.count !== undefined && (
                          <span
                            className={`font-mono text-[11px] tabular-nums ${
                              isActive ? 'text-blue-200' : 'text-slate-400'
                            }`}
                          >
                            {item.count}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </nav>
              </div>

              {/* Audit & Intelligence Section */}
              <div>
                <div className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  {t.sections.intelligence}
                </div>
                <nav className="space-y-1">
                  {intelligenceNavItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeScreen === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setActiveScreen(item.id);
                          setMobileMenuOpen(false);
                        }}
                        className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-xs font-medium transition-colors ${
                          isActive
                            ? 'bg-[#0B2A6F] text-white'
                            : 'text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <span className="flex items-center gap-2.5 truncate">
                          <Icon
                            className={`h-4 w-4 shrink-0 ${
                              isActive ? 'text-white' : 'text-slate-500'
                            }`}
                          />
                          <span className="truncate">{item.label}</span>
                        </span>
                        {item.count !== undefined && (
                          <span
                            className={`font-mono text-[11px] tabular-nums ${
                              isActive ? 'text-blue-200' : 'text-slate-400'
                            }`}
                          >
                            {item.count}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </nav>
              </div>
            </div>

            {/* Sidebar Footer: Coordinator Auth, PWA Install, & Context Note */}
            <div className="mt-6 space-y-2 border-t border-slate-200 pt-3">
              {!activeProfile && !firebaseUser ? (
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthModalTab('login');
                      setAuthModalOpen(true);
                      setMobileMenuOpen(false);
                    }}
                    className="flex items-center justify-center gap-1.5 rounded-md bg-[#0B2A6F] px-2.5 py-2 text-xs font-semibold text-white hover:bg-[#081f54] transition-colors"
                  >
                    <LogIn className="h-3.5 w-3.5 shrink-0" />
                    <span>{tr(lang, 'Sign In', 'පිවිසෙන්න', 'உள்நுழைக')}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthModalTab('register');
                      setAuthModalOpen(true);
                      setMobileMenuOpen(false);
                    }}
                    className="flex items-center justify-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <UserPlus className="h-3.5 w-3.5 text-[#0B2A6F] shrink-0" />
                    <span>
                      {tr(lang, 'Register', 'ලියාපදිංචිය', 'பதிவு')}
                    </span>
                  </button>
                </div>
              ) : (
                <div className="rounded-md border border-blue-200 bg-blue-50/50 p-2.5 space-y-2">
                  <div className="flex items-start justify-between gap-1.5">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1 text-xs font-bold text-slate-900 truncate">
                        <BadgeCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                        <span className="truncate">
                          {activeProfile?.fullName ||
                            firebaseUser?.displayName ||
                            'Coordinator'}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-600 truncate">
                        {activeProfile?.role || 'DS Coordinator'} ·{' '}
                        {activeProfile?.division || 'Passara DS'}
                      </div>
                    </div>
                    <span className="rounded bg-white px-1.5 py-0.5 font-mono text-[10px] font-bold text-[#0B2A6F] border border-slate-200 shrink-0">
                      {activeProfile?.badgeNumber || 'DMC-042'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setAuthModalTab('profile');
                        setAuthModalOpen(true);
                        setMobileMenuOpen(false);
                      }}
                      className="flex flex-1 items-center justify-center gap-1 rounded border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      <UserCheck className="h-3 w-3 text-[#0B2A6F]" />
                      <span>
                        {tr(lang, 'Officer Profile', 'නිලධාරී ගිණුම', 'சுயவிவரம்')}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        await signOutCoordinator();
                        setActiveProfile(null);
                        setMobileMenuOpen(false);
                      }}
                      title={tr(lang, 'Sign Out', 'ඉවත් වන්න', 'வெளியேறு')}
                      className="flex items-center justify-center rounded border border-red-200 bg-red-50 px-2 py-1 text-[11px] font-semibold text-red-700 hover:bg-red-100"
                    >
                      <LogOut className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-1.5 md:hidden">
                <button
                  type="button"
                  onClick={() => setSimulateOffline(!simulateOffline)}
                  className={`flex w-full items-center justify-between rounded-md border px-2.5 py-1.5 text-[11px] font-medium transition-colors sm:hidden ${
                    simulateOffline
                      ? 'border-amber-600 bg-amber-600 text-white'
                      : 'border-slate-200 bg-slate-50 text-slate-700'
                  }`}
                >
                  <span>{t.status.simulateOfflineToggle}</span>
                  <strong>{simulateOffline ? 'ON' : 'OFF'}</strong>
                </button>
                <div className="flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowDemoGuide(!showDemoGuide);
                      setMobileMenuOpen(false);
                    }}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-[11px] font-medium text-slate-700"
                  >
                    <Compass className="h-3 w-3 text-[#0B2A6F] shrink-0" />
                    <span className="truncate">{t.sections.sopWorkflow}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleResetDemo();
                      setMobileMenuOpen(false);
                    }}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-[11px] font-medium text-slate-700"
                  >
                    <RotateCcw className="h-3 w-3 text-slate-500 shrink-0" />
                    <span className="truncate">{t.status.resetDemo}</span>
                  </button>
                </div>
              </div>

              <PWAInstallButton lang={lang} />

              <div className="rounded-md border border-slate-200 bg-slate-50 p-2.5 text-[11px] text-slate-600 space-y-1">
                <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                  <ClipboardCheck className="h-3.5 w-3.5 text-[#0B2A6F]" />
                  <span>{t.sections.coordinatorMode}</span>
                </div>
                <p className="text-[10px] text-slate-500">
                  {t.sections.coordinatorSub}
                </p>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Screen Viewport */}
        <main className="flex-1 min-w-0 w-full p-3 sm:p-4 lg:p-6 pb-24 lg:pb-8 overflow-x-hidden">
          {/* User-Friendly Contextual Guide & 1-Click Next Step Bar */}
          {showQuickHelper ? (
            <div className="mb-4 flex flex-col gap-2.5 rounded-lg border border-blue-200 bg-blue-50/60 px-3.5 py-2.5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-2.5 min-w-0">
                <HelpCircle className="mt-0.5 h-4 w-4 text-[#0B2A6F] shrink-0" />
                <div className="text-xs leading-relaxed text-slate-700">
                  <span className="font-bold text-[#0B2A6F] mr-1.5">
                    {tr(
                      lang,
                      'Quick Guide:',
                      'මඟපෙන්වීම:',
                      'வழிகாட்டி:'
                    )}
                  </span>
                  {activeScreen === 'overview' &&
                    tr(
                      lang,
                      'Start here to explore how DisaLink AI works, or click "Next Step" to submit a multilingual field report.',
                      'DisaLink AI ක්‍රියා කරන ආකාරය මෙතැනින් බලන්න, නැතහොත් ක්ෂේත්‍ර වාර්තාවක් යොමු කිරීමට "මීළඟ පියවර" ක්ලික් කරන්න.',
                      'DisaLink AI எவ்வாறு செயல்படுகிறது என்பதை இங்கே காண்க, அல்லது அறிக்கை சமர்ப்பிக்க "அடுத்த படி" என்பதை கிளிக் செய்க.'
                    )}
                  {activeScreen === 'submit' &&
                    tr(
                      lang,
                      'Click any "Quick Template" button below to load a sample Sinhala/Tamil/Singlish message, then click "Extract Structured Fields".',
                      'පහත "ආදර්ශ වාර්තා" බොත්තමක් ඔබා පණිවිඩයක් තෝරා, "ව්‍යුහගත දත්ත උකහා ගන්න" ක්ලික් කරන්න.',
                      'கீழே உள்ள "மாதிரி அறிக்கைகள்" பொத்தானை அழுத்தி, "கட்டமைக்கப்பட்ட தரவைப் பிரித்தெடு" என்பதை கிளிக் செய்க.'
                    )}
                  {activeScreen === 'dashboard' &&
                    tr(
                      lang,
                      'Review cases sorted into Act Now, Verify Fast, and Watch queues. Click any case card or map pin to inspect details.',
                      'ප්‍රමුඛතා පෝලිම් 3ට වර්ග කළ සිදුවීම් බලන්න. වැඩි විස්තර සඳහා ඕනෑම සිදුවීමක් හෝ සිතියම් ලකුණක් ක්ලික් කරන්න.',
                      'முன்னுரிமை வரிசைகளில் உள்ள சம்பவங்களைக் காண்க. விவரங்களுக்கு எந்த அட்டையையும் கிளிக் செய்க.'
                    )}
                  {activeScreen === 'caseDetail' &&
                    tr(
                      lang,
                      'See how multiple reports combine into one trust score (Noisy-OR). Use the Coordinator Override buttons to confirm or edit priority.',
                      'වාර්තා කිහිපයක් ඒකාබද්ධ වී විශ්වාසනීයත්ව ලකුණු සෑදෙන හැටි බලන්න. නිලධාරී බොත්තම් මගින් තීරණ තහවුරු කරන්න.',
                      'பல அறிக்கைகள் இணைந்து நம்பகத்தன்மை மதிப்பெண் உருவாவதைக் காண்க. அதிகாரி பொத்தான்கள் மூலம் உறுதிப்படுத்தவும்.'
                    )}
                  {activeScreen === 'silenceRadar' &&
                    tr(
                      lang,
                      'Villages with unusually zero reports during heavy rain are flagged here. Click "Simulate Monsoon Storm" or log a radio check.',
                      'අධික වර්ෂාව මධ්‍යයේ කිසිදු වාර්තාවක් නොලැබෙන නිහඬ ගම්මාන මෙහි දැක්වේ. දුරකථන පරීක්ෂාවක් සටහන් කරන්න.',
                      'கடும் மழையின் போது எந்தத் தகவலும் வராத மௌனக் கிராமங்கள் இங்கே காட்டப்படுகின்றன.'
                    )}
                  {activeScreen === 'summary' &&
                    tr(
                      lang,
                      'Generate an official Situation Report where every sentence cites its source report ID [R-xxx], ready to copy or download.',
                      '[R-xxx] මූලාශ්‍ර අංක සහිත නිල තත්ත්ව වාර්තාවක් එක් ක්ලික් කිරීමකින් සාදා බාගත කරන්න.',
                      '[R-xxx] ஆதார எண்களுடன் கூடிய அதிகாரப்பூர்வ நிலைமை அறிக்கையை உருவாக்கி பதிவிறக்கவும்.'
                    )}
                  {activeScreen === 'ledger' &&
                    tr(
                      lang,
                      'Every AI suggestion and human decision is locked in a tamper-evident SHA-256 chain. Click "Verify Chain" to audit integrity.',
                      'සියලුම AI යෝජනා සහ නිලධාරී තීරණ වෙනස් කළ නොහැකි SHA-256 දාමයක සටහන් වේ.',
                      'அனைத்து AI பரிந்துரைகளும் அதிகாரி முடிவுகளும் SHA-256 சங்கிலியில் பாதுகாப்பாகப் பதியப்படுகின்றன.'
                    )}
                  {activeScreen === 'aiHub' &&
                    tr(
                      lang,
                      'Chat with the AI Assistant, start a Live Voice briefing, verify locations with Google Search/Maps, or sync to Firestore Cloud.',
                      'AI සහායක සමඟ සංවාද කරන්න, සජීවී හඬ සැසියක් අරඹන්න, නැතහොත් Firestore Cloud වෙත සමමුහුර්ත කරන්න.',
                      'AI உதவியாளருடன் உரையாடுங்கள், நேரடி குரல் அமர்வைத் தொடங்குங்கள் அல்லது Cloud உடன் ஒத்திசைக்கவும்.'
                    )}
                  {activeScreen === 'evaluation' &&
                    tr(
                      lang,
                      'Run the 20-item multilingual benchmark suite to test extraction accuracy across Sinhala, Tamil, English, and Singlish.',
                      'සිංහල, දෙමළ, ඉංග්‍රීසි සහ Singlish වාර්තා 20ක නිරවද්‍යතා පරීක්ෂාව මෙතැනින් ක්‍රියාත්මක කරන්න.',
                      'சிங்களம், தமிழ், ஆங்கிலம் மற்றும் தங்கிலீஷ் ஆகிய 20 மாதிரிகளின் துல்லிய சோதனையை இயக்கவும்.'
                    )}
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {(() => {
                  const order: ScreenId[] = [
                    'overview',
                    'submit',
                    'dashboard',
                    'caseDetail',
                    'silenceRadar',
                    'summary',
                    'ledger',
                    'aiHub',
                    'evaluation',
                  ];
                  const idx = order.indexOf(activeScreen);
                  const prevScreen =
                    order[(idx - 1 + order.length) % order.length];
                  const nextScreen = order[(idx + 1) % order.length];
                  return (
                    <>
                      {idx > 0 && (
                        <button
                          type="button"
                          onClick={() => setActiveScreen(prevScreen)}
                          className="inline-flex items-center gap-1 rounded border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          <ArrowLeft className="h-3 w-3" />
                          <span>{tr(lang, 'Prev', 'පෙර', 'முந்தைய')}</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setActiveScreen(nextScreen)}
                        className="inline-flex items-center gap-1 rounded bg-[#0B2A6F] px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-[#081f54]"
                      >
                        <span>
                          {tr(
                            lang,
                            'Next Step',
                            'මීළඟ පියවර',
                            'அடுத்த படி'
                          )}
                        </span>
                        <ArrowRight className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowQuickHelper(false)}
                        title={tr(lang, 'Hide Tip', 'සඟවන්න', 'மறை')}
                        className="rounded p-1 text-slate-400 hover:bg-white hover:text-slate-700"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </>
                  );
                })()}
              </div>
            </div>
          ) : (
            <div className="mb-3 flex justify-end">
              <button
                type="button"
                onClick={() => setShowQuickHelper(true)}
                className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600 hover:text-[#0B2A6F]"
              >
                <HelpCircle className="h-3.5 w-3.5 text-[#0B2A6F]" />
                <span>
                  {tr(
                    lang,
                    'Show Screen Guide',
                    'මඟපෙන්වීම පෙන්වන්න',
                    'வழிகாட்டியைக் காட்டு'
                  )}
                </span>
              </button>
            </div>
          )}

          {isLoading ? (
            <div className="flex h-64 items-center justify-center text-sm text-slate-500">
              {tr(
                lang,
                'Initializing IndexedDB & verifying SHA-256 Decision Ledger...',
                'IndexedDB ආරම්භ කරමින් සහ SHA-256 තීරණ ලෙජරය පරීක්ෂා කරමින්...',
                'IndexedDB தொடங்கப்பட்டு SHA-256 முடிவுப் பதிவேடு சரிபார்க்கப்படுகிறது...'
              )}
            </div>
          ) : (
            <>
              {activeScreen === 'overview' && (
                <LandingScreen
                  lang={lang}
                  reports={reports}
                  cases={cases}
                  quietAreas={evaluatedGNAreas}
                  ledgerCount={ledger.length}
                  ledgerIntact={chainVerification.valid}
                  onEnterDashboard={() => setActiveScreen('dashboard')}
                  onNavigateToSubmit={() => setActiveScreen('submit')}
                  onNavigateToSilenceRadar={() =>
                    setActiveScreen('silenceRadar')
                  }
                  onNavigateToLedger={() => setActiveScreen('ledger')}
                  onNavigateToSummary={() => setActiveScreen('summary')}
                  onNavigateToAIHub={() => setActiveScreen('aiHub')}
                  onNavigateToEvaluation={() => setActiveScreen('evaluation')}
                  onOpenCase={(caseId) => {
                    setSelectedCaseId(caseId);
                    setActiveScreen('caseDetail');
                  }}
                />
              )}

              {activeScreen === 'dashboard' && (
                <DashboardScreen
                  lang={lang}
                  reports={reports}
                  cases={cases}
                  quietAreas={evaluatedGNAreas}
                  offlineQueue={offlineQueue}
                  ledgerIntact={chainVerification.valid}
                  tamperedEntryNumber={chainVerification.tamperedIndex}
                  onSelectCase={(caseId) => {
                    setSelectedCaseId(caseId);
                    setActiveScreen('caseDetail');
                  }}
                  onQuickConfirmCase={async (caseId) => {
                    await performCaseCoordinatorAction({
                      caseId,
                      actionType: 'HUMAN_CONFIRMED_CASE',
                    });
                    await refreshStateFromDB();
                    triggerToast(
                      tr(
                        lang,
                        `Confirmed Case ${caseId} & recorded in SHA-256 Decision Ledger`,
                        `${caseId} සිදුවීම තහවුරු කර SHA-256 ලෙජරයේ සටහන් කරන ලදී`,
                        `${caseId} சம்பவம் உறுதிப்படுத்தப்பட்டு SHA-256 பதிவேட்டில் பதியப்பட்டது`
                      )
                    );
                  }}
                  onNavigateToSilenceRadar={() =>
                    setActiveScreen('silenceRadar')
                  }
                  onNavigateToLedger={() => setActiveScreen('ledger')}
                  onNavigateToSubmit={() => setActiveScreen('submit')}
                />
              )}

              {activeScreen === 'submit' && (
                <SubmitReportScreen
                  lang={lang}
                  isEffectiveOffline={isEffectiveOffline}
                  offlineQueue={offlineQueue}
                  syncHistory={syncHistory}
                  prefillTranscriptText={prefillTranscriptText}
                  onConsumePrefillTranscript={() =>
                    setPrefillTranscriptText(null)
                  }
                  onConfirmAndSaveReport={async (params) => {
                    const { mergedCase, isNewCase } =
                      await saveAndMergeReport(params);
                    await refreshStateFromDB();
                    setSelectedCaseId(mergedCase.id);
                    return { caseId: mergedCase.id, isNewCase };
                  }}
                  onQueueOfflineReport={async (item) => {
                    await enqueueReportOffline(item);
                    await refreshStateFromDB();
                  }}
                  onManualSyncNow={async () => {
                    const syncedCount =
                      await syncOfflineQueuedReports('manual_sync');
                    await refreshStateFromDB();
                    if (syncedCount > 0) {
                      setSyncBanner(
                        tr(
                          lang,
                          `Manually synced ${syncedCount} queued offline report(s) with zero duplicates or losses.`,
                          `පෝලිමේ තිබූ වාර්තා ${syncedCount} ක් අනුපිටපත් හෝ හානියකින් තොරව සමමුහුර්ත කරන ලදී.`,
                          `வரிசையில் இருந்த ${syncedCount} அறிக்கைகள் நகல்கள் இன்றி ஒத்திசைக்கப்பட்டன.`
                        )
                      );
                      setTimeout(() => setSyncBanner(null), 5000);
                    }
                  }}
                  onNavigateToCase={(caseId) => {
                    setSelectedCaseId(caseId);
                    setActiveScreen('caseDetail');
                  }}
                />
              )}

              {activeScreen === 'caseDetail' && (
                <CaseDetailScreen
                  lang={lang}
                  user={firebaseUser}
                  cases={cases}
                  reports={reports}
                  selectedCaseId={selectedCaseId}
                  onSelectCase={(id) => setSelectedCaseId(id)}
                  onBackToDashboard={() => setActiveScreen('dashboard')}
                  onCoordinatorAction={async (params) => {
                    await performCaseCoordinatorAction(params);
                    await refreshStateFromDB();
                  }}
                />
              )}

              {activeScreen === 'silenceRadar' && (
                <SilenceRadarScreen
                  lang={lang}
                  evaluatedAreas={evaluatedGNAreas}
                  onSimulateStorm={async (silentIds) => {
                    await simulateStormInSilenceRadar(silentIds);
                    await refreshStateFromDB();
                  }}
                  onContactGNOfficer={async (gnId, note) => {
                    await markSilentGNAreaContacted(gnId, note);
                    await refreshStateFromDB();
                  }}
                />
              )}

              {activeScreen === 'aiHub' && (
                <AIIntelligenceHubScreen
                  lang={lang}
                  user={firebaseUser}
                  cases={cases}
                  reports={reports}
                  quietAreas={evaluatedGNAreas}
                  onUseTranscriptInSubmit={(transcript) => {
                    setPrefillTranscriptText(transcript);
                    setActiveScreen('submit');
                    triggerToast(
                      tr(
                        lang,
                        'Loaded audio transcript into Submit Report intake form.',
                        'හඬ පිටපත වාර්තා ඇතුළත් කිරීමේ පෝරමයට එක් කරන ලදී.',
                        'ஆடியோ உரைப்பதிவு அறிக்கை உள்ளீட்டுப் படிவத்தில் ஏற்றப்பட்டது.'
                      )
                    );
                  }}
                />
              )}

              {activeScreen === 'ledger' && (
                <LedgerScreen
                  lang={lang}
                  entries={ledger}
                  verification={chainVerification}
                  onVerifyChain={async () => {
                    const snapshot = await loadAllData();
                    const result = await verifyLedgerChain(snapshot.ledger);
                    setChainVerification(result);
                  }}
                  onTamperRandomRecord={async () => {
                    const mutated = await tamperWithRandomLedgerRecord();
                    const snapshot = await loadAllData();
                    setLedger(snapshot.ledger);
                    return mutated;
                  }}
                  onResetDemo={handleResetDemo}
                />
              )}

              {activeScreen === 'summary' && (
                <SummaryScreen
                  lang={lang}
                  user={firebaseUser}
                  cases={cases}
                  reports={reports}
                  quietAreas={evaluatedGNAreas}
                  onLogSummaryGenerated={async (headline) => {
                    await appendLedgerRecord({
                      actor: 'Gemini Flash (AI Suggestion)',
                      type: 'AI_SUMMARY_GENERATED',
                      targetId: 'SITREP-DRAFT',
                      summary: `Generated sourced situation summary draft: "${headline}"`,
                      payload: { headline },
                    });
                    await refreshStateFromDB();
                  }}
                />
              )}

              {activeScreen === 'evaluation' && (
                <EvaluationScreen lang={lang} />
              )}
            </>
          )}
        </main>
      </div>

      {/* Institutional Multi-Column Footer on Every Page */}
      <AppFooter
        lang={lang}
        theme={theme}
        activeScreen={activeScreen}
        casesCount={cases.length}
        reportsCount={reports.length}
        quietAreaCount={quietAreaCount}
        ledgerCount={ledger.length}
        ledgerIntact={chainVerification.valid}
        onNavigate={(screen) => setActiveScreen(screen)}
        onChangeLang={(nextLang) => setLang(nextLang)}
        onToggleTheme={toggleTheme}
        onOpenCommandPalette={() => setCommandPaletteOpen(true)}
        onOpenOfficerPortal={() => {
          setAuthModalTab(activeProfile || firebaseUser ? 'profile' : 'login');
          setAuthModalOpen(true);
        }}
        onExportWorkspaceSnapshot={handleExportWorkspaceSnapshot}
        onResetDemo={handleResetDemo}
      />

      {/* Mobile Bottom Quick-Navigation Bar (< lg) */}
      <nav
        aria-label="Mobile Quick Navigation"
        className="fixed bottom-0 inset-x-0 z-30 flex items-center justify-around border-t border-slate-200 bg-white/95 backdrop-blur-xs px-1 py-1.5 lg:hidden"
      >
        <button
          type="button"
          onClick={() => {
            setActiveScreen('overview');
            setMobileMenuOpen(false);
          }}
          className={`flex min-w-0 flex-1 flex-col items-center gap-0.5 px-1 py-1 text-[10px] font-medium ${
            activeScreen === 'overview' ? 'text-[#0B2A6F] font-semibold' : 'text-slate-500'
          }`}
        >
          <BookOpen className="h-4 w-4 shrink-0" />
          <span className="w-full truncate text-center">{t.nav.overview}</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveScreen('dashboard');
            setMobileMenuOpen(false);
          }}
          className={`flex min-w-0 flex-1 flex-col items-center gap-0.5 px-1 py-1 text-[10px] font-medium ${
            activeScreen === 'dashboard' ? 'text-[#0B2A6F] font-semibold' : 'text-slate-500'
          }`}
        >
          <LayoutDashboard className="h-4 w-4 shrink-0" />
          <span className="w-full truncate text-center">
            {t.nav.dashboard} ({cases.length})
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveScreen('submit');
            setMobileMenuOpen(false);
          }}
          className={`flex min-w-0 flex-1 flex-col items-center gap-0.5 px-1 py-1 text-[10px] font-semibold ${
            activeScreen === 'submit' ? 'text-[#0B2A6F]' : 'text-slate-700'
          }`}
        >
          <PlusCircle className="h-4 w-4 text-[#0B2A6F] shrink-0" />
          <span className="w-full truncate text-center">+ {t.nav.submit}</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveScreen('silenceRadar');
            setMobileMenuOpen(false);
          }}
          className={`flex min-w-0 flex-1 flex-col items-center gap-0.5 px-1 py-1 text-[10px] font-medium ${
            activeScreen === 'silenceRadar' ? 'text-amber-700 font-semibold' : 'text-slate-500'
          }`}
        >
          <Radio className="h-4 w-4 text-amber-600 shrink-0" />
          <span className="w-full truncate text-center">
            {t.nav.silenceRadar} ({quietAreaCount})
          </span>
        </button>

        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className={`flex min-w-0 flex-1 flex-col items-center gap-0.5 px-1 py-1 text-[10px] font-medium ${
            mobileMenuOpen ? 'text-[#0B2A6F] font-semibold' : 'text-slate-500'
          }`}
        >
          <Menu className="h-4 w-4 shrink-0" />
          <span className="w-full truncate text-center">{t.sections.allScreens}</span>
        </button>
      </nav>

      {/* Global Friendly Action Toast Notification */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-16 lg:bottom-5 right-4 z-40 flex items-center gap-2 rounded-lg border border-emerald-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-900 shadow-lg"
        >
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Coordinator Registration, Login & Profile Modal */}
      <CoordinatorAuthModal
        isOpen={authModalOpen}
        initialTab={authModalTab}
        lang={lang}
        firebaseUser={firebaseUser}
        activeProfile={activeProfile}
        onClose={() => setAuthModalOpen(false)}
        onProfileChange={(prof) => setActiveProfile(prof)}
      />

      {/* Global Coordinator Command Palette (Ctrl+K / Cmd+K) */}
      <CommandPaletteModal
        isOpen={commandPaletteOpen}
        lang={lang}
        theme={theme}
        cases={cases}
        reports={reports}
        quietAreas={evaluatedGNAreas}
        simulateOffline={simulateOffline}
        onClose={() => setCommandPaletteOpen(false)}
        onNavigate={(screen) => setActiveScreen(screen)}
        onSelectCase={(caseId) => {
          setSelectedCaseId(caseId);
          setActiveScreen('caseDetail');
        }}
        onToggleTheme={toggleTheme}
        onChangeLang={(nextLang) => setLang(nextLang)}
        onToggleOffline={() => setSimulateOffline((prev) => !prev)}
        onOpenOfficerPortal={() => {
          setAuthModalTab(activeProfile || firebaseUser ? 'profile' : 'login');
          setAuthModalOpen(true);
        }}
        onExportWorkspaceSnapshot={handleExportWorkspaceSnapshot}
      />
    </div>
  );
}
