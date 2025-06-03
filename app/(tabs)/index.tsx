import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link } from 'expo-router';

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>YMIB</Text>
        <Text style={styles.subtitle}>Your Message in a Bottle</Text>
        
        <View style={styles.actionsContainer}>
          <Link href="/toss" asChild>
            <Pressable style={[styles.actionButton, styles.tossButton]}>
              <Text style={styles.actionIcon}>🍾</Text>
              <Text style={styles.actionTitle}>Toss Your Bottle!</Text>
              <Text style={styles.actionDescription}>
                Add your message and photo to a bottle
              </Text>
            </Pressable>
          </Link>
          
          <Link href="/found" asChild>
            <Pressable style={[styles.actionButton, styles.foundButton]}>
              <Text style={styles.actionIcon}>🔍</Text>
              <Text style={styles.actionTitle}>Found a Bottle!</Text>
              <Text style={styles.actionDescription}>
                Discover what's inside and continue the journey
              </Text>
            </Pressable>
          </Link>
        </View>
        
        <View style={styles.exploreHint}>
          <Text style={styles.hintText}>
            🗺️ Check the Explore tab to see bottles on the map
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#2196F3',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    textAlign: 'center',
    color: '#666',
    marginBottom: 60,
  },
  actionsContainer: {
    gap: 20,
    marginBottom: 40,
  },
  actionButton: {
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tossButton: {
    backgroundColor: '#2196F3',
  },
  foundButton: {
    backgroundColor: '#4CAF50',
  },
  actionIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  actionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  actionDescription: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
    textAlign: 'center',
  },
  exploreHint: {
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    alignItems: 'center',
  },
  hintText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
}); 