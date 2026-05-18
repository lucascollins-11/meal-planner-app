const BASE_URL = "https://api.spoonacular.com";
const API_KEY = process.env.SPOONACULAR_API_KEY!;

export interface SpoonacularMealPlanDay {
  meals: SpoonacularMeal[];
  nutrients: {
    calories: number;
    protein: number;
    fat: number;
    carbohydrates: number;
  };
}

export interface SpoonacularMeal {
  id: number;
  title: string;
  imageType: string;
  readyInMinutes: number;
  servings: number;
}

export interface SpoonacularWeekPlan {
  week: {
    monday: SpoonacularMealPlanDay;
    tuesday: SpoonacularMealPlanDay;
    wednesday: SpoonacularMealPlanDay;
    thursday: SpoonacularMealPlanDay;
    friday: SpoonacularMealPlanDay;
    saturday: SpoonacularMealPlanDay;
    sunday: SpoonacularMealPlanDay;
  };
}

export interface RecipeDetail {
  id: number;
  title: string;
  image: string;
  readyInMinutes: number;
  servings: number;
  summary: string;
  instructions: string;
  extendedIngredients: {
    id: number;
    name: string;
    amount: number;
    unit: string;
    original: string;
  }[];
  nutrition?: {
    nutrients: { name: string; amount: number; unit: string }[];
  };
}

export interface ShoppingListItem {
  name: string;
  amount: number;
  unit: string;
  aisle: string;
}

export interface PreferenceParams {
  diet?: string;
  intolerances?: string;
  targetCalories?: number;
  targetProtein?: number;
  targetCarbs?: number;
  targetFat?: number;
  exclude?: string;
}

function buildQuery(params: Record<string, string | number | undefined>): string {
  const q = new URLSearchParams({ apiKey: API_KEY });
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== "") q.set(k, String(v));
  }
  return q.toString();
}

export async function generateWeeklyMealPlan(prefs: PreferenceParams): Promise<SpoonacularWeekPlan> {
  const params: Record<string, string | number | undefined> = {
    timeFrame: "week",
    diet: prefs.diet,
    exclude: prefs.exclude,
  };

  if (prefs.targetCalories) params.targetCalories = prefs.targetCalories;

  const res = await fetch(`${BASE_URL}/mealplanner/generate?${buildQuery(params)}`);
  if (!res.ok) throw new Error(`Spoonacular generateWeeklyMealPlan failed: ${res.status}`);
  return res.json();
}

export async function getRecipeDetails(id: number): Promise<RecipeDetail> {
  const res = await fetch(
    `${BASE_URL}/recipes/${id}/information?${buildQuery({ includeNutrition: "true" })}`
  );
  if (!res.ok) throw new Error(`Spoonacular getRecipeDetails failed: ${res.status}`);
  return res.json();
}

export async function getRecipesBulk(ids: number[]): Promise<RecipeDetail[]> {
  if (ids.length === 0) return [];
  const res = await fetch(
    `${BASE_URL}/recipes/informationBulk?${buildQuery({ ids: ids.join(","), includeNutrition: "true" })}`
  );
  if (!res.ok) throw new Error(`Spoonacular getRecipesBulk failed: ${res.status}`);
  return res.json();
}

export async function searchRecipes(params: {
  query?: string;
  diet?: string;
  intolerances?: string;
  maxCalories?: number;
  minProtein?: number;
  maxCarbs?: number;
  type?: string;
  number?: number;
}): Promise<{ results: RecipeDetail[]; totalResults: number }> {
  const res = await fetch(
    `${BASE_URL}/recipes/complexSearch?${buildQuery({ ...params, addRecipeInformation: "true", addRecipeNutrition: "true", number: params.number ?? 10 })}`
  );
  if (!res.ok) throw new Error(`Spoonacular searchRecipes failed: ${res.status}`);
  return res.json();
}

export async function getIngredientList(recipeIds: number[]): Promise<ShoppingListItem[]> {
  // Aggregate ingredients from bulk recipe fetch
  const recipes = await getRecipesBulk(recipeIds);
  const aggregated = new Map<string, ShoppingListItem>();

  for (const recipe of recipes) {
    for (const ing of recipe.extendedIngredients ?? []) {
      const key = ing.name.toLowerCase();
      if (aggregated.has(key)) {
        aggregated.get(key)!.amount += ing.amount;
      } else {
        aggregated.set(key, {
          name: ing.name,
          amount: ing.amount,
          unit: ing.unit,
          aisle: "Grocery",
        });
      }
    }
  }

  return Array.from(aggregated.values()).sort((a, b) => a.name.localeCompare(b.name));
}

export function getMealImage(meal: SpoonacularMeal): string {
  return `https://img.spoonacular.com/recipes/${meal.id}-312x231.${meal.imageType}`;
}
