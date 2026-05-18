import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="flex flex-col min-h-screen">
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-4 bg-white border-b border-gray-100 shadow-sm">
        <span className="text-2xl font-bold text-green-600">🥗 NutriPlan</span>
        <div className="flex gap-4">
          <Link href="/login" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">
            Sign in
          </Link>
          <Link
            href="/register"
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Get started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-4 py-24 bg-gradient-to-b from-green-50 to-white">
        <span className="bg-green-100 text-green-700 text-sm font-semibold px-4 py-1 rounded-full mb-6 inline-block">
          Personalized nutrition, zero guesswork
        </span>
        <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 leading-tight max-w-3xl mb-6">
          Your perfect meal plan,{" "}
          <span className="text-green-600">built around you</span>
        </h1>
        <p className="text-xl text-gray-500 max-w-2xl mb-10">
          NutriPlan generates a personalized weekly menu based on your dietary preferences, fitness
          goals, and allergies — complete with recipes and a ready-to-shop ingredient list.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href="/register"
            className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-xl text-lg font-semibold shadow-lg shadow-green-200 transition-all hover:scale-105"
          >
            Start for free
          </Link>
          <Link
            href="/login"
            className="border border-gray-200 hover:border-gray-300 bg-white text-gray-700 px-8 py-4 rounded-xl text-lg font-semibold transition-colors"
          >
            Sign in
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Everything you need to eat well
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((f) => (
              <div
                key={f.title}
                className="p-6 rounded-2xl border border-gray-100 bg-gray-50 hover:shadow-md transition-shadow"
              >
                <div className="text-4xl mb-4">{f.icon}</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 text-center text-gray-400 text-sm border-t border-gray-100">
        © {new Date().getFullYear()} NutriPlan. Built for healthy living.
      </footer>
    </main>
  );
}

const features = [
  {
    icon: "🗓️",
    title: "7-Day Meal Plans",
    description:
      "Get a full week of breakfast, lunch, and dinner suggestions tailored to your taste and goals — regenerate any meal you don't like.",
  },
  {
    icon: "🛒",
    title: "Auto Shopping List",
    description:
      "All ingredients across your weekly plan are aggregated into a single, organized shopping list. Just grab and go.",
  },
  {
    icon: "🎯",
    title: "Goal-Aware Nutrition",
    description:
      "Whether you're bulking, cutting, or hitting specific macros, NutriPlan filters recipes to match your daily targets.",
  },
  {
    icon: "🚫",
    title: "Allergy & Diet Filters",
    description:
      "Set your dietary style (vegan, keto, paleo…) and intolerances (gluten, dairy, nuts…) and every recipe will respect them.",
  },
  {
    icon: "📖",
    title: "Full Recipes Included",
    description:
      "Every meal comes with step-by-step instructions, ingredient amounts, and nutrition info — no searching required.",
  },
  {
    icon: "⌚",
    title: "Oura Ring Integration",
    description:
      "Coming soon: connect your Oura ring to let NutriPlan adapt your calorie targets based on your sleep and activity trends.",
  },
];
