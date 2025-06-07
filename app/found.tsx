import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, Image, Alert, ScrollView, Modal } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../src/lib/supabase';
import BottleJourney from '../src/components/BottleJourney';

type FoundStep = 'loading' | 'viewing' | 'askReply' | 'replying' | 'askRetoss' | 'adding' | 'retossing' | 'success';

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
  message: string;
  photo_url?: string;
  created_at: string;
}

export default function FoundModal() {
  const params = useLocalSearchParams();
  const [step, setStep] = useState<FoundStep>('loading');
  const [bottleData, setBottleData] = useState<BottleData | null>(null);
  const [bottleInfo, setBottleInfo] = useState<BottleInfo | null>(null);
  const [journey, setJourney] = useState<JourneyStep[]>([]);
  const [replyMessage, setReplyMessage] = useState('');
  const [replyPhoto, setReplyPhoto] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [newPhoto, setNewPhoto] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showJourneyModal, setShowJourneyModal] = useState(false);
  const [currentUserName, setCurrentUserName] = useState('Anonymous'); // For "Discovered by:" text
  const [bottleSenderName, setBottleSenderName] = useState('Anonymous'); // For message sender
  const [parentReplyId, setParentReplyId] = useState<string | undefined>(undefined); // For nested replies

  // Load current user name for "Discovered by:" text
  useEffect(() => {
    loadCurrentUserName();
  }, []);

  const loadCurrentUserName = async () => {
    try {
      const savedName = await AsyncStorage.getItem('userName');
      if (savedName && savedName.trim()) {
        setCurrentUserName(savedName.trim());
      }
    } catch (error) {
      console.log('Error loading current user name:', error);
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
        router.back();
        return;
      }

      // Fetch complete journey from bottle_events - GET ALL EVENTS to check if found
      const { data: allEvents, error: allEventsError } = await supabase
        .from('bottle_events')
        .select('message, photo_url, created_at, event_type')
        .eq('bottle_id', bottleData.id)
        .order('created_at', { ascending: true });

      console.log('📝 Fetched all events:', allEvents);

      if (allEventsError) {
        console.error('Events fetch error:', allEventsError);
        Alert.alert('Error', 'Failed to fetch bottle journey');
        router.back();
        return;
      }

      // Check if bottle is already found by looking for found events
      // BUT ONLY if the bottle status is still "found" - if it's "adrift" after retoss, it's findable again!
      const hasFoundEvent = allEvents?.some(event => event.event_type === 'found') || false;
      
      // The key logic: Only go to retoss if bottle status is "found" AND there are found events
      // If bottle status is "adrift", it means it was retossed and is now findable again
      const shouldGoToRetoss = bottle.status === 'found' && hasFoundEvent;
      
      // Filter only cast_away events for journey display
      const events = allEvents?.filter(event => event.event_type === 'cast_away') || [];

      console.log('🗃️ Original bottle data:', bottle);
      console.log('🔍 Has found event:', hasFoundEvent);
      console.log('🔍 Bottle status:', bottle.status);
      console.log('🔍 Should go to retoss:', shouldGoToRetoss);

      // Build journey ONLY from cast_away events (chronological order)
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

      setBottleInfo({
        id: bottle.id,
        status: bottle.status,
        journey,
        message: bottle.message,
        photo_url: bottle.photo_url,
        created_at: bottle.created_at
      });

      setJourney(journey);
      
      if (shouldGoToRetoss) {
        // Bottle currently found and has found events - skip to ask retoss
        console.log('🔍 Bottle currently found, going to ask retoss step');
        setStep('askRetoss');
      } else {
        // Fresh bottle OR retossed bottle (now adrift again) - show viewing step with mark as found button
        console.log('✅ Bottle is findable, showing viewing step');
        setStep('viewing');
      }
      
    } catch (error) {
      console.error('❌ Error fetching bottle info:', error);
      Alert.alert('Error', 'Failed to fetch bottle information');
      router.back();
    }
  };

  // Get bottle data from URL parameters and fetch bottle info
  useEffect(() => {
    if (params.bottleId && params.bottlePassword) {
      const data = {
        id: params.bottleId as string,
        password: params.bottlePassword as string,
      };
      console.log('🔍 Found flow initialized with bottle data:', data);
      setBottleData(data);
      fetchBottleInfo(data);
    } else {
      // If no params, redirect back to scan
      console.log('❌ No bottle data provided, redirecting to scan');
      router.replace('/scan');
    }
  }, [params.bottleId, params.bottlePassword]);

  useEffect(() => {
    if (bottleData) {
      // Check for parent_reply_id in params for nested replies
      const parentId = params.parent_reply_id as string | undefined;
      setParentReplyId(parentId);
      
      fetchBottleInfo(bottleData);
    }
  }, [bottleData]);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setNewPhoto(result.assets[0].uri);
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
      setNewPhoto(result.assets[0].uri);
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
    if (!bottleData || !bottleInfo) return;
    
    setLoading(true);
    
    try {
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

      // Create a FOUND event by adding an event to bottle_events table
      const { error } = await supabase
        .from('bottle_events')
        .insert([
          {
            bottle_id: bottleData.id,
            event_type: 'found',
            lat: coords.latitude,
            lon: coords.longitude,
            message: 'Bottle found', // System message - will be filtered out in journey display
            created_at: new Date().toISOString()
          }
        ]);

      if (error) {
        console.error('❌ Error marking bottle as found:', error);
        Alert.alert('Error', 'Failed to mark bottle as found');
        return;
      }

      console.log('✅ Bottle marked as found - FOUND event created');
      
      // Move directly to replying step (skip askReply)
      setStep('replying');
      
    } catch (error) {
      console.error('❌ Error in handleMarkAsFound:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReply = async () => {
    if (!bottleData || !replyMessage.trim()) return;
    
    setLoading(true);
    
    try {
      // Get location for the reply
      const { coords } = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      // Upload photo if provided
      let photoUrl = null;
      if (replyPhoto) {
        photoUrl = await uploadPhoto(replyPhoto);
        if (!photoUrl) {
          Alert.alert('Error', 'Failed to upload photo');
          setLoading(false);
          return;
        }
      }

      // Create a FOUND event with special reply message format
      const replyEventMessage = `REPLY: ${replyMessage}`;
      
      const { error } = await supabase
        .from('bottle_events')
        .insert([
          {
            bottle_id: bottleData.id,
            event_type: 'found',
            lat: coords.latitude,
            lon: coords.longitude,
            message: replyEventMessage,
            photo_url: photoUrl,
            parent_reply_id: parentReplyId, // Include parent_reply_id for nested replies
            created_at: new Date().toISOString()
          }
        ]);

      if (error) {
        console.error('❌ Error submitting reply:', error);
        Alert.alert('Error', 'Failed to submit reply');
        return;
      }

      console.log('✅ Reply submitted successfully');
      
      // Move to ask retoss step
      setStep('askRetoss');
      
    } catch (error) {
      console.error('❌ Error in handleSubmitReply:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReToss = async () => {
    if (!bottleData) return;
    
    setLoading(true);
    setStep('retossing');
    
    try {
      // Get location
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Location permission is needed');
        setLoading(false);
        setStep('adding');
        return;
      }

      const { coords } = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      // Upload photo if provided
      let photoUrl = null;
      if (newPhoto) {
        photoUrl = await uploadPhoto(newPhoto);
      }

      // Call edge function with new message/photo
      const { data, error } = await supabase.functions.invoke('claim_or_toss_bottle', {
        body: {
          ...bottleData,
          message: newMessage || 'Continuing the journey...',
          photoUrl,
          lat: coords.latitude,
          lon: coords.longitude,
        },
      });

      if (error) {
        Alert.alert('Error', error.message || 'Failed to re-toss bottle');
        setStep('adding');
        return;
      }

      setStep('success');
    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
      setStep('adding');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    router.dismissAll();
  };

  const renderContent = () => {
    switch (step) {
      case 'loading':
        return (
          <SafeAreaView style={styles.container}>
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingTitle}>🔍 Finding bottle...</Text>
              <Text style={styles.loadingText}>
                Loading bottle information and journey history
              </Text>
            </View>
          </SafeAreaView>
        );

      case 'viewing':
        return (
          <SafeAreaView style={styles.container}>
            {/* Universal Back to Home Button */}
            <View style={styles.topBar}>
              <Pressable style={styles.backButton} onPress={handleClose}>
                <Text style={styles.backButtonText}>← Home</Text>
              </Pressable>
            </View>

            <ScrollView style={styles.contentContainer}>
              <Text style={styles.title}>Bottle Found!</Text>
              <Text style={styles.subtitle}>
                Discovered by: {currentUserName} • Continue its journey!
              </Text>

              {bottleInfo && (
                <View style={styles.bottleCard}>
                  <Text style={styles.cardTitle}>{bottleSenderName}'s Message</Text>
                  <View style={styles.cardContent}>
                    <View style={styles.messageSection}>
                      <Text style={styles.cardMessage}>"{bottleInfo.message}"</Text>
                    </View>
                    {bottleInfo.photo_url && (
                      <View style={styles.imageSection}>
                        <Image source={{ uri: bottleInfo.photo_url }} style={styles.cardImage} />
                      </View>
                    )}
                  </View>
                  <Text style={styles.cardDate}>
                    Created: {new Date(bottleInfo.created_at).toLocaleDateString()}
                  </Text>
                </View>
              )}

              {journey.length > 0 && (
                <View style={styles.journeySection}>
                  <Pressable 
                    style={styles.journeyButton}
                    onPress={() => setShowJourneyModal(true)}
                  >
                    <Text style={styles.journeyButtonText}>🍾 View Bottle Journey</Text>
                    <Text style={styles.journeyButtonSubtext}>
                      See all {journey.length} message{journey.length !== 1 ? 's' : ''} in this bottle's story
                    </Text>
                  </Pressable>
                </View>
              )}

              <View style={styles.centeredButtonContainer}>
                <Pressable 
                  style={[styles.button, styles.foundButton, styles.compactButton]} 
                  onPress={handleMarkAsFound}
                  disabled={loading}
                >
                  <Text style={styles.foundButtonText}>
                    Mark as Found & Reply
                  </Text>
                </Pressable>
              </View>
            </ScrollView>
          </SafeAreaView>
        );

      case 'askReply':
        // This step is now skipped - we go directly from 'viewing' to 'replying'
        return null;

      case 'replying':
        return (
          <SafeAreaView style={styles.container}>
            {/* Universal Back to Home Button */}
            <View style={styles.topBar}>
              <Pressable style={styles.backButton} onPress={handleClose}>
                <Text style={styles.backButtonText}>← Home</Text>
              </Pressable>
            </View>

            <ScrollView style={styles.contentContainer}>
              <Text style={styles.title}>Reply to Sender</Text>
              <Text style={styles.subtitle}>
                What would you like to say about this message?
              </Text>

              {/* Unified Conversation Container */}
              {bottleInfo && (
                <View style={styles.conversationContainer}>
                  {/* Original Message */}
                  <View style={styles.originalMessage}>
                    <Text style={styles.senderLabel}>Anonymous said</Text>
                    <View style={styles.messageContent}>
                      <View style={styles.messageSection}>
                        <Text style={styles.cardMessage}>"{bottleInfo.message}"</Text>
                      </View>
                      {bottleInfo.photo_url && (
                        <View style={styles.imageSection}>
                          <Image source={{ uri: bottleInfo.photo_url }} style={styles.cardImage} />
                        </View>
                      )}
                    </View>
                    <Text style={styles.cardDate}>
                      {new Date(bottleInfo.created_at).toLocaleDateString()}
                    </Text>

                    {/* Nested Reply Section */}
                    <View style={styles.nestedReply}>
                      <Text style={styles.replySenderLabel}>You said</Text>
                      <TextInput
                        style={styles.nestedReplyInput}
                        placeholder="Enter your reply..."
                        placeholderTextColor="rgba(255, 255, 255, 0.6)"
                        value={replyMessage}
                        onChangeText={setReplyMessage}
                        multiline
                        maxLength={300}
                        textAlignVertical="top"
                      />
                      
                      {/* Reply Photo Section */}
                      {replyPhoto ? (
                        <View style={styles.replyPhotoContainer}>
                          <Image source={{ uri: replyPhoto }} style={styles.replyPhoto} />
                          <Pressable 
                            style={styles.removeReplyPhotoButton} 
                            onPress={() => setReplyPhoto(null)}
                          >
                            <Text style={styles.removeReplyPhotoText}>Remove Photo</Text>
                          </Pressable>
                        </View>
                      ) : (
                        <View style={styles.replyPhotoButtons}>
                          <Pressable style={styles.replyPhotoButton} onPress={async () => {
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
                          }}>
                            <Text style={styles.replyPhotoButtonText}>📸 Take Photo</Text>
                          </Pressable>
                          <Pressable style={styles.replyPhotoButton} onPress={async () => {
                            const result = await ImagePicker.launchImageLibraryAsync({
                              mediaTypes: ImagePicker.MediaTypeOptions.Images,
                              allowsEditing: true,
                              aspect: [1, 1],
                              quality: 0.8,
                            });
                            if (!result.canceled) {
                              setReplyPhoto(result.assets[0].uri);
                            }
                          }}>
                            <Text style={styles.replyPhotoButtonText}>🖼️ Gallery</Text>
                          </Pressable>
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              )}

              {/* Action Buttons - Properly Positioned */}
              <View style={styles.replyActionButtons}>
                <Pressable 
                  style={[styles.button, styles.secondaryButton, styles.replyButton]} 
                  onPress={() => setStep('askRetoss')}
                >
                  <Text style={[styles.buttonText, styles.secondaryButtonText]}>
                    Skip Reply
                  </Text>
                </Pressable>
                
                <Pressable 
                  style={[styles.button, styles.primaryButton, styles.replyButton]} 
                  onPress={handleSubmitReply}
                  disabled={loading || !replyMessage.trim()}
                >
                  <Text style={styles.buttonText}>
                    Submit Reply & Continue
                  </Text>
                </Pressable>
              </View>
            </ScrollView>
          </SafeAreaView>
        );

      case 'askRetoss':
        return (
          <SafeAreaView style={styles.container}>
            {/* Universal Back to Home Button */}
            <View style={styles.topBar}>
              <Pressable style={styles.backButton} onPress={handleClose}>
                <Text style={styles.backButtonText}>← Home</Text>
              </Pressable>
            </View>

            <View style={styles.promptContainer}>
              <Text style={styles.promptTitle}>🔄 Retoss Bottle?</Text>
              <Text style={styles.promptText}>
                Would you like to retoss this bottle now or save it for later?
              </Text>

              <View style={styles.promptButtons}>
                <Pressable 
                  style={[styles.button, styles.secondaryButton]} 
                  onPress={() => {
                    // Save for later - just close the modal
                    // User can retoss from profile later
                    Alert.alert(
                      'Saved!', 
                      'This bottle has been saved to your profile. You can retoss it anytime from the Found tab.',
                      [{ text: 'OK', onPress: () => router.dismissAll() }]
                    );
                  }}
                >
                  <Text style={[styles.buttonText, styles.secondaryButtonText]}>
                    Save for Later
                  </Text>
                </Pressable>
                
                <Pressable 
                  style={[styles.button, styles.primaryButton]} 
                  onPress={() => setStep('adding')}
                >
                  <Text style={styles.buttonText}>
                    Retoss Now
                  </Text>
                </Pressable>
              </View>
            </View>
          </SafeAreaView>
        );

      case 'adding':
        return (
          <SafeAreaView style={styles.container}>
            {/* Universal Back to Home Button */}
            <View style={styles.topBar}>
              <Pressable style={styles.backButton} onPress={handleClose}>
                <Text style={styles.backButtonText}>← Home</Text>
              </Pressable>
            </View>

            <ScrollView style={styles.contentContainer}>
              <Text style={styles.title}>Add Your Message</Text>
              <Text style={styles.subtitle}>
                Continue this bottle's journey with your story!
              </Text>

              <TextInput
                style={styles.messageInput}
                placeholder="Add your message to this bottle's journey..."
                placeholderTextColor="rgba(255, 255, 255, 0.6)"
                value={newMessage}
                onChangeText={setNewMessage}
                multiline
                maxLength={500}
                textAlignVertical="top"
              />

              <Text style={styles.sectionTitle}>Add a Photo (Optional)</Text>
              
              {newPhoto ? (
                <View style={styles.photoContainer}>
                  <Image source={{ uri: newPhoto }} style={styles.photo} />
                  <Pressable 
                    style={styles.changePhotoButton} 
                    onPress={() => setNewPhoto(null)}
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

              <View style={styles.centeredButtonContainer}>
                <Pressable 
                  style={[styles.button, styles.primaryButton, styles.compactButton]} 
                  onPress={handleReToss}
                  disabled={loading || !newMessage.trim()}
                >
                  <Text style={styles.buttonText}>
                    Retoss Bottle!
                  </Text>
                </Pressable>
              </View>
            </ScrollView>
          </SafeAreaView>
        );

      case 'retossing':
        return (
          <SafeAreaView style={styles.container}>
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingTitle}>Retossing bottle...</Text>
              <Text style={styles.loadingText}>
                Adding your message and sending it back into the world 🌊
              </Text>
            </View>
          </SafeAreaView>
        );

      case 'success':
        return (
          <SafeAreaView style={styles.container}>
            <View style={styles.successContainer}>
              <Text style={styles.successIcon}>🌊</Text>
              <Text style={styles.successTitle}>Bottle Retossed!</Text>
              <Text style={styles.successText}>
                Your message has been added to this bottle's journey.
                Others can now discover your contribution to the story!
              </Text>
              <Pressable style={[styles.button, styles.primaryButton, { width: 180, alignSelf: 'center' }]} onPress={handleClose}>
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
      <Stack.Screen options={{ 
        presentation: 'modal',
        headerShown: false 
      }} />
      {loading && step === 'loading' && (
        <View style={styles.scanLoadingOverlay}>
          <Text style={styles.scanLoadingText}>Loading bottle...</Text>
        </View>
      )}
      {renderContent()}
      
      {/* Journey Modal */}
      <Modal
        visible={showJourneyModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowJourneyModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Pressable style={styles.backButton} onPress={() => setShowJourneyModal(false)}>
              <Text style={styles.backButtonText}>← Home</Text>
            </Pressable>
          </View>
          <ScrollView style={styles.modalContent}>
            <BottleJourney journey={journey} />
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#014348', // Ocean theme background
  },
  contentContainer: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#D4AF37', // Mustard yellow
    textAlign: 'center',
    marginBottom: 8,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#D4AF37', // Mustard yellow
    marginBottom: 16,
    textAlign: 'center',
  },
  messageInput: {
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 15,
    padding: 16,
    fontSize: 16,
    height: 120,
    marginBottom: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    color: '#fff',
    textAlignVertical: 'top',
  },
  photoContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  photo: {
    width: 200,
    height: 200,
    borderRadius: 15,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  changePhotoButton: {
    padding: 8,
  },
  changePhotoText: {
    color: '#D4AF37',
    fontSize: 16,
    fontWeight: '600',
  },
  photoButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 30,
  },
  photoButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    padding: 16,
    borderRadius: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  photoButtonText: {
    fontSize: 15,
    color: '#fff',
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
    marginBottom: 40,
  },
  button: {
    padding: 16,
    borderRadius: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 4,
  },
  primaryButton: {
    backgroundColor: '#D4AF37', // Mustard yellow
  },
  foundButton: {
    backgroundColor: '#D4AF37', // Mustard yellow
    padding: 16,
    borderRadius: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 4,
  },
  foundButtonSecondary: {
    backgroundColor: '#D4AF37',
  },
  foundButtonText: {
    color: '#014348', // Dark text for contrast
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#014348', // Dark text for primary buttons
  },
  secondaryButtonText: {
    color: '#fff', // White text for secondary buttons
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#014348',
  },
  loadingTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#D4AF37',
    textAlign: 'center',
    marginBottom: 8,
  },
  loadingText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 22,
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#014348',
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
    color: 'rgba(255, 255, 255, 0.8)',
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
    backgroundColor: 'rgba(1, 67, 72, 0.9)', // Ocean overlay
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  scanLoadingText: {
    color: '#D4AF37',
    fontSize: 18,
    fontWeight: '600',
  },
  fullScreen: {
    flex: 1,
    backgroundColor: '#014348',
  },
  foundButtons: {
    gap: 12,
    marginTop: 20,
  },
  bottleCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 20,
    borderRadius: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#D4AF37',
    marginBottom: 8,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  messageSection: {
    flex: 1,
    paddingRight: 12,
  },
  imageSection: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardMessage: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  cardDate: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 12,
    textAlign: 'center',
  },
  cardImage: {
    width: 80,
    height: 80,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  journeySection: {
    marginBottom: 20,
  },
  journeyButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    padding: 16,
    borderRadius: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  journeyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  journeyButtonSubtext: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  promptContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#014348',
  },
  promptTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#D4AF37',
    textAlign: 'center',
    marginBottom: 8,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  promptText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
  },
  promptButtons: {
    gap: 12,
    marginTop: 20,
    width: '100%',
    maxWidth: 300,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#014348',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    justifyContent: 'flex-start',
  },
  modalContent: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  centeredButtonContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  compactButton: {
    padding: 12,
    borderRadius: 20,
  },
  conversationContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  originalMessage: {
    padding: 20,
  },
  senderLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#D4AF37',
    marginBottom: 8,
  },
  messageContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  replySenderLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#D4AF37',
    marginBottom: 8,
    marginTop: 16,
  },
  nestedReply: {
    marginLeft: 16, // Indent the reply
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  nestedReplyInput: {
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    minHeight: 80,
    marginBottom: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    color: '#fff',
    textAlignVertical: 'top',
  },
  replyPhotoContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  replyPhoto: {
    width: 120,
    height: 120,
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  removeReplyPhotoButton: {
    padding: 4,
  },
  removeReplyPhotoText: {
    color: '#D4AF37',
    fontSize: 12,
    fontWeight: '600',
  },
  replyPhotoButtons: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  replyPhotoButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  replyPhotoButtonText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  replyActionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  replyButton: {
    flex: 1,
    paddingVertical: 14,
  },
}); 