import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getMondayOfCurrentWeek } from "@/lib/utils";
import Link from "next/link";
import { GeneratePlanButton } from "@/components/generate-plan-button";

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

export default async function DashboardPage() {
  const session = await auth();
  const userId = session!.user!.id!;

  const [prefs, latestPlan] = await Promise.all([
    prisma.userPreferences.findUnique({ where: { userId } }),
    prisma.mealPlan.findFirst({
      where: { userId, weekStart: getMondayOfCurrentWeek() },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const plan = latestPlan ? JSON.parse(latestPlan.planData) : null;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Hey {session!.user!.name?.split(" ")[0]} 👋
          </h1>
          <p className="text-gray-500 mt-1">Here's your week at a glance</p>
        </div>
        <GeneratePlanButton hasPlan={!!plan} />
      </div>

      {/* Stats row */}
      {prefs && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Goal", value: prefs.fitnessGoal ? capitalize(prefs.fitnessGoal) : "Not set" },
            { label: "Daily Calories", value: prefs.targetCalories ? `${prefs.targetCalories} kcal` : "Auto" },
            { label: "Protein Target", value: prefs.targetProtein ? `${prefs.targetProtein}g` : "Auto" },
            { label: "Diet Style", value: prefs.diet ? capitalize(prefs.diet) : "None" },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <div className="text-xs text-gray-400 font-medium uppercase tracking-wide">{s.label}</div>
              <div className="text-lg font-bold text-gray-900 mt-1">{s.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Weekly overview */}
      {plan ? (
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">This week's plan</h2>
          <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
            {DAYS.map((day) => {
              const dayData = plan.week?.[day];
              const meals: { id: number; title: string }[] = dayData?.meals ?? [];
              return (
                <div key={day} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                  <div className="text-xs font-bold text-green-600 uppercase tracking-wide mb-3">
                    {day.slice(0, 3)}
                  </div>
                  <div className="space-y-2">
                    {meals.slice(0, 3).map((m, i) => (
                      <div key={i} className="text-xs text-gray-700 leading-tight truncate" title={m.title}>
                        {m.title}
                      </div>
                    ))}
                  </div>
                  {dayData?.nutrients && (
                    <div className="mt-3 pt-3 border-t border-gray-50 text-xs text-gray-400">
                      {Math.round(dayData.nutrients.calories)} kcal
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div className="mt-6 flex gap-4">
            <Link
              href="/meal-plan"
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              View full plan & recipes
            </Link>
            <Link
              href="/shopping-list"
              className="border border-gray-200 hover:border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              Shopping list
            </Link>
          </div>
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="text-5xl mb-4">🍽️</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">No meal plan yet</h2>
          <p className="text-gray-500 mb-6">Generate your personalized weekly plan to get started.</p>
          <GeneratePlanButton hasPlan={false} />
        </div>
      )}
    </div>
  );
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
