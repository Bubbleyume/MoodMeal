import {createRecordId} from "../lib/recordId";
import { useRef, useState } from "react";
import { enableReminderSound } from "../lib/reminderSound";
import Header from "../components/Header";
import { useReminders } from "../hooks/useWellness";
import { localDay, reminderCalendar, downloadFile, type Reminder } from "../lib/wellness";

export default function RemindersPage() {
  const [items, save] = useReminders();
  const [editing, setEditing] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(items.length === 0);
  const [name, setName] = useState("");
  const [kind, setKind] = useState<Reminder["kind"]>("Medicine");
  const [time, setTime] = useState("09:00");
  const [startDate, setStart] = useState(localDay);
  const [instructions, setInstructions] = useState("");
  const [message, setMessage] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement | null>(null);
  const sorted = [...items].sort((a,b) => Number(b.enabled) - Number(a.enabled) || a.time.localeCompare(b.time));
  const reset = () => {
    setEditing(null); setName(""); setInstructions(""); setKind("Medicine");
    setTime("09:00"); setStart(localDay()); setShowForm(false);
  };
  const revealForm = () => {
    setShowForm(true);
    window.setTimeout(() => { formRef.current?.scrollIntoView({block:"start"}); formRef.current?.querySelector<HTMLInputElement>("input")?.focus(); }, 0);
  };

  return <div className="mm-soft-bg flex h-full flex-1 flex-col">
    <Header title="Daily reminders" subtitle="Your medicines and vitamins, on your schedule" />
    <div className="screen-scroll space-y-4 px-4 pt-4">
      <div className="rounded-2xl bg-brand-50 p-4 text-sm text-brand-900">
        <p className="font-semibold">Keep MoodMeal open for in-app alerts.</p>
        <p className="mt-1 text-xs">For alarms when the app is closed, export to your calendar and check its notification settings.</p>
        <details className="mt-3 text-xs"><summary className="cursor-pointer font-semibold">Timing, safety & calendar details</summary>
          <p className="mt-2">Times follow this device’s local clock. Add a separate reminder for each dose time. Follow your prescribed instructions; never double a dose because of a missed alert.</p>
          <p className="mt-2">Calendar exports may sync to your calendar provider. Changes here do not update an exported event, including pausing or deleting it. Update your calendar separately.</p>
        </details>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold">{items.filter(r=>r.enabled).length} active · {items.filter(r=>!r.enabled).length} paused</p>
        {!showForm && <button className="well-primary" onClick={()=>{reset();revealForm();}}>+ Add reminder</button>}
      </div>
      <button className="well-secondary" onClick={async()=>{
        try { await enableReminderSound(); setMessage("Sound enabled for this open session. Keep your device awake and volume on."); }
        catch { setMessage("Sound is unavailable. Export a calendar alarm instead."); }
      }}>Enable & test sound</button>
      {message && <p role="status" className="rounded-xl bg-white px-4 py-3 text-sm text-brand-800">{message}</p>}

      {showForm && <form ref={formRef} className="card space-y-3" onSubmit={e=>{
        e.preventDefault();
        if (!name.trim()) { setMessage("Enter a medicine or vitamin name."); return; }
        const old = items.find(r=>r.id===editing);
        const reminder: Reminder = {id:editing??createRecordId(),name:name.trim(),kind,time,startDate,instructions:instructions.trim(),enabled:old?.enabled??true,handledDate:old?.time===time?old.handledDate:undefined};
        if (!save(editing?items.map(r=>r.id===editing?reminder:r):[...items,reminder])) return;
        reset(); setMessage(`${reminder.name} saved for ${time} daily.`);
      }}>
        <h2 className="section-title">{editing?"Edit reminder":"New daily reminder"}</h2>
        <label className="block text-sm font-medium">Name<input className="well-input" required maxLength={80} value={name} onChange={e=>setName(e.target.value)} placeholder="Medicine or vitamin name" /></label>
        <label className="block text-sm font-medium">Type<select className="well-input" value={kind} onChange={(e:{target:{value:string}})=>setKind(e.target.value as Reminder["kind"])}><option>Medicine</option><option>Vitamin</option></select></label>
        <div className="grid grid-cols-2 gap-3">
          <label className="min-w-0 text-sm font-medium">Time<input className="well-input" type="time" required value={time} onInput={e=>setTime(e.currentTarget.value)} onChange={e=>setTime(e.target.value)} /></label>
          <label className="min-w-0 text-sm font-medium">Start date<input className="well-input" type="date" required value={startDate} onInput={e=>setStart(e.currentTarget.value)} onChange={e=>setStart(e.target.value)} /></label>
        </div>
        <label className="block text-sm font-medium">Prescribed instructions <span className="font-normal text-slate-500">(optional)</span><textarea className="well-input" maxLength={500} value={instructions} onChange={e=>setInstructions(e.target.value)} placeholder="Use the instructions from your care team" /></label>
        <div className="flex gap-2"><button className="well-primary flex-1" type="submit">Save reminder</button><button className="well-secondary" type="button" onClick={reset}>Cancel</button></div>
      </form>}
      {!items.length && !showForm && <div className="card text-center"><h2 className="font-bold">Make room for your routine</h2><p className="mt-2 text-sm text-slate-500">Add your first reminder to see your daily schedule here.</p></div>}
      {sorted.map(reminder=><article className="card space-y-3" key={reminder.id}>
        <div className="flex items-start justify-between gap-3"><div><p className="text-2xl font-bold tabular-nums text-brand-700">{reminder.time}</p><h2 className="mt-1 break-words font-bold">{reminder.name}</h2></div><span className={`rounded-full px-2 py-1 text-xs font-semibold ${reminder.enabled?"bg-brand-50 text-brand-700":"bg-slate-100 text-slate-600"}`}>{reminder.enabled?"Active":"Paused"}</span></div>
        <p className="text-xs text-slate-500">{reminder.kind} · Every day · Starts {reminder.startDate}</p>
        {reminder.instructions && <p className="break-words text-sm text-slate-600">{reminder.instructions}</p>}
        <div className="flex flex-wrap gap-2">
          <button className="well-secondary" aria-label={`Edit ${reminder.name}`} onClick={()=>{setEditing(reminder.id);setName(reminder.name);setKind(reminder.kind);setTime(reminder.time);setStart(reminder.startDate);setInstructions(reminder.instructions);revealForm();}}>Edit</button>
          <button className="well-secondary" aria-label={`${reminder.enabled?"Pause":"Resume"} ${reminder.name}`} onClick={()=>{if(save(items.map(r=>r.id===reminder.id?{...r,enabled:!r.enabled}:r)))setMessage(`${reminder.name} ${reminder.enabled?"paused":"resumed"}.`);}}>{reminder.enabled?"Pause":"Resume"}</button>
          <button className="well-secondary" onClick={()=>{downloadFile("moodmeal-reminder.ics",reminderCalendar(reminder),"text/calendar");setMessage("Calendar file exported. Import it into your calendar and verify the alarm; it runs independently of this app.");}}>Export to calendar</button>
        </div>
        {deleting===reminder.id ? <div className="rounded-xl bg-slate-50 p-3 text-sm"><p>Remove this reminder from MoodMeal?</p><p className="mt-1 text-xs text-slate-500">Any exported calendar alarm stays in your calendar.</p><div className="mt-2 flex gap-3"><button className="well-secondary" onClick={()=>{if(save(items.filter(r=>r.id!==reminder.id))){if(editing===reminder.id)reset();setDeleting(null);setMessage("Reminder removed.");}}}>Confirm removal</button><button className="well-secondary" onClick={()=>setDeleting(null)}>Keep reminder</button></div></div> : <button className="text-xs text-slate-500 underline" aria-label={`Remove ${reminder.name}`} onClick={()=>setDeleting(reminder.id)}>Remove reminder</button>}
      </article>)}
    </div>
  </div>;
}
