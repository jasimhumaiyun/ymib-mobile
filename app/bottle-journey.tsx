import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Animated, ImageBackground, Alert } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { supabase } from '../src/lib/supabase';
import EnhancedBottleJourney from '../src/components/EnhancedBottleJourney';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../src/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';

type JourneyStep = 'loading' | 'viewing' | 'retoss-prompt' | 'retossing' | 'success';

interface Reply {
  id: string;
  message: string;
  photo_url?: string;
  created_at: string;
  finder_name?: string;
  replies?: Reply[];
  parent_reply_id?: string;
}

interface JourneyEvent {
  toss_number: number;
  message: string;
  photo_url?: string;
  created_at: string;
  tosser_name?: string;
  replies?: Reply[];
}

export default function BottleJourneyScreen() {
  const params = useLocalSearchParams();
  const queryClient = useQueryClient();
  const [step, setStep] = useState<JourneyStep>('loading');
  const [journey, setJourney] = useState<JourneyEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [canRetoss, setCanRetoss] = useState(false);

  // Animation refs for retoss
  const bottleAnimation = useRef(new Animated.Value(0)).current;
  const bottleRotation = useRef(new Animated.Value(0)).current;
  const bottleScale = useRef(new Animated.Value(1)).current;

  const bottleId = params.bottleId as string;
  const bottlePassword = params.bottlePassword as string;

  useEffect(() => {
    if (bottleId) {
      fetchBottleJourney();
    }
  }, [bottleId]);

  // Start bottle animation when retossing step begins
  useEffect(() => {
    if (step === 'retossing') {
      startBottleAnimation();
    }
  }, [step]);

  const fetchBottleJourney = async () => {
    try {
      setLoading(true);

      // Get original bottle data
      const { data: bottle, error: bottleError } = await supabase
        .from('bottles')
        .select('*')
        .eq('id', bottleId)
        .single();

      if (bottleError) throw bottleError;

      // Get all events for this bottle
      const { data: allEvents, error: eventsError } = await supabase
        .from('bottle_events')
        .select('*')
        .eq('bottle_id', bottleId)
        .order('created_at', { ascending: true });

      if (eventsError) throw eventsError;

      // Build the correct journey with proper reply associations and nesting
      const journeyEvents: JourneyEvent[] = [];
      let tossNumber = 1;

      // Step 1: Get all cast_away events (these are the main journey steps)
      const castAwayEvents = allEvents?.sort((a, b) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      ).filter(event => event.event_type === 'cast_away');
      const foundEvents = allEvents?.sort((a, b) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      ).filter(event => event.event_type === 'found');

      // Helper function to build flat reply list (no nesting)
      const buildFlatReplies = (events: any[]): Reply[] => {
        return events.map(event => {
          // Skip system messages
          if (event.message === 'Bottle found') return null;

          let replyMessage = event.message || '';
          // Remove "REPLY: " prefix if it exists
          if (replyMessage.startsWith('REPLY: ')) {
            replyMessage = replyMessage.substring(7);
          }

          return {
            id: event.id,
            message: replyMessage,
            photo_url: event.photo_url,
            created_at: event.created_at,
            finder_name: event.finder_name || 'Anonymous',
            parent_reply_id: event.parent_reply_id,
            replies: [] // No nested replies - flat structure
          };
        }).filter(Boolean) as Reply[];
      };

      // Step 2: Build each journey step with its associated replies
      castAwayEvents.forEach((castEvent, index) => {
        const isOriginalCreation = index === 0;
        
        // Get the message for this step
        let stepMessage = castEvent.message;
        if (isOriginalCreation) {
          // For the original creation, use the first cast_away event message
          stepMessage = castEvent.message || bottle.message;
        }

        const creatorName = bottle.creator_name || bottle.tosser_name || 'Anonymous';
        const journeyStep: JourneyEvent = {
          toss_number: tossNumber++,
          message: stepMessage,
          photo_url: isOriginalCreation ? bottle.photo_url : castEvent.photo_url,
          created_at: isOriginalCreation ? bottle.created_at : castEvent.created_at,
          tosser_name: isOriginalCreation 
            ? (creatorName === 'Anonymous' ? 'Original Creator' : `${creatorName} (Original Creator)`)
            : (castEvent.tosser_name || 'Anonymous'),
          replies: []
        };

        // Step 3: Find all found events that belong to this cast_away event
        // A found event belongs to a cast_away if it happens after this cast_away but before the next cast_away
        const currentCastTime = new Date(castEvent.created_at).getTime();
        const nextCastEvent = castAwayEvents[index + 1];
        const nextCastTime = nextCastEvent ? new Date(nextCastEvent.created_at).getTime() : Number.MAX_SAFE_INTEGER;

        // Filter found events that belong to this cast_away event
        const relevantFoundEvents = foundEvents.filter(foundEvent => {
          const foundTime = new Date(foundEvent.created_at).getTime();
          return foundTime > currentCastTime && foundTime < nextCastTime;
        });

        // Step 4: Build the flat reply list for this journey step (sort latest first)
        const sortedFoundEvents = relevantFoundEvents.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        journeyStep.replies = buildFlatReplies(sortedFoundEvents);

        journeyEvents.push(journeyStep);
      });

      // If no cast_away events found, create a journey step from the original bottle
      if (journeyEvents.length === 0) {
        const firstCastAwayEvent = allEvents?.find(event => event.event_type === 'cast_away');
        const originalMessage = firstCastAwayEvent?.message || bottle.message;
        
        const creatorName = bottle.creator_name || bottle.tosser_name || 'Anonymous';
        const singleStep: JourneyEvent = {
          toss_number: 1,
          message: originalMessage,
          photo_url: bottle.photo_url,
          created_at: bottle.created_at,
          tosser_name: creatorName === 'Anonymous' ? 'Original Creator' : `${creatorName} (Original Creator)`,
          replies: []
        };

        // Add any found events as replies to this single step (sort latest first)
        const sortedFoundEvents = foundEvents.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        singleStep.replies = buildFlatReplies(sortedFoundEvents);

        journeyEvents.push(singleStep);
      }

      setJourney(journeyEvents);

      // Check if bottle can be retossed (has found events but last event isn't a retoss)
      const hasFoundEvent = foundEvents.some(e => e.event_type === 'found');
      const lastEvent = foundEvents[foundEvents.length - 1];
      const isLastEventFound = lastEvent?.event_type === 'found';
      
      setCanRetoss(hasFoundEvent && isLastEventFound && bottle.status === 'found');
      setStep('viewing');

    } catch (error) {
      console.error('Error fetching bottle journey:', error);
      Alert.alert('Error', 'Failed to load bottle journey');
      if (router.canDismiss()) {
        router.dismissAll();
      } else {
        router.replace('/(tabs)');
      }
    } finally {
      setLoading(false);
    }
  };

  const startBottleAnimation = () => {
    // Reset animations
    bottleAnimation.setValue(0);
    bottleRotation.setValue(0);
    bottleScale.setValue(1);

    // Sequence of animations (same as toss.tsx)
    Animated.sequence([
      // Phase 1: Bottle flies in from bottom with slow rotation (4 seconds)
      Animated.parallel([
        Animated.timing(bottleAnimation, {
          toValue: 0.4,
          duration: 4000,
          useNativeDriver: true,
        }),
        Animated.timing(bottleRotation, {
          toValue: 3,
          duration: 4000,
          useNativeDriver: true,
        }),
      ]),
      // Phase 2: Fast spinning and scaling down to disappear (2 seconds)
      Animated.parallel([
        Animated.timing(bottleAnimation, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(bottleRotation, {
          toValue: 10,
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

  const handleRetoss = async () => {
    try {
      setStep('retossing');

      // Get current location
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Location permission denied');
      }

      const location = await Location.getCurrentPositionAsync({});
      
      // Call the retoss function
      const { data, error } = await supabase.functions.invoke('claim_or_toss_bottle', {
        body: {
          id: bottleId,
          password: bottlePassword,
          message: "Continuing the journey...",
          lat: location.coords.latitude,
          lon: location.coords.longitude,
        }
      });

      if (error) throw error;

      // Invalidate bottle stats to refresh the profile
      queryClient.invalidateQueries({ queryKey: ['bottle-stats'] });

      // Animation will automatically transition to success

    } catch (error) {
      console.error('Error retossing bottle:', error);
      Alert.alert('Error', 'Failed to retoss bottle');
      setStep('viewing');
    }
  };

  const renderContent = () => {
    switch (step) {
      case 'loading':
        return (
          <View style={styles.centerContainer}>
            <Text style={styles.loadingTitle}>Loading Journey...</Text>
            <Text style={styles.loadingSubtitle}>Tracing the bottle's path across the seas</Text>
          </View>
        );

      case 'viewing':
        return (
          <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
            <View style={styles.headerSection}>
              <Text style={styles.title}>Bottle Journey</Text>
              <Text style={styles.subtitle}>
                Bottle #{bottleId.slice(0, 8)}...
              </Text>
            </View>

            <View style={styles.journeyContainer}>
              <EnhancedBottleJourney journey={journey} bottleId={bottleId} />
            </View>

            {canRetoss && (
              <View style={styles.retossSection}>
                <Text style={styles.retossTitle}>Continue the Journey</Text>
                <Text style={styles.retossSubtitle}>
                  This bottle has been found and is ready to continue its voyage across the seas.
                </Text>
                <Pressable 
                  style={styles.retossButton}
                  onPress={() => setStep('retoss-prompt')}
                >
                  <Text style={styles.retossButtonText}>Retoss Bottle</Text>
                </Pressable>
              </View>
            )}
          </ScrollView>
        );

      case 'retoss-prompt':
        return (
          <View style={styles.centerContainer}>
            <Text style={styles.promptTitle}>🔄 Continue the Journey?</Text>
            <Text style={styles.promptSubtitle}>
              Toss this bottle back into the ocean for others to discover.
            </Text>
            
            <View style={styles.buttonContainer}>
              <Pressable 
                style={styles.secondaryButton}
                onPress={() => setStep('viewing')}
              >
                <Text style={styles.secondaryButtonText}>Keep Viewing</Text>
              </Pressable>
              
              <Pressable 
                style={styles.primaryButton}
                onPress={handleRetoss}
              >
                <Text style={styles.primaryButtonText}>Retoss Now</Text>
              </Pressable>
            </View>
          </View>
        );

      case 'retossing':
        const translateY = bottleAnimation.interpolate({
          inputRange: [0, 1],
          outputRange: [200, -200],
        });

        const rotation = bottleRotation.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', '360deg'],
        });

        return (
          <View style={styles.centerContainer}>
            <Text style={styles.loadingTitle}>Retossing bottle...</Text>
            <Text style={styles.loadingSubtitle}>Sending it back to the endless seas</Text>
            
            <View style={styles.animationContainer}>
              <Animated.Image
                source={require('../images/homepage_bottle.png')}
                style={[
                  styles.animatedBottle,
                  {
                    transform: [
                      { translateY },
                      { rotate: rotation },
                      { scale: bottleScale },
                    ],
                  },
                ]}
              />
            </View>
          </View>
        );

      case 'success':
        return (
          <View style={styles.centerContainer}>
            <Text style={styles.successTitle}>Journey Continues!</Text>
            <Text style={styles.successSubtitle}>
              Your bottle has been retossed and is now drifting toward new adventures.
            </Text>
            
            <Pressable 
              style={styles.primaryButton}
              onPress={() => {
                if (router.canDismiss()) {
                  router.dismissAll();
                } else {
                  router.replace('/(tabs)');
                }
              }}
            >
              <Text style={styles.primaryButtonText}>Return to Profile</Text>
            </Pressable>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <ImageBackground 
      source={require('../images/homepage_BG_new.png')} 
      style={styles.container}
      resizeMode="cover"
    >
      <Stack.Screen options={{ headerShown: false }} />
      
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Pressable 
            style={styles.closeButton}
            onPress={() => router.replace('/(tabs)')}
          >
            <Ionicons name="close" size={24} color={Colors.text.inverse} />
          </Pressable>
        </View>

        {renderContent()}
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
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
  scrollContainer: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: Spacing['2xl'],
  },
  title: {
    fontSize: Typography.sizes['3xl'],
    fontWeight: Typography.weights.bold,
    color: Colors.text.ocean,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: Typography.sizes.md,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  journeyContainer: {
    marginBottom: Spacing['2xl'],
  },
  retossSection: {
    backgroundColor: Colors.background.primary,
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    marginBottom: Spacing['2xl'],
    ...Shadows.md,
  },
  retossTitle: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    color: Colors.text.ocean,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  retossSubtitle: {
    fontSize: Typography.sizes.md,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: Typography.lineHeights.relaxed * Typography.sizes.md,
    marginBottom: Spacing.lg,
  },
  retossButton: {
    backgroundColor: Colors.primary[600],
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    ...Shadows.base,
  },
  retossButtonText: {
    color: Colors.text.inverse,
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
  },
  promptTitle: {
    fontSize: Typography.sizes['2xl'],
    fontWeight: Typography.weights.bold,
    color: Colors.text.ocean,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  promptSubtitle: {
    fontSize: Typography.sizes.md,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: Typography.lineHeights.relaxed * Typography.sizes.md,
    marginBottom: Spacing['2xl'],
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  primaryButton: {
    backgroundColor: Colors.primary[600],
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    ...Shadows.base,
  },
  primaryButtonText: {
    color: Colors.text.inverse,
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
    textAlign: 'center',
  },
  secondaryButton: {
    backgroundColor: Colors.neutral[100],
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.neutral[300],
  },
  secondaryButtonText: {
    color: Colors.text.primary,
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.medium,
    textAlign: 'center',
  },
  loadingTitle: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    color: Colors.text.ocean,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  loadingSubtitle: {
    fontSize: Typography.sizes.md,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  successTitle: {
    fontSize: Typography.sizes['2xl'],
    fontWeight: Typography.weights.bold,
    color: Colors.primary[600],
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  successSubtitle: {
    fontSize: Typography.sizes.md,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: Typography.lineHeights.relaxed * Typography.sizes.md,
    marginBottom: Spacing['2xl'],
  },
  animationContainer: {
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing['2xl'],
  },
  animatedBottle: {
    width: 100,
    height: 100,
    resizeMode: 'contain',
  },
}); 