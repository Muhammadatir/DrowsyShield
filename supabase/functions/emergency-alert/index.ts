// Supabase Edge Function: emergency-alert
// Triggered when crash countdown hits 0 with no user response.
// Sends SMS + initiates a call to all emergency contacts via Twilio.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const TWILIO_ACCOUNT_SID = Deno.env.get("TWILIO_ACCOUNT_SID")!;
const TWILIO_AUTH_TOKEN  = Deno.env.get("TWILIO_AUTH_TOKEN")!;
const TWILIO_FROM_NUMBER = Deno.env.get("TWILIO_FROM_NUMBER")!; // e.g. +15551234567

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmergencyContact {
  name: string;
  phone: string; // E.164 format e.g. +923001234567
}

interface EmergencyPayload {
  contacts: EmergencyContact[];
  location: { latitude: number; longitude: number } | null;
  crashConfidence: number;
  driverName?: string;
}

const twilioRequest = async (endpoint: string, body: Record<string, string>) => {
  const credentials = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`);
  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/${endpoint}.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams(body).toString(),
    }
  );
  return res.json();
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  try {
    const payload: EmergencyPayload = await req.json();
    const { contacts, location, crashConfidence, driverName = "A DrowsyShield user" } = payload;

    if (!contacts || contacts.length === 0) {
      return new Response(
        JSON.stringify({ error: "No emergency contacts provided" }),
        { status: 400, headers: { ...CORS, "Content-Type": "application/json" } }
      );
    }

    const mapUrl = location
      ? `https://www.google.com/maps?q=${location.latitude},${location.longitude}`
      : "Location unavailable";

    const smsBody =
      `🚨 EMERGENCY ALERT from DrowsyShield\n` +
      `${driverName} may have been in a crash (${crashConfidence}% confidence).\n` +
      `They did not respond to the safety check.\n` +
      `Last known location: ${mapUrl}\n` +
      `Please call them or emergency services immediately.`;

    // TwiML for the voice call — reads a message aloud
    const twiml =
      `<Response>` +
      `<Say voice="alice">` +
      `This is an automated emergency alert from DrowsyShield. ` +
      `${driverName} may have been in a crash and did not respond to the safety check. ` +
      `Please check on them immediately or call emergency services. ` +
      `Their last known location has been sent to you by text message.` +
      `</Say>` +
      `<Pause length="1"/>` +
      `<Say voice="alice">This message will repeat.</Say>` +
      `<Say voice="alice">` +
      `${driverName} may have been in a crash. Please check on them immediately.` +
      `</Say>` +
      `</Response>`;

    const results = await Promise.allSettled(
      contacts.flatMap((contact) => [
        // SMS
        twilioRequest("Messages", {
          From: TWILIO_FROM_NUMBER,
          To: contact.phone,
          Body: smsBody,
        }),
        // Voice call
        twilioRequest("Calls", {
          From: TWILIO_FROM_NUMBER,
          To: contact.phone,
          Twiml: twiml,
        }),
      ])
    );

    const summary = results.map((r, i) => ({
      index: i,
      status: r.status,
      ...(r.status === "fulfilled" ? { sid: r.value.sid, error: r.value.message } : { reason: r.reason }),
    }));

    console.log("Emergency alert results:", JSON.stringify(summary));

    return new Response(
      JSON.stringify({ success: true, results: summary }),
      { status: 200, headers: { ...CORS, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Emergency alert error:", err);
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...CORS, "Content-Type": "application/json" } }
    );
  }
});
