import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, Pressable } from 'react-native';
import { router } from 'expo-router';

interface Reply {
  id: string;
  message: string;
  photo_url?: string;
  created_at: string;
  finder_name?: string; // Will be "Anonymous" for now, real names later with auth
  replies?: Reply[]; // Support nested replies
  parent_reply_id?: string; // To track which reply this is responding to
}

interface JourneyStep {
  toss_number: number;
  message: string;
  photo_url?: string;
  created_at: string;
  tosser_name?: string; // Will be "Anonymous" for now
  replies?: Reply[]; // Nested replies from finders
}

interface EnhancedBottleJourneyProps {
  journey: JourneyStep[];
  bottleId?: string; // Add bottleId prop for reply functionality
}

export default function EnhancedBottleJourney({ journey, bottleId }: EnhancedBottleJourneyProps) {
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set());

  const toggleStep = (index: number) => {
    const newExpanded = new Set(expandedSteps);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedSteps(newExpanded);
  };

  const formatOrdinal = (num: number) => {
    if (num === 1) return '1st';
    if (num === 2) return '2nd';
    if (num === 3) return '3rd';
    return `${num}th`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const getStepType = (stepNumber: number, tosserName: string) => {
    if (stepNumber === 1) {
      return tosserName?.includes('(Creator)') ? 'CREATE' : 'CREATE';
    } else {
      return 'RETOSS';
    }
  };

  const getStepIcon = (stepNumber: number, tosserName: string) => {
    // Remove all icons - return empty string
    return '';
  };

  const getStepColor = (stepNumber: number, tosserName: string) => {
    if (stepNumber === 1) {
      return tosserName?.includes('(Creator)') ? '#4CAF50' : '#4CAF50';
    } else {
      return '#2196F3';
    }
  };

  // Recursive function to render nested replies
  const renderReply = (reply: Reply, depth: number = 0, replyIndex: number, bottleId?: string) => {
    const maxDepth = 3; // Limit nesting depth to prevent UI issues
    
    return (
      <View key={reply.id} style={[styles.replyPill, { marginLeft: depth * 16 }]}>
        <View style={styles.replyHeader}>
          <View style={styles.replyHeaderLeft}>
            {/* Remove reply icon */}
            <View>
              <Text style={styles.replyTitle}>FIND</Text>
              <Text style={styles.replySubtitle}>Reply {replyIndex + 1}</Text>
            </View>
          </View>
          <View style={styles.replyHeaderRight}>
            <Text style={styles.finderName}>{reply.finder_name || 'Anonymous'}</Text>
            <Text style={styles.replyDate}>{formatDate(reply.created_at)}</Text>
          </View>
        </View>
        
        <View style={styles.replyContent}>
          <View style={styles.replyMessageSection}>
            <Text style={styles.replyMessage}>"{reply.message}"</Text>
            <Text style={styles.replyTimestamp}>
              {formatTime(reply.created_at)}
            </Text>
          </View>
          {reply.photo_url ? (
            <View style={styles.replyPhotoSection}>
              <Image 
                source={{ uri: reply.photo_url }} 
                style={styles.replyPhoto}
              />
            </View>
          ) : (
            <View style={styles.replyPhotoSection}>
              <View style={styles.noReplyPhoto}>
                <Text style={styles.noPhotoText}>💭</Text>
              </View>
            </View>
          )}
        </View>

        {/* Reply button for nested replies - only show if we haven't reached max depth */}
        {depth < maxDepth && (
          <View style={styles.replyActions}>
            <Pressable 
              style={styles.replyButton}
              onPress={() => handleReplyToReply(reply.id, bottleId)}
            >
              <Text style={styles.replyButtonText}>Reply</Text>
            </Pressable>
          </View>
        )}

        {/* Render nested replies if they exist and we haven't reached max depth */}
        {reply.replies && reply.replies.length > 0 && depth < maxDepth && (
          <View style={styles.nestedRepliesContainer}>
            {reply.replies.map((nestedReply, nestedIndex) => 
              renderReply(nestedReply, depth + 1, nestedIndex, bottleId)
            )}
          </View>
        )}
      </View>
    );
  };

  // Handler for replying to a reply (will navigate to reply interface)
  const handleReplyToReply = (parentReplyId: string, bottleId?: string) => {
    if (!bottleId) {
      alert('Error: Bottle ID not available for reply');
      return;
    }
    
    // Navigate to found.tsx with parent_reply_id to enable nested replies
    router.push({
      pathname: '/found',
      params: {
        bottleId: bottleId,
        bottlePassword: 'auto', // Will be retrieved from journey context
        parent_reply_id: parentReplyId
      }
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🍾 Bottle's Journey</Text>
      <Text style={styles.subtitle}>
        Follow this bottle's path around the world
      </Text>
      
      {journey.map((step, index) => {
        const isExpanded = expandedSteps.has(index);
        const hasReplies = step.replies && step.replies.length > 0;
        const stepType = getStepType(step.toss_number, step.tosser_name || '');
        const stepIcon = getStepIcon(step.toss_number, step.tosser_name || '');
        const stepColor = getStepColor(step.toss_number, step.tosser_name || '');
        
        return (
          <View key={index} style={styles.stepContainer}>
            {/* Main Toss Message */}
            <Pressable 
              style={[styles.pillBox, styles.mainPill, { borderColor: stepColor }]} 
              onPress={() => hasReplies && toggleStep(index)}
            >
              <View style={styles.pillHeader}>
                <View style={styles.headerLeft}>
                  {/* Remove icon display */}
                  <View>
                    <Text style={[styles.stepNumber, { color: stepColor }]}>{formatOrdinal(step.toss_number)}</Text>
                    <Text style={[styles.stepTitle, { color: stepColor }]}>{stepType}</Text>
                  </View>
                </View>
                <View style={styles.headerRight}>
                  <Text style={styles.tosserName}>{step.tosser_name || 'Anonymous'}</Text>
                  <Text style={styles.date}>{formatDate(step.created_at)}</Text>
                  {hasReplies && (
                    <Text style={styles.expandIcon}>
                      {isExpanded ? '▼' : '▶'} {step.replies?.length} replies
                    </Text>
                  )}
                </View>
              </View>
              
              <View style={styles.pillContent}>
                <View style={styles.messageSection}>
                  <Text style={styles.message}>"{step.message}"</Text>
                  <Text style={styles.timestamp}>
                    {formatTime(step.created_at)}
                  </Text>
                </View>
                {step.photo_url ? (
                  <View style={styles.photoSection}>
                    <Image 
                      source={{ uri: step.photo_url }} 
                      style={styles.photo}
                      onError={(error) => console.log('❌ Image error:', error.nativeEvent.error)}
                    />
                  </View>
                ) : (
                  <View style={styles.photoSection}>
                    <View style={styles.noPhoto}>
                      <Text style={styles.noPhotoText}>📝</Text>
                    </View>
                  </View>
                )}
              </View>
            </Pressable>

            {/* Nested Replies */}
            {hasReplies && isExpanded && (
              <View style={styles.repliesContainer}>
                {step.replies?.map((reply, replyIndex) => (
                  renderReply(reply, 0, replyIndex, bottleId)
                ))}
              </View>
            )}

            {/* Connection Line to Next Step */}
            {index < journey.length - 1 && (
              <View style={styles.connectionLine}>
                <View style={styles.journeyLine} />
                <Text style={styles.journeyText}>🌊 Continued journey...</Text>
                <View style={styles.journeyLine} />
              </View>
            )}
          </View>
        );
      })}
      
      <View style={styles.journeyFooter}>
        <Text style={styles.footerText}>
          {journey.length} {journey.length === 1 ? 'stop' : 'stops'} on this bottle's journey so far...
        </Text>
        <Text style={styles.footerLegend}>
          🆕 CREATE • 🔄 RETOSS • 🔍 FIND
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  stepContainer: {
    marginBottom: 16,
  },
  pillBox: {
    borderRadius: 16,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  mainPill: {
    backgroundColor: '#fff',
    borderWidth: 2,
  },
  pillHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  stepNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  stepTitle: {
    fontSize: 12,
    fontWeight: '600',
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  tosserName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  date: {
    fontSize: 11,
    color: '#999',
  },
  expandIcon: {
    fontSize: 11,
    color: '#2196F3',
    marginTop: 4,
    fontWeight: '500',
  },
  pillContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  messageSection: {
    flex: 1,
    paddingRight: 12,
  },
  message: {
    fontSize: 16,
    color: '#333',
    lineHeight: 22,
    marginBottom: 4,
    fontStyle: 'italic',
  },
  timestamp: {
    fontSize: 11,
    color: '#999',
  },
  photoSection: {
    width: 80,
    height: 80,
  },
  photo: {
    width: 80,
    height: 80,
    borderRadius: 12,
  },
  noPhoto: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  noPhotoText: {
    fontSize: 24,
  },
  repliesContainer: {
    marginLeft: 20,
    marginTop: 12,
  },
  replyPill: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#2196F3',
  },
  replyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  replyHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  replyIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  replyTitle: {
    fontSize: 10,
    fontWeight: '600',
    color: '#2196F3',
    marginBottom: 2,
  },
  replySubtitle: {
    fontSize: 9,
    color: '#2196F3',
    opacity: 0.7,
  },
  replyHeaderRight: {
    alignItems: 'flex-end',
  },
  finderName: {
    fontSize: 10,
    fontWeight: '600',
    color: '#666',
  },
  replyDate: {
    fontSize: 9,
    color: '#999',
  },
  replyContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  replyMessageSection: {
    flex: 1,
    paddingRight: 8,
  },
  replyMessage: {
    fontSize: 13,
    color: '#333',
    lineHeight: 18,
    marginBottom: 2,
    fontStyle: 'italic',
  },
  replyTimestamp: {
    fontSize: 9,
    color: '#999',
  },
  replyPhotoSection: {
    width: 50,
    height: 50,
  },
  replyPhoto: {
    width: 50,
    height: 50,
    borderRadius: 8,
  },
  noReplyPhoto: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  connectionLine: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 12,
    paddingHorizontal: 16,
  },
  journeyLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e0e0e0',
  },
  journeyText: {
    fontSize: 11,
    color: '#999',
    marginHorizontal: 12,
    fontStyle: 'italic',
  },
  journeyFooter: {
    alignItems: 'center',
    marginTop: 16,
    padding: 16,
    backgroundColor: '#f0f8ff',
    borderRadius: 12,
  },
  footerText: {
    fontSize: 12,
    color: '#1976d2',
    fontStyle: 'italic',
    marginBottom: 4,
  },
  footerLegend: {
    fontSize: 10,
    color: '#1976d2',
    opacity: 0.7,
  },
  nestedRepliesContainer: {
    marginTop: 8,
    marginLeft: 12,
    paddingLeft: 12,
    borderLeftWidth: 2,
    borderLeftColor: '#e0e0e0',
  },
  replyActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  replyButton: {
    padding: 8,
    backgroundColor: '#2196F3',
    borderRadius: 8,
  },
  replyButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
}); 