import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import TabLayout from './app/(tabs)/_layout';

const qc = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={qc}>
      <NavigationContainer>
        <TabLayout />
      </NavigationContainer>
    </QueryClientProvider>
  );
}
