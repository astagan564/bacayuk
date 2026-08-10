// Web Speech API Engine for Indonesian Read-Aloud (Narasi Suara)

export interface SpeechCallbacks {
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (err: unknown) => void;
  language?: 'id-ID' | 'en-US';
}

class SpeechEngine {
  private synth: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private isSpeakingState = false;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
    }
  }

  public speak(
    text: string,
    rate = 0.9,
    pitch = 1.0,
    callbacks?: SpeechCallbacks
  ) {
    if (!this.synth) {
      console.warn('Speech synthesis not supported on this browser');
      callbacks?.onEnd?.();
      return;
    }

    this.stop();

    // Clean text for smooth reading
    const cleanedText = text.replace(/[*#]/g, '');

    const utterance = new SpeechSynthesisUtterance(cleanedText);
    utterance.rate = Math.max(0.5, Math.min(1.5, rate));
    utterance.pitch = Math.max(0.5, Math.min(1.5, pitch));
    const language = callbacks?.language || 'id-ID';
    utterance.lang = language;

    // Prefer a voice matching the language currently displayed in the reader.
    const voices = this.synth.getVoices();
    const languagePrefix = language.slice(0, 2).toLowerCase();
    const matchingVoice = voices.find(
      (voice) => voice.lang.toLowerCase().startsWith(languagePrefix)
    );
    if (matchingVoice) {
      utterance.voice = matchingVoice;
    }

    utterance.onstart = () => {
      this.isSpeakingState = true;
      callbacks?.onStart?.();
    };

    utterance.onend = () => {
      this.isSpeakingState = false;
      this.currentUtterance = null;
      callbacks?.onEnd?.();
    };

    utterance.onerror = (e) => {
      this.isSpeakingState = false;
      this.currentUtterance = null;
      callbacks?.onError?.(e);
    };

    this.currentUtterance = utterance;
    this.synth.speak(utterance);
  }

  public stop() {
    if (this.synth) {
      this.synth.cancel();
      this.isSpeakingState = false;
      this.currentUtterance = null;
    }
  }

  public pause() {
    if (this.synth && this.synth.speaking) {
      this.synth.pause();
    }
  }

  public resume() {
    if (this.synth && this.synth.paused) {
      this.synth.resume();
    }
  }

  public isSpeaking(): boolean {
    return this.isSpeakingState || (this.synth ? this.synth.speaking : false);
  }
}

export const speechEngine = new SpeechEngine();
