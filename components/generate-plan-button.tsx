"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function GeneratePlanButton({ hasPlan }: { hasPlan: boolean }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function generate() {
    setLoading(true);
    await fetch("/api/meal-plan/generate", { method: "POST" });
    setLoading(false);
    router.refresh();
  }

  return (
    <button
      onClick={generate}
      disabled={loading}
      className="bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white px-5 py-2.5 rounded-lg font-semibold transition-colors"
    >
      {loading ? "Generating…" : hasPlan ? "Regenerate plan" : "Generate my plan"}
    </button>
  );
}
