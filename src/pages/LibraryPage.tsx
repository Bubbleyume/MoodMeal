import { useState } from "react";
import Header from "../components/Header";
import Button from "../components/Button";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { readResource } from "../lib/resourceImport";
import {
  extractCandidates,
  importDraftRecords,
  transition,
  canPublish,
  REVIEW_STATUSES,
} from "../lib/libraryReview";
import type {
  Candidate,
  Provenance,
  ClaimType,
  LibraryCategory,
} from "../types/library";
const input = "well-input";
export default function LibraryPage() {
  const [items, setItems] = useLocalStorage<Candidate[]>(
    "moodmeal:library",
    [],
  );
  const [selected, setSelected] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [edition, setEdition] = useState("");
  const [url, setURL] = useState("");
  const [filter, setFilter] = useState("all");
  const current = items.find((i) => i.id === selected);
  const save = (next: Candidate[]) => {
    try {
      window.localStorage.setItem("moodmeal:library", JSON.stringify(next));
      setItems(next);
      return true;
    } catch {
      setMessage(
        "Could not save: browser storage is full or unavailable. Export your library and free space before continuing.",
      );
      return false;
    }
  };
  const edit = (patch: Partial<Candidate>) => {
    if (!current) return;
    const updated = { ...current, ...patch };
    if (
      current.reviewStatus === "published" ||
      current.reviewStatus === "reviewed"
    ) {
      updated.reviewStatus = "needs-review";
      updated.history = [
        ...current.history,
        {
          status: "needs-review",
          date: new Date().toISOString(),
          reviewer: "Edited after review",
        },
      ];
    }
    if (save(items.map((i) => (i.id === current.id ? updated : i))))
      setMessage("");
  };
  const importFile = async (file: File) => {
    setBusy(true);
    setMessage("Reading locally…");
    try {
      const resource = await readResource(file);
      let candidates: Candidate[] = [];
      if (file.name.toLowerCase().endsWith(".json")) {
        candidates = importDraftRecords(JSON.parse(resource.units[0].text));
      } else {
        const provenance: Provenance = {
          sourceTitle: title.trim() || file.name,
          author: author.trim() || "Not supplied",
          edition: edition.trim(),
          pageOrSection: file.name,
          sourceURL: url.trim() || undefined,
          evidenceStatus: "unverified",
          claimType: "research-note",
          reviewStatus: "draft",
        };
        candidates = extractCandidates(resource.units, provenance);
      }
      if (!candidates.length) {
        setMessage(
          resource.notice +
            " No candidate topics found. Try searchable text or OCR for scanned pages.",
        );
        return;
      }
      if (candidates.length > 1000)
        throw new Error(
          "More than 1,000 candidates. Import a smaller section to keep review manageable.",
        );
      if (save([...candidates, ...items])) {
        setSelected(candidates[0].id);
        setMessage(
          `${resource.notice} Created ${candidates.length} Draft candidates. No source prose was published.`,
        );
      }
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Import failed.");
    } finally {
      setBusy(false);
    }
  };
  const exportAll = () => {
    const blob = new Blob(
      [
        JSON.stringify(
          {
            schemaVersion: 1,
            exportedAt: new Date().toISOString(),
            records: items,
          },
          null,
          2,
        ),
      ],
      { type: "application/json" },
    );
    const href = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = href;
    a.download = "moodmeal-library.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(href), 1000);
  };
  return (
    <div className="mm-soft-bg flex h-full flex-1 flex-col">
      <Header
        title="Content workspace"
        subtitle="Research → review → original education"
      />
      <div className="screen-scroll space-y-4 px-4 pt-4">
        <p className="text-sm">
          This local workspace belongs to this browser. Imports never enter
          recommendations automatically. Only reviewed educational articles and
          definitions can appear in Wellness; food facts, recipes and goal rules
          require a separate catalog change.
        </p>
        <details className="card" open={!items.length}>
          <summary className="font-semibold">
            Import a research resource
          </summary>
          <p className="my-3 text-xs text-slate-500">
            PDF, EPUB, TXT, Markdown or MoodMeal JSON. Files are read on this
            device. No AI or upload service is used. Scanned PDFs need OCR
            first. Keyword detection identifies topics for you to verify; it
            does not understand or validate claims.
          </p>
          <label>
            Source title
            <input
              className={input}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </label>
          <label>
            Author
            <input
              className={input}
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
            />
          </label>
          <label>
            Edition
            <input
              className={input}
              value={edition}
              onChange={(e) => setEdition(e.target.value)}
            />
          </label>
          <label>
            Source link (optional)
            <input
              className={input}
              type="url"
              value={url}
              onChange={(e) => setURL(e.target.value)}
            />
          </label>
          <label className="mt-3 block">
            Choose resource
            <input
              className="mt-2 block w-full text-sm"
              type="file"
              accept=".pdf,.epub,.txt,.md,.json"
              disabled={busy}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void importFile(f);
                e.target.value = "";
              }}
            />
          </label>
        </details>
        <p role="status" className="text-sm text-brand-700">
          {message}
        </p>
        <Button variant="secondary" onClick={exportAll}>
          Export library backup
        </Button>
        <label className="block text-sm">
          Review queue
          <select
            className={input}
            value={filter}
            onChange={(e: { target: { value: string } }) =>
              setFilter(e.target.value)
            }
          >
            <option value="all">All statuses ({items.length})</option>
            {REVIEW_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s} ({items.filter((i) => i.reviewStatus === s).length})
              </option>
            ))}
          </select>
        </label>
        <div className="max-h-64 space-y-2 overflow-y-auto">
          {items
            .filter((i) => filter === "all" || i.reviewStatus === filter)
            .map((i) => (
              <button
                key={i.id}
                className={`block w-full rounded-xl p-3 text-left text-sm ${i.id === selected ? "bg-brand-100" : "bg-white"}`}
                onClick={() => setSelected(i.id)}
              >
                <strong>{i.title}</strong>
                <span className="block text-xs">
                  {i.reviewStatus} · {i.sourceProvenance[0]?.pageOrSection}
                </span>
              </button>
            ))}
        </div>
        {current && (
          <section className="card space-y-3">
            <h2 className="font-bold">Review candidate</h2>
            <p className="text-xs text-slate-500">{current.concept}</p>
            <p className="text-xs text-amber-800">
              Import flags: {current.flags.join(" · ")}
            </p>
            <label className="block">
              Title
              <input
                className={input}
                maxLength={160}
                value={current.title}
                onChange={(e) => edit({ title: e.target.value })}
              />
            </label>
            <label className="block">
              Library category
              <select
                aria-label="Library category"
                className={input}
                value={current.category ?? "general-nutrition"}
                onChange={(e: { target: { value: string } }) =>
                  edit({ category: e.target.value as LibraryCategory })
                }
              >
                {[
                  "nutritional-assessment",
                  "gut-health",
                  "food-sensitivities",
                  "special-diets",
                  "kitchen-nutrition",
                  "supplements",
                  "general-nutrition",
                ].map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </label>
            <label className="block">
              Content type
              <select
                aria-label="Content type"
                className={input}
                value={current.claimType}
                onChange={(e: { target: { value: string } }) =>
                  edit({ claimType: e.target.value as ClaimType })
                }
              >
                {[
                  "research-note",
                  "nutrient-function",
                  "food-nutrient",
                  "wellness-education",
                  "recipe",
                  "support-goal",
                ].map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </label>
            <label className="block">
              Original public explanation
              <textarea
                className={input}
                rows={5}
                maxLength={5000}
                value={current.originalCopy}
                onChange={(e) => edit({ originalCopy: e.target.value })}
              />
            </label>
            <p className="text-xs text-slate-500">
              Write your own educational wording. Do not paste substantial
              passages or recipe instructions from copyrighted resources.
            </p>
            {current.sourceProvenance.map((s, index) => (
              <fieldset
                className="space-y-2 rounded-xl bg-brand-50 p-3"
                key={index}
              >
                <legend className="font-semibold">Source {index + 1}</legend>
                {(
                  [
                    "sourceTitle",
                    "author",
                    "edition",
                    "pageOrSection",
                    "sourceURL",
                    "doi",
                  ] as const
                ).map((field) => (
                  <label className="block text-xs" key={field}>
                    {field}
                    <input
                      className={input}
                      value={s[field] ?? ""}
                      onChange={(e) =>
                        edit({
                          sourceProvenance: current.sourceProvenance.map(
                            (p, j) =>
                              j === index
                                ? { ...p, [field]: e.target.value }
                                : p,
                          ),
                        })
                      }
                    />
                  </label>
                ))}
                <label className="block text-xs">
                  Evidence status
                  <select
                    aria-label="Evidence status"
                    className={input}
                    value={s.evidenceStatus}
                    onChange={(e: { target: { value: string } }) =>
                      edit({
                        sourceProvenance: current.sourceProvenance.map(
                          (p, j) =>
                            j === index
                              ? {
                                  ...p,
                                  evidenceStatus: e.target
                                    .value as Provenance["evidenceStatus"],
                                  reviewedDate: new Date()
                                    .toISOString()
                                    .slice(0, 10),
                                  reviewedBy: current.reviewer,
                                }
                              : p,
                        ),
                      })
                    }
                  >
                    {[
                      "unverified",
                      "source-supported",
                      "independently-verified",
                      "conflicting-evidence",
                      "deprecated",
                    ].map((v) => (
                      <option key={v}>{v}</option>
                    ))}
                  </select>
                </label>
              </fieldset>
            ))}
            <label className="block">
              Reviewer name
              <input
                className={input}
                value={current.reviewer}
                onChange={(e) =>
                  edit({
                    reviewer: e.target.value,
                    sourceProvenance: current.sourceProvenance.map((p) => ({
                      ...p,
                      reviewedBy: e.target.value,
                    })),
                  })
                }
              />
            </label>
            <label className="block">
              Verification and copyright notes
              <textarea
                className={input}
                value={current.reviewNote}
                onChange={(e) => edit({ reviewNote: e.target.value })}
              />
            </label>
            <label className="flex gap-2 text-sm">
              <input
                type="checkbox"
                checked={current.originalOrLicensed}
                onChange={(e) => edit({ originalOrLicensed: e.target.checked })}
              />
              I wrote this wording or have permission to publish it.
            </label>
            <p className="text-xs">
              Publishing checks:{" "}
              {canPublish(current).join(" ") ||
                "Ready for the next review step."}
            </p>
            <div className="flex flex-wrap gap-2">
              {REVIEW_STATUSES.filter((s) => s !== current.reviewStatus).map(
                (s) => (
                  <button
                    key={s}
                    className="well-secondary"
                    onClick={() => {
                      try {
                        const next = transition(current, s);
                        if (
                          save(
                            items.map((i) => (i.id === current.id ? next : i)),
                          )
                        )
                          setMessage(`Moved to ${s}.`);
                      } catch (e) {
                        setMessage(
                          e instanceof Error
                            ? e.message
                            : "Transition blocked.",
                        );
                      }
                    }}
                  >
                    Move to {s}
                  </button>
                ),
              )}
            </div>
            <details className="text-xs">
              <summary>Review history</summary>
              {current.history.map((h, i) => (
                <p key={i}>
                  {h.date} · {h.status} · {h.reviewer}
                </p>
              ))}
            </details>
          </section>
        )}
      </div>
    </div>
  );
}
