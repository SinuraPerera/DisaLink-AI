import React, { useState } from 'react';
import { User } from 'firebase/auth';
import {
  GNSilenceEvaluation,
  IncidentCase,
  Report,
  SituationSummaryDraft,
  UILanguage,
} from '../types';
import { generateSituationSummaryWithGemini } from '../lib/ai';
import { tr } from '../lib/i18n';
import {
  saveCoordinatorRecordToFirestore,
  signInCoordinatorWithGoogle,
} from '../lib/firebase';
import {
  AlertCircle,
  Check,
  CloudUpload,
  Copy,
  Download,
  FileText,
  Loader2,
  Sparkles,
} from 'lucide-react';

interface SummaryScreenProps {
  lang?: UILanguage;
  user?: User | null;
  cases: IncidentCase[];
  reports: Report[];
  quietAreas: GNSilenceEvaluation[];
  onLogSummaryGenerated: (headline: string) => Promise<void>;
}

export const SummaryScreen: React.FC<SummaryScreenProps> = ({
  lang = 'en',
  user,
  cases,
  reports,
  quietAreas,
  onLogSummaryGenerated,
}) => {
  const [draft, setDraft] = useState<SituationSummaryDraft | null>(null);
  const [editableText, setEditableText] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [cloudSavedMsg, setCloudSavedMsg] = useState<string | null>(null);
  const [isSavingCloud, setIsSavingCloud] = useState(false);

  const confirmedCases = cases.filter(
    (c) => c.humanConfirmed || c.verified || c.status !== 'ai_suggestion'
  );
  const unverifiedCases = cases.filter(
    (c) => !c.humanConfirmed && !c.verified && c.status === 'ai_suggestion'
  );
  const quietFlagged = quietAreas.filter((g) => g.isQuiet);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setWarning(null);
    setCopied(false);
    setCloudSavedMsg(null);

    const result = await generateSituationSummaryWithGemini({
      cases,
      reports,
      quietAreas,
    });

    setIsGenerating(false);
    setDraft(result.draft);
    setEditableText(result.draft.editableMarkdown);
    if (result.usedFallback && result.warningMessage) {
      setWarning(result.warningMessage);
    }

    await onLogSummaryGenerated(result.draft.headline);
  };

  const handleCopy = async () => {
    if (!editableText) return;
    await navigator.clipboard.writeText(editableText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadSitRep = () => {
    if (!editableText) return;
    const blob = new Blob([editableText], {
      type: 'text/markdown;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `disalink-sitrep-${new Date().toISOString().slice(0, 10)}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleSaveSitRepToCloud = async () => {
    if (!draft || !editableText) return;
    setIsSavingCloud(true);
    setCloudSavedMsg(null);
    try {
      let currentUser = user;
      if (!currentUser) {
        currentUser = await signInCoordinatorWithGoogle();
      }
      if (!currentUser) return;

      await saveCoordinatorRecordToFirestore({
        recordType: 'situation_summary',
        targetId: 'SITREP_DRAFT',
        title: draft.headline,
        summaryText: editableText,
        urgency: 4,
        status: 'verified',
      });
      setCloudSavedMsg(
        tr(
          lang,
          'Saved Situation Summary to Firebase Firestore (/coordinator_records).',
          'තත්ත්ව වාර්තාව Firebase Firestore (/coordinator_records) වෙත සුරකින ලදී.',
          'நிலைமைச் சுருக்கம் Firebase Firestore (/coordinator_records) இல் சேமிக்கப்பட்டது.'
        )
      );
    } catch (err: any) {
      setCloudSavedMsg(
        tr(
          lang,
          `Cloud save note: ${err?.message || 'Sign in with Google to save to Firestore.'}`,
          `ක්ලවුඩ් සටහන: ${err?.message || 'Firestore වෙත සුරැකීමට Google ගිණුමෙන් පිවිසෙන්න.'}`,
          `கிளவுட் குறிப்பு: ${err?.message || 'Firestore இல் சேமிக்க Google கணக்கில் உள்நுழையவும்.'}`
        )
      );
    } finally {
      setIsSavingCloud(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header & Generate Button */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">
            {tr(
              lang,
              'Divisional Situation Summary (Source-Grounded Draft)',
              'ප්‍රාදේශීය තත්ත්ව වාර්තාව (මූලාශ්‍ර මත පදනම් වූ කෙටුම්පත)',
              'பிரதேச நிலைமைச் சுருக்கம் (ஆதார அடிப்படையிலான வரைவு)'
            )}
          </h1>
          <p className="text-xs text-slate-600">
            {tr(
              lang,
              'Gemini writes a concise situation report using ONLY confirmed reports and cases. Every sentence ends with source tags like ',
              'තහවුරු කළ වාර්තා සහ සිදුවීම් පමණක් භාවිතා කරමින් Gemini සංක්ෂිප්ත තත්ත්ව වාර්තාවක් සකසයි. සෑම වාක්‍යයක්ම ',
              'உறுதிப்படுத்தப்பட்ட அறிக்கைகள் மற்றும் நிகழ்வுகளை மட்டுமே பயன்படுத்தி Gemini சுருக்கமான அறிக்கையை எழுதுகிறது. ஒவ்வொரு வாக்கியமும் '
            )}
            <span className="font-mono">[R-014]</span>
            {tr(
              lang,
              ' and includes an explicit Uncertainty section.',
              ' වැනි මූලාශ්‍ර උපුටා දැක්වීම් සහ අවිනිශ්චිතතා කොටසක් සහිතව අවසන් වේ.',
              ' போன்ற ஆதாரக் குறிப்புகள் மற்றும் நிச்சயமற்ற தன்மை பிரிவுடன் முடிகிறது.'
            )}
          </p>
        </div>

        <button
          type="button"
          onClick={handleGenerate}
          disabled={isGenerating}
          className="flex items-center gap-2 rounded-md bg-[#0B2A6F] px-4 py-2 text-xs font-semibold text-white hover:bg-[#082054] disabled:opacity-50 whitespace-nowrap"
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>
                {tr(
                  lang,
                  'Drafting Grounded Summary...',
                  'මූලාශ්‍ර සහිත සාරාංශය සකසමින්...',
                  'ஆதார சுருக்கத்தை உருவாக்குகிறது...'
                )}
              </span>
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              <span>
                {tr(
                  lang,
                  'Generate draft summary',
                  'තත්ත්ව වාර්තා කෙටුම්පත සාදන්න',
                  'வரைவு சுருக்கத்தை உருவாக்கு'
                )}
              </span>
            </>
          )}
        </button>
      </div>

      {/* Input Scope Overview */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white p-3.5">
          <div className="text-xs text-slate-500">
            {tr(
              lang,
              'Confirmed Cases (Included in Summary)',
              'තහවුරු කළ සිදුවීම් (වාර්තාවට ඇතුළත්)',
              'உறுதிப்படுத்தப்பட்ட நிகழ்வுகள் (சுருக்கத்தில் உள்ளவை)'
            )}
          </div>
          <div className="mt-1 font-mono text-xl font-semibold text-emerald-700 tabular-nums">
            {confirmedCases.length}{' '}
            <span className="text-xs font-normal text-slate-500">
              ({confirmedCases.map((c) => c.id).join(', ') || tr(lang, 'None', 'නැත', 'இல்லை')})
            </span>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-3.5">
          <div className="text-xs text-slate-500">
            {tr(
              lang,
              'Unverified AI Cases (Held in Uncertainty)',
              'තහවුරු නොකළ AI සිදුවීම් (අවිනිශ්චිත කොටසේ)',
              'சரிபார்க்கப்படாத AI நிகழ்வுகள் (நிச்சயமற்ற பிரிவில்)'
            )}
          </div>
          <div className="mt-1 font-mono text-xl font-semibold text-amber-700 tabular-nums">
            {unverifiedCases.length}{' '}
            <span className="text-xs font-normal text-slate-500">
              ({unverifiedCases.map((c) => c.id).join(', ') || tr(lang, 'None', 'නැත', 'இல்லை')})
            </span>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-3.5">
          <div className="text-xs text-slate-500">
            {tr(
              lang,
              'Silent GN Areas (Flagged in Uncertainty)',
              'නිහඬ ග්‍රා.නි. වසම් (අවිනිශ්චිත කොටසේ)',
              'மௌன கி.அ. பிரிவுகள் (நிச்சயமற்ற பிரிவில்)'
            )}
          </div>
          <div className="mt-1 font-mono text-xl font-semibold text-amber-700 tabular-nums">
            {quietFlagged.length}{' '}
            <span className="text-xs font-normal text-slate-500">
              ({quietFlagged.map((g) => g.id).join(', ') || tr(lang, 'None', 'නැත', 'இல்லை')})
            </span>
          </div>
        </div>
      </div>

      {warning && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
            <span>{warning}</span>
          </div>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={isGenerating}
            className="inline-flex items-center gap-1.5 rounded border border-amber-400 bg-white px-2.5 py-1 text-[11px] font-semibold text-amber-900 hover:bg-amber-100 disabled:opacity-50 shrink-0"
          >
            <Sparkles className="h-3 w-3 text-[#0B2A6F]" />
            <span>
              {tr(
                lang,
                'Retry Cloud Gemini',
                'නැවත Cloud Gemini උත්සාහ කරන්න',
                'மீண்டும் Cloud Gemini முயற்சி'
              )}
            </span>
          </button>
        </div>
      )}

      {cloudSavedMsg && (
        <div className="flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-xs font-medium text-emerald-900">
          <Check className="h-4 w-4 text-emerald-700 shrink-0" />
          <span>{cloudSavedMsg}</span>
        </div>
      )}

      {!draft ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center">
          <FileText className="mx-auto h-8 w-8 text-slate-400" />
          <h3 className="mt-3 text-sm font-semibold text-slate-900">
            {tr(
              lang,
              'No Situation Summary Draft Generated Yet',
              'තත්ත්ව වාර්තා කෙටුම්පතක් තවම සාදා නැත',
              'நிலைமைச் சுருக்க வரைவு இன்னும் உருவாக்கப்படவில்லை'
            )}
          </h3>
          <p className="mx-auto mt-1 max-w-md text-xs text-slate-500">
            {tr(
              lang,
              'Click "Generate draft summary" above to synthesize all coordinator-confirmed cases with citation tags [R-xxx] and an Uncertainty section.',
              'මූලාශ්‍ර උපුටා දැක්වීම් [R-xxx] සහ අවිනිශ්චිතතා කොටසක් සහිතව සම්බන්ධීකාරක තහවුරු කළ සියලුම සිදුවීම් සාරාංශ කිරීමට ඉහත "තත්ත්ව වාර්තා කෙටුම්පත සාදන්න" ක්ලික් කරන්න.',
              'ஆதாரக் குறிப்புகள் [R-xxx] மற்றும் நிச்சயமற்ற தன்மை பிரிவுடன் ஒருங்கிணைப்பாளர் உறுதிப்படுத்திய அனைத்து நிகழ்வுகளையும் தொகுக்க மேலே உள்ள "வரைவு சுருக்கத்தை உருவாக்கு" என்பதைக் கிளிக் செய்க.'
            )}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
          {/* Structured View with Source Badges */}
          <div className="space-y-4 rounded-lg border border-slate-200 bg-white p-5 lg:col-span-6">
            <div className="border-b border-slate-200 pb-3">
              <div className="text-[11px] font-semibold text-[#0B2A6F]">
                {tr(
                  lang,
                  'AI SUGGESTION · SOURCE-GROUNDED PREVIEW',
                  'AI යෝජනාව · මූලාශ්‍ර සහිත පෙරදසුන',
                  'AI பரிந்துரை · ஆதார அடிப்படையிலான முன்னோட்டம்'
                )}
              </div>
              <h2 className="mt-1 text-base font-bold text-slate-900">
                {draft.headline}
              </h2>
            </div>

            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-slate-800">
                {tr(
                  lang,
                  '1. Confirmed Situation (Strictly Confirmed Cases/Reports)',
                  '1. තහවුරු කළ තත්ත්වය (තහවුරු කළ සිදුවීම් සහ වාර්තා පමණි)',
                  '1. உறுதிப்படுத்தப்பட்ட நிலைமை (உறுதிப்படுத்தப்பட்ட நிகழ்வுகள்/அறிக்கைகள் மட்டும்)'
                )}
              </h3>
              <ul className="space-y-2 text-xs leading-relaxed text-slate-700">
                {draft.confirmedSituation.map((sentence, idx) => (
                  <li
                    key={idx}
                    className="rounded-md bg-slate-50 p-2.5 border-l-2 border-l-[#0B2A6F]"
                  >
                    {sentence}
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-slate-800">
                {tr(
                  lang,
                  '2. Priority Coordination Notes',
                  '2. ප්‍රමුඛ සම්බන්ධීකරණ සටහන්',
                  '2. முன்னுரிமை ஒருங்கிணைப்பு குறிப்புகள்'
                )}
              </h3>
              <ul className="space-y-2 text-xs leading-relaxed text-slate-700">
                {draft.priorityActions.map((sentence, idx) => (
                  <li
                    key={idx}
                    className="rounded-md bg-slate-50 p-2.5 border-l-2 border-l-red-600"
                  >
                    {sentence}
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-amber-800">
                {tr(
                  lang,
                  '3. Uncertainty Section (Unverified Reports & Silent GN Areas)',
                  '3. අවිනිශ්චිතතා කොටස (තහවුරු නොකළ වාර්තා සහ නිහඬ ග්‍රා.නි. වසම්)',
                  '3. நிச்சயமற்ற தன்மை பிரிவு (சரிபார்க்கப்படாத அறிக்கைகள் & மௌன கி.அ. பிரிவுகள்)'
                )}
              </h3>
              <ul className="space-y-2 text-xs leading-relaxed text-amber-950">
                {draft.uncertaintySection.map((sentence, idx) => (
                  <li
                    key={idx}
                    className="rounded-md bg-amber-50 p-2.5 border-l-2 border-l-amber-600"
                  >
                    {sentence}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Coordinator Editable Textarea & Actions */}
          <div className="flex flex-col justify-between rounded-lg border border-slate-200 bg-white p-5 lg:col-span-6">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="text-xs font-semibold text-slate-900">
                  {tr(
                    lang,
                    'Coordinator Editable Draft (Edit before copying/sharing)',
                    'සම්බන්ධීකාරක සංස්කරණය කළ හැකි කෙටුම්පත (බෙදා ගැනීමට පෙර සංස්කරණය කරන්න)',
                    'ஒருங்கிணைப்பாளர் திருத்தக்கூடிய வரைவு (பகிர்வதற்கு முன் திருத்தவும்)'
                  )}
                </label>
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleSaveSitRepToCloud}
                    disabled={isSavingCloud}
                    className="flex items-center gap-1 rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    <CloudUpload className="h-3.5 w-3.5 text-[#0B2A6F]" />
                    <span>
                      {isSavingCloud
                        ? tr(lang, 'Saving...', 'සුරකිමින්...', 'சேமிக்கிறது...')
                        : tr(lang, 'Save to Cloud', 'ක්ලවුඩ් හි සුරකින්න', 'கிளவுட்டில் சேமி')}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadSitRep}
                    className="flex items-center gap-1 rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    <Download className="h-3.5 w-3.5 text-slate-600" />
                    <span>
                      {tr(lang, 'Download .md', '.md බාගන්න', '.md பதிவிறக்கு')}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 rounded-md bg-[#0B2A6F] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#082054]"
                  >
                    {copied ? (
                      <>
                        <Check className="h-3.5 w-3.5" />
                        <span>{tr(lang, 'Copied', 'පිටපත් විය', 'நகலெடுக்கப்பட்டது')}</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span>
                          {tr(lang, 'Copy Summary', 'සාරාංශය පිටපත් කරන්න', 'சுருக்கத்தை நகலெடு')}
                        </span>
                      </>
                    )}
                  </button>
                </div>
              </div>
              <textarea
                rows={20}
                value={editableText}
                onChange={(e) => setEditableText(e.target.value)}
                className="w-full rounded-md border border-slate-300 bg-slate-50 p-3 font-mono text-xs leading-relaxed text-slate-900 focus:border-[#0B2A6F] focus:bg-white focus:outline-none"
              />
            </div>

            <p className="mt-3 text-[11px] text-slate-500">
              {tr(
                lang,
                'Note: DisaLink AI never transmits or dispatches this report automatically. The Divisional Secretariat coordinator edits and shares through official DMC channels.',
                'සටහන: DisaLink AI කිසිවිටෙක මෙම වාර්තාව ස්වයංක්‍රීයව යවන්නේ නැත. ප්‍රාදේශීය ලේකම් කාර්යාල සම්බන්ධීකාරක විසින් සංස්කරණය කර නිල DMC නාලිකා හරහා බෙදා ගනු ලැබේ.',
                'குறிப்பு: DisaLink AI இந்த அறிக்கையை ஒருபோதும் தானாக அனுப்பாது. பிரதேச செயலக ஒருங்கிணைப்பாளர் திருத்தி அதிகாரப்பூர்வ DMC வழிகளில் பகிர்வார்.'
              )}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
