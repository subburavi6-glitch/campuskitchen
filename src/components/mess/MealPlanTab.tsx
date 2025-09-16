import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Plus, Edit, Trash2, ChefHat, Clock, Users } from 'lucide-react';
import api from '../../utils/api';
import Modal from '../Modal';
import toast from 'react-hot-toast';

interface MealPlan {
  id: string;
  weekStart?: string;
  day: number;
  meal: 'BREAKFAST' | 'LUNCH' | 'SNACKS' | 'DINNER';
  plannedStudents: number;
  autoIndentGenerated?: boolean;
  dishes: Array<{
    id: string;
    mealPlanId: string;
    dishId: string;
    sequenceOrder: number;
    isMainDish: boolean;
    dish: {
      id: string;
      name: string;
      imageUrl?: string | null;
      category?: string;
      costPer5Students?: string;
      createdAt?: string;
      updatedAt?: string;
    };
  }>;
  messFacility?: {
    id?: string;
    name?: string;
  };
}

interface MealPlanTabProps {
  facilityId: string;
}

const mealColors = {
  BREAKFAST: 'bg-orange-100 text-orange-800 border-orange-200',
  LUNCH: 'bg-green-100 text-green-800 border-green-200',
  SNACKS: 'bg-purple-100 text-purple-800 border-purple-200',
  DINNER: 'bg-blue-100 text-blue-800 border-blue-200',
};

const mealTimes = {
  BREAKFAST: '7:30 AM - 9:30 AM',
  LUNCH: '12:00 PM - 2:00 PM',
  SNACKS: '4:00 PM - 5:30 PM',
  DINNER: '7:00 PM - 9:00 PM',
};

