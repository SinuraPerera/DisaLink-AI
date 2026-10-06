import {
  CorroborationTerm,
  IncidentCase,
  Report,
  SourceType,
  TriageQueue,
} from '../types';

/**
 * Comprehensive Sri Lanka Places & All 25 Districts Gazetteer for offline/instant geocoding
 */
export const SRI_LANKA_GAZETTEER: Array<{
  keywords: string[];
  canonicalName: string;
  lat: number;
  lng: number;
}> = [
  {
    keywords: ['gelioya', 'gampola road', 'gampola para', 'ගෙලිඔය', 'கெலிஓயா'],
    canonicalName: 'Gelioya, Gampola Road',
    lat: 7.2134,
    lng: 80.5942,
  },
  {
    keywords: ['akurana', 'අකුරණ', 'அக்குறணை'],
    canonicalName: 'Akurana',
    lat: 7.3652,
    lng: 80.6178,
  },
  {
    keywords: ['peradeniya', 'පේරාදෙණිය', 'பேராதனை'],
    canonicalName: 'Peradeniya Bridge',
    lat: 7.2698,
    lng: 80.5938,
  },
  {
    keywords: ['nawalapitiya', 'නාවලපිටිය', 'நாவலப்பிட்டி'],
    canonicalName: 'Nawalapitiya Estate Road',
    lat: 7.0568,
    lng: 80.5339,
  },
  {
    keywords: ['rattota', 'රත්තොට', 'இறத்தோட்டை'],
    canonicalName: 'Rattota, Matale',
    lat: 7.5214,
    lng: 80.6845,
  },
  {
    keywords: ['hanthana', 'හන්තාන', 'ஹந்தானை'],
    canonicalName: 'Hanthana Upper Slope',
    lat: 7.2589,
    lng: 80.6295,
  },
  {
    keywords: ['katugastota', 'කටුගස්තොට', 'கடுகஸ்தோட்டை'],
    canonicalName: 'Katugastota Bazaar',
    lat: 7.3264,
    lng: 80.6231,
  },
  {
    keywords: ['nanu oya', 'nanuoya', 'නානුඔය', 'நானுஓயா'],
    canonicalName: 'Nanu Oya, Nuwara Eliya',
    lat: 6.9428,
    lng: 80.7429,
  },
  {
    keywords: ['kadugannawa', 'කඩුගන්නාව', 'கடுகண்ணாவை'],
    canonicalName: 'Kadugannawa Pass',
    lat: 7.2547,
    lng: 80.5256,
  },
  {
    keywords: ['madulkelle', 'මඩොල්කැලේ', 'மடவளை'],
    canonicalName: 'Madulkelle, Panvila',
    lat: 7.3941,
    lng: 80.7318,
  },
  {
    keywords: ['ududumbara', 'උඩුදුම්බර', 'உடுதும்பரை'],
    canonicalName: 'Ududumbara',
    lat: 7.3195,
    lng: 80.8764,
  },
  {
    keywords: ['gampola', 'ගම්පොල', 'கம்பளை'],
    canonicalName: 'Gampola Town',
    lat: 7.1644,
    lng: 80.5767,
  },
  {
    keywords: ['talawakele', 'තලවාකැලේ', 'தலவாக்கலை'],
    canonicalName: 'Talawakele',
    lat: 6.9372,
    lng: 80.6581,
  },
  {
    keywords: ['passara', 'පස්සර', 'பசறை'],
    canonicalName: 'Passara, Badulla',
    lat: 6.9355,
    lng: 81.1483,
  },
  {
    keywords: ['haldummulla', 'හල්දුම්මුල්ල', 'ஹல்துமுல்ல'],
    canonicalName: 'Haldummulla, Badulla',
    lat: 6.7628,
    lng: 80.8886,
  },
  {
    keywords: ['aranayake', 'අරණායක', 'அரநாயக்க'],
    canonicalName: 'Aranayake, Kegalle',
    lat: 7.1524,
    lng: 80.4612,
  },
  {
    keywords: ['bulathkohupitiya', 'බුලත්කොහුපිටිය', 'புலத்கொஹுபிட்டிய'],
    canonicalName: 'Bulathkohupitiya, Kegalle',
    lat: 7.1028,
    lng: 80.3358,
  },
  // All 25 Administrative Districts of Sri Lanka
  {
    keywords: ['kandy', 'මහනුවර', 'கண்டி'],
    canonicalName: 'Kandy District',
    lat: 7.2906,
    lng: 80.6337,
  },
  {
    keywords: ['ukwatta', 'matale', 'මාතලේ', 'மாத்தளை'],
    canonicalName: 'Matale District',
    lat: 7.4675,
    lng: 80.6234,
  },
  {
    keywords: ['nuwara eliya', 'nuwaraeliya', 'නුවරඑළිය', 'நுவரெலியா'],
    canonicalName: 'Nuwara Eliya District',
    lat: 6.9497,
    lng: 80.7891,
  },
  {
    keywords: ['badulla', 'බදුල්ල', 'பதுளை'],
    canonicalName: 'Badulla District',
    lat: 6.9934,
    lng: 81.055,
  },
  {
    keywords: ['monaragala', 'මොණරාගල', 'மொணராகலை'],
    canonicalName: 'Monaragala District',
    lat: 6.8728,
    lng: 81.3507,
  },
  {
    keywords: ['ratnapura', 'රත්නපුර', 'இரத்தினபுரி'],
    canonicalName: 'Ratnapura District',
    lat: 6.6828,
    lng: 80.3992,
  },
  {
    keywords: ['kegalle', 'කෑගල්ල', 'கேகாலை'],
    canonicalName: 'Kegalle District',
    lat: 7.2513,
    lng: 80.3464,
  },
  {
    keywords: ['colombo', 'කොළඹ', 'கொழும்பு'],
    canonicalName: 'Colombo District',
    lat: 6.9271,
    lng: 79.8612,
  },
  {
    keywords: ['gampaha', 'ගම්පහ', 'கம்பஹா'],
    canonicalName: 'Gampaha District',
    lat: 7.084,
    lng: 80.0098,
  },
  {
    keywords: ['kalutara', 'කළුතර', 'களுத்துறை'],
    canonicalName: 'Kalutara District',
    lat: 6.5854,
    lng: 79.9607,
  },
  {
    keywords: ['galle', 'ගාල්ල', 'காலி'],
    canonicalName: 'Galle District',
    lat: 6.0535,
    lng: 80.221,
  },
  {
    keywords: ['matara', 'මාතර', 'மாத்தறை'],
    canonicalName: 'Matara District',
    lat: 5.9549,
    lng: 80.555,
  },
  {
    keywords: ['hambantota', 'හම්බන්තොට', 'அம்பாந்தோட்டை'],
    canonicalName: 'Hambantota District',
    lat: 6.1429,
    lng: 81.1212,
  },
  {
    keywords: ['kurunegala', 'කුරුණෑගල', 'குருநாகல்'],
    canonicalName: 'Kurunegala District',
    lat: 7.4818,
    lng: 80.3609,
  },
  {
    keywords: ['puttalam', 'පුත්තලම', 'புத்தளம்'],
    canonicalName: 'Puttalam District',
    lat: 8.0362,
    lng: 79.8283,
  },
  {
    keywords: ['anuradhapura', 'අනුරාධපුර', 'அனுராதபுரம்'],
    canonicalName: 'Anuradhapura District',
    lat: 8.3114,
    lng: 80.4037,
  },
  {
    keywords: ['polonnaruwa', 'පොළොන්නරුව', 'பொலன்னறுவை'],
    canonicalName: 'Polonnaruwa District',
    lat: 7.9403,
    lng: 81.0188,
  },
  {
    keywords: ['ampara', 'අම්පාර', 'அம்பாறை'],
    canonicalName: 'Ampara District',
    lat: 7.2975,
    lng: 81.682,
  },
  {
    keywords: ['batticaloa', 'මඩකලපුව', 'மட்டக்களப்பு'],
    canonicalName: 'Batticaloa District',
    lat: 7.731,
    lng: 81.6747,
  },
  {
    keywords: ['trincomalee', 'ත්‍රිකුණාමලය', 'திருகோணமலை'],
    canonicalName: 'Trincomalee District',
    lat: 8.5874,
    lng: 81.2152,
  },
  {
    keywords: ['jaffna', 'යාපනය', 'யாழ்ப்பாணம்'],
    canonicalName: 'Jaffna District',
    lat: 9.6615,
    lng: 80.0255,
  },
  {
    keywords: ['kilinochchi', 'කිලිනොච්චි', 'கிளிநொச்சி'],
    canonicalName: 'Kilinochchi District',
    lat: 9.3803,
    lng: 80.377,
  },
  {
    keywords: ['mannar', 'මන්නාරම', 'மன்னார்'],
    canonicalName: 'Mannar District',
    lat: 8.981,
    lng: 79.9044,
  },
  {
    keywords: ['mullaitivu', 'මුලතිව්', 'முல்லைத்தீவு'],
    canonicalName: 'Mullaitivu District',
    lat: 9.2671,
    lng: 80.8142,
  },
  {
    keywords: ['vavuniya', 'වවුනියාව', 'வவுனியா'],
    canonicalName: 'Vavuniya District',
    lat: 8.7542,
    lng: 80.4982,
  },
];

