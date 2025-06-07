import React from 'react';
import { View, Text, StyleSheet, ImageBackground, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing } from '../../src/constants/theme';

export default function HomeScreen() {
  return (
    <ImageBackground 
      source={require('../../images/homepage_BG_new.png')} 
      style={styles.container}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.safeArea}>
        {/* Header with YMIB Logo - moved to top */}
        <View style={styles.header}>
          <Image 
            source={require('../../images/ymib.png')}
            style={styles.headerLogo}
            resizeMode="contain"
          />
        </View>

        {/* Main Content */}
        <View style={styles.content}>
          <Text style={styles.subtitle}>Send your thoughts across the digital seas</Text>
          <Text style={styles.description}>
            Scan QR codes on physical bottles to join the global message exchange
          </Text>
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
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md, // Slightly more padding to avoid notch
    alignItems: 'center',
    paddingBottom: Spacing.lg,
  },
  headerLogo: {
    width: 600, // Much bigger - increased from 300
    height: 150, // Much bigger - increased from 80
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingBottom: 120, // Account for the new tab bar height
  },
  subtitle: {
    fontSize: Typography.sizes.xl,
    color: Colors.text.inverse,
    textAlign: 'center',
    fontWeight: Typography.weights.bold,
    marginBottom: Spacing.lg,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  description: {
    fontSize: Typography.sizes.md,
    color: Colors.text.secondary,
    textAlign: 'center',
    fontWeight: Typography.weights.medium,
    lineHeight: Typography.lineHeights.relaxed * Typography.sizes.md,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
}); 