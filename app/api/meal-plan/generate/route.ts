import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { generateWeeklyMealPlan, generateWeeklyMealPlanWithFocus, getRecipesBulk } from "@/lib/spoonacular";
import { getMondayOfCurrentWeek } from "@/lib/utils";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const prefs = await prisma.userPreferences.findUnique({
    where: { userId: session.user.id },
  });

  try {
    const focusIngredients = prefs?.focusIngredients
      ? prefs.focusIngredients.split(",").map((s) => s.trim()).filter(Boolean)
      : [];

    const commonParams = {
      diet:           prefs?.diet            ?? undefined,
      intolerances:   prefs?.intolerances    ?? undefined,
      targetCalories: prefs?.targetCalories  ?? undefined,
      exclude:        prefs?.excludedIngredients ?? undefined,
    };

    const plan = focusIngredients.length > 0
      ? await generateWeeklyMealPlanWithFocus({ ...commonParams, focusIngredients })
      : await generateWeeklyMealPlan(commonParams);

    // Collect all meal IDs to fetch full recipe details.
    // For focus plans, recipes are already enriched; for standard plans we bulk-fetch.
    const days = Object.values(plan.week);
    const allIds = days.flatMap((d) => d.meals.map((m) => m.id));
    const uniqueIds = [...new Set(allIds)];
    const recipes = await getRecipesBulk(uniqueIds);
    const recipeMap = Object.fromEntries(recipes.map((r) => [r.id, r]));

    const enrichedPlan = {
      ...plan,
      recipeDetails: recipeMap,
    };

    const weekStart = getMondayOfCurrentWeek();

    await prisma.mealPlan.upsert({
      where: {
        // composite workaround: find by userId + weekStart
        id: (
          await prisma.mealPlan.findFirst({
            where: { userId: session.user.id, weekStart },
            select: { id: true },
          })
        )?.id ?? "new",
      },
      update: { planData: JSON.stringify(enrichedPlan) },
      create: {
        userId: session.user.id,
        weekStart,
        planData: JSON.stringify(enrichedPlan),
      },
    });

    return NextResponse.json(enrichedPlan);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to generate meal plan" }, { status: 500 });
  }
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const weekStart = getMondayOfCurrentWeek();
  const plan = await prisma.mealPlan.findFirst({
    where: { userId: session.user.id, weekStart },
    orderBy: { createdAt: "desc" },
  });

  if (!plan) return NextResponse.json(null);
  return NextResponse.json(JSON.parse(plan.planData));
}
