import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";

export interface EyeState {
  leftEyeClosed: boolean;
  rightEyeClosed: boolean;
  bothEyesClosed: boolean;
  confidence: number;
  isYawning: boolean;
}

export interface FaceDetectionResult {
  faceDetected: boolean;
  eyeState: EyeState;
  timestamp: number;
}

let faceLandmarker: FaceLandmarker | null = null;

// Initialize MediaPipe Face Landmarker
export const initializeFaceDetector = async () => {
  try {
    console.log("Initializing MediaPipe Face Landmarker...");
    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
    );
    
    faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
        delegate: "GPU"
      },
      runningMode: "VIDEO",
      numFaces: 1,
      minFaceDetectionConfidence: 0.5,
      minFacePresenceConfidence: 0.5,
      minTrackingConfidence: 0.5,
      outputFaceBlendshapes: true,
      outputFacialTransformationMatrixes: false
    });
    
    console.log("✓ MediaPipe Face Landmarker initialized successfully");
    return true;
  } catch (error) {
    console.error("Error initializing face detector:", error);
    return false;
  }
};

// Calculate Eye Aspect Ratio (EAR)
const calculateEAR = (eyeLandmarks: number[][]) => {
  // Eye landmarks: [top, bottom, left, right, top-inner, bottom-inner]
  const vertical1 = Math.sqrt(
    Math.pow(eyeLandmarks[1][0] - eyeLandmarks[5][0], 2) +
    Math.pow(eyeLandmarks[1][1] - eyeLandmarks[5][1], 2)
  );
  const vertical2 = Math.sqrt(
    Math.pow(eyeLandmarks[2][0] - eyeLandmarks[4][0], 2) +
    Math.pow(eyeLandmarks[2][1] - eyeLandmarks[4][1], 2)
  );
  const horizontal = Math.sqrt(
    Math.pow(eyeLandmarks[0][0] - eyeLandmarks[3][0], 2) +
    Math.pow(eyeLandmarks[0][1] - eyeLandmarks[3][1], 2)
  );
  
  return (vertical1 + vertical2) / (2.0 * horizontal);
};

// Calculate Mouth Aspect Ratio (MAR)
const calculateMAR = (mouthLandmarks: number[][]) => {
  // Vertical distance between upper and lower lip
  const vertical1 = Math.sqrt(
    Math.pow(mouthLandmarks[2][0] - mouthLandmarks[6][0], 2) +
    Math.pow(mouthLandmarks[2][1] - mouthLandmarks[6][1], 2)
  );
  const vertical2 = Math.sqrt(
    Math.pow(mouthLandmarks[3][0] - mouthLandmarks[7][0], 2) +
    Math.pow(mouthLandmarks[3][1] - mouthLandmarks[7][1], 2)
  );
  const vertical3 = Math.sqrt(
    Math.pow(mouthLandmarks[4][0] - mouthLandmarks[8][0], 2) +
    Math.pow(mouthLandmarks[4][1] - mouthLandmarks[8][1], 2)
  );
  
  // Horizontal distance of mouth
  const horizontal = Math.sqrt(
    Math.pow(mouthLandmarks[0][0] - mouthLandmarks[1][0], 2) +
    Math.pow(mouthLandmarks[0][1] - mouthLandmarks[1][1], 2)
  );
  
  return (vertical1 + vertical2 + vertical3) / (3.0 * horizontal);
};

