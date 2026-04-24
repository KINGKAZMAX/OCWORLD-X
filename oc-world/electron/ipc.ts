import { BrowserWindow, ipcMain } from "electron";
import { chat, generateGreeting } from "./services/chat-engine";
import { getAirJellyContext } from "./services/airjelly";
import { hermesManager } from "./services/hermes-manager";
import {
  listTimeline,
  loadCharacter,
  loadOCHistory,
  loadRecentSummaries,
  loadRelationship,
  saveCharacter,
  saveRelationship,
} from "./services/memory";
import { getStage } from "./services/relationship";
import type { CharacterConfig, ChatSendPayload } from "../src/types";

const ipcChannels = {
  chatSendMessage: "chat:send-message",
  chatGetGreeting: "chat:get-greeting",
  characterGetCurrent: "character:get-current",
  characterSaveCurrent: "character:save-current",
  timelineList: "timeline:list",
  relationshipGet: "relationship:get",
  relationshipSetIntimacyForDemo: "relationship:set-intimacy-for-demo",
  memorySummaries: "memory:summaries",
  memoryHistory: "memory:history",
  airjellyGetContext: "airjelly:get-context",
  hermesGetStatus: "hermes:get-status",
} as const;

let registered = false;
let detachHermesListener: (() => void) | null = null;
const activeChatControllers = new Map<string, AbortController>();

function getChatSessionKey(payload: ChatSendPayload) {
  return `${payload.userId}:${payload.characterId}`;
}

function abortActiveChat(payload: ChatSendPayload) {
  const activeController = activeChatControllers.get(getChatSessionKey(payload));
  activeController?.abort();
}

export function registerIpcHandlers() {
  if (registered) {
    return;
  }

  registered = true;
  detachHermesListener = hermesManager.onStatusChanged((status) => {
    for (const window of BrowserWindow.getAllWindows()) {
      window.webContents.send("hermes:status-changed", status);
    }
  });

  ipcMain.handle(ipcChannels.chatSendMessage, async (_event, payload: ChatSendPayload) => {
    const sessionKey = getChatSessionKey(payload);

    if (payload.interrupt !== false) {
      abortActiveChat(payload);
    }

    const controller = new AbortController();
    activeChatControllers.set(sessionKey, controller);

    try {
      return await chat(payload, { signal: controller.signal });
    } finally {
      if (activeChatControllers.get(sessionKey) === controller) {
        activeChatControllers.delete(sessionKey);
      }
    }
  });
  ipcMain.handle(ipcChannels.chatGetGreeting, async (_event, payload) => generateGreeting(payload));
  ipcMain.handle(ipcChannels.characterGetCurrent, async (_event, characterId: string) => loadCharacter(characterId));
  ipcMain.handle(
    ipcChannels.characterSaveCurrent,
    async (_event, payload: { characterId: string; character: CharacterConfig }) =>
      saveCharacter(payload.characterId, payload.character),
  );
  ipcMain.handle(ipcChannels.timelineList, async (_event, userId: string) => listTimeline(userId));
  ipcMain.handle(ipcChannels.relationshipGet, async (_event, userId: string) => loadRelationship(userId));
  ipcMain.handle(
    ipcChannels.relationshipSetIntimacyForDemo,
    async (_event, payload: { userId: string; intimacy: number }) => {
      const relationship = await loadRelationship(payload.userId);
      const next = {
        ...relationship,
        intimacy: Math.max(0, Math.min(100, payload.intimacy)),
        stage: getStage(payload.intimacy),
      };
      return saveRelationship(payload.userId, next);
    },
  );
  ipcMain.handle(ipcChannels.memorySummaries, async (_event, userId: string) => loadRecentSummaries(userId, 10));
  ipcMain.handle(ipcChannels.memoryHistory, async (_event, userId: string) => loadOCHistory(userId, 20));
  ipcMain.handle(ipcChannels.airjellyGetContext, async () => getAirJellyContext());
  ipcMain.handle(ipcChannels.hermesGetStatus, async () => hermesManager.getStatus());
}

export function unregisterIpcHandlers() {
  if (!registered) {
    return;
  }

  registered = false;
  detachHermesListener?.();
  detachHermesListener = null;
  for (const controller of activeChatControllers.values()) {
    controller.abort();
  }
  activeChatControllers.clear();

  ipcMain.removeHandler(ipcChannels.chatSendMessage);
  ipcMain.removeHandler(ipcChannels.chatGetGreeting);
  ipcMain.removeHandler(ipcChannels.characterGetCurrent);
  ipcMain.removeHandler(ipcChannels.characterSaveCurrent);
  ipcMain.removeHandler(ipcChannels.timelineList);
  ipcMain.removeHandler(ipcChannels.relationshipGet);
  ipcMain.removeHandler(ipcChannels.relationshipSetIntimacyForDemo);
  ipcMain.removeHandler(ipcChannels.memorySummaries);
  ipcMain.removeHandler(ipcChannels.memoryHistory);
  ipcMain.removeHandler(ipcChannels.airjellyGetContext);
  ipcMain.removeHandler(ipcChannels.hermesGetStatus);
}
