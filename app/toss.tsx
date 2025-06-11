import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, Alert, Animated, ImageBackground, Image, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { useUserProfiles } from '../src/hooks/useUserProfiles';
import { supabase } from '../src/lib/supabase';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../src/constants/theme';
import { Ionicons } from '@expo/vector-icons';

type TossStep = 'compose' | 'tossing' | 'success';

export default function TossScreen() {
  const params = useLocalSearchParams();
  const { currentUser, username, loading: identityLoading } = useUserProfiles();
  
  const [step, setStep] = useState<TossStep>('compose');
  const [message, setMessage] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [bottleId, setBottleId] = useState<string>('');
  const [bottlePassword, setBottlePassword] = useState<string>('');
  const [createdBottleId, setCreatedBottleId] = useState<string>('');
  const [createdBottlePassword, setCreatedBottlePassword] = useState<string>('');

  // Animation refs
  const bottleAnimation = useRef(new Animated.Value(0)).current;
  const bottleRotation = useRef(new Animated.Value(0)).current;
  const bottleScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Get bottle data from params
    const bottleIdParam = params.bottleId as string;
    const bottlePasswordParam = params.bottlePassword as string;
    const modeParam = params.mode as string;
    
    if (bottleIdParam && bottlePasswordParam && 
        bottleIdParam !== 'undefined' && bottlePasswordParam !== 'undefined' &&
        bottleIdParam.trim() !== '' && bottlePasswordParam.trim() !== '') {
      
      if (modeParam === 'create') {
        // Coming from scanner for new bottle creation - use the scanned bottle ID
        setBottleId(bottleIdParam);
        setBottlePassword(''); // Don't treat as retoss
      } else if (modeParam === 'retoss') {
        // Actual retoss mode (coming from found screen)
        setBottleId(bottleIdParam);
        setBottlePassword(bottlePasswordParam);
      } else {
        // Legacy/fallback - if both ID and password provided without mode, assume retoss
        setBottleId(bottleIdParam);
        setBottlePassword(bottlePasswordParam);
      }
    } else {
      // New bottle mode
      setBottleId('');
      setBottlePassword('');
    }
  }, [params]);

  // User profile is managed centrally by useUserProfiles

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
      mediaTypes: ['images'],
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
      console.log('📸 Starting photo upload:', photoUri);
      
      const response = await fetch(photoUri);
      if (!response.ok) {
        throw new Error(`Failed to fetch photo: ${response.status}`);
      }
      
      const blob = await response.blob();
      console.log('📸 Photo blob size:', blob.size);
      
      const fileExt = photoUri.split('.').pop() || 'jpg';
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `bottle-photos/${fileName}`;

      console.log('📸 Uploading to:', filePath);

      const { data, error } = await supabase.storage
        .from('bottles')
        .upload(filePath, blob, {
          contentType: blob.type || 'image/jpeg',
          upsert: false
        });

      if (error) {
        console.error('❌ Upload error:', error);
        Alert.alert('Photo Upload Failed', `Could not upload photo: ${error.message}`);
        return null;
      }

      console.log('✅ Upload successful:', data);

      const { data: { publicUrl } } = supabase.storage
        .from('bottles')
        .getPublicUrl(filePath);

      console.log('📸 Public URL:', publicUrl);
      return publicUrl;
    } catch (error) {
      console.error('❌ Photo upload failed:', error);
      Alert.alert('Photo Upload Error', 'Failed to upload photo. Please try again.');
      return null;
    }
  };

  const handleToss = async () => {
    if (!message.trim()) {
      Alert.alert('Message Required', 'Please enter a message for your bottle');
      return;
    }

    if (!currentUser) {
      Alert.alert('Error', 'User not loaded. Please try again.');
      return;
    }

    setLoading(true);
    setStep('tossing');

    // Determine if this is a retoss or new bottle
    const isReToss = bottleId && bottlePassword;

    try {
      // Get current user info - use the username from useUserProfiles
      const finalUserName = username || currentUser.username;

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

      // Generate proper UUID v4 for new bottles
      const generateUUID = () => {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          const r = Math.random() * 16 | 0;
          const v = c == 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });
      };

      // Get auth headers
      const authHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`,
      };

      let response;
      if (isReToss) {
        // Retoss existing bottle
        response = await fetch(`${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/claim_or_toss_bottle`, {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify({
            id: bottleId,
            password: bottlePassword,
            message: message,
            photoUrl: photoUrl,
            lat: location.coords.latitude,
            lon: location.coords.longitude,
            tosserName: finalUserName,
          }),
        });
      } else {
        // Create new bottle - use bottle ID from QR code if available, otherwise generate UUID
        const bottleIdToUse = bottleId || generateUUID();
        console.log('🆕 Creating new bottle with ID:', bottleIdToUse);
        
        response = await fetch(`${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/claim_or_toss_bottle`, {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify({
            id: bottleIdToUse,
            password: 'simple123',
            message: message,
            photoUrl: photoUrl,
            lat: location.coords.latitude,
            lon: location.coords.longitude,
            tosserName: finalUserName,
          }),
        });
      }

      if (!response.ok) {
        throw new Error(`Failed to ${isReToss ? 'retoss' : 'create'} bottle: ${response.status}`);
      }

      const result = await response.json();
      // Bottle operation completed successfully

      // Animation will transition to success automatically after 5 seconds
      setCreatedBottleId(result.id);
      setCreatedBottlePassword(result.password);
    } catch (error) {
      const errorAction = isReToss ? 'retossing' : 'creating';
      console.error(`❌ Error ${errorAction} bottle:`, error);
      Alert.alert('Error', `Failed to ${errorAction} bottle. Please try again.`);
      setStep('compose');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    router.back();
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
        <SafeAreaView style={styles.safeArea}>
          <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            <View style={styles.headerContainer}>
              <View style={styles.header}>
                <Pressable style={styles.closeButton} onPress={handleClose}>
                  <Ionicons name="close" size={28} color={Colors.text.inverse} />
                </Pressable>
                <View style={styles.headerTitleContainer}>
                  <Text style={styles.headerTitle}>
                    {bottleId && bottlePassword ? 'Retossing Bottle' : 'Tossing New Bottle'}
                  </Text>
                </View>
              </View>
              <Text style={styles.headerSubtitle}>
                Toss your physical bottle along with the digital version. Finders will see your message in both the physical bottle and this digital message.
              </Text>
            </View>

            <View style={styles.content}>
              <Text style={styles.sectionTitle}>Your Message</Text>
              <TextInput
                style={styles.messageInput}
                placeholder="What message would you like to send into the world?"
                placeholderTextColor={Colors.text.secondary}
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

              <Pressable 
                style={[styles.primaryButton, (!message.trim() || loading) && styles.primaryButtonDisabled]}
                onPress={handleToss}
                disabled={!message.trim() || loading}
              >
                <Text style={styles.primaryButtonText}>
                  Toss into Ocean
                </Text>
              </Pressable>
            </View>
          </ScrollView>
        </SafeAreaView>
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
              Tossing your bottle...
            </Text>
            <Text style={styles.animationSubtitle}>
              Sending your message across the digital seas{'\n'}(don't forget to toss your physical bottle along)
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
            

          </View>
        </View>
      );
    }

    if (step === 'success') {
      const isReToss = bottleId && bottlePassword;
      
      return (
        <SafeAreaView style={styles.container}>
          <View style={styles.topBar}>
            <Pressable style={styles.closeButton} onPress={handleClose}>
              <Ionicons name="close" size={24} color={Colors.text.inverse} />
            </Pressable>
          </View>
          <View style={styles.successContainer}>
            <View style={styles.successContent}>
              <Text style={styles.successEmoji}>✨</Text>
              <Text style={styles.successTitle}>
                {isReToss ? 'Bottle Retossed!' : 'Bottle Tossed!'}
              </Text>
              <Text style={styles.successMessage}>
                {isReToss 
                  ? 'Your bottle continues its journey with a new message!'
                  : 'Your message has been cast into the vast digital ocean. Someone, somewhere, might discover your bottle!'
                }
              </Text>
              
              <Pressable style={styles.exploreButton} onPress={handleClose}>
                <Text style={styles.exploreButtonText}>🗺️ Explore the Ocean</Text>
              </Pressable>
            </View>
          </View>
        </SafeAreaView>
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
  headerContainer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    marginLeft: Spacing.md,
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
  topBar: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: Typography.sizes['2xl'],
    fontWeight: Typography.weights.bold,
    color: Colors.accent.mustardSea,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: Typography.sizes.md,
    color: Colors.text.primary,
    textAlign: 'center',
    marginTop: Spacing.sm,
    lineHeight: Typography.lineHeights.normal * Typography.sizes.md,
    opacity: 1,
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
    marginBottom: Spacing.sm,
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
  primaryButton: {
    backgroundColor: Colors.primary[600],
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    alignItems: 'center',
    marginTop: Spacing.lg,
    ...Shadows.md,
  },
  primaryButtonDisabled: {
    backgroundColor: Colors.text.secondary,
    opacity: 0.6,
  },
  primaryButtonText: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.semibold,
    color: Colors.background.primary,
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
  bottleInfoContainer: {
    backgroundColor: 'rgba(1, 67, 72, 0.8)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginVertical: Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    width: '100%',
  },
  bottleInfoSubtitle: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.inverse,
    textAlign: 'center',
    marginBottom: Spacing.md,
    opacity: 0.8,
  },
  bottleDataContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  bottleDataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  bottleDataLabel: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
    fontWeight: Typography.weights.medium,
  },
  bottleDataValue: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.inverse,
    fontWeight: Typography.weights.bold,
    flex: 1,
    textAlign: 'right',
    marginLeft: Spacing.sm,
  },
  qrCodeNote: {
    fontSize: Typography.sizes.xs,
    color: Colors.accent.mustardSea,
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: Typography.lineHeights.normal * Typography.sizes.xs,
  },
}); 