export const detectFace = async (
  videoElement: HTMLVideoElement
): Promise<FaceDetectionResult> => {
  try {
    if (!faceLandmarker) {
      console.warn("Face landmarker not initialized");
      return createEmptyResult();
    }

    if (videoElement.videoWidth === 0 || videoElement.videoHeight === 0) {
      console.warn("Video dimensions not ready");
      return createEmptyResult();
    }

    const timestamp = performance.now();
    const results = faceLandmarker.detectForVideo(videoElement, timestamp);

    if (!results.faceLandmarks || results.faceLandmarks.length === 0) {
      return {
        faceDetected: false,
        eyeState: {
          leftEyeClosed: false,
          rightEyeClosed: false,
          bothEyesClosed: false,
          confidence: 0,
          isYawning: false,
        },
        timestamp: Date.now(),
      };
    }

    const landmarks = results.faceLandmarks[0];
    
    // Eye landmarks indices (MediaPipe Face Mesh)
    // Left eye: 362, 385, 387, 263, 373, 380
    // Right eye: 33, 160, 158, 133, 153, 144
    const leftEyeLandmarks = [
      [landmarks[362].x, landmarks[362].y],
      [landmarks[385].x, landmarks[385].y],
      [landmarks[387].x, landmarks[387].y],
      [landmarks[263].x, landmarks[263].y],
      [landmarks[373].x, landmarks[373].y],
      [landmarks[380].x, landmarks[380].y],
    ];
    
    const rightEyeLandmarks = [
      [landmarks[33].x, landmarks[33].y],
      [landmarks[160].x, landmarks[160].y],
      [landmarks[158].x, landmarks[158].y],
      [landmarks[133].x, landmarks[133].y],
      [landmarks[153].x, landmarks[153].y],
      [landmarks[144].x, landmarks[144].y],
    ];

    // Mouth landmarks indices
    // 61, 291, 13, 14, 17, 18, 308, 402, 317
    const mouthLandmarks = [
      [landmarks[61].x, landmarks[61].y],   // left corner
      [landmarks[291].x, landmarks[291].y], // right corner
      [landmarks[13].x, landmarks[13].y],   // top center
      [landmarks[14].x, landmarks[14].y],   // top
      [landmarks[17].x, landmarks[17].y],   // bottom
      [landmarks[18].x, landmarks[18].y],   // bottom center
      [landmarks[308].x, landmarks[308].y], // inner
      [landmarks[402].x, landmarks[402].y], // outer
      [landmarks[317].x, landmarks[317].y], // bottom outer
    ];

    const leftEAR = calculateEAR(leftEyeLandmarks);
    const rightEAR = calculateEAR(rightEyeLandmarks);
    const avgEAR = (leftEAR + rightEAR) / 2;
    
    const MAR = calculateMAR(mouthLandmarks);

    // EAR threshold for closed eyes - more sensitive
    const EYE_CLOSED_THRESHOLD = 0.18;
    // MAR threshold for yawning - optimized
    const YAWN_THRESHOLD = 0.42;

    // Temporal smoothing - use rolling average
    const recentEARs = [leftEAR, rightEAR];
    const avgEARSmoothed = recentEARs.reduce((a, b) => a + b, 0) / recentEARs.length;
    
    const leftEyeClosed = leftEAR < EYE_CLOSED_THRESHOLD;
    const rightEyeClosed = rightEAR < EYE_CLOSED_THRESHOLD;
    const bothEyesClosed = avgEARSmoothed < EYE_CLOSED_THRESHOLD;
    const isYawning = MAR > YAWN_THRESHOLD;

    if (bothEyesClosed || isYawning) {
      console.log("🔍 Face Detection:", {
        leftEAR: leftEAR.toFixed(3),
        rightEAR: rightEAR.toFixed(3),
        avgEAR: avgEAR.toFixed(3),
        MAR: MAR.toFixed(3),
        leftEyeClosed,
        rightEyeClosed,
        bothEyesClosed,
        isYawning: isYawning ? "⚠️ YES" : "no",
      });
    }

    return {
      faceDetected: true,
      eyeState: {
        leftEyeClosed,
        rightEyeClosed,
        bothEyesClosed,
        confidence: 0.95,
        isYawning,
      },
      timestamp: Date.now(),
    };
  } catch (error) {
    console.error("Error detecting face:", error);
    return createEmptyResult();
  }
};

const createEmptyResult = (): FaceDetectionResult => ({
  faceDetected: false,
  eyeState: {
    leftEyeClosed: false,
    rightEyeClosed: false,
    bothEyesClosed: false,
    confidence: 0,
    isYawning: false,
  },
  timestamp: Date.now(),
});

export const calculateEyeClosureDuration = (
  detectionHistory: FaceDetectionResult[],
  windowMs: number = 2000 // Changed to 2 seconds
): number => {
  const now = Date.now();
  const recentDetections = detectionHistory.filter(
    (d) => now - d.timestamp < windowMs
  );

  if (recentDetections.length === 0) return 0;

  const closedCount = recentDetections.filter(
    (d) => d.eyeState.bothEyesClosed
  ).length;

  const percentage = (closedCount / recentDetections.length) * 100;
  
  if (percentage > 0) {
    console.log(`Eye closure: ${percentage.toFixed(1)}% over ${windowMs}ms (${closedCount}/${recentDetections.length})`);
  }

  return percentage;
};

export const checkForYawning = (
  detectionHistory: FaceDetectionResult[],
  windowMs: number = 2000
): boolean => {
  const now = Date.now();
  const recentDetections = detectionHistory.filter(
    (d) => now - d.timestamp < windowMs
  );

  if (recentDetections.length === 0) return false;

  const yawningCount = recentDetections.filter(
    (d) => d.eyeState.isYawning
  ).length;

  // More sensitive yawning detection
  const yawningPercentage = (yawningCount / recentDetections.length) * 100;
  
  if (yawningPercentage > 0) {
    console.log(`⚠️ Yawning detected: ${yawningPercentage.toFixed(1)}% (${yawningCount}/${recentDetections.length})`);
  }

  return yawningPercentage > 25;
};

// Check blink frequency for fatigue detection
export const checkBlinkFrequency = (
  detectionHistory: FaceDetectionResult[],
  windowMs: number = 10000
): boolean => {
  const now = Date.now();
  const recentDetections = detectionHistory.filter(
    (d) => now - d.timestamp < windowMs
  );

  if (recentDetections.length < 10) return false;

  let blinkCount = 0;
  let wasOpen = true;

  for (const detection of recentDetections) {
    const isClosed = detection.eyeState.bothEyesClosed;
    if (wasOpen && isClosed) {
      blinkCount++;
    }
    wasOpen = !isClosed;
  }

  // Normal blink rate: 15-20 per minute
  // Fatigue: <10 per minute or >30 per minute
  const blinksPerMinute = (blinkCount / (windowMs / 60000));
  
  return blinksPerMinute < 8 || blinksPerMinute > 35;
};
