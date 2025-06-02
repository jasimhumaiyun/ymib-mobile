import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { PostgrestError } from '@supabase/supabase-js';

export function usePingSupabase() {
  const [healthy, setHealthy] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from('pg_roles')        // harmless, always exists
      .select('rolname', { head: true })
      .then(({ error }: { error: PostgrestError | null }) => {
        if (error) setError(error.message);
        else setHealthy(true);
      });
  }, []);

  return { healthy, error };
} 