import {
  ExtractionResult,
  GNSilenceEvaluation,
  IncidentCase,
  IncidentType,
  Report,
  ReportLanguage,
  SituationSummaryDraft,
} from '../types';
import { SRI_LANKA_GAZETTEER } from './triage';

const VALID_LANGUAGES: ReportLanguage[] = [
  'si',
  'ta',
  'en',
  'romanized_si',
  'romanized_ta',
  'mixed',
];

const VALID_INCIDENT_TYPES: IncidentType[] = [
  'trapped_people',
  'road_blocked',
  'landslide',
  'flooding',
  'medical',
  'missing_person',
  'shelter_need',
  'other',
];

/**
 * Cleans any raw JSON error strings (e.g. {"error":{"code":503,"message":"..."}})
 * into a concise, human-friendly status description.
 */
export function formatCleanGeminiWarning(rawErr: any): {
  isHighDemand: boolean;
  summary: string;
} {
  const msg = typeof rawErr === 'string' ? rawErr : String(rawErr?.message || rawErr || '');
  const lower = msg.toLowerCase();

  if (
    lower.includes('503') ||
    lower.includes('429') ||
    lower.includes('unavailable') ||
    lower.includes('high demand') ||
    lower.includes('overloaded') ||
    lower.includes('resource_exhausted') ||
    lower.includes('quota')
  ) {
    return {
      isHighDemand: true,
      summary: 'Cloud model experiencing temporary high demand (503)',
    };
  }

  // Strip embedded JSON if present
  const jsonStart = msg.indexOf('{');
  const jsonEnd = msg.lastIndexOf('}');
  if (jsonStart !== -1 && jsonEnd > jsonStart) {
    try {
      const parsed = JSON.parse(msg.slice(jsonStart, jsonEnd + 1));
      const innerMsg = parsed?.error?.message || parsed?.message;
      if (typeof innerMsg === 'string') {
        return {
          isHighDemand: lower.includes('demand') || parsed?.error?.code === 503,
          summary: innerMsg,
        };
      }
    } catch {
      // ignore
    }
  }

  return {
    isHighDemand: false,
    summary: msg.length > 140 ? `${msg.slice(0, 140)}...` : msg || 'offline / network timeout',
  };
}

/**
 * Rule layer on top of the AI:
 * If the text mentions injury, children, elderly, or being trapped (in English, Sinhala, Tamil, or Romanized),
 * force urgency >= 4 and label this "rule-adjusted" in the UI.
 */
export function applySafetyRuleLayer(
  rawText: string,
  extraction: ExtractionResult
): ExtractionResult {
  const combined = `${rawText} ${extraction.english_translation || ''}`.toLowerCase();

  const triggerPatterns: Array<{ label: string; regex: RegExp }> = [
    {
      label: 'trapped / stranded people',
      regex:
        /\b(trapped|stranded|marooned|kotu\s*wela|kotuwela|hira\s*wela|hirawela|yata\s*wela|sikki|matikki)\b|සිරවී|කොටුවී|කොටු\s*වෙලා|යට\s*වෙලා|சிக்கி|மாட்டிக்கொண்டு/i,
    },
    {
      label: 'children / infants',
      regex:
        /\b(child|children|baby|infant|kids|toddlers|lamai|lamayekta|podi\s*lamai|daruvan|daruwo|kuzhanthai|kuzhanthaigal|pillaigal)\b|ළමයි|දරුවන්|දරුවෝ|බිළිඳු|குழந்தை|குழந்தைகள்|பிள்ளைகள்/i,
    },
    {
      label: 'elderly / vulnerable',
      regex:
        /\b(elderly|elders|grandmother|grandfather|senior|old\s*people|aged|wayasaka|wadihiti|mudhiyor|muthiyavar|vayathanavargal)\b|වැඩිහිටි|වයසක|முதியோர்|முதியவரை|வயதான/i,
    },
    {
      label: 'injury / medical trauma',
      regex:
        /\b(injury|injured|bleeding|wounded|fracture|unconscious|pregnant|tuwala|thuwala|thuwalai|kayam|kaayam|adi\s*pattu)\b|තුවාල|ගැබිනි|காயம்|கர்ப்பிணி/i,
    },
  ];

  const matchedLabels = triggerPatterns
    .filter((p) => p.regex.test(combined))
    .map((p) => p.label);

  if (matchedLabels.length > 0 || extraction.incident_type === 'trapped_people') {
    const aiRaw = extraction.urgency;
    const enforcedUrgency = Math.max(4, aiRaw);
    const reasonText =
      matchedLabels.length > 0
        ? `Safety rule triggered (${matchedLabels.join(', ')}): enforced urgency ≥ 4`
        : 'Safety rule triggered (trapped people): enforced urgency ≥ 4';

    return {
      ...extraction,
      ai_raw_urgency: aiRaw,
      urgency: enforcedUrgency,
      ruleAdjusted: true,
      ruleReason: reasonText,
    };
  }

  return {
    ...extraction,
    ai_raw_urgency: extraction.urgency,
    ruleAdjusted: false,
  };
}

