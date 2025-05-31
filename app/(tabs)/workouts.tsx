import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  ScrollView,
  Dimensions,
  StatusBar,
  Animated,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width: screenWidth } = Dimensions.get('window');

interface Workout {
  id: string;
  name: string;
  duration: number;
  calories: number;
  type: string;
  date: string;
  actualDuration?: number;
}

// Shared Daily Calories interface - SAME as step counter
interface DailyCalories {
  date: string;
  calories: number;
  lastUpdated: string;
}

const CALORIES_PER_HOUR = {
  'Cardio': 500,
  'Strength': 400,
  'HIIT': 600,
  'Yoga': 200,
  'Running': 550,
  'Cycling': 450,
  'Swimming': 500,
  'Walking': 250,
  'Other': 350,
};

const WORKOUT_CATEGORIES = Object.keys(CALORIES_PER_HOUR);

// Professional Samsung Health-style Header
const ProfessionalHeader = ({ totalCalories }: { totalCalories: number }) => (
  <View style={styles.headerContainer}>
    <View style={styles.headerContent}>
      <View style={styles.headerTop}>
        <Text style={styles.headerTitle}>Workouts</Text>
        <View style={styles.headerStats}>
          <Text style={styles.todayLabel}>Today</Text>
          <Text style={styles.calorieCount}>{totalCalories}</Text>
          <Text style={styles.calorieUnit}>kcal</Text>
        </View>
      </View>
      <Text style={styles.headerSubtitle}>Track your fitness progress</Text>
    </View>
    <View style={styles.headerDivider} />
  </View>
);

// Interactive Button Component with Samsung Health styling
const HealthButton = ({ onPress, children, variant = 'primary', style = {}, disabled = false }) => {
  const scaleValue = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (!disabled) {
      Animated.spring(scaleValue, {
        toValue: 0.98,
        useNativeDriver: true,
      }).start();
    }
  };

  const handlePressOut = () => {
    if (!disabled) {
      Animated.spring(scaleValue, {
        toValue: 1,
        useNativeDriver: true,
      }).start();
    }
  };

  const getButtonStyle = () => {
    switch (variant) {
      case 'primary':
        return styles.primaryButton;
      case 'secondary':
        return styles.secondaryButton;
      case 'timer':
        return styles.timerButton;
      default:
        return styles.primaryButton;
    }
  };

  return (
    <Animated.View style={[{ transform: [{ scale: scaleValue }] }, style]}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        activeOpacity={0.9}
        style={getButtonStyle()}
      >
        {children}
      </TouchableOpacity>
    </Animated.View>
  );
};

