/**
 * drowsinessEngine.ts
 * Main drowsiness detection engine — orchestrates the full ML pipeline.
 *
 * Pipeline:
 *   ExtractedFeatures + TemporalFeatures + PersonalizedBaseline
 *       ↓
 *   Weighted Risk Score (0-100)
 *       ↓
 *   Exponential Moving Average smoothing (prevents rapid state flipping)
 *       ↓
 *   Stabilized AlertnessResult
 *
 * Feature weights (configurable):
 *   PERCLOS / eye closure : 40%
 *   Blink abnormalities   : 15%
 *   Yawning               : 15%
 *   Head pose             : 15%
 *   Temporal behavior     : 15%
 */

import type { FaceDetectionResult } from './faceDetection';
import type { TemporalFeatures } from './temporalAnalysis';
import type { DriverBaseline } from './adaptiveBaseline';
import { getPersonalizedEARScore, getPersonalizedHeadScore } from './adaptiveBaseline';

// --- Configurable weights ---
export const FEATURE_WEIGHTS = {
  eyeClosure: 0.40,  // PERCLOS + EAR
  blink:      0.15,
  yawn:       0.15,
  headPose:   0.15,
  temporal:   0.15,
};

// --- Configurable risk thresholds ---
export const RISK_THRESHOLDS = {
  alert:    30,   // 0-30   → Alert/Normal
  warning:  60,   // 31-60  → Warning
  drowsy:   80,   // 61-80  → Drowsy
  critical: 100,  // 81-100 → Critical
};

// EMA smoothing factor — lower = smoother but slower to react
const EMA_ALPHA = 0.25;
let smoothedRiskScore = 0;

export interface DrowsinessSignals {
  earScore: number;
  blinkScore: number;
  eyeClosureScore: number;
  yawnScore: number;
  headPoseScore: number;
  perclos: number;
  temporalScore: number;
}

export interface AlertnessResult {
  // Risk score 0-100 (higher = more drowsy/risky)
  riskScore: number;
  // Alertness score 0-100 (inverse of risk, for UI compatibility)
  score: number;
  status: 'SAFE' | 'CAUTION' | 'DROWSY';
  alertLevel: 0 | 1 | 2 | 3;
  signals: DrowsinessSignals;
  eyeOpenness: number;
  blinkPattern: string;
  headPose: string;
  yawning: boolean;
  // Calibration info
  isCalibrated: boolean;
  calibrationProgress: number;
}

export interface HeadPoseData {
  pitch: number;
  yaw: number;
  roll: number;
}

export const resetDrowsinessEngine = () => {
  smoothedRiskScore = 0;
};

/**
 * Main scoring function.
 * Combines instantaneous features, temporal features, and personalized baseline
 * into a single stabilized risk score.
 */
