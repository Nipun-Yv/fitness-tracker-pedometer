import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface HealthMetrics {
  height: number;
  weight: number;
  dailyGoal: number;
  age: number;
}

interface DailySteps {
  date: string;
  steps: number;
  lastUpdated: string;
}

interface DailyCalories {
  date: string;
  calories: number;
  lastUpdated: string;
}
const clearAllAsyncStorage = async () => {
  try {
    await AsyncStorage.clear();
    Alert.alert('Success', 'All AsyncStorage data cleared!');
  } catch (error) {
    Alert.alert('Error', 'Failed to clear storage');
  }
};
export default function SimpleHealthDashboard() {
  // State variables
  const [steps, setSteps] = useState(0);
  const [calories, setCalories] = useState(0); // Add calories state
  const [isTracking, setIsTracking] = useState(false);
  const [healthMetrics, setHealthMetrics] = useState<HealthMetrics>({
    height: 170,
    weight: 70,
    dailyGoal: 10000,
    age: 25,
  });
  const [showMetricsModal, setShowMetricsModal] = useState(false);
  const [tempMetrics, setTempMetrics] = useState({
    height: '170',
    weight: '70',
    dailyGoal: '10000',
    age: '25',
  });

  // Refs for interval management
  const stepInterval = useRef<NodeJS.Timeout | null>(null);
  const stepsRef = useRef(0);
  const caloriesRef = useRef(0); // Add calories ref

  // Update refs whenever state changes
  useEffect(() => {
    stepsRef.current = steps;
  }, [steps]);

  useEffect(() => {
    caloriesRef.current = calories;
  }, [calories]);

  // Load data on component mount
  useEffect(() => {
    clearAllAsyncStorage()
    loadHealthMetrics();
    loadTodaysSteps();
    loadTodaysCalories(); // Load calories
    loadTrackingState();
  }, []);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (stepInterval.current) {
        clearInterval(stepInterval.current);
        stepInterval.current = null;
      }
    };
  }, []);

  // Save steps function
  const saveSteps = useCallback(async (stepCount: number) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const stepData: DailySteps = {
        date: today,
        steps: stepCount,
        lastUpdated: new Date().toISOString(),
      };
      await AsyncStorage.setItem(`steps_${today}`, JSON.stringify(stepData));
      console.log(`Steps saved: ${stepCount}`);
    } catch (error) {
      console.error('Error saving steps:', error);
    }
  }, []);

  // Save calories function
  const saveCalories = useCallback(async (calorieCount: number) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const calorieData: DailyCalories = {
        date: today,
        calories: calorieCount,
        lastUpdated: new Date().toISOString(),
      };
      await AsyncStorage.setItem(`calories_${today}`, JSON.stringify(calorieData));
      console.log(`Calories saved: ${calorieCount}`);
    } catch (error) {
      console.error('Error saving calories:', error);
    }
  }, []);

  // Load health metrics from AsyncStorage
  const loadHealthMetrics = async () => {
    try {
      const saved = await AsyncStorage.getItem('healthMetrics');
      if (saved) {
        const metrics = JSON.parse(saved);
        setHealthMetrics(metrics);
        setTempMetrics({
          height: metrics.height.toString(),
          weight: metrics.weight.toString(),
          dailyGoal: metrics.dailyGoal.toString(),
          age: metrics.age.toString(),
        });
      }
    } catch (error) {
      console.error('Error loading health metrics:', error);
    }
  };

  // Load today's steps from AsyncStorage
  const loadTodaysSteps = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const saved = await AsyncStorage.getItem(`steps_${today}`);
      if (saved) {
        const stepData: DailySteps = JSON.parse(saved);
        setSteps(stepData.steps);
        stepsRef.current = stepData.steps;
        console.log(`Steps loaded: ${stepData.steps}`);
      }
    } catch (error) {
      console.error('Error loading steps:', error);
    }
  };

  // Load today's calories from AsyncStorage
  const loadTodaysCalories = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const saved = await AsyncStorage.getItem(`calories_${today}`);
      if (saved) {
        const calorieData: DailyCalories = JSON.parse(saved);
        setCalories(calorieData.calories);
        caloriesRef.current = calorieData.calories;
        console.log(`Calories loaded: ${calorieData.calories}`);
      } else {
        // If no calories stored, initialize with 0
        setCalories(0);
        caloriesRef.current = 0;
      }
    } catch (error) {
      console.error('Error loading calories:', error);
    }
  };

  // Load tracking state
  const loadTrackingState = async () => {
    try {
      const saved = await AsyncStorage.getItem('isTracking');
      if (saved === 'true') {
        console.log('Auto-starting tracking...');
        startStepTracking();
      }
    } catch (error) {
      console.error('Error loading tracking state:', error);
    }
  };

  // Save tracking state
  const saveTrackingState = async (tracking: boolean) => {
    try {
      await AsyncStorage.setItem('isTracking', tracking.toString());
      console.log(`Tracking state saved: ${tracking}`);
    } catch (error) {
      console.error('Error saving tracking state:', error);
    }
  };

  // Calculate calories for steps (using health metrics)
  const calculateCaloriesForSteps = (stepCount: number): number => {
    // Formula: steps * weight * 0.0005 (calories per step per kg of body weight)
    return Math.round(stepCount * healthMetrics.weight * 0.0005);
  };

  // Start step tracking
  const startStepTracking = () => {
    if (stepInterval.current) {
      clearInterval(stepInterval.current);
      stepInterval.current = null;
    }
    
    setIsTracking(true);
    saveTrackingState(true);
    
    console.log('Starting step tracking...');
    
    stepInterval.current = setInterval(() => {
      console.log('Interval tick - current steps:', stepsRef.current);
      
      // Increment steps
      const newSteps = stepsRef.current + 1;
      stepsRef.current = newSteps;
      setSteps(newSteps);
      
      // Calculate and update calories
      const newCalories = calculateCaloriesForSteps(newSteps);
      caloriesRef.current = newCalories;
      setCalories(newCalories);
      
      // Save both to storage
      saveSteps(newSteps);
      saveCalories(newCalories);
      
      console.log('Steps incremented to:', newSteps, 'Calories:', newCalories);
    }, 1000);
    
    console.log('Interval created with ID:', stepInterval.current);
  };

  // Stop step tracking
  const stopStepTracking = () => {
    console.log('Stopping step tracking...');
    
    setIsTracking(false);
    saveTrackingState(false);
    
    if (stepInterval.current) {
      clearInterval(stepInterval.current);
      stepInterval.current = null;
      console.log('Interval cleared');
    }
  };

  // Toggle step tracking
  const handleStepTracking = () => {
    console.log('Toggle tracking - current state:', isTracking);
    
    if (isTracking) {
      stopStepTracking();
    } else {
      startStepTracking();
    }
  };

  // Manually add steps (for testing)
  const addManualSteps = (amount: number) => {
    console.log(`Adding ${amount} manual steps`);
    
    const newSteps = stepsRef.current + amount;
    const newCalories = calculateCaloriesForSteps(newSteps);
    
    stepsRef.current = newSteps;
    caloriesRef.current = newCalories;
    
    setSteps(newSteps);
    setCalories(newCalories);
    
    saveSteps(newSteps);
    saveCalories(newCalories);
    
    console.log('Manual steps added, total:', newSteps, 'Calories:', newCalories);
  };

  // Reset today's steps and calories
  const resetSteps = () => {
    Alert.alert(
      'Reset Steps',
      'Are you sure you want to reset today\'s step count and calories?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            console.log('Resetting steps and calories');
            stepsRef.current = 0;
            caloriesRef.current = 0;
            setSteps(0);
            setCalories(0);
            saveSteps(0);
            saveCalories(0);
          },
        },
      ]
    );
  };

  // Update health metrics and recalculate calories
  const handleUpdateMetrics = async () => {
    try {
      const newMetrics: HealthMetrics = {
        height: parseFloat(tempMetrics.height),
        weight: parseFloat(tempMetrics.weight),
        dailyGoal: parseInt(tempMetrics.dailyGoal),
        age: parseInt(tempMetrics.age),
      };

      if (Object.values(newMetrics).some(val => isNaN(val) || val <= 0)) {
        Alert.alert('Error', 'Please enter valid positive numbers');
        return;
      }

      setHealthMetrics(newMetrics);
      await AsyncStorage.setItem('healthMetrics', JSON.stringify(newMetrics));
      
      // Recalculate and save calories with new weight
      const recalculatedCalories = calculateCaloriesForSteps(stepsRef.current);
      caloriesRef.current = recalculatedCalories;
      setCalories(recalculatedCalories);
      saveCalories(recalculatedCalories);
      
      setShowMetricsModal(false);
      Alert.alert('Success', 'Health metrics updated and calories recalculated!');
    } catch (error) {
      Alert.alert('Error', 'Failed to update health metrics');
    }
  };

  // Calculate derived metrics (using stored calories instead of calculating)
  const progressPercentage = Math.min((steps / healthMetrics.dailyGoal) * 100, 100);
  const bmi = healthMetrics.weight / Math.pow(healthMetrics.height / 100, 2);
  const estimatedDistance = (steps * 0.0008).toFixed(2);
  const activeMinutes = Math.round(steps / 100);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Health Tracker</Text>
      
      {/* Debug Info Card */}
      <View style={[styles.card, { backgroundColor: '#f0f0f0' }]}>
        <Text style={styles.debugTitle}>Debug Info:</Text>
        <Text style={styles.debugText}>Current Steps: {steps}</Text>
        <Text style={styles.debugText}>Current Calories: {calories}</Text>
        <Text style={styles.debugText}>Is Tracking: {isTracking ? 'YES' : 'NO'}</Text>
        <Text style={styles.debugText}>Interval Active: {stepInterval.current ? 'YES' : 'NO'}</Text>
        <Text style={styles.debugText}>Steps Ref: {stepsRef.current}</Text>
        <Text style={styles.debugText}>Calories Ref: {caloriesRef.current}</Text>
      </View>
      
      {/* Step Counter Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <MaterialIcons name="directions-walk" size={24} color="#007AFF" />
          <Text style={styles.cardTitle}>Steps Today</Text>
          <View style={styles.headerButtons}>
            <TouchableOpacity onPress={resetSteps} style={styles.iconButton}>
              <MaterialIcons name="refresh" size={20} color="#FF3B30" />
            </TouchableOpacity>
          </View>
        </View>
        
        <Text style={styles.stepCount}>{steps.toLocaleString()}</Text>
        
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progressPercentage}%` }]} />
        </View>
        
        <Text style={styles.goalText}>
          Goal: {healthMetrics.dailyGoal.toLocaleString()} ({Math.round(progressPercentage)}%)
        </Text>
        
        <View style={styles.buttonRow}>
          <TouchableOpacity 
            style={[styles.button, isTracking ? styles.stopButton : styles.startButton]}
            onPress={handleStepTracking}
          >
            <Text style={styles.buttonText}>
              {isTracking ? 'Stop Tracking' : 'Start Tracking'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Manual step controls for testing */}
        <View style={styles.manualControls}>
          <Text style={styles.manualTitle}>Manual Testing:</Text>
          <View style={styles.manualButtons}>
            <TouchableOpacity 
              style={styles.manualButton}
              onPress={() => addManualSteps(10)}
            >
              <Text style={styles.manualButtonText}>+10</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.manualButton}
              onPress={() => addManualSteps(100)}
            >
              <Text style={styles.manualButtonText}>+100</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.manualButton}
              onPress={() => addManualSteps(100000)}
            >
              <Text style={styles.manualButtonText}>+100000</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Stats Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <MaterialIcons name="analytics" size={24} color="#007AFF" />
          <Text style={styles.cardTitle}>Today's Stats</Text>
        </View>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Distance</Text>
            <Text style={styles.statValue}>{estimatedDistance} km</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Calories</Text>
            <Text style={styles.statValue}>{calories}</Text> {/* Using stored calories */}
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Active Time</Text>
            <Text style={styles.statValue}>{activeMinutes} min</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Status</Text>
            <Text style={[styles.statValue, { color: isTracking ? '#34C759' : '#FF3B30' }]}>
              {isTracking ? 'Tracking' : 'Stopped'}
            </Text>
          </View>
        </View>
      </View>

      {/* Health Metrics Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <MaterialIcons name="health-and-safety" size={24} color="#007AFF" />
          <Text style={styles.cardTitle}>Health Metrics</Text>
          <TouchableOpacity onPress={() => setShowMetricsModal(true)}>
            <MaterialIcons name="edit" size={20} color="#007AFF" />
          </TouchableOpacity>
        </View>
        <View style={styles.metricsGrid}>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Height</Text>
            <Text style={styles.metricValue}>{healthMetrics.height} cm</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Weight</Text>
            <Text style={styles.metricValue}>{healthMetrics.weight} kg</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Age</Text>
            <Text style={styles.metricValue}>{healthMetrics.age} years</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>BMI</Text>
            <Text style={styles.metricValue}>{bmi.toFixed(1)}</Text>
          </View>
        </View>
      </View>

      {/* Update Metrics Modal */}
      <Modal visible={showMetricsModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Update Health Metrics</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Height (cm)"
              value={tempMetrics.height}
              onChangeText={(text) => setTempMetrics({...tempMetrics, height: text})}
              keyboardType="numeric"
            />
            
            <TextInput
              style={styles.input}
              placeholder="Weight (kg)"
              value={tempMetrics.weight}
              onChangeText={(text) => setTempMetrics({...tempMetrics, weight: text})}
              keyboardType="numeric"
            />
            
            <TextInput
              style={styles.input}
              placeholder="Age (years)"
              value={tempMetrics.age}
              onChangeText={(text) => setTempMetrics({...tempMetrics, age: text})}
              keyboardType="numeric"
            />
            
            <TextInput
              style={styles.input}
              placeholder="Daily Step Goal"
              value={tempMetrics.dailyGoal}
              onChangeText={(text) => setTempMetrics({...tempMetrics, dailyGoal: text})}
              keyboardType="numeric"
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.button, styles.cancelButton]}
                onPress={() => setShowMetricsModal(false)}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.button, styles.saveButton]}
                onPress={handleUpdateMetrics}
              >
                <Text style={styles.buttonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

// Styles remain the same as your original code
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
    textAlign: 'center',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  debugTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 8,
  },
  debugText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 10,
    flex: 1,
    color: '#333',
  },
  headerButtons: {
    flexDirection: 'row',
  },
  iconButton: {
    padding: 5,
  },
  stepCount: {
    fontSize: 42,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#007AFF',
    marginBottom: 15,
  },
  progressBar: {
    height: 10,
    backgroundColor: '#E0E0E0',
    borderRadius: 5,
    marginBottom: 10,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 5,
  },
  goalText: {
    textAlign: 'center',
    color: '#666',
    marginBottom: 15,
    fontSize: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 15,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
    minWidth: 120,
  },
  startButton: {
    backgroundColor: '#34C759',
  },
  stopButton: {
    backgroundColor: '#FF3B30',
  },
  saveButton: {
    backgroundColor: '#007AFF',
  },
  cancelButton: {
    backgroundColor: '#666',
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  manualControls: {
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingTop: 15,
    marginTop: 10,
  },
  manualTitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
    textAlign: 'center',
  },
  manualButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  manualButton: {
    backgroundColor: '#F0F0F0',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 6,
  },
  manualButtonText: {
    color: '#007AFF',
    fontWeight: '600',
    fontSize: 14,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '48%',
    marginBottom: 15,
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
    textAlign: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
    textAlign: 'center',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  metricItem: {
    width: '48%',
    marginBottom: 15,
  },
  metricLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
