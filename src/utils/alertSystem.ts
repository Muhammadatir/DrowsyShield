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
    try {
      // Try HTML5 Audio first (better Android support)
      const audio = new Audio();
      audio.volume = volume;
      
      // Create a simple beep sound using data URL
      const beepSound = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmHgU7k9n1unEiBC13yO/eizEIHWq+8+OWT';
      audio.src = beepSound;
      
      await audio.play();
      console.log("Alert sound playing at volume:", volume);
      
    } catch (error) {
      console.log("HTML5 Audio failed, trying Web Audio API");
      
      // Fallback to Web Audio API
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

        console.log("Web Audio API sound playing at volume:", volume);

        setTimeout(() => {
          this.isPlaying = false;
        }, 1000);
      } catch (webAudioError) {
        console.error("Error playing alert sound:", webAudioError);
        this.isPlaying = false;
      }
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
    try {
      if (!this.speechSynth) {
        console.warn("Speech synthesis not available");
        return;
      }
      
      this.speechSynth.cancel();
      const alertMessage = message || this.voiceAlerts[this.alertCount % this.voiceAlerts.length];
      const utterance = new SpeechSynthesisUtterance(alertMessage);
      
      utterance.rate = 0.9;
      utterance.pitch = 1.1;
      utterance.volume = 1.0; // Max volume for Android
      utterance.lang = 'en-US';
      
      // Add event listeners for debugging
      utterance.onstart = () => console.log('Speech started');
      utterance.onend = () => console.log('Speech ended');
      utterance.onerror = (e) => console.error('Speech error:', e);
      
      this.speechSynth.speak(utterance);
      console.log('Speaking:', alertMessage);
      
      if (alertMessage.includes('window mode')) {
        setTimeout(() => this.playWindSound(), 1000);
      }
    } catch (error) {
      console.error('Error in speech synthesis:', error);
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
