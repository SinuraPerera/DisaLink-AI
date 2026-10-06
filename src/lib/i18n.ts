import { IncidentType, TriageQueue, UILanguage } from '../types';

/**
 * Helper to return the exact string for the active UI language (en | si | ta).
 */
export function tr(
  lang: UILanguage,
  en: string,
  si: string,
  ta: string
): string {
  if (lang === 'si') return si;
  if (lang === 'ta') return ta;
  return en;
}

export interface UIStrings {
  appName: string;
  tagline: string;
  syntheticBanner: string;
  footerNotice: string;
  sections: {
    operations: string;
    intelligence: string;
    coordinatorMode: string;
    coordinatorSub: string;
    cloudSignIn: string;
    sopWorkflow: string;
    closeSop: string;
    sopHeader: string;
    allScreens: string;
  };
  nav: {
    overview: string;
    dashboard: string;
    submit: string;
    caseDetail: string;
    silenceRadar: string;
    aiHub: string;
    ledger: string;
    summary: string;
    evaluation: string;
  };
  queues: {
    act_now: string;
    verify_fast: string;
    watch: string;
    act_now_desc: string;
    verify_fast_desc: string;
    watch_desc: string;
  };
  stats: {
    reportsToday: string;
    openCases: string;
    quietAreas: string;
    ledgerStatus: string;
    intact: string;
    tampered: string;
  };
  status: {
    online: string;
    offline: string;
    simulatedOffline: string;
    simulateOfflineToggle: string;
    resetDemo: string;
    aiSuggestion: string;
    humanConfirmed: string;
    ruleAdjusted: string;
    verified: string;
    roadBlocked: string;
  };
  incidentTypes: Record<IncidentType, string>;
}

