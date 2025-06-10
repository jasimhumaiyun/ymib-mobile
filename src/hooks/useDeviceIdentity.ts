import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

interface DeviceIdentity {
  deviceId: string;
  userName: string;
  isAnonymous: boolean;
}

// Generate a unique device identifier
const generateDeviceId = (): string => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  const platform = Platform.OS.substring(0, 3);
  return `${platform}_${timestamp}_${random}`;
};

// Generate a random anonymous name
const generateAnonymousName = (): string => {
  const prefixes = [
    'Wanderer', 'Voyager', 'Sailor', 'Explorer', 'Drifter', 
    'Navigator', 'Adventurer', 'Traveler', 'Seeker', 'Roamer'
  ];
  const suffix = Math.floor(Math.random() * 999) + 1;
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  return `${prefix}${suffix}`;
};

export function useDeviceIdentity() {
  const [identity, setIdentity] = useState<DeviceIdentity | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize device identity
  useEffect(() => {
    initializeIdentity();
  }, []);

  const initializeIdentity = async () => {
    try {
      // Initializing device identity
      
      // Check if we already have a device identity
      const existingDeviceId = await AsyncStorage.getItem('deviceId');
      const existingUserName = await AsyncStorage.getItem('userName');
      
      let deviceId = existingDeviceId;
      let userName = existingUserName;
      
      // Generate device ID if it doesn't exist
      if (!deviceId) {
        deviceId = generateDeviceId();
        await AsyncStorage.setItem('deviceId', deviceId);
                  // Generated new device ID
      }
      
      // Generate anonymous name if user hasn't set one
      if (!userName) {
        userName = generateAnonymousName();
        await AsyncStorage.setItem('userName', userName);
                  // Generated anonymous name
      }
      
      const deviceIdentity: DeviceIdentity = {
        deviceId,
        userName,
        isAnonymous: true
      };
      
      setIdentity(deviceIdentity);
              // Device identity initialized successfully
    } catch (error) {
      console.error('❌ Error initializing device identity:', error);
      
      // Fallback: create basic identity
      const fallbackIdentity: DeviceIdentity = {
        deviceId: generateDeviceId(),
        userName: generateAnonymousName(),
        isAnonymous: true
      };
      setIdentity(fallbackIdentity);
    } finally {
      setIsLoading(false);
    }
  };

  // Update user name
  const updateUserName = async (newName: string) => {
    if (!identity) return;
    
    try {
      const trimmedName = newName.trim();
      if (!trimmedName) {
        throw new Error('Name cannot be empty');
      }
      
      await AsyncStorage.setItem('userName', trimmedName);
      
      const updatedIdentity = {
        ...identity,
        userName: trimmedName
      };
      
      setIdentity(updatedIdentity);
      console.log('✅ Updated user name to:', trimmedName);
      
      return true;
    } catch (error) {
      console.error('❌ Error updating user name:', error);
      return false;
    }
  };

  // Get current user info for API calls
  const getUserInfo = () => {
    if (!identity) {
      return {
        userId: 'unknown',
        userName: 'Anonymous',
        deviceId: 'unknown'
      };
    }
    
    return {
      userId: identity.deviceId,
      userName: identity.userName,
      deviceId: identity.deviceId
    };
  };

  // Reset identity (for testing purposes)
  const resetIdentity = async () => {
    try {
      await AsyncStorage.multiRemove(['deviceId', 'userName']);
      await initializeIdentity();
      console.log('🔄 Device identity reset');
    } catch (error) {
      console.error('❌ Error resetting identity:', error);
    }
  };

  return {
    identity,
    isLoading,
    updateUserName,
    getUserInfo,
    resetIdentity
  };
} 