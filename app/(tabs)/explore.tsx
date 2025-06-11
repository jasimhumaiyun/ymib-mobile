import React, { useState, useMemo } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator, Platform, ImageBackground } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { useBottleTrail } from '../../src/hooks/useBottleTrail';
import { BottleTrailMarker } from '../../src/types/bottle';
import { useGlobalStats } from '../../src/hooks/useGlobalStats';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../src/constants/theme';

type FilterType = 'all' | 'created' | 'found' | 'retossed';

// Custom map style for ocean theme
const customMapStyle = [
  {
    "featureType": "water",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#004D40" // Deep ocean color from theme
      }
    ]
  },
  {
    "featureType": "landscape",
    "elementType": "geometry.fill",
    "stylers": [
      {
        "color": "#00695C" // Darker sea green for land
      }
    ]
  },
  {
    "featureType": "road",
    "stylers": [
      {
        "visibility": "off" // Hide roads for cleaner look
      }
    ]
  },
  {
    "featureType": "poi",
    "stylers": [
      {
        "visibility": "off" // Hide points of interest
      }
    ]
  },
  {
    "featureType": "administrative",
    "elementType": "labels",
    "stylers": [
      {
        "visibility": "simplified"
      },
      {
        "color": "#80CBC4" // Sea foam for labels
      }
    ]
  },
  {
    "featureType": "administrative.country",
    "elementType": "geometry.stroke",
    "stylers": [
      {
        "color": "#26A69A" // Sea green for borders
      },
      {
        "weight": 0.5
      }
    ]
  }
];

