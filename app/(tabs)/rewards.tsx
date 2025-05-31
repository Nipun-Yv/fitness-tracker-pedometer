import React, { useState, useEffect, useRef } from 'react';

import { useIsFocused } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
  StatusBar,
  Animated,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width: screenWidth } = Dimensions.get('window');

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

interface Coupon {
  id: string;
  title: string;
  description: string;
  requirement: string;
  requirementValue: number;
  currentValue: number;
  type: 'steps' | 'calories';
  icon: string;
  colors: string[];
  isUnlocked: boolean;
  isClaimed: boolean;
  discountCode?: string;
}

interface ClaimedCoupon {
  couponId: string;
  discountCode: string;
  claimedAt: string;
}

// Professional Header Component
const RewardsHeader = ({ totalSteps, totalCalories }: { totalSteps: number; totalCalories: number }) => (
  <View style={styles.headerContainer}>
    <View style={styles.headerContent}>
      <View style={styles.headerTop}>
        <Text style={styles.headerTitle}>Rewards</Text>
        <View style={styles.headerStats}>
          <View style={styles.statItem}>
            <MaterialIcons name="directions-walk" size={14} color="#8E8E93" />
            <Text style={styles.statValue}>{totalSteps.toLocaleString()}</Text>
          </View>
          <View style={styles.statItem}>
            <MaterialIcons name="local-fire-department" size={14} color="#FF6B6B" />
            <Text style={styles.statValue}>{totalCalories}</Text>
          </View>
        </View>
      </View>
      <Text style={styles.headerSubtitle}>Unlock exclusive insurance benefits through fitness</Text>
    </View>
    <View style={styles.headerDivider} />
  </View>
);

// Animated Progress Ring Component
const ProgressRing = ({ progress, size = 60, strokeWidth = 4, color = '#2563EB' }) => {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: progress,
      duration: 1000,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  return (
    <View style={[styles.progressRing, { width: size, height: size }]}>
      <Animated.View style={StyleSheet.absoluteFillObject}>
        <View
          style={[
            styles.progressCircle,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              borderWidth: strokeWidth,
              borderColor: '#E5E5EA',
            },
          ]}
        />
        <Animated.View
          style={[
            styles.progressCircle,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              borderWidth: strokeWidth,
              borderColor: color,
              borderRightColor: 'transparent',
              borderBottomColor: 'transparent',
              transform: [
                {
                  rotate: animatedValue.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '360deg'],
                  }),
                },
              ],
            },
          ]}
        />
      </Animated.View>
      <Text style={[styles.progressText, { color }]}>
        {Math.round(progress * 100)}%
      </Text>
    </View>
  );
};

