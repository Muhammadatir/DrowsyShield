import { supabase } from '@/integrations/supabase/client';

export interface WebhookPayload {
  event: string;
  data: any;
  timestamp: string;
  userId?: string;
}

export const sendWebhook = async (
  url: string,
  payload: WebhookPayload
): Promise<boolean> => {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error('Webhook failed:', response.statusText);
      return false;
    }

    console.log('Webhook sent successfully');
    return true;
  } catch (error) {
    console.error('Error sending webhook:', error);
    return false;
  }
};

export const sendSessionWebhook = async (sessionData: {
  id: string;
  duration: number;
  incidents: number;
  alertness: number;
}): Promise<void> => {
  // Check if user has configured a webhook URL in preferences
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { data: preferences } = await supabase
    .from('user_preferences')
    .select('*')
    .eq('user_id', user.id)
    .single();

  // If webhook URL is configured, send the data
  // This would require adding webhook_url to user_preferences table
  // For now, this is a placeholder for future webhook integration
  console.log('Session webhook ready:', sessionData);
};

export const sendDrowsinessAlert = async (
  severity: number,
  location?: { latitude: number; longitude: number }
): Promise<void> => {
  const payload: WebhookPayload = {
    event: 'drowsiness_alert',
    data: {
      severity,
      location,
    },
    timestamp: new Date().toISOString(),
  };

  console.log('Drowsiness alert webhook:', payload);
  // Webhook URL would be configured by user
};

export const sendEmergencyWebhook = async (
  contactPhone: string,
  location: { latitude: number; longitude: number }
): Promise<void> => {
  const payload: WebhookPayload = {
    event: 'emergency_alert',
    data: {
      contactPhone,
      location,
      message: 'Emergency assistance needed - driver drowsiness detected',
    },
    timestamp: new Date().toISOString(),
  };

  console.log('Emergency webhook:', payload);
  // Could integrate with services like Twilio for SMS alerts
};
