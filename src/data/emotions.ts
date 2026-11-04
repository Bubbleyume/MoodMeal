import type { Emotion } from "../types";

// The 12 supported emotions. This is the single source of truth for emotion
// metadata used across mood selection, results, and history screens.
export const EMOTIONS: Emotion[] = [
  {
    id: "happy",
    name: "Happy",
    emoji: "😊",
    color: "#f5a524",
    gradient: "from-sunny-300 to-coral-300",
  },
  {
    id: "sad",
    name: "Sad",
    emoji: "😢",
    color: "#4fa8f0",
    gradient: "from-sky-300 to-brand-200",
  },
  {
    id: "tired",
    name: "Tired",
    emoji: "😴",
    color: "#818cf8",
    gradient: "from-indigo-200 to-brand-200",
  },
  {
    id: "scared",
    name: "Scared",
    emoji: "😱",
    color: "#a78bfa",
    gradient: "from-brand-200 to-slate-200",
  },
  {
    id: "angry",
    name: "Angry",
    emoji: "😠",
    color: "#f4511e",
    gradient: "from-coral-400 to-coral-200",
  },
  {
    id: "nervous",
    name: "Nervous",
    emoji: "😬",
    color: "#2dbe8e",
    gradient: "from-mint-300 to-sky-200",
  },
  {
    id: "shy",
    name: "Shy",
    emoji: "😳",
    color: "#f472b6",
    gradient: "from-blush-300 to-brand-100",
  },
  {
    id: "excited",
    name: "Excited",
    emoji: "🤩",
    color: "#ff6f61",
    gradient: "from-coral-400 to-sunny-300",
  },
  {
    id: "bored",
    name: "Bored",
    emoji: "😐",
    color: "#94a3b8",
    gradient: "from-slate-200 to-slate-100",
  },
  {
    id: "silly",
    name: "Silly",
    emoji: "🤪",
    color: "#f472b6",
    gradient: "from-blush-400 to-sunny-300",
  },
  {
    id: "worried",
    name: "Worried",
    emoji: "😟",
    color: "#5fd8ab",
    gradient: "from-mint-300 to-brand-200",
  },
  {
    id: "sick",
    name: "Sick",
    emoji: "🤒",
    color: "#7cc4ff",
    gradient: "from-sky-300 to-mint-200",
  },
];

export function getEmotionById(id: string) {
  return EMOTIONS.find((e) => e.id === id);
}
