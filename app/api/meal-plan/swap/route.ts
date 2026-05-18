import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { searchRecipes } from "@/lib/spoonacular";
import { getMondayOfCurrentWeek } from "@/lib/utils";
import { z } from "zod";

const schema = z.object({
  day: z.string(),
  mealIndex: z.number(),
  mealType: z.enum(["breakfast", "lunch", "dinner", "snack"]),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { day, mealIndex, mealType } = schema.parse(body);

    const prefs = await prisma.userPreferences.findUnique({
      where: { userId: session.user.id },
    });

    const typeMap: Record<string, string> = {
      breakfast: "breakfast",
      lunch: "main course",
      dinner: "main course",
      snack: "snack",
    };

    const results = await searchRecipes({
      diet: prefs?.diet ?? undefined,
      intolerances: prefs?.intolerances ?? undefined,
      maxCalories: prefs?.targetCalories
        ? Math.round(prefs.targetCalories / 3)
        : undefined,
      type: typeMap[mealType],
      number: 5,
    });

    if (!results.results.length) {
      return NextResponse.json({ error: "No replacement found" }, { status: 404 });
    }

    const replacement = results.results[Math.floor(Math.random() * results.results.length)];

    // Update stored plan
    const weekStart = getMondayOfCurrentWeek();
    const stored = await prisma.mealPlan.findFirst({
      where: { userId: session.user.id, weekStart },
      orderBy: { createdAt: "desc" },
    });

    if (stored) {
      const planData = JSON.parse(stored.planData);
      if (planData.week?.[day]?.meals?.[mealIndex] !== undefined) {
        planData.week[day].meals[mealIndex] = {
          id: replacement.id,
          title: replacement.title,
          imageType: "jpg",
          readyInMinutes: replacement.readyInMinutes,
          servings: replacement.servings,
        };
        planData.recipeDetails[replacement.id] = replacement;
      }
      await prisma.mealPlan.update({
        where: { id: stored.id },
        data: { planData: JSON.stringify(planData) },
      });
    }

    return NextResponse.json({ recipe: replacement });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
