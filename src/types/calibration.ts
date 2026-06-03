export interface CalibrationData {
  userId?: string;
  timestamp: number;
  eyeOpenBrightness: number;
  eyeClosedBrightness: number;
  faceDistance: number;
  lightingCondition: 'day' | 'night' | 'mixed';
  sensitivity: number;
  completed: boolean;
}

export interface CalibrationStep {
  id: number;
  title: string;
  description: string;
  instruction: string;
  duration?: number;
  requiresValidation: boolean;
}

export const CALIBRATION_STEPS: CalibrationStep[] = [
  {
    id: 1,
    title: "Position Camera",
    description: "Adjust your device so your face is centered in the frame",
    instruction: "Hold the device at arm's length with your face clearly visible",
    requiresValidation: true,
  },
  {
    id: 2,
    title: "Eyes Open Baseline",
    description: "Keep your eyes wide open and look directly at the camera",
    instruction: "Maintain eye contact with the camera for 3 seconds",
    duration: 3000,
    requiresValidation: true,
  },
  {
    id: 3,
    title: "Eyes Closed Baseline",
    description: "Close your eyes gently for a few seconds",
    instruction: "Keep eyes closed naturally for 3 seconds",
    duration: 3000,
    requiresValidation: true,
  },
  {
    id: 4,
    title: "Test Alerts",
    description: "Verify alert volume and vibration settings",
    instruction: "Tap the button to test your alert preferences",
    requiresValidation: false,
  },
];
