import { useState } from "react";
import { Link } from "../lib/router";
import { NUTRIENTS, GOALS } from "../data/knowledge";
import type { Provenance, GoalId } from "../types/library";
import type { Food, Meal } from "../types";
import type { RecipeNutritionEstimate } from "../types/nutrition";
import { explainPick, nutrientDisplay } from "../lib/recommendations";
export function Sources({ sources }: { sources: Provenance[] }) {
  const unique = sources.filter(
    (s, i) =>
      sources.findIndex(
        (t) =>
          t.sourceTitle === s.sourceTitle &&
          t.pageOrSection === s.pageOrSection,
      ) === i,
  );
  return (
    <details className="mt-3 text-xs text-slate-600">
      <summary className="cursor-pointer font-semibold text-brand-700">
        Sources & review notes
      </summary>
      <div className="mt-2 space-y-3">
        {unique.map((s, i) => (
          <div key={i}>
            <p className="font-semibold">{s.sourceTitle}</p>
            <p>
              {s.author}
              {s.edition ? ` · ${s.edition}` : ""}
            </p>
            <p>{s.pageOrSection}</p>
            {s.sourceURL && /^https?:\/\//.test(s.sourceURL) && (
              <a
                className="text-brand-700 underline"
                href={s.sourceURL}
                target="_blank"
                rel="noreferrer"
              >
                Read source ↗
              </a>
            )}
            <p>
              {s.evidenceStatus.replace(/-/g, " ")} ·{" "}
              {s.reviewStatus.replace(/-/g, " ")}
            </p>
            {s.reviewedDate && (
              <p>
                Checked {s.reviewedDate} · {s.reviewedBy}
              </p>
            )}
          </div>
        ))}
        <p>
          Sources support the stated facts; they do not establish that a food
          changes your mood. Food composition varies with variety, portion and
          preparation.
        </p>
      </div>
    </details>
  );
}
export function NutrientChips({ ids }: { ids: string[] }) {
  const [active, setActive] = useState<string | null>(null);
  const n = active ? NUTRIENTS[active] : null;
  return (
    <div className="mt-3">
      <div className="flex flex-wrap gap-2">
        {ids
          .filter((id) => NUTRIENTS[id])
          .map((id) => (
            <button
              key={id}
              className="chip min-h-[36px]"
              aria-expanded={active === id}
              onClick={() => setActive(active === id ? null : id)}
            >
              {NUTRIENTS[id].label} ⓘ
            </button>
          ))}
      </div>
      {n && (
        <div className="mt-2 rounded-xl bg-brand-50 p-3 text-sm" role="status">
          <p className="font-semibold">{n.label}</p>
          <p>{n.explanation}</p>
          <Sources sources={[n.source]} />
          <Link
            className="mt-2 inline-block text-brand-700 underline"
            to={`/glossary/${active}`}
          >
            Read glossary entry
          </Link>
        </div>
      )}
    </div>
  );
}
export function PickExplanation({
  item,
  goals = ["balanced-nutrition"],
  nutritionEstimate,
}: {
  item: Food | Meal;
  goals?: GoalId[];
  nutritionEstimate?: RecipeNutritionEstimate | null;
}) {
  const explanation = explainPick(item, goals, nutritionEstimate);
  const { matched, otherVerified } = nutrientDisplay(item, goals);
  return (
    <>
      {matched.length > 0 && <NutrientChips ids={matched} />}
      {otherVerified.length > 0 && (
        <div className="mt-3" data-testid="other-verified-nutrients">
          <p className="text-xs text-slate-500">
            Other verified nutrients, not matched to your{" "}
            {goals.map((g) => GOALS[g].label).join(" / ")} picks:
          </p>
          <NutrientChips ids={otherVerified} />
        </div>
      )}
      <div className="mt-3 text-sm">
        <h4 className="font-semibold">
          {"ingredients" in item ? "Why this meal?" : "Why this pick?"}
        </h4>
        <p className="mt-1 text-slate-600">{explanation}</p>
      </div>
      <Sources
        sources={[
          ...item.sourceProvenance,
          ...goals.flatMap((g) => GOALS[g].sourceProvenance),
        ]}
      />
    </>
  );
}
