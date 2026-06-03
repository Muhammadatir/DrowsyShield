export interface UserPreferences {
  userId?: string;
  sensitivity: number; // 0-100
  alertVolume: number; // 0-100
  vibrationIntensity: 'low' | 'medium' | 'high';
  selectedCamera?: string;
  autoStart: boolean;
  calibrationData?: any;
  detectionMode: 'standard' | 'sensitive' | 'relaxed';
  earlyWarning: boolean;
  dataCollection: boolean;
  voiceAlerts: boolean;
}

export const DEFAULT_PREFERENCES: UserPreferences = {
  sensitivity: 50,
  alertVolume: 70,
  vibrationIntensity: 'high',
  autoStart: false,
  detectionMode: 'standard',
  earlyWarning: true,
  dataCollection: true,
  voiceAlerts: true,
};

export interface DetectionMode {
  id: 'standard' | 'sensitive' | 'relaxed';
  name: string;
  description: string;
  thresholdMultiplier: number;
}

export const DETECTION_MODES: DetectionMode[] = [
  {
    id: 'standard',
    name: 'Standard',
    description: 'Balanced detection for most driving conditions',
    thresholdMultiplier: 1.0,
  },
  {
    id: 'sensitive',
    name: 'Sensitive',
    description: 'More aggressive detection for long drives',
    thresholdMultiplier: 0.7,
  },
  {
    id: 'relaxed',
    name: 'Relaxed',
    description: 'Less sensitive for short trips',
    thresholdMultiplier: 1.3,
  },
];
