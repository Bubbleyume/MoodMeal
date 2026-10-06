import type {Food, Meal} from "../types";
export interface HealthProfile { conditions: string[]; notes: string; personalized: boolean; }
export const EMPTY_HEALTH: HealthProfile = {conditions:[],notes:"",personalized:false};
export const CONDITIONS = ["Iron-deficiency anemia", "Anemia (cause unknown)", "Depression", "Anxiety", "Hypertension", "Diabetes", "Kidney disease"];
export function normalizeHealth(raw: unknown): HealthProfile {
 const r = raw && typeof raw === "object" ? raw as Partial<HealthProfile> : {};
 return {conditions:Array.isArray(r.conditions)?r.conditions.filter((v):v is string=>typeof v === "string").slice(0,30):[], notes:typeof r.notes === "string"?r.notes.slice(0,2000):"",personalized:r.personalized === true};
}
export function healthGuidance(health:HealthProfile) {
 const c=health.conditions.join(" ").toLowerCase(); const notes:string[]=[];
 if(/anemia/.test(c)) notes.push("Anemia has several causes. Iron-containing foods are emphasized only when you select iron-deficiency anemia. Pair plant iron with vitamin C; a clinician should guide testing and supplements.");
 if(/hypertension/.test(c)) notes.push("Use DASH-style meal ideas and choose unsalted ingredients. These recipes do not have verified sodium totals, so check labels and portions against your care plan.");
 if(/depression|anxiety/.test(c)) notes.push("Regular meals and manageable routines may support wellbeing. Foods are not treatments for depression or anxiety; keep following your mental-health care plan.");
 if(/diabetes/.test(c)) notes.push("Carbohydrate amounts are not calculated here. Use your diabetes care plan for portions, glucose checks and medicines.");
 if(/kidney/.test(c)) notes.push("Condition-based food ranking is paused for kidney disease. Potassium, protein and fluid needs require an individual plan. General suggestions are not screened for kidney safety.");
 if(health.conditions.some(x=>!CONDITIONS.includes(x))) notes.push("Custom conditions are saved for your reference; MoodMeal has no condition-specific food rules for them.");
 return notes;
}
export function healthScore(item:Food|Meal,health:HealthProfile):number {
 if(!health.personalized || health.conditions.some(c=>/kidney/i.test(c))) return 0;
 let score=0; const n=item.nutrients.join(" ").toLowerCase();
 if(health.conditions.includes("Iron-deficiency anemia")) {if(/iron/.test(n) && !/chocolate/i.test(item.name)) score+=4;if(/vitamin c/.test(n)) score+=1;}
 // Favor dietary-pattern components, never claim a recipe meets a sodium limit.
 if(health.conditions.includes("Hypertension")) {if(/fiber/.test(n)) score+=2; if("category" in item && ["fruit","vegetable","grain"].includes(item.category)) score+=1;}
 if(health.conditions.some(c=>c === "Depression" || c === "Anxiety") && "prepTimeMinutes" in item && item.prepTimeMinutes<=15) score+=2;
 return score;
}
export interface Measurement {id:string;date:string;kind:"weight"|"blood-pressure"|"pulse";value:number;second?:number;unit:string;note:string;}
export function validMeasurement(m:Measurement) {
 return Number.isFinite(Date.parse(m.date)) && Date.parse(m.date)<=Date.now() && Number.isFinite(m.value) &&
 (m.kind === "weight" ? ["kg","lb"].includes(m.unit) && m.value>0 && m.value<=1500 :
 m.kind === "pulse" ? m.unit === "bpm" && m.value>=20 && m.value<=300 :
 m.kind === "blood-pressure" && m.unit === "mmHg" && m.value>=40 && m.value<=300 && typeof m.second === "number" && m.second>=20 && m.second<=200 && m.value>m.second);
}
export interface Reminder {id:string;name:string;kind:"Medicine"|"Vitamin";time:string;instructions:string;enabled:boolean;startDate:string;handledDate?:string;}
export function localDay(date=new Date()) { return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`; }
export function isDue(r:Reminder,now=new Date()) {
 const day=localDay(now);const time=`${String(now.getHours()).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")}`;
 return r.enabled && r.startDate<=day && r.handledDate!==day && r.time<=time;
}
// RFC 5545 content lines must be folded at 75 UTF-8 octets.
function foldCalendarLine(line: string): string {
 const encoder = new TextEncoder(); let result = "", column = 0;
 for (const character of line) {
  const bytes = encoder.encode(character).length;
  if (column + bytes > 75) { result += "\r\n "; column = 1; }
  result += character; column += bytes;
 }
 return result;
}
export function reminderCalendar(r:Reminder,now=new Date()) {
 const escape=(s:string)=>s.replace(/\\/g,"\\\\").replace(/\r?\n/g,"\\n").replace(/,/g,"\\,").replace(/;/g,"\\;");
 const [h,m]=r.time.split(":").map(Number);const start=new Date(`${r.startDate}T${r.time}:00`);
 const next=new Date(now);next.setHours(h,m,0,0);if(next<now)next.setDate(next.getDate()+1);
 const when=start>next?start:next;
 const dt=localDay(when).replace(/-/g,"")+"T"+r.time.replace(":","")+"00";
 return ["BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//MoodMeal//Reminders//EN","BEGIN:VEVENT",`UID:${r.id}@moodmeal.local`,`DTSTAMP:${now.toISOString().replace(/[-:]/g,"").replace(/\.\d{3}/,"")}`,`DTSTART:${dt}`,"DURATION:PT5M","RRULE:FREQ=DAILY",`SUMMARY:${escape(r.name)}`,`DESCRIPTION:${escape(r.instructions || "Follow your prescribed instructions. Do not double a missed dose.")}`,"BEGIN:VALARM","TRIGGER:PT0M","ACTION:DISPLAY","DESCRIPTION:MoodMeal reminder","END:VALARM","END:VEVENT","END:VCALENDAR"].map(foldCalendarLine).join("\r\n") + "\r\n";
}
export function downloadFile(name:string,body:string,type:string) {const url=URL.createObjectURL(new Blob([body],{type}));const a=document.createElement("a");a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
