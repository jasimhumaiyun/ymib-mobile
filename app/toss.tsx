import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, Alert, Animated, ImageBackground, Image, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../src/lib/supabase';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../src/constants/theme';
import { Ionicons } from '@expo/vector-icons';

type TossStep = 'compose' | 'tossing' | 'success';

export default function TossScreen() {
  const params = useLocalSearchParams();
  const [step, setStep] = useState<TossStep>('compose');
  const [message, setMessage] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [userName, setUserName] = useState('');
  

  const [showNameField, setShowNameField] = useState(false);
  const [loading, setLoading] = useState(false);
  const [bottleId, setBottleId] = useState<string>('');
  const [bottlePassword, setBottlePassword] = useState<string>('');

  // Animation refs
  const bottleAnimation = useRef(new Animated.Value(0)).current;
  const bottleRotation = useRef(new Animated.Value(0)).current;
  const bottleScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Get bottle data from params
    if (params.bottleId && params.bottlePassword) {
      setBottleId(params.bottleId as string);
      setBottlePassword(params.bottlePassword as string);
    }
    
    // Check if user has a saved name (simulating profile check)
    checkUserProfile();
  }, [params]);

  // Start bottle animation when tossing step begins
  useEffect(() => {
    if (step === 'tossing') {
      startBottleAnimation();
    }
  }, [step]);

  const checkUserProfile = async () => {
    try {
      const savedName = await AsyncStorage.getItem('userName');
      console.log('🔍 Saved name from AsyncStorage:', savedName);
      
      if (savedName && savedName.trim()) {
        // User has a profile, don't show name field
        setUserName(savedName);
        setShowNameField(false);
        console.log('✅ User has profile, hiding name field');
      } else {
        // No profile, show name field
        setShowNameField(true);
        setUserName(''); // Clear any existing name
        console.log('❌ No profile found, showing name field');
      }
    } catch (error) {
      console.log('Error checking user profile:', error);
      setShowNameField(true); // Default to showing name field
    }
  };

  const startBottleAnimation = () => {
    // Reset animations
    bottleAnimation.setValue(0);
    bottleRotation.setValue(0);
    bottleScale.setValue(1);

    // 5-second animation sequence
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
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setPhoto(result.assets[0].uri);
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
      setPhoto(result.assets[0].uri);
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

  const handleToss = async () => {
    if (!message.trim()) {
      Alert.alert('Message Required', 'Please enter a message for your bottle');
      return;
    }

    setLoading(true);
    setStep('tossing');

    try {
      // Save user name if provided and not already saved
      if (showNameField && userName.trim()) {
        await AsyncStorage.setItem('userName', userName.trim());
      }

      // Get location
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Location permission is needed to toss your bottle');
        setLoading(false);
        setStep('compose');
        return;
      }

      const { coords } = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      // Upload photo if provided
      let photoUrl = null;
      if (photo) {
        photoUrl = await uploadPhoto(photo);
      }

      // Determine creator name
      const creatorName = userName.trim() || 'Anonymous';

      // Call edge function to create the bottle
      const { data, error } = await supabase.functions.invoke('claim_or_toss_bottle', {
        body: {
          id: bottleId,
          password: bottlePassword,
          message: message.trim(),
          photoUrl,
          tosserName: creatorName,
          lat: coords.latitude,
          lon: coords.longitude,
        },
      });

      if (error) {
        Alert.alert('Error', error.message || 'Failed to toss bottle');
        setStep('compose');
        return;
      }

      // Update bottle ID with the actual generated ID if it was a new bottle
      if (data?.id) {
        setBottleId(data.id);
      }

      // Animation will automatically transition to success

    } catch (error) {
      console.error('Error tossing bottle:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
      setStep('compose');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    try {
      if (router.canDismiss()) {
        router.dismissAll();
      } else {
        // Navigate to home tab instead of going back
        router.replace('/(tabs)');
      }
    } catch (error) {
      console.error('Navigation error:', error);
      // Fallback: try to navigate to home
      router.replace('/(tabs)');
    }
  };

  const renderContent = () => {
    switch (step) {
      case 'compose':
        return (
          <SafeAreaView style={styles.container}>
            {/* Universal Back to Home Button */}
            <View style={styles.topBar}>
              <Pressable style={styles.backButton} onPress={handleClose}>
                <Text style={styles.backButtonText}>← Home</Text>
              </Pressable>
            </View>

            <ScrollView style={styles.contentContainer} showsVerticalScrollIndicator={false}>
              <View style={styles.header}>
                <Text style={styles.title}>Cast Your Message</Text>
                <Text style={styles.subtitle}>
                  Send your thoughts across the digital seas
                </Text>
              </View>

              <View style={styles.formSection}>
                {/* Name Field - Only show if user doesn't have profile */}
                {showNameField && (
                  <>
                    <Text style={styles.sectionTitle}>Your Name (Optional)</Text>
                    <TextInput
                      style={styles.nameInput}
                      placeholder="Enter your name or leave blank for Anonymous"
                      placeholderTextColor="rgba(255, 255, 255, 0.6)"
                      value={userName}
                      onChangeText={setUserName}
                      maxLength={50}
                    />
                    <Text style={styles.fieldNote}>
                      This will be shown as the creator of this bottle
                    </Text>
                  </>
                )}

                {/* Show current name and option to change it */}
                {!showNameField && (
                  <View style={styles.currentNameContainer}>
                    <Text style={styles.currentNameText}>
                      Creating as: {userName || 'Anonymous'}
                    </Text>
                    <Pressable 
                      style={styles.changeNameButton}
                      onPress={async () => {
                        await AsyncStorage.removeItem('userName');
                        setUserName('');
                        setShowNameField(true);
                      }}
                    >
                      <Text style={styles.changeNameText}>Change Name</Text>
                    </Pressable>
                  </View>
                )}

                <Text style={styles.sectionTitle}>Your Message</Text>
                <TextInput
                  style={styles.messageInput}
                  placeholder="What message would you like to send into the world?"
                  placeholderTextColor="rgba(255, 255, 255, 0.6)"
                  value={message}
                  onChangeText={setMessage}
                  multiline
                  maxLength={500}
                  textAlignVertical="top"
                />
                <Text style={styles.characterCount}>
                  {message.length}/500 characters
                </Text>

                <Text style={styles.sectionTitle}>Add a Photo (Optional)</Text>
                
                {photo ? (
                  <View style={styles.photoContainer}>
                    <Image source={{ uri: photo }} style={styles.photo} />
                    <Pressable 
                      style={styles.changePhotoButton} 
                      onPress={() => setPhoto(null)}
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

                <View style={styles.bottleInfo}>
                  <Text style={styles.bottleInfoTitle}>🍾 Bottle Details</Text>
                  <Text style={styles.bottleInfoText}>
                    ID: #{bottleId.slice(0, 8)}...
                  </Text>
                  <Text style={styles.bottleInfoText}>
                    Creator: {userName.trim() || 'Anonymous'}
                  </Text>
                  <Text style={styles.bottleInfoText}>
                    This bottle will drift across the digital ocean, waiting to be discovered by other voyagers.
                  </Text>
                </View>

                <Pressable 
                  style={[styles.tossButton, (!message.trim() || loading) && styles.tossButtonDisabled]}
                  onPress={handleToss}
                  disabled={!message.trim() || loading}
                >
                  <Text style={styles.tossButtonText}>
                    🌊 Toss Your Bottle!
                  </Text>
                </Pressable>
              </View>
            </ScrollView>
          </SafeAreaView>
        );

      case 'tossing':
        return (
          <SafeAreaView style={styles.container}>
            <View style={styles.animationContainer}>
              <Text style={styles.animationTitle}>Tossing your bottle...</Text>
              <Text style={styles.animationSubtitle}>
                Sending your message into the digital ocean 🌊
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
            <View style={styles.successContainer}>
              <Text style={styles.successIcon}>🌊</Text>
              <Text style={styles.successTitle}>Congratulations!</Text>
              <Text style={styles.successText}>
                Your message is now drifting in the open digital sea, waiting to be discovered by fellow voyagers around the world!
              </Text>
              
              <View style={styles.successDetails}>
                <Text style={styles.successDetailTitle}>Bottle #{bottleId.slice(0, 8)}...</Text>
                <Text style={styles.successDetailText}>
                  Creator: {userName.trim() || 'Anonymous'}
                </Text>
                <Text style={styles.successDetailText}>
                  Status: Adrift and ready to be found
                </Text>
              </View>

              <View style={styles.reminderBox}>
                <Text style={styles.reminderTitle}>🍾 Don't Forget!</Text>
                <Text style={styles.reminderText}>
                  Remember to toss your actual physical bottle too! Your message is now in both the digital ocean and the real ocean, creating a bridge between worlds.
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
  backButton: {
    padding: Spacing.sm,
  },
  backButtonText: {
    fontSize: Typography.sizes.md,
    color: Colors.text.inverse,
    fontWeight: Typography.weights.semibold,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing['2xl'],
  },
  title: {
    fontSize: Typography.sizes['3xl'],
    fontWeight: Typography.weights.bold,
    color: Colors.text.ocean,
    textAlign: 'center',
    marginBottom: Spacing.sm,
    textShadowColor: 'rgba(255, 255, 255, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  subtitle: {
    fontSize: Typography.sizes.md,
    color: Colors.text.secondary,
    textAlign: 'center',
    fontWeight: Typography.weights.medium,
  },
  formSection: {
    marginBottom: Spacing['4xl'],
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
  messageInput: {
    backgroundColor: 'rgba(1, 67, 72, 0.8)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    fontSize: Typography.sizes.md,
    color: Colors.text.inverse,
    minHeight: 120,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
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
  bottleInfo: {
    backgroundColor: 'rgba(1, 67, 72, 0.6)',
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  bottleInfoTitle: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.bold,
    color: Colors.text.inverse,
    marginBottom: Spacing.sm,
  },
  bottleInfoText: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.inverse,
    opacity: 0.8,
    lineHeight: Typography.lineHeights.relaxed * Typography.sizes.sm,
    marginBottom: Spacing.xs,
  },
  tossButton: {
    backgroundColor: Colors.accent.mustardSea,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    ...Shadows.md,
  },
  tossButtonDisabled: {
    opacity: 0.5,
  },
  tossButtonText: {
    color: Colors.text.primary,
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
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
    marginBottom: Spacing.lg,
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
    marginBottom: Spacing.xs,
  },
  reminderBox: {
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  reminderTitle: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.bold,
    color: Colors.accent.mustardSea,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  reminderText: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.inverse,
    opacity: 0.9,
    textAlign: 'center',
    lineHeight: Typography.lineHeights.relaxed * Typography.sizes.sm,
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