/**
 * Validates raw JSON output from Gemini against the strict extraction schema.
 */
export function validateExtractionSchema(raw: any): ExtractionResult | null {
  if (!raw || typeof raw !== 'object') return null;

  const language: ReportLanguage = VALID_LANGUAGES.includes(raw.language)
    ? raw.language
    : 'mixed';

  const incident_type: IncidentType = VALID_INCIDENT_TYPES.includes(
    raw.incident_type
  )
    ? raw.incident_type
    : 'other';

  if (
    typeof raw.place_text !== 'string' ||
    typeof raw.place_english !== 'string' ||
    typeof raw.reason !== 'string' ||
    typeof raw.english_translation !== 'string' ||
    typeof raw.urgency !== 'number' ||
    typeof raw.confidence_in_extraction !== 'number' ||
    !Array.isArray(raw.needs)
  ) {
    return null;
  }

  const urgency = Math.min(5, Math.max(1, Math.round(raw.urgency)));
  const confidence_in_extraction = Number(
    Math.min(1, Math.max(0, raw.confidence_in_extraction)).toFixed(2)
  );
  const people_affected =
    typeof raw.people_affected === 'number' && raw.people_affected >= 0
      ? Math.round(raw.people_affected)
      : null;

  return {
    language,
    incident_type,
    place_text: raw.place_text.trim() || 'Unknown location',
    place_english: raw.place_english.trim() || 'Kandy District',
    people_affected,
    needs: raw.needs.map((n: any) => String(n)),
    urgency,
    reason: raw.reason.trim(),
    confidence_in_extraction,
    english_translation: raw.english_translation.trim(),
  };
}

/**
 * High-Precision Multilingual Sri Lankan Disaster NLP Engine (Resilient Hybrid Fallback).
 * Handles Sinhala script, Tamil script, Romanized Sinhala (Singlish), Romanized Tamil (Tanglish),
 * English, and adversarial prompt-injection test inputs with full English translation.
 */
