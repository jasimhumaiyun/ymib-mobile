import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors, Typography, Spacing, BorderRadius, Shadows, Copy } from '../src/constants/theme';

export default function HowItWorksScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>← Back</Text>
          </Pressable>
          <Text style={styles.title}>How It Works</Text>
          <Text style={styles.subtitle}>The Ancient Ways of the Digital Ocean</Text>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>The Ancient Ways:</Text>
          <View style={styles.infoGrid}>
            <View style={styles.infoCard}>
              <Text style={styles.infoCardIcon}>✨</Text>
              <Text style={styles.infoCardTitle}>CAST</Text>
              <Text style={styles.infoCardText}>
                Discover a new vessel → Begin its journey with your whisper
              </Text>
            </View>
            <View style={styles.infoCard}>
              <Text style={styles.infoCardIcon}>🗝️</Text>
              <Text style={styles.infoCardTitle}>DISCOVER</Text>
              <Text style={styles.infoCardText}>
                Find an ancient vessel → Read its secrets & add your voice
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.featuresSection}>
          <Text style={styles.featuresTitle}>⚓ Mystical Features</Text>
          <Text style={styles.featuresText}>
            • Vessel recognition through ancient arts{'\n'}
            • Nested conversations like ocean currents{'\n'}
            • Real-time voyage tracking across the seas{'\n'}
            • Beautiful timeline of maritime journeys
          </Text>
        </View>

        <View style={styles.processSection}>
          <Text style={styles.sectionTitle}>Your Journey Begins:</Text>
          
          <View style={styles.stepCard}>
            <Text style={styles.stepNumber}>1</Text>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Seek the Message</Text>
              <Text style={styles.stepDescription}>
                Use your device to scan any bottle. Our mystical recognition will determine if it's a new vessel or one with ancient conversations.
              </Text>
            </View>
          </View>

          <View style={styles.stepCard}>
            <Text style={styles.stepNumber}>2</Text>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Cast or Discover</Text>
              <Text style={styles.stepDescription}>
                For new vessels, cast your first whisper. For ancient ones, read the conversations and add your voice to the journey.
              </Text>
            </View>
          </View>

          <View style={styles.stepCard}>
            <Text style={styles.stepNumber}>3</Text>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Watch the Voyage</Text>
              <Text style={styles.stepDescription}>
                Follow your vessel's journey across the digital seas as other voyagers discover and continue its story.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
  },
  header: {
    marginBottom: Spacing['4xl'],
  },
  backButton: {
    marginBottom: Spacing.lg,
  },
  backButtonText: {
    fontSize: Typography.sizes.md,
    color: Colors.primary[600],
    fontWeight: Typography.weights.semibold,
  },
  title: {
    fontSize: Typography.sizes['4xl'],
    fontWeight: Typography.weights.bold,
    color: Colors.primary[700],
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: Typography.sizes.md,
    color: Colors.text.secondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  infoSection: {
    marginBottom: Spacing['4xl'],
  },
  sectionTitle: {
    fontSize: Typography.sizes['2xl'],
    fontWeight: Typography.weights.semibold,
    color: Colors.primary[800],
    marginBottom: Spacing.lg,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  infoGrid: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  infoCard: {
    flex: 1,
    backgroundColor: Colors.background.secondary,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.primary[200],
    ...Shadows.sm,
  },
  infoCardIcon: {
    fontSize: Typography.sizes['3xl'],
    marginBottom: Spacing.md,
  },
  infoCardTitle: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.bold,
    color: Colors.primary[700],
    marginBottom: Spacing.sm,
  },
  infoCardText: {
    fontSize: Typography.sizes.sm,
    color: Colors.primary[600],
    textAlign: 'center',
    lineHeight: Typography.lineHeights.normal * Typography.sizes.sm,
    fontStyle: 'italic',
  },
  featuresSection: {
    backgroundColor: Colors.background.ocean,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.primary[300],
    marginBottom: Spacing['4xl'],
    ...Shadows.sm,
  },
  featuresTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.semibold,
    color: Colors.primary[800],
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  featuresText: {
    fontSize: Typography.sizes.sm,
    color: Colors.primary[700],
    lineHeight: Typography.lineHeights.relaxed * Typography.sizes.sm,
    fontStyle: 'italic',
  },
  processSection: {
    marginBottom: Spacing['4xl'],
  },
  stepCard: {
    flexDirection: 'row',
    backgroundColor: Colors.background.secondary,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary[500],
    ...Shadows.sm,
  },
  stepNumber: {
    fontSize: Typography.sizes['2xl'],
    fontWeight: Typography.weights.bold,
    color: Colors.primary[600],
    marginRight: Spacing.lg,
    width: 40,
    textAlign: 'center',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.semibold,
    color: Colors.primary[800],
    marginBottom: Spacing.xs,
  },
  stepDescription: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
    lineHeight: Typography.lineHeights.relaxed * Typography.sizes.sm,
  },
}); 