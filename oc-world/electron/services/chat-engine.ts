import type { ChatResponse, ChatResult, ChatSendPayload } from "../../src/types";
import { getAirJellyContext } from "./airjelly";
import {
  appendOCHistory,
  loadCharacter,
  loadOCHistory,
  loadRecentSummaries,
  loadRelationship,
  saveRelationship,
} from "./memory";
import { callLLM } from "./llm";
import { buildSystemPrompt } from "./prompt-builder";
import { calculateIntimacyDelta, updateRelationshipState } from "./relationship";

interface ChatOptions {
  signal?: AbortSignal;
}

function getTurnMessages(payload: ChatSendPayload) {
  const messages = (payload.userMessages?.length ? payload.userMessages : [payload.userMessage])
    .map((message) => message.trim())
    .filter(Boolean);

  return messages.length ? messages : [payload.userMessage.trim()].filter(Boolean);
}

function throwIfAborted(signal?: AbortSignal) {
  if (!signal?.aborted) {
    return;
  }

  const error = new Error("Chat request aborted");
  error.name = "AbortError";
  throw error;
}

export async function chat(payload: ChatSendPayload, options: ChatOptions = {}): Promise<ChatResult> {
  const turnMessages = getTurnMessages(payload);
  const combinedUserMessage = turnMessages.join("\n");

  throwIfAborted(options.signal);

  const [airjellyCtx, wxMemories, recentChat, relationship, character] = await Promise.all([
    getAirJellyContext(),
    loadRecentSummaries(payload.userId, 3),
    loadOCHistory(payload.userId, 10),
    loadRelationship(payload.userId),
    loadCharacter(payload.characterId),
  ]);

  const systemPrompt = buildSystemPrompt({
    character,
    airjellyCtx,
    wxMemories,
    relationship,
    recentChat,
  });

  const messages = [
    ...recentChat.flatMap((entry) => [
      { role: "user", content: entry.userMessage },
      { role: "assistant", content: entry.ocResponse },
    ]),
    { role: "user", content: combinedUserMessage },
  ];

  throwIfAborted(options.signal);

  const llmOptions = {
    sessionId: `${payload.userId}:${payload.characterId}`,
    ...(options.signal ? { signal: options.signal } : {}),
  };
  const response = await callLLM(systemPrompt, messages, llmOptions);

  throwIfAborted(options.signal);

  const intimacyDelta = calculateIntimacyDelta(combinedUserMessage, relationship.intimacy);
  const nextRelationship = updateRelationshipState(relationship, intimacyDelta, response.growthEvent);

  await Promise.all([
    saveRelationship(payload.userId, nextRelationship),
    appendOCHistory(payload.userId, {
      timestamp: Date.now(),
      userMessage: combinedUserMessage,
      ocResponse: response.text,
      emotion: response.emotion,
    }),
  ]);

  return {
    ...response,
    intimacy: nextRelationship.intimacy,
    stage: nextRelationship.stage,
    source: airjellyCtx.source,
  };
}

export async function generateGreeting(payload: {
  characterId: string;
  userId: string;
}): Promise<ChatResponse> {
  const [airjellyCtx, relationship, character, recentChat, wxMemories] = await Promise.all([
    getAirJellyContext(),
    loadRelationship(payload.userId),
    loadCharacter(payload.characterId),
    loadOCHistory(payload.userId, 6),
    loadRecentSummaries(payload.userId, 3),
  ]);

  const systemPrompt = buildSystemPrompt({
    character,
    airjellyCtx,
    wxMemories,
    relationship,
    recentChat,
  });

  return callLLM(systemPrompt, [
    {
      role: "user",
      content: "[系统指令] 主人刚打开应用。根据今天的状态，主动说一句欢迎语。",
    },
  ], {
    sessionId: `${payload.userId}:${payload.characterId}:greeting`,
  });
}