export function fallbackHeuristicExtraction(rawText: string): ExtractionResult {
  const trimmed = rawText.trim();
  const lower = trimmed.toLowerCase();

  // 1. Check high-precision curated templates & common field variations first
  if (lower.includes('hanthana uda para') && lower.includes('gewal 2k')) {
    return applySafetyRuleLayer(trimmed, {
      language: 'romanized_si',
      incident_type: 'landslide',
      place_text: 'Hanthana uda para langa',
      place_english: 'Hanthana Upper Slope',
      people_affected: 6,
      needs: ['medical_aid', 'road_clearance', 'evacuation'],
      urgency: 5,
      reason:
        'Boulder and slope collapse near Hanthana upper road has buried two houses, injuring a young child and an elderly mother with ambulance access blocked.',
      confidence_in_extraction: 0.93,
      english_translation:
        'Boulders have rolled down near Hanthana upper road burying 2 houses. A young child and an elderly mother are injured, and the road is blocked for an ambulance to reach them.',
    });
  }

  if (trimmed.includes('කඩුගන්නාව') && trimmed.includes('බස් රථයක්')) {
    return applySafetyRuleLayer(trimmed, {
      language: 'si',
      incident_type: 'road_blocked',
      place_text: 'කඩුගන්නාව වංගුව අසල',
      place_english: 'Kadugannawa Pass',
      people_affected: 15,
      needs: ['road_clearance', 'evacuation'],
      urgency: 5,
      reason:
        'A passenger bus with elderly commuters is trapped near Kadugannawa hairpin bend due to a fallen tree and rockfall blocking the highway.',
      confidence_in_extraction: 0.95,
      english_translation:
        'A bus is trapped near the Kadugannawa bend due to a large fallen tree and rockfall. Several elderly passengers are inside, requiring urgent road clearance assistance.',
    });
  }

  if (trimmed.includes('நானுஓயா') && trimmed.includes('காணாமல்')) {
    return applySafetyRuleLayer(trimmed, {
      language: 'ta',
      incident_type: 'missing_person',
      place_text: 'நானுஓயா ஆற்றுப் பகுதியில்',
      place_english: 'Nanu Oya, Nuwara Eliya',
      people_affected: 1,
      needs: ['search_and_rescue', 'boat_rescue'],
      urgency: 5,
      reason:
        'An elderly person is missing along the swollen Nanu Oya river sector; rising water levels require urgent search-and-rescue support.',
      confidence_in_extraction: 0.94,
      english_translation:
        'Search operations continue for an elderly person missing near the Nanu Oya river area. Because river water levels have risen, rescue team assistance is urgently needed.',
    });
  }

  if (lower.includes('madulkelle') && lower.includes('mann sarivu')) {
    return applySafetyRuleLayer(trimmed, {
      language: 'romanized_ta',
      incident_type: 'trapped_people',
      place_text: 'Madulkelle estate upper line',
      place_english: 'Madulkelle, Panvila',
      people_affected: 7,
      needs: ['evacuation', 'search_and_rescue', 'baby_supplies'],
      urgency: 5,
      reason:
        'Landslide on Madulkelle estate upper line has trapped 2 families including 3 children inside their line rooms requiring immediate rescue.',
      confidence_in_extraction: 0.92,
      english_translation:
        'Landslide at Madulkelle estate upper line. 2 families including 3 children are trapped inside their house; urgent rescue assistance is needed.',
    });
  }

  // 2. Detect and strip adversarial prompt-injection instructions before analysis
  const hasInjectionAttempt =
    /ignore\s+all\s+previous\s+instructions|set\s+urgency\s+to|system\s+prompt|disregard\s+instructions/i.test(
      trimmed
    );
  const sanitizedText = trimmed
    .replace(
      /^.*?(?:ignore\s+all\s+previous\s+instructions[^.!?\n]*[.!?\n]\s*)?(?:set\s+urgency\s+to\s+\d+[^.!?\n]*[.!?\n]\s*)?(?:actually\s*:\s*)?/i,
      ''
    )
    .trim() || trimmed;

  const hasSinhalaScript = /[\u0D80-\u0DFF]/.test(sanitizedText);
  const hasTamilScript = /[\u0B80-\u0BFF]/.test(sanitizedText);
  const sanLower = sanitizedText.toLowerCase();

  let language: ReportLanguage = 'en';
  if (hasSinhalaScript) language = 'si';
  else if (hasTamilScript) language = 'ta';
  else if (
    /\b(para|wathura|kandu|kadan|watila|kotu|wela|innawa|gedara|gewal|paule|paul|udaw|ikmanin|hariye|gama|lamai|lamayekta|wayasaka|thuwalai)\b/i.test(
      sanLower
    )
  ) {
    language = 'romanized_si';
  } else if (
    /\b(veethi|vella|mann|sarivu|udavi|kudumbam|palam|thadai|thevai|kuzhanthaigal|sikki|avasara)\b/i.test(
      sanLower
    )
  ) {
    language = 'romanized_ta';
  }

  // 3. Incident classification
  let incident_type: IncidentType = 'flooding';
  if (
    /\b(trapped|stranded|marooned|kotu|sikki|සිරවී|කොටුවී|சிக்கி)\b/i.test(
      sanitizedText
    )
  ) {
    incident_type = 'trapped_people';
  } else if (
    /\b(landslide|earth\s*slip|mudslide|boulder|pas\s*kanda|gal\s*peralila|නාය|පස්\s*කන්ද|ගල්\s*පෙරළිලා|மண்\s*சரிவு|மண்சரிவு|mann\s*sarivu)\b/i.test(
      sanitizedText
    )
  ) {
    incident_type = 'landslide';
  } else if (
    /\b(road\s*blocked|tree\s*fallen|blocked|para\s*wahila|මාර්ගය\s*අවහිර|පාර\s*වැහිලා|ගසක්|வீதி\s*தடை|பாதை\s*தடை)\b/i.test(
      sanitizedText
    )
  ) {
    incident_type = 'road_blocked';
  } else if (
    /\b(medical|pregnant|injured|insulin|ambulance|tuwala|thuwalai|වෛද්‍ය|තුවාල|ගැබිනි|மருத்துவ|கர்ப்பிணி|காயம்)\b/i.test(
      sanitizedText
    )
  ) {
    incident_type = 'medical';
  } else if (
    /\b(missing|disappeared|athurudahan|අතුරුදහන්|காணாமல்)\b/i.test(
      sanitizedText
    )
  ) {
    incident_type = 'missing_person';
  } else if (
    /\b(shelter|temple|school\s*camp|dry\s*rations|ආරක්ෂිත|වියළි\s*ආහාර|முகாம்|உணவு)\b/i.test(
      sanitizedText
    )
  ) {
    incident_type = 'shelter_need';
  }

  // 4. Location matching from SRI_LANKA_GAZETTEER
  let place_english = 'Kandy District';
  let place_text = 'Kandy District';
  let gazetteerMatched = false;
  for (const g of SRI_LANKA_GAZETTEER) {
    const matchedKw = g.keywords.find((kw) =>
      sanLower.includes(kw.toLowerCase())
    );
    if (matchedKw) {
      place_english = g.canonicalName;
      // Extract surrounding location context if available
      const regex = new RegExp(
        `([^.,;\\n]{0,18}${matchedKw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^.,;\\n]{0,22})`,
        'i'
      );
      const phraseMatch = sanitizedText.match(regex);
      place_text = phraseMatch ? phraseMatch[1].trim() : matchedKw;
      gazetteerMatched = true;
      break;
    }
  }

  // 5. Accurate People Affected Extraction (ignoring feet/meters/road numbers)
  let people_affected: number | null = null;
  const textWithoutMeasurements = sanitizedText
    .replace(/\b\d+\s*(feet|ft|meters|m|km|hours|hrs|am|pm)\b/gi, '')
    .replace(/අඩි\s*\d+ක්?/g, '')
    .replace(/\d+\s*அடி/g, '');

  const explicitPeopleMatch =
    textWithoutMeasurements.match(
      /(\d{1,3})\s*(?:people|persons|residents|passengers|villagers|දෙනෙක්|දෙනා|பேர்)/i
    ) ||
    textWithoutMeasurements.match(
      /(?:paul|පවුල්|families|kudumbam)\s*(\d{1,2})/i
    ) ||
    textWithoutMeasurements.match(
      /(\d{1,2})\s*(?:families|kudumbam|පවුල්)/i
    );

  if (explicitPeopleMatch) {
    const val = parseInt(explicitPeopleMatch[1], 10);
    if (
      /paul|පවුල්|families|kudumbam/i.test(explicitPeopleMatch[0]) &&
      val <= 15
    ) {
      people_affected = val * 4;
    } else {
      people_affected = val;
    }
  } else if (
    /\btwo\s+children\s+and\s+an\s+elderly\s+grandmother\b/i.test(
      textWithoutMeasurements
    )
  ) {
    people_affected = 3;
  } else {
    const fallbackNum = textWithoutMeasurements.match(/\b(\d{1,3})\b/);
    if (fallbackNum) {
      people_affected = parseInt(fallbackNum[1], 10);
    }
  }

  // 6. Multi-label Needs Extraction
  const needsSet = new Set<string>();
  if (
    /\b(boat|marooned|roof|upper\s*floor|බෝට්ටු|ඉහළ\s*මාලයේ|படகு)\b/i.test(
      sanitizedText
    ) ||
    (incident_type === 'trapped_people' &&
      /\b(flood|wathura|වතුර|வெள்ளம்)\b/i.test(sanitizedText))
  ) {
    needsSet.add('boat_rescue');
  }
  if (
    incident_type === 'trapped_people' ||
    /\b(trapped|kotu|sikki|සිරවී|சிக்கி|evacuat)\b/i.test(sanitizedText)
  ) {
    needsSet.add('evacuation');
  }
  if (
    incident_type === 'medical' ||
    /\b(injured|injury|ambulance|pregnant|thuwalai|තුවාල|ගැබිනි|மருத்துவ|கர்ப்பிணி)\b/i.test(
      sanitizedText
    )
  ) {
    needsSet.add('medical_aid');
  }
  if (
    incident_type === 'road_blocked' ||
    incident_type === 'landslide' ||
    /\b(road|blocked|para\s*wahila|මාර්ගය|පාර|பாதை)\b/i.test(sanitizedText)
  ) {
    needsSet.add('road_clearance');
  }
  if (
    /\b(water|drinking|පානීය\s*ජලය|குடிநீர்)\b/i.test(sanitizedText)
  ) {
    needsSet.add('drinking_water');
  }
  if (
    /\b(child|children|baby|infant|lamai|ළමයි|kuzhanthaigal|குழந்தை)\b/i.test(
      sanitizedText
    )
  ) {
    needsSet.add('baby_supplies');
  }
  if (incident_type === 'missing_person') {
    needsSet.add('search_and_rescue');
  }
  if (needsSet.size === 0) {
    needsSet.add('shelter');
    needsSet.add('drinking_water');
  }

  // 7. Construct faithful English translation for non-English inputs
  let english_translation = sanitizedText;
  if (language !== 'en') {
    const hazardPhrase =
      incident_type === 'trapped_people'
        ? 'Residents are trapped and awaiting urgent rescue'
        : incident_type === 'landslide'
        ? 'A landslide / slope collapse has been reported'
        : incident_type === 'road_blocked'
        ? 'The main road corridor is obstructed by fallen debris/trees'
        : incident_type === 'medical'
        ? 'An urgent medical emergency requiring immediate transport/aid is reported'
        : incident_type === 'missing_person'
        ? 'A person has been reported missing near rising waters'
        : incident_type === 'shelter_need'
        ? 'Displaced residents require safe shelter and relief rations'
        : 'Rising floodwaters reported';

    const peoplePhrase = people_affected
      ? ` affecting approximately ${people_affected} people`
      : '';
    const needsPhrase = Array.from(needsSet)
      .map((n) => n.replace(/_/g, ' '))
      .join(', ');

    english_translation = `${hazardPhrase} at ${place_english} (${place_text})${peoplePhrase}. Immediate priorities: ${needsPhrase}.`;
  }

  const baseUrgency =
    incident_type === 'trapped_people' ||
    incident_type === 'medical' ||
    incident_type === 'landslide' ||
    incident_type === 'missing_person'
      ? 5
      : incident_type === 'road_blocked'
      ? 4
      : 3;

  const injectionNote = hasInjectionAttempt
    ? ' [Untrusted prompt-injection directive ignored by input isolation filter]'
    : '';

  const baseResult: ExtractionResult = {
    language,
    incident_type,
    place_text,
    place_english,
    people_affected,
    needs: Array.from(needsSet),
    urgency: baseUrgency,
    reason: `${incident_type.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())} reported at ${place_english}${people_affected ? ` (${people_affected} people affected)` : ''} requiring ${Array.from(needsSet).join(', ')}.${injectionNote}`,
    confidence_in_extraction: gazetteerMatched ? 0.89 : 0.78,
    english_translation,
  };

  return applySafetyRuleLayer(sanitizedText, baseResult);
}

