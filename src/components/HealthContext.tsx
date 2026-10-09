import { Link } from "../lib/router";
import { useHealth } from "../hooks/useWellness";
import { healthGuidance } from "../lib/wellness";

export default function HealthContext() {
  const [health] = useHealth();
  const guidance = healthGuidance(health);
  const renal = health.personalized && health.conditions.some(c=>/kidney/i.test(c));
  return <aside className="mb-4 rounded-2xl bg-brand-50 p-3 text-xs text-slate-600">
    <div className="flex items-center justify-between gap-3"><p className="font-semibold text-brand-800">{renal?"Personalization paused":health.personalized?"Your health preferences are on":"Make these picks more personal"}</p><Link className="shrink-0 text-brand-700 underline" to="/health">{health.personalized?"Edit":"Set up"}</Link></div>
    {renal && <p className="mt-2">General suggestions are not screened for kidney safety. Follow your individual care plan.</p>}
    {health.personalized && <details className="mt-2"><summary className="cursor-pointer">How your preferences affect these suggestions</summary><p className="mt-2">Everyday food ideas, not a treatment plan.</p>{guidance.map(n=><p key={n} className="mt-2">{n}</p>)}</details>}
  </aside>;
}
