// Quick script to clear all AsyncStorage data
// Add this to any component temporarily and run it

import AsyncStorage from '@react-native-async-storage/async-storage';

export const clearAllStorage = async () => {
  try {
    await AsyncStorage.clear();
    console.log('✅ All AsyncStorage cleared');
  } catch (error) {
    console.error('❌ Error clearing storage:', error);
  }
};

// Or clear specific keys only:
export const clearUserData = async () => {
  try {
    await AsyncStorage.multiRemove([
      'ymib_user_id',
      'ymib_username', 
      'ymib_is_anonymous', 
      'userName', 
      'deviceId'
    ]);
    console.log('✅ User data cleared');
  } catch (error) {
    console.error('❌ Error clearing user data:', error);
  }
}; 