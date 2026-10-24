/**
 * temporalAnalysis.ts
 * Temporal feature processing pipeline.
 *
 * Instead of frame-by-frame decisions, this module maintains a rolling
 * window of observations and computes time-based features:
 *   - PERCLOS (Percentage of Eye Closure over time)
 *   - Blink rate and duration
 *   - Yawn frequency
 *   - Head pose deviation over time
 *   - Consecutive abnormal frame count
 *
 * Architecture:
 *   Camera Frames → Feature Extraction → Feature Sequence → Temporal Analysis → Drowsiness Score
 */

import type { ExtractedFeatures } from './featureExtraction';

export interface TemporalFrame {
  timestamp: number;
  features: ExtractedFeatures;
}

export interface TemporalFeatures {
  // PERCLOS — % of time eyes closed in last N seconds (key drowsiness indicator)
  perclos3s: number;   // 0-1, last 3 seconds
  perclos10s: number;  // 0-1, last 10 seconds
  perclos30s: number;  // 0-1, last 30 seconds

  // Blink analysis
  blinkRatePerMin: number;     // blinks per minute
  avgBlinkDuration: number;    // ms — long blinks = fatigue
  slowBlinkRatio: number;      // ratio of blinks > 300ms

  // Yawn analysis
  yawnCountLast5min: number;
  yawnDurationRatio: number;   // fraction of time yawning in last 30s

  // Head pose temporal
  avgPitchDeviation: number;   // mean absolute pitch deviation
  headNodCount: number;        // number of downward head nods in last 60s

  // Consecutive abnormal frames
  consecutiveClosedFrames: number;
  consecutiveAbnormalFrames: number;

  // Temporal drowsiness score (0-100, higher = more drowsy)
  temporalScore: number;
}

// Detect blink transitions in a frame sequence
const detectBlinks = (frames: TemporalFrame[]): { count: number; durations: number[] } => {
  const durations: number[] = [];
  let blinkStart: number | null = null;

  for (const f of frames) {
    if (f.features.bothEyesClosed) {
      if (blinkStart === null) blinkStart = f.timestamp;
    } else {
      if (blinkStart !== null) {
        durations.push(f.timestamp - blinkStart);
        blinkStart = null;
      }
    }
  }
  return { count: durations.length, durations };
};

/**
 * Compute all temporal features from a rolling window of frames.
 * @param frames - recent detection frames (up to last 5 minutes)
 */
export const computeTemporalFeatures = (frames: TemporalFrame[]): TemporalFeatures => {
  const now = Date.now();

  const w3s  = frames.filter(f => now - f.timestamp < 3000);
  const w10s = frames.filter(f => now - f.timestamp < 10000);
  const w30s = frames.filter(f => now - f.timestamp < 30000);
  const w60s = frames.filter(f => now - f.timestamp < 60000);
  const w5m  = frames.filter(f => now - f.timestamp < 300000);

  // --- PERCLOS ---
  const perclos = (window: TemporalFrame[]) =>
    window.length === 0 ? 0 :
    window.filter(f => f.features.bothEyesClosed).length / window.length;

  const perclos3s  = perclos(w3s);
  const perclos10s = perclos(w10s);
  const perclos30s = perclos(w30s);

  // --- Blink analysis ---
  const { count: blinkCount60s, durations: blinkDurations } = detectBlinks(w60s);
  const elapsedMin = Math.min(1, (now - (w60s[0]?.timestamp ?? now)) / 60000);
  const blinkRatePerMin = elapsedMin > 0.05 ? blinkCount60s / elapsedMin : 15;
  const avgBlinkDuration = blinkDurations.length > 0
    ? blinkDurations.reduce((a, b) => a + b, 0) / blinkDurations.length
    : 150;
  const slowBlinkRatio = blinkDurations.length > 0
    ? blinkDurations.filter(d => d > 300).length / blinkDurations.length
    : 0;

  // --- Yawn analysis ---
  const yawnCountLast5min = (() => {
    let count = 0;
    let wasYawning = false;
    for (const f of w5m) {
      if (!wasYawning && f.features.isYawning) count++;
      wasYawning = f.features.isYawning;
    }
    return count;
  })();
  const yawnDurationRatio = w30s.length > 0
    ? w30s.filter(f => f.features.isYawning).length / w30s.length
    : 0;

  // --- Head pose temporal ---
  const avgPitchDeviation = w30s.length > 0
    ? w30s.reduce((s, f) => s + Math.abs(f.features.pitch), 0) / w30s.length
    : 0;

  // Count head nods (pitch goes below -15 then recovers)
  let headNodCount = 0;
  let wasNodding = false;
  for (const f of w60s) {
    const nodding = f.features.pitch < -15;
    if (!wasNodding && nodding) headNodCount++;
    wasNodding = nodding;
  }

  // --- Consecutive abnormal frames ---
  let consecutiveClosedFrames = 0;
  let consecutiveAbnormalFrames = 0;
  for (let i = frames.length - 1; i >= 0; i--) {
    const f = frames[i];
    if (f.features.bothEyesClosed) consecutiveClosedFrames++;
    else break;
  }
  for (let i = frames.length - 1; i >= 0; i--) {
    const f = frames[i];
    const abnormal = f.features.bothEyesClosed || f.features.isYawning || f.features.pitch < -20;
    if (abnormal) consecutiveAbnormalFrames++;
    else break;
  }

  // --- Temporal Drowsiness Score (0-100) ---
  // Weighted combination of temporal signals
  let temporalScore = 0;

  // PERCLOS contribution (40%)
  // PERCLOS > 0.15 is considered drowsy in research literature
  temporalScore += Math.min(40, perclos10s * 200);

  // Blink abnormality (15%)
  const blinkAbnormal = blinkRatePerMin < 8 || blinkRatePerMin > 30 || slowBlinkRatio > 0.3;
  if (blinkAbnormal) temporalScore += 15;
  else temporalScore += slowBlinkRatio * 30;

  // Yawn contribution (15%)
  temporalScore += Math.min(15, yawnCountLast5min * 3 + yawnDurationRatio * 20);

  // Head pose (15%)
  temporalScore += Math.min(15, avgPitchDeviation * 0.5 + headNodCount * 3);

  // Consecutive frames (15%)
  // 10 consecutive closed frames at 300ms interval = 3 seconds
  temporalScore += Math.min(15, consecutiveClosedFrames * 1.5);

  temporalScore = Math.round(Math.min(100, Math.max(0, temporalScore)));

  return {
    perclos3s,
    perclos10s,
    perclos30s,
    blinkRatePerMin,
    avgBlinkDuration,
    slowBlinkRatio,
    yawnCountLast5min,
    yawnDurationRatio,
    avgPitchDeviation,
    headNodCount,
    consecutiveClosedFrames,
    consecutiveAbnormalFrames,
    temporalScore,
  };
};
