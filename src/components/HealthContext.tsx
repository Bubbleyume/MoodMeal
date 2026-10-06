import {Link} from "../lib/router";
import {useHealth} from "../hooks/useWellness";
import {healthGuidance} from "../lib/wellness";
export default function HealthContext(){const [health]=useHealth();return <aside className="card mb-4 text-xs text-slate-600"><Link className="font-semibold text-brand-700 underline" to="/health">Health preferences</Link><p className="mt-1">{health.personalized ? "Condition preferences are on. Suggestions support everyday eating; they are not a treatment plan." : "Add optional health preferences for more relevant suggestions."}</p>{health.personalized && healthGuidance(health).map(n=><p key={n} className="mt-2">{n}</p>)}</aside>;}
