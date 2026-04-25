import { contextBridge, ipcRenderer } from "electron";

const hermesStatusChangedChannel = "hermes:status-changed";

contextBridge.exposeInMainWorld("ocWorld", {
  chat: {
    sendMessage: (payload: import("../src/types").ChatSendPayload) => ipcRenderer.invoke("chat:send-message", payload),
    cancelActive: (payload: import("../src/types").ChatCancelPayload) =>
      ipcRenderer.invoke("chat:cancel-active", payload),
    getGreeting: (payload: { characterId: string; userId: string }) =>
      ipcRenderer.invoke("chat:get-greeting", payload),
  },
  character: {
    getCurrent: (characterId: string) => ipcRenderer.invoke("character:get-current", characterId),
    saveCurrent: (payload: { characterId: string; character: import("../src/types").CharacterConfig }) =>
      ipcRenderer.invoke("character:save-current", payload),
  },
  timeline: {
    list: (userId: string) => ipcRenderer.invoke("timeline:list", userId),
  },
  relationship: {
    get: (userId: string) => ipcRenderer.invoke("relationship:get", userId),
    setIntimacyForDemo: (payload: { userId: string; intimacy: number }) =>
      ipcRenderer.invoke("relationship:set-intimacy-for-demo", payload),
  },
  memory: {
    summaries: (userId: string) => ipcRenderer.invoke("memory:summaries", userId),
    history: (userId: string) => ipcRenderer.invoke("memory:history", userId),
  },
  airjelly: {
    getContext: () => ipcRenderer.invoke("airjelly:get-context"),
  },
  hermes: {
    getStatus: () => ipcRenderer.invoke("hermes:get-status"),
    onStatusChanged: (callback: (status: import("../src/types").HermesRuntimeStatus) => void) => {
      const listener = (_event: Electron.IpcRendererEvent, status: import("../src/types").HermesRuntimeStatus) => {
        callback(status);
      };

      ipcRenderer.on(hermesStatusChangedChannel, listener);

      return () => {
        ipcRenderer.removeListener(hermesStatusChangedChannel, listener);
      };
    },
  },
});
