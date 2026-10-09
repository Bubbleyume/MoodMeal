import {useEffect,useState} from "react";
import {readStorage,writeStorage,STORAGE_KEYS} from "../lib/storage";
import {normalizeHealth,validMeasurement,type HealthProfile,type Measurement,type Reminder} from "../lib/wellness";
export function useWellnessStore<T>(key:string,normalize:(raw:unknown)=>T) {
 const [value,setValue]=useState<T>(()=>normalize(readStorage(key,null)));
 useEffect(()=>{const sync=()=>setValue(normalize(readStorage(key,null)));window.addEventListener("moodmeal:wellness",sync);window.addEventListener("storage",sync);return()=>{window.removeEventListener("moodmeal:wellness",sync);window.removeEventListener("storage",sync);};},[key]);
 const save=(next:T)=>{try{window.localStorage.setItem(key,JSON.stringify(next));}catch{window.alert("Could not save: browser storage is unavailable or full. Your changes were not saved. Export existing records before clearing data.");return false;}setValue(next);window.dispatchEvent(new Event("moodmeal:wellness"));return true;};
 return [value,save] as const;
}
export const useHealth=()=>useWellnessStore<HealthProfile>(STORAGE_KEYS.health,normalizeHealth);
export const useMeasurements=()=>useWellnessStore<Measurement[]>(STORAGE_KEYS.measurements,raw=>Array.isArray(raw)?raw.filter(m=>m && typeof m.id === "string" && validMeasurement(m)):[]);
export const useReminders=()=>useWellnessStore<Reminder[]>(STORAGE_KEYS.reminders,raw=>Array.isArray(raw)?raw.filter(r=>r && typeof r.id === "string" && typeof r.name === "string" && typeof r.instructions === "string" && /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(r.time) && /^\d{4}-\d{2}-\d{2}$/.test(r.startDate) && typeof r.enabled === "boolean"):[]);
