import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export interface Conversation {
  bottleId: string;
  originalMessage: string;
  originalCreator: string;
  originalCreatedAt: string;
  originalPhotoUrl?: string;
  lastMessage: string;
  lastMessageDate: string;
  lastMessageSender: string;
  replyCount: number;
  hasUnread: boolean; // Future: track unread status
}

export function useConversations() {
  return useQuery({
    queryKey: ['conversations'],
    queryFn: async (): Promise<Conversation[]> => {
      // Fetching active conversations
      
      // Get all bottles that have replies (found events with REPLY: messages)
      const { data: bottlesWithReplies, error } = await supabase
        .from('bottle_events')
        .select(`
          bottle_id,
          message,
          created_at,
          tosser_name,
          bottles!inner(
            message,
            creator_name,
            tosser_name,
            created_at,
            photo_url
          )
        `)
        .like('message', 'REPLY:%')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching conversations:', error);
        throw error;
      }

      // Group by bottle_id and create conversation objects
      const conversationMap = new Map<string, any>();
      
      bottlesWithReplies?.forEach((reply: any) => {
        const bottleId = reply.bottle_id;
        const bottle = reply.bottles;
        
        if (!conversationMap.has(bottleId)) {
          // Initialize conversation with original bottle data
          conversationMap.set(bottleId, {
            bottleId,
            originalMessage: bottle.message || 'No message',
            originalCreator: bottle.creator_name || bottle.tosser_name || 'Anonymous',
            originalCreatedAt: bottle.created_at,
            originalPhotoUrl: bottle.photo_url,
            replies: []
          });
        }
        
        // Add this reply to the conversation
        const conversation = conversationMap.get(bottleId);
        conversation.replies.push({
          message: reply.message,
          created_at: reply.created_at,
          sender: reply.tosser_name || 'Anonymous'
        });
      });

      // Convert to final conversation format
      const conversations: Conversation[] = Array.from(conversationMap.values()).map(conv => {
        const lastReply = conv.replies[0]; // Already sorted by date desc
        
        return {
          bottleId: conv.bottleId,
          originalMessage: conv.originalMessage,
          originalCreator: conv.originalCreator,
          originalCreatedAt: conv.originalCreatedAt,
          originalPhotoUrl: conv.originalPhotoUrl,
          lastMessage: lastReply.message.replace('REPLY: ', ''),
          lastMessageDate: lastReply.created_at,
          lastMessageSender: lastReply.sender,
          replyCount: conv.replies.length,
          hasUnread: false // Future feature
        };
      });

      // Found active conversations
      return conversations;
    },
    staleTime: 30000, // Cache for 30 seconds
  });
} 