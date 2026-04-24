import { mkdir, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as llmModule from "../electron/services/llm";
import { chat } from "../electron/services/chat-engine";

const originalCwd = process.cwd();
let tempDir = "";

describe("chat engine", () => {
  beforeEach(async () => {
    process.env.OC_DEMO_FORCE_MOCK_LLM = "1";
    process.env.OC_DEMO_FORCE_MOCK_AIRJELLY = "1";
    tempDir = path.join(os.tmpdir(), `oc-world-${Date.now()}-${Math.random().toString(16).slice(2)}`);
    await mkdir(path.join(tempDir, "oc-data"), { recursive: true });
    process.chdir(tempDir);
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    process.chdir(originalCwd);
    if (tempDir) {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  it("returns chat result and persists history/relationship", async () => {
    const result = await chat({
      characterId: "char-001",
      userId: "user-001",
      userMessage: "我今天有点累，但还是想把 demo 跑通",
    });

    expect(result.text.length).toBeGreaterThan(0);
    expect(result.intimacy).toBeGreaterThan(0);
    expect(result.source).toBe("mock");
  });

  it("threads a stable session id into llm calls", async () => {
    const callLLMSpy = vi.spyOn(llmModule, "callLLM").mockResolvedValue({
      text: "收到",
      emotion: "happy",
      growthEvent: null,
    });

    await chat({
      characterId: "char-001",
      userId: "user-001",
      userMessage: "你好",
    });

    expect(callLLMSpy).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(Array),
      { sessionId: "user-001:char-001" },
    );
  });

  it("combines burst messages into one agent turn", async () => {
    const callLLMSpy = vi.spyOn(llmModule, "callLLM").mockResolvedValue({
      text: "我都看到了",
      emotion: "thinking",
      growthEvent: null,
    });

    await chat({
      characterId: "char-001",
      userId: "user-001",
      userMessage: "第一句",
      userMessages: ["第一句", "第二句"],
    });

    const messages = callLLMSpy.mock.calls[0][1];
    expect(messages.at(-1)).toEqual({
      role: "user",
      content: "第一句\n第二句",
    });
  });

  it("does not call the model when the request is already aborted", async () => {
    const callLLMSpy = vi.spyOn(llmModule, "callLLM").mockResolvedValue({
      text: "不会执行",
      emotion: "thinking",
      growthEvent: null,
    });
    const controller = new AbortController();
    controller.abort();

    await expect(
      chat(
        {
          characterId: "char-001",
          userId: "user-001",
          userMessage: "打断",
        },
        { signal: controller.signal },
      ),
    ).rejects.toMatchObject({ name: "AbortError" });
    expect(callLLMSpy).not.toHaveBeenCalled();
  });
});
