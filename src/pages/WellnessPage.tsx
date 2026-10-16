import { Link } from "../lib/router";
import Header from "../components/Header";
import { LESSONS } from "../data/education";
import { useLocalStorage } from "../hooks/useLocalStorage";
import type { Candidate } from "../types/library";
import { canPublish } from "../lib/libraryReview";
export default function WellnessPage() {
  const [library] = useLocalStorage<Candidate[]>("moodmeal:library", []);
  return (
    <div className="mm-soft-bg flex h-full flex-1 flex-col">
      <Header
        title="Food & wellness"
        subtitle="Learn, explore and build your own routines"
      />
      <div className="screen-scroll space-y-3 px-4 pt-4">
        <p className="text-sm text-slate-600">
          Food, sleep, activity and connection all have a place in self-care.
        </p>
        <Link className="card block ring-2 ring-brand-100" to="/nutrition-calculator">
          <h2 className="font-bold">Nutrition Calculator</h2>
          <p className="mt-1 text-sm text-slate-500">
            Estimate calories, protein, carbs, fat, fiber and sugars for your own
            recipe from USDA-reviewed ingredients.
          </p>
        </Link>
        {LESSONS.map((l) => (
          <Link className="card block" key={l.id} to={`/learn/${l.id}`}>
            <h2 className="font-bold">{l.title}</h2>
            <p className="mt-1 text-sm text-slate-500">{l.summary}</p>
          </Link>
        ))}
        <Link className="card block" to="/glossary">
          <h2 className="font-bold">Food & Wellness Glossary</h2>
          <p className="mt-1 text-sm text-slate-500">
            Understand the terms on your food cards.
          </p>
        </Link>
        {library
          .filter(
            (c) => c.reviewStatus === "published" && canPublish(c).length === 0,
          )
          .map((c) => (
            <Link className="card block" key={c.id} to={`/learn/${c.id}`}>
              <h2 className="font-bold">{c.title}</h2>
              <p className="mt-1 text-xs text-slate-500">
                From your reviewed local library
              </p>
            </Link>
          ))}
        <details className="card">
          <summary className="font-semibold">Personal tools</summary>
          <p className="my-3 text-xs text-slate-500">
            Your existing records remain on this device. These tools do not
            recommend medicines or prescribe a diet.
          </p>
          {[
            ["health", "Health notes"],
            ["reminders", "Your medicine & vitamin reminders"],
            ["tracking", "Your health measurements"],
            ["self-care", "Self-care practices"],
          ].map(([id, label]) => (
            <Link
              className="block py-3 text-sm text-brand-700 underline"
              key={id}
              to={`/${id}`}
            >
              {label}
            </Link>
          ))}
        </details>
        <p className="text-xs text-slate-500">
          Your records and imported library stay in this browser. Export library
          work before clearing local data.
        </p>
      </div>
    </div>
  );
}
