import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ImageBackground, 
  FlatList, 
  TextInput, 
  Pressable, 
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Modal
} from 'react-native';

import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useUserProfiles } from '../../src/hooks/useUserProfiles';
import { supabase } from '../../src/lib/supabase';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../src/constants/theme';

interface ChatMessage {
  id: string;
  message: string;
  sender: string;
  created_at: string;
  photo_url?: string;
  isOriginal?: boolean;
  isFromMe?: boolean; // Future: determine based on user auth
}

interface BottleData {
  id: string;
  message: string;
  creator_name: string;
  created_at: string;
  photo_url?: string;
}

export default function ChatScreen() {
  const { bottleId } = useLocalSearchParams<{ bottleId: string }>();
  const [newMessage, setNewMessage] = useState('');
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const queryClient = useQueryClient();
  const { username, loading: userLoading } = useUserProfiles();

  // Get bottle data and messages with real-time updates
  const { data: chatData, isLoading, error, refetch } = useQuery({
    queryKey: ['chat', bottleId, username],
    queryFn: async (): Promise<{ bottle: BottleData; messages: ChatMessage[] }> => {
      // Fetching chat data for bottle
      
      // Get bottle data
      const { data: bottle, error: bottleError } = await supabase
        .from('bottles')
        .select('id, message, creator_name, tosser_name, created_at, photo_url')
        .eq('id', bottleId)
        .single();

      if (bottleError) throw bottleError;

      // Get all replies (found events with REPLY: messages)
      const { data: replies, error: repliesError } = await supabase
        .from('bottle_events')
        .select('id, message, tosser_name, finder_name, created_at, photo_url')
        .eq('bottle_id', bottleId)
        .like('message', 'REPLY:%')
        .order('created_at', { ascending: true });

      if (repliesError) throw repliesError;

      // Format messages for chat display
      const currentUser = username?.trim().toLowerCase() || '';
      
      const messages: ChatMessage[] = [
        // Original message first
        {
          id: `${bottle.id}-original`,
          message: bottle.message || 'No message',
          sender: bottle.creator_name || bottle.tosser_name || 'Anonymous',
          created_at: bottle.created_at,
          photo_url: bottle.photo_url,
          isOriginal: true,
          isFromMe: (bottle.creator_name || bottle.tosser_name || '').trim().toLowerCase() === currentUser,
        },
        // Then all replies
        ...(replies?.map((reply) => {
          const replySender = reply.finder_name || reply.tosser_name || 'Unknown User';
          const isFromMe = replySender.trim().toLowerCase() === currentUser;
          return {
            id: reply.id,
            message: reply.message.replace('REPLY: ', ''),
            sender: replySender,
            created_at: reply.created_at,
            photo_url: reply.photo_url,
            isOriginal: false,
            isFromMe,
          };
        }) || [])
      ];

      return { 
        bottle: {
          id: bottle.id,
          message: bottle.message || 'No message',
          creator_name: bottle.creator_name || bottle.tosser_name || 'Anonymous',
          created_at: bottle.created_at,
          photo_url: bottle.photo_url,
        }, 
        messages 
      };
    },
    enabled: !!bottleId && !userLoading && !!username,
  });

  // TODO: Real-time subscription disabled due to multiple subscription error
  // Will re-enable after fixing the root cause
  /*
  useEffect(() => {
    if (!bottleId || !username) return;

    const channelName = `bottle-events-${bottleId}-${username}-${Date.now()}`;
    
    const subscription = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'bottle_events',
          filter: `bottle_id=eq.${bottleId}`,
        },
        (payload) => {
          console.log('🔄 Real-time message received:', payload);
          queryClient.invalidateQueries({ queryKey: ['chat', bottleId, username] });
        }
      )
      .subscribe();

    return () => {
      console.log('🧹 Cleaning up subscription:', channelName);
      supabase.removeChannel(subscription);
    };
  }, [bottleId, username, queryClient]);
  */

  // Send reply mutation
  const sendReplyMutation = useMutation({
    mutationFn: async ({ message, username }: { message: string; username: string }) => {
      // Sending reply to bottle
      
      const response = await fetch(`${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/claim_or_toss_bottle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          id: bottleId,
          password: 'reply', // Replies don't need real password
          message: `REPLY: ${message}`,
          finderName: username,
          lat: 0, // Future: get user location
          lon: 0,
          action: 'found'
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to send reply: ${response.status}`);
      }

      return response.json();
    },
    onSuccess: () => {
              // Reply sent successfully
      setNewMessage('');
      // Refresh chat data
      queryClient.invalidateQueries({ queryKey: ['chat', bottleId, username] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      // Scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    },
    onError: (error) => {
      console.error('❌ Error sending reply:', error);
      Alert.alert('Error', 'Failed to send message. Please try again.');
    },
  });

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
    }
  };

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    
    if (!username?.trim()) {
      Alert.alert('Name Required', 'Please set your username first.');
      return;
    }

    sendReplyMutation.mutate({ 
      message: newMessage.trim(), 
      username: username.trim() 
    });
  };

  const handleAddFriend = () => {
    setShowOptionsMenu(false);
    Alert.alert('Add Friend', 'Friend feature coming soon!');
  };

  const handleDeleteChat = () => {
    setShowOptionsMenu(false);
    Alert.alert(
      'Delete Chat',
      'Are you sure you want to delete this chat? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            // TODO: Implement chat deletion
            Alert.alert('Coming Soon', 'Chat deletion feature will be available soon.');
          }
        }
      ]
    );
  };

  const renderMessage = ({ item, index }: { item: ChatMessage; index: number }) => {
    const prevMessage = index > 0 ? chatData?.messages[index - 1] : null;
    const showDate = !prevMessage || formatDate(item.created_at) !== formatDate(prevMessage.created_at);
    
    return (
      <View>
        {/* Date separator */}
        {showDate && (
          <View style={styles.dateSeparator}>
            <Text style={styles.dateText}>{formatDate(item.created_at)}</Text>
          </View>
        )}
        
        {/* Original message gets special treatment */}
        {item.isOriginal ? (
          <View style={styles.originalMessageContainer}>
            <View style={styles.originalMessageHeader}>
              <Text style={styles.originalMessageTitle}>🍾 Original Message</Text>
              <Text style={styles.originalMessageDate}>
                from {item.sender} • {formatTime(item.created_at)}
              </Text>
            </View>
            <View style={styles.originalMessageContent}>
              <Text style={styles.originalMessageText}>{item.message}</Text>
              {item.photo_url && (
                <Image source={{ uri: item.photo_url }} style={styles.originalMessagePhoto} />
              )}
            </View>
          </View>
        ) : (
          // Regular reply message
          <View style={[styles.messageContainer, item.isFromMe ? styles.myMessage : styles.theirMessage]}>
            <View style={[styles.messageContent, item.isFromMe ? styles.myMessageContent : styles.theirMessageContent]}>
              <View style={styles.messageHeader}>
                <Text style={[styles.messageSender, item.isFromMe ? styles.myMessageSender : styles.theirMessageSender]} numberOfLines={1}>
                  {item.sender}
                </Text>
                <Text style={[styles.messageTime, item.isFromMe ? styles.myMessageTime : styles.theirMessageTime]}>
                  {formatTime(item.created_at)}
                </Text>
              </View>
              <Text style={[styles.messageText, item.isFromMe ? styles.myMessageText : styles.theirMessageText]}>
                {item.message}
              </Text>
              {item.photo_url && (
                <Image source={{ uri: item.photo_url }} style={styles.messagePhoto} />
              )}
            </View>
          </View>
        )}
      </View>
    );
  };

  if (isLoading || userLoading) {
    return (
      <View style={styles.container}>
        <ImageBackground 
          source={require('../../images/homepage_BG_new.png')} 
          style={styles.backgroundImage}
        >
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.accent.mustardSea} />
            <Text style={styles.loadingText}>Loading chat...</Text>
          </View>
        </ImageBackground>
      </View>
    );
  }

  if (error || !chatData) {
    return (
      <View style={styles.container}>
        <ImageBackground 
          source={require('../../images/homepage_BG_new.png')} 
          style={styles.backgroundImage}
        >
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>❌ Error loading chat</Text>
            <Text style={styles.errorSubtext}>{error?.message || 'Unknown error'}</Text>
            <Pressable style={styles.retryButton} onPress={() => refetch()}>
              <Text style={styles.retryButtonText}>Try Again</Text>
            </Pressable>
          </View>
        </ImageBackground>
      </View>
    );
  }

  return (
    <ImageBackground 
      source={require('../../images/homepage_BG_new.png')} 
      style={styles.container}
    >

      <KeyboardAvoidingView 
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable style={styles.closeButton} onPress={() => router.replace('/(tabs)')}>
            <Ionicons name="close" size={24} color={Colors.text.inverse} />
          </Pressable>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Bottle Chat</Text>
            <Text style={styles.headerSubtitle}>
              with {chatData.bottle.creator_name}
            </Text>
          </View>
          <Pressable style={styles.optionsButton} onPress={() => setShowOptionsMenu(true)}>
            <Ionicons name="ellipsis-vertical" size={24} color={Colors.text.inverse} />
          </Pressable>
        </View>

          {/* Messages */}
          <FlatList
            ref={flatListRef}
            data={chatData.messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id}
            style={styles.messagesList}
            contentContainerStyle={styles.messagesContent}
            showsVerticalScrollIndicator={false}
            onLayout={() => {
              // Scroll to bottom on load
              setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: false });
              }, 100);
            }}
          />

          {/* Input area */}
          <View style={styles.inputContainer}>
            <View style={styles.messageInputContainer}>
              <TextInput
                style={styles.messageInput}
                placeholder={`Type a message as ${username || 'Voyager'}...`}
                placeholderTextColor="rgba(255, 255, 255, 0.6)"
                value={newMessage}
                onChangeText={setNewMessage}
                multiline
                maxLength={500}
                textAlignVertical="top"
              />
              <Pressable 
                style={[styles.sendButton, (!newMessage.trim() || !username?.trim() || sendReplyMutation.isPending) && styles.sendButtonDisabled]}
                onPress={handleSendMessage}
                disabled={!newMessage.trim() || !username?.trim() || sendReplyMutation.isPending}
              >
                {sendReplyMutation.isPending ? (
                  <ActivityIndicator size="small" color={Colors.text.primary} />
                ) : (
                  <Ionicons name="send" size={20} color={Colors.text.primary} />
                )}
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>

        {/* Options Menu Modal */}
        <Modal
          visible={showOptionsMenu}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowOptionsMenu(false)}
        >
          <Pressable 
            style={styles.modalOverlay} 
            onPress={() => setShowOptionsMenu(false)}
          >
            <View style={styles.optionsMenu}>
              <Pressable style={styles.optionItem} onPress={handleAddFriend}>
                <Ionicons name="person-add" size={20} color={Colors.text.inverse} />
                <Text style={styles.optionText}>Add Friend</Text>
              </Pressable>
              
              <View style={styles.optionSeparator} />
              
              <Pressable style={styles.optionItem} onPress={handleDeleteChat}>
                <Ionicons name="trash" size={20} color={Colors.accent.coral} />
                <Text style={[styles.optionText, styles.deleteOptionText]}>Delete Chat</Text>
              </Pressable>
            </View>
          </Pressable>
        </Modal>
      </ImageBackground>
    );
  }

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    flex: 1,
  },
  keyboardContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: Typography.sizes.md,
    color: Colors.text.inverse,
    marginTop: Spacing.md,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
  },
  errorText: {
    fontSize: Typography.sizes.lg,
    color: Colors.accent.coral,
    fontWeight: Typography.weights.bold,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  errorSubtext: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  retryButton: {
    backgroundColor: Colors.accent.mustardSea,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  retryButtonText: {
    color: Colors.text.primary,
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    backgroundColor: 'rgba(1, 67, 72, 0.9)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(1, 67, 72, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
    ...Shadows.base,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    color: Colors.text.inverse,
  },
  headerSubtitle: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
  },
  optionsButton: {
    padding: Spacing.sm,
    marginLeft: Spacing.md,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  dateSeparator: {
    alignItems: 'center',
    marginVertical: Spacing.lg,
  },
  dateText: {
    fontSize: Typography.sizes.xs,
    color: Colors.text.secondary,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  originalMessageContainer: {
    backgroundColor: 'rgba(212, 175, 55, 0.2)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginVertical: Spacing.lg,
    borderWidth: 2,
    borderColor: Colors.accent.mustardSea,
  },
  originalMessageHeader: {
    marginBottom: Spacing.md,
  },
  originalMessageTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    color: Colors.accent.mustardSea,
    marginBottom: Spacing.xs,
  },
  originalMessageDate: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
  },
  originalMessageContent: {
    gap: Spacing.md,
  },
  originalMessageText: {
    fontSize: Typography.sizes.md,
    color: Colors.text.inverse,
    lineHeight: Typography.lineHeights.relaxed * Typography.sizes.md,
  },
  originalMessagePhoto: {
    width: '100%',
    height: 200,
    borderRadius: BorderRadius.md,
    resizeMode: 'cover',
  },
  messageContainer: {
    marginVertical: Spacing.xs,
    maxWidth: '80%',
    paddingHorizontal: Spacing.md,
  },
  myMessage: {
    alignSelf: 'flex-end',
  },
  theirMessage: {
    alignSelf: 'flex-start',
  },
  messageContent: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
    minHeight: 20,
  },
  myMessageContent: {
    backgroundColor: Colors.accent.mustardSea,
    borderBottomRightRadius: 4,
  },
  theirMessageContent: {
    backgroundColor: 'rgba(1, 67, 72, 0.8)',
    borderBottomLeftRadius: 4,
  },
  messageSender: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.semibold,
    flex: 1,
    marginRight: Spacing.sm,
  },
  myMessageSender: {
    color: Colors.text.primary,
  },
  theirMessageSender: {
    color: Colors.accent.mustardSea,
  },
  messageText: {
    fontSize: Typography.sizes.md,
    lineHeight: Typography.lineHeights.normal * Typography.sizes.md,
  },
  myMessageText: {
    color: Colors.text.primary,
  },
  theirMessageText: {
    color: Colors.text.inverse,
  },
  messageTime: {
    fontSize: Typography.sizes.xs,
  },
  myMessageTime: {
    color: 'rgba(0, 0, 0, 0.6)',
  },
  theirMessageTime: {
    color: 'rgba(255, 255, 255, 0.6)',
  },
  messagePhoto: {
    width: 150,
    height: 150,
    borderRadius: BorderRadius.md,
    resizeMode: 'cover',
  },
  inputContainer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: 'rgba(1, 67, 72, 0.9)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    gap: Spacing.md,
  },
  nameInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: Typography.sizes.md,
    color: Colors.text.inverse,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  messageInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.md,
  },
  messageInput: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: Typography.sizes.md,
    color: Colors.text.inverse,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  sendButton: {
    backgroundColor: Colors.accent.mustardSea,
    borderRadius: BorderRadius.full,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.sm,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 100, // Position below header
    paddingRight: Spacing.lg,
  },
  optionsMenu: {
    backgroundColor: 'rgba(1, 67, 72, 0.95)',
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.sm,
    minWidth: 150,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    ...Shadows.lg,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  optionText: {
    fontSize: Typography.sizes.md,
    color: Colors.text.inverse,
    fontWeight: Typography.weights.medium,
  },
  deleteOptionText: {
    color: Colors.accent.coral,
  },
  optionSeparator: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: Spacing.lg,
  },
}); 