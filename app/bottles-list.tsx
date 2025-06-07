import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ImageBackground } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../src/constants/theme';
import { Ionicons } from '@expo/vector-icons';

export default function BottlesListScreen() {
  const params = useLocalSearchParams();
  
  const stats = {
    created: parseInt(params.created as string) || 0,
    found: parseInt(params.found as string) || 0,
    retossed: parseInt(params.retossed as string) || 0,
  };

  return (
    <ImageBackground 
      source={require('../images/homepage_BG_new.png')} 
      style={styles.container}
      resizeMode="cover"
    >
      <Stack.Screen options={{ headerShown: false }} />
      
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Pressable 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={Colors.text.ocean} />
          </Pressable>
          
          <Text style={styles.headerTitle}>Your Bottles</Text>
        </View>

        <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            <View style={styles.statsSection}>
              <Text style={styles.statsTitle}>Your Journey Summary</Text>
              
              <View style={styles.statsGrid}>
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
            </View>

            <View style={styles.comingSoonSection}>
              <Text style={styles.comingSoonIcon}>🚧</Text>
              <Text style={styles.comingSoonTitle}>Coming Soon</Text>
              <Text style={styles.comingSoonText}>
                A detailed list of all your bottle interactions is being developed. 
                For now, you can view individual bottle journeys from the Recent Activity 
                section on your profile.
              </Text>
              
              <Pressable 
                style={styles.backToProfileButton}
                onPress={() => router.back()}
              >
                <Ionicons name="arrow-back" size={20} color={Colors.text.primary} />
                <Text style={styles.backToProfileButtonText}>Back to Profile</Text>
              </Pressable>
            </View>
          </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.background.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.base,
  },
  headerTitle: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    color: Colors.text.ocean,
  },
  scrollContainer: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  content: {
    paddingBottom: Spacing['2xl'],
  },
  statsSection: {
    marginBottom: Spacing['2xl'],
  },
  statsTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    color: Colors.text.ocean,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  statsGrid: {
    flexDirection: 'row',
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
  comingSoonSection: {
    backgroundColor: 'rgba(1, 67, 72, 0.8)',
    padding: Spacing['2xl'],
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    ...Shadows.md,
  },
  comingSoonIcon: {
    fontSize: 64,
    marginBottom: Spacing.lg,
  },
  comingSoonTitle: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    color: Colors.text.inverse,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  comingSoonText: {
    fontSize: Typography.sizes.md,
    color: Colors.text.inverse,
    textAlign: 'center',
    lineHeight: Typography.lineHeights.relaxed * Typography.sizes.md,
    marginBottom: Spacing['2xl'],
    opacity: 0.9,
  },
  backToProfileButton: {
    backgroundColor: Colors.accent.mustardSea,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
    ...Shadows.base,
  },
  backToProfileButtonText: {
    color: Colors.text.primary,
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.bold,
  },
}); 