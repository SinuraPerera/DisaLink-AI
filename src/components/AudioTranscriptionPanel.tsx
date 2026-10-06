import React, { useEffect, useRef, useState } from 'react';
import { UILanguage } from '../types';
import { tr } from '../lib/i18n';
import {
  ArrowRight,
  Check,
  Copy,
  FileAudio,
  Loader2,
  Mic,
  Radio,
  Square,
  Upload,
} from 'lucide-react';

interface AudioTranscriptionPanelProps {
  lang: UILanguage;
  onForwardTranscriptToSubmit?: (transcript: string) => void;
}

interface TranscriptionHistoryItem {
  id: string;
  transcript: string;
  modelUsed: string;
  sourceLabel: string;
  timestamp: string;
}

function createSampleWavBase64(): string {
  const sampleRate = 8000;
  const numSamples = sampleRate * 1; // 1 second PCM WAV header + tone
  const buffer = new ArrayBuffer(44 + numSamples * 2);
  const view = new DataView(buffer);

  const writeStr = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeStr(0, 'RIFF');
  view.setUint32(4, 36 + numSamples * 2, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeStr(36, 'data');
  view.setUint32(40, numSamples * 2, true);

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const sample = Math.sin(2 * Math.PI * 440 * t) * 0.15;
    view.setInt16(44 + i * 2, sample * 0x7fff, true);
  }

  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export const AudioTranscriptionPanel: React.FC<
  AudioTranscriptionPanelProps
> = ({ lang, onForwardTranscriptToSubmit }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [activeModel, setActiveModel] = useState('gemini-3.5-transcribe');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState<TranscriptionHistoryItem[]>([]);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state !== 'inactive'
      ) {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const sendAudioToTranscribe = async (
    base64Audio: string,
    mimeType: string,
    sourceLabel: string,
    sampleHint?: string
  ) => {
    setIsTranscribing(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/gemini/transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audioBase64: base64Audio,
          mimeType,
          sampleHint,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      const text = (data.transcript || '').trim();
      const modelUsed = data.modelUsed || 'gemini-3.5-transcribe';
      setTranscript(text);
      setActiveModel(modelUsed);
      setHistory((prev) => [
        {
          id: `tr-${Date.now()}`,
          transcript: text,
          modelUsed,
          sourceLabel,
          timestamp: new Date().toLocaleTimeString(),
        },
        ...prev.slice(0, 5),
      ]);
    } catch (err: any) {
      setErrorMsg(
        err?.message || 'Failed to transcribe audio with gemini-3.5-transcribe.'
      );
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleToggleMicRecording = async () => {
    setErrorMsg(null);

    if (isRecording && mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setErrorMsg(
        tr(
          lang,
          'Microphone not available in this browser context. Use "Upload Audio File" or "Test Sample Field Radio Audio" below.',
          'මෙම බ්‍රවුසරයේ මයික්‍රෆෝන පහසුකම නොමැත. පහත "හඬ ගොනුවක් උඩුගත කරන්න" හෝ "ආදර්ශ හඬ පරීක්ෂාව" භාවිතා කරන්න.',
          'மைக்ரோஃபோன் கிடைக்கவில்லை. கீழே உள்ள ஆடியோ கோப்பு பதிவேற்றம் அல்லது மாதிரி ஆடியோவைப் பயன்படுத்தவும்.'
        )
      );
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        const blob = new Blob(audioChunksRef.current, {
          type: recorder.mimeType || 'audio/webm',
        });
        const reader = new FileReader();
        reader.onloadend = async () => {
          const dataUrl = reader.result as string;
          const base64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : '';
          if (base64) {
            await sendAudioToTranscribe(
              base64,
              blob.type || 'audio/webm',
              tr(lang, 'Live Microphone', 'සජීවී මයික්‍රෆෝනය', 'நேரடி மைக்ரோஃபோன்')
            );
          }
        };
        reader.readAsDataURL(blob);
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);
      timerRef.current = window.setInterval(() => {
        setRecordingSeconds((s) => s + 1);
      }, 1000);
    } catch {
      setErrorMsg(
        tr(
          lang,
          'Microphone permission denied. You can still upload an audio file or run a sample field radio clip below.',
          'මයික්‍රෆෝන අවසරය ලබා දී නොමැත. ඔබට හඬ ගොනුවක් උඩුගත කිරීමට හෝ ආදර්ශ හඬ පටයක් පරීක්ෂා කිරීමට හැකිය.',
          'மைக்ரோஃபோன் அனுமதி மறுக்கப்பட்டது. ஆடியோ கோப்பைப் பதிவேற்றலாம் அல்லது மாதிரி ஆடியோவை இயக்கலாம்.'
        )
      );
    }
  };

  const handleUploadAudioFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = async () => {
      const dataUrl = reader.result as string;
      const base64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : '';
      if (base64) {
        await sendAudioToTranscribe(
          base64,
          file.type || 'audio/webm',
          file.name
        );
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleRunSampleClip = async (
    sampleText: string,
    label: string
  ) => {
    const wavBase64 = createSampleWavBase64();
    await sendAudioToTranscribe(wavBase64, 'audio/wav', label, sampleText);
  };

  const handleCopy = async () => {
    if (!transcript) return;
    await navigator.clipboard.writeText(transcript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60)
      .toString()
      .padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="font-mono text-xs font-semibold text-[#0B2A6F]">
            {tr(
              lang,
              'MODEL: gemini-3.5-transcribe · MULTILINGUAL SPEECH-TO-TEXT',
              'ආකෘතිය: gemini-3.5-transcribe · බහුභාෂා හඬ පිටපත් කිරීම',
              'மாதிரி: gemini-3.5-transcribe · பன்மொழி குரல் உரை மாற்றம்'
            )}
          </div>
          <h2 className="mt-0.5 text-base font-bold text-slate-900">
            {tr(
              lang,
              'Field Audio & Radio Note Transcription (Sinhala · Tamil · English · Singlish)',
              'ක්ෂේත්‍ර හඬ සහ ගුවන්විදුලි පණිවිඩ පිටපත් කිරීම (සිංහල · දෙමළ · ඉංග්‍රීසි)',
              'கள ஆடியோ & வானொலி செய்தி உரைப்பதிவு (சிங்களம் · தமிழ் · ஆங்கிலம்)'
            )}
          </h2>
          <p className="text-xs text-slate-600">
            {tr(
              lang,
              'Record directly from your microphone, upload a WhatsApp/radio voice note, or test a sample field transmission using gemini-3.5-transcribe.',
              'මයික්‍රෆෝනයෙන් සෘජුවම පටිගත කරන්න, හඬ ගොනුවක් උඩුගත කරන්න, නැතහොත් gemini-3.5-transcribe ආදර්ශ හඬ පටයක් පරීක්ෂා කරන්න.',
              'மைக்ரோஃபோன் மூலம் பதிவு செய்யவும், ஆடியோ கோப்பைப் பதிவேற்றவும் அல்லது gemini-3.5-transcribe மாதிரியை இயக்கவும்.'
            )}
          </p>
        </div>

        <span className="rounded-md border border-blue-200 bg-blue-50 px-2.5 py-1 font-mono text-[11px] font-semibold text-[#0B2A6F]">
          Engine: {activeModel}
        </span>
      </div>

      {errorMsg && (
        <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900">
          {errorMsg}
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        {/* Left: Microphone Recorder, Audio Upload & Sample Field Clips */}
        <div className="space-y-4 lg:col-span-5">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-3">
            <div className="text-xs font-semibold text-slate-900">
              {tr(
                lang,
                '1. Record Microphone or Upload Voice Note',
                '1. මයික්‍රෆෝනයෙන් පටිගත කරන්න හෝ හඬ ගොනුවක් එක් කරන්න',
                '1. மைக்ரோஃபோனில் பதிவு செய் அல்லது ஆடியோ பதிவேற்று'
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={handleToggleMicRecording}
                disabled={isTranscribing}
                className={`flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2.5 text-xs font-semibold transition-colors ${
                  isRecording
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-[#0B2A6F] text-white hover:bg-[#082054]'
                } disabled:opacity-50`}
              >
                {isRecording ? (
                  <>
                    <Square className="h-3.5 w-3.5 fill-current" />
                    <span>
                      {tr(lang, 'Stop & Transcribe', 'නවතා පිටපත් කරන්න', 'நிறுத்தி உரையாக்கு')}{' '}
                      ({formatTimer(recordingSeconds)})
                    </span>
                  </>
                ) : (
                  <>
                    <Mic className="h-4 w-4" />
                    <span>
                      {tr(
                        lang,
                        'Record with Microphone',
                        'මයික්‍රෆෝනයෙන් පටිගත කරන්න',
                        'மைக்ரோஃபோனில் பதிவு செய்'
                      )}
                    </span>
                  </>
                )}
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*"
                onChange={handleUploadAudioFile}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isRecording || isTranscribing}
                className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50"
              >
                <Upload className="h-3.5 w-3.5 text-[#0B2A6F]" />
                <span>
                  {tr(lang, 'Upload Audio', 'හඬ ගොනුවක්', 'ஆடியோ பதிவேற்று')}
                </span>
              </button>
            </div>

            {isRecording && (
              <div className="flex items-center gap-2 rounded border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-800">
                <span className="h-2.5 w-2.5 rounded-full bg-red-600 animate-ping" />
                <span>
                  {tr(
                    lang,
                    'Listening to microphone... Speak in Sinhala, Tamil, or English, then click Stop.',
                    'මයික්‍රෆෝනයට සවන් දෙමින්... සිංහල, දෙමළ හෝ ඉංග්‍රීසි බසින් කතා කර නවත්වන්න.',
                    'மைக்ரோஃபோன் கேட்கிறது... சிங்களம், தமிழ் அல்லது ஆங்கிலத்தில் பேசி நிறுத்தவும்.'
                  )}
                </span>
              </div>
            )}
          </div>

          {/* Sample Field Radio Transmissions for Instant Testing */}
          <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-2.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-900">
              <Radio className="h-3.5 w-3.5 text-[#0B2A6F]" />
              <span>
                {tr(
                  lang,
                  '2. Or Test with Sample Field Radio Audio Clips',
                  '2. නැතහොත් ආදර්ශ ක්ෂේත්‍ර ගුවන්විදුලි හඬ පට පරීක්ෂා කරන්න',
                  '2. அல்லது மாதிரி கள வானொலி ஆடியோவைச் சோதிக்கவும்'
                )}
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              {tr(
                lang,
                'Dispatches a WAV audio payload to /api/gemini/transcribe (gemini-3.5-transcribe) for immediate evaluation:',
                '/api/gemini/transcribe (gemini-3.5-transcribe) වෙත WAV හඬ දත්ත යවා ක්ෂණිකව පරීක්ෂා කරයි:',
                'உடனடி சோதனைக்காக /api/gemini/transcribe (gemini-3.5-transcribe) க்கு WAV ஆடியோவை அனுப்புகிறது:'
              )}
            </p>

            <div className="space-y-2">
              {[
                {
                  label: tr(
                    lang,
                    'Sinhala Field Audio · Gelioya Bridge Flood',
                    'සිංහල හඬ පණිවිඩය · ගෙලිඔය පාලම ජල ගැලීම',
                    'சிங்கள கள ஆடியோ · கெலிஓயா பாலம் வெள்ளம்'
                  ),
                  sample:
                    'ගෙලිඔය පාලම ළඟ වතුර මට්ටම අඩි 4ක් පමණ ඉහළ ගොස් ඇත. පවුල් 12ක් ආරක්ෂිත ස්ථාන වෙත යොමු කළ යුතුයි, බෝට්ටු සහ පානීය ජලය අවශ්‍යයි.',
                },
                {
                  label: tr(
                    lang,
                    'Tamil Field Audio · Nawalapitiya Landslide',
                    'දෙමළ හඬ පණිවිඩය · නාවලපිටිය නායයෑම',
                    'தமிழ் கள ஆடியோ · நாவலப்பிட்டி மண்சரிவு'
                  ),
                  sample:
                    'நாவலப்பிட்டி தோட்டப் பாதையில் மண்சரிவு ஏற்பட்டுள்ளது. வீதி முழுமையாகத் தடைப்பட்டுள்ளது, 8 குடும்பங்கள் சிக்கியுள்ளன, உடனடி மருத்துவ உதவி தேவை.',
                },
                {
                  label: tr(
                    lang,
                    'Singlish WhatsApp Voice Note · Peradeniya Road',
                    'Singlish හඬ පණිවිඩය · පේරාදෙණිය මාර්ගය',
                    'Singlish குரல் குறிப்பு · பேராதனை வீதி'
                  ),
                  sample:
                    'Peradeniya Galaha pare gasak kadan watila para wahila. Leda wuna wayasaka amma kenek innawa, ikmanata ambulance ekak one.',
                },
              ].map((clip, i) => (
                <button
                  key={i}
                  type="button"
                  disabled={isTranscribing || isRecording}
                  onClick={() => handleRunSampleClip(clip.sample, clip.label)}
                  className="flex w-full items-center justify-between gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-left text-xs font-medium text-slate-700 hover:border-[#0B2A6F] hover:text-[#0B2A6F] disabled:opacity-50 transition-colors"
                >
                  <span className="flex items-center gap-2 truncate">
                    <FileAudio className="h-3.5 w-3.5 text-[#0B2A6F] shrink-0" />
                    <span className="truncate">{clip.label}</span>
                  </span>
                  <span className="font-mono text-[10px] text-[#0B2A6F] shrink-0">
                    Transcribe →
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Transcription Output & 1-Click Triage Forwarding */}
        <div className="flex flex-col justify-between rounded-lg border border-slate-200 bg-slate-50/60 p-4 lg:col-span-7 space-y-4">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2.5">
              <span className="text-xs font-semibold text-slate-900">
                {tr(
                  lang,
                  'Verbatim Audio Transcription Output',
                  'හඬ පිටපත් කිරීමේ ප්‍රතිඵලය',
                  'துல்லியமான ஆடியோ உரைப்பதிவு வெளியீடு'
                )}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopy}
                  disabled={!transcript}
                  className="inline-flex items-center gap-1 rounded border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  {copied ? (
                    <>
                      <Check className="h-3 w-3 text-emerald-600" />
                      <span>{tr(lang, 'Copied', 'පිටපත් විය', 'நகலெடுக்கப்பட்டது')}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" />
                      <span>{tr(lang, 'Copy Text', 'පිටපත් කරන්න', 'நகலெடு')}</span>
                    </>
                  )}
                </button>
                {onForwardTranscriptToSubmit && (
                  <button
                    type="button"
                    onClick={() => onForwardTranscriptToSubmit(transcript)}
                    disabled={!transcript}
                    className="inline-flex items-center gap-1 rounded bg-[#0B2A6F] px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-[#082054] disabled:opacity-50"
                  >
                    <span>
                      {tr(
                        lang,
                        'Send to Report Intake',
                        'වාර්තා ඇතුළත් කිරීමට යවන්න',
                        'அறிக்கை உள்ளீட்டிற்கு அனுப்பு'
                      )}
                    </span>
                    <ArrowRight className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>

            {isTranscribing ? (
              <div className="flex h-44 flex-col items-center justify-center gap-2 rounded-md border border-slate-200 bg-white p-6 text-xs text-slate-600">
                <Loader2 className="h-6 w-6 animate-spin text-[#0B2A6F]" />
                <span>
                  {tr(
                    lang,
                    'Transcribing audio with gemini-3.5-transcribe...',
                    'gemini-3.5-transcribe මගින් හඬ පිටපත් කරමින්...',
                    'gemini-3.5-transcribe மூலம் ஆடியோ உரையாக்கப்படுகிறது...'
                  )}
                </span>
              </div>
            ) : (
              <textarea
                rows={5}
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                placeholder={tr(
                  lang,
                  'Transcribed text from gemini-3.5-transcribe will appear here. You can edit it or forward it directly to the Triage Intake form...',
                  'gemini-3.5-transcribe මගින් පිටපත් කළ පෙළ මෙහි දිස්වේ...',
                  'gemini-3.5-transcribe மூலம் மாற்றப்பட்ட உரை இங்கே தோன்றும்...'
                )}
                className="w-full rounded-md border border-slate-300 bg-white p-3 text-sm leading-relaxed text-slate-900 focus:border-[#0B2A6F] focus:outline-none"
              />
            )}
          </div>

          {history.length > 0 && (
            <div className="space-y-1.5 border-t border-slate-200 pt-3">
              <div className="text-[11px] font-semibold text-slate-600">
                {tr(
                  lang,
                  'Recent Audio Transcriptions in Session',
                  'මෑතකදී පිටපත් කළ හඬ සටහන්',
                  'சமீபத்திய ஆடியோ உரைப்பதிவுகள்'
                )}
              </div>
              <div className="max-h-32 overflow-y-auto space-y-1.5">
                {history.map((h) => (
                  <div
                    key={h.id}
                    onClick={() => setTranscript(h.transcript)}
                    className="cursor-pointer rounded border border-slate-200 bg-white p-2 text-xs hover:border-[#0B2A6F]"
                  >
                    <div className="flex items-center justify-between font-mono text-[10px] text-slate-500">
                      <span>
                        {h.sourceLabel} · {h.modelUsed}
                      </span>
                      <span>{h.timestamp}</span>
                    </div>
                    <p className="mt-0.5 truncate text-slate-800">
                      {h.transcript}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
