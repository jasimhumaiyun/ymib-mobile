import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ImageBackground, ScrollView, Pressable, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useBottles } from '../../src/hooks/useBottles';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../src/constants/theme';
import { Ionicons } from '@expo/vector-icons';

type FeedFilter = 'trending' | 'newest' | 'nearby';

interface DiscoveryBottle {
  id: string;
  message: string;
  created_at: string;
  lat: number;
  lon: number;
  actionType: 'created' | 'found' | 'retossed';
  distance?: number;
  score: number;
}

export default function HarborScreen() {
  const [filter, setFilter] = useState<FeedFilter>('trending');
  const [refreshing, setRefreshing] = useState(false);
  
  const { data: trailMarkers, isLoading, refetch } = useBottles(true);

  // Transform trail markers into discovery feed
  const discoveryBottles = useMemo(() => {
    if (!trailMarkers) return [];

    // Group by bottle ID to get unique bottles
    const bottleMap = new Map<string, DiscoveryBottle>();
    
    trailMarkers.forEach(marker => {
      const existing = bottleMap.get(marker.bottleId);
      
      if (!existing || new Date(marker.created_at) > new Date(existing.created_at)) {
        // Calculate trending score (recency + activity)
        const hoursAgo = (Date.now() - new Date(marker.created_at).getTime()) / (1000 * 60 * 60);
        const recencyScore = Math.max(0, 100 - hoursAgo); // Decay over time
        const activityBonus = marker.actionType === 'retossed' ? 20 : marker.actionType === 'found' ? 10 : 5;
        
        bottleMap.set(marker.bottleId, {
          id: marker.bottleId,
          message: marker.message,
          created_at: marker.created_at,
          lat: marker.lat,
          lon: marker.lon,
          actionType: marker.actionType,
          score: recencyScore + activityBonus
        });
      }
    });

    return Array.from(bottleMap.values());
  }, [trailMarkers]);

  // Apply filtering and sorting
  const filteredBottles = useMemo(() => {
    let bottles = [...discoveryBottles];

    switch (filter) {
      case 'trending':
        bottles.sort((a, b) => b.score - a.score);
        break;
      case 'newest':
        bottles.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case 'nearby':
        // For now, sort by score since we don't have user location
        // TODO: Implement actual distance calculation
        bottles.sort((a, b) => b.score - a.score);
        break;
    }

    return bottles.slice(0, 20); // Limit to top 20
  }, [discoveryBottles, filter]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'created': return '🆕';
      case 'found': return '🔍';
      case 'retossed': return '🔄';
      default: return '🍾';
    }
  };

  const getActionColor = (actionType: string) => {
    switch (actionType) {
      case 'created': return Colors.accent.seaweed;
      case 'found': return Colors.primary[500];
      case 'retossed': return Colors.secondary[500];
      default: return Colors.neutral[500];
    }
  };

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString();
  };

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
            <Text style={styles.loadingText}>Discovering bottles...</Text>
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
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Harbor Discovery</Text>
          <Text style={styles.subtitle}>
            {filteredBottles.length > 0 
              ? `${filteredBottles.length} bottles drifting in the digital seas`
              : 'Cast your first message into the ocean'
            }
          </Text>
        </View>

        {/* Filter Tabs */}
        <View style={styles.filterContainer}>
          <Pressable
            style={[styles.filterTab, filter === 'trending' && styles.activeTab]}
            onPress={() => setFilter('trending')}
          >
            <Ionicons 
              name="trending-up" 
              size={16} 
              color={filter === 'trending' ? Colors.text.primary : Colors.text.inverse} 
            />
            <Text style={[styles.filterText, filter === 'trending' && styles.activeFilterText]}>
              Trending
            </Text>
          </Pressable>
          
          <Pressable
            style={[styles.filterTab, filter === 'newest' && styles.activeTab]}
            onPress={() => setFilter('newest')}
          >
            <Ionicons 
              name="time" 
              size={16} 
              color={filter === 'newest' ? Colors.text.primary : Colors.text.inverse} 
            />
            <Text style={[styles.filterText, filter === 'newest' && styles.activeFilterText]}>
              Newest
            </Text>
          </Pressable>
          
          <Pressable
            style={[styles.filterTab, filter === 'nearby' && styles.activeTab]}
            onPress={() => setFilter('nearby')}
          >
            <Ionicons 
              name="location" 
              size={16} 
              color={filter === 'nearby' ? Colors.text.primary : Colors.text.inverse} 
            />
            <Text style={[styles.filterText, filter === 'nearby' && styles.activeFilterText]}>
              Nearby
            </Text>
          </Pressable>
        </View>

        {/* Discovery Feed */}
        <ScrollView 
          style={styles.feedContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={Colors.accent.mustardSea}
              colors={[Colors.accent.mustardSea]}
            />
          }
        >
          {filteredBottles.length > 0 ? (
            filteredBottles.map((bottle, index) => (
              <Pressable
                key={bottle.id}
                style={styles.bottleCard}
                onPress={() => router.push({
                  pathname: '/bottle-journey',
                  params: { 
                    bottleId: bottle.id,
                    bottlePassword: 'unknown' // We don't have passwords in discovery
                  }
                })}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.actionBadge}>
                    <Text style={styles.actionIcon}>
                      {getActionIcon(bottle.actionType)}
                    </Text>
                    <Text style={styles.actionText}>
                      {bottle.actionType.charAt(0).toUpperCase() + bottle.actionType.slice(1)}
                    </Text>
                  </View>
                  
                  <Text style={styles.timeText}>
                    {getTimeAgo(bottle.created_at)}
                  </Text>
                </View>

                <Text style={styles.bottleMessage} numberOfLines={3}>
                  "{bottle.message}"
                </Text>

                <View style={styles.cardFooter}>
                  <Text style={styles.bottleId}>
                    #{bottle.id.slice(0, 8)}...
                  </Text>
                  
                  <View style={styles.scoreContainer}>
                    <Ionicons name="flame" size={14} color={Colors.accent.treasure} />
                    <Text style={styles.scoreText}>
                      {Math.round(bottle.score)}
                    </Text>
                  </View>
                </View>
              </Pressable>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🌊</Text>
              <Text style={styles.emptyTitle}>No bottles discovered yet</Text>
              <Text style={styles.emptySubtitle}>
                Be the first to cast a message into the digital ocean
              </Text>
              
              <Pressable 
                style={styles.emptyButton}
                onPress={() => router.push('/scan')}
              >
                <Ionicons name="add-circle" size={20} color={Colors.text.primary} />
                <Text style={styles.emptyButtonText}>Cast Your First Bottle</Text>
              </Pressable>
            </View>
          )}
        </ScrollView>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xs,
    borderRadius: BorderRadius.lg,
    gap: Spacing.xs,
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
  },
  activeFilterText: {
    color: Colors.text.primary,
    opacity: 1,
    fontWeight: Typography.weights.bold,
  },
  feedContainer: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  bottleCard: {
    backgroundColor: 'rgba(1, 67, 72, 0.8)',
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    ...Shadows.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  actionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(212, 175, 55, 0.2)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
  },
  actionIcon: {
    fontSize: Typography.sizes.sm,
  },
  actionText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.semibold,
    color: Colors.accent.mustardSea,
  },
  timeText: {
    fontSize: Typography.sizes.xs,
    color: Colors.text.inverse,
    opacity: 0.7,
  },
  bottleMessage: {
    fontSize: Typography.sizes.md,
    color: Colors.text.inverse,
    fontStyle: 'italic',
    lineHeight: Typography.lineHeights.normal * Typography.sizes.md,
    marginBottom: Spacing.md,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bottleId: {
    fontSize: Typography.sizes.xs,
    color: Colors.text.inverse,
    opacity: 0.6,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  scoreText: {
    fontSize: Typography.sizes.xs,
    color: Colors.accent.treasure,
    fontWeight: Typography.weights.semibold,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing['4xl'],
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    color: Colors.text.inverse,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  emptySubtitle: {
    fontSize: Typography.sizes.md,
    color: Colors.text.inverse,
    opacity: 0.7,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    lineHeight: Typography.lineHeights.relaxed * Typography.sizes.md,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.accent.mustardSea,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
    ...Shadows.md,
  },
  emptyButtonText: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.bold,
    color: Colors.text.primary,
  },
}); 