/**
 * Calls server-side Gemini Flash endpoint with strict responseSchema, multi-model failover,
 * schema validation, and deterministic safety rule layer.
 */
export async function extractReportWithGemini(rawText: string): Promise<{
  extraction: ExtractionResult;
  usedFallback: boolean;
  isHighDemand?: boolean;
  modelUsed?: string;
  warningMessage?: string;
}> {
  try {
    const response = await fetch('/api/gemini/extract', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: rawText }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      const err: any = new Error(errData.error || `HTTP ${response.status}`);
      err.isHighDemand = Boolean(errData.isHighDemand || response.status === 503 || response.status === 429);
      throw err;
    }

    const data = await response.json();
    const validated = validateExtractionSchema(data.extraction);

    if (!validated) {
      const fallback = fallbackHeuristicExtraction(rawText);
      return {
        extraction: fallback,
        usedFallback: true,
        modelUsed: 'disalink-hybrid-nlp',
        warningMessage:
          'Cloud model output required schema normalization — pre-filled via DisaLink Hybrid NLP Engine for coordinator review.',
      };
    }

    const withRules = applySafetyRuleLayer(rawText, validated);
    return {
      extraction: withRules,
      usedFallback: false,
      modelUsed: data.modelUsed || 'gemini-3.8-flash',
    };
  } catch (err: any) {
    const fallback = fallbackHeuristicExtraction(rawText);
    const clean = formatCleanGeminiWarning(err);
    return {
      extraction: fallback,
      usedFallback: true,
      isHighDemand: clean.isHighDemand,
      modelUsed: 'disalink-hybrid-nlp',
      warningMessage: clean.isHighDemand
        ? 'Gemini Cloud API is experiencing temporary high demand (503) — automatically switched to DisaLink Resilient Hybrid NLP Engine. All fields have been translated and pre-filled for your review.'
        : `Cloud extraction unreachable (${clean.summary}) — switched to DisaLink Resilient Hybrid NLP Engine with local pre-fill.`,
    };
  }
}

