import React from "react";
import { ArrowLeft } from "./icons";
import { useGoBack } from "../lib/router";

interface HeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  right?: React.ReactNode;
}

export default function Header({ title, subtitle, showBack = true, right }: HeaderProps) {
  const goBack = useGoBack();
  return (
    <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-slate-100 bg-white/90 px-4 py-3.5 backdrop-blur">
      {showBack ? (
        <button
          onClick={goBack}
          aria-label="Go back"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-700 transition-transform active:scale-90"
        >
          <ArrowLeft size={18} />
        </button>
      ) : (
        <div className="w-9" />
      )}
      <div className="min-w-0 flex-1">
        <h1 className="truncate font-display text-base font-bold text-slate-900">{title}</h1>
        {subtitle && <p className="truncate text-xs text-slate-400">{subtitle}</p>}
      </div>
      {right ?? <div className="w-9" />}
    </header>
  );
}
