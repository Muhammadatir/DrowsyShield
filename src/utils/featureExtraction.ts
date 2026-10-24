/**
 * featureExtraction.ts
 * Extracts all facial features from MediaPipe landmarks.
 * Separated from detection logic for modularity and testability.
 */

export interface ExtractedFeatures {
  // Eye features
  leftEAR: number;
  rightEAR: number;
  avgEAR: number;
  leftEyeClosed: boolean;
  rightEyeClosed: boolean;
  bothEyesClosed: boolean;

  // Mouth features
  mar: number;
  isYawning: boolean;

  // Head pose
  pitch: number; // up/down — positive = nodding down
  yaw: number;   // left/right
  roll: number;  // tilt

  // Raw landmark confidence
  confidence: number;
}

// EAR threshold — eyes considered closed below this
export const EAR_CLOSED_THRESHOLD = 0.15;
// MAR threshold — mouth considered open (yawning) above this
export const MAR_YAWN_THRESHOLD = 0.45;

/**
 * Eye Aspect Ratio (EAR)
 * Formula: (||p2-p6|| + ||p3-p5||) / (2 * ||p1-p4||)
 * Soukupova & Cech, 2016
 */
export const calculateEAR = (pts: number[][]): number => {
  const dist = (a: number[], b: number[]) =>
    Math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2);
  const v1 = dist(pts[1], pts[5]);
  const v2 = dist(pts[2], pts[4]);
  const h  = dist(pts[0], pts[3]);
  if (h < 1e-6) return 0;
  return (v1 + v2) / (2.0 * h);
};

/**
 * Mouth Aspect Ratio (MAR)
 * Measures mouth openness for yawn detection
 */
export const calculateMAR = (pts: number[][]): number => {
  const dist = (a: number[], b: number[]) =>
    Math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2);
  const v1 = dist(pts[2], pts[6]);
  const v2 = dist(pts[3], pts[7]);
  const v3 = dist(pts[4], pts[8]);
  const h  = dist(pts[0], pts[1]);
  if (h < 1e-6) return 0;
  return (v1 + v2 + v3) / (3.0 * h);
};

/**
 * Extract all features from MediaPipe face landmarks
 */
export const extractFeatures = (landmarks: any[]): ExtractedFeatures => {
  // Left eye: 362, 385, 387, 263, 373, 380
  const leftEyePts = [
    [landmarks[362].x, landmarks[362].y],
    [landmarks[385].x, landmarks[385].y],
    [landmarks[387].x, landmarks[387].y],
    [landmarks[263].x, landmarks[263].y],
    [landmarks[373].x, landmarks[373].y],
    [landmarks[380].x, landmarks[380].y],
  ];

  // Right eye: 33, 160, 158, 133, 153, 144
  const rightEyePts = [
    [landmarks[33].x,  landmarks[33].y],
    [landmarks[160].x, landmarks[160].y],
    [landmarks[158].x, landmarks[158].y],
    [landmarks[133].x, landmarks[133].y],
    [landmarks[153].x, landmarks[153].y],
    [landmarks[144].x, landmarks[144].y],
  ];

  // Mouth: left corner, right corner, top-outer, top-inner, bottom-inner, bottom-outer, inner-top, inner-bottom, bottom
  const mouthPts = [
    [landmarks[61].x,  landmarks[61].y],
    [landmarks[291].x, landmarks[291].y],
    [landmarks[13].x,  landmarks[13].y],
    [landmarks[14].x,  landmarks[14].y],
    [landmarks[17].x,  landmarks[17].y],
    [landmarks[18].x,  landmarks[18].y],
    [landmarks[308].x, landmarks[308].y],
    [landmarks[402].x, landmarks[402].y],
    [landmarks[317].x, landmarks[317].y],
  ];

  const leftEAR  = calculateEAR(leftEyePts);
  const rightEAR = calculateEAR(rightEyePts);
  const avgEAR   = (leftEAR + rightEAR) / 2;
  const mar      = calculateMAR(mouthPts);

  // Head pose — simplified from 2D landmark geometry
  const nose      = landmarks[1];
  const chin      = landmarks[152];
  const leftOuter = landmarks[33];
  const rightOuter= landmarks[263];
  const pitch = (nose.y - chin.y) * 180;
  const yaw   = (nose.x - (leftOuter.x + rightOuter.x) / 2) * 180;
  const roll  = Math.atan2(
    rightOuter.y - leftOuter.y,
    rightOuter.x - leftOuter.x
  ) * (180 / Math.PI);

  return {
    leftEAR,
    rightEAR,
    avgEAR,
    leftEyeClosed:  leftEAR  < EAR_CLOSED_THRESHOLD,
    rightEyeClosed: rightEAR < EAR_CLOSED_THRESHOLD,
    bothEyesClosed: avgEAR   < EAR_CLOSED_THRESHOLD,
    mar,
    isYawning: mar > MAR_YAWN_THRESHOLD,
    pitch,
    yaw,
    roll,
    confidence: 0.95,
  };
};
