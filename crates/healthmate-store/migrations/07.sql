ALTER TABLE user_profile ADD COLUMN calorie_target_mode TEXT NOT NULL DEFAULT 'manual'
         CHECK (calorie_target_mode IN ('auto', 'manual'));

UPDATE user_profile SET calorie_target_mode = 'auto'
         WHERE target_calories < 800 OR target_calories = ROUND(tdee + CASE goal
           WHEN 'lose_weight' THEN -500 WHEN 'gain_muscle' THEN 300 WHEN 'performance' THEN 200 ELSE 0 END);

UPDATE user_profile SET target_calories = 0
         WHERE calorie_target_mode = 'auto' AND (
           age NOT BETWEEN 19 AND 78 OR target_calories <= 1200 OR target_calories > 6000 OR
           (goal = 'lose_weight' AND weight_kg * 10000 <= 18.5 * height_cm * height_cm));

UPDATE user_profile SET bmr = 0, tdee = 0 WHERE age NOT BETWEEN 19 AND 78;
