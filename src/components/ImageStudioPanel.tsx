import React, { useRef, useState } from 'react';
import { UILanguage } from '../types';
import { tr } from '../lib/i18n';
import {
  Download,
  Image as ImageIcon,
  Loader2,
  Sparkles,
  Upload,
  Wand2,
} from 'lucide-react';

interface ImageStudioPanelProps {
  lang: UILanguage;
  onSaveToCloud?: (title: string, summaryText: string) => Promise<void>;
}

type AspectRatioOption = '16:9' | '1:1' | '4:3' | '3:4' | '9:16';

function createSampleFloodPhotoDataUrl(): string {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 450;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Sky gradient
      const skyGrad = ctx.createLinearGradient(0, 0, 0, 240);
      skyGrad.addColorStop(0, '#1e293b');
      skyGrad.addColorStop(1, '#64748b');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, 800, 240);

      // Hills
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.moveTo(0, 240);
      ctx.lineTo(180, 105);
      ctx.lineTo(390, 240);
      ctx.fill();

      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.moveTo(260, 240);
      ctx.lineTo(520, 80);
      ctx.lineTo(800, 240);
      ctx.fill();

      // Floodwater
      const waterGrad = ctx.createLinearGradient(0, 235, 800, 450);
      waterGrad.addColorStop(0, '#78350f');
      waterGrad.addColorStop(1, '#451a03');
      ctx.fillStyle = waterGrad;
      ctx.fillRect(0, 235, 800, 215);

      // Bridge deck & pillars
      ctx.fillStyle = '#475569';
      ctx.fillRect(140, 210, 520, 18);
      ctx.fillStyle = '#334155';
      ctx.fillRect(240, 228, 24, 95);
      ctx.fillRect(540, 228, 24, 95);

      // Caption banner
      ctx.fillStyle = 'rgba(15, 23, 42, 0.78)';
      ctx.fillRect(20, 18, 560, 34);
      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 14px monospace';
      ctx.fillText(
        'FIELD PHOTO · GELIOYA BRIDGE FLOOD CORRIDOR (BASE IMAGE)',
        32,
        40
      );

      return canvas.toDataURL('image/png');
    }
  } catch {}
  return '';
}

