import React, { useEffect, useRef, useState } from 'react';
import { User } from 'firebase/auth';
import {
  GNSilenceEvaluation,
  IncidentCase,
  Report,
  UILanguage,
} from '../types';
import { localizePlace, tr } from '../lib/i18n';
import {
  CoordinatorCloudRecord,
  deleteCoordinatorRecordFromFirestore,
  saveCoordinatorRecordToFirestore,
  signInCoordinatorWithGoogle,
  signOutCoordinator,
  subscribeCoordinatorRecords,
  updateCoordinatorRecordStatusInFirestore,
} from '../lib/firebase';
import {
  Archive,
  CheckCircle2,
  CloudUpload,
  ExternalLink,
  FileAudio,
  Globe,
  Image as ImageIcon,
  Loader2,
  LogIn,
  LogOut,
  MapPin,
  MessageSquare,
  Mic,
  MicOff,
  Radio,
  Send,
  Sparkles,
  Trash2,
  Volume2,
} from 'lucide-react';
import { AudioTranscriptionPanel } from './AudioTranscriptionPanel';
import { ImageStudioPanel } from './ImageStudioPanel';

interface AIIntelligenceHubScreenProps {
  lang?: UILanguage;
  user: User | null;
  cases: IncidentCase[];
  reports: Report[];
  quietAreas: GNSilenceEvaluation[];
  initialTab?:
    | 'chat'
    | 'voice'
    | 'transcribe'
    | 'image'
    | 'search'
    | 'maps'
    | 'cloud';
  onUseTranscriptInSubmit?: (
    transcript: string,
    englishTranslation?: string
  ) => void;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  modelUsed?: string;
  timestamp: string;
}

