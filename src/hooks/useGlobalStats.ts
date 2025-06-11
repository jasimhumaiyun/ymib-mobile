import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export interface GlobalBottleStats {
  totalBottles: number;
  totalFound: number;
  totalRetossed: number;
  activeBottles: number; // bottles currently adrift
}

export function useGlobalStats() {
  return useQuery({
    queryKey: ['global-bottle-stats'],
    queryFn: async (): Promise<GlobalBottleStats> => {
      try {
        // Get total bottles count
        const { count: totalBottles, error: bottlesError } = await supabase
          .from('bottles')
          .select('*', { count: 'exact', head: true });

        if (bottlesError) {
          console.error('❌ Error fetching total bottles:', bottlesError);
          throw bottlesError;
        }

        // Get bottles currently adrift
        const { count: activeBottles, error: activeError } = await supabase
          .from('bottles')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'adrift');

        if (activeError) {
          console.error('❌ Error fetching active bottles:', activeError);
          throw activeError;
        }

        // Get all bottle events to count found and retossed
        const { data: events, error: eventsError } = await supabase
          .from('bottle_events')
          .select('event_type, bottle_id');

        if (eventsError) {
          console.error('❌ Error fetching bottle events:', eventsError);
          throw eventsError;
        }

        // Count found and retossed events
        let totalFound = 0;
        let totalRetossed = 0;
        const retossedBottles = new Set<string>();

        events?.forEach(event => {
          if (event.event_type === 'found') {
            totalFound++;
          } else if (event.event_type === 'cast_away') {
            // If this bottle has been cast away before, it's a retoss
            if (retossedBottles.has(event.bottle_id)) {
              totalRetossed++;
            } else {
              retossedBottles.add(event.bottle_id);
            }
          }
        });

        const stats: GlobalBottleStats = {
          totalBottles: totalBottles || 0,
          totalFound,
          totalRetossed,
          activeBottles: activeBottles || 0
        };

        console.log('📊 Global stats:', stats);
        return stats;
      } catch (error) {
        console.error('❌ Error fetching global stats:', error);
        // Return default stats on error
        return {
          totalBottles: 0,
          totalFound: 0,
          totalRetossed: 0,
          activeBottles: 0
        };
      }
    },
    staleTime: 60000, // Cache for 1 minute
    refetchOnWindowFocus: true
  });
} 