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
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bottle Journey</Text>
      {journey.map((step, index) => {
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
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#D4AF37', // Mustard yellow
    textAlign: 'center',
    marginBottom: 16,
  },
  pillBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  pillHeader: {
    fontSize: 16,
    fontWeight: '600',
    color: '#D4AF37', // Mustard yellow
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
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 20,
    marginBottom: 4,
    fontStyle: 'italic',
  },
  date: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  photoSection: {
    width: 80,
    height: 80,
  },
  photo: {
    width: 80,
    height: 80,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
}); 