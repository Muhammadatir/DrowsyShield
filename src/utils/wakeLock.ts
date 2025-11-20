let wakeLock: WakeLockSentinel | null = null;

export const isWakeLockSupported = (): boolean => {
  return 'wakeLock' in navigator;
};

export const requestWakeLock = async (): Promise<boolean> => {
  if (!isWakeLockSupported()) {
    console.warn('Wake Lock API not supported');
    return false;
  }

  try {
    wakeLock = await navigator.wakeLock.request('screen');
    
    wakeLock.addEventListener('release', () => {
      console.log('Wake Lock released');
    });

    console.log('Wake Lock acquired');
    return true;
  } catch (error) {
    console.error('Failed to acquire Wake Lock:', error);
    return false;
  }
};

export const releaseWakeLock = async (): Promise<void> => {
  if (wakeLock) {
    try {
      await wakeLock.release();
      wakeLock = null;
      console.log('Wake Lock manually released');
    } catch (error) {
      console.error('Failed to release Wake Lock:', error);
    }
  }
};

export const isWakeLockActive = (): boolean => {
  return wakeLock !== null && !wakeLock.released;
};

// Re-acquire wake lock when page becomes visible
export const setupWakeLockReacquisition = (callback?: () => void): void => {
  if (!isWakeLockSupported()) return;

  document.addEventListener('visibilitychange', async () => {
    if (wakeLock !== null && document.visibilityState === 'visible') {
      await requestWakeLock();
      callback?.();
    }
  });
};
