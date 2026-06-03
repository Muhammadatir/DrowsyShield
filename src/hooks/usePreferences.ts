import { useState, useEffect } from "react";
import { DEFAULT_PREFERENCES, type UserPreferences } from "@/types/preferences";
import { savePreferences, loadPreferences } from "@/utils/localStorage";

export const usePreferences = () => {
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadedPrefs = loadPreferences();
    if (loadedPrefs) {
      setPreferences(loadedPrefs);
    }
    setIsLoaded(true);
  }, []);

  const updatePreferences = (updates: Partial<UserPreferences>) => {
    const newPreferences = { ...preferences, ...updates };
    setPreferences(newPreferences);
    savePreferences(newPreferences);
  };

  return {
    preferences,
    updatePreferences,
    isLoaded,
  };
};
