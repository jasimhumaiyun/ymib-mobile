import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AppState } from 'react-native';
import { BottleTrailMarker } from '../types/bottle';

export function useBottles(isMapActive: boolean = true, username?: string) {
  const qc = useQueryClient();

  // Fetch bottle trail data - all actions that happened in bottle journeys
  const query = useQuery({
    queryKey: ['bottles-trail', username],
    queryFn: async (): Promise<BottleTrailMarker[]> => {
      // Fetching bottle trail data from database
      
      const markers: BottleTrailMarker[] = [];
      
      // First, get all bottles with their current info
      const { data: bottles, error: bottlesError } = await supabase
        .from('bottles')
        .select('id, status, lat, lon, message, photo_url, created_at');
      
      if (bottlesError) throw bottlesError;
      
      // For each bottle, get its complete event history
      for (const bottle of bottles) {
        // Try to get events with the standard fields
        let eventsQuery = supabase
          .from('bottle_events')
          .select('id, event_type, lat, lon, message, photo_url, created_at, tosser_name, finder_name')
          .eq('bottle_id', bottle.id)
          .order('created_at', { ascending: true });
        
        // If username is provided, filter for user-specific events
        if (username) {
          eventsQuery = eventsQuery.or(`tosser_name.eq.${username},finder_name.eq.${username}`);
        }
        
        const { data: events, error: eventsError } = await eventsQuery;
        
        if (eventsError) {
          console.error('Error fetching events for bottle', bottle.id, eventsError);
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
            
            if (eventType === 'cast_away') {
              let actionType: 'created' | 'found' | 'retossed';
              
              // Count only cast_away events for indexing
              const castAwayIndex = events.slice(0, index + 1).filter(e => e.event_type === 'cast_away').length - 1;
              
              if (castAwayIndex === 0) {
                actionType = 'created'; // First cast_away is CREATED (orange)
              } else {
                actionType = 'retossed'; // Subsequent cast_away events are RETOSSED (blue)
              }
              markers.push({
                id: `${bottle.id}-${eventType}-${event.id || `${index}-${Date.now()}-${Math.random()}`}`, // Absolutely unique ID
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
              markers.push({
                id: `${bottle.id}-${eventType}-${event.id || `${index}-${Date.now()}-${Math.random()}`}`, // Absolutely unique ID
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
      
      // Created trail markers from bottles
      return markers;
    }
  });

  // Smart polling - refresh on map open + every 5 minutes if constantly open
  useEffect(() => {
    if (!isMapActive) {
      return;
    }
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
          qc.invalidateQueries({ queryKey: ['bottles-trail'] });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bottle_events' },
        (payload: any) => {
          qc.invalidateQueries({ queryKey: ['bottles-trail'] });
        }
      )
      .subscribe();

    // Fallback: Refresh every 5 minutes only if map stays open
          const pollInterval = setInterval(() => {
        if (AppState.currentState === 'active') {
          qc.invalidateQueries({ queryKey: ['bottles-trail'] });
        }
      }, 300000); // 5 minutes = 300,000ms
        
      return () => { 
        clearInterval(pollInterval);
        supabase.removeChannel(channel); 
      };
  }, [qc, isMapActive]);

  return query;
} 