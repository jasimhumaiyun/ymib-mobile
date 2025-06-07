import React, { useEffect, useRef } from 'react';
import { Pressable, StyleSheet, Animated, Easing } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface FABPulseProps {
  onPress: () => void;
}

const FABPulse: React.FC<FABPulseProps> = ({ onPress }) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const startPulseAnimation = () => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.08,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    };

    startPulseAnimation();
  }, [pulseAnim]);

  return (
    <AnimatedPressable
      style={[
        styles.fab,
        {
          transform: [{ scale: pulseAnim }],
        },
      ]}
      onPress={onPress}
      android_ripple={{ color: 'rgba(0,0,0,0.1)', radius: 36 }}
    >
      <MaterialCommunityIcons name="qrcode-scan" size={34} color="#000" />
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: 25, // Much lower, closer to the nav bar
    left: '50%',
    marginLeft: -36,
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#D4AF37',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 15,
    zIndex: 100,
  },
});

export default FABPulse; 