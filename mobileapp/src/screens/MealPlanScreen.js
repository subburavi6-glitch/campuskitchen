import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { apiService } from '../services/apiService';

export default function MealPlanScreen({ navigation }) {
  const [weeklyPlan, setWeeklyPlan] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWeeklyPlan();
  }, []);

  const loadWeeklyPlan = async () => {
    try {
      const data = await apiService.getWeeklyMealPlan();
      setWeeklyPlan(data);
    } catch (error) {
      console.error('Error loading weekly plan:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadWeeklyPlan();
    setRefreshing(false);
  };

  const getMealIcon = (mealType) => {
    switch (mealType) {
      case 'BREAKFAST':
        return 'sunny-outline';
      case 'LUNCH':
        return 'restaurant-outline';
      case 'SNACKS':
        return 'cafe-outline';
      case 'DINNER':
        return 'moon-outline';
      default:
        return 'restaurant-outline';
    }
  };

  const getMealColor = (mealType) => {
    switch (mealType) {
      case 'BREAKFAST':
        return 'bg-orange-100 border-orange-200';
      case 'LUNCH':
        return 'bg-green-100 border-green-200';
      case 'SNACKS':
        return 'bg-purple-100 border-purple-200';
      case 'DINNER':
        return 'bg-blue-100 border-blue-200';
      default:
        return 'bg-gray-100 border-gray-200';
    }
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-secondary">
        <Text className="text-primary text-lg">Loading meal plan...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-secondary">
      {/* Header */}
      <View className="bg-primary px-6 py-10 pt-16">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-white text-2xl font-bold">Weekly Meal Plan</Text>
            <Text className="text-white opacity-80 mt-1">Your subscription meals</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="close-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        className="flex-1 px-6 -mt-4"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {weeklyPlan.map((day, dayIndex) => (
          <View key={dayIndex} className="bg-white rounded-2xl p-6 shadow-sm mb-4">
            <Text className="text-xl font-bold text-gray-800 mb-4">
              {day.dayName} - {day.date}
            </Text>
            
            {day.meals.map((meal, mealIndex) => (
              <View 
                key={mealIndex} 
                className={`border rounded-xl p-4 mb-3 ${getMealColor(meal.mealType)}`}
              >
                <View className="flex-row items-center justify-between mb-3">
                  <View className="flex-row items-center">
                    <Ionicons 
                      name={getMealIcon(meal.mealType)} 
                      size={24} 
                      color="#1c3c80" 
                    />
                    <View className="ml-3">
                      <Text className="text-lg font-semibold text-gray-800">
                        {meal.mealType}
                      </Text>
                      <Text className="text-gray-600">{meal.time}</Text>
                    </View>
                  </View>
                  {meal.attended && (
                    <View className="w-6 h-6 bg-green-500 rounded-full items-center justify-center">
                      <Ionicons name="checkmark-outline" size={16} color="#fff" />
                    </View>
                  )}
                </View>

                <Text className="text-gray-800 font-medium mb-3">{meal.dishName}</Text>
                
                <View className="bg-blue-50 rounded-xl p-3">
                  <Text className="text-blue-800 text-center text-sm">
                    {meal.attended 
                      ? '✅ Attended - Use QR scanner at mess for future attendance'
                      : '📱 Use QR scanner at mess entrance for attendance'
                    }
                  </Text>
                </View>
              </View>
            ))}
          </View>
        ))}

        {weeklyPlan.length === 0 && (
          <View className="bg-white rounded-2xl p-8 shadow-sm items-center">
            <Ionicons name="calendar-outline" size={48} color="#d1d5db" />
            <Text className="text-gray-500 text-lg mt-4">No meal plan available</Text>
            <Text className="text-gray-400 text-center mt-2">
              You need an active subscription to view meal plans
            </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('Subscription')}
              className="bg-primary px-6 py-3 rounded-xl mt-4"
            >
              <Text className="text-white font-semibold">View Subscriptions</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}