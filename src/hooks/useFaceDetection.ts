/**
 * useFaceDetection.ts
 * React hook that orchestrates the full drowsiness detection pipeline:
 *
 *   Camera Frame
 *       ↓
 *   detectFace() — MediaPipe landmarks
 *       ↓
 *   extractFeatures() — EAR, MAR, head pose
 *       ↓
 *   updateBaseline() — personalized calibration
 *       ↓
 *   computeTemporalFeatures() — PERCLOS, blink patterns, yawn freq
 *       ↓
 *   computeAlertnessScore() — weighted risk score + EMA smoothing
 *       ↓
 *   Alert escalation (3 levels) with cooldowns and eye-closure timer
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { initializeFaceDetector, detectFace, type FaceDetectionResult } from "@/utils/faceDetection";
import { computeAlertnessScore, resetDrowsinessEngine, type AlertnessResult } from "@/utils/drowsinessEngine";
import { computeTemporalFeatures, type TemporalFrame } from "@/utils/temporalAnalysis";
import { updateBaseline, resetBaseline } from "@/utils/adaptiveBaseline";
import { alertSystem } from "@/utils/alertSystem";
import { loadPreferences } from "@/utils/localStorage";
import { DETECTION_MODES } from "@/types/preferences";

interface UseFaceDetectionProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  isActive: boolean;
  sensitivity: number;
  alertVolume: number;
  detectionMode?: 'standard' | 'sensitive' | 'relaxed';
}

const LEVEL1_MESSAGES = [
  "You may be getting tired. Please stay alert.",
  "Early signs of fatigue detected. Stay focused.",
];
const LEVEL2_MESSAGES = [
  "You appear drowsy. Please consider taking a break.",
  "Drowsiness detected. Pull over if you feel unsafe.",
];
const LEVEL3_MESSAGES = [
  "Critical drowsiness! Please stop the vehicle safely.",
  "Severe drowsiness detected! Pull over immediately.",
];

// Cooldown between alerts per level (ms)
const ALERT_COOLDOWNS = { 1: 10000, 2: 6000, 3: 4000 };

// Minimum continuous eye closure before triggering alert (ms)
const EYE_CLOSURE_ALERT_THRESHOLD_MS = 4000;

export const useFaceDetection = ({
  videoRef,
  isActive,
  sensitivity,
  alertVolume,
  detectionMode = 'standard',
}: UseFaceDetectionProps) => {
  // Resolve threshold multiplier from detection mode
  const thresholdMultiplier = DETECTION_MODES.find(m => m.id === detectionMode)?.thresholdMultiplier ?? 1.0;
  const [isModelLoaded, setIsModelLoaded]       = useState(false);
  const [detectionHistory, setDetectionHistory] = useState<FaceDetectionResult[]>([]);
  const [currentDetection, setCurrentDetection] = useState<FaceDetectionResult | null>(null);
  const [drowsinessCount, setDrowsinessCount]   = useState(0);
  const [alertnessResult, setAlertnessResult]   = useState<AlertnessResult | null>(null);

  const detectionIntervalRef = useRef<number | null>(null);
  const lastAlertTimeRef     = useRef<Record<number, number>>({ 1: 0, 2: 0, 3: 0 });
  const historyRef           = useRef<FaceDetectionResult[]>([]);
  const temporalFramesRef    = useRef<TemporalFrame[]>([]);
  const eyesClosedSinceRef   = useRef<number | null>(null);

  useEffect(() => {
    initializeFaceDetector().then(setIsModelLoaded);
  }, []);

  const runDetection = useCallback(async () => {
    if (!videoRef.current || !isActive || !isModelLoaded) return;

    const result = await detectFace(videoRef.current);
    setCurrentDetection(result);

    // Keep rolling history (last 150 frames ≈ 45 seconds at 300ms interval)
    historyRef.current = [...historyRef.current, result].slice(-150);
    setDetectionHistory([...historyRef.current]);

    if (!result.faceDetected || !result.features) {
      return;
    }

    const features = result.features;

    // --- Adaptive baseline calibration ---
    const baseline = updateBaseline(features);

    // --- Temporal feature pipeline ---
    temporalFramesRef.current = [
      ...temporalFramesRef.current,
      { timestamp: result.timestamp, features },
    ].slice(-600);

    const temporal = computeTemporalFeatures(temporalFramesRef.current);

    // --- Compute alertness score ---
    const alertness = computeAlertnessScore(
      historyRef.current,
      result.ear,
      result.mar,
      result.headPose,
      temporal,
      baseline,
      thresholdMultiplier
    );
    setAlertnessResult(alertness);

    // --- Eye closure duration tracking ---
    const now = Date.now();
    if (result.eyeState.bothEyesClosed) {
      if (eyesClosedSinceRef.current === null) eyesClosedSinceRef.current = now;
    } else {
      eyesClosedSinceRef.current = null;
    }
    const eyesClosedMs = eyesClosedSinceRef.current
      ? now - eyesClosedSinceRef.current : 0;

    // --- Alert gating ---
    const level = alertness.alertLevel;
    if (level === 0) return;

    // Eye-based alerts require sustained closure; yawn/head alerts fire sooner
    const eyeClosureTrigger  = eyesClosedMs >= EYE_CLOSURE_ALERT_THRESHOLD_MS;
    const otherSignalTrigger = alertness.yawning
      || alertness.signals.headPoseScore < 50
      || temporal.perclos10s > 0.20;

    if (!eyeClosureTrigger && !otherSignalTrigger) return;

    // Sensitivity adjustment — higher sensitivity = shorter cooldowns
    const sensitivityFactor = 1 - (sensitivity - 50) / 200; // 0.75–1.25
    const cooldown = ALERT_COOLDOWNS[level as 1 | 2 | 3] * sensitivityFactor;
    if (now - (lastAlertTimeRef.current[level] || 0) < cooldown) return;

    lastAlertTimeRef.current[level] = now;

    if (level === 1) {
      alertSystem.playAlertSound(alertVolume / 100 * 0.4);
      alertSystem.speakAlert(LEVEL1_MESSAGES[drowsinessCount % LEVEL1_MESSAGES.length]);
    } else if (level === 2) {
      alertSystem.vibrateDevice([300, 150, 300]);
      alertSystem.playAlertSound(alertVolume / 100 * 0.7);
      alertSystem.speakAlert(LEVEL2_MESSAGES[drowsinessCount % LEVEL2_MESSAGES.length]);
    } else {
      alertSystem.triggerFullAlert(alertVolume / 100, "high");
      alertSystem.speakAlert(LEVEL3_MESSAGES[drowsinessCount % LEVEL3_MESSAGES.length], true);
    }
    setDrowsinessCount(p => p + 1);

  }, [videoRef, isActive, isModelLoaded, alertVolume, sensitivity, drowsinessCount]);

  useEffect(() => {
    if (isActive && isModelLoaded) {
      detectionIntervalRef.current = window.setInterval(runDetection, 300);
    }
    return () => {
      if (detectionIntervalRef.current) clearInterval(detectionIntervalRef.current);
    };
  }, [isActive, isModelLoaded, runDetection]);

  const resetDetection = useCallback(() => {
    setDetectionHistory([]);
    historyRef.current = [];
    temporalFramesRef.current = [];
    setCurrentDetection(null);
    setDrowsinessCount(0);
    setAlertnessResult(null);
    lastAlertTimeRef.current = { 1: 0, 2: 0, 3: 0 };
    eyesClosedSinceRef.current = null;
    resetDrowsinessEngine();
    resetBaseline();
  }, []);

  return {
    isModelLoaded,
    currentDetection,
    detectionHistory,
    drowsinessCount,
    alertnessResult,
    resetDetection,
  };
};
