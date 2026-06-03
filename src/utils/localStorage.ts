import type { UserPreferences } from "@/types/preferences";
import type { CalibrationData } from "@/types/calibration";
import type { SessionData } from "@/types";

const STORAGE_KEYS = {
  PREFERENCES: 'drowsyguard_preferences',
  CALIBRATION: 'drowsyguard_calibration',
  SESSIONS: 'drowsyguard_sessions',
};

export const savePreferences = (preferences: UserPreferences): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.PREFERENCES, JSON.stringify(preferences));
    console.log('Preferences saved:', preferences);
  } catch (error) {
    console.error('Error saving preferences:', error);
  }
};

export const loadPreferences = (): UserPreferences | null => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.PREFERENCES);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error loading preferences:', error);
    return null;
  }
};

export const saveCalibration = (calibration: CalibrationData): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.CALIBRATION, JSON.stringify(calibration));
    console.log('Calibration saved:', calibration);
  } catch (error) {
    console.error('Error saving calibration:', error);
  }
};

export const loadCalibration = (): CalibrationData | null => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.CALIBRATION);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error loading calibration:', error);
    return null;
  }
};

export const saveSession = (session: SessionData): void => {
  try {
    const sessions = loadSessions();
    // Ensure all new fields exist
    const sessionToSave: SessionData = {
      ...session,
      incidents: session.incidents || [],
      averageAlertness: session.averageAlertness || 100,
      maxEyeClosureDuration: session.maxEyeClosureDuration || 0,
    };
    sessions.push(sessionToSave);
    // Keep only last 50 sessions
    const recentSessions = sessions.slice(-50);
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(recentSessions));
    console.log('Session saved:', sessionToSave);
  } catch (error) {
    console.error('Error saving session:', error);
  }
};

export const loadSessions = (): SessionData[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.SESSIONS);
    if (!data) return [];
    
    const sessions = JSON.parse(data);
    // Ensure backward compatibility with old session format
    return sessions.map((session: any) => ({
      ...session,
      incidents: session.incidents || [],
      averageAlertness: session.averageAlertness || 100,
      maxEyeClosureDuration: session.maxEyeClosureDuration || 0,
    }));
  } catch (error) {
    console.error('Error loading sessions:', error);
    return [];
  }
};

export const clearAllData = (): void => {
  try {
    Object.values(STORAGE_KEYS).forEach((key) => {
      localStorage.removeItem(key);
    });
    console.log('All data cleared');
  } catch (error) {
    console.error('Error clearing data:', error);
  }
};
