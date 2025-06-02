import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

const supabaseUrl = Constants.expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = Constants.expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Environment variables not found in Constants.expoConfig.extra');
  console.error('Available extra keys:', Object.keys(Constants.expoConfig?.extra || {}));
  console.error('Make sure your .env file exists and contains:');
  console.error('EXPO_PUBLIC_SUPABASE_URL=your_supabase_url');
  console.error('EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key');
  throw new Error('Missing Supabase environment variables. Please check your .env file and restart Expo.');
}

console.log('✅ Supabase configuration loaded successfully');

export const supabase = createClient(supabaseUrl, supabaseAnonKey); 