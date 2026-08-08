// Web Speech API Engine for Indonesian Read-Aloud (Narasi Suara)

export interface SpeechCallbacks {
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (err: unknown) => void;
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
    utterance.lang = 'id-ID'; // Indonesian

    // Try to find an Indonesian voice
    const voices = this.synth.getVoices();
    const idVoice = voices.find(
      (v) => v.lang.includes('id') || v.lang.includes('ID') || v.name.toLowerCase().includes('indonesia')
    );
    if (idVoice) {
      utterance.voice = idVoice;
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
