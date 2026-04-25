import { z } from "zod";
import type {
  AirJellyContext,
  CharacterConfig,
  ChatHistoryEntry,
  MemorySummary,
  Relationship,
} from "../../src/types";

const appEventSchema = z.object({
  title: z.string(),
  appName: z.string(),
  durationSeconds: z.number(),
  timestamp: z.number(),
});

const taskSchema = z.object({
  title: z.string(),
  progressSummary: z.string(),
  dueDate: z.number().optional(),
});

const appUsageSchema = z.object({
  appName: z.string(),
  totalSeconds: z.number(),
});

const airJellyContextSchema = z.object({
  events: z.array(appEventSchema),
  tasks: z.array(taskSchema),
  appUsage: z.array(appUsageSchema),
  source: z.enum(["mock", "airjelly"]),
});

const summarySchema = z.object({
  period: z.string(),
  topics: z.array(z.string()),
  emotions: z.array(z.string()),
  keyMoments: z.array(z.string()),
  relationshipSignals: z.object({
    closeness: z.number(),
    note: z.string(),
  }),
});

const relationshipSchema = z.object({
  userId: z.string(),
  userName: z.string().default("你"),
  intimacy: z.number(),
  stage: z.enum(["stranger", "acquaintance", "friend", "close_friend", "soulmate"]),
  preferences: z.object({
    topics: z.array(z.string()),
    avoid: z.array(z.string()),
    communicationStyle: z.string(),
  }),
  keyMoments: z.array(
    z.object({
      date: z.string(),
      event: z.string(),
      impact: z.number(),
    }),
  ),
  lastInteraction: z.number(),
  moodBaseline: z.string(),
});

const characterSchema = z.object({
  id: z.string(),
  name: z.string(),
  personality: z.string(),
  catchphrase: z.string(),
  relationshipSetup: z.string(),
  avatarLabel: z.string(),
  avatarPath: z.string().optional(),
});

const historySchema = z.object({
  timestamp: z.number(),
  userMessage: z.string(),
  ocResponse: z.string(),
  emotion: z.enum(["idle", "happy", "shy", "thinking", "sad", "angry"]),
});

export const airJellyContextListSchema = airJellyContextSchema;
export const memorySummaryListSchema = z.array(summarySchema);
export const relationshipStateSchema = relationshipSchema;
export const characterConfigSchema = characterSchema;
export const chatHistoryListSchema = z.array(historySchema);

export function parseAirJellyContext(value: unknown): AirJellyContext {
  return airJellyContextListSchema.parse(value) as AirJellyContext;
}

export function parseMemorySummaryList(value: unknown): MemorySummary[] {
  return memorySummaryListSchema.parse(value) as MemorySummary[];
}

export function parseRelationship(value: unknown): Relationship {
  return relationshipStateSchema.parse(value) as Relationship;
}

export function parseCharacter(value: unknown): CharacterConfig {
  return characterConfigSchema.parse(value) as CharacterConfig;
}

export function parseHistory(value: unknown): ChatHistoryEntry[] {
  return chatHistoryListSchema.parse(value) as ChatHistoryEntry[];
}
