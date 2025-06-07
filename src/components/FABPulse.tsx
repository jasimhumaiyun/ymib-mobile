import React, { useEffect, useRef } from 'react';
import { Pressable, StyleSheet, Animated, Easing } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface FABPulseProps {
  onPress: () => void;
}

const FABPulse: React.FC<FABPulseProps> = ({ onPress }) => {
  const insets = useSafeAreaInsets();
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const createPulseAnimation = () => {
      return Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 7500, // 15s total cycle (7.5s each way)
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 7500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
    };

    const animation = createPulseAnimation();
    animation.start();

    return () => animation.stop();
  }, [pulseAnim]);

  // HOVER 6 dp above highest point of the notch
  // bottom = barHeight + SafeArea.bottom - 6
  const barHeight = 90;
  const notchDepth = 10;
  const hoverDistance = 6;
  const bottomPosition = barHeight + insets.bottom - hoverDistance - notchDepth;

  return (
    <AnimatedPressable
      style={[
        styles.fab,
        {
          bottom: bottomPosition,
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
    left: '50%',
    marginLeft: -36, // Half of 72dp width
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#D4AF37', // Mustard gold
    alignItems: 'center',
    justifyContent: 'center',
    // iOS + Android shadows
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 15,
    zIndex: 100,
  },
});

export default FABPulse; 