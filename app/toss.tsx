import React from "react";
import { View, TextInput, Button, Image, StyleSheet } from "react-native";
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

  const toss = async () => {
    setLoading(true);
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") return alert("Need location permission");
    const pos = await Location.getCurrentPositionAsync({});
    const { data, error } = await supabase.functions.invoke("toss_bottle", {
      body: {
        message: msg,
        photoUrl: photo,
        lat: pos.coords.latitude,
        lon: pos.coords.longitude,
      },
    });
    setLoading(false);
    if (error) return alert(error.message);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.replace({ pathname: "/toss/success", params: data as any });
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