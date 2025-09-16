import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Plus, Trash2, ChefHat } from 'lucide-react';
import api from '../../utils/api';
import { showSuccess, showError } from '../../utils/sweetAlert';

interface MealPlanFormProps {
  messFacilityId: string;
  day: number;
  meal: 'BREAKFAST' | 'LUNCH' | 'SNACKS' | 'DINNER';
  existingPlan?: any;
  onSuccess: () => void;
  onCancel: () => void;
}

interface MealPlanFormData {
  dishes: Array<{
    dishId: string;
    sequenceOrder: number;
    isMainDish: boolean;
  }>;
  plannedStudents: number;
}

const MealPlanForm: React.FC<MealPlanFormProps> = ({ 
  messFacilityId,
  day, 
  meal, 
  existingPlan, 
  onSuccess, 
  onCancel 
}) => {
  const [dishes, setDishes] = useState([]);
  const [selectedDishes, setSelectedDishes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<MealPlanFormData>({
    defaultValues: existingPlan ? {
      dishes: existingPlan.dishes || [{ dishId: '', sequenceOrder: 1, isMainDish: true }],
      plannedStudents: existingPlan.plannedStudents
    } : {
      dishes: [{ dishId: '', sequenceOrder: 1, isMainDish: true }],
      plannedStudents: 100
    }
  });

  const watchedDishes = watch('dishes');
  const watchedStudents = watch('plannedStudents');

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

  const addDish = () => {
    const newDishes = [...watchedDishes, { 
      dishId: '', 
      sequenceOrder: watchedDishes.length + 1, 
      isMainDish: false 
    }];
    setValue('dishes', newDishes);
  };

  const removeDish = (index: number) => {
    const newDishes = watchedDishes.filter((_, i) => i !== index);
    setValue('dishes', newDishes);
  };

  const updateDish = (index: number, field: string, value: any) => {
    const newDishes = [...watchedDishes];
    newDishes[index] = { ...newDishes[index], [field]: value };
    setValue('dishes', newDishes);
  };

  const calculateTotalCost = () => {
    return watchedDishes.reduce((total, dishItem) => {
      const dish = dishes.find((d: any) => d.id === dishItem.dishId);
      if (dish) {
        const costPer5 = parseFloat(dish.costPer5Students || '0');
        return total + ((costPer5 / 5) * watchedStudents);
      }
      return total;
    }, 0);
  };

  const onSubmit = async (data: MealPlanFormData) => {
    setLoading(true);
    try {
      await api.post('/meal-plans', {
        messFacilityId,
        day,
        meal,
        ...data
      });
      showSuccess('Success', 'Meal plan saved successfully');
      onSuccess();
    } catch (error) {
      console.error('Failed to save meal plan:', error);
      showError('Error', 'Failed to save meal plan');
    } finally {
      setLoading(false);
    }
  };

  const getDayName = (dayIndex: number) => {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    return days[dayIndex];
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="bg-blue-50 p-4 rounded-lg">
        <h4 className="font-medium text-blue-900">
          Planning {meal} for {getDayName(day)}
        </h4>
        <p className="text-sm text-blue-700">Day {day} of the week (Monday = 0)</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Planned Students *
          </label>
          <input
            type="number"
            {...register('plannedStudents', { 
              required: 'Number of students is required',
              valueAsNumber: true,
              min: 1
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="100"
          />
          {errors.plannedStudents && (
            <p className="mt-1 text-sm text-red-600">{errors.plannedStudents.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Estimated Total Cost
          </label>
          <div className="w-full px-3 py-2 bg-green-50 border border-green-200 rounded-lg">
            <span className="text-lg font-bold text-green-700">₹{calculateTotalCost().toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Dishes Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Dishes for this Meal</h3>
          <button
            type="button"
            onClick={addDish}
            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-lg flex items-center space-x-1 text-sm"
          >
            <Plus size={16} />
            <span>Add Dish</span>
          </button>
        </div>

        <div className="space-y-4">
          {watchedDishes.map((dishItem, index) => {
            const selectedDish = dishes.find((d: any) => d.id === dishItem.dishId);
            return (
              <div key={index} className="grid grid-cols-12 gap-4 items-end p-4 bg-gray-50 rounded-lg">
                <div className="col-span-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dish *
                  </label>
                  <select
                    value={dishItem.dishId}
                    onChange={(e) => updateDish(index, 'dishId', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select Dish</option>
                    {dishes.map((dish: any) => (
                      <option key={dish.id} value={dish.id}>
                        {dish.name} {dish.category && `(${dish.category})`}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Order
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={dishItem.sequenceOrder}
                    onChange={(e) => updateDish(index, 'sequenceOrder', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Main Dish
                  </label>
                  <div className="flex items-center justify-center">
                    <input
                      type="checkbox"
                      checked={dishItem.isMainDish}
                      onChange={(e) => updateDish(index, 'isMainDish', e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </div>
                </div>

                <div className="col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cost
                  </label>
                  <p className="text-sm font-medium text-green-600 py-2">
                    {selectedDish ? `₹${((parseFloat(selectedDish.costPer5Students || '0') / 5) * watchedStudents).toFixed(2)}` : '₹0'}
                  </p>
                </div>

                <div className="col-span-1">
                  {watchedDishes.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeDish(index)}
                      className="text-red-600 hover:text-red-800 p-2"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-6 border-t">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Save Meal Plan'}
        </button>
      </div>
    </form>
  );
};

export default MealPlanForm;