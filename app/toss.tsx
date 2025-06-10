import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, Alert, Animated, ImageBackground, Image, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { useDeviceIdentity } from '../src/hooks/useDeviceIdentity';
import { supabase } from '../src/lib/supabase';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../src/constants/theme';
import { Ionicons } from '@expo/vector-icons';

type TossStep = 'compose' | 'tossing' | 'success';

export default function TossScreen() {
  const params = useLocalSearchParams();
  const { identity, isLoading: identityLoading, updateUserName, getUserInfo } = useDeviceIdentity();
  
  const [step, setStep] = useState<TossStep>('compose');
  const [message, setMessage] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [customUserName, setCustomUserName] = useState('');
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
  }, [params]);

  // Check if user wants to customize their name
  useEffect(() => {
    if (identity) {
      // Pre-fill the custom name field with current name
      setCustomUserName(identity.userName);
      console.log('✅ Device identity loaded:', identity);
    }
  }, [identity]);

  // Start bottle animation when tossing step begins
  useEffect(() => {
    if (step === 'tossing') {
      startBottleAnimation();
    }
  }, [step]);

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

    if (!identity) {
      Alert.alert('Error', 'Device identity not loaded. Please try again.');
      return;
    }

    setLoading(true);
    setStep('tossing');

    try {
      // Update user name if they changed it
      if (customUserName.trim() && customUserName !== identity.userName) {
        await updateUserName(customUserName.trim());
      }

      // Get current user info
      const userInfo = getUserInfo();

      // Get location
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Location permission is needed to toss your bottle');
        setLoading(false);
        setStep('compose');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      
      // Upload photo if exists
      let photoUrl = null;
      if (photo) {
        photoUrl = await uploadPhoto(photo);
      }

      // Determine if this is a retoss or new bottle
      const isReToss = bottleId && bottlePassword;

      let response;
      if (isReToss) {
        // Retoss existing bottle
        response = await fetch(`${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/claim_or_toss_bottle`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            id: bottleId,
            password: bottlePassword,
            message: message,
            photoUrl: photoUrl,
            lat: location.coords.latitude,
            lon: location.coords.longitude,
            tosserName: userInfo.userName,
          }),
        });
      } else {
        // Create new bottle
        response = await fetch(`${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/toss_bottle`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            message: message,
            photoUrl: photoUrl,
            lat: location.coords.latitude,
            lon: location.coords.longitude,
            creatorName: userInfo.userName,
          }),
        });
      }

      if (!response.ok) {
        throw new Error(`Failed to ${isReToss ? 'retoss' : 'create'} bottle: ${response.status}`);
      }

      const result = await response.json();
      console.log(`✅ Bottle ${isReToss ? 'retossed' : 'created'} successfully:`, result);

      // Animation will transition to success automatically after 5 seconds
    } catch (error) {
      console.error(`❌ Error ${bottleId ? 'retossing' : 'creating'} bottle:`, error);
      Alert.alert('Error', `Failed to ${bottleId ? 'retoss' : 'create'} bottle. Please try again.`);
      setStep('compose');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (step === 'success') {
      router.replace('/(tabs)/explore');
    } else {
      router.back();
    }
  };

  const renderContent = () => {
    // Show loading while device identity is being initialized
    if (identityLoading) {
      return (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Initializing...</Text>
        </View>
      );
    }

    if (step === 'compose') {
      return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
          <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
              <Pressable style={styles.closeButton} onPress={handleClose}>
                <Ionicons name="close" size={28} color={Colors.text.inverse} />
              </Pressable>
              <Text style={styles.headerTitle}>
                {bottleId ? '🔄 Retoss Bottle' : '🍾 Toss a Bottle'}
              </Text>
            </View>

            <View style={styles.content}>
              <Text style={styles.sectionTitle}>Your Identity</Text>
              <View style={styles.identityContainer}>
                <View style={styles.identityInfo}>
                  <Text style={styles.identityLabel}>Sailing as:</Text>
                  <Text style={styles.identityName}>{identity?.userName || 'Loading...'}</Text>
                  <Text style={styles.identitySubtext}>
                    {identity?.isAnonymous ? 'Anonymous Voyager' : 'Registered User'}
                  </Text>
                </View>
                <Pressable 
                  style={styles.changeNameButton}
                  onPress={() => setShowNameField(!showNameField)}
                >
                  <Text style={styles.changeNameText}>
                    {showNameField ? 'Cancel' : 'Change Name'}
                  </Text>
                </Pressable>
              </View>

              {showNameField && (
                <View style={styles.nameFieldContainer}>
                  <Text style={styles.fieldLabel}>Customize your name:</Text>
                  <TextInput
                    style={styles.nameInput}
                    placeholder="Enter your name..."
                    placeholderTextColor="rgba(255, 255, 255, 0.6)"
                    value={customUserName}
                    onChangeText={setCustomUserName}
                    maxLength={50}
                  />
                  <Text style={styles.fieldNote}>
                    This name will be shown to others who find your bottles
                  </Text>
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

              {bottleId && (
                <View style={styles.bottleInfo}>
                  <Text style={styles.bottleInfoTitle}>🔄 Retossing Bottle</Text>
                  <Text style={styles.bottleInfoText}>
                    You're continuing this bottle's journey across the digital seas
                  </Text>
                </View>
              )}

              <Pressable 
                style={[styles.tossButton, (!message.trim() || loading) && styles.disabledButton]}
                onPress={handleToss}
                disabled={!message.trim() || loading}
              >
                <Text style={styles.tossButtonText}>
                  {bottleId ? '🌊 Retoss into Ocean' : '🌊 Toss into Ocean'}
                </Text>
              </Pressable>
            </View>
          </SafeAreaView>
        </ScrollView>
      );
    }

    // ... rest of the render methods stay the same
    if (step === 'tossing') {
      const translateY = bottleAnimation.interpolate({
        inputRange: [0, 1],
        outputRange: [0, -800],
      });

      const rotate = bottleRotation.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
      });

      return (
        <View style={styles.animationContainer}>
          <View style={styles.animationContent}>
            <Text style={styles.animationTitle}>
              {bottleId ? 'Retossing your bottle...' : 'Tossing your bottle...'}
            </Text>
            <Text style={styles.animationSubtitle}>
              Sending your message across the digital seas
            </Text>
            
            <Animated.View
              style={[
                styles.bottleContainer,
                {
                  transform: [
                    { translateY },
                    { rotate },
                    { scale: bottleScale },
                  ],
                },
              ]}
            >
              <Text style={styles.bottleEmoji}>🍾</Text>
            </Animated.View>
            
            <Text style={styles.animationDescription}>
              {bottleId 
                ? 'Your bottle continues its journey...' 
                : 'Your bottle begins its journey...'
              }
            </Text>
          </View>
        </View>
      );
    }

    if (step === 'success') {
      return (
        <View style={styles.successContainer}>
          <View style={styles.successContent}>
            <Text style={styles.successEmoji}>✨</Text>
            <Text style={styles.successTitle}>
              {bottleId ? 'Bottle Retossed!' : 'Bottle Tossed!'}
            </Text>
            <Text style={styles.successMessage}>
              {bottleId 
                ? 'Your bottle continues its journey across the digital ocean. Someone else might discover it soon!'
                : 'Your message has been cast into the vast digital ocean. Someone, somewhere, might discover your bottle!'
              }
            </Text>
            
            <Pressable style={styles.exploreButton} onPress={handleClose}>
              <Text style={styles.exploreButtonText}>🗺️ Explore the Ocean</Text>
            </Pressable>
          </View>
        </View>
      );
    }
  };

  return (
    <ImageBackground 
      source={require('../images/homepage_BG_new.png')} 
      style={styles.backgroundContainer}
      resizeMode="cover"
    >
      <Stack.Screen options={{ headerShown: false }} />
      {renderContent()}
    </ImageBackground>
  );
}

