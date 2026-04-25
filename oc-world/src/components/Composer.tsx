import { IconArrowUp, IconAttach, IconBars, IconBolt, IconCloud } from "./OcWorldIcons";
import { iconBtnQuiet } from "./shared";

export function Composer({
  draft,
  setDraft,
  placeholder,
  onSubmit,
  compact,
  isSending,
  ttsEnabled,
  onInterrupt,
  onTtsToggle,
}: {
  draft: string;
  setDraft: (value: string) => void;
  placeholder: string;
  onSubmit: () => void;
  compact?: boolean;
  isSending?: boolean;
  ttsEnabled?: boolean;
  onInterrupt?: () => void;
  onTtsToggle?: () => void;
}) {
  return (
    <div style={{ width: "100%", background: "var(--bg-input)", border: "0.5px solid var(--line)", borderRadius: 14, boxShadow: "0 1px 2px rgba(15,30,55,.04)", padding: "14px 16px 10px" }}>
      <textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            onSubmit();
          }
        }}
        rows={compact ? 1 : 2}
        placeholder={placeholder}
        style={{ width: "100%", border: "none", outline: "none", resize: "none", background: "transparent", color: "var(--ink)", fontSize: 14, lineHeight: 1.55, fontFamily: "inherit" }}
      />
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
        <button type="button" style={iconBtnQuiet} title="附件"><IconAttach size={14} /></button>
        <button type="button" style={iconBtnQuiet} title="上下文"><IconCloud size={14} /></button>
        <button type="button" style={iconBtnQuiet} title="模板"><IconBars size={14} /></button>
        <div style={{ flex: 1 }} />
        {onTtsToggle && (
          <button
            type="button"
            style={{ ...iconBtnQuiet, background: ttsEnabled ? "var(--accent-soft)" : "transparent", color: ttsEnabled ? "var(--accent-deep)" : "var(--ink-muted)" }}
            onClick={onTtsToggle}
            title="语音"
          >
            <IconBolt size={14} />
          </button>
        )}
        {onInterrupt && (
          <button
            type="button"
            style={{ ...iconBtnQuiet, color: isSending || ttsEnabled ? "var(--ink)" : "var(--ink-faint)" }}
            onClick={onInterrupt}
            disabled={!isSending && !ttsEnabled}
            title="停止"
          >
            ■
          </button>
        )}
        <button
          type="button"
          onClick={onSubmit}
          disabled={!draft.trim()}
          title={isSending ? "追发" : "发送"}
          style={{
            width: 30, height: 30, border: "none", borderRadius: "50%", display: "grid", placeItems: "center",
            cursor: draft.trim() ? "pointer" : "not-allowed",
            background: draft.trim() ? "oklch(0.78 0.10 220)" : "oklch(0.92 0.01 240)",
            color: draft.trim() ? "#fff" : "var(--ink-faint)",
            transition: "background .15s",
          }}
        >
          <IconArrowUp size={14} color={draft.trim() ? "#fff" : "var(--ink-faint)"} />
        </button>
      </div>
    </div>
  );
}