export const UI_TRANSLATIONS: Record<UILanguage, UIStrings> = {
  en: {
    appName: 'DisaLink AI',
    tagline: 'Hear every village, even the silent ones.',
    syntheticBanner:
      'Divisional Secretariat Decision-Support System · AI suggests, human coordinators decide. DisaLink AI never dispatches resources.',
    footerNotice: 'AI suggestions only. A human decides.',
    sections: {
      operations: 'Field Operations',
      intelligence: 'Audit & Intelligence',
      coordinatorMode: 'Divisional Coordinator Mode',
      coordinatorSub: 'IndexedDB + Firestore · Gemini 3.1 Pro & Flash',
      cloudSignIn: 'Coordinator Cloud Sign-In',
      sopWorkflow: 'SOP Workflow',
      closeSop: 'Close SOP',
      sopHeader:
        'Divisional Secretariat Standard Operating Procedure (Click any step to navigate)',
      allScreens: 'All Screens',
    },
    nav: {
      overview: 'Overview',
      dashboard: 'Dashboard',
      submit: 'Submit Report',
      caseDetail: 'Case Detail',
      silenceRadar: 'Silence Radar',
      aiHub: 'AI & Cloud Hub',
      ledger: 'Decision Ledger',
      summary: 'Situation Summary',
      evaluation: 'Calibration & Eval',
    },
    queues: {
      act_now: 'Act now',
      verify_fast: 'Verify fast',
      watch: 'Watch',
      act_now_desc: 'Urgency ≥ 4 & Confidence ≥ 0.50',
      verify_fast_desc: 'Urgency ≥ 4 & Confidence < 0.50',
      watch_desc: 'Urgency < 4 (Monitor & Corroborate)',
    },
    stats: {
      reportsToday: 'Reports today',
      openCases: 'Open cases',
      quietAreas: 'Quiet areas',
      ledgerStatus: 'Ledger status',
      intact: 'Chain intact',
      tampered: 'Tamper detected',
    },
    status: {
      online: 'Online',
      offline: 'Offline',
      simulatedOffline: 'Offline Queue Mode',
      simulateOfflineToggle: 'Offline Queue',
      resetDemo: 'Reset Workspace',
      aiSuggestion: 'AI suggestion',
      humanConfirmed: 'Human confirmed',
      ruleAdjusted: 'Rule-adjusted',
      verified: 'Verified',
      roadBlocked: 'Road blocked',
    },
    incidentTypes: {
      trapped_people: 'Trapped People',
      road_blocked: 'Road Blocked',
      landslide: 'Landslide',
      flooding: 'Flooding',
      medical: 'Medical Emergency',
      missing_person: 'Missing Person',
      shelter_need: 'Shelter & Relief Need',
      other: 'Other Incident',
    },
  },
  si: {
    appName: 'DisaLink AI',
    tagline: 'නිහඬ ගම්මාන ඇතුළු සෑම ගමකම හඬට සවන් දෙන්න.',
    syntheticBanner:
      'ප්‍රාදේශීය ලේකම් කාර්යාලයීය තීරණ සහාය පද්ධතිය · AI යෝජනා ඉදිරිපත් කරයි, අවසන් තීරණය නිලධාරියා සතුය. DisaLink AI ස්වයංක්‍රීයව සම්පත් පිටත් නොකරයි.',
    footerNotice: 'AI යෝජනා පමණි. අවසන් තීරණය මිනිස් නිලධාරියෙකු සතුය.',
    sections: {
      operations: 'ක්ෂේත්‍ර මෙහෙයුම්',
      intelligence: 'විගණන සහ බුද්ධි තොරතුරු',
      coordinatorMode: 'ප්‍රාදේශීය සම්බන්ධීකාරක ප්‍රකාරය',
      coordinatorSub: 'IndexedDB + Firestore · Gemini 3.1 Pro සහ Flash',
      cloudSignIn: 'Cloud ගිණුමට පිවිසෙන්න',
      sopWorkflow: 'මෙහෙයුම් පියවර',
      closeSop: 'වසන්න',
      sopHeader:
        'ප්‍රාදේශීය ලේකම් කාර්යාලයීය සම්මත මෙහෙයුම් පටිපාටිය (ඕනෑම පියවරක් තෝරන්න)',
      allScreens: 'සියලුම පිටු',
    },
    nav: {
      overview: 'හැඳින්වීම',
      dashboard: 'ප්‍රධාන පුවරුව',
      submit: 'වාර්තාවක් යොමු කරන්න',
      caseDetail: 'සිදුවීම් විස්තරය',
      silenceRadar: 'නිහඬතා රේඩාර්',
      aiHub: 'AI සහ Cloud මධ්‍යස්ථානය',
      ledger: 'තීරණ ලෙජරය',
      summary: 'තත්ත්ව සාරාංශය',
      evaluation: 'නිරවද්‍යතා ඇගයීම',
    },
    queues: {
      act_now: 'වහාම ක්‍රියාත්මක වන්න',
      verify_fast: 'ඉක්මනින් තහවුරු කරන්න',
      watch: 'විමසිල්ලෙන් සිටින්න',
      act_now_desc: 'හදිසි බව ≥ 4 සහ විශ්වාසනීයත්වය ≥ 0.50',
      verify_fast_desc: 'හදිසි බව ≥ 4 සහ විශ්වාසනීයත්වය < 0.50',
      watch_desc: 'හදිසි බව < 4 (නිරීක්ෂණය සහ තහවුරු කිරීම)',
    },
    stats: {
      reportsToday: 'අද වාර්තා',
      openCases: 'විවෘත සිදුවීම්',
      quietAreas: 'නිහඬ වසම්',
      ledgerStatus: 'ලෙජර තත්ත්වය',
      intact: 'දාමය ආරක්ෂිතයි',
      tampered: 'වෙනස් කිරීමක් හමු විය',
    },
    status: {
      online: 'මාර්ගගතයි',
      offline: 'මාර්ගගත නොවේ',
      simulatedOffline: 'Offline පෝලිම් ප්‍රකාරය',
      simulateOfflineToggle: 'Offline පෝලිම',
      resetDemo: 'යළි පිහිටුවන්න',
      aiSuggestion: 'AI යෝජනාවක්',
      humanConfirmed: 'නිලධාරියා තහවුරු කළ',
      ruleAdjusted: 'නීති මගින් සකසන ලද',
      verified: 'තහවුරු කළ',
      roadBlocked: 'මාර්ගය අවහිරයි',
    },
    incidentTypes: {
      trapped_people: 'සිරවී සිටින පිරිස්',
      road_blocked: 'මාර්ග අවහිරතා',
      landslide: 'නායයෑම්',
      flooding: 'ගංවතුර',
      medical: 'වෛද්‍ය හදිසි අවශ්‍යතා',
      missing_person: 'අතුරුදහන් වූවන්',
      shelter_need: 'ආරක්ෂිත මධ්‍යස්ථාන අවශ්‍යතා',
      other: 'වෙනත් සිදුවීම්',
    },
  },
  ta: {
    appName: 'DisaLink AI',
    tagline: 'மௌனமான கிராமங்கள் உட்பட ஒவ்வொரு கிராமத்தின் குரலையும் கேளுங்கள்.',
    syntheticBanner:
      'பிரதேச செயலக தீர்மான ஆதரவு அமைப்பு · AI பரிந்துரைக்கிறது, மனித அதிகாரியே முடிவெடுப்பார். DisaLink AI தன்னிச்சையாக வளங்களை அனுப்பாது.',
    footerNotice: 'AI பரிந்துரைகள் மட்டுமே. மனித அதிகாரியே முடிவெடுப்பார்.',
    sections: {
      operations: 'களச் செயல்பாடுகள்',
      intelligence: 'தணிக்கை மற்றும் நுண்ணறிவு',
      coordinatorMode: 'பிரதேச ஒருங்கிணைப்பாளர் முறை',
      coordinatorSub: 'IndexedDB + Firestore · Gemini 3.1 Pro & Flash',
      cloudSignIn: 'Cloud உள்நுழைவு',
      sopWorkflow: 'செயல்முறை வழிகாட்டி',
      closeSop: 'மூடு',
      sopHeader:
        'பிரதேச செயலக நிலையான செயல்பாட்டு நடைமுறை (ஏதேனும் ஒரு படியைத் தேர்ந்தெடுக்கவும்)',
      allScreens: 'அனைத்து பக்கங்கள்',
    },
    nav: {
      overview: 'அறிமுகம்',
      dashboard: 'முகப்புப் பலகை',
      submit: 'அறிக்கை சமர்ப்பி',
      caseDetail: 'சம்பவ விவரம்',
      silenceRadar: 'மௌன ரேடார்',
      aiHub: 'AI & Cloud மையம்',
      ledger: 'முடிவுப் பதிவேடு',
      summary: 'நிலைமைச் சுருக்கம்',
      evaluation: 'துல்லிய மதிப்பீடு',
    },
    queues: {
      act_now: 'உடனடி நடவடிக்கை',
      verify_fast: 'விரைந்து சரிபார்',
      watch: 'கண்காணிப்பு',
      act_now_desc: 'அவசரம் ≥ 4 & நம்பகத்தன்மை ≥ 0.50',
      verify_fast_desc: 'அவசரம் ≥ 4 & நம்பகத்தன்மை < 0.50',
      watch_desc: 'அவசரம் < 4 (தொடர் கண்காணிப்பு)',
    },
    stats: {
      reportsToday: 'இன்றைய அறிக்கைகள்',
      openCases: 'திறந்த சம்பவங்கள்',
      quietAreas: 'மௌனமான பிரிவுகள்',
      ledgerStatus: 'பதிவேடு நிலை',
      intact: 'சங்கிலி பாதுகாப்பானது',
      tampered: 'மாற்றம் கண்டறியப்பட்டது',
    },
    status: {
      online: 'இணையத்தில்',
      offline: 'இணையம் இல்லை',
      simulatedOffline: 'Offline வரிசை முறை',
      simulateOfflineToggle: 'Offline வரிசை',
      resetDemo: 'மீட்டமை',
      aiSuggestion: 'AI பரிந்துரை',
      humanConfirmed: 'அதிகாரி உறுதிப்படுத்தியது',
      ruleAdjusted: 'விதியால் மாற்றப்பட்டது',
      verified: 'சரிபார்க்கப்பட்டது',
      roadBlocked: 'வீதி தடைப்பட்டுள்ளது',
    },
    incidentTypes: {
      trapped_people: 'சிக்கியுள்ள மக்கள்',
      road_blocked: 'வீதித் தடை',
      landslide: 'மண்சரிவு',
      flooding: 'வெள்ளம்',
      medical: 'மருத்துவ அவசரம்',
      missing_person: 'காணாமல் போனோர்',
      shelter_need: 'தங்குமிடத் தேவை',
      other: 'ஏனைய சம்பவம்',
    },
  },
};

