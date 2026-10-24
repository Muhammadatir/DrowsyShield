// nativeEmergency.ts
// TypeScript wrapper for the native EmergencyPlugin Capacitor plugin.
//
// Automatic (no user tap):   Twilio SMS + voice call via Supabase Edge Function
// Requires one tap:          Android dialer opens pre-filled with 112
// Fallback (Twilio down):    SMS intent opens pre-filled for each contact

import { registerPlugin, Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

interface EmergencyPluginInterface {
  dialEmergency(options: { number: string }): Promise<{ opened: boolean; number: string }>;
  sendSmsIntent(options: { phone: string; message: string }): Promise<{ opened: boolean }>;
}

const EmergencyPlugin = registerPlugin<EmergencyPluginInterface>('Emergency');

export interface EmergencyResponseResult {
  twilioNotified: boolean;       // SMS + voice call sent via Twilio (automatic)
  dialerOpened: boolean;         // 112 dialer opened (requires one tap)
  localNotificationSent: boolean;// On-device notification shown
  smsFallbackOpened: boolean;    // SMS intent opened as fallback
  errors: string[];
}

/**
 * Full emergency response workflow.
 * Called exactly once when the crash countdown expires without cancellation.
 *
 * Actions in order:
 *  1. Send local notification (immediate, works offline)
 *  2. Notify emergency contacts via Twilio (automatic, needs network)
 *  3. Open 112 dialer (requires one user tap)
 *  4. If Twilio failed and contacts exist, open SMS intent as fallback
 */
export const executeEmergencyResponse = async (
  crashConfidence: number,
  _location: { latitude: number; longitude: number } | null, // unused — fetched inside triggerEmergencyAlert
  _contacts: Array<{ name: string; phone: string }>,          // unused — fetched inside triggerEmergencyAlert
  twilioFn: (confidence: number) => Promise<{ success: boolean; contactsNotified: number; contacts: Array<{name:string;phone:string}>; location: {latitude:number;longitude:number}|null }>
): Promise<EmergencyResponseResult> => {
  const result: EmergencyResponseResult = {
    twilioNotified: false,
    dialerOpened: false,
    localNotificationSent: false,
    smsFallbackOpened: false,
    errors: [],
  };

  // Run Twilio first so we have location + contacts for the notification
  let location: { latitude: number; longitude: number } | null = null;
  let contacts: Array<{ name: string; phone: string }> = [];
  try {
    const twilio = await twilioFn(crashConfidence);
    result.twilioNotified = twilio.success;
    location = twilio.location;
    contacts = twilio.contacts;
    if (!twilio.success) result.errors.push('Twilio notification failed — check contacts and network');
  } catch (e) {
    result.errors.push(`Twilio error: ${e}`);
  }

  const mapUrl = location
    ? `https://maps.google.com/?q=${location.latitude},${location.longitude}`
    : null;
  const timestamp = new Date().toLocaleTimeString();

  // --- 1. Local notification ---
  try {
    await LocalNotifications.requestPermissions();
    await LocalNotifications.schedule({
      notifications: [{
        id: 911,
        title: '\uD83D\uDEA8 DrowsyShield \u2014 Crash Detected',
        body: mapUrl
          ? `Possible crash at ${timestamp}. Location: ${mapUrl}`
          : `Possible crash at ${timestamp}. Location unavailable.`,
        schedule: { at: new Date(Date.now() + 100) },
        actionTypeId: '',
        extra: { mapUrl, timestamp },
      }],
    });
    result.localNotificationSent = true;
  } catch (e) {
    result.errors.push(`Local notification failed: ${e}`);
  }

  // --- 2. Open 112 dialer ---
  if (Capacitor.isNativePlatform()) {
    try {
      await EmergencyPlugin.dialEmergency({ number: '112' });
      result.dialerOpened = true;
    } catch (e) {
      result.errors.push(`Dialer failed: ${e}`);
      // Web fallback
      window.location.href = 'tel:112';
      result.dialerOpened = true;
    }
  } else {
    // Browser fallback
    window.location.href = 'tel:112';
    result.dialerOpened = true;
  }

  // --- 4. SMS intent fallback (if Twilio failed and contacts exist) ---
  if (!result.twilioNotified && contacts.length > 0 && Capacitor.isNativePlatform()) {
    const firstContact = contacts[0]; // Open SMS for first contact only (UX)
    const smsBody = mapUrl
      ? `🚨 EMERGENCY: Possible crash detected at ${timestamp}. Location: ${mapUrl}`
      : `🚨 EMERGENCY: Possible crash detected at ${timestamp}. Location unavailable.`;
    try {
      await EmergencyPlugin.sendSmsIntent({ phone: firstContact.phone, message: smsBody });
      result.smsFallbackOpened = true;
    } catch (e) {
      result.errors.push(`SMS fallback failed: ${e}`);
    }
  }

  return result;
};
