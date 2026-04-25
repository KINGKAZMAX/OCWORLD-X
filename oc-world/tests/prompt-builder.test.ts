import { describe, expect, it } from "vitest";
import { buildSystemPrompt } from "../electron/services/prompt-builder";
import {
  DEFAULT_AIRJELLY_CONTEXT,
  DEFAULT_CHARACTER,
  DEFAULT_HISTORY,
  DEFAULT_RELATIONSHIP,
  DEFAULT_SUMMARIES,
} from "../electron/services/demo-fallback";

describe("prompt builder", () => {
  it("includes relationship, memories and events", () => {
    const prompt = buildSystemPrompt({
      character: DEFAULT_CHARACTER,
      airjellyCtx: DEFAULT_AIRJELLY_CONTEXT,
      wxMemories: DEFAULT_SUMMARIES,
      relationship: DEFAULT_RELATIONSHIP,
      recentChat: DEFAULT_HISTORY,
    });

    expect(prompt).toContain(DEFAULT_CHARACTER.name);
    expect(prompt).toContain(DEFAULT_RELATIONSHIP.stage);
    expect(prompt).toContain(DEFAULT_SUMMARIES[0].period);
    expect(prompt).toContain(DEFAULT_AIRJELLY_CONTEXT.events[0].title);
  });

  it("keeps Hermes agent tool use available before the final JSON reply", () => {
    const prompt = buildSystemPrompt({
      character: DEFAULT_CHARACTER,
      airjellyCtx: DEFAULT_AIRJELLY_CONTEXT,
      wxMemories: DEFAULT_SUMMARIES,
      relationship: DEFAULT_RELATIONSHIP,
      recentChat: DEFAULT_HISTORY,
    });

    expect(prompt).toContain("Hermes Agent");
    expect(prompt).toContain("web_search");
    expect(prompt).toContain("先让 Hermes 使用工具获取，再最终返回 JSON");
    expect(prompt).toContain("不要声称自己没有天气接口");
  });
});