export function getQueueLabel(queue: TriageQueue, lang: UILanguage): string {
  return UI_TRANSLATIONS[lang].queues[queue];
}

const PLACE_TRANSLATIONS: Record<string, { si: string; ta: string }> = {
  'Gelioya, Gampola Road': {
    si: 'ගෙලිඔය, ගම්පොල පාර',
    ta: 'கெலிஓயா, கம்பளை வீதி',
  },
  Akurana: {
    si: 'අකුරණ නගරය',
    ta: 'அக்குறணை நகரம்',
  },
  'Nawalapitiya Estate Road': {
    si: 'නාවලපිටිය වතු මාර්ගය',
    ta: 'நாவலப்பிட்டி தோட்டப் பாதை',
  },
  'Hanthana Upper Slope': {
    si: 'හන්තාන ඉහළ බෑවුම',
    ta: 'ஹந்தான மேல் சரிவு',
  },
  'Kadugannawa Pass': {
    si: 'කඩුගන්නාව දුර්ගය',
    ta: 'கடுகண்ணாவை கணவாய்',
  },
  'Nanu Oya, Nuwara Eliya': {
    si: 'නානුඔය, නුවරඑළිය',
    ta: 'நானுஓயா, நுவரெலியா',
  },
  'Peradeniya Bridge': {
    si: 'පේරාදෙණිය පාලම',
    ta: 'பேராதனை பாலம்',
  },
  'Katugastota Bazaar': {
    si: 'කටුගස්තොට නගරය',
    ta: 'கடுகஸ்தோட்டை நகரம்',
  },
  'Rattota, Matale': {
    si: 'රත්තොට, මාතලේ',
    ta: 'ரத்தோட்டை, மாத்தளை',
  },
  'Gampola Town': {
    si: 'ගම්පොල නගරය',
    ta: 'கம்பளை நகரம்',
  },
  Gampola: {
    si: 'ගම්පොල',
    ta: 'கம்பளை',
  },
};

