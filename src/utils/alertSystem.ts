export class AlertSystem {
  private audioContext: AudioContext | null = null;
  private isPlaying: boolean = false;
  private speechSynth: SpeechSynthesis;
  private alertCount: number = 0;

  private voiceAlerts = [
    "You look tired. Please take a break.",
    "Stay alert! Your safety matters.",
    "Hydrate yourself and stay focused.",
    "Fresh air might help. Opening window mode.",
    "Consider pulling over for a rest."
  ];

  constructor() {
    this.initAudioContext();
    this.speechSynth = window.speechSynthesis;
  }

  private initAudioContext() {
    try {
      this.audioContext = new AudioContext();
    } catch (error) {
      console.error("Error initializing audio context:", error);
    }
  }

  async playAlertSound(volume: number = 0.5) {
    if (!this.audioContext) {
      this.initAudioContext();
    }
    
    if (!this.audioContext || this.isPlaying) return;

    try {
      // Resume audio context if suspended (browser autoplay policy)
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      this.isPlaying = true;
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      oscillator.frequency.value = 880; // A5 note - loud and attention-grabbing
      oscillator.type = "square"; // More harsh sound for alertness

      gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        this.audioContext.currentTime + 1.0
      );

      oscillator.start();
      oscillator.stop(this.audioContext.currentTime + 1.0);

      console.log("Alert sound playing at volume:", volume);

      setTimeout(() => {
        this.isPlaying = false;
      }, 1000);
    } catch (error) {
      console.error("Error playing alert sound:", error);
      this.isPlaying = false;
    }
  }

  vibrateDevice(pattern: number[] = [200, 100, 200]) {
    if ("vibrate" in navigator) {
      navigator.vibrate(pattern);
      console.log("Device vibration triggered");
    } else {
      console.warn("Vibration API not supported");
    }
  }

  speakAlert(message?: string) {
    if (!this.speechSynth) return;
    
    this.speechSynth.cancel();
    const alertMessage = message || this.voiceAlerts[this.alertCount % this.voiceAlerts.length];
    const utterance = new SpeechSynthesisUtterance(alertMessage);
    
    utterance.rate = 0.9;
    utterance.pitch = 1.1;
    utterance.volume = 0.8;
    
    this.speechSynth.speak(utterance);
    
    if (alertMessage.includes('window mode')) {
      this.playWindSound();
    }
  }

  playWindSound() {
    if (!this.audioContext) return;
    
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    const filter = this.audioContext.createBiquadFilter();
    
    oscillator.type = 'sawtooth';
    oscillator.frequency.value = 100;
    filter.type = 'lowpass';
    filter.frequency.value = 300;
    
    oscillator.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 5);
    
    oscillator.start();
    oscillator.stop(this.audioContext.currentTime + 5);
  }

  triggerFullAlert(volume: number = 0.7, intensity: "low" | "medium" | "high" = "high") {
    const vibrationPatterns = {
      low: [100, 50, 100],
      medium: [200, 100, 200],
      high: [300, 100, 300, 100, 300],
    };

    this.alertCount++;
    this.speakAlert();
    
    setTimeout(() => {
      this.playAlertSound(volume * 0.5);
      this.vibrateDevice(vibrationPatterns[intensity]);
    }, 2000);
  }

  stopAllAlerts() {
    this.isPlaying = false;
    if (navigator.vibrate) {
      navigator.vibrate(0);
    }
    if (this.speechSynth) {
      this.speechSynth.cancel();
    }
  }
}

export const alertSystem = new AlertSystem();
