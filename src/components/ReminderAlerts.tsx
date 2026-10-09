import {useEffect,useState,useRef} from "react";
import {playReminderSound} from "../lib/reminderSound";
import {useReminders} from "../hooks/useWellness";
import {isDue,localDay} from "../lib/wellness";
export default function ReminderAlerts(){
 const [items,save]=useReminders();const [now,setNow]=useState(()=>new Date());
 useEffect(()=>{const tick=()=>setNow(new Date());const timer=window.setInterval(tick,15000);window.addEventListener("focus",tick);return()=>{clearInterval(timer);window.removeEventListener("focus",tick);};},[]);
 const due=items.filter(r=>isDue(r,now));const played=useRef<string[]>([]);const dueKey=due.map(r=>r.id+localDay(now)).join("|");
 useEffect(()=>{if(dueKey && !played.current?.includes(dueKey)){playReminderSound();played.current?.push(dueKey);}},[dueKey]);
 if(!due.length)return null;
 return <aside role="alert" className="fixed left-1/2 top-3 z-50 w-[calc(100%-2rem)] max-w-[350px] -translate-x-1/2 rounded-2xl bg-white p-4 shadow-xl ring-2 ring-brand-500"><h2 className="font-bold">Scheduled reminder</h2><p className="mt-1 text-xs">Check your schedule; do not double a missed dose.</p><div className="max-h-48 overflow-y-auto">{due.map(r=><div className="mt-3" key={r.id}><p className="text-sm">{r.name} · {r.time}</p><p className="text-xs">{r.instructions}</p><button className="well-secondary mt-1" onClick={()=>save(items.map(x=>x.id===r.id?{...x,handledDate:localDay(now)}:x))}>Dismiss today’s reminder</button></div>)}</div></aside>;
}