export default function WorkoutsScreen() {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showTimerModal, setShowTimerModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [totalCalories, setTotalCalories] = useState(0);
  const [newWorkout, setNewWorkout] = useState({
    name: '',
    duration: '',
    calories: '',
    type: '',
  });

  // Timer states
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [workoutName, setWorkoutName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const startTimeRef = useRef<number | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const pausedTimeRef = useRef<number>(0);

  useEffect(() => {
    loadWorkouts();
    loadSharedCalories();
  }, []);

  // Focus listener to reload calories when screen is accessed
  useEffect(() => {
    const interval = setInterval(() => {
      loadSharedCalories();
    }, 2000); // Refresh calories every 2 seconds to stay in sync

    return () => clearInterval(interval);
  }, []);

  // Timer effect
  useEffect(() => {
    if (isRunning && !isPaused) {
      intervalRef.current = setInterval(() => {
        if (startTimeRef.current) {
          const now = Date.now();
          const elapsed = Math.floor((now - startTimeRef.current - pausedTimeRef.current) / 1000);
          setElapsedTime(elapsed);
        }
      }, 100);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, isPaused]);

  // Load SHARED calories from AsyncStorage - SAME as step counter
  const loadSharedCalories = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const saved = await AsyncStorage.getItem(`calories_${today}`);
      if (saved) {
        const calorieData: DailyCalories = JSON.parse(saved);
        setTotalCalories(calorieData.calories);
        console.log(`[WorkoutsScreen] Shared calories loaded: ${calorieData.calories}`);
      } else {
        setTotalCalories(0);
        console.log(`[WorkoutsScreen] No calories found for today, setting to 0`);
      }
    } catch (error) {
      console.error('[WorkoutsScreen] Failed to load shared calories:', error);
      setTotalCalories(0);
    }
  };

  // Save SHARED calories to AsyncStorage - SAME as step counter
  const saveSharedCalories = async (calorieCount: number) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const calorieData: DailyCalories = {
        date: today,
        calories: calorieCount,
        lastUpdated: new Date().toISOString(),
      };
      await AsyncStorage.setItem(`calories_${today}`, JSON.stringify(calorieData));
      setTotalCalories(calorieCount);
      console.log(`[WorkoutsScreen] Shared calories saved: ${calorieCount}`);
    } catch (error) {
      console.error('[WorkoutsScreen] Error saving shared calories:', error);
    }
  };

  // Add workout calories to the SHARED calorie variable
  const addWorkoutCaloriesToShared = async (workoutCalories: number) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const saved = await AsyncStorage.getItem(`calories_${today}`);
      
      let currentCalories = 0;
      if (saved) {
        const calorieData: DailyCalories = JSON.parse(saved);
        currentCalories = calorieData.calories;
      }
      
      const newTotal = currentCalories + workoutCalories;
      await saveSharedCalories(newTotal);
      
      console.log(`[WorkoutsScreen] Added ${workoutCalories} workout calories. New shared total: ${newTotal}`);
      return newTotal;
    } catch (error) {
      console.error('[WorkoutsScreen] Error adding workout calories to shared total:', error);
      return currentCalories;
    }
  };

  // Subtract workout calories from the SHARED calorie variable
  const subtractWorkoutCaloriesFromShared = async (workoutCalories: number) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const saved = await AsyncStorage.getItem(`calories_${today}`);
      
      let currentCalories = 0;
      if (saved) {
        const calorieData: DailyCalories = JSON.parse(saved);
        currentCalories = calorieData.calories;
      }
      
      const newTotal = Math.max(0, currentCalories - workoutCalories); // Don't go below 0
      await saveSharedCalories(newTotal);
      
      console.log(`[WorkoutsScreen] Subtracted ${workoutCalories} workout calories. New shared total: ${newTotal}`);
      return newTotal;
    } catch (error) {
      console.error('[WorkoutsScreen] Error subtracting workout calories from shared total:', error);
      return currentCalories;
    }
  };

  const loadWorkouts = async () => {
    try {
      const storedWorkouts = await AsyncStorage.getItem('workouts');
      if (storedWorkouts) {
        setWorkouts(JSON.parse(storedWorkouts));
      }
    } catch (error) {
      console.error('Failed to load workouts:', error);
    }
  };

  const saveWorkouts = async (updatedWorkouts: Workout[]) => {
    try {
      await AsyncStorage.setItem('workouts', JSON.stringify(updatedWorkouts));
      setWorkouts(updatedWorkouts);
    } catch (error) {
      console.error('Failed to save workouts:', error);
    }
  };

  const saveWorkoutAndUpdateSharedCalories = async (workout: Workout) => {
    try {
      // Add workout calories to the SHARED calorie total
      const newTotal = await addWorkoutCaloriesToShared(workout.calories);
      
      console.log(`[WorkoutsScreen] Workout saved with ${workout.calories} calories`);
      Alert.alert(
        'Success', 
        `Workout saved!\nCalories added: ${workout.calories} kcal\nTotal daily calories: ${newTotal} kcal`
      );
    } catch (error) {
      console.error('[WorkoutsScreen] Failed to save workout calories:', error);
      Alert.alert('Warning', 'Workout saved locally but failed to update calorie total');
    }
  };

  // All existing timer functions remain the same
  const startTimer = () => {
    if (!workoutName.trim()) {
      Alert.alert('Error', 'Please enter a workout name');
      return;
    }
    
    if (!isRunning) {
      startTimeRef.current = Date.now();
      pausedTimeRef.current = 0;
      setElapsedTime(0);
    } else if (isPaused) {
      const pauseEndTime = Date.now();
      const pauseDuration = pauseEndTime - (startTimeRef.current! + elapsedTime * 1000 + pausedTimeRef.current);
      pausedTimeRef.current += pauseDuration;
    }
    
    setIsRunning(true);
    setIsPaused(false);
  };

  const pauseTimer = () => {
    setIsPaused(true);
  };

  const stopTimer = () => {
    setIsRunning(false);
    setIsPaused(false);
    if (elapsedTime > 0) {
      setShowCategoryModal(true);
    }
  };

  const resetTimer = () => {
    setIsRunning(false);
    setIsPaused(false);
    setElapsedTime(0);
    startTimeRef.current = null;
    pausedTimeRef.current = 0;
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

  const calculateCalories = (durationInMinutes: number, category: string): number => {
    const caloriesPerHour = CALORIES_PER_HOUR[category as keyof typeof CALORIES_PER_HOUR] || 350;
    return Math.round((caloriesPerHour * durationInMinutes) / 60);
  };

  const formatTime = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hrs > 0) {
      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const completeTimedWorkout = async () => {
    if (!selectedCategory) {
      Alert.alert('Error', 'Please select a workout category');
      return;
    }

    const durationInMinutes = Math.round(elapsedTime / 60);
    const calculatedCalories = calculateCalories(durationInMinutes, selectedCategory);

    const workout: Workout = {
      id: Date.now().toString(),
      name: workoutName,
      duration: durationInMinutes,
      calories: calculatedCalories,
      type: selectedCategory,
      date: new Date().toISOString(),
      actualDuration: elapsedTime,
    };

    const updatedWorkouts = [workout, ...workouts];
    await saveWorkouts(updatedWorkouts);
    
    // Save workout and update SHARED calories
    await saveWorkoutAndUpdateSharedCalories(workout);
    
    resetTimer();
    setWorkoutName('');
    setSelectedCategory('');
    setShowTimerModal(false);
    setShowCategoryModal(false);
  };

  const addWorkout = async () => {
    if (!newWorkout.name || !newWorkout.duration || !newWorkout.calories || !newWorkout.type) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    const workout: Workout = {
      id: Date.now().toString(),
      name: newWorkout.name,
      duration: parseInt(newWorkout.duration),
      calories: parseInt(newWorkout.calories),
      type: newWorkout.type,
      date: new Date().toISOString(),
    };

    const updatedWorkouts = [workout, ...workouts];
    await saveWorkouts(updatedWorkouts);
    
    // Save workout and update SHARED calories
    await saveWorkoutAndUpdateSharedCalories(workout);
    
    setNewWorkout({ name: '', duration: '', calories: '', type: '' });
    setShowAddModal(false);
  };

  const deleteWorkout = async (id: string) => {
    const workoutToDelete = workouts.find(w => w.id === id);
    
    Alert.alert(
      'Delete Workout',
      'Are you sure you want to delete this workout? This will also subtract its calories from your daily total.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const updatedWorkouts = workouts.filter(workout => workout.id !== id);
            await saveWorkouts(updatedWorkouts);
            
            // Subtract calories from SHARED total if workout was from today
            if (workoutToDelete) {
              const today = new Date().toISOString().split('T')[0];
              const workoutDate = new Date(workoutToDelete.date).toISOString().split('T')[0];
              
              if (workoutDate === today) {
                await subtractWorkoutCaloriesFromShared(workoutToDelete.calories);
              }
            }
          },
        },
      ]
    );
  };

  const getWorkoutGradient = (type: string) => {
    const gradients = {
      'Cardio': ['#2563EB', '#5BA3F5'],
      'Strength': ['#7B68EE', '#9370DB'],
      'HIIT': ['#FF6B6B', '#FF8E8E'],
      'Yoga': ['#26D0CE', '#1A2980'],
      'Running': ['#11998E', '#38EF7D'],
      'Cycling': ['#FFB75E', '#ED8F03'],
      'Swimming': ['#667DB6', '#0082C8'],
      'Walking': ['#FDBB2D', '#22C1C3'],
      'Other': ['#667eea', '#764ba2'],
    };
    return gradients[type as keyof typeof gradients] || gradients.Other;
  };

  const renderWorkoutItem = ({ item }: { item: Workout }) => (
    <View style={styles.workoutCardContainer}>
      <LinearGradient
        colors={getWorkoutGradient(item.type)}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.workoutCardBorder}
      >
        <View style={styles.workoutCardContent}>
          <View style={styles.workoutHeader}>
            <View style={styles.workoutTitleSection}>
              <Text style={styles.workoutName}>{item.name}</Text>
              <View style={styles.workoutMeta}>
                <Text style={styles.workoutType}>{item.type}</Text>
                <Text style={styles.workoutDate}>
                  {new Date(item.date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric'
                  })}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => deleteWorkout(item.id)} style={styles.deleteButton}>
              <MaterialIcons name="more-vert" size={16} color="#8E8E93" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.workoutStats}>
            <View style={styles.statItem}>
              <MaterialIcons name="schedule" size={14} color="#8E8E93" />
              <Text style={styles.statValue}>
                {item.actualDuration ? formatTime(item.actualDuration) : `${item.duration}m`}
              </Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <MaterialIcons name="local-fire-department" size={14} color="#FF6B6B" />
              <Text style={styles.statValue}>{item.calories} kcal</Text>
            </View>
          </View>
        </View>
      </LinearGradient>
    </View>
  );

  const renderCategoryButton = (category: string) => (
    <TouchableOpacity
      key={category}
      style={[
        styles.categoryButton,
        selectedCategory === category && styles.selectedCategoryButton
      ]}
      onPress={() => setSelectedCategory(category)}
    >
      <Text style={[
        styles.categoryButtonText,
        selectedCategory === category && styles.selectedCategoryButtonText
      ]}>
        {category}
      </Text>
      <Text style={styles.categoryCalories}>
        {CALORIES_PER_HOUR[category as keyof typeof CALORIES_PER_HOUR]} cal/hr
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      <ProfessionalHeader totalCalories={totalCalories} />

      <View style={styles.contentContainer}>
        {/* Debug Info - Remove in production */}
        <View style={[styles.debugCard, { marginHorizontal: 16, marginBottom: 16 }]}>
          <Text style={styles.debugTitle}>Debug - Shared Calories:</Text>
          <Text style={styles.debugText}>Total Calories: {totalCalories}</Text>
          <Text style={styles.debugText}>Storage Key: calories_{new Date().toISOString().split('T')[0]}</Text>
        </View>

        <View style={styles.actionButtonsContainer}>
          <HealthButton
            onPress={() => setShowTimerModal(true)}
            variant="timer"
            style={styles.actionButton}
          >
            <MaterialIcons name="timer" size={18} color="#2563EB" />
            <Text style={styles.timerButtonText}>Timer</Text>
          </HealthButton>
          
          <HealthButton
            onPress={() => setShowAddModal(true)}
            variant="primary"
            style={styles.actionButton}
          >
            <MaterialIcons name="add" size={18} color="#ffffff" />
            <Text style={styles.primaryButtonText}>Add</Text>
          </HealthButton>
        </View>

        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>Recent Activities</Text>
          <Text style={styles.listCount}>{workouts.length} workouts</Text>
        </View>

        <FlatList
          data={workouts}
          renderItem={renderWorkoutItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialIcons name="fitness-center" size={32} color="#C7C7CC" />
              <Text style={styles.emptyTitle}>No workouts yet</Text>
              <Text style={styles.emptySubtitle}>Start tracking your fitness</Text>
            </View>
          }
        />
      </View>

      {/* All your existing modals remain exactly the same */}
      {/* Enhanced Timer Modal */}
      <Modal visible={showTimerModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Workout Timer</Text>
                <TouchableOpacity onPress={() => {
                  if (isRunning) {
                    Alert.alert(
                      'Close Timer',
                      'Your workout is still running. Close anyway?',
                      [
                        { text: 'Cancel', style: 'cancel' },
                        { 
                          text: 'Close', 
                          onPress: () => {
                            resetTimer();
                            setWorkoutName('');
                            setShowTimerModal(false);
                          }
                        }
                      ]
                    );
                  } else {
                    setWorkoutName('');
                    setShowTimerModal(false);
                  }
                }}>
                  <MaterialIcons name="close" size={20} color="#8E8E93" />
                </TouchableOpacity>
              </View>
              
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Workout Name</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Enter workout name"
                  placeholderTextColor="#C7C7CC"
                  value={workoutName}
                  onChangeText={setWorkoutName}
                  editable={!isRunning}
                />
              </View>

              <View style={styles.timerDisplayContainer}>
                <Text style={styles.timerText}>{formatTime(elapsedTime)}</Text>
                <Text style={styles.timerStatus}>
                  {isRunning ? (isPaused ? 'PAUSED' : 'RUNNING') : 'READY'}
                </Text>
              </View>

              <View style={styles.timerButtonsContainer}>
                {!isRunning ? (
                  <HealthButton onPress={startTimer} variant="primary">
                    <MaterialIcons name="play-arrow" size={20} color="white" />
                    <Text style={styles.primaryButtonText}>Start</Text>
                  </HealthButton>
                ) : (
                  <View style={styles.timerControlRow}>
                    {!isPaused ? (
                      <HealthButton onPress={pauseTimer} variant="secondary" style={styles.halfButton}>
                        <MaterialIcons name="pause" size={18} color="#2563EB" />
                        <Text style={styles.secondaryButtonText}>Pause</Text>
                      </HealthButton>
                    ) : (
                      <HealthButton onPress={startTimer} variant="primary" style={styles.halfButton}>
                        <MaterialIcons name="play-arrow" size={18} color="white" />
                        <Text style={styles.primaryButtonText}>Resume</Text>
                      </HealthButton>
                    )}
                    <HealthButton onPress={stopTimer} variant="primary" style={styles.halfButton}>
                      <MaterialIcons name="stop" size={18} color="white" />
                      <Text style={styles.primaryButtonText}>Finish</Text>
                    </HealthButton>
                  </View>
                )}
              </View>

              <TouchableOpacity onPress={resetTimer} style={styles.resetButton}>
                <Text style={styles.resetButtonText}>Reset</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Category Selection Modal */}
      <Modal visible={showCategoryModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Category</Text>
                <TouchableOpacity onPress={() => {
                  setShowCategoryModal(false);
                  setSelectedCategory('');
                }}>
                  <MaterialIcons name="close" size={20} color="#8E8E93" />
                </TouchableOpacity>
              </View>
              
              <View style={styles.workoutSummary}>
                <Text style={styles.summaryWorkout}>{workoutName}</Text>
                <Text style={styles.summaryTime}>{formatTime(elapsedTime)}</Text>
              </View>
              
              <ScrollView style={styles.categoryList} showsVerticalScrollIndicator={false}>
                {WORKOUT_CATEGORIES.map(renderCategoryButton)}
              </ScrollView>
              
              <View style={styles.modalButtonsContainer}>
                <HealthButton
                  onPress={completeTimedWorkout}
                  variant="primary"
                  disabled={!selectedCategory}
                >
                  <Text style={styles.primaryButtonText}>Save Workout</Text>
                </HealthButton>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Manual Workout Modal */}
      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Add Workout</Text>
                <TouchableOpacity onPress={() => setShowAddModal(false)}>
                  <MaterialIcons name="close" size={20} color="#8E8E93" />
                </TouchableOpacity>
              </View>
              
              <View style={styles.formContainer}>
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Workout Name</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="e.g., Morning Run"
                    placeholderTextColor="#C7C7CC"
                    value={newWorkout.name}
                    onChangeText={(text) => setNewWorkout({...newWorkout, name: text})}
                  />
                </View>
                
                <View style={styles.inputRow}>
                  <View style={styles.halfInputContainer}>
                    <Text style={styles.inputLabel}>Duration (min)</Text>
                    <TextInput
                      style={styles.modalInput}
                      placeholder="30"
                      placeholderTextColor="#C7C7CC"
                      value={newWorkout.duration}
                      onChangeText={(text) => setNewWorkout({...newWorkout, duration: text})}
                      keyboardType="numeric"
                    />
                  </View>
                  
                  <View style={styles.halfInputContainer}>
                    <Text style={styles.inputLabel}>Calories</Text>
                    <TextInput
                      style={styles.modalInput}
                      placeholder="250"
                      placeholderTextColor="#C7C7CC"
                      value={newWorkout.calories}
                      onChangeText={(text) => setNewWorkout({...newWorkout, calories: text})}
                      keyboardType="numeric"
                    />
                  </View>
                </View>
                
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Category</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="e.g., Running, Yoga, Strength"
                    placeholderTextColor="#C7C7CC"
                    value={newWorkout.type}
                    onChangeText={(text) => setNewWorkout({...newWorkout, type: text})}
                  />
                </View>
              </View>
              
              <View style={styles.modalButtonsContainer}>
                <HealthButton
                  onPress={addWorkout}
                  variant="primary"
                >
                  <Text style={styles.primaryButtonText}>Add Workout</Text>
                </HealthButton>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// All your existing styles plus debug styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  debugCard: {
    backgroundColor: '#fff3cd',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ffeaa7',
  },
  debugTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#856404',
    marginBottom: 4,
  },
  debugText: {
    fontSize: 11,
    color: '#856404',
    marginBottom: 2,
  },
  headerContainer: {
    backgroundColor: '#ffffff',
    paddingTop: 44,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  headerContent: {
    paddingBottom: 8,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000000',
    letterSpacing: -0.5,
  },
  headerStats: {
    alignItems: 'flex-end',
  },
  todayLabel: {
    fontSize: 11,
    color: '#8E8E93',
    fontWeight: '500',
    marginBottom: 2,
  },
  calorieCount: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2563EB',
  },
  calorieUnit: {
    fontSize: 11,
    color: '#8E8E93',
    fontWeight: '500',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#8E8E93',
    fontWeight: '400',
  },
  headerDivider: {
    height: 0.5,
    backgroundColor: '#C6C6C8',
    marginTop: 8,
  },
  contentContainer: {
    flex: 1,
    paddingTop: 12,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 8,
  },
  actionButton: {
    flex: 1,
  },
  primaryButton: {
    backgroundColor: '#2563EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 6,
  },
  secondaryButton: {
    backgroundColor: '#F2F2F7',
    borderWidth: 1,
    borderColor: '#C6C6C8',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 6,
  },
  timerButton: {
    backgroundColor: '#F2F2F7',
    borderWidth: 1,
    borderColor: '#2563EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 6,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: '#2563EB',
    fontSize: 14,
    fontWeight: '600',
  },
  timerButtonText: {
    color: '#2563EB',
    fontSize: 14,
    fontWeight: '600',
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  listCount: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '500',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  workoutCardContainer: {
    marginBottom: 8,
  },
  workoutCardBorder: {
    borderRadius: 12,
    padding: 1,
  },
  workoutCardContent: {
    backgroundColor: '#ffffff',
    borderRadius: 11,
    padding: 12,
  },
  workoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  workoutTitleSection: {
    flex: 1,
  },
  workoutName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 2,
  },
  workoutMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  workoutType: {
    fontSize: 11,
    color: '#2563EB',
    fontWeight: '500',
  },
  workoutDate: {
    fontSize: 11,
    color: '#8E8E93',
    fontWeight: '400',
  },
  deleteButton: {
    padding: 4,
  },
  workoutStats: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 0.5,
    borderTopColor: '#F2F2F7',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statDivider: {
    width: 1,
    height: 12,
    backgroundColor: '#E5E5EA',
    marginHorizontal: 12,
  },
  statValue: {
    fontSize: 12,
    color: '#000000',
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 40,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8E8E93',
    marginTop: 12,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#C7C7CC',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '85%',
  },
  modalContent: {
    padding: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E5EA',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#8E8E93',
    marginBottom: 6,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 15,
    color: '#000000',
    backgroundColor: '#F2F2F7',
  },
  timerDisplayContainer: {
    alignItems: 'center',
    paddingVertical: 24,
    marginBottom: 20,
  },
  timerText: {
    fontSize: 32,
    fontWeight: '300',
    color: '#000000',
    fontFamily: 'monospace',
  },
  timerStatus: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8E8E93',
    marginTop: 4,
    letterSpacing: 1,
  },
  timerButtonsContainer: {
    marginBottom: 16,
  },
  timerControlRow: {
    flexDirection: 'row',
    gap: 8,
  },
  halfButton: {
    flex: 1,
  },
  resetButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  resetButtonText: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500',
  },
  workoutSummary: {
    alignItems: 'center',
    paddingVertical: 16,
    marginBottom: 16,
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
  },
  summaryWorkout: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  summaryTime: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 2,
    fontFamily: 'monospace',
  },
  categoryList: {
    maxHeight: 240,
    marginBottom: 20,
  },
  categoryButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 4,
    backgroundColor: '#F2F2F7',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  selectedCategoryButton: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000000',
  },
  selectedCategoryButtonText: {
    color: '#ffffff',
  },
  categoryCalories: {
    fontSize: 11,
    color: '#8E8E93',
    fontWeight: '400',
  },
  formContainer: {
    marginBottom: 20,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInputContainer: {
    flex: 1,
  },
  modalButtonsContainer: {
    gap: 8,
  },
});
