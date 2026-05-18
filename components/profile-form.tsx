"use client";

import { useState } from "react";
import { calculateTDEE } from "@/lib/spoonacular";

// ─── Options ──────────────────────────────────────────────────────────────────

const GENDER_OPTIONS = [
  { value: "male",   label: "Male",   icon: "♂️" },
  { value: "female", label: "Female", icon: "♀️" },
  { value: "other",  label: "Other",  icon: "⚧️" },
];

const DIET_OPTIONS = [
  { value: "",            label: "No restriction", icon: "🍽️" },
  { value: "vegetarian",  label: "Vegetarian",     icon: "🥦" },
  { value: "vegan",       label: "Vegan",          icon: "🌱" },
  { value: "gluten free", label: "Gluten-Free",    icon: "🌾" },
  { value: "ketogenic",   label: "Keto",           icon: "🥑" },
  { value: "paleo",       label: "Paleo",          icon: "🥩" },
  { value: "primal",      label: "Primal",         icon: "🍖" },
  { value: "whole30",     label: "Whole30",        icon: "🥕" },
];

const INTOLERANCE_OPTIONS = [
  "dairy","egg","gluten","grain","peanut",
  "seafood","sesame","shellfish","soy","sulfite","tree nut","wheat",
];

const GOAL_OPTIONS = [
  { value: "bulking",     label: "Bulking",       icon: "💪" },
  { value: "cutting",     label: "Cutting",       icon: "🔥" },
  { value: "maintaining", label: "Maintaining",   icon: "⚖️" },
  { value: "custom",      label: "Custom macros", icon: "🎯" },
];

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ProfilePrefs {
  heightCm?:       number | null;
  weightKg?:       number | null;
  age?:            number | null;
  gender?:         string | null;
  diet?:           string | null;
  intolerances?:   string | null;
  fitnessGoal?:    string | null;
  targetCalories?: number | null;
  targetProtein?:  number | null;
  targetCarbs?:    number | null;
  targetFat?:      number | null;
}

interface Props { initialPrefs: ProfilePrefs }

// ─── Helpers ─────────────────────────────────────────────────────────────────

function cmToFtIn(cm: number) {
  const totalIn = cm / 2.54;
  return { ft: Math.floor(totalIn / 12), inches: Math.round(totalIn % 12) };
}

const inputCls =
  "w-full border border-gray-200 rounded-lg px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500";

// ─── Component ────────────────────────────────────────────────────────────────

