import React from 'react';
import { Alert } from 'react-native';
import { Stack, router } from 'expo-router';
import SmartBottleScanner from '../src/components/SmartBottleScanner';

export default function ScanScreen() {
  const handleRouteToToss = (bottleData: { id: string; password: string }) => {
    console.log('🍾 New bottle detected:', bottleData);
    // Since we removed the toss functionality, show an alert for new bottles
    Alert.alert(
      'New Bottle Detected',
      'This appears to be a new bottle. The toss functionality is currently being redesigned.',
      [
        {
          text: 'OK',
          onPress: () => router.dismissAll()
        }
      ]
    );
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
    router.dismissAll();
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