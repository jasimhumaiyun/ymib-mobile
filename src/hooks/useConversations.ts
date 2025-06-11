import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export interface Conversation {
  id: string; // Unique conversation ID based on bottle + hop
  bottleId: string;
  hopNumber: number; // Which hop this conversation represents
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
      // Get all bottles that have replies (found events with REPLY: messages)
      const { data: bottlesWithReplies, error } = await supabase
        .from('bottle_events')
        .select(`
          id,
          bottle_id,
          message,
          created_at,
          tosser_name,
          finder_name,
          event_type,
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

      // For each reply, we need to find the corresponding "found" event and preceding "cast_away" event
      // to create a conversation context for that specific hop
      const conversations: Conversation[] = [];

             for (const reply of bottlesWithReplies || []) {
         const bottleId = reply.bottle_id;
         const bottle = Array.isArray(reply.bottles) ? reply.bottles[0] : reply.bottles;

        // Get all events for this bottle to understand the sequence
        const { data: allEvents } = await supabase
          .from('bottle_events')
          .select('*')
          .eq('bottle_id', bottleId)
          .order('created_at', { ascending: true });

        if (!allEvents) continue;

        // Find the "found" event that corresponds to this reply
        const replyIndex = allEvents.findIndex(e => e.id === reply.id);
        if (replyIndex === -1) continue;

        // Find the most recent "found" event before this reply
        let foundEvent = null;
        for (let i = replyIndex - 1; i >= 0; i--) {
          if (allEvents[i].event_type === 'found') {
            foundEvent = allEvents[i];
            break;
          }
        }

        // Find the "cast_away" event that corresponds to this found event
        let castAwayEvent = null;
        if (foundEvent) {
          for (let i = allEvents.indexOf(foundEvent) - 1; i >= 0; i--) {
            if (allEvents[i].event_type === 'cast_away') {
              castAwayEvent = allEvents[i];
              break;
            }
          }
        }

        // If we can't find the proper sequence, create a fallback event structure
        const effectiveCastAway = castAwayEvent || {
          message: bottle.message || 'Original message',
          tosser_name: bottle.creator_name,
          created_at: bottle.created_at,
          photo_url: bottle.photo_url
        };

        // Calculate hop number (how many cast_away events happened before this one)
        const hopNumber = allEvents.filter((e, idx) => 
          idx <= allEvents.indexOf(foundEvent || reply) && e.event_type === 'cast_away'
        ).length;

        // Create unique conversation ID for this hop
        const conversationId = `${bottleId}-hop${hopNumber}`;

                 // Create conversation object for this specific interaction
         conversations.push({
           id: conversationId,
           bottleId,
           hopNumber,
           originalMessage: effectiveCastAway.message || 'No message',
           originalCreator: effectiveCastAway.tosser_name || 'Anonymous',
           originalCreatedAt: effectiveCastAway.created_at,
           originalPhotoUrl: effectiveCastAway.photo_url,
           lastMessage: reply.message.replace('REPLY: ', ''),
           lastMessageDate: reply.created_at,
           lastMessageSender: reply.finder_name || 'Anonymous',
           replyCount: 1, // Each conversation has exactly one reply for now
           hasUnread: false
         });
      }

      // Sort by most recent activity first
      conversations.sort((a, b) => 
        new Date(b.lastMessageDate).getTime() - new Date(a.lastMessageDate).getTime()
      );

      return conversations;
    },
    staleTime: 30000, // Cache for 30 seconds
  });
} 