import Link from "next/link";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { SignOutButton } from "@/components/sign-out-button";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <nav className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <Link href="/dashboard" className="text-xl font-bold text-green-600">
            🥗 NutriPlan
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
              Dashboard
            </Link>
            <Link href="/meal-plan" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
              Meal Plan
            </Link>
            <Link href="/shopping-list" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
              Shopping List
            </Link>
            <Link href="/onboarding" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
              Preferences
            </Link>
            <SignOutButton />
          </div>
        </div>
      </nav>
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-8">{children}</main>
    </div>
  );
}
