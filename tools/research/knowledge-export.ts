/**
 * Stage A knowledge-claim inventory (read-only). Lists every claim the app can
 * show, with its evidence and review origin. It changes nothing; flags are
 * observations for the owner's staged review, not decisions.
 */
import { NUTRIENTS, GOALS, FOOD_FACTS } from "../../src/data/knowledge";
import { FOODS } from "../../src/data/foods";
import { MEALS } from "../../src/data/meals";
import { RECIPES } from "../../src/data/recipes";
import { LESSONS } from "../../src/data/education";
import { TERMS } from "../../src/data/glossary";
import { EMOTIONS } from "../../src/data/emotions";
import { goalsForMood } from "../../src/lib/recommendations";
import { foodIdForIngredient } from "../../src/lib/catalog";
import type { Provenance } from "../../src/types/library";

type Origin = "user-approved" | "ai-assisted" | "unspecified";

interface Claim {
  id: string;
  claimType: string;
  subject: string;
  statement: string;
  published: boolean;
  reviewOrigin: Origin;
  evidence: {
    sourceTitle: string; sourceURL: string | null; pageOrSection: string | null;
    reviewedBy: string | null; evidenceStatus: string | null; reviewStatus: string | null;
  }[];
  flags: string[];
  /** Food and meal tags only: the catalog foods whose qualitative tag produces this claim. */
  foodIds?: string[];
}

function evidence(p: Provenance): Claim["evidence"][number] {
  return {
    sourceTitle: p.sourceTitle, sourceURL: p.sourceURL || null, pageOrSection: p.pageOrSection || null,
    reviewedBy: p.reviewedBy ?? null, evidenceStatus: p.evidenceStatus ?? null, reviewStatus: p.reviewStatus ?? null,
  };
}

function origin(sources: Provenance[]): Origin {
  // Prefer the explicit reviewOrigin field; fall back to the reviewer text for records without it.
  if (sources.some((s) => s.reviewOrigin === "owner-approved")) return "user-approved";
  if (sources.length && sources.every((s) => s.reviewOrigin === "ai-assisted")) return "ai-assisted";
  const by = sources.map((s) => s.reviewedBy ?? "");
  if (by.some((b) => /user-approved|user \(project owner\)/i.test(b))) return "user-approved";
  if (by.length && by.every((b) => /AI-assisted/i.test(b))) return "ai-assisted";
  return "unspecified";
}

function claim(id: string, claimType: string, subject: string, statement: string, published: boolean,
  sources: Provenance[], extraFlags: string[] = []): Claim {
  const o = origin(sources);
  const flags = [...extraFlags];
  if (!sources.length) flags.push("no-evidence");
  if (sources.some((s) => !s.sourceURL)) flags.push("empty-source-url");
  if (published && o === "ai-assisted") flags.push("published-with-ai-assisted-review-only");
  return { id, claimType, subject, statement, published, reviewOrigin: o, evidence: sources.map(evidence), flags };
}