export function geocodeSriLankaPlace(
  placeEnglish: string,
  placeText: string
): { lat: number; lng: number; matched: boolean } {
  const combined = `${placeEnglish} ${placeText}`.toLowerCase();
  for (const entry of SRI_LANKA_GAZETTEER) {
    if (entry.keywords.some((kw) => combined.includes(kw.toLowerCase()))) {
      return { lat: entry.lat, lng: entry.lng, matched: true };
    }
  }
  // Fallback near Kandy district center with deterministic small offset from string hash
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    hash = (hash * 31 + combined.charCodeAt(i)) % 1000;
  }
  const dLat = ((hash % 40) - 20) * 0.002;
  const dLng = ((Math.floor(hash / 40) % 40) - 20) * 0.002;
  return {
    lat: Number((7.2906 + dLat).toFixed(4)),
    lng: Number((80.6337 + dLng).toFixed(4)),
    matched: false,
  };
}

/**
 * Haversine distance in meters between two coordinates.
 */
export function haversineDistanceMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371000; // Earth radius in meters
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Normalizes place strings and checks fuzzy match (token overlap or substring)
 */
export function isSamePlaceFuzzy(placeA: string, placeB: string): boolean {
  const clean = (s: string) =>
    s
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 2 && !['road', 'street', 'near', 'area', 'town', 'bridge', 'estate', 'junction', 'para'].includes(w));

  const tokensA = clean(placeA);
  const tokensB = clean(placeB);
  if (tokensA.length === 0 || tokensB.length === 0) {
    return placeA.trim().toLowerCase() === placeB.trim().toLowerCase();
  }
  return tokensA.some((tA) =>
    tokensB.some((tB) => tA === tB || tA.includes(tB) || tB.includes(tA))
  );
}

