import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image } from "react-native";

export default function Intro({ navigation }) {
  const handleGetStarted = () => {
    navigation.replace("Home"); // Navigate to Home.js
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to Noter!</Text>

      {/* Add your image here */}
      <Image
        source={require("../assets/image3.png")} // 👈 replace with your actual image file
        style={styles.image}
      />

      <Text style={styles.description}>
        Your quick and secure cloud-based note-taking companion. Add, organize,
        and access your notes anytime, anywhere!
      </Text>

      <TouchableOpacity style={styles.button} onPress={handleGetStarted}>
        <Text style={styles.buttonText}>Get Started</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fef3d4ff",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: "#333",
    textAlign: "center",
    marginBottom: 20,
  },
  image: {
    width: 220,
    height: 220,
    resizeMode: "contain",
    marginBottom: 20,
  },
  description: {
    fontSize: 18,
    color: "#666",
    textAlign: "center",
    lineHeight: 26,
    marginBottom: 40,
  },
  button: {
    backgroundColor: "#FF6F3C",
    paddingVertical: 14,
    paddingHorizontal: 60,
    borderRadius: 12,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
});
