import React from 'react';
import { View, Text, StyleSheet, ImageBackground, FlatList, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useConversations, Conversation } from '../../src/hooks/useConversations';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../src/constants/theme';

export default function MessagesScreen() {
  const { data: conversations, isLoading, error } = useConversations();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const renderConversation = ({ item }: { item: Conversation }) => (
    <Pressable 
      style={styles.conversationCard}
      onPress={() => router.push(`/chat/${item.id}` as any)}
    >
      <View style={styles.avatarContainer}>
        <Text style={styles.avatarText}>🍾</Text>
      </View>
      
      <View style={styles.conversationContent}>
        <View style={styles.conversationHeader}>
          <Text style={styles.conversationTitle} numberOfLines={1}>
            Hop #{item.hopNumber}: {item.originalCreator}
          </Text>
          <Text style={styles.conversationTime}>
            {formatDate(item.lastMessageDate)}
          </Text>
        </View>
        
        <Text style={styles.lastMessage} numberOfLines={1}>
          {item.lastMessageSender}: {item.lastMessage}
        </Text>
        
        <View style={styles.conversationMeta}>
          <Text style={styles.replyCount}>
            {item.replyCount} {item.replyCount === 1 ? 'reply' : 'replies'}
          </Text>
          {item.hasUnread && <View style={styles.unreadIndicator} />}
        </View>
      </View>
    </Pressable>
  );

  return (
    <ImageBackground 
      source={require('../../images/homepage_BG_new.png')} 
      style={styles.container}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <Text style={styles.title}>🌊 Ocean Chats</Text>
          <Text style={styles.subtitle}>Your active bottle conversations</Text>
          
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.accent.mustardSea} />
              <Text style={styles.loadingText}>Loading conversations...</Text>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>❌ Error loading conversations</Text>
              <Text style={styles.errorSubtext}>{error.message}</Text>
            </View>
          ) : conversations && conversations.length > 0 ? (
            <FlatList
              data={conversations}
              renderItem={renderConversation}
              keyExtractor={(item) => item.id}
              style={styles.conversationsList}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: Spacing.xl }}
            />
          ) : (
            <View style={styles.placeholderContainer}>
              <Text style={styles.placeholderIcon}>💬</Text>
              <Text style={styles.placeholderText}>No active chats yet</Text>
              <Text style={styles.placeholderSubtext}>
                Find a bottle to start your first conversation across the digital seas
              </Text>
            </View>
          )}
        </View>
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
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
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
    marginBottom: Spacing.xl,
  },
  conversationsList: {
    flex: 1,
  },
  conversationCard: {
    backgroundColor: 'rgba(1, 67, 72, 0.8)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    flexDirection: 'row',
    alignItems: 'center',
    ...Shadows.md,
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.accent.mustardSea,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  avatarText: {
    fontSize: 24,
  },
  conversationContent: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  conversationTitle: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
    color: Colors.text.inverse,
    flex: 1,
    marginRight: Spacing.sm,
  },
  conversationTime: {
    fontSize: Typography.sizes.xs,
    color: Colors.accent.mustardSea,
    fontWeight: Typography.weights.medium,
  },
  lastMessage: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.inverse,
    opacity: 0.8,
    marginBottom: Spacing.xs,
  },
  conversationMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  replyCount: {
    fontSize: Typography.sizes.xs,
    color: Colors.text.secondary,
  },
  unreadIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.accent.seaweed,
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
  },
  placeholderContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
  },
  placeholderIcon: {
    fontSize: 64,
    marginBottom: Spacing.lg,
  },
  placeholderText: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    color: Colors.text.inverse,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  placeholderSubtext: {
    fontSize: Typography.sizes.md,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
  },
}); 