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
  event_id?: string; // For database event tracking
}

export function useBottles(isMapActive: boolean = true) {
  const qc = useQueryClient();

  // Fetch bottle trail data - all actions that happened in bottle journeys
  const query = useQuery({
    queryKey: ['bottles-trail'],
    queryFn: async (): Promise<BottleTrailMarker[]> => {
      console.log('🗺️ Fetching bottle trail data from database...');
      
      const markers: BottleTrailMarker[] = [];
      
      // First, get all bottles with their current info
      const { data: bottles, error: bottlesError } = await supabase
        .from('bottles')
        .select('id, status, lat, lon, message, photo_url, created_at');
      
      if (bottlesError) throw bottlesError;
      
      // For each bottle, get its complete event history
      for (const bottle of bottles) {
        // Try to get events with the standard fields
        const { data: events, error: eventsError } = await supabase
          .from('bottle_events')
          .select('id, event_type, lat, lon, message, photo_url, created_at')
          .eq('bottle_id', bottle.id)
          .order('created_at', { ascending: true });
        
        if (eventsError) {
          console.error('❌ Error fetching events for bottle', bottle.id, eventsError);
          // If events table query fails, just use the bottle data as CREATED
          markers.push({
            id: `${bottle.id}-original`,
            bottleId: bottle.id,
            actionType: 'created',
            status: bottle.status,
            lat: bottle.lat,
            lon: bottle.lon,
            message: bottle.message || 'No message',
            photo_url: bottle.photo_url,
            created_at: bottle.created_at
          });
          continue;
        }
        
        // Create markers for each action in the bottle's journey
        if (events && events.length > 0) {
          events.forEach((event, index) => {
            const eventType = event.event_type;
            const eventMessage = event.message || 'No message';
            
            console.log(`🔍 Processing event for bottle ${bottle.id.slice(0, 8)}: type=${eventType}, message="${eventMessage.slice(0, 50)}..."`);
            
            if (eventType === 'cast_away') {
              let actionType: 'created' | 'found' | 'retossed';
              
              // Count only cast_away events for indexing
              const castAwayIndex = events.slice(0, index + 1).filter(e => e.event_type === 'cast_away').length - 1;
              
              if (castAwayIndex === 0) {
                actionType = 'created'; // First cast_away is CREATED (orange)
              } else {
                actionType = 'retossed'; // Subsequent cast_away events are RETOSSED (blue)
              }
              
              console.log(`🔍 Creating ${actionType} marker for bottle ${bottle.id.slice(0, 8)}`);
              markers.push({
                id: `${bottle.id}-${event.id}`,
                bottleId: bottle.id,
                actionType,
                status: bottle.status,
                lat: event.lat,
                lon: event.lon,
                message: eventMessage,
                photo_url: event.photo_url,
                created_at: event.created_at,
                event_id: event.id
              });
            } else if (eventType === 'found') {
              // EVERY found event creates a green marker, including replies
              console.log(`🔍 Creating found marker for bottle ${bottle.id.slice(0, 8)}`);
              markers.push({
                id: `${bottle.id}-${event.id}`,
                bottleId: bottle.id,
                actionType: 'found',
                status: bottle.status,
                lat: event.lat,
                lon: event.lon,
                message: eventMessage,
                photo_url: event.photo_url,
                created_at: event.created_at,
                event_id: event.id
              });
            }
          });
        } else {
          // If no events, use the original bottle data as CREATED
          markers.push({
            id: `${bottle.id}-original`,
            bottleId: bottle.id,
            actionType: 'created',
            status: bottle.status,
            lat: bottle.lat,
            lon: bottle.lon,
            message: bottle.message || 'No message',
            photo_url: bottle.photo_url,
            created_at: bottle.created_at
          });
        }
      }
      
      console.log(`🗺️ Created ${markers.length} trail markers from ${bottles.length} bottles`);
      return markers;
    }
  });

  // Smart polling - refresh on map open + every 5 minutes if constantly open
  useEffect(() => {
    if (!isMapActive) {
      console.log('⏸️ Map not active, skipping polling');
      return;
    }

    console.log('🔄 Map opened - refreshing bottle trail...');
    // Immediate refresh when map opens
    qc.invalidateQueries({ queryKey: ['bottles-trail'] });
    
    // Try real-time first (in case it becomes available)
    const channelName = `bottles-realtime-${Date.now()}-${Math.random()}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bottles' },
        (payload: any) => {
          console.log('🔥 Real-time event received:', payload.eventType);
          qc.invalidateQueries({ queryKey: ['bottles-trail'] });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bottle_events' },
        (payload: any) => {
          console.log('🔥 Real-time bottle event received:', payload.eventType);
          qc.invalidateQueries({ queryKey: ['bottles-trail'] });
        }
      )
      .subscribe((status) => {
        console.log('📡 Real-time status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('✅ Real-time working! No need for polling.');
          return;
        }
      });

    // Fallback: Refresh every 5 minutes only if map stays open
    const pollInterval = setInterval(() => {
      if (AppState.currentState === 'active') {
        console.log('🔄 5-minute refresh while map is open...');
        qc.invalidateQueries({ queryKey: ['bottles-trail'] });
      }
    }, 300000); // 5 minutes = 300,000ms
      
    return () => { 
      console.log('🛑 Cleaning up bottles trail polling');
      clearInterval(pollInterval);
      supabase.removeChannel(channel); 
    };
  }, [qc, isMapActive]);

  return query;
} 