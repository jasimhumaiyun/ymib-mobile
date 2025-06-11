import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

export interface UserProfile {
  id: string;
  username: string;
  email?: string;
  is_anonymous: boolean;
  device_id: string;
  created_at: string;
  updated_at: string;
  avatar_url?: string;
  bio?: string;
  total_bottles_created: number;
  total_bottles_found: number;
  total_bottles_retossed: number;
}

// Generate a unique device identifier
const generateDeviceId = (): string => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  const platform = Platform.OS.substring(0, 3);
  return `${platform}_${timestamp}_${random}`;
};

// Generate a UUID v4
const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// Generate anonymous maritime username
const generateAnonymousUsername = (): string => {
  const prefixes = [
    'Wanderer', 'Voyager', 'Sailor', 'Explorer', 'Drifter', 
    'Navigator', 'Adventurer', 'Traveler', 'Seeker', 'Roamer',
    'Captain', 'Mariner', 'Seafarer', 'Corsair', 'Buccaneer'
  ];
  const suffix = Math.floor(Math.random() * 999) + 1;
  return `${prefixes[Math.floor(Math.random() * prefixes.length)]}${suffix}`;
};

export function useUserProfiles() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    initializeUser();
  }, []);

  const initializeUser = async () => {
    try {
      setLoading(true);
      setError(null);

      // Check for existing user ID in AsyncStorage
      const storedUserId = await AsyncStorage.getItem('ymib_user_id');
      
      if (storedUserId) {
        // Load existing user from database
        const user = await loadUserProfile(storedUserId);
        if (user) {
          setCurrentUser(user);
          return;
        }
      }

      // Check for legacy username in AsyncStorage
      const legacyUsername = await AsyncStorage.getItem('ymib_username');
      const legacyIsAnonymous = await AsyncStorage.getItem('ymib_is_anonymous');
      
      if (legacyUsername) {
        console.log('🔄 Found legacy user, checking if already exists in database:', legacyUsername);
        
        // First check if this username already exists in database
        const { data: existingUser } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('username', legacyUsername)
          .single();
        
        if (existingUser) {
          // User already exists in database, just use it
          console.log('✅ Legacy user already exists in database, using existing profile');
          setCurrentUser(existingUser as UserProfile);
          await AsyncStorage.setItem('ymib_user_id', existingUser.id);
        } else {
          // User doesn't exist, create new profile
          console.log('🔄 Migrating legacy user to database:', legacyUsername);
          const migratedUser = await createUserProfile(
            legacyUsername, 
            legacyIsAnonymous === 'true'
          );
          
          if (migratedUser) {
            setCurrentUser(migratedUser);
          }
        }
        
        // Clear legacy storage regardless
        await AsyncStorage.multiRemove(['ymib_username', 'ymib_is_anonymous', 'userName']);
      }
    } catch (err: any) {
      console.error('❌ Error initializing user:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadUserProfile = async (userId: string): Promise<UserProfile | null> => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // User not found
          return null;
        }
        throw error;
      }

      return data as UserProfile;
    } catch (err: any) {
      console.error('❌ Error loading user profile:', err);
      return null;
    }
  };

  const createUserProfile = async (
    username: string, 
    isAnonymous: boolean
  ): Promise<UserProfile | null> => {
    try {
      const deviceId = await getOrCreateDeviceId();
      const userId = generateUUID();
      
      // Check if username is already taken (only for custom usernames)
      if (!isAnonymous) {
        const { data: existingUser } = await supabase
          .from('user_profiles')
          .select('username')
          .eq('username', username)
          .single();

        if (existingUser) {
          throw new Error('Username is already taken');
        }
      }

      const newProfile: Partial<UserProfile> = {
        id: userId,
        username: username.trim(),
        is_anonymous: isAnonymous,
        device_id: deviceId,
        email: `${username.toLowerCase()}@${isAnonymous ? 'anonymous' : 'custom'}.ymib.local`,
        total_bottles_created: 0,
        total_bottles_found: 0,
        total_bottles_retossed: 0,
      };

      const { data, error } = await supabase
        .from('user_profiles')
        .insert(newProfile)
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Store user ID locally
      await AsyncStorage.setItem('ymib_user_id', userId);
      
      console.log('✅ User profile created:', username);
      return data as UserProfile;
    } catch (err: any) {
      console.error('❌ Error creating user profile:', err);
      throw err;
    }
  };

  const updateUserProfile = async (
    updates: Partial<UserProfile>
  ): Promise<UserProfile | null> => {
    if (!currentUser) {
      throw new Error('No current user to update');
    }

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', currentUser.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      const updatedUser = data as UserProfile;
      setCurrentUser(updatedUser);
      return updatedUser;
    } catch (err: any) {
      console.error('❌ Error updating user profile:', err);
      throw err;
    }
  };

  const incrementBottleStats = async (statType: 'created' | 'found' | 'retossed') => {
    if (!currentUser) return;

    try {
      const statField = `total_bottles_${statType}`;
      const currentValue = currentUser[statField as keyof UserProfile] as number;
      
      await updateUserProfile({
        [statField]: currentValue + 1,
      });
    } catch (err: any) {
      console.error(`❌ Error incrementing ${statType} stat:`, err);
    }
  };

  const getOrCreateDeviceId = async (): Promise<string> => {
    let deviceId = await AsyncStorage.getItem('deviceId');
    if (!deviceId) {
      deviceId = generateDeviceId();
      await AsyncStorage.setItem('deviceId', deviceId);
    }
    return deviceId;
  };

  const signUpAnonymously = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      setLoading(true);
      setError(null);
      
      const anonymousUsername = generateAnonymousUsername();
      const user = await createUserProfile(anonymousUsername, true);
      
      if (user) {
        setCurrentUser(user);
        return { success: true };
      }
      
      return { success: false, error: 'Failed to create anonymous user' };
    } catch (err: any) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const signUpWithUsername = async (username: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setLoading(true);
      setError(null);
      
      if (!username.trim() || username.length < 2) {
        return { success: false, error: 'Username must be at least 2 characters' };
      }

      const user = await createUserProfile(username.trim(), false);
      
      if (user) {
        setCurrentUser(user);
        return { success: true };
      }
      
      return { success: false, error: 'Failed to create user' };
    } catch (err: any) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      // Clear all local storage
      await AsyncStorage.multiRemove([
        'ymib_user_id',
        'ymib_username', 
        'ymib_is_anonymous', 
        'userName', 
        'deviceId'
      ]);
      
      setCurrentUser(null);
      setError(null);
      
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  return {
    currentUser,
    loading,
    error,
    signUpAnonymously,
    signUpWithUsername,
    signOut,
    updateUserProfile,
    incrementBottleStats,
    refreshUser: () => initializeUser(),
    isAuthenticated: !!currentUser,
    isAnonymous: currentUser?.is_anonymous ?? false,
    username: currentUser?.username || null,
    hasUsername: !!currentUser?.username,
  };
} 