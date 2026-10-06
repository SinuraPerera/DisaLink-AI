import { GNArea, GNSilenceEvaluation, HazardLevel } from '../types';

/**
 * Computes exact lower-tail Poisson cumulative probability:
 * P(X <= observed) = sum_{k=0}^{observed} (e^-lambda * lambda^k) / k!
 * where lambda = baselinePerHour * windowHours.
 */
export function poissonCumulativeProbability(
  observed: number,
  lambda: number
): number {
  if (lambda <= 0) return 1.0;
  const kMax = Math.max(0, Math.floor(observed));
  let sum = 0;
  let term = Math.exp(-lambda); // k = 0 term
  sum += term;
  for (let k = 1; k <= kMax; k++) {
    term = (term * lambda) / k;
    sum += term;
  }
  return Math.min(1, Math.max(0, sum));
}

/**
 * Hazard scaling factor:
 * During a storm, areas under high or medium hazard are expected to generate at least
 * their storm baseline of reports. Scaling adjusts sensitivity by hazard level:
 * - high hazard: scale factor 0.65 (stricter sensitivity to silence)
 * - medium hazard: scale factor 0.90
 * - low hazard: scale factor 1.50 (never flagged as quiet emergency)
 */
export function getHazardMultiplier(hazard: HazardLevel): number {
  switch (hazard) {
    case 'high':
      return 0.65;
    case 'medium':
      return 0.9;
    case 'low':
    default:
      return 1.5;
  }
}

/**
 * Evaluates a GN area for the Silence Radar:
 * Flag an area as QUIET when the hazard is high or medium AND
 * P(X <= observed) under Poisson(baseline * window) scaled by hazard level is below 0.05.
 */
export function evaluateGNAreaSilence(area: GNArea): GNSilenceEvaluation {
  const expectedLambda = Number(
    (area.baselinePerHour * area.windowHours).toFixed(2)
  );
  const rawPValue = poissonCumulativeProbability(
    area.observedLastWindow,
    expectedLambda
  );
  const hazardMultiplier = getHazardMultiplier(area.hazardLevel);
  const scaledPValue = Number((rawPValue * hazardMultiplier).toFixed(4));

  const isHighOrMediumHazard =
    area.hazardLevel === 'high' || area.hazardLevel === 'medium';
  const isQuiet = isHighOrMediumHazard && scaledPValue < 0.05;

  return {
    ...area,
    expectedLambda,
    rawPValue: Number(rawPValue.toFixed(4)),
    hazardMultiplier,
    scaledPValue,
    isQuiet,
  };
}

export function evaluateAllGNAreas(areas: GNArea[]): GNSilenceEvaluation[] {
  return areas.map(evaluateGNAreaSilence).sort((a, b) => {
    if (a.isQuiet !== b.isQuiet) return a.isQuiet ? -1 : 1;
    return a.scaledPValue - b.scaledPValue;
  });
}
