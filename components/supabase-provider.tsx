'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';
import type { Session, User } from '@supabase/supabase-js';

type SupabaseContextType = {
  session: Session | null;
  user: User | null;
  supabase: ReturnType<typeof createBrowserSupabaseClient>;
};

const SupabaseContext = createContext<SupabaseContextType | null>(null);

export function useSupabase() {
  const context = useContext(SupabaseContext);
  if (!context) {
    throw new Error('useSupabase must be used within SupabaseProvider');
  }
  return context;
}

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);

  const supabase = useMemo(() => createBrowserSupabaseClient(), []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession);
      setUser(initialSession?.user ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  return (
    <SupabaseContext.Provider value={{ session, user, supabase }}>
      {children}
    </SupabaseContext.Provider>
  );
}

