import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, Alert, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { Camera, CameraView, useCameraPermissions } from 'expo-camera';
import { BarcodeScanningResult } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { supabase } from '../lib/supabase';
import { Colors, Typography, Spacing } from '../constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';

interface SmartBottleScannerProps {
  onRouteToToss: (data: { id: string; password: string }) => void;
  onRouteToFound: (data: { id: string; password: string }) => void;
  onRouteToRetossDecision: (data: { id: string; password: string }) => void;
  onCancel: () => void;
}

export default function SmartBottleScanner({ onRouteToToss, onRouteToFound, onRouteToRetossDecision, onCancel }: SmartBottleScannerProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [showManualInput, setShowManualInput] = useState(true);
  const [manualId, setManualId] = useState('');
  const [manualPassword, setManualPassword] = useState('');
  const [isScanning, setIsScanning] = useState(true);
  const [isChecking, setIsChecking] = useState(false);

  // Reset scanning state when showing manual input
  useEffect(() => {
    if (showManualInput) {
      setIsScanning(false);
    } else {
      setIsScanning(true);
    }
  }, [showManualInput]);

  // Reset checking state when component mounts
  useEffect(() => {
    setIsChecking(false);
  }, []);

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  const checkBottleStatusAndRoute = async (bottleData: { id: string; password: string }) => {
    setIsChecking(true);
    
    try {

      
      // Check if bottle exists in database
      const { data: bottle, error } = await supabase
        .from('bottles')
        .select('id, status, password_hash')
        .eq('id', bottleData.id)
        .maybeSingle();

      if (error) {
        console.error('❌ Database error:', error);
        Alert.alert('Error', 'Failed to check bottle status. Please try again.');
        setIsChecking(false);
        return;
      }

      // Case 1: Bottle doesn't exist - NEW BOTTLE → Toss Flow
      if (!bottle) {
        setIsChecking(false);
        onRouteToToss(bottleData);
        return;
      }

      // Case 2: Bottle exists but wrong password
      if (bottle.password_hash !== bottleData.password) {
        Alert.alert('Invalid Password', 'The password you entered is incorrect.');
        setIsChecking(false);
        return;
      }

      // Case 3: Bottle exists with correct password
      if (bottle.status === 'adrift') {
        setIsChecking(false);
        onRouteToFound(bottleData);
      } else if (bottle.status === 'found') {
        setIsChecking(false);
        onRouteToRetossDecision(bottleData);
      } else {
        // This shouldn't happen, but handle gracefully
        setIsChecking(false);
        onRouteToFound(bottleData);
      }

    } catch (error) {
      console.error('❌ Unexpected error:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
      setIsChecking(false);
    }
  };

  const handleBarCodeScanned = ({ data }: BarcodeScanningResult) => {
    if (!isScanning || isChecking) return;
    
    setIsScanning(false);
    
    try {
      const parsed = JSON.parse(data);
      if (parsed.id && parsed.password) {
        checkBottleStatusAndRoute(parsed);
      } else {
        Alert.alert('Invalid QR Code', 'QR code must contain bottle ID and password', [
          {
            text: 'OK',
            onPress: () => {
              // Reset scanning after a delay to prevent immediate re-scanning
              setTimeout(() => setIsScanning(true), 2000);
            }
          }
        ]);
      }
    } catch (error) {
      Alert.alert('Invalid QR Code', 'QR code format is not valid', [
        {
          text: 'OK',
          onPress: () => {
            // Reset scanning after a delay to prevent immediate re-scanning
            setTimeout(() => setIsScanning(true), 2000);
          }
        }
      ]);
    }
  };

  const handleManualSubmit = () => {
    if (!manualId.trim() || !manualPassword.trim()) {
      Alert.alert('Missing Information', 'Please enter both ID and password');
      return;
    }
    
    checkBottleStatusAndRoute({
      id: manualId.trim(),
      password: manualPassword.trim()
    });
  };

  const handleDevMode = (testBottleNumber: number) => {
    if (isChecking) return; // Prevent multiple clicks
    
    // Simple test bottle data for development - using UUID format
    const testBottles = [
      { id: '00000000-0000-0000-0000-000000000001', password: 'pass123' },
      { id: '00000000-0000-0000-0000-000000000002', password: 'pass456' },
      { id: '00000000-0000-0000-0000-000000000003', password: 'pass789' },
    ];
    
    const testBottle = testBottles[testBottleNumber - 1];
    if (testBottle) {
      checkBottleStatusAndRoute(testBottle);
    }
  };

  if (!permission) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Requesting camera permission...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionText}>
            Camera permission is needed to scan QR codes
          </Text>
          <Pressable style={styles.button} onPress={requestPermission}>
            <Text style={styles.buttonText}>Grant Permission</Text>
          </Pressable>
          <Pressable 
            style={[styles.button, styles.secondaryButton]} 
            onPress={() => setShowManualInput(true)}
          >
            <Text style={styles.buttonText}>
              Enter Manually
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (showManualInput) {
    return (
      <TouchableWithoutFeedback onPress={dismissKeyboard}>
        <SafeAreaView style={styles.container} edges={['top']}>
          {/* Universal Back to Home Button */}
          <View style={styles.topBar}>
            <Pressable style={styles.backButton} onPress={onCancel}>
              <Text style={styles.backButtonText}>← Home</Text>
            </Pressable>
          </View>

          <View style={styles.manualContainer}>
            <Text style={styles.title}>Scan Bottle</Text>
            
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Bottle ID"
                placeholderTextColor="rgba(255, 255, 255, 0.6)"
                value={manualId}
                onChangeText={setManualId}
                autoCapitalize="none"
                editable={!isChecking}
              />
              
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="rgba(255, 255, 255, 0.6)"
                value={manualPassword}
                onChangeText={setManualPassword}
                autoCapitalize="none"
                editable={!isChecking}
              />
            </View>
            
            <View style={styles.buttonRow}>
              <Pressable 
                style={[styles.button, styles.flexButton, isChecking && styles.disabledButton]} 
                onPress={handleManualSubmit}
                disabled={isChecking}
              >
                <Text style={styles.buttonText}>
                  {isChecking ? 'Checking...' : 'Continue'}
                </Text>
              </Pressable>
              
              <Pressable 
                style={[styles.button, styles.secondaryButton, styles.flexButton]} 
                onPress={() => setShowManualInput(false)}
                disabled={isChecking}
              >
                <View style={styles.buttonContent}>
                  <Ionicons 
                    name="qr-code-outline" 
                    size={18} 
                    color={Colors.text.primary} 
                    style={styles.buttonIcon}
                  />
                  <Text style={styles.buttonText}>Scan QR</Text>
                </View>
              </Pressable>
            </View>
            
            <View style={styles.devModeContainer}>
              <Text style={styles.devModeTitle}>🧪 Dev Mode (Test Bottles)</Text>
              <Text style={styles.devModeSubtitle}>
                Test the smart routing: New bottles → Toss, Found bottles → Found
              </Text>
              <View style={styles.devButtonRow}>
                <Pressable 
                  style={[styles.devButton, isChecking && styles.disabledButton]} 
                  onPress={() => handleDevMode(1)}
                  disabled={isChecking}
                >
                  <Text style={styles.devButtonText}>Test Bottle 1</Text>
                </Pressable>
                
                <Pressable 
                  style={[styles.devButton, isChecking && styles.disabledButton]} 
                  onPress={() => handleDevMode(2)}
                  disabled={isChecking}
                >
                  <Text style={styles.devButtonText}>Test Bottle 2</Text>
                </Pressable>
                
                <Pressable 
                  style={[styles.devButton, isChecking && styles.disabledButton]} 
                  onPress={() => handleDevMode(3)}
                  disabled={isChecking}
                >
                  <Text style={styles.devButtonText}>Test Bottle 3</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </SafeAreaView>
      </TouchableWithoutFeedback>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        onBarcodeScanned={isScanning && !isChecking ? handleBarCodeScanned : undefined}
        barcodeScannerSettings={{
          barcodeTypes: ['qr'],
        }}
      >
        <SafeAreaView style={styles.overlay} edges={['top']}>
          {/* Universal Back to Home Button */}
          <View style={styles.topBar}>
            <Pressable style={styles.backButton} onPress={onCancel}>
              <Text style={styles.backButtonText}>← Home</Text>
            </Pressable>
          </View>

          <View style={styles.cameraHeader}>
            <Text style={styles.instruction}>
              Point your camera at the QR code on the bottle
            </Text>
            <View style={styles.smartDetectionBadge}>
              <Ionicons name="sparkles" size={16} color={Colors.accent.mustardSea} />
              <Text style={styles.smartText}>
                Smart Detection: Auto-routes new & found bottles
              </Text>
            </View>
          </View>
          
          <View style={styles.scanningArea}>
            <View style={styles.scanFrame} />
            {isChecking && (
              <View style={styles.checkingOverlay}>
                <Text style={styles.checkingText}>Checking bottle status...</Text>
              </View>
            )}
          </View>
          
          <View style={styles.footer}>
            <Pressable 
              style={styles.manualButton} 
              onPress={() => setShowManualInput(true)}
              disabled={isChecking}
            >
              <Text style={styles.manualButtonText}>Enter Manually</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary[500],
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 50,
  },
  header: {
    paddingVertical: Spacing.xl,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 40,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: Colors.primary[500],
  },
  manualContainer: {
    flex: 1,
    backgroundColor: Colors.primary[500],
    justifyContent: 'flex-start',
    paddingTop: 60,
  },
  title: {
    fontSize: Typography.sizes['3xl'],
    fontWeight: Typography.weights.bold,
    color: Colors.accent.mustardSea,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  permissionText: {
    fontSize: 16,
    color: Colors.neutral[100],
    textAlign: 'center',
    marginBottom: 30,
  },
  inputContainer: {
    marginBottom: 30,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  input: {
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 25,
    padding: 16,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    color: '#fff',
    width: '85%',
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  button: {
    backgroundColor: Colors.accent.mustardSea,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 4,
    minHeight: 48,
  },
  flexButton: {
    flex: 1,
  },
  buttonText: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.bold,
    color: Colors.text.primary,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonIcon: {
    marginRight: 6,
  },
  secondaryButton: {
    backgroundColor: Colors.accent.mustardSea,
  },
  disabledButton: {
    opacity: 0.5,
  },
  devModeContainer: {
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    marginBottom: 20,
    marginHorizontal: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  devModeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.accent.mustardSea,
    textAlign: 'center',
    marginBottom: 8,
  },
  devModeSubtitle: {
    fontSize: 12,
    color: Colors.neutral[200],
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 16,
  },
  devButtonRow: {
    flexDirection: 'row',
    gap: 8,
  },
  devButton: {
    flex: 1,
    backgroundColor: Colors.accent.mustardSea,
    padding: 10,
    borderRadius: 18,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  devButtonText: {
    color: Colors.text.primary,
    fontSize: 11,
    fontWeight: Typography.weights.bold,
  },
  cancelButton: {
    padding: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  cancelText: {
    color: Colors.neutral[300],
    fontSize: 16,
    fontWeight: Typography.weights.medium,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  cameraHeader: {
    paddingTop: 80,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginBottom: 40,
  },
  instruction: {
    fontSize: 18,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 16,
    fontWeight: '600',
  },
  smartDetectionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(1, 67, 72, 0.9)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.accent.mustardSea,
  },
  smartText: {
    fontSize: 13,
    color: '#fff',
    fontWeight: '600',
    marginLeft: 6,
  },
  scanningArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  scanFrame: {
    width: 250,
    height: 250,
    borderWidth: 3,
    borderColor: Colors.accent.mustardSea,
    borderRadius: 12,
    backgroundColor: 'transparent',
  },
  checkingOverlay: {
    position: 'absolute',
    backgroundColor: 'rgba(212, 175, 55, 0.9)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    marginTop: 20,
  },
  checkingText: {
    color: Colors.text.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  manualButton: {
    backgroundColor: 'rgba(212, 175, 55, 0.9)',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 25,
    minWidth: 140,
    alignItems: 'center',
  },
  manualButtonText: {
    color: Colors.text.primary,
    fontSize: 15,
    fontWeight: '600',
  },
  topBar: {
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  backButtonText: {
    color: Colors.neutral[300],
    fontSize: 14,
    fontWeight: Typography.weights.medium,
  },
}); 