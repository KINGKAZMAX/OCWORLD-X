import type {
  AirJellyContext,
  CharacterConfig,
  ChatCancelPayload,
  ChatHistoryEntry,
  ChatResponse,
  ChatResult,
  ChatSendPayload,
  HermesRuntimeStatus,
  MemorySummary,
  Relationship,
  TimelineItem,
} from "./index";

declare global {
  interface Window {
    ocWorld?: {
      chat: {
        sendMessage: (payload: ChatSendPayload) => Promise<ChatResult>;
        cancelActive: (payload: ChatCancelPayload) => Promise<boolean>;
        getGreeting: (payload: { characterId: string; userId: string }) => Promise<ChatResponse>;
      };
      character: {
        getCurrent: (characterId: string) => Promise<CharacterConfig>;
        saveCurrent: (payload: { characterId: string; character: CharacterConfig }) => Promise<CharacterConfig>;
      };
      timeline: {
        list: (userId: string) => Promise<TimelineItem[]>;
      };
      relationship: {
        get: (userId: string) => Promise<Relationship>;
        setIntimacyForDemo: (payload: { userId: string; intimacy: number }) => Promise<Relationship>;
      };
      memory: {
        summaries: (userId: string) => Promise<MemorySummary[]>;
        history: (userId: string) => Promise<ChatHistoryEntry[]>;
      };
      airjelly: {
        getContext: () => Promise<AirJellyContext>;
      };
      hermes: {
        getStatus: () => Promise<HermesRuntimeStatus>;
        onStatusChanged: (callback: (status: HermesRuntimeStatus) => void) => () => void;
      };
    };
  }
}

export {};
