import React, { useState } from 'react';
import { View, Text, Button, TextInput, StyleSheet, Alert, Platform } from 'react-native';
import { Stack } from 'expo-router';
import * as Location from 'expo-location';
import { supabase } from '../src/lib/supabase';
import 'react-native-get-random-values'; // for UUID v4
import { v4 as uuidv4 } from 'uuid';

// Note: react-native-qrcode-scanner requires camera permissions and native setup
// For now, we'll use a simple input field for QR data and add proper QR scanning later

// DEV: Static bottle for testing lifecycle (adrift → found → adrift → ...)
const DEV_BOTTLE = {
  id: '550e8400-e29b-41d4-a716-446655440000', // Valid UUID for testing
  password: 'test123'
};

export default function ScanScreen() {
  const [qrData, setQrData] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePayload = async (payload: { id: string; password: string }) => {
    setLoading(true);
    setStatus('Getting location...');
    
    try {
      // Get location permission and position
      const { status: locationStatus } = await Location.requestForegroundPermissionsAsync();
      
      if (locationStatus !== 'granted') {
        Alert.alert('Permission Required', 'Location permission is needed to scan bottles');
        setLoading(false);
        return;
      }
      
      const { coords } = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      
      setStatus('Processing bottle...');
      
      // Call claim_or_toss_bottle function
      const { data, error } = await supabase.functions.invoke('claim_or_toss_bottle', {
        body: {
          ...payload,
          message: message || 'Hello from YMIB!',
          photoUrl: null,
          lat: coords.latitude,
          lon: coords.longitude,
        },
      });
      
      if (error) {
        setStatus(`❌ ${error.message || 'Unknown error'}`);
        setLoading(false);
        return;
      }
      
      // Handle different response statuses
      switch (data.status) {
        case 'new_cast_away':
          setStatus('✅ New bottle claimed and tossed! (Blue pin)');
          break;
        case 'found':
          setStatus('✅ Bottle found! (Green pin)');
          break;
        case 're_toss':
          setStatus('✅ Bottle re-tossed successfully! (Blue pin)');
          break;
        case 'already_adrift':
          setStatus('ℹ️ Bottle is already adrift');
          break;
        default:
          setStatus(`✅ ${data.status}`);
      }
      
      // Clear inputs on success
      setQrData('');
      setMessage('');
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      if (errorMessage.includes('Location')) {
        setStatus('❌ Location error - please enable location services');
      } else {
        setStatus('❌ Something went wrong');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleQrInput = () => {
    if (!qrData.trim()) {
      Alert.alert('Error', 'Please enter QR code data');
      return;
    }
    
    try {
      const payload = JSON.parse(qrData);
      if (!payload.id || !payload.password) {
        throw new Error('Invalid QR format');
      }
      handlePayload(payload);
    } catch (err) {
      setStatus('❌ Invalid QR code format');
    }
  };

  /** DEV: Test bottle lifecycle with same ID (adrift → found → adrift → ...) */
  const useDummy = async () => {
    try {
      await handlePayload(DEV_BOTTLE);
    } catch (error) {
      setStatus('❌ Test failed');
    }
  };

  /** DEV: Create new random bottle */
  const createNewBottle = async () => {
    try {
      const dummy = { 
        id: uuidv4(), 
        password: uuidv4().slice(0, 8)
      };
      await handlePayload(dummy);
    } catch (error) {
      setStatus('❌ Failed to create bottle');
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Scan Bottle' }} />
      <View style={styles.container}>
        <Text style={styles.title}>Scan or Enter Bottle QR Code</Text>
        
        <TextInput
          style={styles.input}
          placeholder='Enter QR code data (JSON format)'
          value={qrData}
          onChangeText={setQrData}
          multiline
        />
        
        <TextInput
          style={styles.input}
          placeholder='Your message (optional)'
          value={message}
          onChangeText={setMessage}
          multiline
        />
        
        <Button
          title={loading ? 'Processing...' : 'Process Bottle'}
          onPress={handleQrInput}
          disabled={loading || !qrData.trim()}
        />
        
        {__DEV__ && (
          <View style={styles.devSection}>
            <Text style={styles.devTitle}>Development Mode</Text>
            <Text style={styles.devHelp}>
              🔄 Test Lifecycle: Uses same ID (adrift → found → adrift)
              {'\n'}➕ New Bottle: Creates random ID (always new)
            </Text>
            <Button
              title="🔄 DEV: Test Bottle Lifecycle"
              onPress={useDummy}
              disabled={loading}
            />
            <Button
              title="➕ DEV: Create New Bottle"
              onPress={createNewBottle}
              disabled={loading}
            />
          </View>
        )}
        
        {status ? (
          <View style={styles.statusContainer}>
            <Text style={styles.statusText}>{status}</Text>
          </View>
        ) : null}
        
        <View style={styles.helpContainer}>
          <Text style={styles.helpText}>
            QR code should contain JSON like:{'\n'}
            {`{"id": "bottle-uuid", "password": "abc123"}`}
          </Text>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    gap: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    minHeight: 50,
  },
  devSection: {
    marginTop: 20,
    padding: 16,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    gap: 8,
  },
  devTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
  },
  devHelp: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  statusContainer: {
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginTop: 16,
  },
  statusText: {
    fontSize: 16,
    textAlign: 'center',
  },
  helpContainer: {
    marginTop: 20,
    padding: 12,
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
  },
  helpText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
}); 