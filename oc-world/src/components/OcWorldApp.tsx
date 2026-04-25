import { useEffect, useMemo, useState } from "react";
import { useChat } from "../hooks/useChat";
import { ChatView } from "./ChatView";
import { CreateView } from "./CreateView";
import { MemoryView } from "./MemoryView";
import { OcPanel } from "./OcPanel";
import { ResizablePanel } from "./ResizablePanel";
import { ResidentOC } from "./ResidentOC";
import { RewindView } from "./RewindView";
import { SettingsView } from "./SettingsView";
import { SplashScreen } from "./SplashScreen";
import { TabBar } from "./TabBar";
import { type SessionId, type ViewId, bootRows, toSessionItems, visibleMessages } from "./shared";

export function OcWorldApp() {
  const chat = useChat();
  const [view, setView] = useState<ViewId>("chat");
  const [selectedSession, setSelectedSession] = useState<SessionId>("live");
  const [splash, setSplash] = useState<"visible" | "leaving" | "hidden">("visible");

  const sessions = useMemo(() => toSessionItems(chat.history), [chat.history]);
  const messages = useMemo(
    () => visibleMessages(chat.history, chat.pendingMessages, chat.isSending, selectedSession),
    [chat.history, chat.isSending, chat.pendingMessages, selectedSession],
  );

  useEffect(() => {
    if (selectedSession.startsWith("entry:") && !sessions.some((s) => s.id === selectedSession)) {
      setSelectedSession("live");
    }
  }, [selectedSession, sessions]);

  const sendPrompt = async (text: string) => {
    if (!text.trim()) return;
    setSelectedSession("live");
    setView("chat");
    await chat.sendMessage(text);
  };

  const startBlankChat = () => {
    setSelectedSession("new");
    setView("chat");
  };

  const dismissSplash = () => {
    setSplash("leaving");
    window.setTimeout(() => setSplash("hidden"), 500);
  };

  const handleCreateSave = async (data: { name: string; personality: string; catchphrase: string; relationshipSetup: string; avatarPath?: string }) => {
    if (window.ocWorld) {
      await window.ocWorld.character.saveCurrent({
        characterId: "char-001",
        character: {
          id: "char-001",
          name: data.name,
          personality: data.personality,
          catchphrase: data.catchphrase,
          relationshipSetup: data.relationshipSetup,
          avatarLabel: data.name,
          avatarPath: data.avatarPath,
        },
      });
    }
    setView("chat");
  };

  const handleUserNameChange = async (name: string) => {
    if (!window.ocWorld || !chat.relationship) return;
    await window.ocWorld.relationship.save({
      userId: chat.relationship.userId,
      relationship: { ...chat.relationship, userName: name },
    });
  };

  const showFullWidth = view === "create" || view === "settings";

  const mainContent = (
    <main style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", background: "var(--bg-window)", position: "relative" }}>
      {view === "create" && (
        <CreateView onSave={handleCreateSave} onCancel={() => setView("chat")} />
      )}

      {view === "settings" && (
        <SettingsView
          character={chat.character}
          relationship={chat.relationship}
          onUserNameChange={handleUserNameChange}
          onRecreateOC={() => setView("create")}
          onBack={() => setView("chat")}
        />
      )}

      {!showFullWidth && (
        <>
          <TabBar current={view} onChange={setView} onSettings={() => setView("settings")} />

          {view === "chat" && (
            <ChatView
              messages={messages}
              isSending={chat.isSending}
              selectedSession={selectedSession}
              ttsEnabled={chat.ttsEnabled}
              relationship={chat.relationship}
              ocAvatarPath={chat.character?.avatarPath}
              onSend={sendPrompt}
              onInterrupt={chat.interruptActiveTurn}
              onTtsToggle={() => chat.setTtsEnabled(!chat.ttsEnabled)}
              onNewChat={startBlankChat}
            />
          )}
          {view === "rewind" && <RewindView timeline={chat.timeline} relationship={chat.relationship} />}
          {view === "memory" && <BuildingPlaceholder label="OC世界" />}
          {view === "files" && <FilesPlaceholder />}

          {splash === "hidden" && (view === "rewind" || view === "memory") && <ResidentOC />}
        </>
      )}
    </main>
  );

  return (
    <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", background: "var(--bg-window)" }}>
      {splash !== "hidden" && (
        <SplashScreen
          rows={bootRows(chat.character, chat.relationship, chat.hermesStatus.state)}
          leaving={splash === "leaving"}
          onEnter={dismissSplash}
        />
      )}

      {splash === "hidden" && !showFullWidth ? (
        <ResizablePanel
          left={
            <OcPanel
              character={chat.character}
              relationship={chat.relationship}
              ttsEnabled={chat.ttsEnabled}
              onTtsToggle={() => chat.setTtsEnabled(!chat.ttsEnabled)}
            />
          }
          right={mainContent}
        />
      ) : (
        mainContent
      )}
    </div>
  );
}

function FilesPlaceholder() {
  return (
    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ink-faint)", fontSize: 14 }}>
      文件功能即将上线
    </div>
  );
}

function BuildingPlaceholder({ label }: { label: string }) {
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8 }}>
      <span style={{ fontSize: 14, color: "var(--ink-muted)" }}>{label}</span>
      <span style={{ fontSize: 12, color: "var(--ink-faint)" }}>正在建造中…</span>
    </div>
  );
}
