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
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
  const [senderName, setSenderName] = useState('');
  const flatListRef = useRef<FlatList>(null);
  const queryClient = useQueryClient();

  // Get bottle data and messages
  const { data: chatData, isLoading, error, refetch } = useQuery({
    queryKey: ['chat', bottleId],
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
        .select('id, message, tosser_name, created_at, photo_url')
        .eq('bottle_id', bottleId)
        .like('message', 'REPLY:%')
        .order('created_at', { ascending: true });

      if (repliesError) throw repliesError;

      // Format messages for chat display
      const messages: ChatMessage[] = [
        // Original message first
        {
          id: `${bottle.id}-original`,
          message: bottle.message || 'No message',
          sender: bottle.creator_name || bottle.tosser_name || 'Anonymous',
          created_at: bottle.created_at,
          photo_url: bottle.photo_url,
          isOriginal: true,
          isFromMe: false,
        },
        // Then all replies
        ...(replies?.map(reply => ({
          id: reply.id,
          message: reply.message.replace('REPLY: ', ''),
          sender: reply.tosser_name || 'Anonymous',
          created_at: reply.created_at,
          photo_url: reply.photo_url,
          isOriginal: false,
          isFromMe: false, // Future: check against current user
        })) || [])
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
    enabled: !!bottleId,
  });

  // Send reply mutation
  const sendReplyMutation = useMutation({
    mutationFn: async ({ message, senderName }: { message: string; senderName: string }) => {
      // Sending reply to bottle
      
      const response = await fetch(`${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/find_bottle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          bottleId,
          replyMessage: message,
          finderName: senderName,
          lat: 0, // Future: get user location
          lon: 0,
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
      queryClient.invalidateQueries({ queryKey: ['chat', bottleId] });
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
    
    if (!senderName.trim()) {
      Alert.alert('Name Required', 'Please enter your name to send a message.');
      return;
    }

    sendReplyMutation.mutate({ 
      message: newMessage.trim(), 
      senderName: senderName.trim() 
    });
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
            <View style={styles.messageContent}>
              <Text style={styles.messageSender}>{item.sender}</Text>
              <Text style={[styles.messageText, item.isFromMe ? styles.myMessageText : styles.theirMessageText]}>
                {item.message}
              </Text>
              {item.photo_url && (
                <Image source={{ uri: item.photo_url }} style={styles.messagePhoto} />
              )}
              <Text style={[styles.messageTime, item.isFromMe ? styles.myMessageTime : styles.theirMessageTime]}>
                {formatTime(item.created_at)}
              </Text>
            </View>
          </View>
        )}
      </View>
    );
  };

  if (isLoading) {
    return (
      <ImageBackground 
        source={require('../../images/homepage_BG_new.png')} 
        style={styles.container}
      >
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.accent.mustardSea} />
            <Text style={styles.loadingText}>Loading chat...</Text>
          </View>
        </SafeAreaView>
      </ImageBackground>
    );
  }

  if (error || !chatData) {
    return (
      <ImageBackground 
        source={require('../../images/homepage_BG_new.png')} 
        style={styles.container}
      >
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>❌ Error loading chat</Text>
            <Text style={styles.errorSubtext}>{error?.message || 'Unknown error'}</Text>
            <Pressable style={styles.retryButton} onPress={() => refetch()}>
              <Text style={styles.retryButtonText}>Try Again</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </ImageBackground>
    );
  }

  return (
    <ImageBackground 
      source={require('../../images/homepage_BG_new.png')} 
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView 
          style={styles.keyboardContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          {/* Header */}
          <View style={styles.header}>
            <Pressable style={styles.backButton} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color={Colors.text.inverse} />
            </Pressable>
            <View style={styles.headerContent}>
              <Text style={styles.headerTitle}>Bottle Chat</Text>
              <Text style={styles.headerSubtitle}>
                with {chatData.bottle.creator_name}
              </Text>
            </View>
            <Pressable style={styles.optionsButton}>
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
            {!senderName && (
              <TextInput
                style={styles.nameInput}
                placeholder="Enter your name..."
                placeholderTextColor="rgba(255, 255, 255, 0.6)"
                value={senderName}
                onChangeText={setSenderName}
                maxLength={50}
              />
            )}
            <View style={styles.messageInputContainer}>
              <TextInput
                style={styles.messageInput}
                placeholder="Type a message..."
                placeholderTextColor="rgba(255, 255, 255, 0.6)"
                value={newMessage}
                onChangeText={setNewMessage}
                multiline
                maxLength={500}
                textAlignVertical="top"
              />
              <Pressable 
                style={[styles.sendButton, (!newMessage.trim() || !senderName.trim() || sendReplyMutation.isPending) && styles.sendButtonDisabled]}
                onPress={handleSendMessage}
                disabled={!newMessage.trim() || !senderName.trim() || sendReplyMutation.isPending}
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
    backgroundColor: 'rgba(1, 67, 72, 0.9)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  backButton: {
    padding: Spacing.sm,
    marginRight: Spacing.md,
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
  },
  myMessage: {
    alignSelf: 'flex-end',
  },
  theirMessage: {
    alignSelf: 'flex-start',
  },
  messageContent: {
    backgroundColor: 'rgba(1, 67, 72, 0.8)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    gap: Spacing.xs,
  },
  messageSender: {
    fontSize: Typography.sizes.xs,
    color: Colors.accent.mustardSea,
    fontWeight: Typography.weights.semibold,
  },
  messageText: {
    fontSize: Typography.sizes.md,
    lineHeight: Typography.lineHeights.normal * Typography.sizes.md,
  },
  myMessageText: {
    color: Colors.text.inverse,
  },
  theirMessageText: {
    color: Colors.text.inverse,
  },
  messagePhoto: {
    width: 150,
    height: 150,
    borderRadius: BorderRadius.md,
    resizeMode: 'cover',
  },
  messageTime: {
    fontSize: Typography.sizes.xs,
    alignSelf: 'flex-end',
  },
  myMessageTime: {
    color: Colors.text.secondary,
  },
  theirMessageTime: {
    color: Colors.text.secondary,
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
}); 