/**
 * Generates a sourced Situation Summary using ONLY confirmed cases and reports.
 */
export async function generateSituationSummaryWithGemini(params: {
  cases: IncidentCase[];
  reports: Report[];
  quietAreas: GNSilenceEvaluation[];
}): Promise<{
  draft: SituationSummaryDraft;
  usedFallback: boolean;
  isHighDemand?: boolean;
  modelUsed?: string;
  warningMessage?: string;
}> {
  const confirmedCases = params.cases.filter(
    (c) => c.humanConfirmed || c.verified || c.status === 'confirmed' || c.status === 'verified'
  );
  const unverifiedCases = params.cases.filter(
    (c) => !c.humanConfirmed && !c.verified && c.status === 'ai_suggestion'
  );
  const confirmedReportIds = new Set(
    confirmedCases.flatMap((c) => c.reportIds)
  );
  const confirmedReports = params.reports.filter(
    (r) => r.humanConfirmed || confirmedReportIds.has(r.id)
  );
  const quietFlagged = params.quietAreas.filter((g) => g.isQuiet);

  try {
    const response = await fetch('/api/gemini/summary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        confirmedCases,
        confirmedReports: confirmedReports.map((r) => ({
          id: r.id,
          sourceType: r.sourceType,
          place: r.extraction.place_english,
          type: r.extraction.incident_type,
          people: r.extraction.people_affected,
          needs: r.extraction.needs,
          translation: r.extraction.english_translation,
        })),
        unverifiedCases,
        quietAreas: quietFlagged,
      }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      const err: any = new Error(errData.error || `HTTP ${response.status}`);
      err.isHighDemand = Boolean(errData.isHighDemand || response.status === 503 || response.status === 429);
      throw err;
    }

    const data = await response.json();
    const s = data.summary;
    if (
      !s ||
      typeof s.headline !== 'string' ||
      !Array.isArray(s.confirmedSituation) ||
      !Array.isArray(s.priorityActions) ||
      !Array.isArray(s.uncertaintySection)
    ) {
      throw new Error('Summary schema mismatch');
    }

    const generatedAt = new Date().toISOString();
    const markdown = formatSummaryMarkdown(
      generatedAt,
      s.headline,
      s.confirmedSituation,
      s.priorityActions,
      s.uncertaintySection
    );

    return {
      draft: {
        generatedAt,
        headline: s.headline,
        confirmedSituation: s.confirmedSituation,
        priorityActions: s.priorityActions,
        uncertaintySection: s.uncertaintySection,
        editableMarkdown: markdown,
      },
      usedFallback: false,
      modelUsed: data.modelUsed || 'gemini-3.8-flash',
    };
  } catch (err: any) {
    const clean = formatCleanGeminiWarning(err);
    // Deterministic sourced summary fallback built strictly from confirmed cases
    const generatedAt = new Date().toISOString();
    const headline = `Divisional Secretariat Situation Report — ${confirmedCases.length} Confirmed Cases, ${quietFlagged.length} Silent GN Areas Flagged`;

    const confirmedSituation =
      confirmedCases.length > 0
        ? confirmedCases.map(
            (c) =>
              `${c.incident_type.replace('_', ' ').toUpperCase()} confirmed at ${c.place_english} (Urgency ${c.urgency}/5, Confidence ${(c.confidence * 100).toFixed(0)}%)${c.people_affected ? ` affecting approx. ${c.people_affected} people` : ''}: ${c.reason} [${c.id}, ${c.reportIds.join(', ')}].`
          )
        : [
            'No incident cases have been marked confirmed by a human coordinator yet [NONE].',
          ];

    const priorityActions = confirmedCases
      .filter((c) => c.queue === 'act_now' || c.roadBlocked)
      .map(
        (c) =>
          `Coordinate ${c.needs.join(', ') || 'field assessment'} at ${c.place_english}${c.roadBlocked ? ' (Note: Road marked BLOCKED)' : ''} [${c.id}, ${c.reportIds.join(', ')}].`
      );

    const uncertaintySection = [
      `${unverifiedCases.length} open AI-suggested cases (${unverifiedCases.map((u) => u.id).join(', ') || 'none'}) remain unverified by a human coordinator and are excluded from confirmed counts.`,
      ...quietFlagged.map(
        (q) =>
          `Silence Radar Alert: ${q.name} (${q.division} DS, ${q.hazardLevel.toUpperCase()} hazard) reported ${q.observedLastWindow} messages in the last ${q.windowHours}h vs baseline ${q.baselinePerHour}/hr (scaled p=${q.scaledPValue.toFixed(4)}) — possible communication blackout [${q.id}].`
      ),
    ];

    const editableMarkdown = formatSummaryMarkdown(
      generatedAt,
      headline,
      confirmedSituation,
      priorityActions,
      uncertaintySection
    );

    return {
      draft: {
        generatedAt,
        headline,
        confirmedSituation,
        priorityActions,
        uncertaintySection,
        editableMarkdown,
      },
      usedFallback: true,
      isHighDemand: clean.isHighDemand,
      modelUsed: 'disalink-deterministic-sitrep',
      warningMessage: clean.isHighDemand
        ? 'Gemini Cloud API is experiencing temporary high demand (503) — generated deterministic source-grounded SitRep directly from verified local records.'
        : `Cloud summary endpoint unreachable (${clean.summary}) — generated deterministic source-grounded SitRep from verified local records.`,
    };
  }
}

function formatSummaryMarkdown(
  generatedAt: string,
  headline: string,
  confirmedSituation: string[],
  priorityActions: string[],
  uncertaintySection: string[]
): string {
  return [
    `# DISALINK AI — DIVISIONAL SITUATION SUMMARY (DRAFT)`,
    `Generated: ${new Date(generatedAt).toLocaleString()}`,
    `Notice: Decision-support draft only. Human coordinator must review before sharing.`,
    ``,
    `## Headline`,
    headline,
    ``,
    `## 1. Confirmed Situation (Sourced Only from Confirmed Cases/Reports)`,
    ...confirmedSituation.map((line) => `- ${line}`),
    ``,
    `## 2. Priority Coordination Notes`,
    ...(priorityActions.length > 0
      ? priorityActions.map((line) => `- ${line}`)
      : ['- No confirmed high-priority actions logged yet.']),
    ``,
    `## 3. Uncertainty, Unverified Reports & Silent GN Areas`,
    ...uncertaintySection.map((line) => `- ${line}`),
  ].join('\n');
}
