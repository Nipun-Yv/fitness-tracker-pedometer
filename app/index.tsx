import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';


export default function HomeScreen() {
  // const { initializeHealthData } = useHealth();

  // useEffect(() => {
  //   initializeHealthData();
  // }, []);

  const navigateToDashboard = () => {
    router.push('/(tabs)/dashboard');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Health Tracker</Text>
      <Text style={styles.subtitle}>Track your fitness journey</Text>
      <TouchableOpacity style={styles.button} onPress={navigateToDashboard}>
        <Text style={styles.buttonText}>Get Started</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    marginBottom: 40,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
});
