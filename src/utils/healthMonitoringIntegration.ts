// Health Monitoring Platform Integration
// This module provides optional integration with health monitoring platforms
// like Apple Health, Google Fit, or custom health tracking systems

export interface HealthData {
  heartRate?: number;
  sleepHours?: number;
  stressLevel?: number;
  fatigueScore?: number;
  timestamp: Date;
}

export interface HealthIntegrationConfig {
  platform: 'apple-health' | 'google-fit' | 'custom';
  enabled: boolean;
  syncInterval?: number; // in minutes
}

export const isHealthIntegrationSupported = (
  platform: HealthIntegrationConfig['platform']
): boolean => {
  switch (platform) {
    case 'apple-health':
      // Check if running on iOS and HealthKit is available
      return /iPhone|iPad|iPod/.test(navigator.userAgent);
    case 'google-fit':
      // Check if Google Fit API is available
      return 'google' in window;
    case 'custom':
      return true;
    default:
      return false;
  }
};

export const fetchHealthData = async (
  config: HealthIntegrationConfig
): Promise<HealthData | null> => {
  if (!config.enabled) return null;

  try {
    // Placeholder for actual health data integration
    // In production, this would interface with native APIs or health platforms
    console.log(`Fetching health data from ${config.platform}`);
    
    // Mock data for demonstration
    return {
      sleepHours: 7.5,
      stressLevel: 3,
      fatigueScore: 40,
      timestamp: new Date(),
    };
  } catch (error) {
    console.error('Error fetching health data:', error);
    return null;
  }
};

export const calculateFatigueRisk = (healthData: HealthData): number => {
  let riskScore = 0;

  // Sleep hours impact
  if (healthData.sleepHours && healthData.sleepHours < 6) {
    riskScore += 40;
  } else if (healthData.sleepHours && healthData.sleepHours < 7) {
    riskScore += 20;
  }

  // Stress level impact
  if (healthData.stressLevel && healthData.stressLevel > 7) {
    riskScore += 30;
  } else if (healthData.stressLevel && healthData.stressLevel > 5) {
    riskScore += 15;
  }

  // Fatigue score impact
  if (healthData.fatigueScore && healthData.fatigueScore > 70) {
    riskScore += 30;
  } else if (healthData.fatigueScore && healthData.fatigueScore > 50) {
    riskScore += 15;
  }

  return Math.min(riskScore, 100);
};

export const shouldRecommendRest = (healthData: HealthData): boolean => {
  const risk = calculateFatigueRisk(healthData);
  return risk >= 60;
};

export const generateHealthRecommendations = (
  healthData: HealthData
): string[] => {
  const recommendations: string[] = [];

  if (healthData.sleepHours && healthData.sleepHours < 7) {
    recommendations.push(
      `You slept only ${healthData.sleepHours} hours. Aim for 7-9 hours before driving.`
    );
  }

  if (healthData.stressLevel && healthData.stressLevel > 6) {
    recommendations.push(
      'Your stress levels are elevated. Consider relaxation techniques before driving.'
    );
  }

  if (healthData.fatigueScore && healthData.fatigueScore > 60) {
    recommendations.push(
      'Your fatigue score is high. Take a break before starting a long drive.'
    );
  }

  return recommendations;
};
