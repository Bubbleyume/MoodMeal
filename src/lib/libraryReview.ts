import type {
  Candidate,
  ClaimType,
  Provenance,
  ReviewStatus,
} from "../types/library";
export const REVIEW_STATUSES: ReviewStatus[] = [
  "draft",
  "needs-review",
  "reviewed",
  "published",
  "rejected",
];
export function flagsFor(text: string): string[] {
  const flags: string[] = [];
  if (
    /cur(e|es|ing)|treat(s|ment)?|antidepressant|stimulant|detox|banish|reduc(e|es).{0,25}(anxiety|depression)|insomnia|medication/i.test(
      text,
    )
  )
    flags.push("Medical or treatment claim");
  if (
    /supplement|dosage|\b\d+\s*(mg|mcg|iu)\b|5.htp|amino.acid therapy/i.test(
      text,
    )
  )
    flags.push("Supplement or dose recommendation");
  return flags;
}
const topics: [RegExp, string, ClaimType][] = [
  [
    /protein|fiber|vitamin|iron|magnesium|omega.?3|calcium/i,
    "Nutrient facts to verify",
    "food-nutrient",
  ],
  [
    /sleep|energy|focus|attention|mood|anxiety|depression/i,
    "Possible support-goal relationship",
    "support-goal",
  ],
  [
    /recipe|ingredients|tablespoon|teaspoon|\bcup\b|salad|smoothie/i,
    "Recipe or meal concept",
    "recipe",
  ],
  [
    /gut|digestion|sensitivity|diet|kitchen|hydration/i,
    "Food and wellness concept",
    "wellness-education",
  ],
];
export function extractCandidates(
  units: { location: string; text: string }[],
  provenance: Provenance,
): Candidate[] {
  const result: Candidate[] = [];
  const foods = [
    "salmon",
    "oats",
    "spinach",
    "beef",
    "eggs",
    "walnuts",
    "almonds",
    "berries",
    "yogurt",
    "milk",
    "quinoa",
    "rice",
    "banana",
    "orange",
    "carrot",
    "chickpea",
    "lentil",
    "sweet potato",
    "turkey",
    "chard",
    "pumpkin seeds",
    "chia",
    "tofu",
  ];
  const nutrients = [
    "protein",
    "fiber",
    "vitamin B12",
    "B12",
    "vitamin C",
    "iron",
    "magnesium",
    "calcium",
    "omega-3",
    "potassium",
    "carbohydrates",
  ];
  const goals = [
    "energy",
    "calm",
    "focus",
    "attention",
    "sleep",
    "hydration",
    "mood",
  ];
  const termsIn = (text: string, terms: string[]) =>
    terms.filter((t) => new RegExp("\\b" + t + "\\b", "i").test(text));
  for (const unit of units) {
    for (const [re, label, type] of topics) {
      const matches = unit.text.match(re);
      if (!matches) continue;
      const term = matches[0].toLowerCase();
      const extracted = {
        foodTerms: termsIn(unit.text, foods),
        nutrientTerms: termsIn(unit.text, nutrients),
        supportGoalTerms: termsIn(unit.text, goals),
        recipeConcept: /recipe|ingredients|teaspoon|tablespoon/i.test(
          unit.text,
        ),
      };
      result.push({
        category: /supplement|dosage/i.test(unit.text)
          ? "supplements"
          : /gut|digestion/i.test(unit.text)
            ? "gut-health"
            : type === "recipe"
              ? "kitchen-nutrition"
              : "general-nutrition",
        extracted,
        id: `research-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        title: `${label}: ${term}`,
        concept: `Research topic: ${term}. Foods detected: ${extracted.foodTerms.join(", ") || "none"}. Nutrients detected: ${extracted.nutrientTerms.join(", ") || "none"}. Possible goal concepts: ${extracted.supportGoalTerms.join(", ") || "none"}. Co-occurrence is only a candidate association, not a verified relationship. Read the source section before writing.`,
        originalCopy: "",
        claimType: type,
        sourceProvenance: [
          {
            ...provenance,
            pageOrSection: unit.location,
            claimType: type,
            evidenceStatus: "unverified",
            reviewStatus: "draft",
            reviewedBy: undefined,
            reviewedDate: undefined,
          },
        ],
        reviewStatus: "draft",
        flags: [
          ...flagsFor(unit.text),
          "Requires independent verification",
          "Original or licensed copy required",
        ],
        reviewNote: "",
        originalOrLicensed: false,
        reviewer: "",
        history: [
          {
            status: "draft",
            date: new Date().toISOString(),
            reviewer: "Local keyword extraction",
          },
        ],
      });
    }
  }
  return result;
}
export function canPublish(c: Candidate, publishing = true): string[] {
  const reasons: string[] = [];
  if (!c.originalCopy.trim() || c.originalCopy.length < 30)
    reasons.push("Write an original explanation (at least 30 characters).");
  if (!c.originalOrLicensed)
    reasons.push("Confirm original or licensed wording.");
  if (!c.reviewer.trim() || !c.reviewNote.trim())
    reasons.push("Record a reviewer and verification note.");
  if (
    publishing &&
    c.claimType !== "wellness-education" &&
    c.claimType !== "nutrient-function"
  )
    reasons.push(
      "Only educational articles and nutrient definitions can be published here. Recipes, food facts and goal rules require a catalog review before integration.",
    );
  if (flagsFor(c.originalCopy).length)
    reasons.push(
      "Remove treatment, medication or supplement-dose advice from public copy.",
    );
  if (
    !c.sourceProvenance.length ||
    c.sourceProvenance.some(
      (s) =>
        !s.sourceTitle.trim() ||
        !s.author.trim() ||
        s.author === "Not supplied" ||
        !s.pageOrSection.trim() ||
        !["source-supported", "independently-verified"].includes(
          s.evidenceStatus,
        ) ||
        !s.reviewedDate ||
        !s.reviewedBy,
    )
  )
    reasons.push("Verify each source and record its review date and reviewer.");
  return reasons;
}
export function transition(c: Candidate, next: ReviewStatus): Candidate {
  const allowed: Record<ReviewStatus, ReviewStatus[]> = {
    draft: ["needs-review", "rejected"],
    "needs-review": ["reviewed", "draft", "rejected"],
    reviewed: ["published", "needs-review", "rejected"],
    published: ["needs-review"],
    rejected: ["draft"],
  };
  if (!allowed[c.reviewStatus].includes(next))
    throw new Error("Follow Draft → Needs Review → Reviewed → Published.");
  if (
    (next === "reviewed" || next === "published") &&
    canPublish(c, next === "published").length
  )
    throw new Error(canPublish(c, next === "published").join(" "));
  return {
    ...c,
    reviewStatus: next,
    sourceProvenance: c.sourceProvenance.map((s) => ({
      ...s,
      reviewStatus: next,
    })),
    history: [
      ...c.history,
      {
        status: next,
        date: new Date().toISOString(),
        reviewer: c.reviewer || "Local editor",
      },
    ],
  };
}

/** Restore source metadata and original work, but never trust an imported review decision. */
export function importDraftRecords(data: unknown): Candidate[] {
  if (
    !data ||
    typeof data !== "object" ||
    !Array.isArray((data as { records?: unknown }).records)
  )
    throw new Error("Use a MoodMeal library export with a records array.");
  const records = (data as { records: unknown[] }).records;
  if (records.length > 1000)
    throw new Error("Import at most 1,000 records at a time.");
  const string = (v: unknown, max = 5000) =>
    typeof v === "string" ? v.slice(0, max) : "";
  const claimTypes: ClaimType[] = [
    "nutrient-function",
    "food-nutrient",
    "wellness-education",
    "recipe",
    "support-goal",
    "research-note",
  ];
  return records.map((record) => {
    if (!record || typeof record !== "object")
      throw new Error("Invalid library record.");
    const r = record as Record<string, unknown>;
    if (
      typeof r.title !== "string" ||
      typeof r.originalCopy !== "string" ||
      !Array.isArray(r.sourceProvenance) ||
      !r.sourceProvenance.length
    )
      throw new Error(
        "Each record needs a title, originalCopy and sourceProvenance.",
      );
    const claimType = claimTypes.includes(r.claimType as ClaimType)
      ? (r.claimType as ClaimType)
      : "research-note";
    const sources: Provenance[] = r.sourceProvenance.map((raw) => {
      if (
        !raw ||
        typeof raw !== "object" ||
        typeof raw.sourceTitle !== "string"
      )
        throw new Error("Every source needs a title.");
      return {
        sourceTitle: string(raw.sourceTitle, 300),
        author: string(raw.author, 300),
        edition: string(raw.edition, 100),
        pageOrSection: string(raw.pageOrSection, 500),
        sourceURL: string(raw.sourceURL, 2000) || undefined,
        doi: string(raw.doi, 300) || undefined,
        claimType,
        reviewStatus: "draft",
        evidenceStatus: "unverified",
      };
    });
    return {
      id: `research-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      title: string(r.title, 160),
      originalCopy: string(r.originalCopy),
      concept:
        string(r.concept) || "Imported work; verify sources and wording again.",
      claimType,
      category: "general-nutrition",
      sourceProvenance: sources,
      reviewStatus: "draft",
      flags: [
        ...flagsFor(string(r.originalCopy)),
        "Imported review decisions require re-verification",
      ],
      reviewer: "",
      reviewNote: string(r.reviewNote),
      originalOrLicensed: false,
      history: [
        {
          status: "draft",
          date: new Date().toISOString(),
          reviewer: "Restored from local export; review reset",
        },
      ],
    };
  });
}
