import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ImageBackground, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useBottles } from '../../src/hooks/useBottles';
import { useBottleStats } from '../../src/hooks/useBottleStats';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../src/constants/theme';
import { Ionicons } from '@expo/vector-icons';

interface BottleInteraction {
  id: string;
  message: string;
  type: 'created' | 'found' | 'retossed';
  created_at: string;
  status: 'adrift' | 'found';
}

export default function ProfileScreen() {
  const [loading, setLoading] = useState(false);

  // Use the SAME hook that works for world map - force refresh
  const { data: trailMarkers, isLoading, refetch } = useBottles(true);
  
  // Use the new stats hook for accurate statistics
  const { data: statsData, isLoading: statsLoading, refetch: refetchStats } = useBottleStats();
  
  // Force refresh when profile loads
  useEffect(() => {
    refetch();
    refetchStats();
  }, [refetch, refetchStats]);

  // Use accurate stats from the new hook, fallback to trail markers for recent bottles
  const stats = statsData || { created: 0, found: 0, retossed: 0 };
  
  // Process the trail markers to get recent bottles list
  const bottles = useMemo(() => {
    if (!trailMarkers) return [];

    // Build recent bottles list from trail markers (current bottle states)
    const recentBottles: BottleInteraction[] = [];
    
    trailMarkers.forEach(marker => {
      recentBottles.push({
        id: marker.bottleId,
        message: marker.message,
        type: marker.actionType,
        created_at: marker.created_at,
        status: marker.status
      });
    });

    // Sort by most recent activity
    recentBottles.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return recentBottles;
  }, [trailMarkers]);

  const handleViewBottles = () => {
    setLoading(true);
    // Navigate to bottles list with a slight delay for smooth UX
    setTimeout(() => {
      router.push({
        pathname: '/bottles-list',
        params: { 
          created: stats.created,
          found: stats.found,
          retossed: stats.retossed
        }
      });
      setLoading(false);
    }, 300);
  };

  const handleViewBottleJourney = (bottleId: string, bottlePassword: string = 'unknown') => {
    router.push({
      pathname: '/bottle-journey',
      params: { 
        bottleId: bottleId,
        bottlePassword: bottlePassword
      }
    });
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'created': return '🆕';
      case 'found': return '🔍';
      case 'retossed': return '🔄';
      default: return '🍾';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'created': return Colors.accent.seaweed;
      case 'found': return Colors.primary[500];
      case 'retossed': return Colors.secondary[500];
      default: return Colors.neutral[500];
    }
  };

  return (
    <ImageBackground 
      source={require('../../images/homepage_BG_new.png')} 
      style={styles.container}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.safeArea}>
        <ScrollView 
          style={styles.scrollContainer} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Header Section */}
          <View style={styles.headerSection}>
            <Text style={styles.title}>Your Ocean Journey</Text>
            <Text style={styles.subtitle}>
              Messages cast into the endless seas
            </Text>
          </View>

          {/* Stats Section */}
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Text style={styles.statIcon}>🆕</Text>
              <Text style={styles.statNumber}>{stats.created}</Text>
              <Text style={styles.statLabel}>Created</Text>
            </View>
            
            <View style={styles.statCard}>
              <Text style={styles.statIcon}>🔍</Text>
              <Text style={styles.statNumber}>{stats.found}</Text>
              <Text style={styles.statLabel}>Found</Text>
            </View>
            
            <View style={styles.statCard}>
              <Text style={styles.statIcon}>🔄</Text>
              <Text style={styles.statNumber}>{stats.retossed}</Text>
              <Text style={styles.statLabel}>Retossed</Text>
            </View>
          </View>

          {/* Main Action Button */}
          <View style={styles.actionSection}>
            <Pressable 
              style={[styles.mainButton, loading && styles.buttonDisabled]}
              onPress={handleViewBottles}
              disabled={loading || isLoading || statsLoading}
            >
              {loading ? (
                <ActivityIndicator color={Colors.text.primary} size="small" />
              ) : (
                <>
                  <Ionicons name="library" size={24} color={Colors.text.primary} />
                  <Text style={styles.mainButtonText}>Your Bottle Interactions</Text>
                </>
              )}
            </Pressable>
            
            <Text style={styles.actionSubtitle}>
              View all bottles you've created, found, or retossed
            </Text>
          </View>

          {/* Recent Activity */}
          {bottles.length > 0 && (
            <View style={styles.recentSection}>
              <Text style={styles.sectionTitle}>Recent Activity</Text>
              
              {bottles.slice(0, 3).map((bottle, index) => (
                <Pressable 
                  key={bottle.id}
                  style={styles.recentCard}
                  onPress={() => handleViewBottleJourney(bottle.id)}
                >
                  <View style={styles.recentCardContent}>
                    <Text style={styles.recentIcon}>
                      {getTypeIcon(bottle.type)}
                    </Text>
                    
                    <View style={styles.recentTextContent}>
                      <View style={styles.recentHeader}>
                        <Text style={styles.recentType}>
                          {bottle.type.charAt(0).toUpperCase() + bottle.type.slice(1)} Bottle
                        </Text>
                        <Text style={styles.recentDate}>
                          {new Date(bottle.created_at).toLocaleDateString()}
                        </Text>
                      </View>
                      
                      <Text style={styles.recentId}>
                        #{bottle.id.slice(0, 8)}...
                      </Text>
                      
                      <Text style={styles.recentMessage} numberOfLines={2}>
                        "{bottle.message}"
                      </Text>
                    </View>
                    
                    <Ionicons 
                      name="chevron-forward" 
                      size={20} 
                      color={Colors.text.inverse} 
                    />
                  </View>
                </Pressable>
              ))}
            </View>
          )}

          {/* Empty State */}
          {!isLoading && bottles.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🌊</Text>
              <Text style={styles.emptyTitle}>No bottles yet</Text>
              <Text style={styles.emptySubtitle}>
                Start your ocean journey by creating or finding a bottle
              </Text>
              
              <View style={styles.emptyActions}>
                <Pressable 
                  style={styles.emptyButton}
                  onPress={() => router.push('/scan')}
                >
                  <Text style={styles.emptyButtonText}>Find a Bottle</Text>
                </Pressable>
                
                <Pressable 
                  style={[styles.emptyButton, styles.emptyButtonSecondary]}
                  onPress={() => router.push('/toss')}
                >
                  <Text style={[styles.emptyButtonText, styles.emptyButtonTextSecondary]}>
                    Create a Bottle
                  </Text>
                </Pressable>
              </View>
            </View>
          )}

          {/* Loading State */}
          {isLoading && (
            <View style={styles.loadingState}>
              <ActivityIndicator size="large" color={Colors.primary[500]} />
              <Text style={styles.loadingText}>Loading your journey...</Text>
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
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing['6xl'], // Account for tab bar
    paddingTop: Spacing.xl, // Reduced padding since no logo
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: Spacing['2xl'],
  },
  title: {
    fontSize: Typography.sizes['3xl'],
    fontWeight: Typography.weights.bold,
    color: Colors.text.ocean,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: Typography.sizes.md,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: Typography.lineHeights.relaxed * Typography.sizes.md,
  },
  statsContainer: {
    flexDirection: 'row',
    marginBottom: Spacing['2xl'],
    gap: Spacing.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.accent.mustardSea,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    ...Shadows.md,
  },
  statIcon: {
    fontSize: Typography.sizes.lg,
    marginBottom: Spacing.xs,
  },
  statNumber: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  statLabel: {
    fontSize: Typography.sizes.xs,
    color: Colors.text.primary,
    fontWeight: Typography.weights.semibold,
    textAlign: 'center',
  },
  actionSection: {
    alignItems: 'center',
    marginBottom: Spacing['2xl'],
  },
  mainButton: {
    backgroundColor: Colors.accent.mustardSea,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing['2xl'],
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.xl,
    gap: Spacing.md,
    marginBottom: Spacing.md,
    ...Shadows.md,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  mainButtonText: {
    color: Colors.text.primary,
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
  },
  actionSubtitle: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: Typography.lineHeights.relaxed * Typography.sizes.sm,
  },
  recentSection: {
    marginBottom: Spacing['2xl'],
  },
  sectionTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    color: Colors.text.ocean,
    marginBottom: Spacing.lg,
  },
  recentCard: {
    backgroundColor: 'rgba(1, 67, 72, 0.8)',
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    ...Shadows.md,
  },
  recentCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  recentIcon: {
    fontSize: Typography.sizes['2xl'],
  },
  recentTextContent: {
    flex: 1,
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  recentType: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.bold,
    color: Colors.text.inverse,
  },
  recentDate: {
    fontSize: Typography.sizes.xs,
    color: Colors.accent.mustardSea,
    fontWeight: Typography.weights.medium,
  },
  recentId: {
    fontSize: Typography.sizes.xs,
    color: Colors.text.inverse,
    opacity: 0.7,
    marginBottom: Spacing.sm,
  },
  recentMessage: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.inverse,
    fontStyle: 'italic',
    lineHeight: Typography.lineHeights.normal * Typography.sizes.sm,
    opacity: 0.9,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing['3xl'],
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    color: Colors.text.ocean,
    marginBottom: Spacing.sm,
  },
  emptySubtitle: {
    fontSize: Typography.sizes.md,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: Typography.lineHeights.relaxed * Typography.sizes.md,
    marginBottom: Spacing['2xl'],
  },
  emptyActions: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  emptyButton: {
    backgroundColor: Colors.accent.mustardSea,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  emptyButtonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.accent.mustardSea,
  },
  emptyButtonText: {
    color: Colors.text.primary,
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.bold,
  },
  emptyButtonTextSecondary: {
    color: Colors.accent.mustardSea,
  },
  loadingState: {
    alignItems: 'center',
    paddingVertical: Spacing['3xl'],
  },
  loadingText: {
    fontSize: Typography.sizes.md,
    color: Colors.text.secondary,
    marginTop: Spacing.md,
  },
}); 