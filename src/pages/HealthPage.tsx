import {useState} from "react";
import Header from "../components/Header";
import Button from "../components/Button";
import {Link} from "../lib/router";
import {useHealth} from "../hooks/useWellness";
import {CONDITIONS,healthGuidance} from "../lib/wellness";
export default function HealthPage(){
 const [saved,save]=useHealth();const [draft,setDraft]=useState(saved);const [custom,setCustom]=useState("");const [message,setMessage]=useState("");
 const toggle=(name:string)=>{setDraft({...draft,conditions:draft.conditions.includes(name)?draft.conditions.filter(c=>c!==name):[...draft.conditions,name]});setMessage("");};
 return <div className="mm-soft-bg flex h-full flex-1 flex-col"><Header title="My health profile" /><div className="screen-scroll space-y-4 px-4 pt-4">
 <p className="text-sm">Optional. Add conditions you already know about. MoodMeal does not diagnose conditions or prescribe a diet.</p>
 <fieldset className="card space-y-3"><legend className="font-bold">Mental & physical health</legend>{CONDITIONS.map(c=><label key={c} className="flex items-center gap-3 py-1"><input type="checkbox" checked={draft.conditions.includes(c)} onChange={()=>toggle(c)} />{c}</label>)}</fieldset>
 <form className="card" onSubmit={e=>{e.preventDefault();const name=custom.trim();if(name&&!draft.conditions.some(c=>c.toLowerCase()===name.toLowerCase()))setDraft({...draft,conditions:[...draft.conditions,name]});setCustom("");setMessage("");}}><label>Another condition<input className="well-input" maxLength={80} value={custom} onChange={e=>setCustom(e.target.value)} placeholder="Condition name" /></label><button className="well-secondary mt-2" type="submit">Add condition</button><p className="mt-2 text-xs text-slate-500">Custom conditions are recorded only; they do not create new recommendation rules.</p>{draft.conditions.filter(c=>!CONDITIONS.includes(c)).map(c=><button key={c} type="button" className="well-secondary mt-2" onClick={()=>toggle(c)}>Remove {c}</button>)}</form>
 <label className="card block">Notes for yourself<textarea className="well-input" maxLength={2000} value={draft.notes} onChange={e=>{setDraft({...draft,notes:e.target.value});setMessage("");}} placeholder="Preferences or questions for your care team" /></label>
 <label className="card flex items-start gap-3"><input type="checkbox" checked={draft.personalized} onChange={e=>{setDraft({...draft,personalized:e.target.checked});setMessage("");}}/><span>Use these conditions to tailor suggestions<p className="mt-1 text-xs text-slate-500">Iron-deficiency anemia prioritizes iron-containing foods; hypertension favors fiber-rich choices; depression and anxiety favor quick meals. Kidney disease pauses this ranking. Other conditions are notes only. No interaction or allergy screening is provided.</p></span></label>
 {healthGuidance(draft).map(n=><p className="card text-sm" key={n}>{n}</p>)}
 <Button fullWidth onClick={()=>{if(save(draft))setMessage("Health profile saved.");}}>Save health profile</Button><p role="status">{message}</p>
 <Link className="block text-brand-700 underline" to="/foods">See food suggestions</Link><Link className="block text-brand-700 underline" to="/self-care">Explore self-care</Link>
 <p className="text-xs text-slate-500">Stored only in this browser. Do not enter information you want hidden from other people who use this device.</p>
 </div></div>;
}
