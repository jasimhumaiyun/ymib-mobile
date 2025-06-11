import React, { useState, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  Pressable, 
  Alert, 
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useUserProfiles } from '../src/hooks/useUserProfiles';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../src/constants/theme';

export default function OnboardingScreen() {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUpAnonymously, signUpWithUsername } = useUserProfiles();
  const inputRef = useRef<TextInput>(null);

  const handleContinueAnonymously = async () => {
    setLoading(true);
    try {
      const result = await signUpAnonymously();
      if (result.success) {
        router.replace('/(tabs)');
      } else {
        Alert.alert('Error', result.error || 'Failed to create anonymous account');
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleContinueWithUsername = async () => {
    if (!username.trim()) {
      Alert.alert('Error', 'Please enter a username');
      return;
    }

    if (username.trim().length < 2) {
      Alert.alert('Error', 'Username must be at least 2 characters long');
      return;
    }

    setLoading(true);
    try {
      const result = await signUpWithUsername(username);
      if (result.success) {
        router.replace('/(tabs)');
      } else {
        Alert.alert('Error', result.error || 'Failed to create account');
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.background}>
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView 
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.content}>
              {/* Header */}
              <View style={styles.header}>
                <Text style={styles.title}>Your Message in a Bottle</Text>
                <Text style={styles.subtitle}>
                  Cast your thoughts into the digital ocean and discover messages from around the world
                </Text>
              </View>

              {/* Username Input */}
              <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>Choose Your Captain's Name</Text>
                <TextInput
                  ref={inputRef}
                  style={styles.input}
                  value={username}
                  onChangeText={setUsername}
                  placeholder="Enter your username..."
                  placeholderTextColor={Colors.neutral[400]}
                  autoCapitalize="none"
                  autoCorrect={false}
                  maxLength={20}
                  editable={!loading}
                />
                <Text style={styles.inputHint}>
                  This will be your identity across the seas
                </Text>
              </View>

              {/* Action Buttons */}
              <View style={styles.buttonSection}>
                <Pressable
                  style={[styles.primaryButton, loading && styles.disabledButton]}
                  onPress={handleContinueWithUsername}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={styles.primaryButtonText}>Set Sail with Username</Text>
                  )}
                </Pressable>

                <View style={styles.divider}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>or</Text>
                  <View style={styles.dividerLine} />
                </View>

                <Pressable
                  style={[styles.secondaryButton, loading && styles.disabledButton]}
                  onPress={handleContinueAnonymously}
                  disabled={loading}
                >
                  <Text style={styles.secondaryButtonText}>Sail Anonymously</Text>
                </Pressable>
              </View>

              {/* Footer */}
              <View style={styles.footer}>
                <Text style={styles.footerText}>
                  Your messages will drift across the digital ocean, waiting to be discovered by fellow travelers
                </Text>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: Colors.primary[600],
  },
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    maxWidth: 400,
    alignSelf: 'center',
    width: '100%',
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xl * 2,
  },
  title: {
    fontSize: Typography.sizes['3xl'],
    fontWeight: Typography.weights.bold,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: Spacing.md,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: Typography.sizes.lg,
    color: Colors.neutral[100],
    textAlign: 'center',
    lineHeight: 24,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  inputSection: {
    marginBottom: Spacing.xl,
  },
  inputLabel: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.medium,
    color: '#FFFFFF',
    marginBottom: Spacing.sm,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    fontSize: Typography.sizes.md,
    color: Colors.neutral[900],
    marginBottom: Spacing.xs,
    ...Shadows.sm,
  },
  inputHint: {
    fontSize: Typography.sizes.sm,
    color: Colors.neutral[200],
    textAlign: 'center',
    fontStyle: 'italic',
  },
  buttonSection: {
    marginBottom: Spacing.xl,
  },
  primaryButton: {
    backgroundColor: Colors.primary[600],
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    marginBottom: Spacing.lg,
    ...Shadows.md,
  },
  primaryButtonText: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
    color: '#FFFFFF',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  dividerText: {
    fontSize: Typography.sizes.sm,
    color: Colors.neutral[200],
    marginHorizontal: Spacing.md,
  },
  secondaryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    padding: Spacing.md,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.medium,
    color: '#FFFFFF',
  },
  disabledButton: {
    opacity: 0.6,
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: Typography.sizes.sm,
    color: Colors.neutral[300],
    textAlign: 'center',
    lineHeight: 20,
    fontStyle: 'italic',
  },
}); 