export const computeAlertnessScore = (
  history: FaceDetectionResult[],
  currentEAR: number,
  currentMAR: number,
  headPose: HeadPoseData | null,
  temporalFeatures?: TemporalFeatures,
  baseline?: DriverBaseline,
  thresholdMultiplier: number = 1.0
): AlertnessResult => {
  const now = Date.now();
  const window3s  = history.filter(d => now - d.timestamp < 3000);
  const window10s = history.filter(d => now - d.timestamp < 10000);
  const window60s = history.filter(d => now - d.timestamp < 60000);

  // --- 1. Eye Closure / PERCLOS Score (40%) ---
  // Use personalized EAR if calibrated, else normalized global
  const earScore = baseline?.isCalibrated
    ? getPersonalizedEARScore(currentEAR, baseline)
    : Math.round(Math.min(1, Math.max(0, (currentEAR - 0.10) / 0.20)) * 100);

  const closedInWindow = window3s.filter(d => d.eyeState.bothEyesClosed).length;
  const closureRatio   = window3s.length > 0 ? closedInWindow / window3s.length : 0;
  const eyeClosureScore = Math.round((1 - closureRatio) * 100);

  // PERCLOS from temporal features or compute inline
  const perclos = temporalFeatures?.perclos10s
    ?? (window10s.length > 0
      ? window10s.filter(d => d.eyeState.bothEyesClosed).length / window10s.length
      : 0);

  // Combined eye score: weighted average of EAR and closure
  const combinedEyeScore = earScore * 0.5 + eyeClosureScore * 0.5;
  // Risk contribution (inverted — lower score = higher risk)
  const eyeRisk = (1 - combinedEyeScore / 100) * 100;

  // --- 2. Blink Score (15%) ---
  let blinks = 0;
  let wasOpen = true;
  for (const d of window60s) {
    if (wasOpen && d.eyeState.bothEyesClosed) blinks++;
    wasOpen = !d.eyeState.bothEyesClosed;
  }
  const elapsed = Math.min(60, (now - (window60s[0]?.timestamp ?? now)) / 1000);
  const blinksPerMin = elapsed > 5 ? (blinks / elapsed) * 60 : 15;

  // Use temporal slow blink ratio if available
  const slowBlinkRatio = temporalFeatures?.slowBlinkRatio ?? 0;
  let blinkRisk = 0;
  if (blinksPerMin < 8)  blinkRisk = 60 + slowBlinkRatio * 40;
  else if (blinksPerMin > 30) blinkRisk = 40;
  else blinkRisk = slowBlinkRatio * 50; // slow blinks = fatigue
  const blinkPattern = blinksPerMin < 8 ? 'Slow' : blinksPerMin > 30 ? 'Rapid' : 'Normal';
  const blinkScore = Math.round(100 - blinkRisk);

  // --- 3. Yawn Score (15%) ---
  const yawnsInWindow = window10s.filter(d => d.eyeState.isYawning).length;
  const yawnRatio     = window10s.length > 0 ? yawnsInWindow / window10s.length : 0;
  const yawnCount     = temporalFeatures?.yawnCountLast5min ?? 0;
  const yawnRisk      = Math.min(100, yawnRatio * 150 + yawnCount * 5);
  const yawnScore     = Math.round(100 - yawnRisk);
  const yawning       = yawnRatio > 0.15 || yawnCount >= 2;

  // --- 4. Head Pose Score (15%) ---
  let headPoseScore = 100;
  let headPoseLabel = 'Normal';
  if (headPose) {
    headPoseScore = baseline?.isCalibrated
      ? getPersonalizedHeadScore(headPose.pitch, baseline)
      : (() => {
          const pitchDev = Math.abs(headPose.pitch);
          const yawDev   = Math.abs(headPose.yaw);
          if (pitchDev > 20 || yawDev > 25)
            return Math.round(Math.max(0, 100 - (pitchDev + yawDev) * 1.5));
          return 100;
        })();

    const nodCount = temporalFeatures?.headNodCount ?? 0;
    if (nodCount > 2) headPoseScore = Math.max(0, headPoseScore - nodCount * 10);

    if (headPose.pitch < -20)      headPoseLabel = 'Nodding';
    else if (headPose.pitch > 20)  headPoseLabel = 'Looking Up';
    else if (Math.abs(headPose.yaw) > 25) headPoseLabel = 'Turned';
  }
  const headRisk = 100 - headPoseScore;

  // --- 5. Temporal Score (15%) ---
  const temporalRisk = temporalFeatures?.temporalScore ?? 0;

  // --- Weighted Risk Score ---
  const rawRisk =
    eyeRisk      * FEATURE_WEIGHTS.eyeClosure +
    blinkRisk    * FEATURE_WEIGHTS.blink +
    yawnRisk     * FEATURE_WEIGHTS.yawn +
    headRisk     * FEATURE_WEIGHTS.headPose +
    temporalRisk * FEATURE_WEIGHTS.temporal;

  // --- EMA Smoothing — prevents rapid state flipping ---
  smoothedRiskScore = EMA_ALPHA * rawRisk + (1 - EMA_ALPHA) * smoothedRiskScore;
  const riskScore = Math.round(Math.min(100, Math.max(0, smoothedRiskScore)));

  // Alertness score is inverse of risk (for UI compatibility)
  const score = 100 - riskScore;

  // --- State classification ---
  // Apply thresholdMultiplier: sensitive (0.7) = lower thresholds = alerts fire earlier
  const scaledAlert   = RISK_THRESHOLDS.alert   * thresholdMultiplier;
  const scaledWarning = RISK_THRESHOLDS.warning  * thresholdMultiplier;
  const scaledDrowsy  = RISK_THRESHOLDS.drowsy   * thresholdMultiplier;

  const status: AlertnessResult['status'] =
    riskScore <= scaledAlert   ? 'SAFE' :
    riskScore <= scaledWarning ? 'CAUTION' : 'DROWSY';

  // --- Alert level ---
  let alertLevel: AlertnessResult['alertLevel'] = 0;
  if      (riskScore > scaledDrowsy)  alertLevel = 3;
  else if (riskScore > scaledWarning) alertLevel = 2;
  else if (riskScore > scaledAlert)   alertLevel = 1;

  // Boost for PERCLOS > 0.15 (research threshold for drowsiness)
  if (perclos > 0.15 && alertLevel < 2)
    alertLevel = Math.max(alertLevel, 1) as AlertnessResult['alertLevel'];
  if (perclos > 0.30 && alertLevel < 3)
    alertLevel = 3;

  return {
    riskScore,
    score,
    status,
    alertLevel,
    signals: {
      earScore,
      blinkScore,
      eyeClosureScore,
      yawnScore,
      headPoseScore,
      perclos: Math.round(perclos * 100),
      temporalScore: temporalRisk,
    },
    eyeOpenness: earScore,
    blinkPattern,
    headPose: headPoseLabel,
    yawning,
    isCalibrated: baseline?.isCalibrated ?? false,
    calibrationProgress: baseline?.calibrationProgress ?? 0,
  };
};

export const getStatusColor = (status: AlertnessResult['status']) => {
  switch (status) {
    case 'SAFE':    return { text: 'text-green-400',  bg: 'bg-green-500',  border: 'border-green-500' };
    case 'CAUTION': return { text: 'text-yellow-400', bg: 'bg-yellow-500', border: 'border-yellow-500' };
    case 'DROWSY':  return { text: 'text-red-400',    bg: 'bg-red-500',    border: 'border-red-500' };
  }
};
