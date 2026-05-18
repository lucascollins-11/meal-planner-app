"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { RecipeDetail, SpoonacularMeal } from "@/lib/spoonacular";

const MEAL_LABELS = ["Breakfast", "Lunch", "Dinner", "Snack"];

interface Props {
  meal: SpoonacularMeal;
  recipe?: RecipeDetail;
  day: string;
  mealIndex: number;
  mealType: "breakfast" | "lunch" | "dinner" | "snack";
}

export function MealCard({ meal, recipe, day, mealIndex, mealType }: Props) {
  const [open, setOpen] = useState(false);
  const [swapping, setSwapping] = useState(false);
  const router = useRouter();

  const imageUrl = `https://img.spoonacular.com/recipes/${meal.id}-312x231.${meal.imageType || "jpg"}`;

  const nutrients = recipe?.nutrition?.nutrients ?? [];
  const calories = nutrients.find((n) => n.name === "Calories");
  const protein = nutrients.find((n) => n.name === "Protein");
  const carbs = nutrients.find((n) => n.name === "Carbohydrates");
  const fat = nutrients.find((n) => n.name === "Fat");

  async function swapMeal() {
    setSwapping(true);
    await fetch("/api/meal-plan/swap", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ day, mealIndex, mealType }),
    });
    setSwapping(false);
    router.refresh();
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      {/* Image */}
      <div className="relative h-44 bg-gray-100">
        <img
          src={imageUrl}
          alt={meal.title}
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).src = "https://via.placeholder.com/312x231?text=No+Image";
          }}
        />
        <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-xs font-bold text-green-700 px-2 py-1 rounded-full">
          {MEAL_LABELS[mealIndex] ?? "Meal"}
        </span>
      </div>

      {/* Body */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 leading-tight mb-2 line-clamp-2">{meal.title}</h3>

        {/* Quick stats */}
        <div className="flex gap-3 text-xs text-gray-500 mb-3">
          <span>⏱ {meal.readyInMinutes}m</span>
          <span>👤 {meal.servings} serving{meal.servings !== 1 ? "s" : ""}</span>
          {calories && <span>🔥 {Math.round(calories.amount)} kcal</span>}
        </div>

        {/* Macros */}
        {(protein || carbs || fat) && (
          <div className="flex gap-2 mb-3">
            {protein && (
              <span className="bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-full font-medium">
                P {Math.round(protein.amount)}g
              </span>
            )}
            {carbs && (
              <span className="bg-yellow-50 text-yellow-700 text-xs px-2 py-0.5 rounded-full font-medium">
                C {Math.round(carbs.amount)}g
              </span>
            )}
            {fat && (
              <span className="bg-orange-50 text-orange-700 text-xs px-2 py-0.5 rounded-full font-medium">
                F {Math.round(fat.amount)}g
              </span>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 mt-2">
          <button
            onClick={() => setOpen(!open)}
            className="flex-1 text-sm font-medium text-green-700 border border-green-200 hover:bg-green-50 py-2 rounded-lg transition-colors"
          >
            {open ? "Hide recipe" : "View recipe"}
          </button>
          <button
            onClick={swapMeal}
            disabled={swapping}
            className="text-sm font-medium text-gray-500 border border-gray-200 hover:bg-gray-50 px-3 py-2 rounded-lg transition-colors disabled:opacity-60"
            title="Swap this meal"
          >
            {swapping ? "…" : "↻"}
          </button>
        </div>

        {/* Recipe expandable */}
        {open && recipe && (
          <div className="mt-4 border-t border-gray-100 pt-4 space-y-4">
            {/* Ingredients */}
            <div>
              <h4 className="text-sm font-bold text-gray-900 mb-2">Ingredients</h4>
              <ul className="space-y-1">
                {recipe.extendedIngredients?.map((ing) => (
                  <li key={ing.id} className="text-xs text-gray-600 flex gap-2">
                    <span className="text-gray-400">•</span>
                    {ing.original}
                  </li>
                ))}
              </ul>
            </div>

            {/* Instructions */}
            {recipe.instructions && (
              <div>
                <h4 className="text-sm font-bold text-gray-900 mb-2">Instructions</h4>
                <div
                  className="text-xs text-gray-600 leading-relaxed prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: recipe.instructions }}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