export function localizePlace(place: string, lang: UILanguage): string {
  if (lang === 'en') return place;
  const entry = PLACE_TRANSLATIONS[place];
  if (entry) return lang === 'si' ? entry.si : entry.ta;
  return place;
}

const REASON_TRANSLATIONS: Record<string, { si: string; ta: string }> = {
  'Three families with young children are trapped behind an earth slip blocking Gampola Road at Gelioya.': {
    si: 'ගෙලිඔය ගම්පොල පාරේ පස් කන්දක් කඩා වැටී මාර්ගය අවහිර වීමෙන් කුඩා දරුවන් සිටින පවුල් 3ක් සිරවී සිටිති.',
    ta: 'கெலிஓயா கம்பளை வீதியில் மண்சரிவால் வீதி தடைப்பட்டு குழந்தைகளுடன் 3 குடும்பங்கள் சிக்கியுள்ளனர்.',
  },
  'GN officer corroborates major landslide on Gampola Road at Gelioya with three families and children trapped inside homes.': {
    si: 'ගෙලිඔය ගම්පොල පාරේ විශාල නායයෑමක් හේතුවෙන් කුඩා දරුවන් සහිත පවුල් 3ක් නිවාස තුළ සිරවී ඇති බව ග්‍රාම නිලධාරී තහවුරු කරයි.',
    ta: 'கெலிஓயா கம்பளை வீதியில் பாரிய மண்சரிவால் 3 குடும்பங்கள் சிக்கியுள்ளதை கிராம சேவகர் உறுதிப்படுத்துகிறார்.',
  },
  'Eighteen elderly residents are stranded on an upper floor in Akurana town with 4 feet of rising floodwater.': {
    si: 'අකුරණ නගරයේ ජල මට්ටම අඩි 4ක් දක්වා ඉහළ යාමෙන් වැඩිහිටි නිවාසයක 18 දෙනෙකු ඉහළ මාලයේ සිරවී සිටිති.',
    ta: 'அக்குறணை நகரில் 4 அடி வெள்ளப்பெருக்கினால் முதியோர் இல்லத்தின் மேல் மாடியில் 18 முதியவர்கள் சிக்கியுள்ளனர்.',
  },
  'Volunteer team confirms 18 elderly residents stranded by strong flood currents in Akurana requiring boat evacuation.': {
    si: 'අකුරණ සැඩ පහර හමුවේ වැඩිහිටියන් 18 දෙනෙකු සිරවී සිටින බවත් බෝට්ටු මගින් මුදාගැනීම අවශ්‍ය බවත් ස්වේච්ඡා කණ්ඩායම තහවුරු කරයි.',
    ta: 'அக்குறணையில் கடும் வெள்ள நீரோட்டத்தில் சிக்கியுள்ள 18 முதியவர்களை மீட்க படகு தேவை என தன்னார்வலர்கள் உறுதிப்படுத்துகின்றனர்.',
  },
  'A pregnant mother in Nawalapitiya requires immediate medical evacuation while estate access road is blocked by a slip.': {
    si: 'නාවලපිටිය වතු මාර්ගය නායයෑමකින් අවහිර වී ඇති අතර ගැබිනි මවකට කඩිනම් වෛද්‍ය ප්‍රතිකාර සඳහා රෝහල්ගත කිරීම අවශ්‍ය වේ.',
    ta: 'நாவலப்பிட்டி தோட்டப் பாதை மண்சரிவால் தடைப்பட்டுள்ள நிலையில் கர்ப்பிணித் தாய்க்கு உடனடி மருத்துவ உதவி தேவைப்படுகிறது.',
  },
  'Second report in Romanized Tamil confirming pregnant woman needing urgent medical transport behind Nawalapitiya estate road slip.': {
    si: 'නාවලපිටිය වතු මාර්ගයේ නායයෑම නිසා ගැබිනි මවකට හදිසි වෛද්‍ය ප්‍රවාහන පහසුකම් අවශ්‍ය බව දෙවන වාර්තාවෙන්ද තහවුරු වේ.',
    ta: 'நாவலப்பிட்டி தோட்டப் பாதை மண்சரிவில் சிக்கியுள்ள கர்ப்பிணித் தாய்க்கு அவசர மருத்துவ உதவி தேவை என்பதை இரண்டாவது அறிக்கையும் உறுதிப்படுத்துகிறது.',
  },
  'Unverified citizen forward claims rocks fell on a house on Hanthana upper road injuring a child; exact location uncertain.': {
    si: 'හන්තාන ඉහළ පාරේ නිවසක් මතට ගල් පෙරළී දරුවෙකුට තුවාල සිදුවී ඇති බවට තහවුරු නොකළ පණිවිඩයක් ලැබී ඇත; නිශ්චිත ස්ථානය අපැහැදිලිය.',
    ta: 'ஹந்தான மேல் வீதியில் வீட்டின் மீது பாறைகள் உருண்டு விழுந்து குழந்தைக்கு காயம் ஏற்பட்டதாக உறுதிப்படுத்தப்படாத தகவல்; சரியான இடம் தெரியவில்லை.',
  },
  'Single citizen report of tree and rockfall blocking Kadugannawa bend with a bus containing elderly passengers halted.': {
    si: 'කඩුගන්නාව වංගුව අසල ගසක් සහ ගල් කඩා වැටීමෙන් මාර්ගය අවහිර වී වැඩිහිටි මගීන් රැගත් බස් රථයක් සිරවී ඇති බවට වාර්තා වේ.',
    ta: 'கடுகண்ணாவை வளைவில் மரம் மற்றும் பாறைகள் விழுந்து வீதி தடைப்பட்டு முதியவர்கள் பயணித்த பேருந்து சிக்கியுள்ளதாக தகவல்.',
  },
  'Single uncorroborated report of an elderly man missing near rising Nanu Oya river since evening.': {
    si: 'නානුඔය ගංගාවේ ජල මට්ටම ඉහළ යාමත් සමඟ සවස සිට වැඩිහිටි පුද්ගලයෙකු අතුරුදහන් වී ඇති බවට තනි වාර්තාවක් ලැබී ඇත.',
    ta: 'நானுஓயா ஆற்றில் வெள்ளம் அதிகரித்துள்ள நிலையில் மாலை முதல் முதியவர் ஒருவர் காணாமல் போயுள்ளதாக தகவல்.',
  },
  'Mahaweli River overflow near Peradeniya Bridge has submerged one lane of the Kandy-Colombo highway, impeding ambulance transit.': {
    si: 'පේරාදෙණිය පාලම අසල මහවැලි ගඟ පිටාර ගැලීමෙන් මහනුවර-කොළඹ ප්‍රධාන මාර්ගයේ එක් මංතීරුවක් ජලයෙන් යටවී ගිලන් රථ ගමනාගමනයට බාධා එල්ල වී ඇත.',
    ta: 'பேராதனை பாலம் அருகே மகாவலி கங்கை பெருக்கெடுத்ததால் கண்டி-கொழும்பு பிரதான வீதியின் ஒரு வழித்தடம் நீரில் மூழ்கி நோயாளர் காவு வண்டி போக்குவரத்து பாதிக்கப்பட்டுள்ளது.',
  },
  'Floodwater over roadway at Peradeniya Bridge forcing police traffic diversion on Kandy-Colombo road.': {
    si: 'පේරාදෙණිය පාලම අසල මාර්ගය ජලයෙන් යටවීම නිසා පොලීසිය මගින් මහනුවර-කොළඹ රථවාහන විකල්ප මාර්ගවලට යොමු කරයි.',
    ta: 'பேராதனை பாலம் அருகே வெள்ள நீர் வீதியில் பாய்வதால் கண்டி-கொழும்பு வீதியில் பொலிஸார் போக்குவரத்தை மாற்றுப் பாதையில் திருப்புகின்றனர்.',
  },
  'Fifty-two displaced persons at Katugastota temple safety centre require dry rations and bottled drinking water for tonight.': {
    si: 'කටුගස්තොට පන්සලේ ආරක්ෂිත මධ්‍යස්ථානයේ රැඳී සිටින අවතැන් වූ පුද්ගලයින් 52 දෙනෙකු සඳහා අද රාත්‍රියට වියළි ආහාර සහ පානීය ජලය අවශ්‍ය වේ.',
    ta: 'கடுகஸ்தோட்டை விகாரை பாதுகாப்பு முகாமில் தங்கியுள்ள 52 இடம்பெயர்ந்த மக்களுக்கு இன்றிரவு உலர் உணவு மற்றும் குடிநீர் தேவைப்படுகிறது.',
  },
  'Volunteer confirms 52 displaced people at Katugastota temple camp needing drinking water and dry rations.': {
    si: 'කටුගස්තොට පන්සලේ කඳවුරේ සිටින 52 දෙනෙකුට පානීය ජලය සහ වියළි ආහාර අවශ්‍ය බව ස්වේච්ඡා නිලධාරියා තහවුරු කරයි.',
    ta: 'கடுகஸ்தோட்டை விகாரை முகாமில் உள்ள 52 பேருக்கு குடிநீர் மற்றும் உலர் உணவு தேவை என்பதை தன்னார்வலர் உறுதிப்படுத்துகிறார்.',
  },
  'Minor ankle-deep culvert overflow near Rattota Bridge in Matale with slow-moving traffic and no injuries.': {
    si: 'මාතලේ රත්තොට පාලම අසල බෝක්කුවක් පිටාර ගැලීමෙන් මාර්ගයේ සුළු ජල ගැලීමක් පවතින අතර රථවාහන සෙමින් ධාවනය වේ; තුවාලකරුවන් නොමැත.',
    ta: 'மாத்தளை ரத்தோட்டை பாலம் அருகே சிறிய வெள்ளப்பெருக்கு ஏற்பட்டுள்ளது; போக்குவரத்து மெதுவாக நடைபெறுகிறது, காயங்கள் எதுவுமில்லை.',
  },
  'Eight families sheltering at Gampola Zahira College request 30 meal packets until floodwaters recede.': {
    si: 'ගම්පොල සහිරා විද්‍යාලයේ කඳවුරේ රැඳී සිටින පවුල් 8ක් ජලය බැස යන තෙක් අද රාත්‍රිය සඳහා ආහාර පාර්සල් 30ක් ඉල්ලා සිටිති.',
    ta: 'கம்பளை சாஹிரா கல்லூரி முகாமில் தங்கியுள்ள 8 குடும்பங்கள் வெள்ளம் வடியும் வரை இன்றிரவுக்கு 30 உணவுப் பொதிகளைக் கோருகின்றனர்.',
  },
};