// Sample meal data based on the images
const sampleMealData = {
  0: { // Monday
    BREAKFAST: { name: 'Mysore Bajji, 2 Chutneys, Milk, Tea', items: ['Mysore Bajji', 'Coconut Chutney', 'Tomato Chutney', 'Milk', 'Tea'] },
    LUNCH: { name: 'Rice, Palakura Pappu, Aloo Dum Fry, Rasam, Roti Chutney, Yogurt', items: ['Rice', 'Palakura Pappu', 'Aloo Dum Fry', 'Rasam', 'Roti Chutney', 'Yogurt'] },
    SNACKS: { name: 'Tea', items: ['Tea'] },
    DINNER: { name: 'Rice, Brinjal Batani Curry, Sambar, Yogurt', items: ['Rice', 'Brinjal Batani Curry', 'Sambar', 'Yogurt'] }
  },
  1: { // Tuesday
    BREAKFAST: { name: 'Pulihora, Tomato Chutney, Milk, Tea', items: ['Pulihora', 'Tomato Chutney', 'Milk', 'Tea'] },
    LUNCH: { name: 'Rice, Tomato Pappu, Arattikaya Fry, Rasam, Roti Chutney, Yogurt', items: ['Rice', 'Tomato Pappu', 'Arattikaya Fry', 'Rasam', 'Roti Chutney', 'Yogurt'] },
    SNACKS: { name: 'Tea', items: ['Tea'] },
    DINNER: { name: 'Rice, Chicken Curry / Veg Curry, Rasam, Yogurt', items: ['Rice', 'Chicken Curry', 'Veg Curry', 'Rasam', 'Yogurt'] }
  },
  2: { // Wednesday
    BREAKFAST: { name: 'Vada, 2 Chutneys, Milk, Tea', items: ['Vada', 'Coconut Chutney', 'Sambar', 'Milk', 'Tea'] },
    LUNCH: { name: 'Rice, Pappu Thalimpu, Guthi Dondakaya, Rasam, Roti Chutney, Yogurt', items: ['Rice', 'Pappu Thalimpu', 'Guthi Dondakaya', 'Rasam', 'Roti Chutney', 'Yogurt'] },
    SNACKS: { name: 'Tea', items: ['Tea'] },
    DINNER: { name: 'Rice, Drumstick Tomato Curry, Egg, Sambar, Yogurt', items: ['Rice', 'Drumstick Tomato Curry', 'Egg', 'Sambar', 'Yogurt'] }
  },
  3: { // Thursday
    BREAKFAST: { name: 'Kichidi, Gongura Chutney, Milk, Tea', items: ['Kichidi', 'Gongura Chutney', 'Milk', 'Tea'] },
    LUNCH: { name: 'Rice, Thottakura Pappu, Cabbage Fry, Rasam, Roti Chutney, Yogurt', items: ['Rice', 'Thottakura Pappu', 'Cabbage Fry', 'Rasam', 'Roti Chutney', 'Yogurt'] },
    SNACKS: { name: 'Tea', items: ['Tea'] },
    DINNER: { name: 'Sambar Rice, Curd Rice, Fryums, Lemon Pickle', items: ['Sambar Rice', 'Curd Rice', 'Fryums', 'Lemon Pickle'] }
  },
  4: { // Friday
    BREAKFAST: { name: 'Punugulu, 2 Chutneys, Milk, Tea', items: ['Punugulu', 'Coconut Chutney', 'Tomato Chutney', 'Milk', 'Tea'] },
    LUNCH: { name: 'Rice, Dosakaya Pappu, Bendakaya Fry, Rasam, Roti Chutney, Yogurt', items: ['Rice', 'Dosakaya Pappu', 'Bendakaya Fry', 'Rasam', 'Roti Chutney', 'Yogurt'] },
    SNACKS: { name: 'Tea', items: ['Tea'] },
    DINNER: { name: 'Dessert, Rice, Rajma Channa Curry, Sambar, Yogurt', items: ['Dessert', 'Rice', 'Rajma Channa Curry', 'Sambar', 'Yogurt'] }
  },
  5: { // Saturday
    BREAKFAST: { name: 'Idly, 2 Chutneys, Milk, Tea', items: ['Idly', 'Coconut Chutney', 'Sambar', 'Milk', 'Tea'] },
    LUNCH: { name: 'Rice, Muddha Pappu, Aavakaya Pachadi, Kandha Pusa, Rasam, Roti Chutney, Yogurt', items: ['Rice', 'Muddha Pappu', 'Aavakaya Pachadi', 'Kandha Pusa', 'Rasam', 'Roti Chutney', 'Yogurt'] },
    SNACKS: { name: 'Tea', items: ['Tea'] },
    DINNER: { name: 'Rice, Dondakai Dum Fry, Sambar, Yogurt', items: ['Rice', 'Dondakai Dum Fry', 'Sambar', 'Yogurt'] }
  },
  6: { // Sunday
    BREAKFAST: { name: 'Hot Pongal, Sambar, Chutney, Milk, Tea', items: ['Hot Pongal', 'Sambar', 'Coconut Chutney', 'Milk', 'Tea'] },
    LUNCH: { name: 'Rice, Tomato Menthikura Pappu, Meal Maker Masala, Rasam, Roti Chutney, Yogurt', items: ['Rice', 'Tomato Menthikura Pappu', 'Meal Maker Masala', 'Rasam', 'Roti Chutney', 'Yogurt'] },
    SNACKS: { name: 'Tea', items: ['Tea'] },
    DINNER: { name: 'Vegetable Biryani, Rice, Aloo Khorma, Sambar, Yogurt', items: ['Vegetable Biryani', 'Rice', 'Aloo Khorma', 'Sambar', 'Yogurt'] }
  }
};