/**
 * Source weights for Noisy-OR confidence:
 * GN officer 0.6, Agency 0.6, Volunteer 0.4, Citizen 0.25
 * +0.1 if a pin was given, +0.1 if a photo was given.
 * Cap each w_i at 0.9.
 */
export function getBaseSourceWeight(sourceType: SourceType): number {
  switch (sourceType) {
    case 'GN officer':
      return 0.6;
    case 'Agency':
      return 0.6;
    case 'Volunteer':
      return 0.4;
    case 'Citizen':
    default:
      return 0.25;
  }
}

export function computeReportWeightTerm(report: Report): CorroborationTerm {
  const baseWeight = getBaseSourceWeight(report.sourceType);
  const pinBonus = report.hasPin ? 0.1 : 0;
  const photoBonus = report.hasPhoto ? 0.1 : 0;
  const totalWeight = Math.min(0.9, Number((baseWeight + pinBonus + photoBonus).toFixed(2)));
  return {
    reportId: report.id,
    sourceType: report.sourceType,
    baseWeight,
    pinBonus,
    photoBonus,
    totalWeight,
  };
}

/**
 * Noisy-OR formula: Confidence = 1 - product(1 - w_i)
 */
export function computeNoisyOrConfidence(reports: Report[]): {
  confidence: number;
  terms: CorroborationTerm[];
  productComplement: number;
} {
  if (reports.length === 0) {
    return { confidence: 0, terms: [], productComplement: 1 };
  }
  const terms = reports.map(computeReportWeightTerm);
  const productComplement = terms.reduce(
    (acc, term) => acc * (1 - term.totalWeight),
    1
  );
  const confidence = Number((1 - productComplement).toFixed(3));
  return {
    confidence,
    terms,
    productComplement: Number(productComplement.toFixed(4)),
  };
}

/**
 * Queue rule:
 * - Act now if urgency >= 4 and confidence >= 0.5
 * - Verify fast if urgency >= 4 and confidence < 0.5
 * - Otherwise Watch
 */
export function assignTriageQueue(
  urgency: number,
  confidence: number
): TriageQueue {
  if (urgency >= 4 && confidence >= 0.5) {
    return 'act_now';
  }
  if (urgency >= 4 && confidence < 0.5) {
    return 'verify_fast';
  }
  return 'watch';
}

/**
 * Finds an existing case to merge into:
 * - same incident_type
 * - within 500 m (Haversine) OR the same place_english (fuzzy match)
 * - within 3 hours
 */
