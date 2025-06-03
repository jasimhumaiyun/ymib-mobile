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
          qc.setQueryData<BottleMapPoint[]>(['bottles-map'], old =>
            old ? [...old, { id: bottle_id, status: 'adrift', lat, lon }] : old
          );
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [qc]);

  return query;
} 