import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type {
  CharacterConfig,
  ChatHistoryEntry,
  MemorySummary,
  Relationship,
} from "../../src/types";
import {
  DEFAULT_CHARACTER,
  DEFAULT_HISTORY,
  DEFAULT_RELATIONSHIP,
  DEFAULT_SUMMARIES,
} from "./demo-fallback";
import {
  parseCharacter,
  parseHistory,
  parseMemorySummaryList,
  parseRelationship,
} from "./schemas";

function resolveDataPath(...segments: string[]) {
  return path.join(process.cwd(), "oc-data", ...segments);
}

async function ensureParentDir(filePath: string) {
  await mkdir(path.dirname(filePath), { recursive: true });
}

async function readJson<T>(filePath: string, fallback: T, parser: (value: unknown) => T): Promise<T> {
  try {
    const raw = await readFile(filePath, "utf8");
    return parser(JSON.parse(raw));
  } catch {
    return fallback;
  }
}

async function writeJson(filePath: string, value: unknown) {
  await ensureParentDir(filePath);
  await writeFile(filePath, JSON.stringify(value, null, 2), "utf8");
}

export async function loadRecentSummaries(userId: string, weeks: number): Promise<MemorySummary[]> {
  const filePath = resolveDataPath("memories", "wechat", `${userId}_summaries.json`);
  const summaries = await readJson(filePath, DEFAULT_SUMMARIES, parseMemorySummaryList);
  return summaries.slice(-weeks);
}

export async function loadOCHistory(userId: string, limit: number): Promise<ChatHistoryEntry[]> {
  const filePath = resolveDataPath("memories", "oc_conversations", `${userId}_history.json`);
  const history = await readJson(filePath, DEFAULT_HISTORY, parseHistory);
  return history.slice(-limit);
}

export async function appendOCHistory(userId: string, entry: ChatHistoryEntry): Promise<ChatHistoryEntry[]> {
  const filePath = resolveDataPath("memories", "oc_conversations", `${userId}_history.json`);
  const nextHistory = [...(await loadOCHistory(userId, 50)), entry].slice(-20);
  await writeJson(filePath, nextHistory);
  return nextHistory;
}

export async function loadRelationship(userId: string): Promise<Relationship> {
  const filePath = resolveDataPath("relationships", `${userId}.json`);
  const fallback = { ...DEFAULT_RELATIONSHIP, userId };
  return readJson(filePath, fallback, parseRelationship);
}

export async function saveRelationship(userId: string, relationship: Relationship): Promise<Relationship> {
  const filePath = resolveDataPath("relationships", `${userId}.json`);
  await writeJson(filePath, relationship);
  return relationship;
}

export async function loadCharacter(characterId: string): Promise<CharacterConfig> {
  const filePath = resolveDataPath("characters", `${characterId}.json`);
  const fallback = { ...DEFAULT_CHARACTER, id: characterId };
  return readJson(filePath, fallback, parseCharacter);
}

export async function saveCharacter(characterId: string, character: CharacterConfig): Promise<CharacterConfig> {
  const filePath = resolveDataPath("characters", `${characterId}.json`);
  await writeJson(filePath, character);
  return character;
}

export async function listTimeline(userId: string) {
  const relationship = await loadRelationship(userId);
  let runningIntimacy = 0;
  return relationship.keyMoments.map((item) => {
    runningIntimacy = Math.max(0, Math.min(100, runningIntimacy + item.impact));
    return {
      ...item,
      intimacyAfter: runningIntimacy,
    };
  });
}
