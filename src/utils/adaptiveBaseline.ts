/**
 * adaptiveBaseline.ts
 * Personalized adaptive baseline for individual driver calibration.
 *
 * During an initial calibration period (first 30 seconds of a session),
 * the system estimates the driver's normal:
 *   - Eye openness (EAR)
 *   - Blink frequency
 *   - Head position
 *
 * After calibration, drowsiness is detected as deviation from the
 * driver's personal baseline rather than fixed global thresholds.
 *
 * This improves robustness across different users (glasses, lighting, etc.)
 */

import type { ExtractedFeatures } from './featureExtraction';

export interface DriverBaseline {
  isCalibrated: boolean;
  calibrationProgress: number; // 0-100%

  // Personal normal values
  normalEAR: number;
  normalBlinkRate: number;   // blinks per minute
  normalPitch: number;       // resting head pitch

  // Derived thresholds (personalized)
  earClosedThreshold: number;   // normalEAR * 0.6
  earCautionThreshold: number;  // normalEAR * 0.75
  pitchNodThreshold: number;    // normalPitch - 15

  // Calibration sample count
  sampleCount: number;
}

const CALIBRATION_DURATION_MS = 30000; // 30 seconds
const MIN_SAMPLES = 50;

// Default fallback baseline (global averages from literature)
export const DEFAULT_BASELINE: DriverBaseline = {
  isCalibrated: false,
  calibrationProgress: 0,
  normalEAR: 0.28,
  normalBlinkRate: 15,
  normalPitch: 0,
  earClosedThreshold: 0.15,
  earCautionThreshold: 0.20,
  pitchNodThreshold: -15,
  sampleCount: 0,
};

interface CalibrationSample {
  timestamp: number;
  ear: number;
  pitch: number;
}

let calibrationSamples: CalibrationSample[] = [];
let calibrationStartTime: number | null = null;
let currentBaseline: DriverBaseline = { ...DEFAULT_BASELINE };

export const resetBaseline = () => {
  calibrationSamples = [];
  calibrationStartTime = null;
  currentBaseline = { ...DEFAULT_BASELINE };
};

export const getBaseline = (): DriverBaseline => currentBaseline;

/**
 * Feed a new frame into the calibration pipeline.
 * Returns updated baseline (calibrated after enough samples).
 */
export const updateBaseline = (features: ExtractedFeatures): DriverBaseline => {
  const now = Date.now();

  if (calibrationStartTime === null) calibrationStartTime = now;

  const elapsed = now - calibrationStartTime;
  const progress = Math.min(100, Math.round((elapsed / CALIBRATION_DURATION_MS) * 100));

  // Only collect samples when eyes are open (not blinking/closed)
  if (!features.bothEyesClosed && features.avgEAR > 0.15) {
    calibrationSamples.push({ timestamp: now, ear: features.avgEAR, pitch: features.pitch });
  }

  // Keep only samples within calibration window
  calibrationSamples = calibrationSamples.filter(
    s => now - s.timestamp < CALIBRATION_DURATION_MS
  );

  currentBaseline = { ...currentBaseline, calibrationProgress: progress };

  // Calibrate once we have enough samples
  if (calibrationSamples.length >= MIN_SAMPLES && !currentBaseline.isCalibrated) {
    const earValues   = calibrationSamples.map(s => s.ear);
    const pitchValues = calibrationSamples.map(s => s.pitch);

    // Use median for robustness against outliers
    const median = (arr: number[]) => {
      const sorted = [...arr].sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      return sorted.length % 2 === 0
        ? (sorted[mid - 1] + sorted[mid]) / 2
        : sorted[mid];
    };

    const normalEAR   = median(earValues);
    const normalPitch = median(pitchValues);

    currentBaseline = {
      isCalibrated: true,
      calibrationProgress: 100,
      normalEAR,
      normalBlinkRate: 15, // will be updated after more data
      normalPitch,
      // Personalized thresholds derived from individual baseline
      earClosedThreshold:  normalEAR * 0.55,
      earCautionThreshold: normalEAR * 0.72,
      pitchNodThreshold:   normalPitch - 15,
      sampleCount: calibrationSamples.length,
    };

    console.log('✅ Driver baseline calibrated:', {
      normalEAR: normalEAR.toFixed(3),
      normalPitch: normalPitch.toFixed(1),
      earClosedThreshold: currentBaseline.earClosedThreshold.toFixed(3),
    });
  }

  return currentBaseline;
};

/**
 * Compute personalized EAR deviation score (0-100, higher = more closed)
 * Uses personal baseline if calibrated, otherwise uses global defaults.
 */
export const getPersonalizedEARScore = (ear: number, baseline: DriverBaseline): number => {
  const threshold = baseline.earClosedThreshold;
  const normal    = baseline.normalEAR;
  if (ear <= threshold) return 0;   // closed
  if (ear >= normal)    return 100; // fully open
  return Math.round(((ear - threshold) / (normal - threshold)) * 100);
};

/**
 * Compute personalized head pose score (0-100, higher = more normal)
 */
export const getPersonalizedHeadScore = (pitch: number, baseline: DriverBaseline): number => {
  const deviation = Math.abs(pitch - baseline.normalPitch);
  if (deviation > 30) return 0;
  if (deviation < 5)  return 100;
  return Math.round(100 - (deviation / 30) * 100);
};