export const ImageStudioPanel: React.FC<ImageStudioPanelProps> = ({
  lang,
  onSaveToCloud,
}) => {
  const [mode, setMode] = useState<'create' | 'edit'>('create');
  const [aspectRatio, setAspectRatio] = useState<AspectRatioOption>('16:9');
  const [prompt, setPrompt] = useState(
    'A clear civil-defense operational infographic map of a flooded bridge in Kandy Central Highlands with high-ground evacuation arrows, water depth gauge markers, and bilingual hazard signage, clean editorial style'
  );
  const [sourceImageDataUrl, setSourceImageDataUrl] = useState<string | null>(
    null
  );
  const [sourceMimeType, setSourceMimeType] = useState<string>('image/png');
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(
    null
  );
  const [generatedCaption, setGeneratedCaption] = useState<string>('');
  const [modelUsed, setModelUsed] = useState<string>(
    'gemini-3.1-flash-image-preview'
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleUploadSourceImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setSourceImageDataUrl(reader.result as string);
      setSourceMimeType(file.type || 'image/png');
      setMode('edit');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleLoadSampleBaseImage = () => {
    setSourceImageDataUrl(createSampleFloodPhotoDataUrl());
    setSourceMimeType('image/png');
    setMode('edit');
    setPrompt(
      'Add high-visibility red flood hazard boundary markers around the bridge, a water depth scale indicator, and a green evacuation route arrow pointing to high ground on the right'
    );
  };

  const handleUseGeneratedAsEditBase = () => {
    if (!generatedImageUrl) return;
    setSourceImageDataUrl(generatedImageUrl);
    setSourceMimeType('image/png');
    setMode('edit');
    setPrompt(
      'Add a clear red warning banner at the top and highlight the primary evacuation shelter zone in bright emerald green'
    );
  };

  const handleRunImageModel = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!prompt.trim() || isGenerating) return;

    if (mode === 'edit' && !sourceImageDataUrl) {
      setErrorMsg(
        tr(
          lang,
          'Please upload a source image or click "Load Sample Field Photo" before running Edit Mode.',
          'සංස්කරණ ප්‍රකාරය ක්‍රියාත්මක කිරීමට පෙර කරුණාකර මූලික ඡායාරූපයක් උඩුගත කරන්න.',
          'திருத்தப் பயன்முறையை இயக்குவதற்கு முன் ஆதாரப் படத்தைப் பதிவேற்றவும்.'
        )
      );
      return;
    }

    setIsGenerating(true);
    setErrorMsg(null);
    setSavedNotice(null);

    try {
      const res = await fetch('/api/gemini/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt.trim(),
          mode,
          aspectRatio,
          imageBase64: mode === 'edit' ? sourceImageDataUrl : undefined,
          mimeType: sourceMimeType,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || `HTTP ${res.status}`);
      }

      setGeneratedImageUrl(data.imageDataUrl);
      setGeneratedCaption(data.caption || '');
      setModelUsed(data.modelUsed || 'gemini-3.1-flash-image-preview');
    } catch (err: any) {
      setErrorMsg(
        err?.message ||
          'Failed to generate/edit image with gemini-3.1-flash-image-preview.'
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadImage = () => {
    if (!generatedImageUrl) return;
    const a = document.createElement('a');
    a.href = generatedImageUrl;
    a.download = `disalink-${mode}-visual-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const createPresets = [
    tr(
      lang,
      'A clear civil-defense operational infographic map of a flooded bridge in Kandy Central Highlands with high-ground evacuation arrows and water depth markers',
      'මහනුවර ගංවතුරට ලක්වූ පාලමක ආරක්ෂිත ඉවත්වීමේ මාර්ග සහ ජල මට්ටම් දැක්වෙන නිල මෙහෙයුම් සිතියම් රූපසටහනක්',
      'கண்டி வெள்ளப் பாலத்தின் பாதுகாப்பான வெளியேற்ற வழிகள் மற்றும் நீர்மட்டக் குறியீடுகளுடன் கூடிய செயல்பாட்டு வரைபடம்'
    ),
    tr(
      lang,
      'A landslide slope instability diagram for Nawalapitiya estate road showing red hazard zone, boulder barrier, and safe school staging point',
      'නාවලපිටිය වතු මාර්ගයේ නායයෑම් අවදානම් කලාපය සහ ආරක්ෂිත පාසල් මධ්‍යස්ථානය පෙන්වන රූපසටහනක්',
      'நாவலப்பிட்டி மண்சரிவு அபாய மண்டலம் மற்றும் பாதுகாப்பான பள்ளி முகாம்களைக் காட்டும் விளக்கப்படம்'
    ),
    tr(
      lang,
      'A clean humanitarian field readiness poster showing emergency hotlines 117 and 1990 with flood safety icons for Grama Niladhari divisions',
      '117 සහ 1990 හදිසි ඇමතුම් අංක සහ ගංවතුර ආරක්ෂිත උපදෙස් ඇතුළත් ග්‍රාම නිලධාරී වසම් පෝස්ටරයක්',
      '117 மற்றும் 1990 அவசர எண்கள் மற்றும் வெள்ள பாதுகாப்பு வழிமுறைகளைக் காட்டும் சுவரொட்டி'
    ),
  ];

  const editPresets = [
    tr(
      lang,
      'Add high-visibility red flood hazard boundary markers around the bridge and a green evacuation arrow pointing to high ground',
      'පාලම වටා රතු පැහැති ගංවතුර අවදානම් සීමා ලකුණු සහ උස් බිමකට යොමු වන කොළ පැහැති ඊතලයක් එක් කරන්න',
      'பாலத்தைச் சுற்றி சிவப்பு வெள்ள அபாய எல்லைக் குறியீடுகள் மற்றும் பச்சை வெளியேற்ற அம்புக்குறியைச் சேர்க்கவும்'
    ),
    tr(
      lang,
      'Highlight the blocked road section with warning stripes and annotate the water depth gauge at 4.5 feet',
      'අවහිර වූ මාර්ග කොටස අනතුරු ඇඟවීමේ රේඛාවලින් ලකුණු කර ජල මට්ටම අඩි 4.5 ලෙස සටහන් කරන්න',
      'தடைப்பட்ட வீதிப் பகுதியைக் குறிப்பிட்டு நீர்மட்டத்தை 4.5 அடியாகக் காட்டவும்'
    ),
  ];

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="font-mono text-xs font-semibold text-[#0B2A6F]">
            {tr(
              lang,
              'MODEL: gemini-3.1-flash-image-preview · CREATE & EDIT IMAGES',
              'ආකෘතිය: gemini-3.1-flash-image-preview · රූප නිර්මාණය සහ සංස්කරණය',
              'மாதிரி: gemini-3.1-flash-image-preview · படங்களை உருவாக்கு & திருத்து'
            )}
          </div>
          <h2 className="mt-0.5 text-base font-bold text-slate-900">
            {tr(
              lang,
              'Visual Hazard Infographic Generator & Field Photo Editor',
              'ආපදා රූපසටහන් උත්පාදකය සහ ක්ෂේත්‍ර ඡායාරූප සංස්කාරකය',
              'அனர்த்த வரைபட உருவாக்கி & களப் புகைப்படத் திருத்தி'
            )}
          </h2>
          <p className="text-xs text-slate-600">
            {tr(
              lang,
              'Create new disaster response visuals from text prompts or edit uploaded field photos using gemini-3.1-flash-image-preview.',
              'පෙළ විමසුම් මගින් නව ආපදා රූප නිර්මාණය කරන්න හෝ උඩුගත කළ ක්ෂේත්‍ර ඡායාරූප gemini-3.1-flash-image-preview මගින් සංස්කරණය කරන්න.',
              'உரை கட்டளைகள் மூலம் புதிய படங்களை உருவாக்கவும் அல்லது களப் புகைப்படங்களை gemini-3.1-flash-image-preview மூலம் திருத்தவும்.'
            )}
          </p>
        </div>

        <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setMode('create')}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 transition-colors ${
              mode === 'create'
                ? 'bg-white text-[#0B2A6F] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>
              {tr(lang, 'Create Image', 'රූපයක් සාදන්න', 'படம் உருவாக்கு')}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setMode('edit')}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 transition-colors ${
              mode === 'edit'
                ? 'bg-white text-[#0B2A6F] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Wand2 className="h-3.5 w-3.5" />
            <span>
              {tr(lang, 'Edit Image', 'රූපයක් සංස්කරණය කරන්න', 'படத்தைத் திருத்து')}
            </span>
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900">
          {errorMsg}
        </div>
      )}

      {savedNotice && (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-xs font-medium text-emerald-900">
          {savedNotice}
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        {/* Left Controls Column */}
        <form
          onSubmit={handleRunImageModel}
          className="space-y-4 lg:col-span-5"
        >
          {mode === 'edit' && (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3.5 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-900">
                  {tr(
                    lang,
                    'Source Image to Edit',
                    'සංස්කරණය සඳහා මූලික රූපය',
                    'திருத்துவதற்கான ஆதாரப் படம்'
                  )}
                </span>
                <div className="flex items-center gap-1.5">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleUploadSourceImage}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1 rounded border border-slate-300 bg-white px-2 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-100"
                  >
                    <Upload className="h-3 w-3 text-[#0B2A6F]" />
                    <span>{tr(lang, 'Upload', 'උඩුගත කරන්න', 'பதிவேற்று')}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleLoadSampleBaseImage}
                    className="inline-flex items-center gap-1 rounded border border-blue-200 bg-blue-50 px-2 py-1 text-[11px] font-medium text-[#0B2A6F] hover:bg-blue-100"
                  >
                    <span>
                      {tr(lang, 'Load Sample Photo', 'ආදර්ශ ඡායාරූපය', 'மாதிரிப் படம்')}
                    </span>
                  </button>
                </div>
              </div>

              {sourceImageDataUrl ? (
                <div className="overflow-hidden rounded border border-slate-200 bg-white">
                  <img
                    src={sourceImageDataUrl}
                    alt="Source to edit"
                    referrerPolicy="no-referrer"
                    className="h-32 w-full object-cover"
                  />
                </div>
              ) : (
                <div className="rounded border border-dashed border-slate-300 bg-white p-4 text-center text-[11px] text-slate-500">
                  {tr(
                    lang,
                    'Upload a field photo or click "Load Sample Photo" above to edit it with gemini-3.1-flash-image-preview.',
                    'ඡායාරූපයක් උඩුගත කරන්න හෝ ඉහත "ආදර්ශ ඡායාරූපය" ක්ලික් කරන්න.',
                    'புகைப்படத்தைப் பதிவேற்றவும் அல்லது "மாதிரிப் படம்" என்பதைக் கிளிக் செய்யவும்.'
                  )}
                </div>
              )}
            </div>
          )}

          <div>
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-800">
                {mode === 'create'
                  ? tr(
                      lang,
                      'Text Prompt to Create Image',
                      'රූපය නිර්මාණය කිරීමේ විමසුම',
                      'படத்தை உருவாக்குவதற்கான உரை'
                    )
                  : tr(
                      lang,
                      'Text Instructions to Edit Image',
                      'රූපය සංස්කරණය කිරීමේ උපදෙස්',
                      'படத்தைத் திருத்துவதற்கான உரை'
                    )}
              </label>
              <span className="font-mono text-[10px] text-slate-500">
                gemini-3.1-flash-image-preview
              </span>
            </div>
            <textarea
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={
                mode === 'create'
                  ? 'Describe the operational visual, hazard map, or evacuation poster to create...'
                  : 'Describe how to edit, annotate, or transform the source image...'
              }
              className="mt-1.5 w-full rounded-md border border-slate-300 p-2.5 text-xs leading-relaxed text-slate-900 focus:border-[#0B2A6F] focus:outline-none"
            />
          </div>

          {/* Aspect Ratio Selector */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1.5">
              {tr(lang, 'Aspect Ratio', 'දර්ශන අනුපාතය', 'பட விகிதம்')}
            </label>
            <div className="grid grid-cols-5 gap-1.5">
              {(['16:9', '1:1', '4:3', '3:4', '9:16'] as AspectRatioOption[]).map(
                (ratio) => (
                  <button
                    key={ratio}
                    type="button"
                    onClick={() => setAspectRatio(ratio)}
                    className={`rounded border py-1.5 font-mono text-xs font-medium transition-colors ${
                      aspectRatio === ratio
                        ? 'border-[#0B2A6F] bg-blue-50 text-[#0B2A6F] font-bold'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {ratio}
                  </button>
                )
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={isGenerating || !prompt.trim()}
            className="flex w-full items-center justify-center gap-2 rounded-md bg-[#0B2A6F] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#082054] disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>
                  {mode === 'create'
                    ? tr(
                        lang,
                        'Generating with gemini-3.1-flash-image-preview...',
                        'gemini-3.1-flash-image-preview මගින් නිර්මාණය වෙමින්...',
                        'gemini-3.1-flash-image-preview மூலம் உருவாக்கப்படுகிறது...'
                      )
                    : tr(
                        lang,
                        'Editing with gemini-3.1-flash-image-preview...',
                        'gemini-3.1-flash-image-preview මගින් සංස්කරණය වෙමින්...',
                        'gemini-3.1-flash-image-preview மூலம் திருத்தப்படுகிறது...'
                      )}
                </span>
              </>
            ) : (
              <>
                {mode === 'create' ? (
                  <Sparkles className="h-4 w-4" />
                ) : (
                  <Wand2 className="h-4 w-4" />
                )}
                <span>
                  {mode === 'create'
                    ? tr(
                        lang,
                        'Generate Image (gemini-3.1-flash-image-preview)',
                        'රූපය උත්පාදනය කරන්න (gemini-3.1-flash-image-preview)',
                        'படத்தை உருவாக்கு (gemini-3.1-flash-image-preview)'
                      )
                    : tr(
                        lang,
                        'Apply Image Edit (gemini-3.1-flash-image-preview)',
                        'සංස්කරණය යොදන්න (gemini-3.1-flash-image-preview)',
                        'படத் திருத்தத்தைப் பயன்படுத்து'
                      )}
                </span>
              </>
            )}
          </button>

          {/* Quick Prompt Presets */}
          <div className="space-y-1.5 pt-1">
            <div className="text-[11px] font-semibold text-slate-600">
              {mode === 'create'
                ? tr(
                    lang,
                    'Quick Create Prompts:',
                    'ඉක්මන් නිර්මාණ විමසුම්:',
                    'விரைவு உருவாக்க கட்டளைகள்:'
                  )
                : tr(
                    lang,
                    'Quick Edit Prompts:',
                    'ඉක්මන් සංස්කරණ විමසුම්:',
                    'விரைவுத் திருத்த கட்டளைகள்:'
                  )}
            </div>
            {(mode === 'create' ? createPresets : editPresets).map(
              (preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setPrompt(preset)}
                  className="block w-full rounded border border-slate-200 bg-slate-50 p-2 text-left text-[11px] text-slate-700 hover:border-[#0B2A6F] hover:text-[#0B2A6F]"
                >
                  {preset}
                </button>
              )
            )}
          </div>
        </form>

        {/* Right Preview & Output Canvas */}
        <div className="flex flex-col justify-between rounded-lg border border-slate-200 bg-slate-50/60 p-4 lg:col-span-7">
          {!generatedImageUrl ? (
            <div className="flex h-full min-h-[300px] flex-col items-center justify-center text-center p-6">
              <ImageIcon className="h-10 w-10 text-slate-300" />
              <div className="mt-3 text-sm font-semibold text-slate-800">
                {tr(
                  lang,
                  'Gemini 3.1 Flash Image Preview Canvas',
                  'Gemini 3.1 Flash රූප පෙරදසුන් කවුළුව',
                  'Gemini 3.1 Flash பட முன்னோட்டப் பலகை'
                )}
              </div>
              <p className="mt-1 max-w-md text-xs text-slate-500">
                {tr(
                  lang,
                  'Enter a prompt on the left and click Generate or Edit to render high-clarity disaster visuals with gemini-3.1-flash-image-preview.',
                  'වම් පසින් විමසුමක් ලබා දී gemini-3.1-flash-image-preview මගින් රූප නිර්මාණය හෝ සංස්කරණය කරන්න.',
                  'இடதுபுறத்தில் கட்டளையை உள்ளிட்டு gemini-3.1-flash-image-preview மூலம் படங்களை உருவாக்கவும் அல்லது திருத்தவும்.'
                )}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2.5">
                <span className="font-mono text-[11px] font-semibold text-[#0B2A6F]">
                  Model: {modelUsed} · Ratio: {aspectRatio}
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleUseGeneratedAsEditBase}
                    className="inline-flex items-center gap-1 rounded border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-700 hover:border-[#0B2A6F] hover:text-[#0B2A6F]"
                  >
                    <Wand2 className="h-3 w-3" />
                    <span>
                      {tr(
                        lang,
                        'Edit This Image',
                        'මෙම රූපය සංස්කරණය කරන්න',
                        'இந்தப் படத்தைத் திருத்து'
                      )}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadImage}
                    className="inline-flex items-center gap-1 rounded bg-[#0B2A6F] px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-[#082054]"
                  >
                    <Download className="h-3 w-3" />
                    <span>
                      {tr(lang, 'Download PNG', 'බාගන්න', 'பதிவிறக்கு')}
                    </span>
                  </button>
                  {onSaveToCloud && (
                    <button
                      type="button"
                      onClick={async () => {
                        await onSaveToCloud(
                          `Visual (${mode.toUpperCase()}): ${prompt.slice(0, 60)}`,
                          `Generated with ${modelUsed} (${aspectRatio}) — ${generatedCaption}`
                        );
                        setSavedNotice(
                          tr(
                            lang,
                            'Saved image record to Firestore Cloud!',
                            'රූප වාර්තාව Firestore Cloud වෙත සුරකින ලදී!',
                            'படப் பதிவு Firestore கிளவுட்டில் சேமிக்கப்பட்டது!'
                          )
                        );
                      }}
                      className="inline-flex items-center gap-1 rounded border border-blue-200 bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-[#0B2A6F]"
                    >
                      <span>
                        {tr(lang, 'Save to Cloud', 'Cloud සුරකින්න', 'கிளவுட்டில் சேமி')}
                      </span>
                    </button>
                  )}
                </div>
              </div>

              <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-900">
                <img
                  src={generatedImageUrl}
                  alt={prompt}
                  referrerPolicy="no-referrer"
                  className="max-h-[380px] w-full object-contain mx-auto"
                />
              </div>

              {generatedCaption && (
                <p className="text-xs text-slate-600">{generatedCaption}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
