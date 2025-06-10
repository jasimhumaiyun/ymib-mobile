import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AppState } from 'react-native';

export interface BottleTrailMarker {
  id: string; // Unique ID for this marker (bottle_id + event_id)
  bottleId: string; // Original bottle ID
  actionType: 'created' | 'found' | 'retossed'; // Type of action
  status: 'adrift' | 'found'; // Current bottle status (for reference)
  lat: number;
  lon: number;
  message: string;
  photo_url?: string;
  created_at: string;
  event_id: string; // For database event tracking
  tosser_name?: string;
  finder_name?: string;
}

export function useBottleTrail(isMapActive: boolean = true) {
  const qc = useQueryClient();

  // Fetch complete bottle trail - ALL actions that ever happened
  const query = useQuery({
    queryKey: ['bottles-complete-trail'],
    queryFn: async (): Promise<BottleTrailMarker[]> => {

      
      const markers: BottleTrailMarker[] = [];
      
      // Get all bottles with their current info
      const { data: bottles, error: bottlesError } = await supabase
        .from('bottles')
        .select('id, status, message, photo_url, created_at');
      
      if (bottlesError) throw bottlesError;
      
      // Get ALL bottle events to create trail markers
      const { data: allEvents, error: eventsError } = await supabase
        .from('bottle_events')
        .select('*')
        .order('created_at', { ascending: true });
      
      if (eventsError) throw eventsError;
      
      // Create markers for each event
      allEvents?.forEach(event => {
        const bottle = bottles.find(b => b.id === event.bottle_id);
        if (!bottle) return;
        
        let actionType: 'created' | 'found' | 'retossed';
        
        if (event.event_type === 'cast_away') {
          // Check if this is the first cast_away for this bottle
          const previousCastAways = allEvents.filter(e => 
            e.bottle_id === event.bottle_id && 
            e.event_type === 'cast_away' && 
            new Date(e.created_at) < new Date(event.created_at)
          );
          
          actionType = previousCastAways.length === 0 ? 'created' : 'retossed';
        } else if (event.event_type === 'found') {
          actionType = 'found';
        } else {
          return; // Skip unknown event types
        }
        
        markers.push({
          id: `${event.bottle_id}-${event.id}`,
          bottleId: event.bottle_id,
          actionType,
          status: bottle.status,
          lat: event.lat,
          lon: event.lon,
          message: event.message || bottle.message || 'No message',
          photo_url: event.photo_url || bottle.photo_url,
          created_at: event.created_at,
          event_id: event.id,
          tosser_name: event.tosser_name,
          finder_name: event.finder_name
        });
      });
      

      return markers;
    }
  });

  // Smart polling - refresh on map open + every 5 minutes if constantly open
  useEffect(() => {
    if (!isMapActive) {
      console.log('⏸️ Map not active, skipping polling');
      return;
    }


    // Immediate refresh when map opens
    qc.invalidateQueries({ queryKey: ['bottles-complete-trail'] });
    
    // Try real-time first (in case it becomes available)
    const channelName = `bottles-trail-realtime-${Date.now()}-${Math.random()}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bottles' },
        (payload: any) => {
          qc.invalidateQueries({ queryKey: ['bottles-complete-trail'] });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bottle_events' },
        (payload: any) => {
          qc.invalidateQueries({ queryKey: ['bottles-complete-trail'] });
        }
      )
      .subscribe();

    // Fallback: Refresh every 5 minutes only if map stays open
    const pollInterval = setInterval(() => {
      if (AppState.currentState === 'active') {

        qc.invalidateQueries({ queryKey: ['bottles-complete-trail'] });
      }
    }, 300000); // 5 minutes = 300,000ms
      
          return () => { 
        clearInterval(pollInterval);
        supabase.removeChannel(channel); 
      };
  }, [qc, isMapActive]);

  return query;
} 