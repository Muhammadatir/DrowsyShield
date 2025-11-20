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
  const isSupabaseConfigured = import.meta.env.VITE_SUPABASE_URL && 
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY && 
    import.meta.env.VITE_SUPABASE_URL !== 'https://placeholder.supabase.co' && 
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY !== 'placeholder-key';
  
  console.log('Session Data - Supabase configured:', isSupabaseConfigured);

  const fetchSessions = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      if (!isSupabaseConfigured) {
        // Demo mode - use localStorage
        console.log('Using localStorage for sessions (demo mode)');
        const stored = localStorage.getItem('demo_sessions');
        const demoSessions = stored ? JSON.parse(stored) : [];
        setSessions(demoSessions);
      } else {
        console.log('Using Supabase for sessions');
        const { data, error } = await supabase
          .from('sessions')
          .select('*')
          .eq('user_id', user.id)
          .order('start_time', { ascending: false })
          .limit(50);

        if (error) throw error;
        setSessions(data || []);
      }
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
      const newSession = {
        id: crypto.randomUUID(),
        user_id: user.id,
        start_time: new Date().toISOString(),
        total_drowsiness_incidents: 0,
        avg_alertness_level: 100,
        max_alertness_level: 100,
      };

      if (!isSupabaseConfigured) {
        // Demo mode - save to localStorage
        const stored = localStorage.getItem('demo_sessions');
        const sessions = stored ? JSON.parse(stored) : [];
        sessions.unshift(newSession);
        localStorage.setItem('demo_sessions', JSON.stringify(sessions));
        setSessions(prev => [newSession, ...prev]);
        return newSession;
      } else {
        const { data, error } = await supabase
          .from('sessions')
          .insert(newSession)
          .select()
          .single();

        if (error) throw error;
        setSessions(prev => [data, ...prev]);
        return data;
      }
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
      if (!isSupabaseConfigured) {
        // Demo mode - update localStorage
        const stored = localStorage.getItem('demo_sessions');
        const sessions = stored ? JSON.parse(stored) : [];
        const updatedSessions = sessions.map((s: SessionData) => 
          s.id === sessionId ? { ...s, ...updates } : s
        );
        localStorage.setItem('demo_sessions', JSON.stringify(updatedSessions));
        setSessions(updatedSessions);
      } else {
        const { error } = await supabase
          .from('sessions')
          .update(updates)
          .eq('id', sessionId);

        if (error) throw error;
        
        setSessions(prev =>
          prev.map(s => (s.id === sessionId ? { ...s, ...updates } : s))
        );
      }
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
