import { useEffect } from 'react';
import { supabase, isConfigured } from '@/src/services/supabase/client';
import { useAuthStore } from '@/src/stores/authStore';

export function useAuthListener() {
  const setSession = useAuthStore((s) => s.setSession);
  const setLoading = useAuthStore((s) => s.setLoading);

  useEffect(() => {
    if (!isConfigured) {
      console.warn('Supabase not configured. Running in offline mode.');
      setLoading(false);
      return;
    }

    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        setSession(session);
      })
      .catch(() => {
        setLoading(false);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, [setSession, setLoading]);
}
