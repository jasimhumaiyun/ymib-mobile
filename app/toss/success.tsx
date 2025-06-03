import React from "react";
import { View, Text, Button, StyleSheet } from "react-native";
import { useLocalSearchParams, router } from "expo-router";

export default function Success() {
  const { id, password } = useLocalSearchParams<{ id: string; password: string }>();
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>🌊 Bottle tossed!</Text>
      <Text selectable style={styles.info}>ID: {id}</Text>
      <Text selectable style={styles.info}>Password: {password}</Text>
      <Button title="Back to map" onPress={() => router.replace('/(tabs)/explore')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  info: {
    fontSize: 16,
    fontFamily: 'monospace',
  },
}); 