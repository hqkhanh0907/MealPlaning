SELECT id,name,description,type,source,servings,image_url,meal_tag,is_favorite,created_at,updated_at,
       total_calories / recipe_yield AS total_calories,
       total_protein / recipe_yield AS total_protein,
       total_carbs / recipe_yield AS total_carbs,
       total_fat / recipe_yield AS total_fat,
       total_fiber / recipe_yield AS total_fiber
FROM (
    SELECT d.*, CASE WHEN servings > 0 THEN servings ELSE 1.0 END AS recipe_yield
    FROM dish_with_totals d
)
