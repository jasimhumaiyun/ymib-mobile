import React from 'react';
import { Alert } from 'react-native';
import { Stack, router } from 'expo-router';
import SmartBottleScanner from '../src/components/SmartBottleScanner';

export default function ScanScreen() {
  const handleRouteToToss = (bottleData: { id: string; password: string }) => {
    console.log('🍾 New bottle detected → Routing to Toss Flow:', bottleData);
    // Navigate to toss screen with bottle data
    router.push({
      pathname: '/toss',
      params: { bottleId: bottleData.id, bottlePassword: bottleData.password }
    });
  };

  const handleRouteToFound = (bottleData: { id: string; password: string }) => {
    console.log('🔍 Routing to Found Flow with:', bottleData);
    // Navigate to found screen with bottle data
    router.push({
      pathname: '/found',
      params: { bottleId: bottleData.id, bottlePassword: bottleData.password }
    });
  };

  const handleCancel = () => {
    try {
      if (router.canDismiss()) {
        router.dismissAll();
      } else {
        // Navigate to home tab instead of going back
        router.replace('/(tabs)');
      }
    } catch (error) {
      console.error('Navigation error:', error);
      // Fallback: try to navigate to home
      router.replace('/(tabs)');
    }
  };

  return (
    <>
      <Stack.Screen options={{ 
        presentation: 'modal',
        headerShown: false,
        title: ''
      }} />
      <SmartBottleScanner
        onRouteToToss={handleRouteToToss}
        onRouteToFound={handleRouteToFound}
        onCancel={handleCancel}
      />
    </>
  );
} 