export function findMatchingCase(
  newReport: Report,
  existingCases: IncidentCase[]
): IncidentCase | null {
  const reportTime = new Date(newReport.timestamp).getTime();
  const THREE_HOURS_MS = 3 * 60 * 60 * 1000;

  for (const c of existingCases) {
    if (c.incident_type !== newReport.extraction.incident_type) {
      continue;
    }

    const caseTime = new Date(c.updatedAt).getTime();
    if (Math.abs(reportTime - caseTime) > THREE_HOURS_MS) {
      continue;
    }

    const samePlace = isSamePlaceFuzzy(
      newReport.extraction.place_english,
      c.place_english
    );

    let within500m = false;
    if (newReport.lat !== null && newReport.lng !== null) {
      const dist = haversineDistanceMeters(
        newReport.lat,
        newReport.lng,
        c.lat,
        c.lng
      );
      within500m = dist <= 500;
    }

    if (samePlace || within500m) {
      return c;
    }
  }

  return null;
}

/**
 * Recomputes an IncidentCase from its constituent reports while preserving human overrides
 */
export function buildOrUpdateCaseFromReports(
  caseId: string,
  reports: Report[],
  existingCase?: IncidentCase
): IncidentCase {
  const sorted = [...reports].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
  const first = sorted[0];
  const latest = sorted[sorted.length - 1];

  const { confidence } = computeNoisyOrConfidence(sorted);

  // Max urgency across reports unless human edited priority
  const maxReportUrgency = Math.max(...sorted.map((r) => r.extraction.urgency));
  const urgency =
    existingCase?.humanConfirmed && existingCase.urgency
      ? existingCase.urgency
      : maxReportUrgency;

  const ruleAdjusted = sorted.some((r) => Boolean(r.extraction.ruleAdjusted));
  const ruleReasons = sorted
    .map((r) => r.extraction.ruleReason)
    .filter(Boolean);

  // Choose best location source: pin > geocoded > text
  const pinReport = sorted.find((r) => r.locationSource === 'pin' && r.lat !== null && r.lng !== null);
  const geoReport = sorted.find((r) => r.lat !== null && r.lng !== null);

  let lat = existingCase?.lat ?? 7.2906;
  let lng = existingCase?.lng ?? 80.6337;
  let locationSource = existingCase?.locationSource ?? first.locationSource;

  if (pinReport && pinReport.lat !== null && pinReport.lng !== null) {
    lat = pinReport.lat;
    lng = pinReport.lng;
    locationSource = 'pin';
  } else if (geoReport && geoReport.lat !== null && geoReport.lng !== null) {
    lat = geoReport.lat;
    lng = geoReport.lng;
    locationSource = geoReport.locationSource;
  } else {
    const geocoded = geocodeSriLankaPlace(
      first.extraction.place_english,
      first.extraction.place_text
    );
    lat = geocoded.lat;
    lng = geocoded.lng;
    locationSource = geocoded.matched ? 'geocoded' : 'text';
  }

  const allNeeds = Array.from(
    new Set(sorted.flatMap((r) => r.extraction.needs))
  );

  const peopleCounts = sorted
    .map((r) => r.extraction.people_affected)
    .filter((n): n is number => typeof n === 'number' && n > 0);
  const people_affected =
    peopleCounts.length > 0 ? Math.max(...peopleCounts) : null;

  const languages = Array.from(
    new Set(sorted.map((r) => r.extraction.language))
  );

  const queue = assignTriageQueue(urgency, confidence);

  // Choose highest urgency report's reason
  const highestUrgencyReport =
    sorted.find((r) => r.extraction.urgency === maxReportUrgency) || latest;

  return {
    id: caseId,
    incident_type: first.extraction.incident_type,
    place_english: existingCase?.place_english || first.extraction.place_english,
    place_text: existingCase?.place_text || first.extraction.place_text,
    lat,
    lng,
    locationSource,
    urgency,
    ruleAdjusted,
    ruleReason: ruleReasons[0],
    confidence,
    queue,
    reason: existingCase?.reason || highestUrgencyReport.extraction.reason,
    needs: allNeeds,
    people_affected,
    reportIds: sorted.map((r) => r.id),
    languages,
    createdAt: existingCase?.createdAt || first.timestamp,
    updatedAt: latest.timestamp,
    status: existingCase?.status || 'ai_suggestion',
    roadBlocked:
      existingCase?.roadBlocked ??
      first.extraction.incident_type === 'road_blocked',
    verified: existingCase?.verified ?? false,
    humanConfirmed: existingCase?.humanConfirmed ?? false,
  };
}
