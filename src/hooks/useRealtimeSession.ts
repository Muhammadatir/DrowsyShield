import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

interface SessionUpdate {
  id: string;
  user_id: string;
  start_time: string;
  end_time?: string;
  duration?: number;
  total_drowsiness_incidents: number;
  avg_alertness_level: number;
}

export const useRealtimeSession = (sessionId?: string) => {
  const [session, setSession] = useState<SessionUpdate | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!sessionId) return;

    let channel: RealtimeChannel;

    const setupRealtimeSubscription = async () => {
      channel = supabase
        .channel(`session-${sessionId}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'sessions',
            filter: `id=eq.${sessionId}`,
          },
          (payload) => {
            console.log('Session updated:', payload);
            setSession(payload.new as SessionUpdate);
          }
        )
        .subscribe();
      
      setIsConnected(true);
      console.log('Connected to session updates');
    };

    setupRealtimeSubscription();

    return () => {
      if (channel) {
        channel.unsubscribe();
        setIsConnected(false);
      }
    };
  }, [sessionId]);

  return { session, isConnected };
};
