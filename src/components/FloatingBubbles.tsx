import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface Bubble {
  id: number;
  x: Animated.Value;
  y: Animated.Value;
  opacity: Animated.Value;
  scale: Animated.Value;
  isBottleBubble: boolean;
}

interface FloatingBubblesProps {
  bottlePosition?: {
    x: Animated.AnimatedInterpolation<string | number>;
    y: Animated.AnimatedInterpolation<string | number>;
  };
}

export default function FloatingBubbles({ bottlePosition }: FloatingBubblesProps) {
  const [bubbles, setBubbles] = useState<Bubble[]>([]);

  useEffect(() => {
    const createBubbles = () => {
      const allBubbles: Bubble[] = [];

      // Create background bubbles scattered across screen
      for (let i = 0; i < 15; i++) {
        allBubbles.push({
          id: i,
          x: new Animated.Value(Math.random() * screenWidth),
          y: new Animated.Value(Math.random() * screenHeight),
          opacity: new Animated.Value(0.3 + Math.random() * 0.3), // 0.3 to 0.6 opacity
          scale: new Animated.Value(0.5 + Math.random() * 0.5), // 0.5 to 1.0 scale
          isBottleBubble: false,
        });
      }

      // Create bottle area bubbles (concentrated around bottle center)
      const bottleCenterX = screenWidth / 2;
      const bottleCenterY = screenHeight * 0.65; // Approximate bottle position

      for (let i = 0; i < 20; i++) {
        // Create bubbles in a radius around bottle
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * 120 + 30; // 30-150px radius from bottle
        const bubbleX = bottleCenterX + Math.cos(angle) * radius;
        const bubbleY = bottleCenterY + Math.sin(angle) * radius;

        allBubbles.push({
          id: i + 100,
          x: new Animated.Value(Math.max(0, Math.min(screenWidth, bubbleX))),
          y: new Animated.Value(Math.max(0, Math.min(screenHeight, bubbleY))),
          opacity: new Animated.Value(0.4 + Math.random() * 0.4), // 0.4 to 0.8 opacity (more visible)
          scale: new Animated.Value(0.6 + Math.random() * 0.6), // 0.6 to 1.2 scale (bigger)
          isBottleBubble: true,
        });
      }

      setBubbles(allBubbles);
      return allBubbles;
    };

    const bubblesArray = createBubbles();

    // Start animations for all bubbles
    bubblesArray.forEach((bubble, index) => {
      const animateBubble = () => {
        if (bubble.isBottleBubble) {
          // Bottle area bubbles - rising and gentle movement
          const bottleCenterX = screenWidth / 2;
          const bottleCenterY = screenHeight * 0.65;
          const angle = Math.random() * Math.PI * 2;
          const radius = Math.random() * 100 + 40;
          const newX = bottleCenterX + Math.cos(angle) * radius;
          const newY = bottleCenterY - Math.random() * 300 - 50; // Rise upward

          Animated.parallel([
            Animated.timing(bubble.x, {
              toValue: Math.max(0, Math.min(screenWidth, newX)),
              duration: 8000 + Math.random() * 4000, // 8-12 seconds
              useNativeDriver: false,
            }),
            Animated.timing(bubble.y, {
              toValue: Math.max(0, newY),
              duration: 8000 + Math.random() * 4000,
              useNativeDriver: false,
            }),
            Animated.timing(bubble.opacity, {
              toValue: 0.2 + Math.random() * 0.4,
              duration: 4000,
              useNativeDriver: false,
            }),
            Animated.timing(bubble.scale, {
              toValue: 0.6 + Math.random() * 0.6,
              duration: 6000,
              useNativeDriver: false,
            }),
          ]).start(() => {
            // Reset bubble to bottle area for continuous effect
            bubble.y.setValue(bottleCenterY + Math.random() * 100);
            bubble.x.setValue(bottleCenterX + (Math.random() - 0.5) * 200);
            setTimeout(animateBubble, Math.random() * 2000);
          });
        } else {
          // Background bubbles - slow drift across screen
          const newX = Math.random() * screenWidth;
          const newY = Math.random() * screenHeight;

          Animated.parallel([
            Animated.timing(bubble.x, {
              toValue: newX,
              duration: 15000 + Math.random() * 10000, // 15-25 seconds
              useNativeDriver: false,
            }),
            Animated.timing(bubble.y, {
              toValue: newY,
              duration: 15000 + Math.random() * 10000,
              useNativeDriver: false,
            }),
            Animated.timing(bubble.opacity, {
              toValue: 0.1 + Math.random() * 0.3,
              duration: 7500,
              useNativeDriver: false,
            }),
            Animated.timing(bubble.scale, {
              toValue: 0.3 + Math.random() * 0.5,
              duration: 10000,
              useNativeDriver: false,
            }),
          ]).start(() => {
            setTimeout(animateBubble, Math.random() * 3000);
          });
        }
      };

      // Start each bubble with a random delay
      setTimeout(animateBubble, Math.random() * 2000);
    });
  }, []);

  return (
    <View style={styles.container} pointerEvents="none">
      {bubbles.map((bubble) => (
        <Animated.View
          key={bubble.id}
          style={[
            styles.bubble,
            bubble.isBottleBubble && styles.bottleBubble,
            {
              left: bubble.x,
              top: bubble.y,
              opacity: bubble.opacity,
              transform: [{ scale: bubble.scale }],
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1, // Behind other content but above background
  },
  bubble: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    shadowColor: 'rgba(255, 255, 255, 0.8)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 3,
    elevation: 3,
  },
  bottleBubble: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderColor: 'rgba(255, 255, 255, 0.6)',
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 4,
    // More prominent bubbles around bottle
  },
}); 