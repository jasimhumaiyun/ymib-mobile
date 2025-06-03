import React, { useState, useMemo } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { useBottles, BottleMapPoint } from '../../src/hooks/useBottles';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';

type FilterType = 'all' | 'tossed' | 'found';

export default function ExploreScreen() {
  const [filter, setFilter] = useState<FilterType>('all');
  const [region, setRegion] = useState({
    latitude: 40.7128,
    longitude: -74.0060,
    latitudeDelta: 50,
    longitudeDelta: 50,
  });
  
  const qc = useQueryClient();
  const { data: bottles, isLoading, error } = useBottles(true);

  // Refresh map data whenever this tab is focused
  useFocusEffect(
    React.useCallback(() => {
      console.log('🗺️ Explore tab focused - refreshing map data...');
      qc.invalidateQueries({ queryKey: ['bottles-map'] });
    }, [qc])
  );

  // Filter bottles and add iOS jitter to prevent overlapping
  const filteredBottles = useMemo(() => {
    if (!bottles) return [];
    
    const filtered = bottles.filter(bottle => {
      if (filter === 'all') return true;
      if (filter === 'tossed') return bottle.status === 'adrift';
      if (filter === 'found') return bottle.status === 'found';
      return false;
    });

    // iOS-specific fix: Add deterministic jitter to prevent overlapping markers
    if (Platform.OS === 'ios') {
      const coordMap = new Map<string, BottleMapPoint[]>();
      
      // Group bottles by coordinate
      filtered.forEach(bottle => {
        const coordKey = `${bottle.lat.toFixed(5)}:${bottle.lon.toFixed(5)}`;
        if (!coordMap.has(coordKey)) {
          coordMap.set(coordKey, []);
        }
        coordMap.get(coordKey)!.push(bottle);
      });
      
      // Apply jitter to overlapping bottles
      const result: BottleMapPoint[] = [];
      coordMap.forEach(bottlesAtCoord => {
        if (bottlesAtCoord.length === 1) {
          result.push(bottlesAtCoord[0]);
        } else {
          // Multiple bottles at same coordinate - apply jitter
          bottlesAtCoord.forEach((bottle, index) => {
            if (index === 0) {
              result.push(bottle);
            } else {
              const angle = (index * 2 * Math.PI) / bottlesAtCoord.length;
              const distance = 0.0001 * index;
              const jitterLat = distance * Math.cos(angle);
              const jitterLon = distance * Math.sin(angle);
              
              result.push({
                ...bottle,
                lat: bottle.lat + jitterLat,
                lon: bottle.lon + jitterLon,
              });
            }
          });
        }
      });
      
      return result;
    }
    
    // Android works fine without jitter
    return filtered;
  }, [bottles, filter]);

  // Memoize markers to prevent unnecessary re-renders
  const markers = useMemo(() => {
    // Sort bottles to render green pins (found) on top of blue pins (adrift)
    const sortedBottles = [...filteredBottles].sort((a, b) => {
      // Green pins (found) should render last (on top)
      if (a.status === 'found' && b.status === 'adrift') return 1;
      if (a.status === 'adrift' && b.status === 'found') return -1;
      return 0;
    });

    return sortedBottles.map(bottle => (
      <Marker
        key={bottle.id}
        coordinate={{ latitude: bottle.lat, longitude: bottle.lon }}
        pinColor={bottle.status === 'adrift' ? '#2196F3' : '#4CAF50'}
        title={`Bottle ${bottle.id.slice(-4)}`}
        description={`Status: ${bottle.status}`}
        tracksViewChanges={false}
        zIndex={bottle.status === 'found' ? 1000 : 100} // Green pins on top
        opacity={bottle.status === 'found' ? 1.0 : 0.8} // Green pins more prominent
      />
    ));
  }, [filteredBottles]);

  const handleFilterChange = (newFilter: FilterType) => {
    setFilter(newFilter);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.loadingText}>Loading bottles...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>❌ Error loading bottles</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Segmented Control */}
      <View style={styles.segmentedControl}>
        <Pressable
          style={[styles.segment, filter === 'all' && styles.activeSegment]}
          onPress={() => handleFilterChange('all')}
        >
          <Text style={[styles.segmentText, filter === 'all' && styles.activeSegmentText]}>
            All ({bottles?.length || 0})
          </Text>
        </Pressable>
        <Pressable
          style={[styles.segment, filter === 'tossed' && styles.activeSegment]}
          onPress={() => handleFilterChange('tossed')}
        >
          <Text style={[styles.segmentText, filter === 'tossed' && styles.activeSegmentText]}>
            Tossed ({bottles?.filter(b => b.status === 'adrift').length || 0})
          </Text>
        </Pressable>
        <Pressable
          style={[styles.segment, filter === 'found' && styles.activeSegment]}
          onPress={() => handleFilterChange('found')}
        >
          <Text style={[styles.segmentText, filter === 'found' && styles.activeSegmentText]}>
            Found ({bottles?.filter(b => b.status === 'found').length || 0})
          </Text>
        </Pressable>
      </View>

      {/* Map */}
      <MapView
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        region={region}
        onRegionChangeComplete={setRegion}
        showsUserLocation={true}
        showsMyLocationButton={true}
        showsPointsOfInterest={false}
        showsBuildings={false}
        showsTraffic={false}
        showsIndoors={false}
        mapType="standard"
        minZoomLevel={2}
        maxZoomLevel={10}
      >
        {markers}
      </MapView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: 'red',
  },
  segmentedControl: {
    flexDirection: 'row',
    margin: 16,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 4,
  },
  segment: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderRadius: 6,
  },
  activeSegment: {
    backgroundColor: '#2196F3',
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  activeSegmentText: {
    color: '#fff',
  },
  map: {
    flex: 1,
  },
}); 