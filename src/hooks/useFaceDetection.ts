import { useState, useEffect, useRef, useCallback } from "react";
import {
  initializeFaceDetector,
  detectFace,
  calculateEyeClosureDuration,
  checkForYawning,
  checkBlinkFrequency,
  type FaceDetectionResult,
} from "@/utils/faceDetection";
import { alertSystem } from "@/utils/alertSystem";
import { musicIntegration } from "@/utils/musicIntegration";

interface UseFaceDetectionProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  isActive: boolean;
  sensitivity: number;
  alertVolume: number;
}

export const useFaceDetection = ({
  videoRef,
  isActive,
  sensitivity,
  alertVolume,
}: UseFaceDetectionProps) => {
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [detectionHistory, setDetectionHistory] = useState<FaceDetectionResult[]>([]);
  const [currentDetection, setCurrentDetection] = useState<FaceDetectionResult | null>(null);
  const [drowsinessCount, setDrowsinessCount] = useState(0);
  const detectionIntervalRef = useRef<number | null>(null);
  const lastAlertTimeRef = useRef<number>(0);
  const alertTimeoutRef = useRef<number | null>(null);

  // Initialize face detection model
  useEffect(() => {
    const initModel = async () => {
      const success = await initializeFaceDetector();
      setIsModelLoaded(success);
    };

    initModel();
  }, []);

  // Run detection loop
  const runDetection = useCallback(async () => {
    if (!videoRef.current || !isActive || !isModelLoaded) return;

    const result = await detectFace(videoRef.current);
    setCurrentDetection(result);

    setDetectionHistory((prev) => {
      const updated = [...prev, result];
      // Keep only last 100 detections
      return updated.slice(-100);
    });

    // Check for drowsiness - eyes closed for 3 seconds
    const eyeClosurePercentage = calculateEyeClosureDuration(
      [...detectionHistory, result],
      3000 // 3 seconds window
    );

    // Check for yawning
    const isYawning = checkForYawning([...detectionHistory, result], 3000);
    
    // Check blink frequency
    const abnormalBlinking = checkBlinkFrequency([...detectionHistory, result], 10000);

    // Multi-factor detection for better accuracy
    const EYE_CLOSURE_ALERT_THRESHOLD = 70; // 70% of frames in 3s = ~2.1s closed
    
    const shouldAlert = eyeClosurePercentage > EYE_CLOSURE_ALERT_THRESHOLD || isYawning || abnormalBlinking;
    const eyesCurrentlyOpen = !currentDetection?.eyeState.bothEyesClosed;

    // Cancel pending alert if eyes are now open
    if (eyesCurrentlyOpen && alertTimeoutRef.current) {
      clearTimeout(alertTimeoutRef.current);
      alertTimeoutRef.current = null;
      console.log("✅ Alert cancelled - eyes are open");
    }

    if (shouldAlert && !eyesCurrentlyOpen) {
      const now = Date.now();
      // Only alert once every 3 seconds and if eyes are still closed
      if (now - lastAlertTimeRef.current > 3000 && !alertTimeoutRef.current) {
        // Delay alert by 500ms to allow for eye opening
        alertTimeoutRef.current = window.setTimeout(() => {
          // Double-check eyes are still closed before alerting
          if (currentDetection?.eyeState.bothEyesClosed || isYawning || abnormalBlinking) {
            const reason = isYawning ? "YAWNING" : abnormalBlinking ? "ABNORMAL BLINKING" : "EYES CLOSED";
            console.log(`🚨 DROWSINESS ALERT: ${reason}! 🚨`);
            if (!isYawning) {
              console.log("Eye closure:", eyeClosurePercentage.toFixed(1) + "% over 3 seconds");
            }
            alertSystem.triggerFullAlert(alertVolume / 100, "high");
            
            // Play energizing music if enabled
            musicIntegration.playEnergizingMusic();
            
            setDrowsinessCount((prev) => prev + 1);
            lastAlertTimeRef.current = Date.now();
          }
          alertTimeoutRef.current = null;
        }, 500);
      }
    }
  }, [videoRef, isActive, isModelLoaded, detectionHistory, sensitivity, alertVolume]);

  useEffect(() => {
    if (isActive && isModelLoaded) {
      console.log("Starting face detection loop...");
      // Run detection every 300ms for more responsive detection
      detectionIntervalRef.current = window.setInterval(runDetection, 300);
    } else {
      console.log("Face detection stopped");
    }

    return () => {
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
      }
    };
  }, [isActive, isModelLoaded, runDetection]);

  const resetDetection = useCallback(() => {
    setDetectionHistory([]);
    setCurrentDetection(null);
    setDrowsinessCount(0);
    lastAlertTimeRef.current = 0;
    if (alertTimeoutRef.current) {
      clearTimeout(alertTimeoutRef.current);
      alertTimeoutRef.current = null;
    }
  }, []);

  return {
    isModelLoaded,
    currentDetection,
    detectionHistory,
    drowsinessCount,
    resetDetection,
  };
};
