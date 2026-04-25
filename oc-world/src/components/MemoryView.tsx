import type { Relationship, TimelineItem } from "../types";
import { ViewHeader } from "./ViewHeader";

export function MemoryView({ relationship, timeline }: { relationship: Relationship | null; timeline: TimelineItem[] }) {
  const memoryGroups = [
    {
      title: "关于你",
      items: relationship?.preferences.topics.length
        ? relationship.preferences.topics
        : ["习惯凌晨 1 点睡", "喝拿铁不加糖", "外婆做的桂花糕", "会因为下雨心情低落"].slice(0, relationship?.preferences.topics.length ?? 0),
    },
    {
      title: "你提过的人",
      items: relationship?.preferences.avoid.length
        ? relationship.preferences.avoid
        : ["还在收集"],
    },
    {
      title: "正在挂念的事",
      items: timeline.slice(-3).reverse().map((item) => item.event).length
        ? timeline.slice(-3).reverse().map((item) => item.event)
        : ["还在收集"],
    },
  ];

  const aboutItems = relationship?.preferences.topics.length
    ? relationship.preferences.topics
    : ["习惯凌晨 1 点睡", "喝拿铁不加糖", "外婆做的桂花糕", "会因为下雨心情低落"];

  const peopleItems: string[] = [];
  const worryItems = timeline.slice(-3).reverse().map((item) => item.event).length
    ? timeline.slice(-3).reverse().map((item) => item.event)
    : ["还在收集"];

  const groups = [
    { title: "关于你", items: aboutItems },
    { title: "关系状态", items: [`阶段：${relationship?.stage ?? "陌生"}`, `亲密度：${relationship?.intimacy ?? 0}`, relationship?.moodBaseline ?? "暂无基线"] },
    { title: "正在挂念的事", items: worryItems },
  ];

  return (
    <div style={{ flex: 1, overflow: "auto" }}>
      <ViewHeader title="记忆 · TA 记住的关于你的小事" />
      <div style={{ maxWidth: 880, margin: "24px auto", padding: "0 56px 80px" }}>
        <div style={{
          padding: "18px 20px", borderRadius: 12,
          background: "oklch(0.96 0.04 175)", border: "0.5px solid var(--line)",
          color: "oklch(0.32 0.07 175)", fontSize: 13.5, lineHeight: 1.6,
        }}>
          这些不是日记，也不是档案。只是 TA 在和你相处的过程里，悄悄留下来的一些小事。
        </div>

        <div style={{ marginTop: 24, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
          {groups.map((g) => (
            <section key={g.title} style={{ padding: 16, borderRadius: 12, background: "var(--bg-card)", border: "0.5px solid var(--line)" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--ink-faint)", letterSpacing: "0.16em", textTransform: "uppercase" }}>
                {g.title}
              </div>
              <ul style={{ margin: "12px 0 0", padding: 0, listStyle: "none" }}>
                {g.items.map((item, j) => (
                  <li key={`${g.title}-${j}`} style={{
                    padding: "8px 0", borderTop: j === 0 ? "none" : "0.5px dashed var(--line-soft)",
                    fontSize: 13, color: "var(--ink)", display: "flex", gap: 8,
                  }}>
                    <span style={{ color: "var(--accent-deep)", fontWeight: 700 }}>·</span>
                    <span style={{ flex: 1 }}>{item}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
