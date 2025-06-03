import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, Image, Alert, ScrollView } from 'react-native';
import { Stack, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { supabase } from '../src/lib/supabase';
import QRScanner from '../src/components/QRScanner';

type TossStep = 'scan' | 'content' | 'tossing' | 'success';

interface BottleData {
  id: string;
  password: string;
}

export default function TossModal() {
  const [step, setStep] = useState<TossStep>('scan');
  const [bottleData, setBottleData] = useState<BottleData | null>(null);
  const [message, setMessage] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleQRScanned = (data: BottleData) => {
    console.log('QR Scanned:', data, 'Setting step to content');
    setBottleData(data);
    setStep('content');
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
      
      // Create FormData for file upload
      const formData = new FormData();
      const fileName = `bottle-${Date.now()}.jpg`;
      
      // For React Native, we need to create a file object differently
      formData.append('file', {
        uri: uri,
        type: 'image/jpeg',
        name: fileName,
      } as any);
      
      // Use the direct storage API upload method with file object
      const fileExt = fileName.split('.').pop();
      const filePath = `${fileName}`;
      
      // Read the file as array buffer for proper upload
      const response = await fetch(uri);
      const arrayBuffer = await response.arrayBuffer();
      
      console.log('📸 File size:', arrayBuffer.byteLength, 'bytes');
      
      const { data, error } = await supabase.storage
        .from('bottles')
        .upload(filePath, arrayBuffer, {
          contentType: 'image/jpeg',
          upsert: false
        });

      if (error) {
        console.error('❌ Storage upload error:', error);
        throw error;
      }
      
      const { data: { publicUrl } } = supabase.storage
        .from('bottles')
        .getPublicUrl(filePath);
      
      console.log('✅ Photo uploaded successfully:', publicUrl);
      console.log('📸 Upload data:', data);
      return publicUrl;
    } catch (error) {
      console.error('❌ Upload error:', error);
      return null;
    }
  };

  const handleToss = async () => {
    if (!bottleData) return;
    
    setLoading(true);
    setStep('tossing');
    
    try {
      // Get location
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Location permission is needed to toss bottles');
        setLoading(false);
        setStep('content');
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

      // Call edge function
      const { data, error } = await supabase.functions.invoke('claim_or_toss_bottle', {
        body: {
          ...bottleData,
          message: message || 'Hello from YMIB!',
          photoUrl,
          lat: coords.latitude,
          lon: coords.longitude,
        },
      });

      if (error) {
        Alert.alert('Error', error.message || 'Failed to toss bottle');
        setStep('content');
        return;
      }

      setStep('success');
    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
      setStep('content');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    router.back();
  };

  const renderContent = () => {
    console.log('renderContent called with step:', step);
    switch (step) {
      case 'scan':
        return (
          <View style={styles.fullScreen}>
            <QRScanner
              title="Toss Your Bottle"
              onScan={handleQRScanned}
              onCancel={handleClose}
            />
          </View>
        );

      case 'content':
        return (
          <SafeAreaView style={styles.container}>
            <ScrollView style={styles.contentContainer}>
              <Text style={styles.title}>Add Your Message</Text>
              <Text style={styles.subtitle}>
                What would you like to share with the world?
              </Text>

              <TextInput
                style={styles.messageInput}
                placeholder="Write your message here..."
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
                  onPress={() => setStep('scan')}
                >
                  <Text style={[styles.buttonText, styles.secondaryButtonText]}>
                    Back
                  </Text>
                </Pressable>
                
                <Pressable 
                  style={[styles.button, styles.primaryButton]} 
                  onPress={handleToss}
                  disabled={loading}
                >
                  <Text style={styles.buttonText}>
                    🍾 Toss Bottle!
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
              <Text style={styles.loadingTitle}>Tossing your bottle...</Text>
              <Text style={styles.loadingText}>
                Adding your message to the world 🌊
              </Text>
            </View>
          </SafeAreaView>
        );

      case 'success':
        return (
          <SafeAreaView style={styles.container}>
            <View style={styles.successContainer}>
              <Text style={styles.successIcon}>🎉</Text>
              <Text style={styles.successTitle}>Bottle Tossed!</Text>
              <Text style={styles.successText}>
                Your message is now floating in the digital ocean.
                Others can discover it on the map!
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
    color: '#2196F3',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
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
    color: '#2196F3',
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
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  button: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#2196F3',
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
    color: '#2196F3',
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
  fullScreen: {
    flex: 1,
    backgroundColor: '#fff',
  },
}); 