const MealPlanTab: React.FC<MealPlanTabProps> = ({ facilityId }) => {
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [currentWeek, setCurrentWeek] = useState(getStartOfWeek(new Date()));
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);

  useEffect(() => {
    fetchMealPlans();
  }, [currentWeek, facilityId]);

  function getStartOfWeek(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  }

  const fetchMealPlans = async () => {
    try {
      const response = await api.get('/meal-plans', {
        params: { 
          weekStart: currentWeek.toISOString(),
          messFacilityId: facilityId
        }
      });
      setMealPlans(response.data);
    } catch (error) {
      console.error('Failed to fetch meal plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newWeek = new Date(currentWeek);
    newWeek.setDate(newWeek.getDate() + (direction === 'next' ? 7 : -7));
    setCurrentWeek(newWeek);
  };

  const getDayName = (dayIndex: number) => {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    return days[dayIndex];
  };

  const getDateForDay = (dayIndex: number) => {
    const date = new Date(currentWeek);
    date.setDate(date.getDate() + dayIndex);
    return date.getDate();
  };

  const getMealPlan = (day: number, meal: string) => {
    return mealPlans.find(plan => plan.day === day && plan.meal === meal);
  };

  const handlePlanClick = (day: number, meal: string) => {
    const existingPlan = getMealPlan(day, meal);
    setSelectedPlan({
      weekStart: currentWeek,
      day,
      meal,
      existingPlan,
      facilityId
    });
    setShowModal(true);
  };

  const meals = ['BREAKFAST', 'LUNCH', 'SNACKS', 'DINNER'];

  return (
    <div className="space-y-6">
      {/* Week Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigateWeek('prev')}
            className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50"
          >
            ←
          </button>
          <span className="font-medium text-lg">
            Week of {currentWeek.toLocaleDateString()}
          </span>
          <button
            onClick={() => navigateWeek('next')}
            className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50"
          >
            →
          </button>
        </div>
        <button
          onClick={() => fetchMealPlans()}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
        >
          Refresh
        </button>
      </div>

      {/* Weekly Calendar Grid */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="grid grid-cols-8 gap-0">
          {/* Header */}
          <div className="bg-gray-50 p-4 font-medium text-gray-900 border-b border-r">
            <div className="flex items-center space-x-2">
              <Calendar size={16} />
              <span>Meal / Day</span>
            </div>
          </div>
          {[0, 1, 2, 3, 4, 5, 6].map(day => (
            <div key={day} className="bg-gray-50 p-4 text-center border-b border-r">
              <div className="font-medium text-gray-900">{getDayName(day)}</div>
              <div className="text-sm text-gray-500">{getDateForDay(day)}</div>
            </div>
          ))}

          {/* Meal Rows */}
          {meals.map(meal => (
            <React.Fragment key={meal}>
              <div className="bg-gray-50 p-4 font-medium text-gray-900 border-b border-r">
                <div className="flex flex-col items-start space-y-2">
                  <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${mealColors[meal as keyof typeof mealColors]}`}>
                    {meal}
                  </span>
                  <div className="flex items-center text-xs text-gray-500">
                    <Clock size={12} className="mr-1" />
                    <span>{mealTimes[meal as keyof typeof mealTimes]}</span>
                  </div>
                </div>
              </div>
              {[0, 1, 2, 3, 4, 5, 6].map(day => {
                const plan = getMealPlan(day, meal);
                const sampleData = sampleMealData[day as keyof typeof sampleMealData]?.[meal as keyof typeof sampleMealData[0]];
                return (
                  <div
                    key={`${day}-${meal}`}
                    className="p-4 border-b border-r min-h-[140px] hover:bg-gray-50 cursor-pointer transition-colors group"
                    onClick={() => handlePlanClick(day, meal)}
                  >
                    {plan && plan.dishes && plan.dishes.length > 0 ? (
                      <div className="space-y-2">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            {plan.dishes.map((dishItem, idx) => (
                              <div key={idx} className="mb-2">
                                <h4 className="font-medium text-gray-900 text-sm mb-1">
                                  {dishItem.dish.name}
                                </h4>
                                {dishItem.dish.category && (
                                  <p className="text-xs text-gray-500 mb-2">{dishItem.dish.category}</p>
                                )}
                                <div className="flex items-center space-x-2 mb-2">
                                  <div className="flex items-center text-xs text-blue-600">
                                    <Users size={12} className="mr-1" />
                                    <span>{plan.plannedStudents}</span>
                                  </div>
                                  {dishItem.isMainDish && (
                                    <span className="text-blue-600 font-medium">(Main)</span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : sampleData ? (
                      <div className="space-y-2 opacity-60">
                        <h4 className="font-medium text-gray-700 text-sm">
                          {sampleData.name}
                        </h4>
                        <div className="text-xs text-gray-500">
                          <div className="space-y-1">
                            {sampleData.items.map((item: string, idx: number) => (
                              <div key={idx} className="flex items-center space-x-1">
                                <ChefHat size={10} />
                                <span>{item}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="mt-2">
                          <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                            Sample Menu
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-400 group-hover:text-gray-600">
                        <div className="text-center">
                          <Plus size={24} className="mx-auto mb-2" />
                          <span className="text-xs">Add Meal Plan</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-blue-50 rounded-lg p-4">
        <h3 className="font-medium text-blue-900 mb-3">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => {/* Generate weekly plan */}}
            className="p-3 bg-white rounded-lg border border-blue-200 hover:bg-blue-50 transition-colors text-left"
          >
            <Calendar className="h-6 w-6 text-blue-600 mb-2" />
            <h4 className="font-medium text-gray-900">Generate Weekly Plan</h4>
            <p className="text-sm text-gray-600">Auto-create meal plans for the week</p>
          </button>
          
          <button
            onClick={() => {/* Copy from previous week */}}
            className="p-3 bg-white rounded-lg border border-blue-200 hover:bg-blue-50 transition-colors text-left"
          >
            <Edit className="h-6 w-6 text-blue-600 mb-2" />
            <h4 className="font-medium text-gray-900">Copy Previous Week</h4>
            <p className="text-sm text-gray-600">Duplicate last week's meal plan</p>
          </button>
          
          <button
            onClick={() => {/* Bulk edit */}}
            className="p-3 bg-white rounded-lg border border-blue-200 hover:bg-blue-50 transition-colors text-left"
          >
            <ChefHat className="h-6 w-6 text-blue-600 mb-2" />
            <h4 className="font-medium text-gray-900">Bulk Edit</h4>
            <p className="text-sm text-gray-600">Edit multiple meal plans at once</p>
          </button>
        </div>
      </div>

      {/* Meal Plan Form Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Meal Plan Details"
        size="lg"
      >
        {selectedPlan && (
          <MealPlanForm
            {...selectedPlan}
            onSuccess={() => {
              setShowModal(false);
              fetchMealPlans();
            }}
            onCancel={() => setShowModal(false)}
          />
        )}
      </Modal>
    </div>
  );
};

// Meal Plan Form Component
const MealPlanForm: React.FC<any> = ({ 
  weekStart, 
  day, 
  meal, 
  existingPlan, 
  facilityId,
  onSuccess, 
  onCancel 
}) => {
  const [dishes, setDishes] = useState([]);
  const [formData, setFormData] = useState({
    dishId: existingPlan?.dish.id || '',
    plannedStudents: existingPlan?.plannedStudents || 100,
    notes: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchDishes();
  }, []);

  const fetchDishes = async () => {
    try {
      const response = await api.get('/dishes');
      setDishes(response.data);
    } catch (error) {
      console.error('Failed to fetch dishes:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.post('/meal-plans', {
        weekStart: weekStart.toISOString(),
        day,
        meal,
        messFacilityId: facilityId,
        ...formData
      });
      toast.success('Meal plan saved successfully');
      onSuccess();
    } catch (error) {
      console.error('Failed to save meal plan:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDayName = (dayIndex: number) => {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    return days[dayIndex];
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-blue-50 p-4 rounded-lg">
        <h4 className="font-medium text-blue-900">
          Planning {meal} for {getDayName(day)}
        </h4>
        <p className="text-sm text-blue-700">
          {new Date(weekStart.getTime() + day * 24 * 60 * 60 * 1000).toLocaleDateString()}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Dish *
          </label>
          <select
            required
            value={formData.dishId}
            onChange={(e) => setFormData(prev => ({ ...prev, dishId: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select Dish</option>
            {dishes.map((dish: any) => (
              <option key={dish.id} value={dish.id}>
                {dish.name} {dish.category && `(${dish.category})`}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Planned Students *
          </label>
          <input
            type="number"
            required
            min="1"
            value={formData.plannedStudents}
            onChange={(e) => setFormData(prev => ({ ...prev, plannedStudents: parseInt(e.target.value) }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-6 border-t">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Save Meal Plan'}
        </button>
      </div>
    </form>
  );
};

export default MealPlanTab;