export function localizeCaseReason(reason: string, lang: UILanguage): string {
  if (lang === 'en') return reason;
  const entry = REASON_TRANSLATIONS[reason];
  if (entry) return lang === 'si' ? entry.si : entry.ta;
  return reason;
}

const NEED_TRANSLATIONS: Record<string, { si: string; ta: string }> = {
  evacuation: { si: 'ඉවත් කිරීම (Evacuation)', ta: 'வெளியேற்றம்' },
  road_clearance: { si: 'මාර්ග පිරිසිදු කිරීම', ta: 'வீதித் தடை நீக்கம்' },
  baby_supplies: { si: 'ළදරු අවශ්‍යතා', ta: 'குழந்தைப் பொருட்கள்' },
  boat_rescue: { si: 'බෝට්ටු මුදාගැනීම්', ta: 'படகு மீட்பு' },
  drinking_water: { si: 'පානීය ජලය', ta: 'குடிநீர்' },
  medical_aid: { si: 'වෛද්‍ය ආධාර', ta: 'மருத்துவ உதவி' },
  search_and_rescue: { si: 'සෙවීමේ සහ මුදාගැනීමේ මෙහෙයුම්', ta: 'தேடுதல் மற்றும் மீட்பு' },
  dry_rations: { si: 'වියළි ආහාර', ta: 'உலர் உணவு' },
  shelter: { si: 'ආරක්ෂිත නවාතැන්', ta: 'பாதுகாப்பு தங்குமிடம்' },
};

