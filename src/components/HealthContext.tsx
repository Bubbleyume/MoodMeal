import { Link } from "../lib/router";
export default function HealthContext() {
  return (
    <aside className="mb-4 rounded-2xl bg-brand-50 p-3 text-xs text-slate-600">
      <div className="flex items-center justify-between gap-3">
        <p className="font-semibold text-brand-800">
          Make these picks more personal
        </p>
        <Link
          className="shrink-0 py-2 text-brand-700 underline"
          to="/preferences"
        >
          Food preferences
        </Link>
      </div>
      <p>Diet, allergens, time and the foods you enjoy.</p>
    </aside>
  );
}
