"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const DIET_OPTIONS = [
  { value: "", label: "No restriction", icon: "🍽️" },
  { value: "vegetarian", label: "Vegetarian", icon: "🥦" },
  { value: "vegan", label: "Vegan", icon: "🌱" },
  { value: "gluten free", label: "Gluten-Free", icon: "🌾" },
  { value: "ketogenic", label: "Keto", icon: "🥑" },
  { value: "paleo", label: "Paleo", icon: "🥩" },
  { value: "primal", label: "Primal", icon: "🍖" },
  { value: "whole30", label: "Whole30", icon: "🥕" },
];

const INTOLERANCE_OPTIONS = [
  "dairy", "egg", "gluten", "grain", "peanut",
  "seafood", "sesame", "shellfish", "soy", "sulfite", "tree nut", "wheat",
];

const GOAL_OPTIONS = [
  { value: "bulking", label: "Bulking", desc: "Gain muscle mass with a calorie surplus", icon: "💪" },
  { value: "cutting", label: "Cutting", desc: "Lose fat while preserving muscle", icon: "🔥" },
  { value: "maintaining", label: "Maintaining", desc: "Stay at current weight and body composition", icon: "⚖️" },
  { value: "custom", label: "Custom macros", desc: "Set your own calorie and macro targets", icon: "🎯" },
];

const CALORIE_PRESETS: Record<string, number> = {
  bulking: 3000,
  cutting: 1800,
  maintaining: 2200,
};

interface FormState {
  diet: string;
  intolerances: string[];
  fitnessGoal: string;
  targetCalories: string;
  targetProtein: string;
  targetCarbs: string;
  targetFat: string;
}

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FormState>({
    diet: "",
    intolerances: [],
    fitnessGoal: "",
    targetCalories: "",
    targetProtein: "",
    targetCarbs: "",
    targetFat: "",
  });

  function toggleIntolerance(val: string) {
    setForm((f) => ({
      ...f,
      intolerances: f.intolerances.includes(val)
        ? f.intolerances.filter((i) => i !== val)
        : [...f.intolerances, val],
    }));
  }

  function selectGoal(val: string) {
    const cal = CALORIE_PRESETS[val] ?? "";
    setForm((f) => ({ ...f, fitnessGoal: val, targetCalories: String(cal) }));
  }

  async function handleFinish() {
    setSaving(true);
    await fetch("/api/preferences", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        diet: form.diet || undefined,
        intolerances: form.intolerances.join(",") || undefined,
        fitnessGoal: form.fitnessGoal || undefined,
        targetCalories: form.targetCalories ? Number(form.targetCalories) : undefined,
        targetProtein: form.targetProtein ? Number(form.targetProtein) : undefined,
        targetCarbs: form.targetCarbs ? Number(form.targetCarbs) : undefined,
        targetFat: form.targetFat ? Number(form.targetFat) : undefined,
        onboardingDone: true,
      }),
    });
    router.push("/dashboard");
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-green-50 to-white px-4 py-12">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <span className="text-3xl font-bold text-green-600">🥗 NutriPlan</span>
          <h1 className="text-2xl font-bold text-gray-900 mt-4">Set up your profile</h1>
          <p className="text-gray-500 mt-1">Step {step} of 3 — takes about 1 minute</p>
          {/* Progress bar */}
          <div className="mt-4 w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-green-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8">
          {/* Step 1 — Diet */}
          {step === 1 && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Dietary style</h2>
              <p className="text-gray-500 text-sm mb-6">Choose the eating style that best fits you. You can always change this later.</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {DIET_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setForm((f) => ({ ...f, diet: opt.value }))}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                      form.diet === opt.value
                        ? "border-green-500 bg-green-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <span className="text-2xl">{opt.icon}</span>
                    <span className="text-sm font-medium text-gray-700">{opt.label}</span>
                  </button>
                ))}
              </div>

              <h2 className="text-xl font-bold text-gray-900 mt-8 mb-2">Allergies & intolerances</h2>
              <p className="text-gray-500 text-sm mb-4">Select all that apply — we'll exclude these from every recipe.</p>
              <div className="flex flex-wrap gap-2">
                {INTOLERANCE_OPTIONS.map((val) => (
                  <button
                    key={val}
                    onClick={() => toggleIntolerance(val)}
                    className={`px-4 py-2 rounded-full text-sm font-medium border transition-all capitalize ${
                      form.intolerances.includes(val)
                        ? "bg-red-100 border-red-400 text-red-700"
                        : "border-gray-200 text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    {val}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2 — Fitness goal */}
          {step === 2 && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Fitness goal</h2>
              <p className="text-gray-500 text-sm mb-6">This helps us set appropriate calorie and macro targets for your meals.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {GOAL_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => selectGoal(opt.value)}
                    className={`flex items-start gap-4 p-5 rounded-xl border-2 text-left transition-all ${
                      form.fitnessGoal === opt.value
                        ? "border-green-500 bg-green-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <span className="text-3xl">{opt.icon}</span>
                    <div>
                      <div className="font-semibold text-gray-900">{opt.label}</div>
                      <div className="text-sm text-gray-500 mt-1">{opt.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3 — Calorie / Macro targets */}
          {step === 3 && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Daily targets</h2>
              <p className="text-gray-500 text-sm mb-6">
                {form.fitnessGoal !== "custom"
                  ? "We've pre-filled sensible defaults based on your goal. Adjust as needed or leave blank to let Spoonacular decide."
                  : "Enter your custom daily nutrition targets."}
              </p>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: "Calories (kcal)", key: "targetCalories", placeholder: "e.g. 2200" },
                  { label: "Protein (g)", key: "targetProtein", placeholder: "e.g. 150" },
                  { label: "Carbs (g)", key: "targetCarbs", placeholder: "e.g. 250" },
                  { label: "Fat (g)", key: "targetFat", placeholder: "e.g. 70" },
                ].map((field) => (
                  <div key={field.key}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
                    <input
                      type="number"
                      value={form[field.key as keyof FormState] as string}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, [field.key]: e.target.value }))
                      }
                      placeholder={field.placeholder}
                      className="w-full border border-gray-200 rounded-lg px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-4">
                All fields are optional. Leave blank to use Spoonacular's default recommendations.
              </p>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-8">
            {step > 1 ? (
              <button
                onClick={() => setStep((s) => s - 1)}
                className="px-6 py-3 border border-gray-200 rounded-lg text-gray-700 font-medium hover:border-gray-300 transition-colors"
              >
                Back
              </button>
            ) : (
              <div />
            )}
            {step < 3 ? (
              <button
                onClick={() => setStep((s) => s + 1)}
                className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors"
              >
                Continue
              </button>
            ) : (
              <button
                onClick={handleFinish}
                disabled={saving}
                className="px-6 py-3 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white rounded-lg font-semibold transition-colors"
              >
                {saving ? "Saving…" : "Go to my dashboard"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