// ... existing styles stay the same but add new ones for identity section
const styles = StyleSheet.create({
  backgroundContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: Typography.sizes.lg,
    color: Colors.text.inverse,
    fontWeight: Typography.weights.medium,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    justifyContent: 'space-between',
  },
  closeButton: {
    padding: Spacing.sm,
  },
  headerTitle: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    color: Colors.text.inverse,
    flex: 1,
    textAlign: 'center',
    marginRight: Spacing.xl + Spacing.sm, // Balance the close button
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.semibold,
    color: Colors.text.ocean,
    marginBottom: Spacing.md,
    marginTop: Spacing.lg,
  },
  identityContainer: {
    backgroundColor: 'rgba(1, 67, 72, 0.8)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    ...Shadows.md,
  },
  identityInfo: {
    flex: 1,
  },
  identityLabel: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
  },
  identityName: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    color: Colors.text.inverse,
    marginBottom: Spacing.xs,
  },
  identitySubtext: {
    fontSize: Typography.sizes.xs,
    color: Colors.accent.mustardSea,
    fontWeight: Typography.weights.medium,
  },
  changeNameButton: {
    backgroundColor: 'rgba(212, 175, 55, 0.2)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  changeNameText: {
    color: Colors.accent.mustardSea,
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
  },
  nameFieldContainer: {
    marginBottom: Spacing.lg,
  },
  fieldLabel: {
    fontSize: Typography.sizes.md,
    color: Colors.text.ocean,
    marginBottom: Spacing.sm,
    fontWeight: Typography.weights.medium,
  },
  nameInput: {
    backgroundColor: 'rgba(1, 67, 72, 0.8)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    fontSize: Typography.sizes.md,
    color: Colors.text.inverse,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    ...Shadows.md,
  },
  fieldNote: {
    fontSize: Typography.sizes.xs,
    color: Colors.text.secondary,
    marginTop: Spacing.sm,
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
    lineHeight: Typography.lineHeights.normal * Typography.sizes.sm,
  },
  tossButton: {
    backgroundColor: Colors.accent.seaweed,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    marginTop: Spacing.lg,
    ...Shadows.md,
  },
  tossButtonText: {
    color: Colors.text.inverse,
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
  },
  disabledButton: {
    opacity: 0.5,
  },
  animationContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  animationContent: {
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
    textAlign: 'center',
    opacity: 0.8,
    marginBottom: Spacing['3xl'],
  },
  bottleContainer: {
    marginVertical: Spacing['3xl'],
  },
  bottleEmoji: {
    fontSize: 80,
  },
  animationDescription: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.inverse,
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: Spacing['3xl'],
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  successContent: {
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
  },
  successEmoji: {
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
  successMessage: {
    fontSize: Typography.sizes.md,
    color: Colors.text.inverse,
    textAlign: 'center',
    lineHeight: Typography.lineHeights.relaxed * Typography.sizes.md,
    marginBottom: Spacing['3xl'],
    opacity: 0.9,
  },
  exploreButton: {
    backgroundColor: Colors.accent.mustardSea,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.lg,
    ...Shadows.md,
  },
  exploreButtonText: {
    color: Colors.text.primary,
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
  },
}); 