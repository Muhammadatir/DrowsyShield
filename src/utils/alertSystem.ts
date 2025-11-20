export class AlertSystem {
  private audioContext: AudioContext | null = null;
  private isPlaying: boolean = false;
  private speechSynth: SpeechSynthesis;
  private alertCount: number = 0;
  private audioElement: HTMLAudioElement | null = null;
  private isInitialized: boolean = false;

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
    this.initializeAudio();
  }
  
  private initializeAudio() {
    try {
      // Create audio element for better Android compatibility
      this.audioElement = new Audio();
      this.audioElement.preload = 'auto';
      
      // Initialize on first user interaction
      const initOnInteraction = () => {
        if (!this.isInitialized) {
          this.audioElement?.play().then(() => {
            this.audioElement?.pause();
            this.isInitialized = true;
            console.log('Audio system initialized');
          }).catch(() => {});
          
          if (this.audioContext?.state === 'suspended') {
            this.audioContext.resume();
          }
          
          document.removeEventListener('touchstart', initOnInteraction);
          document.removeEventListener('click', initOnInteraction);
        }
      };
      
      document.addEventListener('touchstart', initOnInteraction, { once: true });
      document.addEventListener('click', initOnInteraction, { once: true });
    } catch (error) {
      console.error('Error initializing audio:', error);
    }
  }

  private initAudioContext() {
    try {
      this.audioContext = new AudioContext();
    } catch (error) {
      console.error("Error initializing audio context:", error);
    }
  }

  async playAlertSound(volume: number = 0.5) {
    if (this.isPlaying) return;
    
    try {
      this.isPlaying = true;
      
      // Method 1: Try multiple beep sounds
      const beepSounds = [
        // High frequency beep
        'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmHgU7k9n1unEiBC13yO/eizEIHWq+8+OWT',
        // Alternative beep
        'data:audio/wav;base64,UklGRjIAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQ4AAAC4uLi4uLi4uLi4uLi4'
      ];
      
      for (const beepSound of beepSounds) {
        try {
          const audio = new Audio(beepSound);
          audio.volume = Math.min(volume, 1.0);
          await audio.play();
          console.log("Alert beep played successfully");
          break;
        } catch (e) {
          console.log("Beep failed, trying next...");
        }
      }
      
      // Method 2: Web Audio API fallback
      if (!this.audioContext) {
        this.initAudioContext();
      }
      
      if (this.audioContext) {
        try {
          if (this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
          }

          const oscillator = this.audioContext.createOscillator();
          const gainNode = this.audioContext.createGain();

          oscillator.connect(gainNode);
          gainNode.connect(this.audioContext.destination);

          // Create multiple frequency beeps
          const frequencies = [880, 1000, 1200];
          frequencies.forEach((freq, index) => {
            const osc = this.audioContext!.createOscillator();
            const gain = this.audioContext!.createGain();
            
            osc.connect(gain);
            gain.connect(this.audioContext!.destination);
            
            osc.frequency.value = freq;
            osc.type = "square";
            
            const startTime = this.audioContext!.currentTime + (index * 0.3);
            gain.gain.setValueAtTime(volume * 0.3, startTime);
            gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.2);
            
            osc.start(startTime);
            osc.stop(startTime + 0.2);
          });
          
          console.log("Web Audio beeps triggered");
        } catch (webAudioError) {
          console.error("Web Audio failed:", webAudioError);
        }
      }
      
      setTimeout(() => {
        this.isPlaying = false;
      }, 1500);
      
    } catch (error) {
      console.error("All audio methods failed:", error);
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
    try {
      if (!this.speechSynth) {
        console.warn("Speech synthesis not available");
        return;
      }
      
      // Cancel any ongoing speech
      this.speechSynth.cancel();
      
      // Wait a bit for cancel to complete
      setTimeout(() => {
        const alertMessage = message || this.voiceAlerts[this.alertCount % this.voiceAlerts.length];
        const utterance = new SpeechSynthesisUtterance(alertMessage);
        
        utterance.rate = 0.8;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;
        utterance.lang = 'en-US';
        
        // Try to get a specific voice for better Android compatibility
        const voices = this.speechSynth.getVoices();
        const englishVoice = voices.find(voice => 
          voice.lang.includes('en') && voice.localService
        ) || voices.find(voice => voice.lang.includes('en'));
        
        if (englishVoice) {
          utterance.voice = englishVoice;
          console.log('Using voice:', englishVoice.name);
        }
        
        utterance.onstart = () => {
          console.log('Speech started:', alertMessage);
        };
        
        utterance.onend = () => {
          console.log('Speech ended');
        };
        
        utterance.onerror = (e) => {
          console.error('Speech error:', e.error);
          // Fallback: try again with simpler message
          if (e.error === 'network') {
            const simpleUtterance = new SpeechSynthesisUtterance('Wake up!');
            simpleUtterance.volume = 1.0;
            this.speechSynth.speak(simpleUtterance);
          }
        };
        
        this.speechSynth.speak(utterance);
        console.log('Speech queued:', alertMessage);
        
      }, 100);
      
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
      low: [200, 100, 200],
      medium: [300, 150, 300, 150, 300],
      high: [500, 200, 500, 200, 500, 200, 500],
    };

    this.alertCount++;
    console.log('Triggering full alert - count:', this.alertCount);
    
    // Immediate vibration
    this.vibrateDevice(vibrationPatterns[intensity]);
    
    // Play sound immediately
    this.playAlertSound(volume);
    
    // Speak after a short delay
    setTimeout(() => {
      this.speakAlert();
    }, 500);
    
    // Additional sound after speech
    setTimeout(() => {
      this.playAlertSound(volume * 0.8);
      this.vibrateDevice([200, 100, 200]);
    }, 3000);
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
