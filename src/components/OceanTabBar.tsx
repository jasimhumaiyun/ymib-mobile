import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import NotchedBackground from './NotchedBackground';
import FABPulse from './FABPulse';

const OceanTabBar: React.FC<BottomTabBarProps> = ({ state, descriptors, navigation }) => {
  const insets = useSafeAreaInsets();

  const getTabIcon = (routeName: string, focused: boolean): React.JSX.Element => {
    const iconColor = focused ? '#D4AF37' : '#8FA3A6'; // active vs inactive
    const iconSize = 24;

    switch (routeName) {
      case 'index':
        return <Ionicons name={focused ? 'home' : 'home-outline'} size={iconSize} color={iconColor} />;
      case 'explore':
        return <Ionicons name={focused ? 'globe' : 'globe-outline'} size={iconSize} color={iconColor} />;
      case 'messages':
        return <Ionicons name={focused ? 'chatbubbles' : 'chatbubbles-outline'} size={iconSize} color={iconColor} />;
      case 'profile':
        return <Ionicons name={focused ? 'person' : 'person-outline'} size={iconSize} color={iconColor} />;
      default:
        return <Ionicons name="help-outline" size={iconSize} color={iconColor} />;
    }
  };

  const getTabLabel = (routeName: string): string => {
    switch (routeName) {
      case 'index':
        return 'Harbor';
      case 'explore':
        return 'World Map';
      case 'messages':
        return 'Chats';
      case 'profile':
        return 'Profile';
      default:
        return 'Tab';
    }
  };

  const renderTab = (route: any, index: number) => {
    const { options } = descriptors[route.key];
    const isFocused = state.index === index;

    const onPress = () => {
      const event = navigation.emit({
        type: 'tabPress',
        target: route.key,
        canPreventDefault: true,
      });

      if (!isFocused && !event.defaultPrevented) {
        navigation.navigate(route.name);
      }
    };

    return (
      <Pressable
        key={route.key}
        onPress={onPress}
        style={styles.tab}
        android_ripple={{ color: 'rgba(212, 175, 55, 0.2)', radius: 32 }}
      >
        {getTabIcon(route.name, isFocused)}
        <Text style={[styles.tabLabel, isFocused && styles.activeTabLabel]}>
          {getTabLabel(route.name)}
        </Text>
      </Pressable>
    );
  };

  return (
    <View style={[styles.container, { 
      height: 90 + insets.bottom, 
      paddingBottom: insets.bottom 
    }]}>
      {/* Notched Background - absolute positioned */}
      <NotchedBackground />
      
      {/* Tab Row - positioned below the notch with 32dp paddingTop */}
      <View style={styles.tabRow}>
        {/* Left Stack - first 2 routes */}
        <View style={styles.leftStack}>
          {state.routes.slice(0, 2).map((route, index) => renderTab(route, index))}
        </View>

        {/* Spacer - 90dp width to match notch */}
        <View style={styles.spacer} />

        {/* Right Stack - last 2 routes */}
        <View style={styles.rightStack}>
          {state.routes.slice(2).map((route, index) => renderTab(route, index + 2))}
        </View>
      </View>

      {/* Floating Action Button - absolute positioned */}
      <FABPulse onPress={() => router.push('/scan')} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    backgroundColor: 'transparent', // SVG covers background
    // Elevation & iOS shadow for the whole bar
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 16,
  },
  tabRow: {
    flexDirection: 'row',
    height: 90,
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 32, // 32dp so icons sit dead-centre in visible dark area
    zIndex: 1,
  },
  leftStack: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  spacer: {
    width: 90, // 90dp width matches notch
  },
  rightStack: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  tab: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    minWidth: 44, // minHit 44x44
    minHeight: 44,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#8FA3A6', // inactive color
    marginTop: 2,
    textAlign: 'center',
  },
  activeTabLabel: {
    color: '#D4AF37', // active color
    fontWeight: '600',
  },
});

export default OceanTabBar; 