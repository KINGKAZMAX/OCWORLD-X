import { useEffect, useRef, useState } from "react";
import type { Relationship } from "../types";
import type { MessageItem, SessionId } from "./shared";
import { OcAvatar, OcAvatarLarge } from "./OcAvatar";
import { Composer } from "./Composer";
import { StatusChip } from "./ViewHeader";

export function ChatView({
  messages,
  selectedSession,
  isSending,
  ttsEnabled,
  relationship,
  ocAvatarPath,
  onSend,
  onInterrupt,
  onTtsToggle,
  onNewChat,
}: {
  messages: MessageItem[];
  selectedSession: SessionId;
  isSending: boolean;
  ttsEnabled: boolean;
  relationship: Relationship | null;
  ocAvatarPath?: string;
  onSend: (text: string) => Promise<void>;
  onInterrupt: () => void;
  onTtsToggle: () => void;
  onNewChat?: () => void;
}) {
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length]);

  const submit = () => {
    const text = draft;
    setDraft("");
    void onSend(text);
  };

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", padding: "0 24px", height: 36, flexShrink: 0 }}>
        <StatusChip label={isSending ? "thinking" : "ready"} />
        <div style={{ flex: 1 }} />
        {selectedSession !== "new" && onNewChat && (
          <button type="button" onClick={onNewChat} style={{ background: "transparent", border: "1px solid var(--line)", borderRadius: 6, padding: "2px 10px", fontSize: 11, cursor: "pointer", color: "var(--ink-muted)" }}>
            新对话
          </button>
        )}
      </div>

      {messages.length === 0 ? (
        <EmptyAgent onSend={onSend} />
      ) : (
        <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: "12px 32px 0", maxWidth: 880, width: "100%", margin: "0 auto" }}>
          {messages.map((message) => (
            <Bubble key={message.key} role={message.role} text={message.text} userName={relationship?.userName} ocAvatarPath={ocAvatarPath} />
          ))}
        </div>
      )}

      <div style={{ padding: "10px 32px 20px", maxWidth: 880, width: "100%", margin: "0 auto" }}>
        <Composer
          draft={draft}
          setDraft={setDraft}
          placeholder={isSending ? "继续追发，TA 会重新接住..." : "输入消息…"}
          onSubmit={submit}
          compact
          isSending={isSending}
          ttsEnabled={ttsEnabled}
          onInterrupt={onInterrupt}
          onTtsToggle={onTtsToggle}
        />
      </div>
    </div>
  );
}

function EmptyAgent({ onSend }: { onSend: (text: string) => Promise<void> }) {
  const [text, setText] = useState("");
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 32px" }}>
      <OcAvatarLarge size={80} />
      <div className="serif" style={{ marginTop: 16, fontSize: 24, letterSpacing: "-0.02em" }}>说点什么吧</div>
      <div style={{ marginTop: 4, fontSize: 12, color: "var(--ink-muted)" }}>TA 在听。慢慢来。</div>
      <div style={{ marginTop: 20, width: "100%", maxWidth: 600 }}>
        <Composer
          draft={text}
          setDraft={setText}
          placeholder="输入消息…"
          onSubmit={() => { if (text.trim()) { void onSend(text); setText(""); } }}
        />
      </div>
    </div>
  );
}

function Bubble({ role, text, userName, ocAvatarPath }: { role: "user" | "oc"; text: string; userName?: string; ocAvatarPath?: string }) {
  const isOC = role === "oc";
  return (
    <div style={{ display: "flex", gap: 10, marginBottom: 12, flexDirection: isOC ? "row" : "row-reverse" }}>
      {isOC ? (
        <OcAvatar size={28} animated={false} avatarPath={ocAvatarPath} />
      ) : (
        <div style={{
          width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
          background: "linear-gradient(135deg, oklch(0.78 0.13 175), oklch(0.55 0.15 175))",
          color: "#fff", fontSize: 11, fontWeight: 700, display: "grid", placeItems: "center",
        }}>{(userName ?? "你").slice(0, 1)}</div>
      )}
      <div style={{
        maxWidth: "70%", padding: "10px 14px", borderRadius: 14,
        background: isOC ? "oklch(0.96 0.03 175)" : "var(--bg-card)",
        border: "0.5px solid var(--line)",
        color: isOC ? "oklch(0.30 0.06 175)" : "var(--ink)",
        fontSize: 13.5, lineHeight: 1.55, whiteSpace: "pre-wrap" as const,
      }}>
        {text}
      </div>
    </div>
  );
}
