import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface SessionData {
  id: string;
  start_time: string;
  end_time?: string;
  duration?: number;
  total_drowsiness_incidents: number;
  avg_alertness_level: number;
  max_alertness_level: number;
}

export const useSessionData = () => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSessions = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('start_time', { ascending: false })
        .limit(50);

      if (error) throw error;
      setSessions(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch sessions');
      console.error('Error fetching sessions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [user]);

  const createSession = async () => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('sessions')
        .insert({
          user_id: user.id,
          start_time: new Date().toISOString(),
          total_drowsiness_incidents: 0,
          avg_alertness_level: 100,
          max_alertness_level: 100,
        })
        .select()
        .single();

      if (error) throw error;
      setSessions(prev => [data, ...prev]);
      return data;
    } catch (err) {
      console.error('Error creating session:', err);
      return null;
    }
  };

  const updateSession = async (
    sessionId: string,
    updates: Partial<SessionData>
  ) => {
    try {
      const { error } = await supabase
        .from('sessions')
        .update(updates)
        .eq('id', sessionId);

      if (error) throw error;
      
      setSessions(prev =>
        prev.map(s => (s.id === sessionId ? { ...s, ...updates } : s))
      );
    } catch (err) {
      console.error('Error updating session:', err);
    }
  };

  const deleteSession = async (sessionId: string) => {
    try {
      const { error } = await supabase
        .from('sessions')
        .delete()
        .eq('id', sessionId);

      if (error) throw error;
      setSessions(prev => prev.filter(s => s.id !== sessionId));
    } catch (err) {
      console.error('Error deleting session:', err);
    }
  };

  return {
    sessions,
    isLoading,
    error,
    createSession,
    updateSession,
    deleteSession,
    refetch: fetchSessions,
  };
};