export function ProfileForm({ initialPrefs }: Props) {
  const p = initialPrefs;

  // Determine initial unit from stored data (default imperial)
  const [unit, setUnit] = useState<"imperial" | "metric">("imperial");

  // Height
  const initFt = p.heightCm ? cmToFtIn(p.heightCm) : { ft: "", inches: "" };
  const [heightFt,  setHeightFt]  = useState(String(initFt.ft ?? ""));
  const [heightIn,  setHeightIn]  = useState(String(initFt.inches ?? ""));
  const [heightCm,  setHeightCm]  = useState(p.heightCm ? String(Math.round(p.heightCm)) : "");

  // Weight
  const initLbs = p.weightKg ? Math.round(p.weightKg * 2.205) : "";
  const [weightLbs, setWeightLbs] = useState(String(initLbs));
  const [weightKg,  setWeightKg]  = useState(p.weightKg ? String(p.weightKg) : "");

  // Other stats
  const [gender, setGender] = useState(p.gender ?? "");
  const [age,    setAge]    = useState(p.age ? String(p.age) : "");

  // Diet
  const [diet,        setDiet]        = useState(p.diet ?? "");
  const [intolerances,setIntolerances]= useState<string[]>(
    p.intolerances ? p.intolerances.split(",").map(s => s.trim()).filter(Boolean) : []
  );

  // Goal & targets
  const [goal,           setGoal]           = useState(p.fitnessGoal ?? "");
  const [targetCalories, setTargetCalories] = useState(p.targetCalories ? String(p.targetCalories) : "");
  const [targetProtein,  setTargetProtein]  = useState(p.targetProtein  ? String(p.targetProtein)  : "");
  const [targetCarbs,    setTargetCarbs]    = useState(p.targetCarbs    ? String(p.targetCarbs)    : "");
  const [targetFat,      setTargetFat]      = useState(p.targetFat      ? String(p.targetFat)      : "");

  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [error,   setError]   = useState("");

  function toggleIntolerance(val: string) {
    setIntolerances(prev =>
      prev.includes(val) ? prev.filter(i => i !== val) : [...prev, val]
    );
  }

  function toMetricValues(): { heightCm: number; weightKg: number } | null {
    if (unit === "imperial") {
      const ft  = parseFloat(heightFt);
      const ins = parseFloat(heightIn) || 0;
      const lbs = parseFloat(weightLbs);
      if (isNaN(ft) || isNaN(lbs)) return null;
      return {
        heightCm: Math.round((ft * 12 + ins) * 2.54),
        weightKg: Math.round(lbs / 2.205 * 10) / 10,
      };
    } else {
      const cm = parseFloat(heightCm);
      const kg = parseFloat(weightKg);
      if (isNaN(cm) || isNaN(kg)) return null;
      return { heightCm: cm, weightKg: kg };
    }
  }

  function recalculateCalories(newGoal: string) {
    setGoal(newGoal);
    const metric = toMetricValues();
    const ageNum = parseInt(age);
    if (metric && !isNaN(ageNum) && gender) {
      const tdee = calculateTDEE({ ...metric, age: ageNum, gender }, newGoal);
      setTargetCalories(String(tdee));
    }
  }

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    setError("");
    try {
      const metric = toMetricValues();
      const res = await fetch("/api/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          heightCm:       metric?.heightCm,
          weightKg:       metric?.weightKg,
          age:            age ? parseInt(age) : undefined,
          gender:         gender  || undefined,
          diet:           diet    || undefined,
          intolerances:   intolerances.join(",") || undefined,
          fitnessGoal:    goal    || undefined,
          targetCalories: targetCalories ? Number(targetCalories) : undefined,
          targetProtein:  targetProtein  ? Number(targetProtein)  : undefined,
          targetCarbs:    targetCarbs    ? Number(targetCarbs)    : undefined,
          targetFat:      targetFat      ? Number(targetFat)      : undefined,
        }),
      });
      if (!res.ok) throw new Error("Failed to save");
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const tdeePreview = (() => {
    const metric = toMetricValues();
    const ageNum = parseInt(age);
    if (!metric || isNaN(ageNum) || !gender || !goal || goal === "custom") return null;
    return calculateTDEE({ ...metric, age: ageNum, gender }, goal);
  })();

  return (
    <div className="space-y-10">

      {/* ── Body Stats ── */}
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-1">Body stats</h2>
        <p className="text-sm text-gray-500 mb-6">Used to calculate your personal calorie needs (Mifflin-St Jeor BMR).</p>

        <div className="space-y-5">
          {/* Gender */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Biological sex <span className="text-gray-400 font-normal">(for BMR calculation)</span>
            </label>
            <div className="flex gap-3">
              {GENDER_OPTIONS.map(g => (
                <button
                  key={g.value}
                  onClick={() => setGender(g.value)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 transition-all text-sm font-medium ${
                    gender === g.value
                      ? "border-green-500 bg-green-50 text-green-700"
                      : "border-gray-200 text-gray-600 hover:border-gray-300"
                  }`}
                >
                  <span>{g.icon}</span> {g.label}
                </button>
              ))}
            </div>
          </div>

          {/* Age */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Age</label>
            <input
              type="number" min={13} max={120}
              value={age}
              onChange={e => setAge(e.target.value)}
              placeholder="e.g. 22"
              className={`${inputCls} max-w-[140px]`}
            />
          </div>

          {/* Unit toggle */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Units</label>
            <div className="inline-flex rounded-lg border border-gray-200 overflow-hidden">
              {(["imperial", "metric"] as const).map(u => (
                <button
                  key={u}
                  onClick={() => setUnit(u)}
                  className={`px-5 py-2 text-sm font-medium transition-colors ${
                    unit === u
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
            {unit === "imperial" ? (
              <div className="flex gap-3 items-center">
                <div className="flex items-center gap-2">
                  <input type="number" min={3} max={8} value={heightFt}
                    onChange={e => setHeightFt(e.target.value)}
                    placeholder="5" className={`${inputCls} w-24`} />
                  <span className="text-sm text-gray-500 font-medium">ft</span>
                </div>
                <div className="flex items-center gap-2">
                  <input type="number" min={0} max={11} value={heightIn}
                    onChange={e => setHeightIn(e.target.value)}
                    placeholder="10" className={`${inputCls} w-24`} />
                  <span className="text-sm text-gray-500 font-medium">in</span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <input type="number" min={100} max={250} value={heightCm}
                  onChange={e => setHeightCm(e.target.value)}
                  placeholder="178" className={`${inputCls} w-32`} />
                <span className="text-sm text-gray-500 font-medium">cm</span>
              </div>
            )}
          </div>

          {/* Weight */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Weight ({unit === "imperial" ? "lbs" : "kg"})
            </label>
            <div className="flex items-center gap-2">
              {unit === "imperial" ? (
                <input type="number" min={50} max={700} value={weightLbs}
                  onChange={e => setWeightLbs(e.target.value)}
                  placeholder="170" className={`${inputCls} w-32`} />
              ) : (
                <input type="number" min={20} max={300} value={weightKg}
                  onChange={e => setWeightKg(e.target.value)}
                  placeholder="77" className={`${inputCls} w-32`} />
              )}
              <span className="text-sm text-gray-500 font-medium">
                {unit === "imperial" ? "lbs" : "kg"}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Dietary style ── */}
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-1">Dietary style</h2>
        <p className="text-sm text-gray-500 mb-6">Filters every recipe in your plan.</p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {DIET_OPTIONS.map(opt => (
            <button key={opt.value} onClick={() => setDiet(opt.value)}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                diet === opt.value
                  ? "border-green-500 bg-green-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <span className="text-2xl">{opt.icon}</span>
              <span className="text-sm font-medium text-gray-700">{opt.label}</span>
            </button>
          ))}
        </div>

        <h3 className="text-sm font-semibold text-gray-700 mb-3">Allergies & intolerances</h3>
        <div className="flex flex-wrap gap-2">
          {INTOLERANCE_OPTIONS.map(val => (
            <button key={val} onClick={() => toggleIntolerance(val)}
              className={`px-4 py-2 rounded-full text-sm font-medium border transition-all capitalize ${
                intolerances.includes(val)
                  ? "bg-red-100 border-red-400 text-red-700"
                  : "border-gray-200 text-gray-600 hover:border-gray-300"
              }`}
            >
              {val}
            </button>
          ))}
        </div>
      </section>

      {/* ── Fitness goal ── */}
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-1">Fitness goal & daily targets</h2>
        <p className="text-sm text-gray-500 mb-6">
          Select a goal — your calories will auto-calculate from your body stats if provided.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {GOAL_OPTIONS.map(opt => (
            <button key={opt.value} onClick={() => recalculateCalories(opt.value)}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                goal === opt.value
                  ? "border-green-500 bg-green-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <span className="text-2xl">{opt.icon}</span>
              <span className="text-sm font-medium text-gray-700">{opt.label}</span>
            </button>
          ))}
        </div>

        {/* TDEE banner */}
        {tdeePreview && (
          <div className="mb-5 p-4 bg-green-50 rounded-xl border border-green-200 text-sm text-green-800">
            <span className="font-semibold">📊 Calculated daily target: </span>
            {tdeePreview} kcal
            {goal === "bulking"     && " (+400 kcal surplus for muscle gain)"}
            {goal === "cutting"     && " (−400 kcal deficit for fat loss)"}
            {goal === "maintaining" && " (maintenance calories)"}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          {[
            { label: "Calories (kcal)", val: targetCalories, set: setTargetCalories, ph: "e.g. 2200" },
            { label: "Protein (g)",     val: targetProtein,  set: setTargetProtein,  ph: "e.g. 150" },
            { label: "Carbs (g)",       val: targetCarbs,    set: setTargetCarbs,    ph: "e.g. 250" },
            { label: "Fat (g)",         val: targetFat,      set: setTargetFat,      ph: "e.g. 70"  },
          ].map(f => (
            <div key={f.label}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
              <input type="number" value={f.val}
                onChange={e => f.set(e.target.value)}
                placeholder={f.ph} className={inputCls} />
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-3">Leave blank to use Spoonacular defaults.</p>
      </section>

      {/* Save button */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-8 py-3 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white rounded-lg font-semibold transition-colors"
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
        {saved && (
          <span className="text-green-600 font-medium text-sm flex items-center gap-1">
            ✓ Saved successfully
          </span>
        )}
        {error && <span className="text-red-500 text-sm">{error}</span>}
      </div>
    </div>
  );
}
