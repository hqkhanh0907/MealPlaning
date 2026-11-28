ALTER TABLE user_profile ADD COLUMN protein_target_mode TEXT NOT NULL DEFAULT 'manual'
         CHECK (protein_target_mode IN ('auto', 'manual'));

UPDATE user_profile SET protein_target_mode = 'auto'
         WHERE target_protein = ROUND(weight_kg * CASE goal
           WHEN 'lose_weight' THEN 2.2 WHEN 'gain_muscle' THEN 2.2
           WHEN 'performance' THEN 2.0 ELSE 1.6 END);

UPDATE user_profile SET target_protein = 0
         WHERE protein_target_mode = 'auto' AND (age < 18 OR target_protein NOT BETWEEN 20 AND 400);
