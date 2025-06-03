import React from "react";
import { View, TextInput, Button, Image, StyleSheet, Alert } from "react-native";
import { useState } from "react";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import * as Haptics from "expo-haptics";
import { supabase } from "../src/lib/supabase";
import { router } from "expo-router";
import { Stack } from "expo-router";

export default function TossScreen() {
  const [msg, setMsg] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const choosePhoto = async () => {
    const r = await ImagePicker.launchImageLibraryAsync({ quality: 0.5 });
    if (!r.canceled) setPhoto(r.assets[0].uri);
  };

  const uploadPhoto = async (uri: string): Promise<string | null> => {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      
      const fileExt = uri.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `bottle-photos/${fileName}`;

      const { data, error } = await supabase.storage
        .from('bottles')
        .upload(filePath, blob);

      if (error) {
        console.error('Upload error:', error);
        return null;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('bottles')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Photo upload failed:', error);
      return null;
    }
  };

  const toss = async () => {
    setLoading(true);
    
    try {
      // Get location permission and position
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Required", "Location permission is needed to toss a bottle");
        setLoading(false);
        return;
      }
      
      const pos = await Location.getCurrentPositionAsync({});
      
      // Upload photo if one was selected
      let photoUrl = null;
      if (photo) {
        photoUrl = await uploadPhoto(photo);
        if (!photoUrl) {
          Alert.alert("Upload Failed", "Failed to upload photo. Try again.");
          setLoading(false);
          return;
        }
      }
      
      // Call edge function
      const { data, error } = await supabase.functions.invoke("toss_bottle", {
        body: {
          message: msg,
          photoUrl,
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
        },
      });
      
      if (error) {
        console.error('Edge function error:', error);
        Alert.alert("Error", `Failed to toss bottle: ${error.message}`);
        setLoading(false);
        return;
      }
      
      // Success!
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace({ pathname: "/toss/success", params: data as any });
      
    } catch (error) {
      console.error('Toss error:', error);
      Alert.alert("Error", "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: "Toss a Bottle" }} />
      <View style={styles.container}>
        <TextInput
          placeholder="Your message…"
          value={msg}
          onChangeText={setMsg}
          multiline
          style={styles.textInput}
        />
        {photo && <Image source={{ uri: photo }} style={styles.image} />}
        <Button title="Choose photo" onPress={choosePhoto} />
        <Button title={loading ? "Tossing…" : "Toss!"}
          onPress={toss} disabled={loading || !msg} />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 12,
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    minHeight: 120,
    padding: 8,
  },
  image: {
    width: "100%",
    height: 180,
  },
}); 