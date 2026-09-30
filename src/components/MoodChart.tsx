/**
 * A hand-rolled SVG line/area chart used in place of `recharts` (not
 * installable in this environment — see README.md). It renders the same
 * kind of "value over time, colored by category" trend that a Recharts
 * <AreaChart>/<LineChart> would, with a hover tooltip and axis labels.
 * Swapping in Recharts later means replacing this file's internals; the
 * `MoodHistoryEntry[]` prop shape can stay the same.
 */
import React, { useMemo, useState } from "react";
import type { MoodHistoryEntry } from "../types";
import { EMOTIONS } from "../data/emotions";

interface MoodChartProps {
  entries: MoodHistoryEntry[];
  height?: number;
}

const PADDING = { top: 20, right: 16, bottom: 28, left: 28 };

export default function MoodChart({ entries, height = 220 }: MoodChartProps) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const width = 320;

  const sorted = useMemo(
    () => [...entries].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    [entries]
  );

  const innerWidth = width - PADDING.left - PADDING.right;
  const innerHeight = height - PADDING.top - PADDING.bottom;

  const points = useMemo(() => {
    if (sorted.length === 0) return [];
    return sorted.map((entry, i) => {
      const x =
        sorted.length === 1
          ? PADDING.left + innerWidth / 2
          : PADDING.left + (i / (sorted.length - 1)) * innerWidth;
      const y = PADDING.top + innerHeight - (entry.intensity / 10) * innerHeight;
      return { x, y, entry };
    });
  }, [sorted, innerWidth, innerHeight]);

  const linePath = useMemo(() => {
    if (points.length === 0) return "";
    return points
      .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
      .join(" ");
  }, [points]);

  const areaPath = useMemo(() => {
    if (points.length === 0) return "";
    const base = PADDING.top + innerHeight;
    return (
      `M ${points[0].x.toFixed(1)} ${base}` +
      points.map((p) => ` L ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join("") +
      ` L ${points[points.length - 1].x.toFixed(1)} ${base} Z`
    );
  }, [points, innerHeight]);

  if (sorted.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center rounded-2xl bg-brand-50 text-sm text-slate-400">
        No mood entries yet.
      </div>
    );
  }

  const handleMove = (clientX: number, svgEl: SVGSVGElement) => {
    const rect = svgEl.getBoundingClientRect();
    const relX = ((clientX - rect.left) / rect.width) * width;
    let closest = 0;
    let closestDist = Infinity;
    points.forEach((p, i) => {
      const d = Math.abs(p.x - relX);
      if (d < closestDist) {
        closestDist = d;
        closest = i;
      }
    });
    setHoverIndex(closest);
  };

  const hovered = hoverIndex !== null ? points[hoverIndex] : null;
  const gridLines = [0, 2.5, 5, 7.5, 10];

  return (
    <div className="w-full select-none">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full touch-none"
        onMouseMove={(e) => handleMove(e.clientX, e.currentTarget)}
        onMouseLeave={() => setHoverIndex(null)}
        onTouchStart={(e) => handleMove(e.touches[0].clientX, e.currentTarget)}
        onTouchMove={(e) => handleMove(e.touches[0].clientX, e.currentTarget)}
        onTouchEnd={() => setHoverIndex(null)}
      >
        <defs>
          <linearGradient id="moodArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
          </linearGradient>
        </defs>

        {gridLines.map((g) => {
          const y = PADDING.top + innerHeight - (g / 10) * innerHeight;
          return (
            <g key={g}>
              <line
                x1={PADDING.left}
                x2={width - PADDING.right}
                y1={y}
                y2={y}
                stroke="#ede9fe"
                strokeWidth={1}
              />
              <text x={2} y={y + 3} fontSize={8} fill="#a78bfa">
                {g}
              </text>
            </g>
          );
        })}

        <path d={areaPath} fill="url(#moodArea)" />
        <path d={linePath} fill="none" stroke="#7c3aed" strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />

        {points.map((p, i) => {
          const emotion = EMOTIONS.find((e) => e.id === p.entry.emotionId);
          const isHovered = hoverIndex === i;
          return (
            <g key={p.entry.id}>
              {isHovered && (
                <line
                  x1={p.x}
                  x2={p.x}
                  y1={PADDING.top}
                  y2={PADDING.top + innerHeight}
                  stroke="#c4b5fd"
                  strokeDasharray="3 3"
                  strokeWidth={1}
                />
              )}
              <circle
                cx={p.x}
                cy={p.y}
                r={isHovered ? 6 : 4}
                fill={emotion?.color ?? "#7c3aed"}
                stroke="#fff"
                strokeWidth={1.5}
                className="transition-all duration-150"
              />
            </g>
          );
        })}

        {sorted.map((entry, i) => {
          if (sorted.length > 6 && i % Math.ceil(sorted.length / 6) !== 0) return null;
          const p = points[i];
          const d = new Date(entry.date);
          return (
            <text
              key={`label-${entry.id}`}
              x={p.x}
              y={height - 8}
              fontSize={8}
              textAnchor="middle"
              fill="#94a3b8"
            >
              {d.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
            </text>
          );
        })}
      </svg>

      {hovered && (
        <div className="mx-auto mt-1 flex w-fit items-center gap-2 rounded-xl bg-slate-900 px-3 py-1.5 text-xs text-white shadow-lg animate-fade-in">
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: EMOTIONS.find((e) => e.id === hovered.entry.emotionId)?.color }}
          />
          <span className="font-semibold">
            {EMOTIONS.find((e) => e.id === hovered.entry.emotionId)?.emoji}{" "}
            {EMOTIONS.find((e) => e.id === hovered.entry.emotionId)?.name}
          </span>
          <span className="text-slate-300">· intensity {hovered.entry.intensity}/10</span>
          <span className="text-slate-400">
            {new Date(hovered.entry.date).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
            })}
          </span>
        </div>
      )}
    </div>
  );
}