export function localizeNeed(need: string, lang: UILanguage): string {
  if (lang === 'en') return need.replace(/_/g, ' ');
  const key = need.toLowerCase().trim();
  const entry = NEED_TRANSLATIONS[key];
  if (entry) return lang === 'si' ? entry.si : entry.ta;
  return need.replace(/_/g, ' ');
}

export function localizeSourceType(source: string, lang: UILanguage): string {
  if (lang === 'en') return source;
  const s = source.toLowerCase();
  if (s.includes('gn')) {
    return lang === 'si' ? 'ග්‍රාම නිලධාරී' : 'கிராம சேவகர்';
  }
  if (s.includes('agency')) {
    return lang === 'si' ? 'ආයතනික නිලධාරී' : 'நிறுவன அதிகாரி';
  }
  if (s.includes('volunteer')) {
    return lang === 'si' ? 'ස්වේච්ඡා ක්‍රියාකාරී' : 'தன்னார்வலர்';
  }
  if (s.includes('citizen')) {
    return lang === 'si' ? 'පුරවැසි වාර්තාව' : 'பொதுமக்கள்';
  }
  return source;
}

export function localizeChannel(channel: string, lang: UILanguage): string {
  if (lang === 'en') return channel.replace('_', ' ');
  if (channel === 'web_form') {
    return lang === 'si' ? 'වෙබ් පෝරමය' : 'இணைய படிவம்';
  }
  if (channel === 'whatsapp') {
    return 'WhatsApp';
  }
  if (channel === 'sms') {
    return 'SMS';
  }
  return channel;
}

