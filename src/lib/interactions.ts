import { readStorage, writeStorage } from "./storage";
import type { Interaction } from "../types/library";
import type { DraftMood } from "../hooks/useDraftMood";
import type { MoodHistoryEntry } from "../types";
export function recordInteraction(
  item: { id: string; name: string },
  kind: Interaction["kind"],
  action: Interaction["action"],
) {
  const draft = readStorage<DraftMood | null>("moodmeal:draftMood", null);
  const entries = readStorage<MoodHistoryEntry[]>("moodmeal:moodHistory", []);
  const checkIn = entries.find((e) => e.id === draft?.checkInId);
  const list = readStorage<Interaction[]>("moodmeal:interactions", []);
  const event: Interaction = {
    id: `i-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    date: new Date().toISOString(),
    itemId: item.id,
    name: item.name,
    kind,
    action,
    ...(checkIn ? { checkInId: checkIn.id, emotionId: checkIn.emotionId } : {}),
  };
  writeStorage("moodmeal:interactions", [...list, event]);
}
export function historyInsights(
  entries: MoodHistoryEntry[],
  events: Interaction[],
  now = new Date(),
): string[] {
  const valid = entries.filter(
    (e) =>
      !/^seed-\d+$/.test(e.id) && Number.isFinite(new Date(e.date).getTime()),
  );
  const recent = valid.filter(
    (e) =>
      new Date(e.date).getTime() >= now.getTime() - 7 * 86400000 &&
      new Date(e.date) <= now,
  );
  if (!recent.length)
    return ["Your observations will appear after you record check-ins."];
  const result: string[] = [];
  const counts: Record<string, number> = {};
  recent.forEach((e) => (counts[e.emotionId] = (counts[e.emotionId] ?? 0) + 1));
  const ranked = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const top = ranked[0];
  const title = (s: string) => s[0].toUpperCase() + s.slice(1);
  result.push(
    `In the last 7 days, you logged ${top[0]} ${top[1]} ${top[1] === 1 ? "time" : "times"}.`,
  );
  if (ranked.length === 1 || ranked[1][1] < top[1])
    result.push(
      `${title(top[0])} was your most frequently logged mood in the last 7 days.`,
    );
  const group = recent.filter((e) => e.emotionId === top[0]);
  const low = Math.min(...group.map((e) => e.intensity)),
    high = Math.max(...group.map((e) => e.intensity));
  result.push(
    group.length === 1
      ? `Your ${top[0]} mood intensity was ${low}/10.`
      : low === high
        ? `Your ${top[0]} check-ins were all ${low}/10 intensity.`
        : `Your ${top[0]} check-ins ranged from ${low} to ${high}/10 intensity.`,
  );
  const morning = group.filter((e) => new Date(e.date).getHours() < 12);
  if (group.length >= 3 && morning.length > group.length / 2)
    result.push(
      `${morning.length} of ${group.length} ${top[0]} check-ins were before noon (this device's time zone).`,
    );
  const days: Record<string, number> = {};
  recent.forEach((e) => {
    const d = new Date(e.date).toLocaleDateString(undefined, {
      weekday: "long",
    });
    days[d] = (days[d] ?? 0) + 1;
  });
  const day = Object.entries(days).sort((a, b) => b[1] - a[1])[0];
  if (day[1] >= 2)
    result.push(
      `${day[1]} check-ins were recorded on ${day[0]} in the last 7 days.`,
    );
  const am = recent.filter((e) => new Date(e.date).getHours() < 12),
    pm = recent.filter((e) => new Date(e.date).getHours() >= 18);
  if (am.length >= 3 && pm.length >= 3) {
    const avg = (es: MoodHistoryEntry[]) =>
      es.reduce((s, e) => s + e.intensity, 0) / es.length;
    result.push(
      `Morning check-ins averaged ${avg(am).toFixed(1)}/10; evening check-ins averaged ${avg(pm).toFixed(1)}/10 in the last 7 days.`,
    );
  }
  const saves = new Map<
    string,
    {
      name: string;
      kind: string;
      mood: string;
      ids: Set<string>;
      count: number;
    }
  >();
  for (const e of events) {
    if (
      e.action !== "save" ||
      !e.checkInId ||
      !valid.some((v) => v.id === e.checkInId)
    )
      continue;
    const key = `${e.kind}:${e.itemId}:${e.emotionId}`;
    const x = saves.get(key) ?? {
      name: e.name,
      kind: e.kind,
      mood: e.emotionId ?? "",
      ids: new Set<string>(),
      count: 0,
    };
    x.ids.add(e.checkInId);
    x.count++;
    saves.set(key, x);
  }
  [...saves.values()]
    .sort((a, b) => b.ids.size - a.ids.size)
    .slice(0, 4)
    .forEach((s) =>
      result.push(
        `You saved ${s.name} (${s.kind}) after ${s.ids.size} ${s.mood} check-in${s.ids.size === 1 ? "" : "s"} (${s.count} save actions, all time).`,
      ),
    );
  const views = events.filter(
    (e) =>
      e.action === "view" &&
      e.checkInId &&
      valid.some((v) => v.id === e.checkInId),
  );
  if (views.length)
    result.push(
      `You opened recipes ${views.length} times from recorded check-ins (all time).`,
    );
  return result;
}
