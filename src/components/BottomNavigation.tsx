import React from "react";
import { Link, useLocation } from "../lib/router";
import { Home, Leaf, ShoppingCart, TrendingUp, User } from "./icons";
import { useGroceryList } from "../hooks/useGroceryList";

const TABS = [
  { to: "/mood", label: "Home", icon: Home, match: ["/mood", "/result", "/foods", "/meals", "/recipe"] },
  { to: "/grocery", label: "Grocery", icon: ShoppingCart, match: ["/grocery"] },
  { to: "/history", label: "History", icon: TrendingUp, match: ["/history"] },
  { to: "/wellness", label: "Wellness", icon: Leaf, match: ["/wellness", "/health", "/tracking", "/reminders", "/self-care", "/glossary", "/learn", "/nutrition-calculator"] },
  { to: "/profile", label: "Profile", icon: User, match: ["/profile", "/preferences", "/library"] },
];

export default function BottomNavigation() {
  const { pathname } = useLocation();
  const { items } = useGroceryList();
  const activeGroceryCount = items.filter((i) => !i.checked).length;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 mx-auto w-full max-w-app border-t border-slate-100 bg-white/95 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 shadow-nav backdrop-blur">
      <div className="flex items-center justify-around">
        {TABS.map(({ to, label, icon: Icon, match }) => {
          const isActive = match.some((m) => pathname === m || pathname.startsWith(m + "/"));
          return (
            <Link
              key={to}
              to={to}
              aria-current={isActive ? "page" : undefined}
              className={`relative flex w-16 flex-col items-center gap-1 rounded-2xl py-1.5 text-[11px] font-semibold transition-colors ${
                isActive ? "text-moodGreen-700" : "text-slate-500"
              }`}
            >
              <span
                className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors ${
                  isActive ? "bg-moodGreen-100" : ""
                }`}
              >
                <Icon size={20} strokeWidth={isActive ? 2.4 : 2} aria-hidden="true" />
              </span>
              {label}
              {to === "/grocery" && activeGroceryCount > 0 && (
                <span className="absolute right-2 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
                  {activeGroceryCount}
                  <span className="sr-only"> items to get</span>
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
