"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { calculateTDEE } from "@/lib/spoonacular";

// ─── Constants ───────────────────────────────────────────────────────────────

const GENDER_OPTIONS = [
  { value: "male",   label: "Male",   icon: "♂️" },
  { value: "female", label: "Female", icon: "♀️" },
  { value: "other",  label: "Other",  icon: "⚧️" },
];

const DIET_OPTIONS = [
  { value: "",           label: "No restriction", icon: "🍽️" },
  { value: "vegetarian", label: "Vegetarian",      icon: "🥦" },
  { value: "vegan",      label: "Vegan",           icon: "🌱" },
  { value: "gluten free",label: "Gluten-Free",     icon: "🌾" },
  { value: "ketogenic",  label: "Keto",            icon: "🥑" },
  { value: "paleo",      label: "Paleo",           icon: "🥩" },
  { value: "primal",     label: "Primal",          icon: "🍖" },
  { value: "whole30",    label: "Whole30",         icon: "🥕" },
];

const INTOLERANCE_OPTIONS = [
  "dairy","egg","gluten","grain","peanut",
  "seafood","sesame","shellfish","soy","sulfite","tree nut","wheat",
];

const GOAL_OPTIONS = [
  { value: "bulking",    label: "Bulking",       desc: "Gain muscle mass with a calorie surplus",       icon: "💪" },
  { value: "cutting",    label: "Cutting",        desc: "Lose fat while preserving muscle",              icon: "🔥" },
  { value: "maintaining",label: "Maintaining",   desc: "Stay at current weight and body composition",   icon: "⚖️" },
  { value: "custom",     label: "Custom macros", desc: "Set your own calorie and macro targets",        icon: "🎯" },
];

const TOTAL_STEPS = 4;

// ─── Form state ───────────────────────────────────────────────────────────────

interface FormState {
  // Step 1 — body stats
  gender: string;
  age: string;
  unit: "imperial" | "metric";
  heightFt: string;
  heightIn: string;
  heightCm: string;
  weight: string; // lbs when imperial, kg when metric

  // Step 2 — diet
  diet: string;
  intolerances: string[];

  // Step 3 — goal
  fitnessGoal: string;

  // Step 4 — targets
  targetCalories: string;
  targetProtein: string;
  targetCarbs: string;
  targetFat: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Convert form body stats to metric for storage & TDEE calc */
function toMetric(form: FormState): { heightCm: number; weightKg: number } | null {
  if (form.unit === "imperial") {
    const ft = parseFloat(form.heightFt);
    const inches = parseFloat(form.heightIn) || 0;
    const lbs = parseFloat(form.weight);
    if (isNaN(ft) || isNaN(lbs)) return null;
    return {
      heightCm: Math.round((ft * 12 + inches) * 2.54),
      weightKg: Math.round(lbs / 2.205 * 10) / 10,
    };
  } else {
    const cm = parseFloat(form.heightCm);
    const kg = parseFloat(form.weight);
    if (isNaN(cm) || isNaN(kg)) return null;
    return { heightCm: cm, weightKg: kg };
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FormState>({
    gender: "",
    age: "",
    unit: "imperial",
    heightFt: "",
    heightIn: "",
    heightCm: "",
    weight: "",
    diet: "",
    intolerances: [],
    fitnessGoal: "",
    targetCalories: "",
    targetProtein: "",
    targetCarbs: "",
    targetFat: "",
  });

  function set(key: keyof FormState, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function toggleIntolerance(val: string) {
    setForm((f) => ({
      ...f,
      intolerances: f.intolerances.includes(val)
        ? f.intolerances.filter((i) => i !== val)
        : [...f.intolerances, val],
    }));
  }

  function selectGoal(val: string) {
    const metric = toMetric(form);
    const age = parseInt(form.age);
    let cal = "";

    if (metric && !isNaN(age) && form.gender) {
      const tdee = calculateTDEE(
        { ...metric, age, gender: form.gender },
        val
      );
      cal = String(tdee);
    }

    setForm((f) => ({
      ...f,
      fitnessGoal: val,
      targetCalories: cal || f.targetCalories,
    }));
  }

  async function handleFinish() {
    setSaving(true);
    const metric = toMetric(form);
    const age = parseInt(form.age) || undefined;

    await fetch("/api/preferences", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        heightCm: metric?.heightCm,
        weightKg: metric?.weightKg,
        age,
        gender: form.gender || undefined,
        diet: form.diet || undefined,
        intolerances: form.intolerances.join(",") || undefined,
        fitnessGoal: form.fitnessGoal || undefined,
        targetCalories: form.targetCalories ? Number(form.targetCalories) : undefined,
        targetProtein:  form.targetProtein  ? Number(form.targetProtein)  : undefined,
        targetCarbs:    form.targetCarbs    ? Number(form.targetCarbs)    : undefined,
        targetFat:      form.targetFat      ? Number(form.targetFat)      : undefined,
        onboardingDone: true,
      }),
    });
    router.push("/dashboard");
  }

  const inputCls =
    "w-full border border-gray-200 rounded-lg px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500";

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-green-50 to-white px-4 py-12">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <span className="text-3xl font-bold text-green-600">🥗 NutriPlan</span>
          <h1 className="text-2xl font-bold text-gray-900 mt-4">Set up your profile</h1>
          <p className="text-gray-500 mt-1">Step {step} of {TOTAL_STEPS} — takes about 2 minutes</p>
          <div className="mt-4 w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-green-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8">

