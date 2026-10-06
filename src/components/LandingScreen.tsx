import React, { useState } from 'react';
import {
  GNSilenceEvaluation,
  IncidentCase,
  Report,
  UILanguage,
} from '../types';
import { UI_TRANSLATIONS, tr } from '../lib/i18n';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

interface LandingScreenProps {
  lang: UILanguage;
  reports: Report[];
  cases: IncidentCase[];
  quietAreas: GNSilenceEvaluation[];
  ledgerCount: number;
  ledgerIntact: boolean;
  onEnterDashboard: () => void;
  onNavigateToSubmit: () => void;
  onNavigateToSilenceRadar: () => void;
  onNavigateToLedger: () => void;
  onNavigateToSummary?: () => void;
  onNavigateToAIHub?: () => void;
  onNavigateToEvaluation?: () => void;
  onOpenCase: (caseId: string) => void;
}

function getInteractiveExamples(lang: UILanguage) {
  return [
    {
      id: 'ex-singlish',
      label: tr(
        lang,
        'Romanized Sinhala (Singlish)',
        'රෝමානුකරණය කළ සිංහල (Singlish)',
        'ரோமனைஸ் செய்யப்பட்ட சிங்களம் (Singlish)'
      ),
      channel: tr(
        lang,
        'WhatsApp Forward · Volunteer (w = 0.40 + 0.20 pin/photo)',
        'WhatsApp පණිවිඩය · ස්වේච්ඡා නිලධාරී (w = 0.40 + 0.20 පින්/ඡායාරූප)',
        'WhatsApp பகிர்வு · தன்னார்வலர் (w = 0.40 + 0.20 பின்/புகைப்படம்)'
      ),
      raw: 'Gampola para Gelioya hariye pas kanda kadan watila para sampurnayen wahila. Paul 3k kotu wela innawa podi lamai ekka.',
      translation: tr(
        lang,
        'An earth embankment has collapsed near Gelioya on Gampola Road completely blocking the road. Three families are trapped with young children.',
        'ගෙලිඔය අසල ගම්පොල පාරේ පස් කන්දක් කඩා වැටී මාර්ගය සම්පූර්ණයෙන්ම අවහිර වී ඇත. කුඩා දරුවන් සමඟ පවුල් 3ක් සිරවී සිටිති.',
        'கம்பளை வீதியில் கெலிஓயா அருகே மண்சரிவு ஏற்பட்டு வீதி முற்றாக தடைப்பட்டுள்ளது. சிறு குழந்தைகளுடன் 3 குடும்பங்கள் சிக்கியுள்ளனர்.'
      ),
      extractedType: tr(
        lang,
        'Trapped People & Road Blocked',
        'සිරවී සිටින පිරිස් සහ මාර්ග අවහිරතා',
        'சிக்கியுள்ள மக்கள் & வீதித் தடை'
      ),
      place: tr(
        lang,
        'Gelioya, Gampola Road',
        'ගෙලිඔය, ගම්පොල පාර',
        'கெலிஓயா, கம்பளை வீதி'
      ),
      people: tr(lang, '12 (~3 families)', '12 (~පවුල් 3ක්)', '12 (~3 குடும்பங்கள்)'),
      urgency: tr(
        lang,
        '5 / 5 (Rule-adjusted: trapped + children)',
        '5 / 5 (නීති මගින් සකසන ලද: සිරවූ පිරිස් + දරුවන්)',
        '5 / 5 (விதியால் மாற்றப்பட்டது: சிக்கியோர் + குழந்தைகள்)'
      ),
      corroboration: tr(
        lang,
        'Merged with Tamil GN Officer report [R-002] → Noisy-OR Confidence: 88.0%',
        'දෙමළ ග්‍රාම නිලධාරී වාර්තාව [R-002] සමඟ ඒකාබද්ධ විය → Noisy-OR විශ්වාසය: 88.0%',
        'தமிழ் கிராம சேவகர் அறிக்கை [R-002] உடன் இணைக்கப்பட்டது → Noisy-OR நம்பகத்தன்மை: 88.0%'
      ),
      queue: tr(lang, 'Act now', 'වහාම ක්‍රියාත්මක වන්න', 'உடனடி நடவடிக்கை'),
      isActNow: true,
      caseId: 'C-001',
    },
    {
      id: 'ex-tamil',
      label: tr(lang, 'Tamil Script (தமிழ்)', 'දෙමළ අක්ෂර (தமிழ்)', 'தமிழ் எழுத்து (தமிழ்)'),
      channel: tr(
        lang,
        'WhatsApp · Volunteer + Citizen SMS Corroboration',
        'WhatsApp · ස්වේච්ඡා + පුරවැසි SMS තහවුරු කිරීම',
        'WhatsApp · தன்னார்வலர் + பொதுமக்கள் SMS உறுதிப்படுத்தல்'
      ),
      raw: 'நாவலப்பிட்டி தோட்டப் பாதையில் மண் சரிவு ஏற்பட்டுள்ளது. கர்ப்பிணித் தாய் ஒருவருக்கு உடனடி மருத்துவ உதவி தேவை, வாகனம் வர முடியாது.',
      translation: tr(
        lang,
        'A landslide has occurred on Nawalapitiya estate road. A pregnant mother needs immediate medical help, and vehicles cannot pass.',
        'නාවලපිටිය වතු මාර්ගයේ නායයෑමක් සිදුවී ඇත. ගැබිනි මවකට කඩිනම් වෛද්‍ය ආධාර අවශ්‍ය අතර වාහනවලට පැමිණිය නොහැක.',
        'நாவலப்பிட்டி தோட்டப் பாதையில் மண்சரிவு ஏற்பட்டுள்ளது. கர்ப்பிணித் தாய்க்கு உடனடி மருத்துவ உதவி தேவை, வாகனங்கள் வர முடியாது.'
      ),
      extractedType: tr(
        lang,
        'Medical Emergency',
        'වෛද්‍ය හදිසි අවශ්‍යතා',
        'மருத்துவ அவசரம்'
      ),
      place: tr(
        lang,
        'Nawalapitiya Estate Road',
        'නාවලපිටිය වතු මාර්ගය',
        'நாவலப்பிட்டி தோட்டப் பாதை'
      ),
      people: tr(lang, '1 (Pregnant mother)', '1 (ගැබිනි මවක්)', '1 (கர்ப்பிணித் தாய்)'),
      urgency: tr(
        lang,
        '5 / 5 (Rule-adjusted: medical / maternal)',
        '5 / 5 (නීති මගින් සකසන ලද: වෛද්‍ය / මාතෘ)',
        '5 / 5 (விதியால் மாற்றப்பட்டது: மருத்துவ அவசரம்)'
      ),
      corroboration: tr(
        lang,
        'Merged with Romanized Tamil SMS [R-006] → Noisy-OR Confidence: 62.5%',
        'රෝමානුකරණය කළ දෙමළ SMS [R-006] සමඟ ඒකාබද්ධ විය → Noisy-OR විශ්වාසය: 62.5%',
        'ரோமனைஸ் தமிழ் SMS [R-006] உடன் இணைக்கப்பட்டது → Noisy-OR நம்பகத்தன்மை: 62.5%'
      ),
      queue: tr(lang, 'Act now', 'වහාම ක්‍රියාත්මක වන්න', 'உடனடி நடவடிக்கை'),
      isActNow: true,
      caseId: 'C-003',
    },
    {
      id: 'ex-sinhala',
      label: tr(lang, 'Sinhala Script (සිංහල)', 'සිංහල අක්ෂර (සිංහල)', 'சிங்கள எழுத்து (සිංහල)'),
      channel: tr(
        lang,
        'Web Form · GN Officer + Red Cross Volunteer',
        'වෙබ් පෝරමය · ග්‍රාම නිලධාරී + රතු කුරුස ස්වේච්ඡා',
        'இணைய படிவம் · கிராம சேவகர் + செஞ்சிலுவை தன்னார்வலர்'
      ),
      raw: 'අකුරණ නගරයේ වතුර මට්ටම අඩි 4ක් පමණ ඉහළ ගොස් ඇත. වැඩිහිටි නිවාසයක 18 දෙනෙක් ඉහළ මාලයේ සිරවී සිටිති. බෝට්ටු සහ පානීය ජලය ඉක්මනින් අවශ්‍යයි.',
      translation: tr(
        lang,
        'Water levels in Akurana town have risen by about 4 feet. 18 residents in an elders home are stranded on the upper floor. Boats and drinking water are urgently needed.',
        'අකුරණ නගරයේ ජල මට්ටම අඩි 4ක් පමණ ඉහළ ගොස් ඇත. වැඩිහිටි නිවාසයක 18 දෙනෙක් ඉහළ මාලයේ සිරවී සිටිති. බෝට්ටු සහ පානීය ජලය කඩිනමින් අවශ්‍ය වේ.',
        'அக்குறணை நகரில் நீர்மட்டம் சுமார் 4 அடி உயர்ந்துள்ளது. முதியோர் இல்லத்தில் 18 பேர் மேல் மாடியில் சிக்கியுள்ளனர். படகுகள் மற்றும் குடிநீர் உடனடியாகத் தேவை.'
      ),
      extractedType: tr(
        lang,
        'Trapped People',
        'සිරවී සිටින පිරිස්',
        'சிக்கியுள்ள மக்கள்'
      ),
      place: tr(lang, 'Akurana', 'අකුරණ නගරය', 'அக்குறணை'),
      people: tr(
        lang,
        '18 (Elderly residents)',
        '18 (වැඩිහිටි නේවාසිකයින්)',
        '18 (முதியவர்கள்)'
      ),
      urgency: tr(
        lang,
        '5 / 5 (Rule-adjusted: trapped + elderly)',
        '5 / 5 (නීති මගින් සකසන ලද: සිරවූ + වැඩිහිටි)',
        '5 / 5 (விதியால் மாற்றப்பட்டது: சிக்கியோர் + முதியோர்)'
      ),
      corroboration: tr(
        lang,
        'Merged with English Volunteer report [R-004] → Noisy-OR Confidence: 88.0%',
        'ඉංග්‍රීසි ස්වේච්ඡා වාර්තාව [R-004] සමඟ ඒකාබද්ධ විය → Noisy-OR විශ්වාසය: 88.0%',
        'ஆங்கில தன்னார்வலர் அறிக்கை [R-004] உடன் இணைக்கப்பட்டது → Noisy-OR நம்பகத்தன்மை: 88.0%'
      ),
      queue: tr(lang, 'Act now', 'වහාම ක්‍රියාත්මක වන්න', 'உடனடி நடவடிக்கை'),
      isActNow: true,
      caseId: 'C-002',
    },
    {
      id: 'ex-unverified',
      label: tr(
        lang,
        'Single Unverified Forward',
        'තනි තහවුරු නොකළ පණිවිඩයක්',
        'உறுதிப்படுத்தப்படாத தனித் தகவல்'
      ),
      channel: tr(
        lang,
        'WhatsApp · Citizen (No GPS Pin, No Photo)',
        'WhatsApp · පුරවැසි (GPS පින් හෝ ඡායාරූප නොමැත)',
        'WhatsApp · பொதுமக்கள் (GPS பின் இல்லை, புகைப்படம் இல்லை)'
      ),
      raw: 'Hanthana uda para langa gal පෙරළිලා ගෙයක් උඩට වැටිලා කියලා ආරංචියි. පොඩි ළමයෙක්ට තුවාලයි කියනවා, හරියටම තැන දන්නේ නෑ.',
      translation: tr(
        lang,
        'Heard that boulders rolled onto a house near Hanthana upper road. They say a young child is injured, exact spot unknown.',
        'හන්තාන ඉහළ පාර අසල නිවසක් මතට ගල් පෙරළී ඇති බවට ආරංචියි. කුඩා දරුවෙකුට තුවාල බව පවසයි, නිශ්චිත ස්ථානය නොදනී.',
        'ஹந்தான மேல் வீதி அருகே வீட்டின் மீது பாறைகள் உருண்டு விழுந்ததாக தகவல். சிறு குழந்தைக்கு காயம் என்கிறார்கள், சரியான இடம் தெரியவில்லை.'
      ),
      extractedType: tr(lang, 'Landslide', 'නායයෑම්', 'மண்சரிவு'),
      place: tr(lang, 'Hanthana Upper Slope', 'හන්තාන ඉහළ බෑවුම', 'ஹந்தான மேல் சரிவு'),
      people: tr(
        lang,
        '4 (1 child reported injured)',
        '4 (දරුවෙකුට තුවාල බව වාර්තා වේ)',
        '4 (குழந்தைக்கு காயம் என தகவல்)'
      ),
      urgency: tr(
        lang,
        '5 / 5 (Rule-adjusted: child + injury)',
        '5 / 5 (නීති මගින් සකසන ලද: දරුවා + තුවාල)',
        '5 / 5 (விதியால் மாற்றப்பட்டது: குழந்தை + காயம்)'
      ),
      corroboration: tr(
        lang,
        'Single citizen report without pin/photo → Noisy-OR Confidence: 25.0% (< 0.50 threshold)',
        'GPS/ඡායාරූප රහිත තනි පුරවැසි වාර්තාව → Noisy-OR විශ්වාසය: 25.0% (< 0.50 සීමාව)',
        'பின்/புகைப்படம் இல்லாத தனி அறிக்கை → Noisy-OR நம்பகத்தன்மை: 25.0% (< 0.50 வரம்பு)'
      ),
      queue: tr(lang, 'Verify fast', 'ඉක්මනින් තහවුරු කරන්න', 'விரைந்து சரிபார்'),
      isActNow: false,
      caseId: 'C-004',
    },
  ];
}

