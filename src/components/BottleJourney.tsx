import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';

interface JourneyStep {
  toss_number: number;
  message: string;
  photo_url?: string;
  created_at: string;
}

interface BottleJourneyProps {
  journey: JourneyStep[];
}

export default function BottleJourney({ journey }: BottleJourneyProps) {
  console.log('🍾 BottleJourney received:', journey);
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>🍾 Bottle Journey</Text>
      {journey.map((step, index) => {
        console.log(`📸 Step ${index + 1} photo_url:`, step.photo_url);
        return (
          <View key={index} style={styles.pillBox}>
            <Text style={styles.pillHeader}>
              {index === 0 ? '1st Toss' : `${index + 1}${index === 1 ? 'nd' : index === 2 ? 'rd' : 'th'} Toss`}
            </Text>
            <View style={styles.pillContent}>
              <View style={styles.messageSection}>
                <Text style={styles.message}>"{step.message}"</Text>
                <Text style={styles.date}>
                  {new Date(step.created_at).toLocaleDateString()}
                </Text>
              </View>
              {step.photo_url ? (
                <View style={styles.photoSection}>
                  <Image 
                    source={{ uri: step.photo_url }} 
                    style={styles.photo}
                    onLoad={() => console.log('✅ Image loaded:', step.photo_url)}
                    onError={(error) => console.log('❌ Image error:', error.nativeEvent.error, step.photo_url)}
                  />
                </View>
              ) : (
                <View style={styles.photoSection}>
                  <Text style={{ fontSize: 12, color: '#999' }}>No photo</Text>
                </View>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4CAF50',
    textAlign: 'center',
    marginBottom: 16,
  },
  pillBox: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  pillHeader: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4CAF50',
    marginBottom: 8,
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
    fontSize: 15,
    color: '#333',
    lineHeight: 20,
    marginBottom: 4,
    fontStyle: 'italic',
  },
  date: {
    fontSize: 12,
    color: '#666',
  },
  photoSection: {
    width: 80,
    height: 80,
  },
  photo: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
}); 