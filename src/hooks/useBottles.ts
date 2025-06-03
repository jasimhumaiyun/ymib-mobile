import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AppState } from 'react-native';

export interface BottleMapPoint {
  id: string;
  status: 'adrift' | 'found';
  lat: number;
  lon: number;
}

export function useBottles(isMapActive: boolean = true) {
  const qc = useQueryClient();

  // initial fetch
  const query = useQuery({
    queryKey: ['bottles-map'],
    queryFn: async (): Promise<BottleMapPoint[]> => {
      console.log('🔄 Fetching bottles from database...');
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

  // Smart polling - refresh on map open + every 5 minutes if constantly open
  useEffect(() => {
    if (!isMapActive) {
      console.log('⏸️ Map not active, skipping polling');
      return;
    }

    console.log('🔄 Map opened - refreshing bottles...');
    // Immediate refresh when map opens
    qc.invalidateQueries({ queryKey: ['bottles-map'] });
    
    // Try real-time first (in case it becomes available)
    const channel = supabase
      .channel('bottles-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bottles' },
        (payload: any) => {
          console.log('🔥 Real-time event received:', payload.eventType);
          qc.invalidateQueries({ queryKey: ['bottles-map'] });
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
        qc.invalidateQueries({ queryKey: ['bottles-map'] });
      }
    }, 300000); // 5 minutes = 300,000ms
      
    return () => { 
      console.log('🛑 Cleaning up bottles polling');
      clearInterval(pollInterval);
      supabase.removeChannel(channel); 
    };
  }, [qc, isMapActive]);

  return query;
} 