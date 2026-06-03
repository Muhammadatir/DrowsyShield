import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

interface DrowsinessIncident {
  id: string;
  session_id: string;
  user_id: string;
  incident_time: string;
  severity_level: number;
  eye_closure_duration?: number;
  alertness_level_before?: number;
  alertness_level_after?: number;
}

export const useRealtimeIncidents = (sessionId?: string) => {
  const [incidents, setIncidents] = useState<DrowsinessIncident[]>([]);
  const [latestIncident, setLatestIncident] = useState<DrowsinessIncident | null>(null);

  useEffect(() => {
    if (!sessionId) return;

    let channel: RealtimeChannel;

    const setupRealtimeSubscription = async () => {
      // Fetch existing incidents
      const { data } = await supabase
        .from('drowsiness_incidents')
        .select('*')
        .eq('session_id', sessionId)
        .order('incident_time', { ascending: false });

      if (data) {
        setIncidents(data);
      }

      // Subscribe to new incidents
      channel = supabase
        .channel(`incidents-${sessionId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'drowsiness_incidents',
            filter: `session_id=eq.${sessionId}`,
          },
          (payload) => {
            console.log('New incident detected:', payload);
            const newIncident = payload.new as DrowsinessIncident;
            setLatestIncident(newIncident);
            setIncidents((prev) => [newIncident, ...prev]);
          }
        )
        .subscribe();
    };

    setupRealtimeSubscription();

    return () => {
      if (channel) {
        channel.unsubscribe();
      }
    };
  }, [sessionId]);

  return { incidents, latestIncident };
};
