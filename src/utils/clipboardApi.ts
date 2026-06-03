export const isClipboardSupported = (): boolean => {
  return 'clipboard' in navigator;
};

export const copyToClipboard = async (text: string): Promise<boolean> => {
  if (!isClipboardSupported()) {
    // Fallback for older browsers
    return fallbackCopyToClipboard(text);
  }

  try {
    await navigator.clipboard.writeText(text);
    console.log('Text copied to clipboard');
    return true;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return fallbackCopyToClipboard(text);
  }
};

const fallbackCopyToClipboard = (text: string): boolean => {
  const textArea = document.createElement('textarea');
  textArea.value = text;
  textArea.style.position = 'fixed';
  textArea.style.left = '-999999px';
  textArea.style.top = '-999999px';
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();

  try {
    document.execCommand('copy');
    textArea.remove();
    return true;
  } catch (error) {
    console.error('Fallback copy failed:', error);
    textArea.remove();
    return false;
  }
};

export const copySessionReport = async (sessionData: {
  id: string;
  date: string;
  duration: number;
  incidentCount: number;
  averageAlertness: number;
}): Promise<boolean> => {
  const report = `DrowsyGuard Session Report
================================
Session ID: ${sessionData.id}
Date: ${sessionData.date}
Duration: ${Math.floor(sessionData.duration / 60)} minutes
Drowsiness Incidents: ${sessionData.incidentCount}
Average Alertness: ${sessionData.averageAlertness}%
================================`;

  return await copyToClipboard(report);
};

export const copyEmergencyLocation = async (
  latitude: number,
  longitude: number
): Promise<boolean> => {
  const locationText = `Emergency Location:\nLatitude: ${latitude}\nLongitude: ${longitude}\nGoogle Maps: https://www.google.com/maps?q=${latitude},${longitude}`;
  return await copyToClipboard(locationText);
};

export const readFromClipboard = async (): Promise<string | null> => {
  if (!isClipboardSupported()) {
    console.warn('Clipboard API not supported');
    return null;
  }

  try {
    const text = await navigator.clipboard.readText();
    return text;
  } catch (error) {
    console.error('Failed to read from clipboard:', error);
    return null;
  }
};