export function localizeHazard(hazard: string, lang: UILanguage): string {
  if (lang === 'en') return hazard.toUpperCase();
  const h = hazard.toLowerCase();
  if (h === 'high') return lang === 'si' ? 'ඉහළ අවදානම්' : 'அதிக அபாயம்';
  if (h === 'medium') return lang === 'si' ? 'මධ්‍යම අවදානම්' : 'நடுத்தர அபாயம்';
  if (h === 'low') return lang === 'si' ? 'අඩු අවදානම්' : 'குறைந்த அபாயம்';
  return hazard;
}

export function localizeLocationSource(loc: string, lang: UILanguage): string {
  if (lang === 'en') return loc;
  if (loc === 'pin') return lang === 'si' ? 'GPS පින් ලක්ෂ්‍යය' : 'GPS பின்';
  if (loc === 'geocoded') return lang === 'si' ? 'සිතියම්ගත කළ' : 'வரைபட இடம்';
  if (loc === 'text') return lang === 'si' ? 'පෙළ සඳහන' : 'உரை குறிப்பு';
  return loc;
}

export function localizeHazardLevel(hazard: string, lang: UILanguage): string {
  return localizeHazard(hazard, lang);
}

const GN_NAME_TRANSLATIONS: Record<string, { si: string; ta: string }> = {
  'Kotmale West (GN-412)': {
    si: 'කොත්මලේ බටහිර (GN-412)',
    ta: 'கொத்மலை மேற்கு (GN-412)',
  },
  'Ududumbara South (GN-218)': {
    si: 'උඩුදුම්බර දකුණ (GN-218)',
    ta: 'உடுதும்பர தெற்கு (GN-218)',
  },
  'Deltota Upper (GN-309)': {
    si: 'ඉහළ දෙල්තොට (GN-309)',
    ta: 'மேல் தெல்தோட்டை (GN-309)',
  },
  'Gelioya Town (GN-104)': {
    si: 'ගෙලිඔය නගරය (GN-104)',
    ta: 'கெலிஓயா நகரம் (GN-104)',
  },
  'Gampola East (GN-112)': {
    si: 'ගම්පොල නැගෙනහිර (GN-112)',
    ta: 'கம்பளை கிழக்கு (GN-112)',
  },
  'Peradeniya Junction (GN-088)': {
    si: 'පේරාදෙණිය හන්දිය (GN-088)',
    ta: 'பேராதனை சந்தி (GN-088)',
  },
  'Hanthana Upper (GN-064)': {
    si: 'ඉහළ හන්තාන (GN-064)',
    ta: 'மேல் ஹந்தானை (GN-064)',
  },
  'Katugastota North (GN-041)': {
    si: 'කටුගස්තොට උතුර (GN-041)',
    ta: 'கடுகஸ்தோட்டை வடக்கு (GN-041)',
  },
  'Nawalapitiya Central (GN-190)': {
    si: 'නාවලපිටිය මධ්‍යම (GN-190)',
    ta: 'நாவலப்பிட்டி மத்தி (GN-190)',
  },
  'Kadugannawa Pass (GN-073)': {
    si: 'කඩුගන්නාව දුර්ගය (GN-073)',
    ta: 'கடுகண்ணாவை கணவாய் (GN-073)',
  },
  'Akurana South (GN-052)': {
    si: 'අකුරණ දකුණ (GN-052)',
    ta: 'அக்குறணை தெற்கு (GN-052)',
  },
  'Kundasale East (GN-130)': {
    si: 'කුණ්ඩසාලේ නැගෙනහිර (GN-130)',
    ta: 'குண்டசாலை கிழக்கு (GN-130)',
  },
};

