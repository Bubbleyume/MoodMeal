import { useParams, Navigate } from "../lib/router";
import Header from "../components/Header";
import { Sources } from "../components/Knowledge";
import { LESSONS } from "../data/education";
import { useLocalStorage } from "../hooks/useLocalStorage";
import type { Candidate } from "../types/library";
import { canPublish } from "../lib/libraryReview";
export default function EducationPage() {
  const { id } = useParams<{ id: string }>();
  const [library] = useLocalStorage<Candidate[]>("moodmeal:library", []);
  const lesson = LESSONS.find((l) => l.id === id);
  const candidate = library.find(
    (c) =>
      c.id === id &&
      c.reviewStatus === "published" &&
      canPublish(c).length === 0,
  );
  if (!lesson && !candidate) return <Navigate to="/wellness" replace />;
  return (
    <div className="mm-soft-bg flex h-full flex-1 flex-col">
      <Header
        title={lesson?.title ?? candidate!.title}
        subtitle="Food & wellness library"
      />
      <div className="screen-scroll space-y-4 px-4 pt-4">
        <article className="card space-y-4 text-sm leading-relaxed">
          {(lesson?.paragraphs ?? [candidate!.originalCopy]).map((p) => (
            <p key={p}>{p}</p>
          ))}
          {lesson && (
            <div className="rounded-2xl bg-brand-50 p-4">
              <h2 className="font-bold">One small step</h2>
              <p className="mt-2">{lesson.practice}</p>
            </div>
          )}
          <Sources
            sources={lesson?.sourceProvenance ?? candidate!.sourceProvenance}
          />
        </article>
        <p className="text-xs text-slate-500">
          Educational information, not an individual treatment plan.
        </p>
      </div>
    </div>
  );
}
