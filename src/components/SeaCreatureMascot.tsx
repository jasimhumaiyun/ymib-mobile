import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Spacing } from '../constants/theme';

interface SeaCreatureMascotProps {
  size?: 'small' | 'medium' | 'large';
  variant?: 'octopus' | 'turtle' | 'jellyfish' | 'seahorse';
  animated?: boolean;
}

export default function SeaCreatureMascot({ 
  size = 'medium', 
  variant = 'octopus',
  animated = false 
}: SeaCreatureMascotProps) {
  const getCreatureEmoji = () => {
    switch (variant) {
      case 'octopus': return '🐙';
      case 'turtle': return '🐢';
      case 'jellyfish': return '🪼';
      case 'seahorse': return '🐠';
      default: return '🐙';
    }
  };

  const getSizeStyle = () => {
    switch (size) {
      case 'small': return styles.small;
      case 'medium': return styles.medium;
      case 'large': return styles.large;
      default: return styles.medium;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.creatureContainer}>
        <Text style={[styles.creature, getSizeStyle()]}>
          {getCreatureEmoji()}
        </Text>
        {animated && (
          <View style={styles.bubbles}>
            <Text style={styles.bubble}>💧</Text>
            <Text style={[styles.bubble, styles.bubble2]}>💧</Text>
            <Text style={[styles.bubble, styles.bubble3]}>💧</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  creatureContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  creature: {
    textAlign: 'center',
  },
  small: {
    fontSize: 32,
  },
  medium: {
    fontSize: 64,
  },
  large: {
    fontSize: 96,
  },
  bubbles: {
    position: 'absolute',
    top: -20,
    right: -10,
  },
  bubble: {
    fontSize: 12,
    opacity: 0.7,
    position: 'absolute',
  },
  bubble2: {
    top: -8,
    left: 8,
    fontSize: 10,
    opacity: 0.5,
  },
  bubble3: {
    top: -15,
    left: 15,
    fontSize: 8,
    opacity: 0.3,
  },
}); 