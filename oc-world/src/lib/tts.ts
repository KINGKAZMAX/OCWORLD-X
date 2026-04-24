export type TtsState = "unsupported" | "idle" | "speaking";

export interface TtsController {
  isSupported(): boolean;
  speak(text: string): void;
  cancel(): void;
}

function pickVoice(synth: SpeechSynthesis) {
  const voices = synth.getVoices();
  return (
    voices.find((voice) => voice.lang.toLowerCase().startsWith("zh")) ||
    voices.find((voice) => voice.default) ||
    voices[0] ||
    null
  );
}

export function createBrowserTTS(win: Window | undefined = typeof window === "undefined" ? undefined : window) {
  const synth = win?.speechSynthesis;

  const controller: TtsController = {
    isSupported() {
      return Boolean(synth && typeof SpeechSynthesisUtterance !== "undefined");
    },

    speak(text: string) {
      if (!this.isSupported() || !synth || !text.trim()) {
        return;
      }

      synth.cancel();

      const utterance = new SpeechSynthesisUtterance(text.trim());
      utterance.lang = "zh-CN";
      utterance.rate = 1.03;
      utterance.pitch = 1.02;

      const voice = pickVoice(synth);
      if (voice) {
        utterance.voice = voice;
      }

      synth.speak(utterance);
    },

    cancel() {
      synth?.cancel();
    },
  };

  return controller;
}