export function localizeGNName(name: string, lang: UILanguage): string {
  if (lang === 'en') return name;
  const entry = GN_NAME_TRANSLATIONS[name];
  if (entry) return lang === 'si' ? entry.si : entry.ta;
  return localizePlace(name, lang);
}

const DIVISION_TRANSLATIONS: Record<string, { si: string; ta: string }> = {
  'Kotmale DS': { si: 'කොත්මලේ ප්‍රා.ලේ.', ta: 'கொத்மலை பிரதேச செயலகம்' },
  'Ududumbara DS': { si: 'උඩුදුම්බර ප්‍රා.ලේ.', ta: 'உடுதும்பர பிரதேச செயலகம்' },
  'Deltota DS': { si: 'දෙල්තොට ප්‍රා.ලේ.', ta: 'தெல்தோட்டை பிரதேச செயலகம்' },
  'Udunuwara DS': { si: 'උඩුනුවර ප්‍රා.ලේ.', ta: 'உடுநுவர பிரதேச செயலகம்' },
  'Udapalatha DS': { si: 'උඩපළාත ප්‍රා.ලේ.', ta: 'உடப்பளாத பிரதேச செயலகம்' },
  'Gangawata Korale DS': {
    si: 'ගඟවට කෝරළේ ප්‍රා.ලේ.',
    ta: 'கங்கவட்ட கோரளை பிரதேச செயலகம்',
  },
  'Harispattuwa DS': {
    si: 'හාරිස්පත්තුව ප්‍රා.ලේ.',
    ta: 'ஹாரிஸ்பத்துவ பிரதேச செயலகம்',
  },
  'Pasbage Korale DS': {
    si: 'පස්බාගේ කෝරළේ ප්‍රා.ලේ.',
    ta: 'பஸ்பாகே கோரளை பிரதேச செயலகம்',
  },
  'Yatinuwara DS': { si: 'යටිනුවර ප්‍රා.ලේ.', ta: 'யட்டிநுவர பிரதேச செயலகம்' },
  'Akurana DS': { si: 'අකුරණ ප්‍රා.ලේ.', ta: 'அக்குறணை பிரதேச செயலகம்' },
  'Kundasale DS': { si: 'කුණ්ඩසාලේ ප්‍රා.ලේ.', ta: 'குண்டசாலை பிரதேச செயலகம்' },
  Kandy: { si: 'මහනුවර', ta: 'கண்டி' },
  'Nuwara Eliya': { si: 'නුවරඑළිය', ta: 'நுவரெலியா' },
  Matale: { si: 'මාතලේ', ta: 'மாத்தளை' },
};

export function localizeDivision(division: string, lang: UILanguage): string {
  if (lang === 'en') return division;
  const entry = DIVISION_TRANSLATIONS[division];
  if (entry) return lang === 'si' ? entry.si : entry.ta;
  return division;
}

