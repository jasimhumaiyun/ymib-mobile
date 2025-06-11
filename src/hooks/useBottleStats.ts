import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useUserProfiles } from './useUserProfiles';

export interface BottleStats {
  created: number;
  found: number;
  retossed: number;
}

export function useBottleStats() {
  const { username } = useUserProfiles();
  
  return useQuery({
    queryKey: ['bottle-stats', username],
    queryFn: async (): Promise<BottleStats> => {
      if (!username) {
        return { created: 0, found: 0, retossed: 0 };
      }
      
      // Get all bottle events to properly determine created vs retossed
      const { data: events, error } = await supabase
        .from('bottle_events')
        .select('event_type, bottle_id, tosser_name, finder_name, created_at')
        .order('created_at', { ascending: true });
      
      if (error) {
        console.error('❌ Error fetching bottle events for stats:', error);
        throw error;
      }
      
      // Count user-specific bottle actions
      let created = 0;
      let found = 0;
      let retossed = 0;
      
      // Group events by bottle
      const bottleEvents = new Map<string, any[]>();
      events?.forEach(event => {
        if (!bottleEvents.has(event.bottle_id)) {
          bottleEvents.set(event.bottle_id, []);
        }
        bottleEvents.get(event.bottle_id)!.push(event);
      });
      
      // Analyze each bottle's events to count correct stats
      bottleEvents.forEach((bottleEventList, bottleId) => {
        const castAwayEvents = bottleEventList.filter(e => e.event_type === 'cast_away');
        const foundEvents = bottleEventList.filter(e => e.event_type === 'found');
        
        // Count user's actions for this bottle
        castAwayEvents.forEach((event, index) => {
          if (event.tosser_name === username) {
            // Check if this user created the bottle (first cast_away globally AND by this user)
            const isGloballyFirst = index === 0;
            const isUserFirst = castAwayEvents.slice(0, index).every(e => e.tosser_name !== username);
            
            if (isGloballyFirst && isUserFirst) {
              // This user created the bottle originally
              created++;
            } else {
              // This is a retoss (either user's subsequent toss OR toss after someone else created)
              retossed++;
            }
          }
        });
        
        // Count found events by this user
        foundEvents.forEach(event => {
          if (event.finder_name === username) {
            found++;
          }
        });
      });
      
      const stats = {
        created,
        found,
        retossed
      };
      

      return stats;
    },
    staleTime: 30000, // Cache for 30 seconds
    refetchOnWindowFocus: true
  });
} 