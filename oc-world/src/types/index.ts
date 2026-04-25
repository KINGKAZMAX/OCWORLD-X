export type Emotion = "idle" | "happy" | "shy" | "thinking" | "sad" | "angry";

export interface AppEvent {
  title: string;
  appName: string;
  durationSeconds: number;
  timestamp: number;
}

export interface TaskSummary {
  title: string;
  progressSummary: string;
  dueDate?: number;
}

export interface AppUsage {
  appName: string;
  totalSeconds: number;
}

export interface AirJellyContext {
  events: AppEvent[];
  tasks: TaskSummary[];
  appUsage: AppUsage[];
  source: "mock" | "airjelly";
}

export interface ChatMessage {
  timestamp: number;
  sender: string;
  content: string;
  type: "text" | "image" | "voice" | "quote" | "emoji";
}

export interface MemorySummary {
  period: string;
  topics: string[];
  emotions: string[];
  keyMoments: string[];
  relationshipSignals: {
    closeness: number;
    note: string;
  };
}

export interface GrowthMoment {
  date: string;
  event: string;
  impact: number;
}

export type RelationshipStage =
  | "stranger"
  | "acquaintance"
  | "friend"
  | "close_friend"
  | "soulmate";

export interface Relationship {
  userId: string;
  intimacy: number;
  stage: RelationshipStage;
  preferences: {
    topics: string[];
    avoid: string[];
    communicationStyle: string;
  };
  keyMoments: GrowthMoment[];
  lastInteraction: number;
  moodBaseline: string;
}

export interface CharacterConfig {
  id: string;
  name: string;
  personality: string;
  catchphrase: string;
  relationshipSetup: string;
  avatarLabel: string;
}

export interface ChatHistoryEntry {
  timestamp: number;
  userMessage: string;
  ocResponse: string;
  emotion: Emotion;
}

export interface PendingChatMessage {
  id: string;
  timestamp: number;
  content: string;
}

export interface ChatSendPayload {
  characterId: string;
  userId: string;
  userMessage: string;
  userMessages?: string[];
  requestId?: string;
  interrupt?: boolean;
}

export interface ChatCancelPayload {
  characterId: string;
  userId: string;
}

export interface ChatResponse {
  text: string;
  emotion: Emotion;
  growthEvent: string | null;
}

export interface ChatResult extends ChatResponse {
  intimacy: number;
  stage: RelationshipStage;
  source: AirJellyContext["source"];
}

export type HermesRuntimeState = "disabled" | "starting" | "healthy" | "unhealthy" | "crashed" | "stopped";

export interface HermesRuntimeStatus {
  state: HermesRuntimeState;
  pid: number | null;
  restartCount: number;
  lastError: string | null;
  lastStartedAt: number | null;
  lastHealthCheckAt: number | null;
}

export interface TimelineItem extends GrowthMoment {
  intimacyAfter: number;
}

export interface CreateCharacterInput {
  name: string;
  personality: string;
  catchphrase: string;
  relationshipSetup: string;
}
