import {Link} from "../lib/router";
import {useHealth,useMeasurements,useReminders} from "../hooks/useWellness";
import Header from "../components/Header";
const sections = [
 ["health", "My health profile", "Add conditions and choose whether to tailor food suggestions.", "♡"],
 ["reminders", "Medicine & vitamin reminders", "Daily schedules, in-app alerts and calendar alarms.", "◷"],
 ["tracking", "Health trends", "Record weight, blood pressure and pulse over time.", "↗"],
 ["self-care", "Self-care practices", "Small, manageable steps matched to your needs.", "☀"],
 ["glossary", "Food & wellness glossary", "Understand the nutrients and terms you see.", "Aa"],
];
export default function WellnessPage(){const [health]=useHealth();const [readings]=useMeasurements();const [reminders]=useReminders();const summaries:Record<string,string>={health:health.personalized?"Personalization on":"Personalization off",reminders:`${reminders.filter(r=>r.enabled).length} active ${reminders.filter(r=>r.enabled).length===1?"reminder":"reminders"}`,tracking:`${readings.length} saved ${readings.length===1?"reading":"readings"}`};return <div className="mm-soft-bg flex h-full flex-1 flex-col"><Header title="Your wellness" subtitle="Learn, plan and notice changes" /><div className="screen-scroll space-y-3 px-4 pt-4"><p className="text-sm text-slate-600">Build routines that work for you, one step at a time.</p>{sections.map(([url,title,description,icon])=><Link className="card flex items-start gap-3" to={`/${url}`} key={url}><span aria-hidden="true" className="rounded-xl bg-brand-100 p-3 text-brand-700">{icon}</span><span><h2 className="font-bold">{title}</h2><p className="mt-1 text-sm text-slate-500">{description}</p>{summaries[url]&&<p className="mt-2 text-xs font-semibold text-brand-700">{summaries[url]}</p>}</span></Link>)}<p className="text-xs text-slate-500">Your health records stay in this browser on this device. They are not encrypted or backed up to an account. Clearing local data removes them.</p></div></div>;}
