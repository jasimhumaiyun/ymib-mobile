import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { AuthWrapper } from '../src/components/AuthWrapper';
import OnboardingScreen from './onboarding';

const qc = new QueryClient();

export default function RootLayout() {
  return (
    <QueryClientProvider client={qc}>
      <AuthWrapper onboardingComponent={<OnboardingScreen />}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="onboarding" options={{ headerShown: false }} />
          <Stack.Screen name="scan" options={{ 
            presentation: 'modal',
            headerShown: false 
          }} />
          <Stack.Screen name="toss" options={{ 
            presentation: 'modal',
            headerShown: false 
          }} />
          <Stack.Screen name="found" options={{ 
            presentation: 'modal',
            headerShown: false 
          }} />
          <Stack.Screen name="bottle-journey" options={{ 
            presentation: 'modal',
            headerShown: false 
          }} />
          <Stack.Screen name="bottles-list" options={{ 
            presentation: 'modal',
            headerShown: false 
          }} />
          <Stack.Screen name="how-it-works" options={{ 
            presentation: 'modal',
            headerShown: false 
          }} />
        </Stack>
      </AuthWrapper>
    </QueryClientProvider>
  );
} 