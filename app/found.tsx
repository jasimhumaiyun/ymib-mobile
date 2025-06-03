import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, Image, Alert, ScrollView } from 'react-native';
import { Stack, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { supabase } from '../src/lib/supabase';
import QRScanner from '../src/components/QRScanner';
import BottleJourney from '../src/components/BottleJourney';

type FoundStep = 'scan' | 'journey' | 'respond' | 'tossing' | 'success';

interface BottleData {
  id: string;
  password: string;
}

interface JourneyStep {
  toss_number: number;
  message: string;
  photo_url?: string;
  created_at: string;
}

interface BottleInfo {
  id: string;
  status: 'adrift' | 'found';
  journey: JourneyStep[];
}

export default function FoundModal() {
  const [step, setStep] = useState<FoundStep>('scan');
  const [bottleData, setBottleData] = useState<BottleData | null>(null);
  const [journey, setJourney] = useState<BottleInfo | null>(null);
  const [message, setMessage] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleQRScanned = async (data: BottleData) => {
    console.log('QR Scanned in found flow:', data);
    setBottleData(data);
    setLoading(true);
    
    try {
      await fetchBottleInfo(data);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch bottle information');
      setStep('scan');
    } finally {
      setLoading(false);
    }
  };

  const fetchBottleInfo = async (bottleData: BottleData) => {
    try {
      // First verify the bottle exists and password is correct
      const { data: bottle, error: bottleError } = await supabase
        .from('bottles')
        .select('id, status, message, photo_url, created_at')
        .eq('id', bottleData.id)
        .eq('password_hash', bottleData.password)
        .single();

      if (bottleError || !bottle) {
        Alert.alert('Error', 'Invalid bottle ID or password');
        setStep('scan');
        return;
      }

      // Fetch complete journey from bottle_events
      const { data: events, error: eventsError } = await supabase
        .from('bottle_events')
        .select('message, photo_url, created_at, event_type')
        .eq('bottle_id', bottleData.id)
        .eq('event_type', 'cast_away')
        .order('created_at', { ascending: true });

      console.log('📝 Fetched events:', events);
      console.log('🗃️ Original bottle data:', bottle);

      if (eventsError) {
        console.error('Events fetch error:', eventsError);
        Alert.alert('Error', 'Failed to fetch bottle journey');
        setStep('scan');
        return;
      }

      // Build journey ONLY from events (chronological order)
      const journey: JourneyStep[] = [];
      
      // Add all cast_away events in chronological order
      events?.forEach((event, index) => {
        console.log(`📸 Adding event ${index + 1}:`, { message: event.message, photo_url: event.photo_url });
        journey.push({
          toss_number: index + 1,
          message: event.message,
          photo_url: event.photo_url,
          created_at: event.created_at
        });
      });

      // If no events found, this means it's the original bottle that hasn't been re-tossed
      // In this case, use the bottle data as the first toss
      if (journey.length === 0) {
        console.log('📸 Using original bottle data:', { message: bottle.message, photo_url: bottle.photo_url });
        journey.push({
          toss_number: 1,
          message: bottle.message,
          photo_url: bottle.photo_url,
          created_at: bottle.created_at
        });
      }

      setJourney({
        id: bottle.id,
        status: bottle.status,
        journey
      });
      setStep('journey');
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch bottle information');
      setStep('scan');
    }
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

  const uploadPhoto = async (uri: string): Promise<string | null> => {
    try {
      console.log('📸 Uploading photo:', uri);
      
      // Read the file as array buffer for proper upload
      const response = await fetch(uri);
      const arrayBuffer = await response.arrayBuffer();
      
      console.log('📸 File size:', arrayBuffer.byteLength, 'bytes');
      
      const fileName = `bottle-${Date.now()}.jpg`;
      
      const { data, error } = await supabase.storage
        .from('bottles')
        .upload(fileName, arrayBuffer, {
          contentType: 'image/jpeg',
          upsert: false
        });

      if (error) {
        console.error('❌ Storage upload error:', error);
        throw error;
      }
      
      const { data: { publicUrl } } = supabase.storage
        .from('bottles')
        .getPublicUrl(fileName);
      
      console.log('✅ Photo uploaded successfully:', publicUrl);
      return publicUrl;
    } catch (error) {
      console.error('❌ Upload error:', error);
      return null;
    }
  };

  const handleMarkAsFound = async () => {
    if (!bottleData || !journey) return;
    
    setLoading(true);
    setStep('tossing');
    
    try {
      // Get location
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Location permission is needed');
        setLoading(false);
        setStep('journey');
        return;
      }

      const { coords } = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      // Call edge function to mark as found - DON'T send message to indicate it's just marking found
      const { data, error } = await supabase.functions.invoke('claim_or_toss_bottle', {
        body: {
          ...bottleData,
          // NO message parameter = just marking as found
          // message: journey.journey[journey.journey.length - 1].message, 
          photoUrl: journey.journey[journey.journey.length - 1].photo_url,
          lat: coords.latitude,
          lon: coords.longitude,
        },
      });

      if (error) {
        Alert.alert('Error', error.message || 'Failed to mark bottle as found');
        setStep('journey');
        return;
      }

      setStep('success');
    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
      setStep('journey');
    } finally {
      setLoading(false);
    }
  };

  const handleReToss = async () => {
    if (!bottleData) return;
    
    setLoading(true);
    setStep('tossing');
    
    try {
      // Get location
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Location permission is needed');
        setLoading(false);
        setStep('respond');
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

      // Call edge function with new message/photo
      const { data, error } = await supabase.functions.invoke('claim_or_toss_bottle', {
        body: {
          ...bottleData,
          message: message || 'Continuing the journey...',
          photoUrl,
          lat: coords.latitude,
          lon: coords.longitude,
        },
      });

      if (error) {
        Alert.alert('Error', error.message || 'Failed to re-toss bottle');
        setStep('respond');
        return;
      }

      setStep('success');
    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
      setStep('respond');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    router.back();
  };

  const renderContent = () => {
    switch (step) {
      case 'scan':
        return (
          <View style={styles.fullScreen}>
            <QRScanner
              title="Found a Bottle!"
              onScan={handleQRScanned}
              onCancel={handleClose}
            />
          </View>
        );

      case 'journey':
        if (!journey) return null;
        
        return (
          <SafeAreaView style={styles.container}>
            <ScrollView style={styles.contentContainer}>
              <Text style={styles.title}>🍾 You Found a Bottle!</Text>
              
              <BottleJourney journey={journey.journey} />

              <Text style={styles.sectionTitle}>What would you like to do?</Text>
              
              <View style={styles.foundButtons}>
                {journey.status === 'adrift' && (
                  <Pressable 
                    style={styles.foundButton} 
                    onPress={handleMarkAsFound}
                    disabled={loading}
                  >
                    <Text style={styles.foundButtonText}>
                      ✅ Mark as Found
                    </Text>
                  </Pressable>
                )}
                
                <Pressable 
                  style={[styles.foundButton, styles.foundButtonSecondary]} 
                  onPress={() => setStep('respond')}
                >
                  <Text style={styles.foundButtonText}>
                    💬 Add Your Response & Re-toss
                  </Text>
                </Pressable>
                
                <Pressable 
                  style={[styles.button, styles.primaryButton]} 
                  onPress={() => setStep('scan')}
                >
                  <Text style={[styles.buttonText, styles.secondaryButtonText]}>
                    Back
                  </Text>
                </Pressable>
              </View>
            </ScrollView>
          </SafeAreaView>
        );

      case 'respond':
        return (
          <SafeAreaView style={styles.container}>
            <ScrollView style={styles.contentContainer}>
              <Text style={styles.title}>Add Your Response</Text>
              <Text style={styles.subtitle}>
                Continue this bottle's journey with your own message!
              </Text>

              <TextInput
                style={styles.messageInput}
                placeholder="Write your response here..."
                value={message}
                onChangeText={setMessage}
                multiline
                maxLength={500}
                textAlignVertical="top"
              />

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
                    <Text style={styles.photoButtonText}>📸 Take Photo</Text>
                  </Pressable>
                  <Pressable style={styles.photoButton} onPress={pickImage}>
                    <Text style={styles.photoButtonText}>🖼️ Choose from Gallery</Text>
                  </Pressable>
                </View>
              )}

              <View style={styles.actionButtons}>
                <Pressable 
                  style={[styles.button, styles.secondaryButton]} 
                  onPress={() => setStep('journey')}
                >
                  <Text style={[styles.buttonText, styles.secondaryButtonText]}>
                    Back
                  </Text>
                </Pressable>
                
                <Pressable 
                  style={[styles.button, styles.primaryButton]} 
                  onPress={handleReToss}
                  disabled={loading}
                >
                  <Text style={styles.buttonText}>
                    🍾 Re-toss Bottle!
                  </Text>
                </Pressable>
              </View>
            </ScrollView>
          </SafeAreaView>
        );

      case 'tossing':
        return (
          <SafeAreaView style={styles.container}>
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingTitle}>Processing...</Text>
              <Text style={styles.loadingText}>
                Updating the bottle's journey 🌊
              </Text>
            </View>
          </SafeAreaView>
        );

      case 'success':
        return (
          <SafeAreaView style={styles.container}>
            <View style={styles.successContainer}>
              <Text style={styles.successIcon}>🎉</Text>
              <Text style={styles.successTitle}>Success!</Text>
              <Text style={styles.successText}>
                You've contributed to this bottle's amazing journey.
                Thanks for being part of the YMIB community!
              </Text>
              <Pressable style={styles.button} onPress={handleClose}>
                <Text style={styles.buttonText}>Continue Exploring</Text>
              </Pressable>
            </View>
          </SafeAreaView>
        );

      default:
        return null;
    }
  };

  return (
    <View style={styles.fullScreen}>
      {loading && step === 'scan' && (
        <View style={styles.scanLoadingOverlay}>
          <Text style={styles.scanLoadingText}>Loading bottle...</Text>
        </View>
      )}
      {renderContent()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  contentContainer: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  messageInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    height: 120,
    marginBottom: 30,
    backgroundColor: '#f9f9f9',
  },
  photoContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  photo: {
    width: 200,
    height: 200,
    borderRadius: 12,
    marginBottom: 12,
  },
  changePhotoButton: {
    padding: 8,
  },
  changePhotoText: {
    color: '#4CAF50',
    fontSize: 16,
  },
  photoButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 30,
  },
  photoButton: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  photoButtonText: {
    fontSize: 16,
    color: '#333',
  },
  actionButtons: {
    gap: 12,
    marginTop: 20,
  },
  button: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#2196F3',
  },
  foundButton: {
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  foundButtonSecondary: {
    backgroundColor: '#2196F3',
  },
  foundButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#f0f0f0',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  secondaryButtonText: {
    color: '#333',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
    textAlign: 'center',
    marginBottom: 8,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  successIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4CAF50',
    textAlign: 'center',
    marginBottom: 16,
  },
  successText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
  },
  scanLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  scanLoadingText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  fullScreen: {
    flex: 1,
    backgroundColor: '#fff',
  },
  foundButtons: {
    gap: 12,
    marginTop: 20,
  },
}); 