          {/* ── Step 1: Body stats ── */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-1">About you</h2>
                <p className="text-gray-500 text-sm">
                  We use your stats to calculate your personal calorie needs using the Mifflin-St Jeor formula.
                </p>
              </div>

              {/* Gender */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Biological sex <span className="text-gray-400 font-normal">(used for BMR calculation)</span></label>
                <div className="grid grid-cols-3 gap-3">
                  {GENDER_OPTIONS.map((g) => (
                    <button
                      key={g.value}
                      onClick={() => set("gender", g.value)}
                      className={`flex flex-col items-center gap-1 py-4 rounded-xl border-2 transition-all ${
                        form.gender === g.value
                          ? "border-green-500 bg-green-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <span className="text-2xl">{g.icon}</span>
                      <span className="text-sm font-medium text-gray-700">{g.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Age */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Age</label>
                <input
                  type="number"
                  min={13} max={120}
                  value={form.age}
                  onChange={(e) => set("age", e.target.value)}
                  placeholder="e.g. 22"
                  className={`${inputCls} max-w-[160px]`}
                />
              </div>

              {/* Unit toggle */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Units</label>
                <div className="inline-flex rounded-lg border border-gray-200 overflow-hidden">
                  {(["imperial", "metric"] as const).map((u) => (
                    <button
                      key={u}
                      onClick={() => set("unit", u)}
                      className={`px-5 py-2 text-sm font-medium transition-colors capitalize ${
                        form.unit === u
                          ? "bg-green-600 text-white"
                          : "bg-white text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      {u === "imperial" ? "Imperial (ft, lbs)" : "Metric (cm, kg)"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Height */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Height</label>
                {form.unit === "imperial" ? (
                  <div className="flex gap-3 items-center">
                    <div className="flex items-center gap-2">
                      <input
                        type="number" min={3} max={8}
                        value={form.heightFt}
                        onChange={(e) => set("heightFt", e.target.value)}
                        placeholder="5"
                        className={`${inputCls} w-24`}
                      />
                      <span className="text-gray-500 text-sm font-medium">ft</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number" min={0} max={11}
                        value={form.heightIn}
                        onChange={(e) => set("heightIn", e.target.value)}
                        placeholder="10"
                        className={`${inputCls} w-24`}
                      />
                      <span className="text-gray-500 text-sm font-medium">in</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <input
                      type="number" min={100} max={250}
                      value={form.heightCm}
                      onChange={(e) => set("heightCm", e.target.value)}
                      placeholder="178"
                      className={`${inputCls} w-32`}
                    />
                    <span className="text-gray-500 text-sm font-medium">cm</span>
                  </div>
                )}
              </div>

              {/* Weight */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Weight ({form.unit === "imperial" ? "lbs" : "kg"})
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number" min={50} max={700}
                    value={form.weight}
                    onChange={(e) => set("weight", e.target.value)}
                    placeholder={form.unit === "imperial" ? "170" : "77"}
                    className={`${inputCls} w-32`}
                  />
                  <span className="text-gray-500 text-sm font-medium">
                    {form.unit === "imperial" ? "lbs" : "kg"}
                  </span>
                </div>
              </div>

              <p className="text-xs text-gray-400">
                All fields on this page are optional — skip if you prefer not to share.
              </p>
            </div>
          )}

          {/* ── Step 2: Dietary style ── */}
          {step === 2 && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Dietary style</h2>
              <p className="text-gray-500 text-sm mb-6">Choose the eating style that best fits you.</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {DIET_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => set("diet", opt.value)}
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
              <p className="text-gray-500 text-sm mb-4">Select all that apply — we&apos;ll exclude these from every recipe.</p>
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

          {/* ── Step 3: Fitness goal ── */}
          {step === 3 && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Fitness goal</h2>
              <p className="text-gray-500 text-sm mb-6">
                {toMetric(form)
                  ? "We'll calculate your personal calorie target using your stats."
                  : "This helps us set appropriate calorie and macro targets for your meals."}
              </p>
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

          {/* ── Step 4: Daily targets ── */}
          {step === 4 && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Daily targets</h2>
              <p className="text-gray-500 text-sm mb-6">
                {form.targetCalories
                  ? "Targets calculated from your body stats. Adjust as needed."
                  : "Enter your daily nutrition targets, or leave blank for Spoonacular defaults."}
              </p>

              {form.targetCalories && toMetric(form) && (
                <div className="mb-5 p-4 bg-green-50 rounded-xl border border-green-200 text-sm text-green-800">
                  <span className="font-semibold">📊 Calculated from your stats: </span>
                  {form.targetCalories} kcal/day
                  {form.fitnessGoal === "bulking"  && " (+400 kcal surplus)"}
                  {form.fitnessGoal === "cutting"  && " (−400 kcal deficit)"}
                  {form.fitnessGoal === "maintaining" && " (maintenance)"}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: "Calories (kcal)", key: "targetCalories", placeholder: "e.g. 2200" },
                  { label: "Protein (g)",     key: "targetProtein",  placeholder: "e.g. 150"  },
                  { label: "Carbs (g)",        key: "targetCarbs",    placeholder: "e.g. 250"  },
                  { label: "Fat (g)",          key: "targetFat",      placeholder: "e.g. 70"   },
                ].map((field) => (
                  <div key={field.key}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
                    <input
                      type="number"
                      value={form[field.key as keyof FormState] as string}
                      onChange={(e) => set(field.key as keyof FormState, e.target.value)}
                      placeholder={field.placeholder}
                      className={inputCls}
                    />
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-4">
                All fields are optional.
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
            {step < TOTAL_STEPS ? (
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
                {saving ? "Saving…" : "Go to my dashboard →"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
