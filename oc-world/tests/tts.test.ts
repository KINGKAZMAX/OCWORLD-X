import { afterEach, describe, expect, it, vi } from "vitest";
import { createBrowserTTS } from "../src/lib/tts";

class FakeUtterance {
  lang = "";
  rate = 1;
  pitch = 1;
  voice: SpeechSynthesisVoice | null = null;

  constructor(public text: string) {}
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("browser TTS", () => {
  it("speaks with a Chinese voice when speech synthesis is available", () => {
    vi.stubGlobal("SpeechSynthesisUtterance", FakeUtterance);

    const voice = { lang: "zh-CN", default: false } as SpeechSynthesisVoice;
    const synth = {
      getVoices: vi.fn(() => [voice]),
      cancel: vi.fn(),
      speak: vi.fn(),
    } as unknown as SpeechSynthesis;
    const tts = createBrowserTTS({ speechSynthesis: synth } as Window);

    tts.speak("你好");

    expect(synth.cancel).toHaveBeenCalled();
    expect(synth.speak).toHaveBeenCalledWith(
      expect.objectContaining({
        text: "你好",
        lang: "zh-CN",
        voice,
      }),
    );
  });

  it("cancels active speech", () => {
    const synth = {
      getVoices: vi.fn(() => []),
      cancel: vi.fn(),
      speak: vi.fn(),
    } as unknown as SpeechSynthesis;
    const tts = createBrowserTTS({ speechSynthesis: synth } as Window);

    tts.cancel();

    expect(synth.cancel).toHaveBeenCalled();
  });
});
