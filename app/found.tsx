import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, Alert, Animated, ImageBackground, Image, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../src/lib/supabase';
import { useUserProfiles } from '../src/hooks/useUserProfiles';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../src/constants/theme';
import { Ionicons } from '@expo/vector-icons';

type FoundStep = 'bottle-view' | 'message-view' | 'reply-compose' | 'found-options' | 'retossing' | 'success';

interface BottleData {
  id: string;
  message: string;
  photo_url?: string;
  created_at: string;
  creator_name?: string;
  tosser_name?: string;
  status: 'adrift' | 'found';
}

export default function FoundScreen() {
  const params = useLocalSearchParams();
  const { username } = useUserProfiles(); // Get consistent username
  const [step, setStep] = useState<FoundStep>('bottle-view');
  const [bottleData, setBottleData] = useState<BottleData | null>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [replyPhoto, setReplyPhoto] = useState<string | null>(null);
  const [finderName, setFinderName] = useState('');
  const [showNameField, setShowNameField] = useState(false);
  const [loading, setLoading] = useState(false);
  const [bottleId, setBottleId] = useState<string>('');
  const [bottlePassword, setBottlePassword] = useState<string>('');
  const [hasSkippedToRetoss, setHasSkippedToRetoss] = useState(false);
  const [isCheckingRetoss, setIsCheckingRetoss] = useState(false);

  // Animation refs for retoss
  const bottleAnimation = useRef(new Animated.Value(0)).current;
  const bottleRotation = useRef(new Animated.Value(0)).current;
  const bottleScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (params.bottleId && params.bottlePassword) {
      setBottleId(params.bottleId as string);
      setBottlePassword(params.bottlePassword as string);
      fetchBottleData(params.bottleId as string);
    }
    
    checkUserProfile();
  }, [params]);

  // Handle skipToRetoss after bottle data is loaded (only once)
  useEffect(() => {
    if (params.skipToRetoss === 'true' && bottleData && !hasSkippedToRetoss) {

      // Reset animation values to ensure they're properly initialized
      bottleAnimation.setValue(0);
      bottleRotation.setValue(0);
      bottleScale.setValue(1);
      setStep('found-options');
      setHasSkippedToRetoss(true); // Prevent this from running again
    }
  }, [params.skipToRetoss, bottleData, hasSkippedToRetoss]);

  // Start bottle animation when retossing step begins
  useEffect(() => {
    if (step === 'retossing') {
      startRetossAnimation();
    }
  }, [step]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      setIsCheckingRetoss(false);
      setLoading(false);
    };
  }, []);

  const checkUserProfile = async () => {
    try {
      const savedName = await AsyncStorage.getItem('userName');
      if (savedName && savedName.trim()) {
        setFinderName(savedName);
        setShowNameField(false);
      } else {
        setShowNameField(true);
      }
    } catch (error) {
      console.log('Error checking user profile:', error);
      setShowNameField(true);
    }
  };

  const fetchBottleData = async (id: string) => {
    try {
      const { data: bottle, error } = await supabase
        .from('bottles')
        .select('id, message, photo_url, created_at, creator_name, tosser_name, status')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching bottle data:', error);
        Alert.alert('Error', 'Failed to load bottle data');
        handleClose();
        return;
      }

      setBottleData(bottle);
    } catch (error) {
      console.error('Error fetching bottle:', error);
      Alert.alert('Error', 'Something went wrong');
      handleClose();
    }
  };

  const startRetossAnimation = () => {
    // Reset animations
    bottleAnimation.setValue(0);
    bottleRotation.setValue(0);
    bottleScale.setValue(1);

    // 5-second animation sequence (same as original toss)
    Animated.sequence([
      // Phase 1: Bottle flies up with rotation (3 seconds)
      Animated.parallel([
        Animated.timing(bottleAnimation, {
          toValue: 0.6,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(bottleRotation, {
          toValue: 4,
          duration: 3000,
          useNativeDriver: true,
        }),
      ]),
      // Phase 2: Fast spinning and disappearing (2 seconds)
      Animated.parallel([
        Animated.timing(bottleAnimation, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(bottleRotation, {
          toValue: 12,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(bottleScale, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      setTimeout(() => {
        setStep('success');
      }, 500);
    });
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setReplyPhoto(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    
    if (!permissionResult.granted) {
      Alert.alert('Permission Required', 'Camera permission is needed to take photos');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setReplyPhoto(result.assets[0].uri);
    }
  };

  const uploadPhoto = async (photoUri: string): Promise<string | null> => {
    try {
      const response = await fetch(photoUri);
      const blob = await response.blob();
      
      const fileExt = photoUri.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `bottle-photos/${fileName}`;

      const { data, error } = await supabase.storage
        .from('bottles')
        .upload(filePath, blob);

      if (error) {
        console.error('Upload error:', error);
        return null;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('bottles')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Photo upload failed:', error);
      return null;
    }
  };

  const handleMarkAsFound = async () => {
    if (!replyMessage.trim()) {
      Alert.alert('Reply Required', 'Please enter a reply message');
      return;
    }

    setLoading(true);

    try {
      // Save finder name if provided
      if (showNameField && finderName.trim()) {
        await AsyncStorage.setItem('userName', finderName.trim());
      }

      // Get location
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Location permission is needed');
        setLoading(false);
        return;
      }

      const { coords } = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      // Upload photo if provided
      let photoUrl = null;
      if (replyPhoto) {
        photoUrl = await uploadPhoto(replyPhoto);
      }

      // Call edge function to mark as found with reply
      const actualFinderName = username || finderName.trim() || 'Anonymous';
      const requestBody = {
        id: bottleId,
        password: bottlePassword,
        message: `REPLY: ${replyMessage.trim()}`,
        photoUrl,
        finderName: actualFinderName,
        lat: coords.latitude,
        lon: coords.longitude,
        action: 'found'
      };
      

      
      const { data, error } = await supabase.functions.invoke('claim_or_toss_bottle', {
        body: requestBody,
      });

      if (error) {
        Alert.alert('Error', error.message || 'Failed to mark bottle as found');
        setLoading(false);
        return;
      }

      // Trigger a stats refresh after successful found action
      setStep('found-options');
    } catch (error) {
      console.error('Error marking as found:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  const handleRetoss = async () => {
    // Prevent rapid clicking
    if (isCheckingRetoss) return;
    
    setIsCheckingRetoss(true);
    
    try {
      // Simple delay to allow database to update
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const { data: freshBottle, error } = await supabase
        .from('bottles')
        .select('status, tosser_name')
        .eq('id', bottleId)
        .single();

      if (error) {
        console.error('Error checking bottle status:', error);
        Alert.alert('Error', 'Could not verify bottle status');
        return;
      }

      if (freshBottle.status === 'adrift') {
        // Check if current user was the last tosser
        const currentUser = username?.trim().toLowerCase() || '';
        const lastTosser = freshBottle.tosser_name?.trim().toLowerCase() || '';
        
        if (currentUser === lastTosser && currentUser !== '') {
          Alert.alert('Already Retossed', 'You already retossed this bottle! It\'s now floating in the digital ocean waiting for someone else to find it.\n\nDon\'t forget to toss the physical bottle as well!');
          handleClose();
          return;
        } else {
          Alert.alert('Already Retossed', 'This bottle has already been retossed and is back in the ocean!');
          handleClose();
          return;
        }
      }

      // If status is 'found', check if current user is the one who found it
      if (freshBottle.status === 'found') {
        // Get the last 'found' event to see who found it
        const { data: lastFoundEvent } = await supabase
          .from('bottle_events')
          .select('finder_name')
          .eq('bottle_id', bottleId)
          .eq('event_type', 'found')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        const currentUser = username?.trim().toLowerCase() || '';
        const finder = lastFoundEvent?.finder_name?.trim().toLowerCase() || '';
        
        if (currentUser !== finder || currentUser === '') {
          Alert.alert('Access Denied', 'Only the person who found this bottle can retoss it.');
          handleClose();
          return;
        }
        
        // Current user found it, allow retoss
        router.push({
          pathname: '/toss',
          params: {
            bottleId: bottleId,
            bottlePassword: bottlePassword,
            mode: 'retoss'
          }
        });
        return;
      }

      // Unknown status - should not happen
      Alert.alert('Error', 'Unknown bottle status. Please try again.');
      handleClose();
    } catch (error) {
      console.error('Error checking bottle status:', error);
      Alert.alert('Error', 'Could not verify bottle status');
    } finally {
      setIsCheckingRetoss(false);
    }
  };

  const handleRetossNow = async () => {
    // Prevent double-taps
    if (loading || step === 'retossing') {
      return;
    }
    
    setLoading(true);
    setStep('retossing');

    try {
      // Get location
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Location permission is needed');
        setLoading(false);
        setStep('found-options');
        return;
      }

      const { coords } = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      // Call edge function to retoss (with message to indicate retoss action)
      const actualTosserName = username || finderName.trim() || 'Anonymous';
      
      const response = await fetch(`${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/claim_or_toss_bottle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          id: bottleId,
          password: bottlePassword,
          message: "Continuing the journey...",
          tosserName: actualTosserName,
          lat: coords.latitude,
          lon: coords.longitude,
          action: 'retoss'
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Error retossing bottle:', response.status, errorText);
        throw new Error(`Failed to retoss bottle: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Retoss successful, result:', result);
      console.log('📋 Current user who retossed:', actualTosserName);

      // Update local bottle data to prevent double retoss
      if (bottleData) {
        setBottleData({ ...bottleData, status: 'adrift' });
        console.log('📝 Updated local bottle data status to adrift');
      }

      // Animation will automatically transition to success (handled by useEffect)
    } catch (error) {
      console.error('Error retossing bottle:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
      setStep('found-options');
    } finally {
      setLoading(false);
    }
  };

  const handleGoToChat = () => {
    // Navigate to messages tab
    try {
      if (router.canDismiss()) {
        router.dismissAll();
      } else {
        // Navigate to messages tab
        router.replace('/(tabs)/messages');
      }
    } catch (error) {
      console.error('Navigation error:', error);
      // Fallback: try to navigate to messages tab
      router.replace('/(tabs)/messages');
    }
  };

  const handleClose = () => {
    try {
      console.log('🔄 Closing found screen...');
      // Reset any loading states
      setIsCheckingRetoss(false);
      setLoading(false);
      
      // Always dismiss all modals and navigate to main tabs
      if (router.canDismiss()) {
        console.log('✅ Dismissing all modals');
        router.dismissAll();
      }
      
      // Use replace to ensure clean navigation
      console.log('✅ Navigating to main tabs');
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Navigation error:', error);
      // Fallback: try to navigate to home
      router.replace('/(tabs)');
    }
  };

  const renderContent = () => {
    if (!bottleData) {
      return (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading bottle...</Text>
        </View>
      );
    }

    switch (step) {
      case 'bottle-view':
        return (
          <SafeAreaView style={styles.container}>
            <View style={styles.topBar}>
              <Pressable style={styles.closeButton} onPress={handleClose}>
                <Ionicons name="close" size={24} color={Colors.text.inverse} />
              </Pressable>
            </View>

            <View style={styles.bottleViewContainer}>
              <Text style={styles.title}>Bottle Found!</Text>
              <Text style={styles.subtitle}>
                You've discovered a message in a bottle
              </Text>

              <View style={styles.bottleImageContainer}>
                <Image 
                  source={require('../images/homepage_bottle.png')} 
                  style={styles.bottleImage}
                />
              </View>

              <Pressable 
                style={styles.openBottleButton}
                onPress={() => setStep('message-view')}
              >
                <Text style={styles.openBottleText}>Open Bottle</Text>
              </Pressable>
            </View>
          </SafeAreaView>
        );

      case 'message-view':
        return (
          <SafeAreaView style={styles.container}>
            <View style={styles.topBar}>
              <Pressable style={styles.closeButton} onPress={handleClose}>
                <Ionicons name="close" size={24} color={Colors.text.inverse} />
              </Pressable>
            </View>

            <ScrollView style={styles.messageContainer} showsVerticalScrollIndicator={false}>
              <Text style={styles.messageTitle}>Original Message</Text>
              
              <View style={styles.originalMessage}>
                <View style={styles.messageHeader}>
                  <Text style={styles.creatorName}>
                    From: {bottleData.creator_name || bottleData.tosser_name || 'Anonymous'}
                  </Text>
                  <Text style={styles.messageDate}>
                    {new Date(bottleData.created_at).toLocaleDateString()}
                  </Text>
                </View>

                <Text style={styles.messageText}>{bottleData.message}</Text>

                {bottleData.photo_url && (
                  <Image 
                    source={{ uri: bottleData.photo_url }} 
                    style={styles.messagePhoto}
                    onError={(error) => {
                      console.log('❌ Image error:', error.nativeEvent.error);
                      console.log('❌ Image URL:', bottleData.photo_url);
                    }}
                    onLoad={() => console.log('✅ Image loaded successfully:', bottleData.photo_url)}
                    onLoadStart={() => console.log('🔄 Image loading started:', bottleData.photo_url)}
                    onLoadEnd={() => console.log('🏁 Image loading ended:', bottleData.photo_url)}
                  />
                )}
              </View>

              <Pressable 
                style={styles.replyButton}
                onPress={() => setStep('reply-compose')}
              >
                <Text style={styles.replyButtonText}>💬 Write Your Reply</Text>
              </Pressable>
            </ScrollView>
          </SafeAreaView>
        );

      case 'reply-compose':
        return (
          <SafeAreaView style={styles.container}>
            <View style={styles.topBar}>
              <Pressable style={styles.closeButton} onPress={handleClose}>
                <Ionicons name="close" size={24} color={Colors.text.inverse} />
              </Pressable>
            </View>

            <ScrollView style={styles.replyContainer} showsVerticalScrollIndicator={false}>
              <Text style={styles.replyTitle}>Your Reply</Text>



              <Text style={styles.sectionTitle}>Your Reply Message</Text>
              <TextInput
                style={styles.replyInput}
                placeholder="What would you like to say to the bottle creator?"
                placeholderTextColor={Colors.text.secondary}
                value={replyMessage}
                onChangeText={setReplyMessage}
                multiline
                maxLength={500}
                textAlignVertical="top"
              />
              <Text style={styles.characterCount}>
                {replyMessage.length}/500 characters
              </Text>

              <Text style={styles.sectionTitle}>Add a Photo (Optional)</Text>
              
              {replyPhoto ? (
                <View style={styles.photoContainer}>
                  <Image source={{ uri: replyPhoto }} style={styles.photo} />
                  <Pressable 
                    style={styles.changePhotoButton} 
                    onPress={() => setReplyPhoto(null)}
                  >
                    <Text style={styles.changePhotoText}>Remove Photo</Text>
                  </Pressable>
                </View>
              ) : (
                <View style={styles.photoButtons}>
                  <Pressable style={styles.photoButton} onPress={takePhoto}>
                    <Ionicons name="camera" size={20} color={Colors.text.primary} />
                    <Text style={styles.photoButtonText}>Take Photo</Text>
                  </Pressable>
                  <Pressable style={styles.photoButton} onPress={pickImage}>
                    <Ionicons name="image" size={20} color={Colors.text.primary} />
                    <Text style={styles.photoButtonText}>Choose from Gallery</Text>
                  </Pressable>
                </View>
              )}

              <Pressable 
                style={[styles.markFoundButton, (!replyMessage.trim() || loading) && styles.disabledButton]}
                onPress={handleMarkAsFound}
                disabled={!replyMessage.trim() || loading}
              >
                <Text style={styles.markFoundText}>
                  {loading ? 'Marking as Found...' : 'Mark as Found'}
                </Text>
              </Pressable>
            </ScrollView>
          </SafeAreaView>
        );

      case 'found-options':
        return (
          <SafeAreaView style={styles.container}>
            <View style={styles.topBar}>
              <Pressable style={styles.closeButton} onPress={handleClose}>
                <Ionicons name="close" size={24} color={Colors.text.inverse} />
              </Pressable>
            </View>
            <View style={styles.optionsContainer}>
              <Text style={styles.optionsTitle}>Bottle Marked as Found!</Text>
              <Text style={styles.optionsSubtitle}>
                Your reply has been added to this bottle's journey. What would you like to do next?
              </Text>

              <View style={styles.optionButtons}>
                <Pressable 
                  style={[styles.retossButton, (loading || isCheckingRetoss) && styles.disabledButton]}
                  onPress={handleRetoss}
                  disabled={loading || isCheckingRetoss}
                >
                  <Ionicons name="refresh" size={24} color={Colors.text.inverse} />
                  <Text style={styles.retossButtonText}>
                    {isCheckingRetoss ? 'Checking...' : 'Retoss Bottle'}
                  </Text>
                  <Text style={styles.retossButtonSubtext}>Add your message and send it back</Text>
                </Pressable>
              </View>

              <Pressable 
                style={styles.laterButton}
                onPress={handleClose}
              >
                <Text style={styles.laterButtonText}>I'll decide later</Text>
              </Pressable>
            </View>
          </SafeAreaView>
        );

      case 'retossing':
        return (
          <SafeAreaView style={styles.container}>
            <View style={styles.animationContainer}>
              <Text style={styles.animationTitle}>Tossing your bottle...</Text>
              <Text style={styles.animationSubtitle}>
                Sending your message back into the digital ocean 🌊
              </Text>
              
              {/* Animated Bottle - Using actual bottle image */}
              <Animated.Image
                source={require('../images/homepage_bottle.png')}
                style={[
                  styles.animatedBottle,
                  {
                    transform: [
                      {
                        translateY: bottleAnimation.interpolate({
                          inputRange: [0, 1],
                          outputRange: [300, -400],
                        }),
                      },
                      {
                        rotate: bottleRotation.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['0deg', '1440deg'], // 4 full rotations
                        }),
                      },
                      { scale: bottleScale },
                    ],
                  },
                ]}
              />
              
              <Text style={styles.animationNote}>
                Reading your message while the bottle travels...
              </Text>
            </View>
          </SafeAreaView>
        );

      case 'success':
        return (
          <SafeAreaView style={styles.container}>
            <View style={styles.topBar}>
              <Pressable style={styles.closeButton} onPress={handleClose}>
                <Ionicons name="close" size={24} color={Colors.text.inverse} />
              </Pressable>
            </View>
            <View style={styles.successContainer}>
              <Text style={styles.successIcon}>🌊</Text>
              <Text style={styles.successTitle}>Journey Continues!</Text>
              <Text style={styles.successText}>
                The bottle has been retossed and is now drifting toward new adventures, carrying your reply along with the original message.
              </Text>
              
              <View style={styles.successDetails}>
                <Text style={styles.successDetailTitle}>Bottle #{bottleId.slice(0, 8)}...</Text>
                <Text style={styles.successDetailText}>
                  Status: Adrift with your reply
                </Text>
              </View>

              <Pressable 
                style={styles.continueButton} 
                onPress={handleClose}
              >
                <Text style={styles.continueButtonText}>Continue Exploring</Text>
              </Pressable>
            </View>
          </SafeAreaView>
        );

      default:
        return null;
    }
  };

  return (
    <ImageBackground 
      source={require('../images/homepage_BG_new.png')} 
      style={styles.fullScreen}
      resizeMode="cover"
    >
      <Stack.Screen options={{ 
        presentation: 'modal',
        headerShown: false 
      }} />
      {renderContent()}
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(1, 67, 72, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.base,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: Typography.sizes.lg,
    color: Colors.text.inverse,
  },
  bottleViewContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
  },
  title: {
    fontSize: Typography.sizes['3xl'],
    fontWeight: Typography.weights.bold,
    color: Colors.accent.mustardSea,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: Typography.sizes.lg,
    color: Colors.text.primary,
    textAlign: 'center',
    marginBottom: Spacing['2xl'],
    fontWeight: Typography.weights.medium,
  },
  bottleImageContainer: {
    alignItems: 'center',
    marginBottom: Spacing['2xl'],
  },
  bottleImage: {
    width: 280,
    height: 280,
    resizeMode: 'contain',
    marginBottom: Spacing.lg,
  },
  bottleHint: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.inverse,
    opacity: 0.8,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  openBottleButton: {
    backgroundColor: Colors.accent.mustardSea,
    paddingHorizontal: Spacing['2xl'],
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.lg,
    ...Shadows.md,
  },
  openBottleText: {
    color: Colors.text.primary,
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
  },
  messageContainer: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  messageTitle: {
    fontSize: Typography.sizes['2xl'],
    fontWeight: Typography.weights.bold,
    color: Colors.text.ocean,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  originalMessage: {
    backgroundColor: 'rgba(1, 67, 72, 0.8)',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    maxHeight: 250,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  creatorName: {
    fontSize: Typography.sizes.sm,
    color: Colors.accent.mustardSea,
    fontWeight: Typography.weights.semibold,
  },
  messageDate: {
    fontSize: Typography.sizes.xs,
    color: Colors.text.inverse,
    opacity: 0.7,
  },
  messageText: {
    fontSize: Typography.sizes.md,
    color: Colors.text.inverse,
    lineHeight: Typography.lineHeights.relaxed * Typography.sizes.md,
    marginBottom: Spacing.md,
  },
  messagePhoto: {
    width: '100%',
    height: 200,
    borderRadius: BorderRadius.md,
    resizeMode: 'cover',
  },
  replyButton: {
    backgroundColor: Colors.accent.mustardSea,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    ...Shadows.md,
  },
  replyButtonText: {
    color: Colors.text.primary,
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
  },
  replyContainer: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  replyTitle: {
    fontSize: Typography.sizes['2xl'],
    fontWeight: Typography.weights.bold,
    color: Colors.text.ocean,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.semibold,
    color: Colors.text.ocean,
    marginBottom: Spacing.md,
  },
  nameInput: {
    backgroundColor: 'rgba(1, 67, 72, 0.8)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    fontSize: Typography.sizes.md,
    color: Colors.text.inverse,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: Spacing.sm,
    ...Shadows.md,
  },
  fieldNote: {
    fontSize: Typography.sizes.xs,
    color: Colors.text.secondary,
    marginBottom: Spacing.xl,
    fontStyle: 'italic',
  },
  replyInput: {
    backgroundColor: Colors.primary[100],
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    fontSize: Typography.sizes.md,
    color: Colors.text.primary,
    minHeight: 120,
    borderWidth: 1,
    borderColor: Colors.primary[300],
    ...Shadows.md,
  },
  characterCount: {
    fontSize: Typography.sizes.xs,
    color: Colors.text.secondary,
    textAlign: 'right',
    marginTop: Spacing.xs,
    marginBottom: Spacing.xl,
  },
  photoContainer: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  photo: {
    width: 200,
    height: 200,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
  },
  changePhotoButton: {
    backgroundColor: 'rgba(212, 175, 55, 0.2)',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  changePhotoText: {
    color: Colors.accent.mustardSea,
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
  },
  photoButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  photoButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.accent.mustardSea,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
    ...Shadows.md,
  },
  photoButtonText: {
    color: Colors.text.primary,
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
  },
  markFoundButton: {
    backgroundColor: Colors.accent.mustardSea,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    ...Shadows.md,
  },
  markFoundText: {
    color: Colors.text.primary,
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
  },
  disabledButton: {
    opacity: 0.5,
  },
  optionsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
  },
  optionsTitle: {
    fontSize: Typography.sizes['2xl'],
    fontWeight: Typography.weights.bold,
    color: Colors.text.inverse,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  optionsSubtitle: {
    fontSize: Typography.sizes.md,
    color: Colors.text.inverse,
    opacity: 0.8,
    textAlign: 'center',
    marginBottom: Spacing['2xl'],
    lineHeight: Typography.lineHeights.relaxed * Typography.sizes.md,
  },
  optionButtons: {
    width: '100%',
    gap: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  chatButton: {
    backgroundColor: Colors.accent.mustardSea,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    ...Shadows.md,
  },
  chatButtonText: {
    color: Colors.text.primary,
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    marginTop: Spacing.sm,
  },
  chatButtonSubtext: {
    color: Colors.text.primary,
    fontSize: Typography.sizes.sm,
    opacity: 0.8,
    marginTop: Spacing.xs,
  },
  retossButton: {
    backgroundColor: Colors.primary[600],
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    ...Shadows.md,
  },
  retossButtonText: {
    color: Colors.text.inverse,
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    marginTop: Spacing.sm,
  },
  retossButtonSubtext: {
    color: Colors.text.inverse,
    fontSize: Typography.sizes.sm,
    opacity: 0.8,
    marginTop: Spacing.xs,
  },
  laterButton: {
    paddingVertical: Spacing.md,
  },
  laterButtonText: {
    color: Colors.text.inverse,
    fontSize: Typography.sizes.md,
    opacity: 0.7,
    textDecorationLine: 'underline',
  },
  animationContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
  },
  animationTitle: {
    fontSize: Typography.sizes['2xl'],
    fontWeight: Typography.weights.bold,
    color: Colors.text.inverse,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  animationSubtitle: {
    fontSize: Typography.sizes.md,
    color: Colors.text.inverse,
    opacity: 0.8,
    textAlign: 'center',
    marginBottom: Spacing['4xl'],
  },
  animatedBottle: {
    width: 120,
    height: 120,
    resizeMode: 'contain',
  },
  animationNote: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.inverse,
    opacity: 0.7,
    textAlign: 'center',
    marginTop: Spacing['4xl'],
    fontStyle: 'italic',
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
  },
  successIcon: {
    fontSize: 80,
    marginBottom: Spacing.xl,
  },
  successTitle: {
    fontSize: Typography.sizes['3xl'],
    fontWeight: Typography.weights.bold,
    color: Colors.text.inverse,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  successText: {
    fontSize: Typography.sizes.md,
    color: Colors.text.inverse,
    opacity: 0.9,
    textAlign: 'center',
    lineHeight: Typography.lineHeights.relaxed * Typography.sizes.md,
    marginBottom: Spacing.xl,
  },
  successDetails: {
    backgroundColor: 'rgba(1, 67, 72, 0.6)',
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  successDetailTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    color: Colors.accent.mustardSea,
    marginBottom: Spacing.sm,
  },
  successDetailText: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.inverse,
    opacity: 0.8,
  },
  continueButton: {
    backgroundColor: Colors.accent.mustardSea,
    paddingHorizontal: Spacing['2xl'],
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.lg,
    ...Shadows.md,
  },
  continueButtonText: {
    color: Colors.text.primary,
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
  },
  currentNameContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(1, 67, 72, 0.6)',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  currentNameText: {
    fontSize: Typography.sizes.md,
    color: Colors.text.inverse,
    fontWeight: Typography.weights.medium,
  },
  changeNameButton: {
    backgroundColor: Colors.accent.mustardSea,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  changeNameText: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.primary,
    fontWeight: Typography.weights.semibold,
  },
}); 