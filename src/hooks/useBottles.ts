import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useQuery, useQueryClient } from '@tanstack/react-query';

export interface BottleMapPoint {
  id: string;
  status: 'adrift' | 'found';
  lat: number;
  lon: number;
}

export function useBottles() {
  const qc = useQueryClient();

  // initial fetch
  const query = useQuery({
    queryKey: ['bottles-map'],
    queryFn: async (): Promise<BottleMapPoint[]> => {
      const { data, error } = await supabase
        .from('bottles')
        .select('id, status, lat, lon');
      if (error) throw error;
      return data.map(item => ({
        id: item.id,
        status: item.status as 'adrift' | 'found',
        lat: item.lat,
        lon: item.lon
      }));
    }
  });

  // realtime updates
  useEffect(() => {
    const channel = supabase
      .channel('public:bottle_events')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'bottle_events', filter: 'type=eq.cast_away' },
        (payload: any) => {
          const { bottle_id, lat, lon } = payload.new as any;
          qc.setQueryData<BottleMapPoint[]>(['bottles-map'], old => {
            if (!old) return old;
            
            // Check if bottle already exists (re-toss case)
            const existingIndex = old.findIndex(bottle => bottle.id === bottle_id);
            if (existingIndex !== -1) {
              // Update existing bottle to adrift status with new coordinates
              const updated = [...old];
              updated[existingIndex] = { id: bottle_id, status: 'adrift', lat, lon };
              return updated;
            } else {
              // Add new bottle
              return [...old, { id: bottle_id, status: 'adrift', lat, lon }];
            }
          });
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'bottle_events', filter: 'type=eq.found' },
        (payload: any) => {
          const { bottle_id } = payload.new as any;
          qc.setQueryData<BottleMapPoint[]>(['bottles-map'], old =>
            old ? old.map(bottle => 
              bottle.id === bottle_id 
                ? { ...bottle, status: 'found' as const }
                : bottle
            ) : old
          );
        }
      )
      .subscribe();
    return () => { 
      supabase.removeChannel(channel); 
    };
  }, [qc]);

  return query;
} 