export const LandingScreen: React.FC<LandingScreenProps> = ({
  lang,
  reports,
  cases,
  quietAreas,
  ledgerCount,
  ledgerIntact,
  onEnterDashboard,
  onNavigateToSubmit,
  onNavigateToSilenceRadar,
  onNavigateToLedger,
  onNavigateToSummary,
  onNavigateToAIHub,
  onNavigateToEvaluation,
  onOpenCase,
}) => {
  const t = UI_TRANSLATIONS[lang];
  const examples = getInteractiveExamples(lang);
  const [selectedExampleId, setSelectedExampleId] = useState(examples[0].id);

  const activeExample =
    examples.find((e) => e.id === selectedExampleId) || examples[0];

  const flaggedQuietCount = quietAreas.filter((g) => g.isQuiet).length;
  const actNowCount = cases.filter((c) => c.queue === 'act_now').length;
  const verifyFastCount = cases.filter((c) => c.queue === 'verify_fast').length;

  return (
    <div className="mx-auto max-w-6xl space-y-12 py-4">
      {/* 1. Hero Section — Clean, Restrained, Authoritative */}
      <section className="border-b border-slate-200 pb-10">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-center">
          <div className="space-y-5 lg:col-span-7">
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
              <span className="font-semibold text-[#0B2A6F]">
                {tr(
                  lang,
                  'Divisional Secretariat (DS) Decision-Support Layer',
                  'ප්‍රාදේශීය ලේකම් කාර්යාලයීය (DS) තීරණ සහාය පද්ධතිය',
                  'பிரதேச செயலக (DS) தீர்மான ஆதரவு அமைப்பு'
                )}
              </span>
              <span aria-hidden="true">·</span>
              <span>
                {tr(
                  lang,
                  'Central Highlands Operations (Kandy, Nuwara Eliya, Matale)',
                  'මධ්‍යම කඳුකර මෙහෙයුම් (මහනුවර, නුවරඑළිය, මාතලේ)',
                  'மத்திய மலைநாட்டு செயல்பாடுகள் (கண்டி, நுவரெலியா, மாத்தளை)'
                )}
              </span>
              <span aria-hidden="true">·</span>
              <span>
                {tr(lang, 'Offline-Capable PWA', 'Offline ක්‍රියාකාරී PWA', 'Offline திறன் கொண்ட PWA')}
              </span>
            </div>

            <h1
              className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl lg:text-[40px] lg:leading-[1.15]"
              style={{ textWrap: 'balance' }}
            >
              {t.tagline}
            </h1>

            <p className="max-w-2xl text-base leading-relaxed text-slate-600">
              {tr(
                lang,
                'When floods and landslides hit Sri Lanka, divisional coordinators receive scattered reports in Sinhala, Tamil, English, and Romanized Singlish or Tanglish—while cut-off villages with no mobile signal send nothing at all. DisaLink AI reads, merges, and ranks incoming reports by urgency and corroboration confidence, and flags areas that have gone unusually quiet.',
                'ශ්‍රී ලංකාවේ ගංවතුර සහ නායයෑම් ආපදා අවස්ථාවලදී ප්‍රාදේශීය සම්බන්ධීකාරක නිලධාරීන් වෙත සිංහල, දෙමළ, ඉංග්‍රීසි සහ Singlish/Tanglish මගින් විසිරුණු වාර්තා ලැබෙන අතර, දුරකථන සංඥා බිඳවැටුණු ගම්මානවලින් කිසිදු තොරතුරක් නොලැබේ. DisaLink AI මගින් මෙම වාර්තා කියවා, එකම සිදුවීමට අදාළ වාර්තා ඒකාබද්ධ කර, හදිසි බව සහ විශ්වාසනීයත්වය අනුව පෙළගස්වන අතර අසාමාන්‍ය ලෙස නිහඬ වූ ග්‍රාම නිලධාරී වසම් හඳුනා ගනී.',
                'இலங்கையில் வெள்ளம் மற்றும் மண்சரிவு ஏற்படும்போது, பிரதேச ஒருங்கிணைப்பாளர்களுக்கு சிங்களம், தமிழ், ஆங்கிலம் மற்றும் தங்கிலீஷ் மொழிகளில் சிதறிய அறிக்கைகள் வருகின்றன—அதேவேளை தொலைத்தொடர்பு துண்டிக்கப்பட்ட கிராமங்களிலிருந்து எந்தத் தகவலும் வருவதில்லை. DisaLink AI இவற்றைப் படித்து, ஒன்றிணைத்து, அவசரம் மற்றும் நம்பகத்தன்மை அடிப்படையில் வரிசைப்படுத்துவதுடன், வழமைக்கு மாறாக மௌனமாக உள்ள பிரிவுகளையும் கண்டறிகிறது.'
              )}
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                type="button"
                onClick={onEnterDashboard}
                className="inline-flex items-center gap-2 rounded-md bg-[#0B2A6F] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#082054] transition-colors whitespace-nowrap"
              >
                <span>
                  {tr(
                    lang,
                    'Open Coordinator Console',
                    'සම්බන්ධීකාරක පුවරුව විවෘත කරන්න',
                    'ஒருங்கிணைப்பாளர் பலகையைத் திறக்கவும்'
                  )}
                </span>
                <ArrowRight className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={onNavigateToSubmit}
                className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 hover:bg-slate-50 transition-colors whitespace-nowrap"
              >
                <span>
                  {tr(
                    lang,
                    'Submit Field Report',
                    'ක්ෂේත්‍ර වාර්තාවක් යොමු කරන්න',
                    'கள அறிக்கையைச் சமர்ப்பிக்கவும்'
                  )}
                </span>
              </button>

              <button
                type="button"
                onClick={onNavigateToSilenceRadar}
                className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors whitespace-nowrap"
              >
                <span>
                  {tr(
                    lang,
                    `Inspect Silence Radar (${flaggedQuietCount} Quiet)`,
                    `නිහඬතා රේඩාර් පරීක්ෂා කරන්න (නිහඬ ${flaggedQuietCount})`,
                    `மௌன ரேடாரை ஆய்வு செய்க (${flaggedQuietCount} மௌனம்)`
                  )}
                </span>
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-2 text-xs text-slate-500">
              <span>{t.footerNotice}</span>
              <span aria-hidden="true">·</span>
              <span>
                {tr(
                  lang,
                  'Complements the DMC Emergency Operations Centre',
                  'ආපදා කළමනාකරණ මධ්‍යස්ථානයේ (DMC) හදිසි මෙහෙයුම් සඳහා සහාය වේ',
                  'அனர்த்த முகாமைத்துவ நிலையத்தின் (DMC) அவசர செயல்பாடுகளுக்குத் துணைபுரிகிறது'
                )}
              </span>
              <span aria-hidden="true">·</span>
              <span>
                {tr(
                  lang,
                  'Never dispatches resources automatically',
                  'කිසිවිටෙක ස්වයංක්‍රීයව සම්පත් පිටත් නොකරයි',
                  'தன்னிச்சையாக வளங்களை அனுப்பாது'
                )}
              </span>
            </div>
          </div>

          {/* Right Column: Live Operational Snapshot Card */}
          <div className="rounded-lg border border-slate-200 bg-white p-5 lg:col-span-5">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <div className="text-xs font-semibold text-slate-900">
                  {tr(
                    lang,
                    'Divisional Workspace Telemetry (IndexedDB & Cloud Sync)',
                    'ප්‍රාදේශීය මෙහෙයුම් දත්ත පුවරුව (IndexedDB සහ Cloud Sync)',
                    'பிரதேச செயல்பாட்டு தரவுப் பலகை (IndexedDB & Cloud Sync)'
                  )}
                </div>
                <div className="text-[11px] text-slate-500">
                  {tr(
                    lang,
                    'Persistent local storage with real-time Firestore backup',
                    'ස්ථාවර දේශීය දත්ත ගබඩාව සහ සජීවී Firestore උපස්ථය',
                    'நிரந்தர உள்ளூர் சேமிப்பு மற்றும் நேரடி Firestore காப்புப்பிரதி'
                  )}
                </div>
              </div>
              <span className="font-mono text-xs font-semibold text-[#0B2A6F]">
                {tr(lang, 'ACTIVE', 'සක්‍රීයයි', 'செயலில்')}
              </span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                <div className="text-xs text-slate-500">
                  {tr(lang, 'Ingested Reports', 'ලැබුණු වාර්තා', 'பெறப்பட்ட அறிக்கைகள்')}
                </div>
                <div className="mt-1 font-mono text-2xl font-bold text-slate-900 tabular-nums">
                  {reports.length}
                </div>
                <div className="mt-0.5 text-[11px] text-slate-500">
                  {tr(
                    lang,
                    'Sinhala · Tamil · Singlish · EN',
                    'සිංහල · දෙමළ · Singlish · EN',
                    'சிங்களம் · தமிழ் · தங்கிலீஷ் · EN'
                  )}
                </div>
              </div>

              <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                <div className="text-xs text-slate-500">
                  {tr(lang, 'Merged Cases', 'ඒකාබද්ධ සිදුවීම්', 'இணைக்கப்பட்ட சம்பவங்கள்')}
                </div>
                <div className="mt-1 font-mono text-2xl font-bold text-slate-900 tabular-nums">
                  {cases.length}
                </div>
                <div className="mt-0.5 font-mono text-[11px] text-slate-600 tabular-nums">
                  <span className="font-semibold text-red-600">
                    {actNowCount} {tr(lang, 'Act', 'ක්‍රියාත්මක', 'உடனடி')}
                  </span>{' '}
                  ·{' '}
                  <span className="font-semibold text-amber-600">
                    {verifyFastCount} {tr(lang, 'Verify', 'තහවුරු', 'சரிபார்')}
                  </span>
                </div>
              </div>

              <div
                onClick={onNavigateToSilenceRadar}
                className="cursor-pointer rounded-md border border-slate-200 bg-slate-50 p-3 hover:border-amber-500 transition-colors"
              >
                <div className="text-xs text-slate-500">
                  {tr(lang, 'Silent GN Divisions', 'නිහඬ ග්‍රාම නිලධාරී වසම්', 'மௌனமான கிராம பிரிவுகள்')}
                </div>
                <div className="mt-1 font-mono text-2xl font-bold text-amber-700 tabular-nums">
                  {flaggedQuietCount} / {quietAreas.length}
                </div>
                <div className="mt-0.5 text-[11px] text-amber-800">
                  Poisson tail p &lt; 0.05
                </div>
              </div>

              <div
                onClick={onNavigateToLedger}
                className="cursor-pointer rounded-md border border-slate-200 bg-slate-50 p-3 hover:border-[#0B2A6F] transition-colors"
              >
                <div className="text-xs text-slate-500">
                  {tr(lang, 'SHA-256 Decision Ledger', 'SHA-256 තීරණ ලෙජරය', 'SHA-256 முடிவுப் பதிவேடு')}
                </div>
                <div className="mt-1 font-mono text-2xl font-bold text-slate-900 tabular-nums">
                  {ledgerCount}
                </div>
                <div
                  className={`mt-0.5 text-[11px] font-medium ${
                    ledgerIntact ? 'text-emerald-700' : 'text-red-700'
                  }`}
                >
                  {ledgerIntact ? t.stats.intact : t.stats.tampered}
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
              <span className="text-slate-500">
                {tr(
                  lang,
                  'Active Divisional Secretariat Triage Console',
                  'සක්‍රීය ප්‍රාදේශීය ලේකම් කාර්යාලයීය ප්‍රමුඛතා පුවරුව',
                  'செயலில் உள்ள பிரதேச செயலக முன்னுரிமைப் பலகை'
                )}
              </span>
              <button
                type="button"
                onClick={onEnterDashboard}
                className="font-semibold text-[#0B2A6F] hover:underline"
              >
                {tr(
                  lang,
                  'Launch Triage Map →',
                  'ප්‍රමුඛතා සිතියම විවෘත කරන්න →',
                  'முன்னுரிமை வரைபடத்தைத் திற →'
                )}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Interactive Pipeline Walkthrough — How a Messy Report Becomes a Ranked Case */}
      <section className="space-y-4 border-b border-slate-200 pb-10">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              {tr(
                lang,
                'How DisaLink AI Turns Unstructured Messages into Corroborated Cases',
                'අවිධිමත් ක්ෂේත්‍ර පණිවිඩ තහවුරු කළ සිදුවීම් බවට පත් කරන ආකාරය',
                'ஒழுங்கற்ற களச் செய்திகளை உறுதிப்படுத்தப்பட்ட சம்பவங்களாக மாற்றும் விதம்'
              )}
            </h2>
            <p className="text-xs text-slate-600">
              {tr(
                lang,
                'Select a field report below to inspect how Romanized/script extraction, deterministic safety rules, and Noisy-OR corroboration work together.',
                'බහුභාෂා දත්ත උකහා ගැනීම, ආරක්ෂිත නීති සහ Noisy-OR විශ්වාසනීයත්ව ගණනය ක්‍රියාත්මක වන ආකාරය බැලීමට පහත වාර්තාවක් තෝරන්න.',
                'பன்மொழி தரவு பிரித்தெடுப்பு, பாதுகாப்பு விதிகள் மற்றும் Noisy-OR நம்பகத்தன்மை எவ்வாறு செயல்படுகின்றன என்பதைக் காண கீழே ஒரு அறிக்கையைத் தேர்ந்தெடுக்கவும்.'
              )}
            </p>
          </div>

          <div className="flex w-full sm:w-auto items-center gap-1 overflow-x-auto no-scrollbar rounded-lg bg-slate-100 p-1">
            {examples.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedExampleId(item.id)}
                className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                  selectedExampleId === item.id
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 rounded-lg border border-slate-200 bg-white p-5 lg:grid-cols-12">
          {/* Left: Raw Input */}
          <div className="space-y-3 border-b border-slate-200 pb-4 lg:col-span-5 lg:border-b-0 lg:border-r lg:pb-0 lg:pr-5">
            <div className="text-xs font-semibold text-slate-500">
              {tr(
                lang,
                'Step 1 · Raw Incoming Report (Untrusted Data Input)',
                'පියවර 1 · ලැබුණු මුල් වාර්තාව (අවිධිමත් දත්ත ආදානය)',
                'படி 1 · பெறப்பட்ட மூல அறிக்கை (தரவு உள்ளீடு)'
              )}
            </div>
            <div className="text-xs text-slate-600">
              {tr(lang, 'Channel:', 'මාධ්‍යය:', 'வழிமுறை:')}{' '}
              <strong>{activeExample.channel}</strong>
            </div>
            <div className="rounded-md border border-slate-200 bg-slate-50 p-3.5 text-sm leading-relaxed text-slate-900">
              "{activeExample.raw}"
            </div>
            <div className="text-xs text-slate-600">
              <span className="font-semibold text-slate-800">
                {tr(
                  lang,
                  'Normalized Translation:',
                  'පරිවර්තනය:',
                  'மொழிபெயர்ப்பு:'
                )}
              </span>{' '}
              {activeExample.translation}
            </div>
          </div>

          {/* Right: Structured Output + Noisy-OR Triage */}
          <div className="flex flex-col justify-between space-y-4 lg:col-span-7 lg:pl-2">
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                <span>
                  {tr(
                    lang,
                    'Step 2 · Strict JSON Extraction + Safety Rule Layer + Noisy-OR Merge',
                    'පියවර 2 · ව්‍යුහගත JSON දත්ත + ආරක්ෂිත නීති ස්තරය + Noisy-OR ඒකාබද්ධ කිරීම',
                    'படி 2 · JSON பிரித்தெடுப்பு + பாதுகாப்பு விதி அடுக்கு + Noisy-OR இணைப்பு'
                  )}
                </span>
                <span className="font-mono text-[#0B2A6F]">
                  {t.status.aiSuggestion.toUpperCase()}
                </span>
              </div>

              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-md border border-slate-200 p-3">
                  <div className="text-[11px] text-slate-500">
                    {tr(
                      lang,
                      'Incident Type & Standardized Place',
                      'සිදුවීම් වර්ගය සහ සම්මත ස්ථානය',
                      'சம்பவ வகை மற்றும் தரப்படுத்தப்பட்ட இடம்'
                    )}
                  </div>
                  <div className="mt-0.5 text-xs font-semibold text-slate-900">
                    {activeExample.extractedType} · {activeExample.place}
                  </div>
                  <div className="mt-1 font-mono text-[11px] text-slate-600">
                    {tr(
                      lang,
                      'People affected:',
                      'බලපෑමට ලක්වූ පිරිස:',
                      'பாதிக்கப்பட்டோர்:'
                    )}{' '}
                    {activeExample.people}
                  </div>
                </div>

                <div className="rounded-md border border-slate-200 p-3">
                  <div className="text-[11px] text-slate-500">
                    {tr(
                      lang,
                      'Urgency Score (Separate from Confidence)',
                      'හදිසි බව (විශ්වාසනීයත්වයෙන් වෙන්ව ගණනය කෙරේ)',
                      'அவசர நிலை (நம்பகத்தன்மையிலிருந்து தனித்தது)'
                    )}
                  </div>
                  <div className="mt-0.5 font-mono text-xs font-semibold text-slate-900">
                    {activeExample.urgency}
                  </div>
                  <div className="mt-1 text-[11px] text-slate-600">
                    {tr(
                      lang,
                      'Rule layer enforces ≥ 4 on trapped, child, elderly, or injury',
                      'සිරවූ පිරිස්, දරුවන්, වැඩිහිටියන් හෝ තුවාල සඳහා හදිසි බව ≥ 4 අනිවාර්ය කරයි',
                      'சிக்கியோர், குழந்தைகள், முதியோர் அல்லது காயங்களுக்கு அவசரம் ≥ 4 உறுதி செய்யப்படுகிறது'
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-3 rounded-md border border-slate-200 bg-slate-50 p-3 text-xs">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium text-slate-800">
                    {activeExample.corroboration}
                  </span>
                  <span
                    className={`font-mono font-semibold ${
                      activeExample.isActNow
                        ? 'text-red-600'
                        : 'text-amber-600'
                    }`}
                  >
                    {tr(lang, 'Queue:', 'පෝලිම:', 'வரிசை:')}{' '}
                    {activeExample.queue.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-slate-100 pt-3">
              <span className="text-xs text-slate-500">
                {tr(
                  lang,
                  'Coordinator confirms, edits priority, or marks road blocked in Case Detail.',
                  'සම්බන්ධීකාරක නිලධාරියා විසින් සිදුවීම් විස්තරයේදී මෙය තහවුරු කිරීම හෝ ප්‍රමුඛතාවය වෙනස් කිරීම සිදු කරයි.',
                  'ஒருங்கிணைப்பாளர் சம்பவ விவரத்தில் இதை உறுதிப்படுத்தலாம் அல்லது முன்னுரிமையை மாற்றலாம்.'
                )}
              </span>
              <button
                type="button"
                onClick={() => onOpenCase(activeExample.caseId)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#0B2A6F] hover:underline"
              >
                <span>
                  {tr(lang, 'Inspect Case', 'සිදුවීම පරීක්ෂා කරන්න', 'சம்பவத்தைக் காண்க')}{' '}
                  {activeExample.caseId}
                </span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Five Engineering Pillars — Asymmetric Bento / Editorial Numbering */}
      <section className="space-y-4 border-b border-slate-200 pb-10">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            {tr(
              lang,
              'Five Core Capabilities in One System',
              'එකම පද්ධතියක් තුළ ප්‍රධාන හැකියාවන් පහක්',
              'ஒரே அமைப்பில் ஐந்து முக்கிய திறன்கள்'
            )}
          </h2>
          <p className="text-xs text-slate-600">
            {tr(
              lang,
              'AI is used strictly where rules fail—reading informal multilingual text. Everything else uses transparent statistics, geometry, and cryptography.',
              'අවිධිමත් බහුභාෂා පණිවිඩ කියවීම සඳහා පමණක් AI භාවිතා වන අතර අනෙක් සියල්ල විනිවිද පෙනෙන සංඛ්‍යානමය, ජ්‍යාමිතික සහ ගුප්තකේතන නීති මත ක්‍රියා කරයි.',
              'ஒழுங்கற்ற பன்மொழி உரைகளைப் படிக்க மட்டுமே AI பயன்படுத்தப்படுகிறது. மற்ற அனைத்தும் வெளிப்படையான புள்ளியியல், வடிவியல் மற்றும் குறியாக்கவியல் விதிகளைப் பயன்படுத்துகின்றன.'
            )}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-6">
          <div className="rounded-lg border border-slate-200 bg-white p-5 md:col-span-3">
            <h3 className="text-sm font-semibold text-slate-900">
              {tr(
                lang,
                '01. Romanized Sinhala & Tamil Understanding',
                '01. සිංහල, දෙමළ සහ Singlish/Tanglish හඳුනාගැනීම',
                '01. சிங்களம், தமிழ் மற்றும் தங்கிலீஷ் புரிதல்'
              )}
            </h3>
            <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
              {tr(
                lang,
                'Field volunteers and citizens frequently type Sinhala and Tamil in Latin script ("Singlish" and "Tanglish") on WhatsApp. DisaLink AI uses few-shot prompting and a strict JSON schema to extract incident type, standardized English place name, affected headcount, needs, and a one-line reason—while treating all report text as untrusted data.',
                'ක්ෂේත්‍ර ස්වේච්ඡා නිලධාරීන් සහ පුරවැසියන් බොහෝවිට WhatsApp හරහා ඉංග්‍රීසි අකුරින් සිංහල සහ දෙමළ ("Singlish" සහ "Tanglish") පණිවිඩ එවයි. DisaLink AI මගින් එම පණිවිඩවල ඇති සිදුවීම් වර්ගය, ස්ථානය, බලපෑමට ලක්වූ පිරිස, අවශ්‍යතා සහ හදිසි බව නිවැරදිව ව්‍යුහගත දත්ත බවට පත් කරයි.',
                'களத் தன்னார்வலர்கள் மற்றும் பொதுமக்கள் அடிக்கடி WhatsApp-இல் ஆங்கில எழுத்துக்களில் சிங்களம் மற்றும் தமிழை ("Singlish" & "Tanglish") தட்டச்சு செய்கின்றனர். DisaLink AI இவற்றிலிருந்து சம்பவ வகை, இடம், பாதிக்கப்பட்டோர் எண்ணிக்கை மற்றும் தேவைகளை துல்லியமாகப் பிரித்தெடுக்கிறது.'
              )}
            </p>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-5 md:col-span-3">
            <h3 className="text-sm font-semibold text-slate-900">
              {tr(
                lang,
                '02. Corroboration-Scored Incident Cases (Noisy-OR)',
                '02. Noisy-OR විශ්වාසනීයත්වය සහිත සිදුවීම් ඒකාබද්ධ කිරීම',
                '02. Noisy-OR நம்பகத்தன்மை மதிப்பீட்டுடன் சம்பவ இணைப்பு'
              )}
            </h3>
            <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
              {tr(
                lang,
                'Reports of the same incident type within 500 metres (Haversine) or matching village name within 3 hours merge automatically across languages. Confidence is computed via C = 1 − Π(1 − w_i) (GN officer 0.6, Agency 0.6, Volunteer 0.4, Citizen 0.25, +0.1 pin, +0.1 photo). Urgency and confidence are never conflated.',
                'මීටර් 500ක් ඇතුළත හෝ පැය 3ක් තුළ එකම ගම්මානයෙන් විවිධ භාෂාවලින් ලැබෙන එකම සිදුවීමේ වාර්තා ස්වයංක්‍රීයව ඒකාබද්ධ වේ. විශ්වාසනීයත්වය C = 1 − Π(1 − w_i) සූත්‍රය මගින් ගණනය කෙරේ. හදිසි බව සහ විශ්වාසනීයත්වය වෙන් වෙන්ව තබා ගනී.',
                '500 மீட்டர் சுற்றளவில் அல்லது 3 மணிநேரத்திற்குள் ஒரே கிராமத்திலிருந்து வெவ்வேறு மொழிகளில் வரும் அறிக்கைகள் தானாகவே இணைக்கப்படுகின்றன. நம்பகத்தன்மை C = 1 − Π(1 − w_i) மூலம் கணக்கிடப்படுகிறது.'
              )}
            </p>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-5 md:col-span-2">
            <h3 className="text-sm font-semibold text-slate-900">
              {tr(
                lang,
                '03. Silence Radar for Cut-Off Areas',
                '03. සන්නිවේදනය බිඳවැටුණු වසම් සඳහා නිහඬතා රේඩාර්',
                '03. தொடர்பு துண்டிக்கப்பட்ட பகுதிகளுக்கான மௌன ரேடார்'
              )}
            </h3>
            <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
              {tr(
                lang,
                'Villages with downed cell towers send zero reports, making silence look like safety. A Poisson lower-tail test compares each Grama Niladhari division\'s recent reporting against its storm baseline and local hazard level, generating "Check on this area" tasks when p < 0.05.',
                'දුරකථන කුළුණු බිඳවැටුණු ගම්මානවලින් වාර්තා නොලැබීම ආරක්ෂිත බවක් ලෙස වරදවා වටහා ගත හැක. Poisson පරීක්ෂාව මගින් එක් එක් ග්‍රාම නිලධාරී වසමේ අපේක්ෂිත වාර්තා ප්‍රමාණය සහ අවදානම් මට්ටම සසඳා p < 0.05 වූ විට එම වසම පරීක්ෂා කිරීමට දැනුම් දෙයි.',
                'செல்போன் கோபுரங்கள் செயலிழந்த கிராமங்களிலிருந்து எந்த அறிக்கையும் வராது. Poisson சோதனை மூலம் ஒவ்வொரு கிராம சேவகர் பிரிவின் அறிக்கை அளவையும் ஒப்பிட்டு p < 0.05 ஆக இருக்கும்போது உடனடியாகச் சரிபார்க்க அறிவுறுத்துகிறது.'
              )}
            </p>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-5 md:col-span-2">
            <h3 className="text-sm font-semibold text-slate-900">
              {tr(
                lang,
                '04. Offline-First Any-Channel Intake',
                '04. අන්තර්ජාලය නොමැති විටද ක්‍රියාත්මක වන පද්ධතිය',
                '04. இணையம் இல்லாமலும் செயல்படும் உள்ளீட்டு முறை'
              )}
            </h3>
            <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
              {tr(
                lang,
                'Built as an installable Progressive Web App with a service worker and IndexedDB queue. Reports submitted without connectivity are stored locally with a UUID idempotency key and sync automatically without duplicates or losses when signal returns.',
                'Service Worker සහ IndexedDB පෝලිමක් සහිත PWA යෙදුමක් ලෙස නිර්මාණය කර ඇත. අන්තර්ජාල සම්බන්ධතාවය නොමැතිව යොමු කරන වාර්තා UUID යතුරක් සහිතව උපාංගයේ තැන්පත් වී නැවත සංඥා ලැබුණු විගස අනුපිටපත්වලින් තොරව ස්වයංක්‍රීයව සමමුහුර්ත වේ.',
                'Service Worker மற்றும் IndexedDB வரிசையுடன் கூடிய PWA ஆக உருவாக்கப்பட்டுள்ளது. இணைய இணைப்பு இல்லாமல் சமர்ப்பிக்கப்படும் அறிக்கைகள் உள்ளூரில் சேமிக்கப்பட்டு, இணைப்பு திரும்பியதும் நகல்கள் இன்றி தானாகவே ஒத்திசைக்கப்படும்.'
              )}
            </p>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-5 md:col-span-2">
            <h3 className="text-sm font-semibold text-slate-900">
              {tr(
                lang,
                '05. Tamper-Evident Decision Ledger',
                '05. වෙනස් කළ නොහැකි SHA-256 තීරණ ලෙජරය',
                '05. மாற்றங்களைக் கண்டறியும் SHA-256 முடிவுப் பதிவேடு'
              )}
            </h3>
            <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
              {tr(
                lang,
                'Every AI suggestion and every human coordinator override is recorded in an append-only chain using Web Crypto SHA-256(prevHash + canonicalJSON). Anyone can run full-chain verification to audit what the AI suggested and what humans decided.',
                'සෑම AI යෝජනාවක්ම සහ සෑම නිලධාරී තීරණයක්ම Web Crypto SHA-256(prevHash + canonicalJSON) දාමයක් ලෙස සටහන් වේ. AI යෝජනා කළ දේ සහ මිනිස් නිලධාරියා තීරණය කළ දේ ඕනෑම අවස්ථාවක පූර්ණ විගණනයකට ලක් කළ හැක.',
                'ஒவ்வொரு AI பரிந்துரையும் மனித அதிகாரியின் முடிவும் Web Crypto SHA-256(prevHash + canonicalJSON) சங்கிலியில் பதிவு செய்யப்படுகின்றன. AI பரிந்துரைத்ததையும் அதிகாரிகள் எடுத்த முடிவையும் எப்போதும் தணிக்கை செய்யலாம்.'
              )}
            </p>
          </div>
        </div>
      </section>

      {/* 4. Documented Context & Evidence (Cyclone Ditwah & Sri Lanka Disaster Response) */}
      <section className="grid grid-cols-1 gap-6 border-b border-slate-200 pb-10 lg:grid-cols-12">
        <div className="space-y-3 lg:col-span-5">
          <h2 className="text-lg font-semibold text-slate-900">
            {tr(
              lang,
              'Why Last-Mile Triage Matters in Sri Lanka',
              'ශ්‍රී ලංකාවේ බිම් මට්ටමේ ආපදා කළමනාකරණය වැදගත් වන්නේ ඇයි?',
              'இலங்கையில் கள மட்ட அனர்த்த முன்னுரிமை ஏன் முக்கியமானது?'
            )}
          </h2>
          <p className="text-xs leading-relaxed text-slate-600">
            {tr(
              lang,
              'Sri Lanka\'s Disaster Management Centre (DMC) operates a 24-hour national Emergency Operations Centre. DisaLink AI is designed for the divisional coordinator at the very last mile—who must turn dozens of incoming WhatsApp messages, calls, and field notes into a verified operational picture during monsoons and cyclones.',
              'ශ්‍රී ලංකා ආපදා කළමනාකරණ මධ්‍යස්ථානය (DMC) පැය 24 පුරා ක්‍රියාත්මක ජාතික හදිසි මෙහෙයුම් මැදිරියක් පවත්වාගෙන යයි. මෝසම් වැසි සහ සුළි කුණාටු අවස්ථාවලදී ගම් මට්ටමින් ලැබෙන WhatsApp පණිවිඩ, දුරකථන ඇමතුම් සහ ක්ෂේත්‍ර සටහන් තහවුරු කළ මෙහෙයුම් චිත්‍රයක් බවට පත් කිරීම සඳහා ප්‍රාදේශීය ලේකම් කාර්යාලයීය නිලධාරීන් වෙනුවෙන් DisaLink AI නිර්මාණය කර ඇත.',
              'இலங்கையின் அனர்த்த முகாமைத்துவ நிலையம் (DMC) 24 மணிநேர தேசிய அவசர செயல்பாட்டு மையத்தை இயக்குகிறது. பருவமழை மற்றும் புயல்களின் போது வரும் பலத்த WhatsApp செய்திகள் மற்றும் களக் குறிப்புகளை உறுதிப்படுத்தப்பட்ட செயல்பாட்டுத் தகவல்களாக மாற்ற பிரதேச ஒருங்கிணைப்பாளர்களுக்காக DisaLink AI வடிவமைக்கப்பட்டுள்ளது.'
            )}
          </p>
          <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-2 text-xs text-slate-700">
            <div className="font-semibold text-slate-900">
              {tr(
                lang,
                'Responsible AI & Human Control Safeguards',
                'වගකීම් සහගත AI සහ මිනිස් පාලන ආරක්ෂණ විධිවිධාන',
                'பொறுப்பான AI மற்றும் மனிதக் கட்டுப்பாட்டுப் பாதுகாப்புகள்'
              )}
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-[#0B2A6F] shrink-0 mt-0.5" />
              <span>
                {tr(
                  lang,
                  'Human-in-the-loop only: AI outputs stay marked "AI suggestion" until a coordinator confirms or edits them.',
                  'මිනිස් නිලධාරී අධීක්ෂණය පමණි: සම්බන්ධීකාරක නිලධාරියෙකු තහවුරු කරන තෙක් සියලුම AI ප්‍රතිඵල "AI යෝජනාවක්" ලෙස පවතී.',
                  'மனிதக் கட்டுப்பாடு மட்டுமே: ஒருங்கிணைப்பாளர் உறுதிப்படுத்தும் வரை அனைத்து AI வெளியீடுகளும் "AI பரிந்துரை" என்றே குறிக்கப்பட்டிருக்கும்.'
                )}
              </span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-[#0B2A6F] shrink-0 mt-0.5" />
              <span>
                {tr(
                  lang,
                  'Prompt-injection isolation: Reports are analysed strictly as passive data; the model has no tool access.',
                  'Prompt-injection ආරක්ෂණය: සියලුම වාර්තා හුදු දත්ත ලෙස පමණක් විශ්ලේෂණය කෙරේ; AI ආකෘතියට ස්වයංක්‍රීය විධාන ක්‍රියාත්මක කළ නොහැක.',
                  'Prompt-injection பாதுகாப்பு: அறிக்கைகள் வெறும் தரவாக மட்டுமே பகுப்பாய்வு செய்யப்படுகின்றன; மாதிரிக்கு நேரடி கருவி அணுகல் இல்லை.'
                )}
              </span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-[#0B2A6F] shrink-0 mt-0.5" />
              <span>
                {tr(
                  lang,
                  'Sourced summaries: Draft situation reports cite [R-xxx] tags on every sentence and isolate unverified claims.',
                  'මූලාශ්‍ර සහිත සාරාංශ: තත්ත්ව වාර්තාවේ සෑම වාක්‍යයකටම [R-xxx] මූලාශ්‍ර අංක ඇතුළත් වන අතර තහවුරු නොකළ කරුණු වෙන්ව දක්වයි.',
                  'ஆதாரங்களுடன் கூடிய சுருக்கங்கள்: நிலைமை அறிக்கையின் ஒவ்வொரு வாக்கியமும் [R-xxx] ஆதாரக் குறியீட்டைக் கொண்டிருப்பதுடன் உறுதிப்படுத்தப்படாத தகவல்களைத் தனியாகப் பிரிக்கிறது.'
                )}
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5 lg:col-span-7">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <h3 className="text-sm font-semibold text-slate-900">
              {tr(
                lang,
                'Published Evidence Context (Cyclone Ditwah, Nov–Dec 2025)',
                'ප්‍රකාශිත ජාතික දත්ත පසුබිම (දිට්වා සුළි කුණාටුව, 2025 නොවැ–දෙසැ)',
                'வெளியிடப்பட்ட தேசிய ஆதாரப் பின்னணி (டித்வா புயல், நவ–டிச 2025)'
              )}
            </h3>
            <span className="font-mono text-[11px] text-slate-500">
              {tr(
                lang,
                'Documented National Context',
                'ලේඛනගත ජාතික දත්ත',
                'ஆவணப்படுத்தப்பட்ட தேசிய தரவு'
              )}
            </span>
          </div>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="py-2 pr-3 font-medium">
                    {tr(lang, 'Metric / Finding', 'දත්තය / නිරීක්ෂණය', 'அளவீடு / கண்டறிதல்')}
                  </th>
                  <th className="py-2 px-3 font-medium">
                    {tr(lang, 'Operational Relevance', 'මෙහෙයුම් වැදගත්කම', 'செயல்பாட்டு முக்கியத்துவம்')}
                  </th>
                  <th className="py-2 pl-3 text-right font-medium">
                    {tr(lang, 'Source', 'මූලාශ්‍රය', 'ஆதாரம்')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="py-2.5 pr-3 font-mono font-semibold text-slate-900 tabular-nums">
                    {tr(
                      lang,
                      '2.3M people / 720,000 buildings',
                      'පුද්ගලයින් මිලියන 2.3 / ගොඩනැගිලි 720,000',
                      '23 லட்சம் மக்கள் / 720,000 கட்டிடங்கள்'
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-slate-600">
                    {tr(
                      lang,
                      'Exposed to floodwaters across 1.1M hectares; over 16,000 km of roads in flooded zones.',
                      'හෙක්ටයාර මිලියන 1.1ක් පුරා ගංවතුර බලපෑම්; කි.මී. 16,000කට වැඩි මාර්ග පද්ධතියක් ජලයෙන් යටවූ කලාපවල පැවතිණි.',
                      '1.1 மில்லியன் ஹெக்டேர் பரப்பளவில் வெள்ளப் பாதிப்பு; 16,000 கி.மீ-க்கும் அதிகமான வீதிகள் வெள்ள மண்டலங்களில்.'
                    )}
                  </td>
                  <td className="py-2.5 pl-3 text-right font-mono text-[11px] text-slate-500">
                    UNDP [1]
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 pr-3 font-mono font-semibold text-slate-900 tabular-nums">
                    {tr(
                      lang,
                      '200+ highland landslides',
                      'කඳුකර නායයෑම් 200+',
                      '200+ மலைநாட்டு மண்சரிவுகள்'
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-slate-600">
                    {tr(
                      lang,
                      'Reported across Kandy, Nuwara Eliya, Badulla, and Matale within days.',
                      'දින කිහිපයක් ඇතුළත මහනුවර, නුවරඑළිය, බදුල්ල සහ මාතලේ දිස්ත්‍රික්කවලින් වාර්තා විය.',
                      'கண்டி, நுவரெலியா, பதுளை மற்றும் மாத்தளை மாவட்டங்களில் சில நாட்களுக்குள் பதிவானவை.'
                    )}
                  </td>
                  <td className="py-2.5 pl-3 text-right font-mono text-[11px] text-slate-500">
                    UN / ReliefWeb [8]
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 pr-3 font-mono font-semibold text-slate-900 tabular-nums">
                    {tr(
                      lang,
                      '510 informants in 85 DS divisions',
                      'ප්‍රාදේශීය ලේකම් කොට්ඨාස 85ක තොරතුරු දෙන්නන් 510ක්',
                      '85 பிரதேச செயலகங்களில் 510 தகவல் வழங்குநர்கள்'
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-slate-600">
                    {tr(
                      lang,
                      'RAPIDA assessment highlighted coordination and infrastructure access challenges.',
                      'සම්බන්ධීකරණ සහ මාර්ග ප්‍රවේශ අභියෝග පිළිබඳව RAPIDA තක්සේරුව මගින් අවධාරණය කරන ලදී.',
                      'ஒருங்கிணைப்பு மற்றும் உள்கட்டமைப்பு அணுகல் சவால்களை RAPIDA மதிப்பீடு சுட்டிக்காட்டியது.'
                    )}
                  </td>
                  <td className="py-2.5 pl-3 text-right font-mono text-[11px] text-slate-500">
                    UNDP-DMC [3]
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 pr-3 font-mono font-semibold text-slate-900 tabular-nums">
                    {tr(
                      lang,
                      'Network & road disruptions',
                      'සන්නිවේදන සහ මාර්ග බිඳවැටීම්',
                      'தொலைத்தொடர்பு & வீதித் தடைகள்'
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-slate-600">
                    {tr(
                      lang,
                      'Communication blackouts and blocked entry points hindered accurate field reporting.',
                      'සන්නිවේදන බිඳවැටීම් සහ මාර්ග අවහිරතා හේතුවෙන් නිවැරදි ක්ෂේත්‍ර වාර්තා ලබාගැනීමට බාධා එල්ල විය.',
                      'தொடர்பு துண்டிப்புகள் மற்றும் வீதித் தடைகள் துல்லியமான கள அறிக்கையிடலைப் பாதித்தன.'
                    )}
                  </td>
                  <td className="py-2.5 pl-3 text-right font-mono text-[11px] text-slate-500">
                    UNICEF [12] · IOM [6]
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* 5. Complete System Module Launchpad — 1-Click Access to Every Feature */}
      <section className="space-y-4">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              {tr(
                lang,
                'Complete Operational Workspace — Jump to Any Module',
                'සම්පූර්ණ මෙහෙයුම් පද්ධතිය — ඕනෑම අංශයකට ක්ෂණිකව පිවිසෙන්න',
                'முழு செயல்பாட்டு அமைப்பு — எந்தப் பகுதிக்கும் உடனடியாகச் செல்லுங்கள்'
              )}
            </h2>
            <p className="text-xs text-slate-600">
              {tr(
                lang,
                'Click any module card below (or press Ctrl+K / Alt+1..9) to inspect its live data and controls.',
                'සජීවී දත්ත සහ පාලනයන් පරීක්ෂා කිරීමට පහත ඕනෑම කාඩ්පතක් ක්ලික් කරන්න (නැතහොත් Ctrl+K ඔබන්න).',
                'நேரடி தரவு மற்றும் கட்டுப்பாடுகளை ஆய்வு செய்ய கீழே உள்ள எந்த அட்டையையும் கிளிக் செய்யவும்.'
              )}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              step: '01',
              title: tr(
                lang,
                'Multilingual Field Intake',
                'බහුභාෂා වාර්තා ඇතුළත් කිරීම',
                'பன்மொழி அறிக்கை உள்ளீடு'
              ),
              desc: tr(
                lang,
                'Submit Sinhala, Tamil, English, or Singlish reports via form, WhatsApp, SMS, or voice.',
                'සිංහල, දෙමළ, ඉංග්‍රීසි හෝ Singlish වාර්තා පෝරමය, WhatsApp හෝ හඬ මගින් යොමු කරන්න.',
                'சிங்களம், தமிழ், ஆங்கிலம் அல்லது தங்கிலீஷ் அறிக்கைகளை உள்ளிடவும்.'
              ),
              action: onNavigateToSubmit,
            },
            {
              step: '02',
              title: tr(
                lang,
                'Triage Queues & District Map',
                'ප්‍රමුඛතා පෝලිම් සහ සිතියම',
                'முன்னுரிமை வரிசைகள் & வரைபடம்'
              ),
              desc: tr(
                lang,
                'Inspect Act Now, Verify Fast, and Watch queues alongside the auto-fitting Leaflet map.',
                'ස්වයංක්‍රීය සිතියම සමඟ ප්‍රමුඛතා පෝලිම් 3 නිරීක්ෂණය කරන්න.',
                'வரைபடத்துடன் 3 முன்னுரிமை வரிசைகளை நிர்வகிக்கவும்.'
              ),
              action: onEnterDashboard,
            },
            {
              step: '03',
              title: tr(
                lang,
                'Case Detail & Noisy-OR Math',
                'සිදුවීම් විස්තරය සහ Noisy-OR',
                'சம்பவ விவரம் & Noisy-OR'
              ),
              desc: tr(
                lang,
                'Review corroborating reports, source weights, Maps Grounding, and coordinator overrides.',
                'තහවුරු වාර්තා, මූලාශ්‍ර බර සහ නිලධාරී තීරණ පරීක්ෂා කරන්න.',
                'உறுதிப்படுத்தும் அறிக்கைகள் மற்றும் அதிகாரி முடிவுகளைக் காண்க.'
              ),
              action: () => onOpenCase('C-001'),
            },
            {
              step: '04',
              title: tr(
                lang,
                'Silence Radar (p < 0.05)',
                'නිහඬතා රේඩාර් (p < 0.05)',
                'மௌன ரேடார் (p < 0.05)'
              ),
              desc: tr(
                lang,
                'Detect cut-off Grama Niladhari divisions with zero reports during heavy rain.',
                'සන්නිවේදනය බිඳවැටුණු ග්‍රාම නිලධාරී වසම් හඳුනා ගන්න.',
                'தொடர்பு துண்டிக்கப்பட்ட கிராம சேவகர் பிரிவுகளைக் கண்டறியவும்.'
              ),
              action: onNavigateToSilenceRadar,
            },
            {
              step: '05',
              title: tr(
                lang,
                'Sourced Situation Summary',
                'මූලාශ්‍ර සහිත තත්ත්ව වාර්තාව',
                'ஆதாரங்களுடன் கூடிய நிலைமை அறிக்கை'
              ),
              desc: tr(
                lang,
                'Generate official SitReps where every claim cites [R-xxx] and isolates uncertainty.',
                '[R-xxx] මූලාශ්‍ර අංක සහිත නිල තත්ත්ව වාර්තා උත්පාදනය කරන්න.',
                '[R-xxx] ஆதாரங்களுடன் கூடிய நிலைமை அறிக்கைகளை உருவாக்கவும்.'
              ),
              action: onNavigateToSummary || onEnterDashboard,
            },
            {
              step: '06',
              title: tr(
                lang,
                'SHA-256 Decision Ledger',
                'SHA-256 තීරණ ලෙජරය',
                'SHA-256 முடிவுப் பதிவேடு'
              ),
              desc: tr(
                lang,
                'Audit the append-only cryptographic hash chain and test live tamper detection.',
                'වෙනස් කළ නොහැකි SHA-256 ආරක්ෂිත දාමය පරීක්ෂා කරන්න.',
                'மாற்றங்களைக் கண்டறியும் SHA-256 சங்கிலியைச் சரிபார்க்கவும்.'
              ),
              action: onNavigateToLedger,
            },
            {
              step: '07',
              title: tr(
                lang,
                'AI Hub, Live Voice & Cloud',
                'AI මධ්‍යස්ථානය, හඬ සහ Cloud',
                'AI மையம், நேரடி குரல் & Cloud'
              ),
              desc: tr(
                lang,
                'Multi-turn AI Assistant, Live Voice session, Search/Maps Grounding & Firestore Sync.',
                'AI සහායක, සජීවී හඬ සංවාද සහ Firestore Cloud සමමුහුර්තකරණය.',
                'AI உதவியாளர், நேரடி குரல் மற்றும் Firestore Cloud ஒத்திசைவு.'
              ),
              action: onNavigateToAIHub || onEnterDashboard,
            },
            {
              step: '08',
              title: tr(
                lang,
                '20-Item Calibration Benchmark',
                'වාර්තා 20ක නිරවද්‍යතා ඇගයීම',
                '20-மாதிரி துல்லிய மதிப்பீடு'
              ),
              desc: tr(
                lang,
                'Run live evaluation across Sinhala, Tamil, English, and Romanized Singlish/Tanglish.',
                'සිංහල, දෙමළ, ඉංග්‍රීසි සහ Singlish වාර්තා 20ක නිරවද්‍යතාවය පරීක්ෂා කරන්න.',
                '20 பன்மொழி மாதிரிகளின் துல்லிய சோதனையை இயக்கவும்.'
              ),
              action: onNavigateToEvaluation || onEnterDashboard,
            },
          ].map((mod) => (
            <button
              key={mod.step}
              type="button"
              onClick={mod.action}
              className="group flex flex-col justify-between rounded-lg border border-slate-200 bg-white p-4 text-left hover:border-[#0B2A6F] transition-colors"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] font-bold text-[#0B2A6F]">
                    MODULE {mod.step}
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-[#0B2A6F] transition-transform group-hover:translate-x-0.5" />
                </div>
                <div className="mt-1 text-xs font-bold text-slate-900 group-hover:text-[#0B2A6F]">
                  {mod.title}
                </div>
                <p className="mt-1 text-[11px] leading-relaxed text-slate-600">
                  {mod.desc}
                </p>
              </div>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
};
