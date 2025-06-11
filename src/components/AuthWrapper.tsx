import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useUserProfiles } from '../hooks/useUserProfiles';
import { Colors } from '../constants/theme';

interface AuthWrapperProps {
  children: React.ReactNode;
  onboardingComponent: React.ReactNode;
}

export function AuthWrapper({ children, onboardingComponent }: AuthWrapperProps) {
  const { loading, hasUsername } = useUserProfiles();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary[600]} />
      </View>
    );
  }

  // Show onboarding if no username set
  if (!hasUsername) {
    return <>{onboardingComponent}</>;
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background.primary,
  },
}); 