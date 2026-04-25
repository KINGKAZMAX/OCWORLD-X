import type { Relationship, TimelineItem } from "../types";
import { ViewHeader } from "./ViewHeader";

export function RewindView({ timeline, relationship }: { timeline: TimelineItem[]; relationship: Relationship | null }) {
  const items = timeline.length
    ? timeline.slice().reverse()
    : [{ date: new Date().toISOString(), event: "等待第一段真实成长记录。", impact: 0, intimacyAfter: relationship?.intimacy ?? 0 }];

  return (
    <div style={{ flex: 1, overflow: "auto" }}>
      <ViewHeader title="回溯 · TA 与你之间发生过的小事" />
      <div style={{ maxWidth: 720, margin: "32px auto", padding: "0 56px 80px" }}>
        <div style={{ position: "relative", paddingLeft: 28 }}>
          <div style={{ position: "absolute", left: 6, top: 6, bottom: 6, width: 1, background: "var(--line)" }} />
          {items.map((item, index) => (
            <article key={`${item.date}-${item.event}`} style={{ position: "relative", paddingBottom: 24 }}>
              <div style={{
                position: "absolute", left: -28, top: 4,
                width: 13, height: 13, borderRadius: "50%",
                background: index === 0 ? "oklch(0.78 0.13 175)" : "var(--bg-window)",
                border: index === 0 ? "none" : "0.5px solid var(--line)",
                boxShadow: index === 0 ? "0 0 0 4px oklch(0.95 0.05 175)" : "none",
              }} />
              <div style={{
                fontSize: 11, letterSpacing: "0.12em", color: "var(--ink-faint)",
                textTransform: "uppercase", fontFamily: "ui-monospace, Menlo, monospace",
              }}>
                {new Date(item.date).toLocaleString()}
              </div>
              <div style={{
                marginTop: 6, padding: 14, borderRadius: 10,
                background: index === 0 ? "oklch(0.96 0.04 175)" : "var(--bg-card)",
                border: "0.5px solid var(--line)",
                fontSize: 13.5, lineHeight: 1.55,
                color: index === 0 ? "oklch(0.32 0.07 175)" : "var(--ink)",
              }}>
                {item.event}
                <div style={{ marginTop: 8, color: "var(--ink-muted)" }}>
                  亲密度 {item.impact >= 0 ? `+${item.impact}` : item.impact} · 当前 {item.intimacyAfter}
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
