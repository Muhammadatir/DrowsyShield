import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isSupabaseConfigured = import.meta.env.VITE_SUPABASE_URL && 
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY && 
    import.meta.env.VITE_SUPABASE_URL !== 'https://placeholder.supabase.co' && 
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY !== 'placeholder-key';
  
  console.log('Supabase Config Check:', {
    url: import.meta.env.VITE_SUPABASE_URL,
    hasKey: !!import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    isConfigured: isSupabaseConfigured
  });

  useEffect(() => {
    if (!isSupabaseConfigured) {
      console.log('Running in demo mode - Supabase not configured');
      setIsLoading(false);
      return;
    } else {
      console.log('Running with Supabase database');
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    }).catch(() => {
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [isSupabaseConfigured]);

  const signUp = async (email: string, password: string) => {
    if (!isSupabaseConfigured) {
      // Demo mode - simulate successful signup
      const demoUser = { id: 'demo-user', email } as User;
      setUser(demoUser);
      setSession({ user: demoUser } as Session);
      return { error: null };
    }
    
    try {
      const redirectUrl = `${window.location.origin}/`;
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl
        }
      });
      return { error: error as Error | null };
    } catch (error) {
      return { error: new Error('Authentication service unavailable. Please try again later.') };
    }
  };

  const signIn = async (email: string, password: string) => {
    if (!isSupabaseConfigured) {
      // Demo mode - simulate successful login
      const demoUser = { id: 'demo-user', email } as User;
      setUser(demoUser);
      setSession({ user: demoUser } as Session);
      return { error: null };
    }
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { error: error as Error | null };
    } catch (error) {
      return { error: new Error('Authentication service unavailable. Please try again later.') };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, signUp, signIn, signOut, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
