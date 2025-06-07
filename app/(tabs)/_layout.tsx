import { Tabs } from 'expo-router';
import { ImageBackground } from 'react-native';
import OceanTabBar from '../../src/components/OceanTabBar';

export default function TabLayout() {
  return (
    <ImageBackground 
      source={require('../../images/homepage_BG_new.png')} 
      style={{ flex: 1 }}
      resizeMode="cover"
    >
      <Tabs
        tabBar={(props) => <OceanTabBar {...props} />}
        screenOptions={{
          headerShown: false, // We'll handle headers in individual screens
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Harbor',
          }}
        />
        <Tabs.Screen
          name="explore"
          options={{
            title: 'World Map',
          }}
        />
        <Tabs.Screen
          name="messages"
          options={{
            title: 'Chats',
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
          }}
        />
      </Tabs>
    </ImageBackground>
  );
} 