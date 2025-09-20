/*
  # Add meal times configuration and order status updates

  1. System Configuration
    - Add meal time configurations for admin control
    - Add order status defaults

  2. Order Status Updates
    - Update default order status to PREPARED for pre-cooked food
    - Add meal attendance default to true

  3. Notification Enhancements
    - Add meal plan reference to notifications for rating navigation
*/

-- Add meal time configurations
INSERT INTO system_config (key, value, category) VALUES
('breakfast_start', '07:30', 'meal_times'),
('breakfast_end', '09:30', 'meal_times'),
('lunch_start', '12:00', 'meal_times'),
('lunch_end', '14:00', 'meal_times'),
('snacks_start', '16:00', 'meal_times'),
('snacks_end', '17:30', 'meal_times'),
('dinner_start', '19:00', 'meal_times'),
('dinner_end', '21:00', 'meal_times')
ON CONFLICT (key) DO NOTHING;

-- Add meal plan reference to notifications
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS meal_plan_id TEXT;

-- Add foreign key constraint for meal plan
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'notifications_meal_plan_id_fkey'
  ) THEN
    ALTER TABLE notifications ADD CONSTRAINT notifications_meal_plan_id_fkey 
    FOREIGN KEY (meal_plan_id) REFERENCES meal_plans(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Update default order status to PREPARED for pre-cooked food
UPDATE orders SET status = 'PREPARED' WHERE status = 'CONFIRMED' AND payment_status = 'PAID';

-- Add completed status to indent enum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'IndentStatus' AND e.enumlabel = 'COMPLETED') THEN
    ALTER TYPE "IndentStatus" ADD VALUE 'COMPLETED';
  END IF;
END $$;