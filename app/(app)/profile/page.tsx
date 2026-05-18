import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ProfileForm } from "@/components/profile-form";

export default async function ProfilePage() {
  const session = await auth();
  const userId = session!.user!.id!;

  const prefs = await prisma.userPreferences.findUnique({
    where: { userId },
  });

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Profile & settings</h1>
        <p className="text-gray-500 mt-1">
          Update your body stats, dietary preferences, and nutrition targets. Changes apply to your next generated meal plan.
        </p>
      </div>
      <ProfileForm
        initialPrefs={{
          heightCm:       prefs?.heightCm       ?? null,
          weightKg:       prefs?.weightKg       ?? null,
          age:            prefs?.age            ?? null,
          gender:         prefs?.gender         ?? null,
          diet:           prefs?.diet           ?? null,
          intolerances:   prefs?.intolerances   ?? null,
          fitnessGoal:    prefs?.fitnessGoal    ?? null,
          targetCalories: prefs?.targetCalories ?? null,
          targetProtein:  prefs?.targetProtein  ?? null,
          targetCarbs:    prefs?.targetCarbs    ?? null,
          targetFat:      prefs?.targetFat      ?? null,
        }}
      />
    </div>
  );
}
