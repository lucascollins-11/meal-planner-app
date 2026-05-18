import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NutriPlan — AI-Powered Meal Planning",
  description: "Personalized weekly meal plans, recipes, and shopping lists tailored to your goals.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col antialiased">{children}</body>
    </html>
  );
}
