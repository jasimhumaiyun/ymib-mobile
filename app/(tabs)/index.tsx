import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Pressable } from 'react-native';
import { usePingSupabase } from '../../src/hooks/usePingSupabase';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function HomeScreen() {
  const { healthy, error } = usePingSupabase();

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {healthy === null && <ActivityIndicator size="large" />}
        {healthy && <Text style={{ fontSize: 24 }}>✅ Supabase OK</Text>}
        {error && <Text style={{ color: 'red' }}>❌ {error}</Text>}
      </View>
      
      {/* FAB - now links to scan screen */}
      <Link href="/scan" asChild>
        <Pressable style={styles.fab}>
          <Ionicons name="qr-code" size={68} color="#2196F3" />
        </Pressable>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    backgroundColor: 'white',
    borderRadius: 34,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
}); 