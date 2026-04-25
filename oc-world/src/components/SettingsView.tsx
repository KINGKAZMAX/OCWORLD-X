import { useState } from "react";
import type { CharacterConfig, Relationship } from "../types";
import { OcAvatarLarge } from "./OcAvatar";
import { IconCheck } from "./OcWorldIcons";
import { stageLabel } from "./shared";

export function SettingsView({
  character,
  relationship,
  onUserNameChange,
  onRecreateOC,
  onBack,
}: {
  character: CharacterConfig | null;
  relationship: Relationship | null;
  onUserNameChange: (name: string) => Promise<void>;
  onRecreateOC: () => void;
  onBack: () => void;
}) {
  const [userName, setUserName] = useState(relationship?.userName ?? "");
  const [saving, setSaving] = useState(false);

  const handleSaveName = async () => {
    if (!userName.trim()) return;
    setSaving(true);
    await onUserNameChange(userName.trim());
    setSaving(false);
  };

  return (
    <div style={{ flex: 1, overflowY: "auto" }}>
      <div style={{ display: "flex", alignItems: "center", padding: "12px 24px", borderBottom: "0.5px solid var(--line)", flexShrink: 0 }}>
        <button
          type="button"
          onClick={onBack}
          style={{ background: "transparent", border: "none", color: "var(--ink-muted)", fontSize: 13, cursor: "pointer" }}
        >
          ← 返回
        </button>
        <div style={{ flex: 1, textAlign: "center", fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>设置</div>
        <div style={{ width: 48 }} />
      </div>

      <div style={{ maxWidth: 560, width: "100%", margin: "0 auto", padding: "32px 24px 60px" }}>
        <Section title="个人信息">
          <FieldRow label="你的名字" hint="TA 会这样叫你">
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="输入你的名字"
              style={{
                flex: 1, padding: "8px 12px", fontSize: 13,
                border: "0.5px solid var(--line)", borderRadius: 8,
                background: "var(--bg-card)", color: "var(--ink)", outline: "none",
              }}
            />
            <button
              type="button"
              onClick={handleSaveName}
              disabled={saving || !userName.trim() || userName === relationship?.userName}
              style={{
                padding: "8px 16px", borderRadius: 8, border: "none",
                background: userName.trim() && userName !== relationship?.userName ? "oklch(0.78 0.10 220)" : "oklch(0.92 0.01 240)",
                color: userName.trim() && userName !== relationship?.userName ? "#fff" : "var(--ink-faint)",
                fontSize: 12, fontWeight: 600, cursor: "pointer",
                display: "flex", alignItems: "center", gap: 4,
              }}
            >
              {saving ? "保存中…" : <><IconCheck size={12} /> 保存</>}
            </button>
          </FieldRow>
        </Section>

        <Section title="OC 角色">
          <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "16px", borderRadius: 12, background: "var(--bg-card)", border: "0.5px solid var(--line)" }}>
            <OcAvatarLarge size={64} name={character?.name} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: "var(--ink)" }}>{character?.name ?? "OC"}</div>
              <div style={{ fontSize: 12, color: "var(--ink-muted)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {character?.personality ?? "未设置"}
              </div>
              <div style={{ fontSize: 11, color: "var(--ink-faint)", marginTop: 4, fontFamily: "ui-monospace, Menlo, monospace" }}>
                {stageLabel(relationship?.stage)} · {relationship?.intimacy ?? 0}
              </div>
            </div>
            <button
              type="button"
              onClick={onRecreateOC}
              style={{
                padding: "8px 16px", borderRadius: 8,
                border: "0.5px solid var(--line)", background: "transparent",
                color: "var(--ink)", fontSize: 12, cursor: "pointer",
                transition: "border-color .15s",
              }}
            >
              重新创作
            </button>
          </div>
        </Section>

        <Section title="偏好">
          <FieldRow label="感兴趣的话题">
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {(relationship?.preferences.topics ?? []).map((topic) => (
                <span key={topic} style={{ padding: "3px 10px", borderRadius: 6, background: "oklch(0.96 0.03 175)", fontSize: 12, color: "oklch(0.35 0.06 175)" }}>{topic}</span>
              ))}
            </div>
          </FieldRow>
          <FieldRow label="沟通风格">
            <span style={{ fontSize: 13, color: "var(--ink-muted)" }}>{relationship?.preferences.communicationStyle ?? "未设置"}</span>
          </FieldRow>
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)", marginBottom: 12, letterSpacing: ".02em" }}>{title}</div>
      {children}
    </div>
  );
}

function FieldRow({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 12, color: "var(--ink-muted)", marginBottom: 6 }}>
        {label}{hint && <span style={{ marginLeft: 6, color: "var(--ink-faint)" }}>· {hint}</span>}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {children}
      </div>
    </div>
  );
}