function floatTo16BitPCMBase64(float32Array: Float32Array): string {
  const buffer = new ArrayBuffer(float32Array.length * 2);
  const view = new DataView(buffer);
  for (let i = 0; i < float32Array.length; i++) {
    const s = Math.max(-1, Math.min(1, float32Array[i]));
    view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export const AIIntelligenceHubScreen: React.FC<
  AIIntelligenceHubScreenProps
> = ({
  lang = 'en',
  user,
  cases,
  reports,
  quietAreas,
  initialTab = 'chat',
  onUseTranscriptInSubmit,
}) => {
  const [activeTab, setActiveTab] = useState<
    'chat' | 'voice' | 'transcribe' | 'image' | 'search' | 'maps' | 'cloud'
  >(initialTab);

  // =========================================================================
  // 1. MULTI-TURN GEMINI CHATBOT STATE
  // =========================================================================
  const [chatModelMode, setChatModelMode] = useState<'pro' | 'flash' | 'lite'>(
    'flash'
  );
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      role: 'model',
      text: tr(
        lang,
        'Ayubowan / Vanakkam. I am the DisaLink AI Divisional Coordinator Assistant. I have context on your open incident cases, multilingual reports, and Silence Radar status. Ask me to compare reports, prioritize verification, or draft bilingual advisories.',
        'ආයුබෝවන් / වනක්කම්. මම DisaLink AI ප්‍රාදේශීය සම්බන්ධීකාරක සහායකයා වෙමි. ඔබගේ විවෘත සිදුවීම්, බහුභාෂා වාර්තා සහ නිහඬතා රේඩාර් (Silence Radar) තත්ත්වය පිළිබඳව මට අවබෝධයක් ඇත. වාර්තා සංසන්දනය කිරීමට, තහවුරු කිරීම් ප්‍රමුඛතාගත කිරීමට හෝ ත්‍රෛභාෂා නිවේදන කෙටුම්පත් කිරීමට මගෙන් විමසන්න.',
        'ஆயுபோவன் / வணக்கம். நான் DisaLink AI பிரதேச ஒருங்கிணைப்பாளர் உதவியாளர். உங்கள் திறந்த நிகழ்வுகள், பன்மொழி அறிக்கைகள் மற்றும் மௌன ரேடார் நிலை பற்றிய விவரங்கள் என்னிடம் உள்ளன. அறிக்கைகளை ஒப்பிட, சரிபார்ப்பை முன்னுரிமைப்படுத்த அல்லது அறிவிப்புகளை உருவாக்க என்னிடம் கேளுங்கள்.'
      ),
      modelUsed: 'gemini-3.8-flash',
      timestamp: new Date().toLocaleTimeString(),
    },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setChatMessages((prev) =>
      prev.map((m) =>
        m.id === 'welcome-1'
          ? {
              ...m,
              text: tr(
                lang,
                'Ayubowan / Vanakkam. I am the DisaLink AI Divisional Coordinator Assistant. I have context on your open incident cases, multilingual reports, and Silence Radar status. Ask me to compare reports, prioritize verification, or draft bilingual advisories.',
                'ආයුබෝවන් / වනක්කම්. මම DisaLink AI ප්‍රාදේශීය සම්බන්ධීකාරක සහායකයා වෙමි. ඔබගේ විවෘත සිදුවීම්, බහුභාෂා වාර්තා සහ නිහඬතා රේඩාර් (Silence Radar) තත්ත්වය පිළිබඳව මට අවබෝධයක් ඇත. වාර්තා සංසන්දනය කිරීමට, තහවුරු කිරීම් ප්‍රමුඛතාගත කිරීමට හෝ ත්‍රෛභාෂා නිවේදන කෙටුම්පත් කිරීමට මගෙන් විමසන්න.',
                'ஆயுபோவன் / வணக்கம். நான் DisaLink AI பிரதேச ஒருங்கிணைப்பாளர் உதவியாளர். உங்கள் திறந்த நிகழ்வுகள், பன்மொழி அறிக்கைகள் மற்றும் மௌன ரேடார் நிலை பற்றிய விவரங்கள் என்னிடம் உள்ளன. அறிக்கைகளை ஒப்பிட, சரிபார்ப்பை முன்னுரிமைப்படுத்த அல்லது அறிவிப்புகளை உருவாக்க என்னிடம் கேளுங்கள்.'
              ),
            }
          : m
      )
    );
  }, [lang]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleSendChat = async (customPrompt?: string) => {
    const textToSend = (customPrompt ?? chatInput).trim();
    if (!textToSend || isChatLoading) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString(),
    };

    const nextMessages = [...chatMessages, userMsg];
    setChatMessages(nextMessages);
    if (!customPrompt) setChatInput('');
    setIsChatLoading(true);

    try {
      const operationalContext = {
        openCases: cases.map((c) => ({
          id: c.id,
          queue: c.queue,
          type: c.incident_type,
          place: c.place_english,
          urgency: c.urgency,
          confidence: c.confidence,
          roadBlocked: c.roadBlocked,
          verified: c.verified,
          reason: c.reason,
          reportIds: c.reportIds,
        })),
        quietGNAreas: quietAreas
          .filter((g) => g.isQuiet)
          .map((g) => ({
            id: g.id,
            name: g.name,
            division: g.division,
            hazard: g.hazardLevel,
            scaledPValue: g.scaledPValue,
          })),
        totalReports: reports.length,
      };

      const res = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: nextMessages.map((m) => ({
            role: m.role,
            text: m.text,
          })),
          modelMode: chatModelMode,
          operationalContext,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || `HTTP ${res.status}`);
      }

      setChatMessages((prev) => [
        ...prev,
        {
          id: `m-${Date.now()}`,
          role: 'model',
          text: data.reply,
          modelUsed: data.modelUsed,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    } catch (err: any) {
      setChatMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'model',
          text: `Unable to reach Gemini Chat API (${err?.message || 'network error'}). Please check your connection or API key in Settings > Secrets.`,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    } finally {
      setIsChatLoading(false);
    }
  };

  // =========================================================================
  // 2. LIVE VOICE CONVERSATION STATE (gemini-3.8-live via /live WebSocket)
  // =========================================================================
  const [liveConnected, setLiveConnected] = useState(false);
  const [liveConnecting, setLiveConnecting] = useState(false);
  const [liveError, setLiveError] = useState<string | null>(null);
  const [liveVoiceName, setLiveVoiceName] = useState<
    'Zephyr' | 'Puck' | 'Charon' | 'Kore' | 'Fenrir'
  >('Zephyr');
  const [liveMicLevel, setLiveMicLevel] = useState<number>(0);
  const [liveTranscripts, setLiveTranscripts] = useState<
    Array<{ speaker: 'Coordinator' | 'Gemini Live'; text: string }>
  >([]);
  const [liveTextFallback, setLiveTextFallback] = useState('');

  const wsRef = useRef<WebSocket | null>(null);
  const inputAudioCtxRef = useRef<AudioContext | null>(null);
  const outputAudioCtxRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const nextStartTimeRef = useRef<number>(0);

  const stopLiveSession = () => {
    if (processorRef.current) {
      try {
        processorRef.current.disconnect();
      } catch {}
      processorRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
    if (inputAudioCtxRef.current) {
      try {
        inputAudioCtxRef.current.close();
      } catch {}
      inputAudioCtxRef.current = null;
    }
    if (outputAudioCtxRef.current) {
      try {
        outputAudioCtxRef.current.close();
      } catch {}
      outputAudioCtxRef.current = null;
    }
    if (wsRef.current) {
      try {
        wsRef.current.close();
      } catch {}
      wsRef.current = null;
    }
    nextStartTimeRef.current = 0;
    setLiveMicLevel(0);
    setLiveConnected(false);
    setLiveConnecting(false);
  };

  useEffect(() => {
    return () => {
      stopLiveSession();
    };
  }, []);

  const playPCM24kBase64Chunk = (base64Audio: string) => {
    const outCtx = outputAudioCtxRef.current;
    if (!outCtx) return;

    const binary = atob(base64Audio);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const view = new DataView(bytes.buffer);
    const numSamples = Math.floor(bytes.byteLength / 2);
    if (numSamples === 0) return;

    const audioBuffer = outCtx.createBuffer(1, numSamples, 24000);
    const channelData = audioBuffer.getChannelData(0);
    for (let i = 0; i < numSamples; i++) {
      channelData[i] = view.getInt16(i * 2, true) / 32768;
    }

    const source = outCtx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(outCtx.destination);

    const now = outCtx.currentTime;
    const startAt = Math.max(now, nextStartTimeRef.current);
    source.start(startAt);
    nextStartTimeRef.current = startAt + audioBuffer.duration;
  };

  const startLiveSession = async () => {
    setLiveError(null);
    setLiveConnecting(true);

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const contextSummary = `Open cases (${cases.length}): ${cases
        .map(
          (c) =>
            `${c.id} ${c.place_english} (${c.incident_type}, queue=${c.queue}, u=${c.urgency}, conf=${Math.round(
              c.confidence * 100
            )}%)`
        )
        .join('; ')}. Silent GN areas: ${quietAreas
        .filter((g) => g.isQuiet)
        .map((g) => g.name)
        .join(', ')}.`;
      const wsUrl = `${protocol}//${
        window.location.host
      }/live?voice=${encodeURIComponent(
        liveVoiceName
      )}&context=${encodeURIComponent(contextSummary)}`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      const outputAudioCtx = new AudioContext({ sampleRate: 24000 });
      outputAudioCtxRef.current = outputAudioCtx;
      nextStartTimeRef.current = outputAudioCtx.currentTime;

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.status === 'connected') {
            setLiveConnecting(false);
            setLiveConnected(true);
          }
          if (msg.audio) {
            playPCM24kBase64Chunk(msg.audio);
          }
          if (msg.inputTranscription) {
            setLiveTranscripts((prev) => [
              ...prev,
              { speaker: 'Coordinator', text: msg.inputTranscription },
            ]);
          }
          if (msg.outputTranscription) {
            setLiveTranscripts((prev) => [
              ...prev,
              { speaker: 'Gemini Live', text: msg.outputTranscription },
            ]);
          }
          if (msg.interrupted && outputAudioCtxRef.current) {
            nextStartTimeRef.current = outputAudioCtxRef.current.currentTime;
          }
          if (msg.error) {
            setLiveError(msg.error);
          }
        } catch {}
      };

      ws.onerror = () => {
        setLiveError('WebSocket connection error with /live endpoint.');
        stopLiveSession();
      };

      ws.onclose = () => {
        setLiveConnected(false);
        setLiveConnecting(false);
      };

      // Capture microphone if available
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
          });
          mediaStreamRef.current = stream;
          const inputAudioCtx = new AudioContext({ sampleRate: 16000 });
          inputAudioCtxRef.current = inputAudioCtx;
          const source = inputAudioCtx.createMediaStreamSource(stream);
          const processor = inputAudioCtx.createScriptProcessor(4096, 1, 1);
          processorRef.current = processor;

          source.connect(processor);
          processor.connect(inputAudioCtx.destination);

          processor.onaudioprocess = (e) => {
            const channelData = e.inputBuffer.getChannelData(0);
            let sumSquares = 0;
            for (let i = 0; i < channelData.length; i += 4) {
              sumSquares += channelData[i] * channelData[i];
            }
            const rms = Math.sqrt(sumSquares / (channelData.length / 4));
            setLiveMicLevel(Math.min(100, Math.round(rms * 380)));

            if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
              const base64 = floatTo16BitPCMBase64(channelData);
              wsRef.current.send(JSON.stringify({ audio: base64 }));
            }
          };
        } catch {
          // Microphone permission denied or unavailable; user can still send text prompts to the live voice session
          setLiveError(
            'Microphone access not granted — connected in voice-output mode (type a prompt below to hear Gemini Live speak).'
          );
        }
      }
    } catch (err: any) {
      setLiveError(err?.message || 'Failed to start Gemini Live session.');
      stopLiveSession();
    }
  };

  const sendQuickLivePrompt = (promptText: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(JSON.stringify({ text: promptText }));
    setLiveTranscripts((prev) => [
      ...prev,
      { speaker: 'Coordinator', text: promptText },
    ]);
  };

  const handleSendLiveTextPrompt = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !liveTextFallback.trim() ||
      !wsRef.current ||
      wsRef.current.readyState !== WebSocket.OPEN
    ) {
      return;
    }
    const text = liveTextFallback.trim();
    wsRef.current.send(JSON.stringify({ text }));
    setLiveTranscripts((prev) => [
      ...prev,
      { speaker: 'Coordinator', text },
    ]);
    setLiveTextFallback('');
  };

  // =========================================================================
  // 3. GOOGLE SEARCH GROUNDING STATE
  // =========================================================================
  const [searchQuery, setSearchQuery] = useState(
    'Latest Sri Lanka Disaster Management Centre (DMC) flood and landslide warnings for Kandy, Nuwara Eliya, and Mahaweli River'
  );
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<{
    text: string;
    sources: Array<{ uri: string; title: string }>;
  } | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

  const handleRunSearchGrounding = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim() || isSearching) return;
    setIsSearching(true);
    setSearchError(null);

    try {
      const res = await fetch('/api/gemini/search-grounding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setSearchResult({
        text: data.text,
        sources: data.sources || [],
      });
    } catch (err: any) {
      setSearchError(
        err?.message || 'Failed to fetch Google Search grounded intelligence.'
      );
    } finally {
      setIsSearching(false);
    }
  };

  // =========================================================================
  // 4. GOOGLE MAPS GROUNDING STATE
  // =========================================================================
  const [selectedMapsCaseId, setSelectedMapsCaseId] = useState<string>(
    cases[0]?.id || 'C-001'
  );
  const [mapsQuery, setMapsQuery] = useState(
    'Nearest hospitals, schools, temples, and emergency medical facilities around this incident location'
  );
  const [isMapsLoading, setIsMapsLoading] = useState(false);
  const [mapsResult, setMapsResult] = useState<{
    text: string;
    places: Array<{ uri: string; title: string; reviewSnippets: string[] }>;
  } | null>(null);
  const [mapsError, setMapsError] = useState<string | null>(null);

  const selectedCaseForMaps =
    cases.find((c) => c.id === selectedMapsCaseId) || cases[0];

  const handleRunMapsGrounding = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!mapsQuery.trim() || isMapsLoading) return;
    setIsMapsLoading(true);
    setMapsError(null);

    try {
      const lat = selectedCaseForMaps?.lat ?? 7.2906;
      const lng = selectedCaseForMaps?.lng ?? 80.6337;
      const placeContext = selectedCaseForMaps
        ? `${mapsQuery.trim()} near ${selectedCaseForMaps.place_english}, Sri Lanka`
        : mapsQuery.trim();

      const res = await fetch('/api/gemini/maps-grounding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: placeContext,
          latitude: lat,
          longitude: lng,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setMapsResult({
        text: data.text,
        places: data.places || [],
      });
    } catch (err: any) {
      setMapsError(
        err?.message || 'Failed to fetch Google Maps grounded places.'
      );
    } finally {
      setIsMapsLoading(false);
    }
  };

  // =========================================================================
  // 5. FIREBASE FIRESTORE CLOUD SYNC STATE
  // =========================================================================
  const [cloudRecords, setCloudRecords] = useState<CoordinatorCloudRecord[]>(
    []
  );
  const [cloudBanner, setCloudBanner] = useState<string | null>(null);
  const [isSyncingCloud, setIsSyncingCloud] = useState(false);

  useEffect(() => {
    if (!user) {
      setCloudRecords([]);
      return;
    }
    const unsub = subscribeCoordinatorRecords(
      user.uid,
      (records) => {
        setCloudRecords(records);
      },
      (errMsg) => {
        setCloudBanner(`Firestore query warning: ${errMsg}`);
      }
    );
    return () => unsub();
  }, [user]);

  const handleSyncConfirmedCasesToCloud = async () => {
    if (!user) return;
    setIsSyncingCloud(true);
    setCloudBanner(null);
    try {
      const confirmed = cases.filter((c) => c.humanConfirmed);
      for (const c of confirmed) {
        await saveCoordinatorRecordToFirestore({
          recordType: 'case_snapshot',
          targetId: c.id,
          title: `${c.id} · ${c.place_english} (${c.incident_type.replace('_', ' ')})`,
          summaryText: `${c.reason} | Queue: ${c.queue.toUpperCase()} | Confidence: ${(c.confidence * 100).toFixed(0)}% | Reports: ${c.reportIds.join(', ')}`,
          urgency: c.urgency,
          status: c.verified ? 'verified' : 'active',
        });
      }
      setCloudBanner(
        tr(
          lang,
          `Synced ${confirmed.length} human-confirmed case(s) to Firestore (/coordinator_records).`,
          `මිනිස් තහවුරු කළ සිදුවීම් ${confirmed.length}ක් Firestore (/coordinator_records) වෙත සමමුහුර්ත කරන ලදී.`,
          `மனிதர் உறுதிப்படுத்திய ${confirmed.length} நிகழ்வுகள் Firestore (/coordinator_records) உடன் ஒத்திசைக்கப்பட்டன.`
        )
      );
    } catch (err: any) {
      setCloudBanner(
        tr(
          lang,
          `Firestore sync error: ${err?.message || 'Failed'}`,
          `Firestore සමමුහුර්ත දෝෂය: ${err?.message || 'අසාර්ථකයි'}`,
          `Firestore ஒத்திசைவு பிழை: ${err?.message || 'தோல்வி'}`
        )
      );
    } finally {
      setIsSyncingCloud(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Header & Sub-Navigation Tabs */}
      <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">
            {tr(
              lang,
              'AI Intelligence, Live Voice, Grounding & Cloud Sync',
              'AI බුද්ධිය, සජීවී හඬ, සෙවුම්/සිතියම් පදනම සහ ක්ලවුඩ් සමමුහුර්තකරණය',
              'AI நுண்ணறிவு, நேரடி குரல், தேடல்/வரைபட ஆதாரம் & கிளவுட் ஒத்திசைவு'
            )}
          </h1>
          <p className="text-xs text-slate-600">
            {tr(
              lang,
              'Multi-turn Gemini Chatbot · Gemini 3.8 Live Voice · Gemini 3.5 Audio Transcribe · Gemini 3.1 Flash Image Studio · Search/Maps Grounding · Firebase Cloud',
              'Gemini සංවාද සහායක · Gemini 3.8 සජීවී හඬ · Gemini 3.5 හඬ පිටපත් · Gemini 3.1 ඡායාරූප මැදිරිය · Google සෙවුම්/සිතියම් · Firebase ක්ලවුඩ්',
              'Gemini சாட்பாட் · Gemini 3.8 நேரடி குரல் · Gemini 3.5 குரல் எழுத்துமாற்றி · Gemini 3.1 பட ஸ்டுடியோ · தேடல்/வரைபட ஆதாரம் · Firebase கிளவுட்'
            )}
          </p>
        </div>

        <div className="flex w-full sm:w-auto items-center gap-1 overflow-x-auto no-scrollbar rounded-lg bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => setActiveTab('chat')}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'chat'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <MessageSquare className="h-3.5 w-3.5 text-[#0B2A6F]" />
            <span>
              {tr(lang, 'Gemini Chatbot', 'Gemini සහායක', 'Gemini சாட்பாட்')}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('voice')}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'voice'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Mic className="h-3.5 w-3.5 text-[#0B2A6F]" />
            <span>
              {tr(
                lang,
                'Live Voice (3.8 Live)',
                'සජීවී හඬ (3.8 Live)',
                'நேரடி குரல் (3.8 Live)'
              )}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('transcribe')}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'transcribe'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileAudio className="h-3.5 w-3.5 text-[#0B2A6F]" />
            <span>
              {tr(
                lang,
                'Transcribe Audio (3.5)',
                'හඬ පිටපත් (3.5)',
                'ஆடியோ எழுத்துமாற்றி (3.5)'
              )}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('image')}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'image'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ImageIcon className="h-3.5 w-3.5 text-[#0B2A6F]" />
            <span>
              {tr(
                lang,
                'Image Studio (3.1 Flash)',
                'ඡායාරූප මැදිරිය (3.1)',
                'பட ஸ்டுடியோ (3.1)'
              )}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('search')}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'search'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Globe className="h-3.5 w-3.5 text-[#0B2A6F]" />
            <span>
              {tr(
                lang,
                'Search Grounding',
                'Google සෙවුම් පදනම',
                'தேடல் ஆதாரம்'
              )}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('maps')}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'maps'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <MapPin className="h-3.5 w-3.5 text-[#0B2A6F]" />
            <span>
              {tr(lang, 'Maps Grounding', 'Google සිතියම් පදනම', 'வரைபட ஆதாரம்')}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('cloud')}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'cloud'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CloudUpload className="h-3.5 w-3.5 text-[#0B2A6F]" />
            <span>
              {tr(
                lang,
                `Firebase Cloud (${cloudRecords.length})`,
                `Firebase ක්ලවුඩ් (${cloudRecords.length})`,
                `Firebase கிளவுட் (${cloudRecords.length})`
              )}
            </span>
          </button>
        </div>
      </div>

      {/* =================================================================== */}
      {/* TAB 1: MULTI-TURN GEMINI CHATBOT                                    */}
      {/* =================================================================== */}
      {activeTab === 'chat' && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
          <div className="space-y-4 lg:col-span-4">
            <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-3">
              <div className="text-xs font-semibold text-slate-900">
                {tr(
                  lang,
                  'Select Gemini Model Tier',
                  'Gemini ආකෘති මට්ටම තෝරන්න',
                  'Gemini மாதிரி நிலையைத் தேர்ந்தெடு'
                )}
              </div>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setChatModelMode('pro')}
                  className={`w-full rounded-md border p-2.5 text-left text-xs transition-colors ${
                    chatModelMode === 'pro'
                      ? 'border-[#0B2A6F] bg-blue-50/50 text-slate-900'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="font-mono font-semibold text-[#0B2A6F]">
                    gemini-3.1-pro-preview
                  </div>
                  <div className="mt-0.5 text-[11px] text-slate-600">
                    {tr(
                      lang,
                      'Complex multi-factor triage reasoning & cross-case synthesis',
                      'සංකීර්ණ බහු-සාධක ප්‍රමුඛතා තර්කනය සහ සිදුවීම් සංසන්දනය',
                      'சிக்கலான பல-காரணி பகுப்பாய்வு & நிகழ்வு தொகுப்பு'
                    )}
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setChatModelMode('flash')}
                  className={`w-full rounded-md border p-2.5 text-left text-xs transition-colors ${
                    chatModelMode === 'flash'
                      ? 'border-[#0B2A6F] bg-blue-50/50 text-slate-900'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="font-mono font-semibold text-[#0B2A6F]">
                    gemini-3.8-flash
                  </div>
                  <div className="mt-0.5 text-[11px] text-slate-600">
                    {tr(
                      lang,
                      'Balanced general divisional operations & translation',
                      'සමබර පොදු ප්‍රාදේශීය මෙහෙයුම් සහ පරිවර්තනය',
                      'சமநிலையான பொது பிரதேச செயல்பாடுகள் & மொழிபெயர்ப்பு'
                    )}
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setChatModelMode('lite')}
                  className={`w-full rounded-md border p-2.5 text-left text-xs transition-colors ${
                    chatModelMode === 'lite'
                      ? 'border-[#0B2A6F] bg-blue-50/50 text-slate-900'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="font-mono font-semibold text-[#0B2A6F]">
                    gemini-3.1-flash-lite
                  </div>
                  <div className="mt-0.5 text-[11px] text-slate-600">
                    {tr(
                      lang,
                      'Ultra-fast low-latency lookups & field message drafts',
                      'අධිවේගී ක්ෂණික සෙවීම් සහ ක්ෂේත්‍ර පණිවිඩ කෙටුම්පත්',
                      'அதிவேக தேடல்கள் & கள செய்தி வரைவுகள்'
                    )}
                  </div>
                </button>
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-2">
              <div className="text-xs font-semibold text-slate-900">
                {tr(
                  lang,
                  'Quick Coordinator Prompts',
                  'ඉක්මන් සම්බන්ධීකාරක විමසුම්',
                  'விரைவான ஒருங்கிணைப்பாளர் வினாக்கள்'
                )}
              </div>
              {[
                tr(
                  lang,
                  'Rank our unverified Verify Fast cases and suggest how to verify each one.',
                  'තහවුරු නොකළ "ඉක්මනින් තහවුරු කරන්න" සිදුවීම් පෙළගස්වා ඒවා තහවුරු කරන ආකාරය යෝජනා කරන්න.',
                  'சரிபார்க்கப்படாத நிகழ்வுகளை வரிசைப்படுத்தி ஒவ்வொன்றையும் சரிபார்க்கும் முறையைப் பரிந்துரைக்கவும்.'
                ),
                tr(
                  lang,
                  'Compare the reports merged into C-001 and C-002 and summarize key needs.',
                  'C-001 සහ C-002 වෙත ඒකාබද්ධ කළ වාර්තා සංසන්දනය කර ප්‍රධාන අවශ්‍යතා සාරාංශ කරන්න.',
                  'C-001 மற்றும் C-002 இல் இணைக்கப்பட்ட அறிக்கைகளை ஒப்பிட்டு முக்கிய தேவைகளைச் சுருக்கவும்.'
                ),
                tr(
                  lang,
                  'Draft a short bilingual (Sinhala & Tamil) check-in message for the 3 silent GN officers.',
                  'නිහඬ ග්‍රාම නිලධාරීන් 3 දෙනා සඳහා කෙටි ද්විභාෂා (සිංහල සහ දෙමළ) පණිවිඩයක් කෙටුම්පත් කරන්න.',
                  '3 மௌன கிராம அலுவலர்களுக்கான குறுகிய இருமொழி (சிங்களம் & தமிழ்) செய்தியை உருவாக்கவும்.'
                ),
              ].map((prompt, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSendChat(prompt)}
                  className="w-full rounded-md border border-slate-200 bg-slate-50 p-2 text-left text-xs text-slate-700 hover:border-[#0B2A6F] hover:text-[#0B2A6F] transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>

          <div className="flex h-[440px] sm:h-[540px] flex-col justify-between rounded-lg border border-slate-200 bg-white lg:col-span-8 min-w-0">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <span className="text-xs font-semibold text-slate-900">
                {tr(
                  lang,
                  'Coordinator Multi-Turn Assistant Thread',
                  'සම්බන්ධීකාරක AI සංවාද මාලාව',
                  'ஒருங்கிணைப்பாளர் AI உரையாடல் தொடர்'
                )}
              </span>
              <span className="font-mono text-[11px] text-slate-500">
                {tr(lang, 'Active Model:', 'සක්‍රීය ආකෘතිය:', 'செயலில் உள்ள மாதிரி:')}{' '}
                {chatModelMode === 'pro'
                  ? 'gemini-3.1-pro-preview'
                  : chatModelMode === 'lite'
                  ? 'gemini-3.1-flash-lite'
                  : 'gemini-3.8-flash'}
              </span>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto p-4">
              {chatMessages.map((m) => (
                <div
                  key={m.id}
                  className={`flex flex-col ${
                    m.role === 'user' ? 'items-end' : 'items-start'
                  }`}
                >
                  <div
                    className={`max-w-[85%] rounded-lg p-3 text-xs leading-relaxed ${
                      m.role === 'user'
                        ? 'bg-[#0B2A6F] text-white'
                        : 'border border-slate-200 bg-slate-50 text-slate-900'
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{m.text}</div>
                  </div>
                  <div className="mt-1 flex items-center gap-1.5 text-[10px] text-slate-400 font-mono">
                    <span>
                      {m.role === 'user'
                        ? tr(lang, 'DS Coordinator', 'ප්‍රා.ලේ. සම්බන්ධීකාරක', 'பிரதேச ஒருங்கிணைப்பாளர்')
                        : 'DisaLink AI'}
                    </span>
                    {m.modelUsed && (
                      <>
                        <span>·</span>
                        <span>{m.modelUsed}</span>
                      </>
                    )}
                    <span>·</span>
                    <span>{m.timestamp}</span>
                  </div>
                </div>
              ))}
              {isChatLoading && (
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-[#0B2A6F]" />
                  <span>{tr(lang, 'Thinking...', 'සිතමින්...', 'சிந்திக்கிறது...')}</span>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendChat();
              }}
              className="flex items-center gap-2 border-t border-slate-200 p-3"
            >
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder={tr(
                  lang,
                  'Ask about open cases, Sinhala/Tamil translations, or Silence Radar...',
                  'විවෘත සිදුවීම්, සිංහල/දෙමළ පරිවර්තන හෝ නිහඬතා රේඩාර් පිළිබඳව විමසන්න...',
                  'திறந்த நிகழ்வுகள், சிங்கள/தமிழ் மொழிபெயர்ப்புகள் அல்லது மௌன ரேடார் பற்றி கேளுங்கள்...'
                )}
                className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#0B2A6F] focus:outline-none"
              />
              <button
                type="submit"
                disabled={isChatLoading || !chatInput.trim()}
                className="flex items-center gap-1.5 rounded-md bg-[#0B2A6F] px-4 py-2 text-xs font-semibold text-white hover:bg-[#082054] disabled:opacity-50"
              >
                <Send className="h-3.5 w-3.5" />
                <span>{tr(lang, 'Send', 'යවන්න', 'அனுப்பு')}</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 2: GEMINI 3.8 LIVE VOICE CONVERSATIONS                          */}
      {/* =================================================================== */}
      {activeTab === 'voice' && (
        <div className="rounded-lg border border-slate-200 bg-white p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <div className="font-mono text-xs font-semibold text-[#0B2A6F]">
                {tr(
                  lang,
                  'MODEL: gemini-3.8-live · REAL-TIME BIDIRECTIONAL VOICE',
                  'ආකෘතිය: gemini-3.8-live · තත්‍ය-කාලීන ද්වි-දිශානති හඬ සංවාද',
                  'மாதிரி: gemini-3.8-live · நிகழ்நேர இருவழி குரல் உரையாடல்'
                )}
              </div>
              <h2 className="mt-0.5 text-base font-bold text-slate-900">
                {tr(
                  lang,
                  'Hands-Free Coordinator Voice Briefing & Field Translation',
                  'සම්බන්ධීකාරක හඬ සාරාංශය සහ ක්ෂේත්‍ර පරිවර්තනය',
                  'ஒருங்கிணைப்பாளர் குரல் சுருக்கம் & கள மொழிபெயர்ப்பு'
                )}
              </h2>
              <p className="text-xs text-slate-600">
                {tr(
                  lang,
                  'Streams 16kHz PCM audio to the server WebSocket bridge and plays back 24kHz Gemini Live voice responses with gapless scheduling.',
                  '16kHz PCM ශ්‍රව්‍ය දත්ත WebSocket හරහා යවා 24kHz Gemini Live හඬ ප්‍රතිචාර බාධාවකින් තොරව වාදනය කරයි.',
                  '16kHz PCM ஆடியோவை WebSocket வழியாக அனுப்பி 24kHz Gemini Live குரல் பதில்களைத் தடையின்றி ஒலிக்கச் செய்கிறது.'
                )}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs">
                <Radio className="h-3.5 w-3.5 text-[#0B2A6F]" />
                <span className="font-medium text-slate-700">
                  {tr(lang, 'Voice:', 'හඬ:', 'குரல்:')}
                </span>
                <select
                  value={liveVoiceName}
                  disabled={liveConnected || liveConnecting}
                  onChange={(e) =>
                    setLiveVoiceName(
                      e.target.value as
                        | 'Zephyr'
                        | 'Puck'
                        | 'Charon'
                        | 'Kore'
                        | 'Fenrir'
                    )
                  }
                  className="bg-transparent font-mono text-xs font-semibold text-[#0B2A6F] focus:outline-none disabled:opacity-60"
                >
                  <option value="Zephyr">Zephyr (Calm Coordinator)</option>
                  <option value="Kore">Kore (Clear Dispatch)</option>
                  <option value="Puck">Puck (Rapid Triage)</option>
                  <option value="Charon">Charon (Deep Situation)</option>
                  <option value="Fenrir">Fenrir (Field Command)</option>
                </select>
              </div>

              {!liveConnected ? (
                <button
                  type="button"
                  onClick={startLiveSession}
                  disabled={liveConnecting}
                  className="flex items-center gap-2 rounded-md bg-[#0B2A6F] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#082054] disabled:opacity-50"
                >
                  {liveConnecting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>
                        {tr(
                          lang,
                          'Connecting to Gemini 3.8 Live...',
                          'Gemini 3.8 Live වෙත සම්බන්ධ වෙමින්...',
                          'Gemini 3.8 Live உடன் இணைகிறது...'
                        )}
                      </span>
                    </>
                  ) : (
                    <>
                      <Mic className="h-4 w-4" />
                      <span>
                        {tr(
                          lang,
                          'Start Live Voice Session',
                          'සජීවී හඬ සැසිය අරඹන්න',
                          'நேரடி குரல் அமர்வைத் தொடங்கு'
                        )}
                      </span>
                    </>
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={stopLiveSession}
                  className="flex items-center gap-2 rounded-md bg-red-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-red-700"
                >
                  <MicOff className="h-4 w-4" />
                  <span>
                    {tr(
                      lang,
                      'End Live Voice Session',
                      'සජීවී හඬ සැසිය අවසන් කරන්න',
                      'நேரடி குரல் அமர்வை முடி'
                    )}
                  </span>
                </button>
              )}
            </div>
          </div>

          {liveError && (
            <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900">
              {liveError}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
            <div className="flex flex-col justify-between rounded-lg border border-slate-200 bg-slate-50 p-5 text-center md:col-span-4 space-y-4">
              <div className="flex flex-col items-center">
                <div
                  className={`flex h-16 w-16 items-center justify-center rounded-full border-2 transition-all ${
                    liveConnected
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm'
                      : 'border-slate-300 bg-white text-slate-400'
                  }`}
                >
                  <Volume2 className="h-7 w-7" />
                </div>
                <div className="mt-3 text-sm font-semibold text-slate-900">
                  {liveConnected
                    ? tr(
                        lang,
                        `Live Audio Stream (${liveVoiceName})`,
                        `සජීවී හඬ ප්‍රවාහය (${liveVoiceName})`,
                        `நேரடி ஆடியோ ஓட்டம் (${liveVoiceName})`
                      )
                    : tr(
                        lang,
                        'Voice Session Standby',
                        'හඬ සැසිය සූදානම්',
                        'குரல் அமர்வு தயார் நிலையில் உள்ளது'
                      )}
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  {liveConnected
                    ? tr(
                        lang,
                        'Speak into your microphone in English, Sinhala, or Tamil—or click a quick voice briefing prompt below.',
                        'ඉංග්‍රීසි, සිංහල හෝ දෙමළ භාෂාවෙන් මයික්‍රෆෝනයට කතා කරන්න—නැතහොත් පහත ක්ෂණික හඬ විමසුමක් ක්ලික් කරන්න.',
                        'ஆங்கிலம், சிங்களம் அல்லது தமிழில் மைக்ரோஃபோனில் பேசுங்கள்—அல்லது கீழே உள்ள குரல் வினாவைத் தேர்ந்தெடுக்கவும்.'
                      )
                    : tr(
                        lang,
                        'Click "Start Live Voice Session" above to open the real-time WebSocket bridge.',
                        'තත්‍ය-කාලීන හඬ සම්බන්ධතාවය විවෘත කිරීමට ඉහත "සජීවී හඬ සැසිය අරඹන්න" ක්ලික් කරන්න.',
                        'நிகழ்நேர குரல் இணைப்பைத் திறக்க மேலே உள்ள "நேரடி குரல் அமர்வைத் தொடங்கு" என்பதைக் கிளிக் செய்க.'
                      )}
                </p>

                {/* Live 16kHz PCM Mic Level Meter */}
                <div className="mt-3 w-full max-w-[220px] space-y-1">
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
                    <span>16kHz PCM Input</span>
                    <span>{liveConnected ? `${liveMicLevel}%` : 'OFF'}</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="h-full bg-emerald-600 transition-all duration-75"
                      style={{
                        width: `${liveConnected ? Math.max(6, liveMicLevel) : 0}%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Quick Voice Briefing Prompts */}
              <div className="space-y-1.5 text-left border-t border-slate-200 pt-3">
                <div className="text-[11px] font-semibold text-slate-700">
                  {tr(
                    lang,
                    'One-Click Spoken Briefing Triggers:',
                    'ක්ෂණික හඬ සාරාංශ විධාන:',
                    'ஒரு-கிளிக் குரல் சுருக்க கட்டளைகள்:'
                  )}
                </div>
                {[
                  tr(
                    lang,
                    'Give me a 20-second spoken briefing on our Act Now cases.',
                    'ක්‍රියාත්මක විය යුතු (Act Now) සිදුවීම් පිළිබඳ තත්පර 20ක හඬ සාරාංශයක් දෙන්න.',
                    'உடனடி நடவடிக்கை (Act Now) சம்பவங்கள் குறித்து 20 வினாடி குரல் சுருக்கம் தரவும்.'
                  ),
                  tr(
                    lang,
                    'Which Silent GN Divisions need an urgent radio check right now?',
                    'දැනට හදිසි ගුවන්විදුලි පරීක්ෂාවක් අවශ්‍ය නිහඬ ග්‍රාම නිලධාරී වසම් මොනවාද?',
                    'தற்போது அவசர ரேடியோ சோதனை தேவைப்படும் மௌன கிராம பிரிவுகள் எவை?'
                  ),
                ].map((qPrompt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    disabled={!liveConnected}
                    onClick={() => sendQuickLivePrompt(qPrompt)}
                    className="w-full rounded border border-slate-200 bg-white px-2.5 py-1.5 text-left text-[11px] text-slate-700 hover:border-[#0B2A6F] hover:text-[#0B2A6F] disabled:opacity-50"
                  >
                    {qPrompt}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col justify-between rounded-lg border border-slate-200 bg-white p-4 md:col-span-8">
              <div>
                <div className="text-xs font-semibold text-slate-800 border-b border-slate-100 pb-2">
                  {tr(
                    lang,
                    'Live Session Transcripts (Input & Output Audio)',
                    'සජීවී සැසි පිටපත් (ආදාන සහ ප්‍රතිදාන හඬ)',
                    'நேரடி அமர்வு உரைப்பதிவுகள் (உள்ளீடு & வெளியீடு ஆடியோ)'
                  )}
                </div>
                <div className="mt-2 h-48 overflow-y-auto space-y-2 text-xs">
                  {liveTranscripts.length === 0 ? (
                    <div className="py-12 text-center text-slate-400">
                      {tr(
                        lang,
                        'Transcripts will appear here during your live voice conversation.',
                        'සජීවී හඬ සංවාදය අතරතුර පිටපත් මෙහි දිස්වනු ඇත.',
                        'நேரடி குரல் உரையாடலின் போது உரைப்பதிவுகள் இங்கே தோன்றும்.'
                      )}
                    </div>
                  ) : (
                    liveTranscripts.map((tItem, idx) => (
                      <div
                        key={idx}
                        className="rounded border border-slate-100 bg-slate-50 p-2"
                      >
                        <span className="font-semibold text-[#0B2A6F]">
                          {tItem.speaker}:{' '}
                        </span>
                        <span className="text-slate-800">{tItem.text}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <form
                onSubmit={handleSendLiveTextPrompt}
                className="mt-3 flex items-center gap-2 border-t border-slate-100 pt-3"
              >
                <input
                  type="text"
                  value={liveTextFallback}
                  onChange={(e) => setLiveTextFallback(e.target.value)}
                  disabled={!liveConnected}
                  placeholder={
                    liveConnected
                      ? tr(
                          lang,
                          'Send a prompt to the live session (Gemini will speak the reply aloud)...',
                          'සජීවී සැසියට පණිවිඩයක් යවන්න (Gemini හඬින් පිළිතුරු දෙනු ඇත)...',
                          'நேரடி அமர்வுக்கு செய்தி அனுப்புக (Gemini குரலில் பதிலளிக்கும்)...'
                        )
                      : tr(
                          lang,
                          'Start the Live Voice Session first...',
                          'පළමුව සජීවී හඬ සැසිය අරඹන්න...',
                          'முதலில் நேரடி குரல் அமர்வைத் தொடங்கவும்...'
                        )
                  }
                  className="flex-1 rounded-md border border-slate-300 px-3 py-1.5 text-xs text-slate-900 disabled:bg-slate-100"
                />
                <button
                  type="submit"
                  disabled={!liveConnected || !liveTextFallback.trim()}
                  className="rounded-md bg-[#0B2A6F] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#082054] disabled:opacity-50"
                >
                  {tr(lang, 'Speak Reply', 'හඬින් පිළිතුරු දෙන්න', 'குரலில் பதிலளி')}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 2B: GEMINI 3.5 MULTILINGUAL AUDIO TRANSCRIPTION STUDIO          */}
      {/* =================================================================== */}
      {activeTab === 'transcribe' && (
        <AudioTranscriptionPanel
          lang={lang}
          onForwardTranscriptToSubmit={onUseTranscriptInSubmit}
        />
      )}

      {/* =================================================================== */}
      {/* TAB 2C: GEMINI 3.1 FLASH IMAGE CREATION & EDITING STUDIO            */}
      {/* =================================================================== */}
      {activeTab === 'image' && (
        <ImageStudioPanel
          lang={lang}
          onSaveToCloud={
            user
              ? async (title, summaryText) => {
                  await saveCoordinatorRecordToFirestore({
                    recordType: 'grounding_brief',
                    targetId: `IMG_${Date.now().toString(36).toUpperCase()}`,
                    title,
                    summaryText,
                    urgency: 3,
                    status: 'active',
                  });
                }
              : undefined
          }
        />
      )}

      {/* =================================================================== */}
      {/* TAB 3: GOOGLE SEARCH GROUNDING                                      */}
      {/* =================================================================== */}
      {activeTab === 'search' && (
        <div className="rounded-lg border border-slate-200 bg-white p-5 space-y-4">
          <div className="border-b border-slate-200 pb-3">
            <div className="font-mono text-xs font-semibold text-[#0B2A6F]">
              {tr(
                lang,
                'GOOGLE SEARCH GROUNDING · LIVE WEB VERIFICATION',
                'GOOGLE සෙවුම් පදනම · සජීවී වෙබ් තහවුරු කිරීම',
                'கூகிள் தேடல் ஆதாரம் · நேரடி இணையச் சரிபார்ப்பு'
              )}
            </div>
            <h2 className="mt-0.5 text-base font-bold text-slate-900">
              {tr(
                lang,
                'Verify Live Weather Warnings, River Levels & DMC Bulletins',
                'සජීවී කාලගුණ අනතුරු ඇඟවීම්, ගංගා ජල මට්ටම් සහ DMC නිවේදන පරීක්ෂා කරන්න',
                'நேரடி வானிலை எச்சரிக்கைகள், ஆற்று நீர்மட்டம் & DMC அறிவிப்புகளைச் சரிபார்'
              )}
            </h2>
            <p className="text-xs text-slate-600">
              {tr(
                lang,
                'Uses Google Search grounding to retrieve up-to-date public information with verifiable web citations.',
                'තහවුරු කළ හැකි වෙබ් මූලාශ්‍ර සහිතව යාවත්කාලීන මහජන තොරතුරු ලබා ගැනීමට Google Search පදනම භාවිතා කරයි.',
                'சரிபார்க்கக்கூடிய இணைய ஆதாரங்களுடன் சமீபத்திய பொதுத் தகவல்களைப் பெற கூகிள் தேடல் ஆதாரத்தைப் பயன்படுத்துகிறது.'
              )}
            </p>
          </div>

          <form onSubmit={handleRunSearchGrounding} className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={tr(
                lang,
                'Search Sri Lanka weather warnings, DMC updates, NBRO landslide alerts...',
                'ශ්‍රී ලංකා කාලගුණ අනතුරු ඇඟවීම්, DMC යාවත්කාලීන, NBRO නායයෑම් නිවේදන සොයන්න...',
                'இலங்கை வானிலை எச்சரிக்கைகள், DMC அறிவிப்புகள், NBRO மண்சரிவு எச்சரிக்கைகளைத் தேடு...'
              )}
              className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-[#0B2A6F] focus:outline-none"
            />
            <button
              type="submit"
              disabled={isSearching || !searchQuery.trim()}
              className="flex items-center gap-1.5 rounded-md bg-[#0B2A6F] px-4 py-2 text-xs font-semibold text-white hover:bg-[#082054] disabled:opacity-50 whitespace-nowrap"
            >
              {isSearching ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>
                    {tr(
                      lang,
                      'Searching Google...',
                      'Google හි සොයමින්...',
                      'கூகிளில் தேடுகிறது...'
                    )}
                  </span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>
                    {tr(
                      lang,
                      'Run Grounded Search',
                      'මූලාශ්‍ර සහිත සෙවුම ක්‍රියාත්මක කරන්න',
                      'ஆதாரத் தேடலை இயக்கு'
                    )}
                  </span>
                </>
              )}
            </button>
          </form>

          {searchError && (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-800">
              {searchError}
            </div>
          )}

          {searchResult && (
            <div className="space-y-4 pt-2">
              <div className="rounded-md border border-slate-200 bg-slate-50 p-4 text-xs leading-relaxed text-slate-900 whitespace-pre-wrap">
                {searchResult.text}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-slate-800">
                    {tr(
                      lang,
                      `Grounded Web Sources (${searchResult.sources.length})`,
                      `මූලාශ්‍රගත වෙබ් සබැඳි (${searchResult.sources.length})`,
                      `இணைய ஆதார இணைப்புகள் (${searchResult.sources.length})`
                    )}
                  </h3>
                  {user && (
                    <button
                      type="button"
                      onClick={async () => {
                        await saveCoordinatorRecordToFirestore({
                          recordType: 'grounding_brief',
                          targetId: 'SEARCH_BRIEF',
                          title: `Search Brief: ${searchQuery.slice(0, 80)}`,
                          summaryText: searchResult.text,
                          urgency: 3,
                        });
                        setCloudBanner(
                          tr(
                            lang,
                            'Saved Google Search grounding brief to Firestore!',
                            'Google සෙවුම් වාර්තාව Firestore වෙත සුරකින ලදී!',
                            'கூகிள் தேடல் சுருக்கம் Firestore இல் சேமிக்கப்பட்டது!'
                          )
                        );
                        setActiveTab('cloud');
                      }}
                      className="text-xs font-semibold text-[#0B2A6F] hover:underline"
                    >
                      {tr(
                        lang,
                        'Save Brief to Firestore Cloud →',
                        'වාර්තාව Firestore ක්ලවුඩ් වෙත සුරකින්න →',
                        'சுருக்கத்தை Firestore கிளவுட்டில் சேமி →'
                      )}
                    </button>
                  )}
                </div>
                {searchResult.sources.length === 0 ? (
                  <p className="text-xs text-slate-500">
                    {tr(
                      lang,
                      'No external web links attached in metadata.',
                      'බාහිර වෙබ් සබැඳි අමුණා නොමැත.',
                      'வெளிப்புற இணைய இணைப்புகள் எதுவும் இல்லை.'
                    )}
                  </p>
                ) : (
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {searchResult.sources.map((src, i) => (
                      <a
                        key={i}
                        href={src.uri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between gap-2 rounded-md border border-slate-200 bg-white p-2.5 text-xs text-[#0B2A6F] hover:border-[#0B2A6F]"
                      >
                        <span className="truncate font-medium">
                          {src.title}
                        </span>
                        <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 4: GOOGLE MAPS GROUNDING                                        */}
      {/* =================================================================== */}
      {activeTab === 'maps' && (
        <div className="rounded-lg border border-slate-200 bg-white p-5 space-y-4">
          <div className="border-b border-slate-200 pb-3">
            <div className="font-mono text-xs font-semibold text-[#0B2A6F]">
              {tr(
                lang,
                'GOOGLE MAPS GROUNDING · NEARBY CRITICAL INFRASTRUCTURE',
                'GOOGLE සිතියම් පදනම · ආසන්න අත්‍යවශ්‍ය යටිතල පහසුකම්',
                'கூகிள் வரைபட ஆதாரம் · அருகிலுள்ள முக்கிய உள்கட்டமைப்பு'
              )}
            </div>
            <h2 className="mt-0.5 text-base font-bold text-slate-900">
              {tr(
                lang,
                'Locate Nearby Hospitals, Schools, Bridges & Evacuation Centres',
                'ආසන්න රෝහල්, පාසල්, පාලම් සහ ආරක්ෂිත මධ්‍යස්ථාන සොයා ගන්න',
                'அருகிலுள்ள மருத்துவமனைகள், பள்ளிகள், பாலங்கள் & மீட்பு மையங்களைக் கண்டறி'
              )}
            </h2>
            <p className="text-xs text-slate-600">
              {tr(
                lang,
                "Queries Google Maps Grounding around any open incident case's GPS coordinates and extracts verified place links.",
                'ඕනෑම විවෘත සිදුවීමක GPS ඛණ්ඩාංක ආශ්‍රිතව Google සිතියම් පදනම විමසා තහවුරු කළ ස්ථාන සබැඳි ලබා දෙයි.',
                'திறந்த நிகழ்வின் GPS ஆயங்களைச் சுற்றியுள்ள கூகிள் வரைபட ஆதாரத்தை வினவி சரிபார்க்கப்பட்ட இட இணைப்புகளை வழங்குகிறது.'
              )}
            </p>
          </div>

          <form
            onSubmit={handleRunMapsGrounding}
            className="grid grid-cols-1 gap-3 sm:grid-cols-12"
          >
            <div className="sm:col-span-4">
              <label className="block text-[11px] font-semibold text-slate-700">
                {tr(
                  lang,
                  'Anchor Incident Case Coordinates',
                  'මූලික සිදුවීම් ඛණ්ඩාංක',
                  'ஆதார நிகழ்வு ஆயங்கள்'
                )}
              </label>
              <select
                value={selectedMapsCaseId}
                onChange={(e) => setSelectedMapsCaseId(e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-300 bg-white px-2.5 py-2 font-mono text-xs text-slate-900"
              >
                {cases.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.id} — {localizePlace(c.place_english, lang)} (
                    {c.lat.toFixed(3)}, {c.lng.toFixed(3)})
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-6">
              <label className="block text-[11px] font-semibold text-slate-700">
                {tr(
                  lang,
                  'Infrastructure / Place Query',
                  'යටිතල පහසුකම් / ස්ථාන විමසුම',
                  'உள்கட்டமைப்பு / இட வினா'
                )}
              </label>
              <input
                type="text"
                value={mapsQuery}
                onChange={(e) => setMapsQuery(e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-[#0B2A6F] focus:outline-none"
              />
            </div>

            <div className="flex items-end sm:col-span-2">
              <button
                type="submit"
                disabled={isMapsLoading || !mapsQuery.trim()}
                className="flex w-full items-center justify-center gap-1.5 rounded-md bg-[#0B2A6F] px-3 py-2 text-xs font-semibold text-white hover:bg-[#082054] disabled:opacity-50 whitespace-nowrap"
              >
                {isMapsLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <MapPin className="h-4 w-4" />
                    <span>
                      {tr(lang, 'Find Places', 'ස්ථාන සොයන්න', 'இடங்களைக் கண்டறி')}
                    </span>
                  </>
                )}
              </button>
            </div>
          </form>

          {mapsError && (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-800">
              {mapsError}
            </div>
          )}

          {mapsResult && (
            <div className="space-y-4 pt-2">
              <div className="rounded-md border border-slate-200 bg-slate-50 p-4 text-xs leading-relaxed text-slate-900 whitespace-pre-wrap">
                {mapsResult.text}
              </div>

              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-slate-800">
                  {tr(
                    lang,
                    `Google Maps Grounded Place Links (${mapsResult.places.length})`,
                    `Google සිතියම් ස්ථාන සබැඳි (${mapsResult.places.length})`,
                    `கூகிள் வரைபட இட இணைப்புகள் (${mapsResult.places.length})`
                  )}
                </h3>
                {mapsResult.places.length === 0 ? (
                  <p className="text-xs text-slate-500">
                    {tr(
                      lang,
                      'No direct Maps URI chunks returned for this query.',
                      'මෙම විමසුම සඳහා සෘජු සිතියම් සබැඳි ලැබී නැත.',
                      'இந்த வினாவிற்கு நேரடி வரைபட இணைப்புகள் எதுவும் கிடைக்கவில்லை.'
                    )}
                  </p>
                ) : (
                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                    {mapsResult.places.map((pl, idx) => (
                      <div
                        key={idx}
                        className="rounded-md border border-slate-200 bg-white p-3 space-y-1.5"
                      >
                        <a
                          href={pl.uri}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between gap-2 text-xs font-semibold text-[#0B2A6F] hover:underline"
                        >
                          <span>{pl.title}</span>
                          <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                        </a>
                        {pl.reviewSnippets.length > 0 && (
                          <div className="text-[11px] text-slate-600 space-y-1">
                            {pl.reviewSnippets.slice(0, 2).map((snip, sIdx) => (
                              <p key={sIdx} className="italic">
                                "{snip}"
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 5: FIREBASE AUTH & FIRESTORE CLOUD SYNC                         */}
      {/* =================================================================== */}
      {activeTab === 'cloud' && (
        <div className="rounded-lg border border-slate-200 bg-white p-5 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <div className="font-mono text-xs font-semibold text-[#0B2A6F]">
                {tr(
                  lang,
                  'FIREBASE AUTHENTICATION & FIRESTORE CLOUD PERSISTENCE',
                  'FIREBASE සත්‍යාපනය සහ FIRESTORE ක්ලවුඩ් ගබඩාව',
                  'FIREBASE அங்கீகாரம் & FIRESTORE கிளவுட் சேமிப்பகம்'
                )}
              </div>
              <h2 className="mt-0.5 text-base font-bold text-slate-900">
                {tr(
                  lang,
                  'Coordinator Cloud Vault (/coordinator_records)',
                  'සම්බන්ධීකාරක ක්ලවුඩ් ගබඩාව (/coordinator_records)',
                  'ஒருங்கிணைப்பாளர் கிளவுட் பெட்டகம் (/coordinator_records)'
                )}
              </h2>
              <p className="text-xs text-slate-600">
                {tr(
                  lang,
                  'Sign in with Google to persist confirmed incident cases, field reports, and situation briefs across devices with zero-trust Firestore rules.',
                  'ආරක්ෂිත Firestore නීති යටතේ උපාංග හරහා තහවුරු කළ සිදුවීම්, ක්ෂේත්‍ර වාර්තා සහ තත්ත්ව සාරාංශ සුරැකීමට Google ගිණුමෙන් පිවිසෙන්න.',
                  'பாதுகாப்பான Firestore விதிகளுடன் உறுதிப்படுத்தப்பட்ட நிகழ்வுகள், கள அறிக்கைகள் மற்றும் சுருக்கங்களைச் சேமிக்க Google மூலம் உள்நுழையவும்.'
                )}
              </p>
            </div>

            {!user ? (
              <button
                type="button"
                onClick={() => signInCoordinatorWithGoogle()}
                className="flex items-center gap-2 rounded-md bg-[#0B2A6F] px-4 py-2 text-xs font-semibold text-white hover:bg-[#082054]"
              >
                <LogIn className="h-4 w-4" />
                <span>
                  {tr(
                    lang,
                    'Sign in with Google (Coordinator Auth)',
                    'Google ගිණුමෙන් පිවිසෙන්න (සම්බන්ධීකාරක)',
                    'Google மூலம் உள்நுழைக (ஒருங்கிணைப்பாளர்)'
                  )}
                </span>
              </button>
            ) : (
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="text-xs text-slate-600">
                  {tr(lang, 'Signed in as', 'පිවිසී ඇත්තේ:', 'உள்நுழைந்துள்ளவர்:')}{' '}
                  <strong>{user.displayName || user.email}</strong>
                </span>
                <button
                  type="button"
                  onClick={handleSyncConfirmedCasesToCloud}
                  disabled={isSyncingCloud}
                  className="flex items-center gap-1.5 rounded-md bg-[#0B2A6F] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#082054] disabled:opacity-50"
                >
                  <CloudUpload className="h-3.5 w-3.5" />
                  <span>
                    {isSyncingCloud
                      ? tr(lang, 'Syncing...', 'සමමුහුර්ත වෙමින්...', 'ஒத்திசைக்கிறது...')
                      : tr(
                          lang,
                          'Sync Confirmed Cases to Firestore',
                          'තහවුරු කළ සිදුවීම් Firestore වෙත සමමුහුර්ත කරන්න',
                          'உறுதிப்படுத்தப்பட்ட நிகழ்வுகளை Firestore இல் ஒத்திசை'
                        )}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => signOutCoordinator()}
                  className="flex items-center gap-1 rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>{tr(lang, 'Sign Out', 'ඉවත් වන්න', 'வெளியேறு')}</span>
                </button>
              </div>
            )}
          </div>

          {cloudBanner && (
            <div className="flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-medium text-emerald-900">
              <CheckCircle2 className="h-4 w-4 text-emerald-700 shrink-0" />
              <span>{cloudBanner}</span>
            </div>
          )}

          {!user ? (
            <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
              <p className="text-sm font-semibold text-slate-800">
                {tr(
                  lang,
                  'Sign in with Google to view and manage your Firestore Cloud Records',
                  'ඔබගේ Firestore ක්ලවුඩ් සටහන් බැලීමට සහ කළමනාකරණය කිරීමට Google ගිණුමෙන් පිවිසෙන්න',
                  'உங்கள் Firestore கிளவுட் பதிவுகளைப் பார்க்கவும் நிர்வகிக்கவும் Google மூலம் உள்நுழையவும்'
                )}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {tr(
                  lang,
                  'Local IndexedDB continues to work 100% offline; signing in enables cloud backup and cross-device access protected by owner-isolated Firestore security rules.',
                  'දේශීය IndexedDB 100% අන්තර්ජාලය නොමැතිව (Offline) ක්‍රියා කරයි; පිවිසීමෙන් ආරක්ෂිත Firestore නීති යටතේ ක්ලවුඩ් උපස්ථය සක්‍රීය වේ.',
                  'உள்ளூர் IndexedDB 100% ஆஃப்லைனில் செயல்படுகிறது; உள்நுழைவது பாதுகாப்பான Firestore கிளவுட் காப்புப்பிரதியை செயல்படுத்துகிறது.'
                )}
              </p>
            </div>
          ) : cloudRecords.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
              <p className="text-sm font-semibold text-slate-800">
                {tr(
                  lang,
                  'No Cloud Records Synced Yet',
                  'ක්ලවුඩ් සටහන් කිසිවක් තවම සමමුහුර්ත කර නැත',
                  'கிளவுட் பதிவுகள் எதுவும் இன்னும் ஒத்திசைக்கப்படவில்லை'
                )}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {tr(
                  lang,
                  'Click "Sync Confirmed Cases to Firestore" above to push your confirmed triage cases to Firestore.',
                  'තහවුරු කළ සිදුවීම් Firestore වෙත යැවීමට ඉහත "තහවුරු කළ සිදුවීම් Firestore වෙත සමමුහුර්ත කරන්න" ක්ලික් කරන්න.',
                  'உறுதிப்படுத்தப்பட்ட நிகழ்வுகளை Firestore இல் சேமிக்க மேலே உள்ள பொத்தானைக் கிளிக் செய்க.'
                )}
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {cloudRecords.map((rec) => (
                <div
                  key={rec.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50/60 p-3.5 text-xs"
                >
                  <div className="space-y-1 max-w-2xl">
                    <div className="flex items-center gap-2 font-mono text-[11px] text-slate-500">
                      <span className="font-semibold text-[#0B2A6F]">
                        {rec.recordType.toUpperCase()}
                      </span>
                      <span>·</span>
                      <span>
                        {tr(lang, 'Target:', 'ඉලක්කය:', 'இலக்கு:')} {rec.targetId}
                      </span>
                      <span>·</span>
                      <span>
                        {tr(lang, 'Urgency:', 'හදිසිභාවය:', 'அவசரம்:')}{' '}
                        {rec.urgency}/5
                      </span>
                      <span>·</span>
                      <span
                        className={`font-semibold ${
                          rec.status === 'verified'
                            ? 'text-emerald-700'
                            : rec.status === 'archived'
                            ? 'text-slate-500'
                            : 'text-amber-700'
                        }`}
                      >
                        {tr(lang, 'Status:', 'තත්ත්වය:', 'நிலை:')}{' '}
                        {rec.status.toUpperCase()}
                      </span>
                    </div>
                    <div className="text-sm font-semibold text-slate-900">
                      {rec.title}
                    </div>
                    <p className="text-xs text-slate-600">{rec.summaryText}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    {rec.status !== 'archived' && (
                      <>
                        <button
                          type="button"
                          onClick={() =>
                            updateCoordinatorRecordStatusInFirestore(
                              rec,
                              rec.status === 'verified' ? 'active' : 'verified'
                            )
                          }
                          className="rounded border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                        >
                          {rec.status === 'verified'
                            ? tr(lang, 'Mark Active', 'සක්‍රීය ලෙස ලකුණු කරන්න', 'செயலில் குறி')
                            : tr(lang, 'Mark Verified', 'තහවුරු කළ ලෙස ලකුණු කරන්න', 'சரிபார்க்கப்பட்டதாகக் குறி')}
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            updateCoordinatorRecordStatusInFirestore(
                              rec,
                              'archived'
                            )
                          }
                          className="inline-flex items-center gap-1 rounded border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                        >
                          <Archive className="h-3 w-3" />
                          <span>
                            {tr(lang, 'Archive (Lock)', 'සංරක්ෂණය (අගුළු)', 'காப்பகப்படுத்து (பூட்டு)')}
                          </span>
                        </button>
                      </>
                    )}
                    <button
                      type="button"
                      onClick={() =>
                        deleteCoordinatorRecordFromFirestore(rec.id)
                      }
                      className="inline-flex items-center gap-1 rounded border border-red-200 bg-white px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
