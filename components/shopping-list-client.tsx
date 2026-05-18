"use client";

import { useState } from "react";
import type { ShoppingListItem } from "@/lib/spoonacular";

export function ShoppingListClient({ items }: { items: ShoppingListItem[] }) {
  const [checked, setChecked] = useState<Set<string>>(new Set());

  function toggle(name: string) {
    setChecked((prev) => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  }

  const remaining = items.filter((i) => !checked.has(i.name));
  const done = items.filter((i) => checked.has(i.name));

  return (
    <div className="max-w-2xl">
      {/* Progress */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-6">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>{checked.size} of {items.length} items checked off</span>
          {checked.size > 0 && (
            <button
              onClick={() => setChecked(new Set())}
              className="text-red-500 hover:text-red-700 text-xs font-medium"
            >
              Reset all
            </button>
          )}
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2">
          <div
            className="bg-green-500 h-2 rounded-full transition-all"
            style={{ width: `${(checked.size / items.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Remaining items */}
      {remaining.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-4">
          <h2 className="font-bold text-gray-900 mb-4">To buy ({remaining.length})</h2>
          <ul className="space-y-3">
            {remaining.map((item) => (
              <li
                key={item.name}
                className="flex items-center gap-3 cursor-pointer group"
                onClick={() => toggle(item.name)}
              >
                <div className="w-5 h-5 rounded border-2 border-gray-300 group-hover:border-green-500 flex items-center justify-center flex-shrink-0 transition-colors" />
                <span className="text-gray-800 capitalize">{item.name}</span>
                <span className="ml-auto text-sm text-gray-400">
                  {item.amount % 1 === 0 ? item.amount : item.amount.toFixed(1)}{" "}
                  {item.unit}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Checked items */}
      {done.length > 0 && (
        <div className="bg-gray-50 rounded-xl border border-gray-100 p-6">
          <h2 className="font-bold text-gray-400 mb-4">In cart ({done.length})</h2>
          <ul className="space-y-3">
            {done.map((item) => (
              <li
                key={item.name}
                className="flex items-center gap-3 cursor-pointer group"
                onClick={() => toggle(item.name)}
              >
                <div className="w-5 h-5 rounded border-2 border-green-500 bg-green-500 flex items-center justify-center flex-shrink-0">
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-gray-400 line-through capitalize">{item.name}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {checked.size === items.length && items.length > 0 && (
        <div className="text-center py-8">
          <div className="text-4xl mb-2">🎉</div>
          <p className="text-gray-600 font-medium">All done! Happy cooking.</p>
        </div>
      )}
    </div>
  );
}