export function buildKnowledge(provenance: { sourceCommit: string; dirtyTree: boolean }) {
  const claims: Claim[] = [];
  const nutrientUrl = (n: string) => NUTRIENTS[n]?.source.sourceURL;

  for (const [id, n] of Object.entries(NUTRIENTS))
    claims.push(claim(`nutrient:${id}`, "nutrient-definition", n.label, n.explanation,
      n.source.reviewStatus === "published", [n.source]));

  for (const [id, g] of Object.entries(GOALS))
    claims.push(claim(`goal:${id}`, "support-goal", g.label,
      `${g.explanation} Nutrients: ${g.nutrients.join(", ")}.`, true, g.sourceProvenance));

  // Mood-to-goal rules live in code. They are editorial framing, not nutrition claims. The owner's
  // review is recorded only in its packet, so the claim points there and says so.
  const moodReview = {
    sourceTitle: "Mood-to-goal rules review", sourceURL: null,
    pageOrSection: "docs/research/MOOD-GOAL-REVIEW.md, owner decisions (2026-11-04)",
    reviewedBy: "Project owner (decisions 1-4 approved, decision 5 not approved); packet prepared by Claude Code",
    evidenceStatus: null, reviewStatus: "published",
  };
  for (const e of EMOTIONS) {
    const low = goalsForMood(e.id, 5), high = goalsForMood(e.id, 10);
    claims.push({
      id: `mood-goal:${e.id}`, claimType: "mood-goal-mapping", subject: e.id,
      statement: `Intensity 1-7: ${low.join(", ")}; intensity 8-10: ${high.join(", ")}.`, published: true,
      reviewOrigin: "user-approved", evidence: [moodReview], flags: ["review-recorded-in-packet-only"],
    });
  }

  for (const [kind, items] of [["food", FOODS], ["meal", MEALS]] as const)
    for (const item of items)
      for (const fact of item.nutrientFacts) {
        claims.push(claim(`${kind}-nutrient:${item.id}:${fact.nutrientId}`,
          kind === "food" ? "food-nutrient" : "meal-nutrient-derived", item.name,
          `${item.name} is shown as a source of ${NUTRIENTS[fact.nutrientId]?.label ?? fact.nutrientId}.`,
          fact.reviewStatus === "published", fact.sourceProvenance,
          // Evidence is the nutrient's general fact sheet, not a record of this food's amount.
          fact.sourceProvenance.every((s) => s.sourceURL === nutrientUrl(fact.nutrientId))
            ? ["general-nutrient-source-only", "no-food-amount-or-threshold"] : []));
        // Same rule as catalog.ts: a meal inherits a tag from each ingredient whose food carries it.
        claims[claims.length - 1].foodIds = kind === "food" ? [item.id] : [...new Set(
          item.structuredIngredients.map((i) => foodIdForIngredient(i.name))
            .filter((f): f is string => !!f && (FOOD_FACTS[f] ?? []).includes(fact.nutrientId)))];
      }

  for (const r of RECIPES) {
    const recipeSources = r.sourceProvenance.filter((s) => s.claimType === "recipe" && s.author === "MoodMeal");
    claims.push(claim(`recipe:${r.id}`, "recipe", r.name, `Recipe ${r.name} (${r.servings} serving(s)).`,
      r.reviewStatus === "published", recipeSources));
    if (r.nutritionEstimate)
      claims.push(claim(`recipe-estimate:${r.id}`, "recipe-nutrition-estimate", r.name,
        `USDA-derived nutrition estimate (${r.nutritionEstimate.status}).`, true, r.nutritionEstimate.sources));
  }

  for (const l of LESSONS)
    claims.push(claim(`lesson:${l.id}`, "wellness-education", l.title, l.summary, true, l.sourceProvenance));

  // Glossary entries carry a URL plus a review record (origin, reviewer, date) since the glossary review.
  for (const t of TERMS) {
    const o: Origin = t.reviewOrigin === "owner-approved" ? "user-approved"
      : t.reviewOrigin === "ai-assisted" ? "ai-assisted" : "unspecified";
    claims.push({
      id: `glossary:${t.id}`, claimType: "glossary", subject: t.name, statement: t.definition, published: true,
      reviewOrigin: o,
      evidence: [{ sourceTitle: t.name, sourceURL: t.source || null, pageOrSection: null,
        reviewedBy: t.reviewedBy ?? null, evidenceStatus: null, reviewStatus: null }],
      flags: [...(t.reviewedBy ? [] : ["no-review-record"]), ...(t.source ? [] : ["empty-source-url"]),
        ...(o === "ai-assisted" ? ["published-with-ai-assisted-review-only"] : [])],
    });
  }

  return { kind: "moodmeal-knowledge-inventory", stage: "A (inventory only; no changes)", ...provenance,
    claimCount: claims.length, claims };
}
