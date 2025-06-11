import React from 'react';
import { Alert } from 'react-native';
import { Stack, router } from 'expo-router';
import SmartBottleScanner from '../src/components/SmartBottleScanner';

export default function ScanScreen() {
  const handleRouteToToss = (bottleData: { id: string; password: string }) => {
    // Pass bottle data so toss screen uses the scanned bottle ID instead of generating random UUID
    router.push({
      pathname: '/toss',
      params: { 
        bottleId: bottleData.id,
        bottlePassword: bottleData.password,
        mode: 'create' // Distinguish from retoss mode
      }
    });
  };

  const handleRouteToFound = (bottleData: { id: string; password: string }) => {
    router.push({
      pathname: '/found',
      params: { 
        bottleId: bottleData.id,
        bottlePassword: bottleData.password 
      }
    });
  };

  const handleRouteToRetossDecision = (bottleData: { id: string; password: string }) => {
    router.push({
      pathname: '/found',
      params: { 
        bottleId: bottleData.id,
        bottlePassword: bottleData.password,
        skipToRetoss: 'true'
      }
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
        onRouteToRetossDecision={handleRouteToRetossDecision}
        onCancel={handleCancel}
      />
    </>
  );
} 