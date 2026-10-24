/**
 * faceDetection.ts
 * MediaPipe Face Landmarker initialization and per-frame detection.
 * Feature extraction is delegated to featureExtraction.ts.
 */

import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";
import { extractFeatures } from "./featureExtraction";

export interface EyeState {
  leftEyeClosed: boolean;
  rightEyeClosed: boolean;
  bothEyesClosed: boolean;
  confidence: number;
  isYawning: boolean;
}

export interface HeadPose {
  pitch: number;
  yaw: number;
  roll: number;
}

export interface FaceDetectionResult {
  faceDetected: boolean;
  eyeState: EyeState;
  timestamp: number;
  ear: number;
  mar: number;
  headPose: HeadPose | null;
  features: import('./featureExtraction').ExtractedFeatures | null;
}

let faceLandmarker: FaceLandmarker | null = null;

export const initializeFaceDetector = async (): Promise<boolean> => {
  try {
    console.log("Initializing MediaPipe Face Landmarker...");
    const vision = await FilesetResolver.forVisionTasks("/mediapipe/wasm");
    faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: "/mediapipe/face_landmarker.task",
        delegate: "CPU",
      },
      runningMode: "VIDEO",
      numFaces: 1,
      minFaceDetectionConfidence: 0.5,
      minFacePresenceConfidence: 0.5,
      minTrackingConfidence: 0.5,
      outputFaceBlendshapes: true,
      outputFacialTransformationMatrixes: false,
    });
    console.log("✓ MediaPipe Face Landmarker initialized");
    return true;
  } catch (error) {
    console.error("Error initializing face detector:", error);
    return false;
  }
};

export const detectFace = async (
  videoElement: HTMLVideoElement
): Promise<FaceDetectionResult> => {
  try {
    if (!faceLandmarker) return createEmptyResult();
    if (videoElement.videoWidth === 0 || videoElement.videoHeight === 0)
      return createEmptyResult();

    const results = faceLandmarker.detectForVideo(videoElement, performance.now());

    if (!results.faceLandmarks || results.faceLandmarks.length === 0)
      return createEmptyResult();

    const f = extractFeatures(results.faceLandmarks[0]);

    return {
      faceDetected: true,
      eyeState: {
        leftEyeClosed:  f.leftEyeClosed,
        rightEyeClosed: f.rightEyeClosed,
        bothEyesClosed: f.bothEyesClosed,
        confidence: f.confidence,
        isYawning: f.isYawning,
      },
      timestamp: Date.now(),
      ear: f.avgEAR,
      mar: f.mar,
      headPose: { pitch: f.pitch, yaw: f.yaw, roll: f.roll },
      features: f,
    };
  } catch (error) {
    console.error("Error detecting face:", error);
    return createEmptyResult();
  }
};

const createEmptyResult = (): FaceDetectionResult => ({
  faceDetected: false,
  eyeState: {
    leftEyeClosed: false, rightEyeClosed: false,
    bothEyesClosed: false, confidence: 0, isYawning: false,
  },
  timestamp: Date.now(),
  ear: 0.3,
  mar: 0,
  headPose: null,
  features: null,
});

// Legacy helpers — kept for backward compatibility
export const calculateEyeClosureDuration = (
  history: FaceDetectionResult[], windowMs = 2000
): number => {
  const now = Date.now();
  const recent = history.filter(d => now - d.timestamp < windowMs);
  if (recent.length === 0) return 0;
  return (recent.filter(d => d.eyeState.bothEyesClosed).length / recent.length) * 100;
};

export const checkForYawning = (
  history: FaceDetectionResult[], windowMs = 2000
): boolean => {
  const now = Date.now();
  const recent = history.filter(d => now - d.timestamp < windowMs);
  if (recent.length === 0) return false;
  return (recent.filter(d => d.eyeState.isYawning).length / recent.length) * 100 > 25;
};

export const checkBlinkFrequency = (
  history: FaceDetectionResult[], windowMs = 10000
): boolean => {
  const now = Date.now();
  const recent = history.filter(d => now - d.timestamp < windowMs);
  if (recent.length < 10) return false;
  let blinks = 0, wasOpen = true;
  for (const d of recent) {
    if (wasOpen && d.eyeState.bothEyesClosed) blinks++;
    wasOpen = !d.eyeState.bothEyesClosed;
  }
  const bpm = blinks / (windowMs / 60000);
  return bpm < 8 || bpm > 35;
};
