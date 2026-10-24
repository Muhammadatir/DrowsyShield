// emergencyAlert.ts
// Triggers the Supabase Edge Function (Twilio SMS + voice call).
// Returns location and contacts so the caller can pass them to nativeEmergency.

import { supabase } from "@/integrations/supabase/client";
import { loadEmergencyContacts } from "./emergencyStorage";
import { getCurrentLocation } from "./geolocation";
import type { EmergencyContact } from "@/types/emergency";

export interface EmergencyAlertResult {
  success: boolean;
  contactsNotified: number;
  contacts: EmergencyContact[];
  location: { latitude: number; longitude: number } | null;
  error?: string;
}

export const triggerEmergencyAlert = async (
  crashConfidence: number,
  driverName?: string
): Promise<EmergencyAlertResult> => {
  const contacts = loadEmergencyContacts();

  // Get GPS location (best-effort, 3s timeout)
  let location: { latitude: number; longitude: number } | null = null;
  try {
    const geo = await Promise.race([
      getCurrentLocation(),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 3000)),
    ]);
    if (geo) location = { latitude: geo.latitude, longitude: geo.longitude };
  } catch {
    // location stays null — handled downstream
  }

  if (contacts.length === 0) {
    return { success: false, contactsNotified: 0, contacts: [], location, error: "No emergency contacts saved" };
  }

  try {
    const { error } = await supabase.functions.invoke("emergency-alert", {
      body: {
        contacts: contacts.map((c) => ({ name: c.name, phone: c.phone })),
        location,
        crashConfidence,
        driverName,
      },
    });

    if (error) throw error;

    return { success: true, contactsNotified: contacts.length, contacts, location };
  } catch (err) {
    console.error("Emergency alert failed:", err);
    return { success: false, contactsNotified: 0, contacts, location, error: String(err) };
  }
};
