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

export interface BodyStats {
  heightCm: number;
  weightKg: number;
  age: number;
  gender: string; // "male" | "female" | "other"
}

/**
 * Mifflin-St Jeor BMR → TDEE (moderate activity 1.55×),
 * then adjusts for fitness goal.
 */
export function calculateTDEE(stats: BodyStats, fitnessGoal?: string): number {
  const { heightCm, weightKg, age, gender } = stats;
  const bmr =
    gender === "male"
      ? 10 * weightKg + 6.25 * heightCm - 5 * age + 5
      : 10 * weightKg + 6.25 * heightCm - 5 * age - 161;

  const tdee = Math.round(bmr * 1.55); // moderate activity

  switch (fitnessGoal) {
    case "bulking":  return tdee + 400;
    case "cutting":  return tdee - 400;
    default:         return tdee; // maintaining / custom
  }
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

// ─── Focus-ingredient weekly plan ─────────────────────────────────────────────

const DAYS = ["monday","tuesday","wednesday","thursday","friday","saturday","sunday"] as const;

/**
 * Build a weekly meal plan biased toward the given focus ingredients.
 * Uses complexSearch with includeIngredients so Spoonacular returns recipes
 * that actually contain those proteins/items. Assembles the same week
 * structure as generateWeeklyMealPlan so the rest of the app is unchanged.
 */
export async function generateWeeklyMealPlanWithFocus(params: {
  focusIngredients: string[];
  diet?:            string;
  intolerances?:    string;
  targetCalories?:  number;
  exclude?:         string;
}): Promise<SpoonacularWeekPlan> {
  const { focusIngredients, diet, intolerances, targetCalories, exclude } = params;

  const baseSearch = {
    diet,
    intolerances,
    addRecipeInformation: "true",
    addRecipeNutrition:   "true",
    ...(exclude ? { excludeIngredients: exclude } : {}),
    ...(targetCalories
      ? {
          minCalories: String(Math.round(targetCalories * 0.25)),
          maxCalories: String(Math.round(targetCalories * 0.45)),
        }
      : {}),
  };

  // ── 1. Fetch breakfast pool (7 slots) ──────────────────────────────────────
  const breakfastRes = await fetch(
    `${BASE_URL}/recipes/complexSearch?${buildQuery({
      ...baseSearch,
      type:   "breakfast",
      number: "14",
    })}`
  );
  const breakfastData = breakfastRes.ok ? await breakfastRes.json() : { results: [] };
  const breakfastPool: RecipeDetail[] = breakfastData.results ?? [];

  // ── 2. Fetch main-course pool per focus ingredient (14 lunch+dinner slots) ─
  const mainPool: RecipeDetail[] = [];
  const seenIds = new Set<number>();

  // Distribute slots evenly across focus ingredients
  const perIngredient = Math.ceil(28 / focusIngredients.length);

  for (const ingredient of focusIngredients) {
    const res = await fetch(
      `${BASE_URL}/recipes/complexSearch?${buildQuery({
        ...baseSearch,
        includeIngredients: ingredient,
        type:               "main course",
        number:             String(perIngredient),
        sort:               "popularity",
      })}`
    );
    if (!res.ok) continue;
    const data = await res.json();
    for (const r of data.results ?? []) {
      if (!seenIds.has(r.id)) {
        seenIds.add(r.id);
        mainPool.push(r);
      }
    }
  }

  // ── 3. Fetch side-dish pool to pair with mains ─────────────────────────────
  const sidePool: RecipeDetail[] = [];
  const sideSeen = new Set<number>();

  for (const ingredient of focusIngredients) {
    const res = await fetch(
      `${BASE_URL}/recipes/complexSearch?${buildQuery({
        ...baseSearch,
        includeIngredients: ingredient,
        type:               "side dish",
        number:             "10",
      })}`
    );
    if (!res.ok) continue;
    const data = await res.json();
    for (const r of data.results ?? []) {
      if (!sideSeen.has(r.id) && !seenIds.has(r.id)) {
        sideSeen.add(r.id);
        sidePool.push(r);
      }
    }
  }

  // ── 4. Shuffle pools ───────────────────────────────────────────────────────
  const shuffle = <T>(arr: T[]): T[] =>
    [...arr].sort(() => Math.random() - 0.5);

  const breakfasts = shuffle(breakfastPool);
  const mains      = shuffle(mainPool);
  const sides      = shuffle(sidePool);

  // ── 5. Assemble 7-day week ─────────────────────────────────────────────────
  function toMeal(r: RecipeDetail): SpoonacularMeal {
    return {
      id:             r.id,
      title:          r.title,
      imageType:      "jpg",
      readyInMinutes: r.readyInMinutes ?? 30,
      servings:       r.servings       ?? 2,
    };
  }

  function getNutrient(r: RecipeDetail, name: string): number {
    const n = r.nutrition?.nutrients?.find(
      (x) => x.name.toLowerCase() === name.toLowerCase()
    );
    return n?.amount ?? 0;
  }

  const week: SpoonacularWeekPlan["week"] = {} as SpoonacularWeekPlan["week"];

  for (let i = 0; i < 7; i++) {
    const day = DAYS[i];
    const breakfast = breakfasts[i % breakfasts.length];
    const main      = mains[i % mains.length];
    // Pair a side dish every other day (avoids repetition)
    const side      = i % 2 === 0 && sides.length > 0 ? sides[Math.floor(i / 2) % sides.length] : null;

    const dayMeals = [breakfast, main, ...(side ? [side] : [])].filter(Boolean) as RecipeDetail[];

    const totalCal  = dayMeals.reduce((s, r) => s + getNutrient(r, "Calories"),      0);
    const totalProt = dayMeals.reduce((s, r) => s + getNutrient(r, "Protein"),        0);
    const totalFat  = dayMeals.reduce((s, r) => s + getNutrient(r, "Fat"),            0);
    const totalCarb = dayMeals.reduce((s, r) => s + getNutrient(r, "Carbohydrates"),  0);

    week[day] = {
      meals: dayMeals.map(toMeal),
      nutrients: {
        calories:       Math.round(totalCal),
        protein:        Math.round(totalProt),
        fat:            Math.round(totalFat),
        carbohydrates:  Math.round(totalCarb),
      },
    };
  }

  return { week };
}
