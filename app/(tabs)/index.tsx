import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { usePingSupabase } from '../../src/hooks/usePingSupabase';

export default function HomeScreen() {
  const { healthy, error } = usePingSupabase();

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      {healthy === null && <ActivityIndicator size="large" />}
      {healthy && <Text style={{ fontSize: 24 }}>✅ Supabase OK</Text>}
      {error && <Text style={{ color: 'red' }}>❌ {error}</Text>}
    </View>
  );
} 