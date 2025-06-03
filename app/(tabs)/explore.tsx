import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { useBottles, BottleMapPoint } from '../../src/hooks/useBottles';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

type FilterType = 'all' | 'tossed' | 'found';

export default function ExploreScreen() {
  const [filter, setFilter] = useState<FilterType>('all');
  const { data: bottles, isLoading, error } = useBottles();

  const filteredBottles = bottles?.filter(bottle => {
    if (filter === 'all') return true;
    if (filter === 'tossed') return bottle.status === 'adrift';
    if (filter === 'found') return bottle.status === 'found';
    return true;
  }) || [];

  const handleMarkerPress = (bottle: BottleMapPoint) => {
    console.log('Bottle', bottle.id);
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
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.segmentText, filter === 'all' && styles.activeSegmentText]}>
            All
          </Text>
        </Pressable>
        <Pressable
          style={[styles.segment, filter === 'tossed' && styles.activeSegment]}
          onPress={() => setFilter('tossed')}
        >
          <Text style={[styles.segmentText, filter === 'tossed' && styles.activeSegmentText]}>
            Tossed
          </Text>
        </Pressable>
        <Pressable
          style={[styles.segment, filter === 'found' && styles.activeSegment]}
          onPress={() => setFilter('found')}
        >
          <Text style={[styles.segmentText, filter === 'found' && styles.activeSegmentText]}>
            Found
          </Text>
        </Pressable>
      </View>

      {/* Map */}
      <MapView
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={{
          latitude: 40.7128,
          longitude: -74.0060,
          latitudeDelta: 50,
          longitudeDelta: 50,
        }}
      >
        {filteredBottles.map((bottle) => (
          <Marker
            key={bottle.id}
            coordinate={{
              latitude: bottle.lat,
              longitude: bottle.lon,
            }}
            pinColor={bottle.status === 'adrift' ? '#2196F3' : '#4CAF50'}
            onPress={() => handleMarkerPress(bottle)}
          />
        ))}
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