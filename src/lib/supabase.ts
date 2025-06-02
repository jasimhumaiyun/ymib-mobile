import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

const supabaseUrl = Constants.expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = Constants.expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Environment variables not found in Constants.expoConfig.extra');
  console.error('Available extra keys:', Object.keys(Constants.expoConfig?.extra || {}));
  throw new Error('Missing Supabase environment variables. Please check your .env file and app.config.js');
}

console.log('✅ Supabase URL loaded:', supabaseUrl.substring(0, 30) + '...');

export const supabase = createClient(supabaseUrl, supabaseAnonKey); 