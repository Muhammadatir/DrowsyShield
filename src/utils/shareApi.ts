export interface ShareData {
  title?: string;
  text?: string;
  url?: string;
  files?: File[];
}

export const isShareSupported = (): boolean => {
  return 'share' in navigator;
};

export const canShareFiles = (): boolean => {
  return 'canShare' in navigator && typeof navigator.canShare === 'function';
};

export const shareSessionData = async (sessionData: {
  duration: number;
  incidentCount: number;
  averageAlertness: number;
  date: string;
}): Promise<boolean> => {
  if (!isShareSupported()) {
    console.warn('Web Share API not supported');
    return false;
  }

  try {
    const shareText = `DrowsyGuard Session Summary
Date: ${sessionData.date}
Duration: ${Math.floor(sessionData.duration / 60)} minutes
Drowsiness Incidents: ${sessionData.incidentCount}
Average Alertness: ${sessionData.averageAlertness}%

Stay safe on the roads! 🚗`;

    await navigator.share({
      title: 'DrowsyGuard Session Report',
      text: shareText,
    });

    console.log('Session data shared successfully');
    return true;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.log('Share cancelled by user');
    } else {
      console.error('Error sharing session data:', error);
    }
    return false;
  }
};

export const shareFile = async (file: File, title: string, text: string): Promise<boolean> => {
  if (!canShareFiles()) {
    console.warn('File sharing not supported');
    return false;
  }

  try {
    const shareData: ShareData = {
      title,
      text,
      files: [file],
    };

    if (navigator.canShare && !navigator.canShare(shareData)) {
      console.warn('Cannot share this type of file');
      return false;
    }

    await navigator.share(shareData);
    console.log('File shared successfully');
    return true;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.log('Share cancelled by user');
    } else {
      console.error('Error sharing file:', error);
    }
    return false;
  }
};

export const shareEmergencyLocation = async (
  latitude: number,
  longitude: number,
  message?: string
): Promise<boolean> => {
  if (!isShareSupported()) {
    return false;
  }

  try {
    const locationUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
    const shareText = message 
      ? `${message}\n\nLocation: ${locationUrl}`
      : `Emergency! I need help at this location: ${locationUrl}`;

    await navigator.share({
      title: 'DrowsyGuard Emergency Alert',
      text: shareText,
      url: locationUrl,
    });

    return true;
  } catch (error) {
    console.error('Error sharing emergency location:', error);
    return false;
  }
};
