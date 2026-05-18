import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getIngredientList } from "@/lib/spoonacular";
import { getMondayOfCurrentWeek } from "@/lib/utils";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const weekStart = getMondayOfCurrentWeek();
  const stored = await prisma.mealPlan.findFirst({
    where: { userId: session.user.id, weekStart },
    orderBy: { createdAt: "desc" },
  });

  if (!stored) return NextResponse.json([]);

  const planData = JSON.parse(stored.planData);
  const days = Object.values(planData.week ?? {}) as { meals: { id: number }[] }[];
  const allIds = days.flatMap((d) => d.meals.map((m) => m.id));
  const uniqueIds = [...new Set(allIds)];

  const items = await getIngredientList(uniqueIds);
  return NextResponse.json(items);
}
