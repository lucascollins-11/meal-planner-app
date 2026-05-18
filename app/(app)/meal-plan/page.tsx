import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getMondayOfCurrentWeek, formatDate } from "@/lib/utils";
import { MealCard } from "@/components/meal-card";
import { GeneratePlanButton } from "@/components/generate-plan-button";
import type { RecipeDetail, SpoonacularMeal } from "@/lib/spoonacular";

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

export default async function MealPlanPage() {
  const session = await auth();
  const userId = session!.user!.id!;

  const stored = await prisma.mealPlan.findFirst({
    where: { userId, weekStart: getMondayOfCurrentWeek() },
    orderBy: { createdAt: "desc" },
  });

  const plan = stored ? JSON.parse(stored.planData) : null;
  const recipeDetails: Record<number, RecipeDetail> = plan?.recipeDetails ?? {};

  const monday = getMondayOfCurrentWeek();

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Weekly Meal Plan</h1>
          <p className="text-gray-500 mt-1">Week of {formatDate(monday)}</p>
        </div>
        <GeneratePlanButton hasPlan={!!plan} />
      </div>

      {plan ? (
        <div className="space-y-10">
          {DAYS.map((day, i) => {
            const dayData = plan.week?.[day];
            const meals: SpoonacularMeal[] = dayData?.meals ?? [];
            const dayDate = new Date(monday);
            dayDate.setDate(monday.getDate() + i);

            return (
              <div key={day}>
                <div className="flex items-center gap-3 mb-4">
                  <h2 className="text-xl font-bold text-gray-900 capitalize">{day}</h2>
                  <span className="text-sm text-gray-400">{formatDate(dayDate)}</span>
                  {dayData?.nutrients && (
                    <span className="ml-auto text-sm text-gray-500">
                      {Math.round(dayData.nutrients.calories)} kcal ·{" "}
                      {Math.round(dayData.nutrients.protein)}g protein ·{" "}
                      {Math.round(dayData.nutrients.carbohydrates)}g carbs ·{" "}
                      {Math.round(dayData.nutrients.fat)}g fat
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {meals.map((meal, idx) => (
                    <MealCard
                      key={meal.id}
                      meal={meal}
                      recipe={recipeDetails[meal.id]}
                      day={day}
                      mealIndex={idx}
                      mealType={idx === 0 ? "breakfast" : idx === 1 ? "lunch" : "dinner"}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="text-5xl mb-4">📋</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">No plan generated yet</h2>
          <p className="text-gray-500 mb-6">Click below to generate your personalized weekly meal plan.</p>
          <GeneratePlanButton hasPlan={false} />
        </div>
      )}
    </div>
  );
}
