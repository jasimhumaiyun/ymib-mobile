import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, Alert } from 'react-native';
import { Camera, CameraView, useCameraPermissions } from 'expo-camera';
import { BarcodeScanningResult } from 'expo-camera';

interface QRScannerProps {
  onScan: (data: { id: string; password: string }) => void;
  onCancel: () => void;
  title: string;
}

export default function QRScanner({ onScan, onCancel, title }: QRScannerProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [showManualInput, setShowManualInput] = useState(true);
  const [manualId, setManualId] = useState('');
  const [manualPassword, setManualPassword] = useState('');
  const [isScanning, setIsScanning] = useState(true);

  // Reset scanning state when showing manual input
  useEffect(() => {
    if (showManualInput) {
      setIsScanning(false);
    } else {
      setIsScanning(true);
    }
  }, [showManualInput]);

  const handleBarCodeScanned = ({ data }: BarcodeScanningResult) => {
    if (!isScanning) return;
    
    setIsScanning(false);
    
    try {
      const parsed = JSON.parse(data);
      if (parsed.id && parsed.password) {
        onScan(parsed);
      } else {
        Alert.alert('Invalid QR Code', 'QR code must contain bottle ID and password');
        setIsScanning(true);
      }
    } catch (error) {
      Alert.alert('Invalid QR Code', 'QR code format is not valid');
      setIsScanning(true);
    }
  };

  const handleManualSubmit = () => {
    if (!manualId.trim() || !manualPassword.trim()) {
      Alert.alert('Missing Information', 'Please enter both ID and password');
      return;
    }
    
    onScan({
      id: manualId.trim(),
      password: manualPassword.trim()
    });
  };

  const handleDevMode = (testBottleNumber: number) => {
    // Simple test bottle data for development - using UUID format
    const testBottles = [
      { id: '00000000-0000-0000-0000-000000000001', password: 'pass123' },
      { id: '00000000-0000-0000-0000-000000000002', password: 'pass456' },
      { id: '00000000-0000-0000-0000-000000000003', password: 'pass789' },
    ];
    
    const testBottle = testBottles[testBottleNumber - 1];
    console.log('Dev mode clicked:', testBottleNumber, testBottle);
    if (testBottle) {
      onScan(testBottle);
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
      <View style={styles.container}>
        <View style={styles.permissionContainer}>
          <Text style={styles.title}>{title}</Text>
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
            <Text style={[styles.buttonText, styles.secondaryButtonText]}>
              Enter Manually
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  if (showManualInput) {
    return (
      <View style={styles.container}>
        <View style={styles.manualContainer}>
          <Text style={styles.title}>Enter Bottle Details</Text>
          
          <TextInput
            style={styles.input}
            placeholder="Bottle ID"
            value={manualId}
            onChangeText={setManualId}
            autoCapitalize="none"
          />
          
          <TextInput
            style={styles.input}
            placeholder="Password"
            value={manualPassword}
            onChangeText={setManualPassword}
            autoCapitalize="none"
          />
          
          <View style={styles.buttonRow}>
            <Pressable 
              style={[styles.button, styles.flexButton]} 
              onPress={handleManualSubmit}
            >
              <Text style={styles.buttonText}>Continue</Text>
            </Pressable>
            
            <Pressable 
              style={[styles.button, styles.secondaryButton, styles.flexButton]} 
              onPress={() => setShowManualInput(false)}
            >
              <Text style={[styles.buttonText, styles.secondaryButtonText]}>
                Use Camera
              </Text>
            </Pressable>
          </View>
          
          <View style={styles.devModeContainer}>
            <Text style={styles.devModeTitle}>🧪 Dev Mode (Test Bottles)</Text>
            <View style={styles.devButtonRow}>
              <Pressable 
                style={[styles.devButton]} 
                onPress={() => handleDevMode(1)}
              >
                <Text style={styles.devButtonText}>Test Bottle 1</Text>
              </Pressable>
              
              <Pressable 
                style={[styles.devButton]} 
                onPress={() => handleDevMode(2)}
              >
                <Text style={styles.devButtonText}>Test Bottle 2</Text>
              </Pressable>
              
              <Pressable 
                style={[styles.devButton]} 
                onPress={() => handleDevMode(3)}
              >
                <Text style={styles.devButtonText}>Test Bottle 3</Text>
              </Pressable>
            </View>
          </View>
          
          <Pressable style={styles.cancelButton} onPress={onCancel}>
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        onBarcodeScanned={isScanning ? handleBarCodeScanned : undefined}
        barcodeScannerSettings={{
          barcodeTypes: ['qr'],
        }}
      >
        <View style={styles.overlay}>
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.instruction}>
              Point your camera at the QR code on the bottle
            </Text>
          </View>
          
          <View style={styles.scanningArea}>
            <View style={styles.scanFrame} />
          </View>
          
          <View style={styles.footer}>
            <Pressable 
              style={[styles.button, styles.secondaryButton]} 
              onPress={() => setShowManualInput(true)}
            >
              <Text style={[styles.buttonText, styles.secondaryButtonText]}>
                Enter Manually
              </Text>
            </Pressable>
            
            <Pressable style={styles.cancelButton} onPress={onCancel}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 100,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  manualContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  header: {
    padding: 20,
    alignItems: 'center',
    paddingTop: 60,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  instruction: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    opacity: 0.9,
  },
  permissionText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  scanningArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanFrame: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: '#fff',
    borderRadius: 12,
    backgroundColor: 'transparent',
  },
  footer: {
    padding: 20,
    alignItems: 'center',
    paddingBottom: 40,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  button: {
    backgroundColor: '#2196F3',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#fff',
  },
  secondaryButtonText: {
    color: '#fff',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  flexButton: {
    flex: 1,
  },
  cancelButton: {
    padding: 12,
  },
  cancelText: {
    color: '#fff',
    fontSize: 16,
  },
  devModeContainer: {
    marginTop: 30,
    padding: 20,
    backgroundColor: '#f0f8ff',
    borderRadius: 12,
    alignItems: 'center',
  },
  devModeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2196F3',
    textAlign: 'center',
    marginBottom: 12,
  },
  devButtonRow: {
    flexDirection: 'row',
    gap: 8,
  },
  devButton: {
    backgroundColor: '#2196F3',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    flex: 1,
  },
  devButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
}); 