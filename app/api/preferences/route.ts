import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  // Body stats
  heightCm: z.number().positive().optional(),
  weightKg: z.number().positive().optional(),
  age: z.number().int().min(13).max(120).optional(),
  gender: z.enum(["male", "female", "other"]).optional(),
  // Diet & goals
  diet: z.string().optional(),
  intolerances: z.string().optional(),
  fitnessGoal: z.string().optional(),
  targetCalories: z.number().optional(),
  targetProtein: z.number().optional(),
  targetCarbs: z.number().optional(),
  targetFat: z.number().optional(),
  mealsPerDay: z.number().min(2).max(6).default(3),
  cuisines: z.string().optional(),
  excludedIngredients: z.string().optional(),
  onboardingDone: z.boolean().optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const prefs = await prisma.userPreferences.findUnique({
    where: { userId: session.user.id },
  });
  return NextResponse.json(prefs ?? {});
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const data = schema.parse(body);

    const prefs = await prisma.userPreferences.upsert({
      where: { userId: session.user.id },
      update: data,
      create: { userId: session.user.id, ...data },
    });
    return NextResponse.json(prefs);
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