export default function WorldMapScreen() {
  const [filter, setFilter] = useState<FilterType>('all');
  const [region, setRegion] = useState({
    latitude: 20.0,
    longitude: 0.0,
    latitudeDelta: 120,
    longitudeDelta: 120,
  });
  
  const qc = useQueryClient();
  const { data: trailMarkers, isLoading, error } = useBottleTrail(true);
  const { data: globalStats, refetch: refetchGlobalStats } = useGlobalStats();

  // Refresh map data whenever this tab is focused
  useFocusEffect(
    React.useCallback(() => {
      qc.invalidateQueries({ queryKey: ['bottles-complete-trail'] });
      refetchGlobalStats();
    }, [qc, refetchGlobalStats])
  );

  // Filter trail markers with proper spacing
  const filteredMarkers = useMemo(() => {
    if (!trailMarkers) return [];
    
    const filtered = trailMarkers.filter(marker => {
      if (filter === 'all') return true;
      if (filter === 'created') return marker.actionType === 'created';
      if (filter === 'found') return marker.actionType === 'found';
      if (filter === 'retossed') return marker.actionType === 'retossed';
      return false;
    });

    // Apply intelligent spacing for overlapping markers
    const coordMap = new Map<string, BottleTrailMarker[]>();
    
    filtered.forEach(marker => {
      const coordKey = `${marker.lat.toFixed(4)}:${marker.lon.toFixed(4)}`;
      if (!coordMap.has(coordKey)) {
        coordMap.set(coordKey, []);
      }
      coordMap.get(coordKey)!.push(marker);
    });
    
    const result: BottleTrailMarker[] = [];
    coordMap.forEach(markersAtCoord => {
      if (markersAtCoord.length === 1) {
        result.push(markersAtCoord[0]);
      } else {
        markersAtCoord.forEach((marker, index) => {
          if (index === 0) {
            result.push(marker);
          } else {
            const angle = (index * 60) * (Math.PI / 180);
            const distance = 0.0008 * index;
            const latOffset = distance * Math.cos(angle);
            const lonOffset = distance * Math.sin(angle);
            
            result.push({
              ...marker,
              lat: marker.lat + latOffset,
              lon: marker.lon + lonOffset,
            });
          }
        });
      }
    });
    
    return result;
  }, [trailMarkers, filter]);

  // Get marker styling based on action type
  const getMarkerStyle = (marker: BottleTrailMarker) => {
    switch (marker.actionType) {
      case 'created':
        return {
          pinColor: Colors.accent.treasure,
          title: `🆕 Created`,
          description: `"${marker.message.slice(0, 40)}${marker.message.length > 40 ? '...' : ''}"`
        };
      case 'found':
        return {
          pinColor: Colors.accent.seaweed,
          title: `🔍 Found`,
          description: `Bottle discovered and read`
        };
      case 'retossed':
        return {
          pinColor: Colors.secondary[500],
          title: `🔄 Retossed`,
          description: `"${marker.message.slice(0, 40)}${marker.message.length > 40 ? '...' : ''}"`
        };
      default:
        return {
          pinColor: Colors.neutral[400],
          title: `❓ Unknown`,
          description: `Unknown action`
        };
    }
  };

  // Render markers
  const markers = useMemo(() => {
    return filteredMarkers.map(marker => {
      const style = getMarkerStyle(marker);
      
      return (
        <Marker
          key={marker.id}
          coordinate={{ latitude: marker.lat, longitude: marker.lon }}
          pinColor={style.pinColor}
          title={style.title}
          description={style.description}
          tracksViewChanges={false}
        />
      );
    });
  }, [filteredMarkers]);

  // Calculate counts for filters - use global stats for all data
  const counts = useMemo(() => {
    if (!globalStats) {
      return { all: 0, created: 0, found: 0, retossed: 0 };
    }
    
    return {
      all: globalStats.totalBottles,
      created: globalStats.totalBottles, // Total bottles created globally
      found: globalStats.totalFound,
      retossed: globalStats.totalRetossed,
    };
  }, [globalStats]);

  if (isLoading) {
    return (
      <ImageBackground 
        source={require('../../images/homepage_BG_new.png')} 
        style={styles.container}
        resizeMode="cover"
      >
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.accent.mustardSea} />
            <Text style={styles.loadingText}>Charting global waters...</Text>
          </View>
        </SafeAreaView>
      </ImageBackground>
    );
  }

  if (error) {
    return (
      <ImageBackground 
        source={require('../../images/homepage_BG_new.png')} 
        style={styles.container}
        resizeMode="cover"
      >
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>🌊 Unable to load ocean charts</Text>
            <Text style={styles.errorSubtext}>Check your connection to the seas</Text>
          </View>
        </SafeAreaView>
      </ImageBackground>
    );
  }

  return (
    <ImageBackground 
      source={require('../../images/homepage_BG_new.png')} 
      style={styles.container}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.safeArea}>
        {/* Elegant Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Global Ocean Chart</Text>
          <Text style={styles.subtitle}>
            {globalStats?.totalBottles 
              ? `${globalStats.totalBottles} messages drift across the seas • ${globalStats.activeBottles} currently adrift`
              : 'The oceans await the first message'
            }
          </Text>
        </View>

        {/* Refined Filter Tabs */}
        <View style={styles.filterContainer}>
          <Pressable
            style={[styles.filterTab, filter === 'all' && styles.activeTab]}
            onPress={() => setFilter('all')}
          >
            <Text style={[styles.filterText, filter === 'all' && styles.activeFilterText]}>
              All ({counts.all})
            </Text>
          </Pressable>
          <Pressable
            style={[styles.filterTab, filter === 'created' && styles.activeTab]}
            onPress={() => setFilter('created')}
          >
            <Text style={[styles.filterText, filter === 'created' && styles.activeFilterText]}>
              Created ({counts.created})
            </Text>
          </Pressable>
          <Pressable
            style={[styles.filterTab, filter === 'found' && styles.activeTab]}
            onPress={() => setFilter('found')}
          >
            <Text style={[styles.filterText, filter === 'found' && styles.activeFilterText]}>
              Found ({counts.found})
            </Text>
          </Pressable>
          <Pressable
            style={[styles.filterTab, filter === 'retossed' && styles.activeTab]}
            onPress={() => setFilter('retossed')}
          >
            <Text style={[styles.filterText, filter === 'retossed' && styles.activeFilterText]}>
              Retossed ({counts.retossed})
            </Text>
          </Pressable>
        </View>

        {/* Ocean Map */}
        <View style={styles.mapContainer}>
          <MapView
            style={styles.map}
            provider={PROVIDER_GOOGLE}
            region={region}
            onRegionChangeComplete={setRegion}
            customMapStyle={customMapStyle}
            showsUserLocation={true}
            showsMyLocationButton={false}
            showsPointsOfInterest={false}
            showsBuildings={false}
            showsTraffic={false}
            showsIndoors={false}
            mapType="standard"
            minZoomLevel={2}
            maxZoomLevel={12}
            userLocationPriority="passive"
            loadingEnabled={true}
            loadingIndicatorColor={Colors.accent.mustardSea}
            loadingBackgroundColor={Colors.primary[900]}
          >
            {markers}
          </MapView>
          
          {/* Map Legend */}
          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: Colors.accent.treasure }]} />
              <Text style={styles.legendText}>Created</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: Colors.accent.seaweed }]} />
              <Text style={styles.legendText}>Found</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: Colors.secondary[500] }]} />
              <Text style={styles.legendText}>Retossed</Text>
            </View>
          </View>
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
  },
  loadingText: {
    marginTop: Spacing.lg,
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.medium,
    color: Colors.text.inverse,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
  },
  errorText: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    color: Colors.text.inverse,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  errorSubtext: {
    fontSize: Typography.sizes.md,
    color: Colors.text.inverse,
    opacity: 0.7,
    textAlign: 'center',
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xl,
    alignItems: 'center',
  },
  title: {
    fontSize: Typography.sizes['3xl'],
    fontWeight: Typography.weights.bold,
    color: Colors.text.ocean,
    textAlign: 'center',
    marginBottom: Spacing.sm,
    textShadowColor: 'rgba(255, 255, 255, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  subtitle: {
    fontSize: Typography.sizes.md,
    color: Colors.text.secondary,
    textAlign: 'center',
    fontWeight: Typography.weights.medium,
  },
  filterContainer: {
    flexDirection: 'row',
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    backgroundColor: 'rgba(1, 67, 72, 0.7)',
    borderRadius: BorderRadius.xl,
    padding: Spacing.xs,
    ...Shadows.md,
  },
  filterTab: {
    flex: 1,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xs,
    alignItems: 'center',
    borderRadius: BorderRadius.lg,
  },
  activeTab: {
    backgroundColor: Colors.accent.mustardSea,
    ...Shadows.base,
  },
  filterText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    color: Colors.text.inverse,
    opacity: 0.7,
    textAlign: 'center',
  },
  activeFilterText: {
    color: Colors.text.primary,
    opacity: 1,
    fontWeight: Typography.weights.bold,
  },
  mapContainer: {
    flex: 1,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    ...Shadows.ocean,
  },
  map: {
    flex: 1,
  },
  legend: {
    position: 'absolute',
    bottom: Spacing.lg,
    right: Spacing.lg,
    backgroundColor: 'rgba(1, 67, 72, 0.9)',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    ...Shadows.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: BorderRadius.full,
    marginRight: Spacing.sm,
  },
  legendText: {
    fontSize: Typography.sizes.xs,
    color: Colors.text.inverse,
    fontWeight: Typography.weights.medium,
  },
}); 