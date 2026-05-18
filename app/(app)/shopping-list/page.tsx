import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getMondayOfCurrentWeek } from "@/lib/utils";
import { getIngredientList } from "@/lib/spoonacular";
import { ShoppingListClient } from "@/components/shopping-list-client";

export default async function ShoppingListPage() {
  const session = await auth();
  const userId = session!.user!.id!;

  const stored = await prisma.mealPlan.findFirst({
    where: { userId, weekStart: getMondayOfCurrentWeek() },
    orderBy: { createdAt: "desc" },
  });

  if (!stored) {
    return (
      <div className="text-center py-20">
        <div className="text-5xl mb-4">🛒</div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">No plan yet</h2>
        <p className="text-gray-500">Generate a meal plan first to see your shopping list.</p>
      </div>
    );
  }

  const planData = JSON.parse(stored.planData);
  const days = Object.values(planData.week ?? {}) as { meals: { id: number }[] }[];
  const allIds = days.flatMap((d) => d.meals.map((m) => m.id));
  const uniqueIds = [...new Set(allIds)];
  const items = await getIngredientList(uniqueIds);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Shopping List</h1>
        <p className="text-gray-500 mt-1">
          {items.length} ingredients for this week's meal plan
        </p>
      </div>
      <ShoppingListClient items={items} />
    </div>
  );
}