// Coupon Card Component
const CouponCard = ({ coupon, onClaim }: { coupon: Coupon; onClaim: (couponId: string) => void }) => {
  const scaleValue = useRef(new Animated.Value(1)).current;
  const progress = Math.min(coupon.currentValue / coupon.requirementValue, 1);

  const handlePressIn = () => {
    if (coupon.isUnlocked && !coupon.isClaimed) {
      Animated.spring(scaleValue, {
        toValue: 0.98,
        useNativeDriver: true,
      }).start();
    }
  };

  const handlePressOut = () => {
    if (coupon.isUnlocked && !coupon.isClaimed) {
      Animated.spring(scaleValue, {
        toValue: 1,
        useNativeDriver: true,
      }).start();
    }
  };

  const handlePress = () => {
    if (coupon.isUnlocked && !coupon.isClaimed) {
      onClaim(coupon.id);
    }
  };

  return (
    <Animated.View style={[{ transform: [{ scale: scaleValue }] }, styles.couponCardContainer]}>
      <TouchableOpacity
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={!coupon.isUnlocked || coupon.isClaimed}
        activeOpacity={0.9}
      >
        <LinearGradient
          colors={coupon.isUnlocked ? coupon.colors : ['#F2F2F7', '#E5E5EA']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.couponCardBorder}
        >
          <View style={styles.couponCardContent}>
            <View style={styles.couponHeader}>
              <View style={styles.couponIconContainer}>
                <LinearGradient
                  colors={coupon.isUnlocked ? ['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)'] : ['#C7C7CC', '#E5E5EA']}
                  style={styles.couponIcon}
                >
                  <MaterialIcons 
                    name={coupon.icon as any} 
                    size={24} 
                    color={coupon.isUnlocked ? 'white' : '#8E8E93'} 
                  />
                </LinearGradient>
              </View>
              
              <View style={styles.couponProgress}>
                <ProgressRing 
                  progress={progress} 
                  size={50}
                  color={coupon.isUnlocked ? 'white' : '#C7C7CC'}
                />
              </View>
            </View>

            <View style={styles.couponInfo}>
              <Text style={[
                styles.couponTitle, 
                { color: coupon.isUnlocked ? 'white' : '#8E8E93' }
              ]}>
                {coupon.title}
              </Text>
              <Text style={[
                styles.couponDescription, 
                { color: coupon.isUnlocked ? 'rgba(255,255,255,0.9)' : '#C7C7CC' }
              ]}>
                {coupon.description}
              </Text>
            </View>

            <View style={styles.couponFooter}>
              <View style={styles.requirementContainer}>
                <Text style={[
                  styles.requirementText,
                  { color: coupon.isUnlocked ? 'rgba(255,255,255,0.8)' : '#C7C7CC' }
                ]}>
                  {coupon.requirement}
                </Text>
                <Text style={[
                  styles.progressNumbers,
                  { color: coupon.isUnlocked ? 'white' : '#8E8E93' }
                ]}>
                  {coupon.currentValue.toLocaleString()} / {coupon.requirementValue.toLocaleString()}
                </Text>
              </View>

              <View style={styles.statusContainer}>
                {coupon.isClaimed ? (
                  <View style={styles.claimedBadge}>
                    <MaterialIcons name="check-circle" size={16} color="#34C759" />
                    <Text style={styles.claimedText}>Claimed</Text>
                  </View>
                ) : coupon.isUnlocked ? (
                  <View style={styles.unlockedBadge}>
                    <MaterialIcons name="redeem" size={16} color="white" />
                    <Text style={styles.unlockedText}>Tap to Claim</Text>
                  </View>
                ) : (
                  <View style={styles.lockedBadge}>
                    <MaterialIcons name="lock" size={16} color="#8E8E93" />
                    <Text style={styles.lockedText}>Locked</Text>
                  </View>
                )}
              </View>
            </View>

            {coupon.isClaimed && coupon.discountCode && (
              <View style={styles.discountCodeContainer}>
                <Text style={styles.discountCodeLabel}>Discount Code:</Text>
                <View style={styles.discountCodeBox}>
                  <Text style={styles.discountCode}>{coupon.discountCode}</Text>
                  <TouchableOpacity 
                    onPress={() => {
                      // Copy to clipboard logic would go here
                      Alert.alert('Copied!', 'Discount code copied to clipboard');
                    }}
                  >
                    <MaterialIcons name="content-copy" size={16} color="#2563EB" />
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default function RewardsScreen() {
     const isFocused = useIsFocused();
  const [totalSteps, setTotalSteps] = useState(0);
  const [totalCalories, setTotalCalories] = useState(0);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isFocused) {
      console.log('Rewards screen is focused - reloading data');
      loadFitnessData();
    }
  }, [isFocused]);


  const generateCoupons = (steps: number, calories: number): Coupon[] => {
    return [
      {
        id: 'health-checkup',
        title: 'Free Health Check-up',
        description: 'Get a comprehensive health check-up when you purchase any insurance policy',
        requirement: 'Complete 200,000 steps',
        requirementValue: 200000,
        currentValue: steps,
        type: 'steps',
        icon: 'health-and-safety',
        colors: ['#11998E', '#38EF7D'],
        isUnlocked: steps >= 200000,
        isClaimed: false,
      },
      {
        id: 'borderless-addon',
        title: 'Borderless Treatment Add-on',
        description: 'Get treatment anywhere in the world, up to sum insured with co-payment options',
        requirement: 'Burn 25,000 calories',
        requirementValue: 25000,
        currentValue: calories,
        type: 'calories',
        icon: 'public',
        colors: ['#667eea', '#764ba2'],
        isUnlocked: calories >= 25000,
        isClaimed: false,
      },
      {
        id: 'befit-benefit',
        title: 'Be-Fit Benefit',
        description: 'Avail 10% discount on select fitness centers (applicable for certain policies)',
        requirement: 'Burn 60,000 calories',
        requirementValue: 60000,
        currentValue: calories,
        type: 'calories',
        icon: 'fitness-center',
        colors: ['#FF6B6B', '#FF8E8E'],
        isUnlocked: calories >= 60000,
        isClaimed: false,
      },
    ];
  };

  const loadFitnessData = async () => {
    try {
      setLoading(true);
      
      // Load total steps from all days
      const stepKeys = await AsyncStorage.getAllKeys();
      const stepDataKeys = stepKeys.filter(key => key.startsWith('steps_'));
      let totalStepsCount = 0;

      for (const key of stepDataKeys) {
        const stepData = await AsyncStorage.getItem(key);
        if (stepData) {
          const parsed: DailySteps = JSON.parse(stepData);
          totalStepsCount += parsed.steps;
        }
      }

      // Load total calories (current implementation uses daily calories)
      const today = new Date().toISOString().split('T')[0];
      const calorieData = await AsyncStorage.getItem(`calories_${today}`);
      let totalCaloriesCount = 0;

      if (calorieData) {
        const parsed: DailyCalories = JSON.parse(calorieData);
        totalCaloriesCount = parsed.calories;
      }

      // For demo purposes, let's load historical calories too
      const calorieKeys = stepKeys.filter(key => key.startsWith('calories_'));
      for (const key of calorieKeys) {
        const data = await AsyncStorage.getItem(key);
        if (data) {
          const parsed: DailyCalories = JSON.parse(data);
          if (key !== `calories_${today}`) {
            totalCaloriesCount += parsed.calories;
          }
        }
      }

      setTotalSteps(totalStepsCount);
      setTotalCalories(totalCaloriesCount);

      // Load claimed coupons
      const claimedCouponsData = await AsyncStorage.getItem('claimedCoupons');
      const claimedCoupons: ClaimedCoupon[] = claimedCouponsData ? JSON.parse(claimedCouponsData) : [];

      // Generate coupons with claimed status
      const generatedCoupons = generateCoupons(totalStepsCount, totalCaloriesCount);
      const couponsWithStatus = generatedCoupons.map(coupon => {
        const claimed = claimedCoupons.find(c => c.couponId === coupon.id);
        return {
          ...coupon,
          isClaimed: !!claimed,
          discountCode: claimed?.discountCode,
        };
      });

      setCoupons(couponsWithStatus);
      
      console.log(`[RewardsScreen] Loaded - Steps: ${totalStepsCount}, Calories: ${totalCaloriesCount}`);
    } catch (error) {
      console.error('[RewardsScreen] Failed to load fitness data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateUUID = (): string => {
    return 'xxxx-xxxx-4xxx-yxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    }).toUpperCase();
  };

const claimCoupon = async (couponId: string) => {
  try {
    const coupon = coupons.find(c => c.id === couponId);
    if (!coupon || !coupon.isUnlocked || coupon.isClaimed) {
      return;
    }

    const discountCode = generateUUID();
    const claimedAt = new Date().toISOString();
    
    const claimedCoupon: ClaimedCoupon = {
      couponId,
      discountCode,
      claimedAt,
    };

    // Send POST request to Express backend with only coupon ID
    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_BASE_URL}/coupons/claim`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          couponId: couponId,
          discountCode: discountCode,
          claimedAt: claimedAt,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save coupon claim to server');
      }

      const backendResponse = await response.json();
      console.log(`[RewardsScreen] Backend response:`, backendResponse);
      
    } catch (networkError) {
      console.error('[RewardsScreen] Network error saving to backend:', networkError);
      // Continue with local save even if backend fails
      Alert.alert(
        'Warning', 
        'Coupon claimed locally but failed to sync with server. It will sync when connection is restored.'
      );
    }

    // Save to AsyncStorage (local backup)
    const existingClaimed = await AsyncStorage.getItem('claimedCoupons');
    const claimedCoupons: ClaimedCoupon[] = existingClaimed ? JSON.parse(existingClaimed) : [];
    claimedCoupons.push(claimedCoupon);
    await AsyncStorage.setItem('claimedCoupons', JSON.stringify(claimedCoupons));

    const updatedCoupons = coupons.map(c => 
      c.id === couponId 
        ? { ...c, isClaimed: true, discountCode }
        : c
    );
    setCoupons(updatedCoupons);

    Alert.alert(
      'Coupon Claimed!',
      `Congratulations! Your discount code is: ${discountCode}`,
      [{ text: 'OK', style: 'default' }]
    );

    console.log(`[RewardsScreen] Coupon claimed: ${couponId} - Code: ${discountCode}`);
    
  } catch (error) {
    console.error('[RewardsScreen] Failed to claim coupon:', error);
    Alert.alert('Error', 'Failed to claim coupon. Please try again.');
  }
};


  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <MaterialIcons name="fitness-center" size={48} color="#C7C7CC" />
        <Text style={styles.loadingText}>Loading your achievements...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      <RewardsHeader totalSteps={totalSteps} totalCalories={totalCalories} />

      <ScrollView 
        style={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.achievementSummary}>
          <Text style={styles.summaryTitle}>Your Fitness Journey</Text>
          <Text style={styles.summaryText}>
            Keep moving to unlock exclusive insurance benefits and discounts!
          </Text>
        </View>

        <View style={styles.couponsContainer}>
          {coupons.map((coupon) => (
            <CouponCard
              key={coupon.id}
              coupon={coupon}
              onClaim={claimCoupon}
            />
          ))}
        </View>

        <View style={styles.footerInfo}>
          <Text style={styles.footerTitle}>Terms & Conditions</Text>
          <Text style={styles.footerText}>
            • Coupons are valid for 12 months from claim date{'\n'}
            • Benefits are subject to policy terms and conditions{'\n'}
            • Some benefits may have additional eligibility criteria{'\n'}
            • Contact customer support for more information
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
  },
  loadingText: {
    fontSize: 16,
    color: '#8E8E93',
    marginTop: 16,
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
    flexDirection: 'row',
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
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
  },
  scrollContent: {
    paddingBottom: 20,
  },
  achievementSummary: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 14,
    color: '#8E8E93',
    lineHeight: 20,
  },
  couponsContainer: {
    paddingHorizontal: 16,
    gap: 16,
  },
  couponCardContainer: {
    marginBottom: 4,
  },
  couponCardBorder: {
    borderRadius: 16,
    padding: 2,
  },
  couponCardContent: {
    backgroundColor: 'transparent',
    borderRadius: 14,
    padding: 20,
  },
  couponHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  couponIconContainer: {
    flex: 1,
  },
  couponIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  couponProgress: {
    alignItems: 'center',
  },
  progressRing: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressCircle: {
    position: 'absolute',
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
  },
  couponInfo: {
    marginBottom: 16,
  },
  couponTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  couponDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  couponFooter: {
    gap: 12,
  },
  requirementContainer: {
    gap: 4,
  },
  requirementText: {
    fontSize: 12,
    fontWeight: '500',
  },
  progressNumbers: {
    fontSize: 16,
    fontWeight: '600',
  },
  statusContainer: {
    alignItems: 'flex-start',
  },
  claimedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(52, 199, 89, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  claimedText: {
    color: '#34C759',
    fontSize: 12,
    fontWeight: '600',
  },
  unlockedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  unlockedText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  lockedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(142, 142, 147, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  lockedText: {
    color: '#8E8E93',
    fontSize: 12,
    fontWeight: '600',
  },
  discountCodeContainer: {
    marginTop: 16,
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  discountCodeLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 8,
  },
  discountCodeBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  discountCode: {
    fontFamily: 'monospace',
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
  },
  footerInfo: {
    marginTop: 32,
    paddingHorizontal: 16,
    paddingVertical: 20,
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    borderRadius: 12,
  },
  footerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 12,
  },
  footerText: {
    fontSize: 13,
    color: '#8E8E93',
    lineHeight: 18,
  },
});
