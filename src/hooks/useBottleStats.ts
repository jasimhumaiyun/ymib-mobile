import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export interface BottleStats {
  created: number;
  found: number;
  retossed: number;
}

export function useBottleStats() {
  return useQuery({
    queryKey: ['bottle-stats'],
    queryFn: async (): Promise<BottleStats> => {

      
      // Get all bottle events to calculate proper stats
      const { data: events, error } = await supabase
        .from('bottle_events')
        .select('event_type, bottle_id');
      
      if (error) {
        console.error('❌ Error fetching bottle events for stats:', error);
        throw error;
      }
      
      // Count unique bottles for each action type
      const createdBottles = new Set<string>();
      const foundBottles = new Set<string>();
      const retossedBottles = new Set<string>();
      
      // Group events by bottle_id to properly count actions
      const bottleEventMap = new Map<string, { cast_away: number; found: number }>();
      
      events?.forEach(event => {
        if (!bottleEventMap.has(event.bottle_id)) {
          bottleEventMap.set(event.bottle_id, { cast_away: 0, found: 0 });
        }
        
        const bottleEvents = bottleEventMap.get(event.bottle_id)!;
        if (event.event_type === 'cast_away') {
          bottleEvents.cast_away++;
        } else if (event.event_type === 'found') {
          bottleEvents.found++;
        }
      });
      
      // Count bottles by action type
      bottleEventMap.forEach((events, bottleId) => {
        // Every bottle with at least 1 cast_away is "created"
        if (events.cast_away >= 1) {
          createdBottles.add(bottleId);
        }
        
        // Bottles with found events are "found"
        if (events.found >= 1) {
          foundBottles.add(bottleId);
        }
        
        // Bottles with 2+ cast_away events are "retossed"
        if (events.cast_away >= 2) {
          retossedBottles.add(bottleId);
        }
      });
      
      const stats = {
        created: createdBottles.size,
        found: foundBottles.size,
        retossed: retossedBottles.size
      };
      

      return stats;
    },
    staleTime: 30000, // Cache for 30 seconds
    refetchOnWindowFocus: true
  });
} 