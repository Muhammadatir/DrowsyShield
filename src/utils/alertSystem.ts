import { TextToSpeech } from '@capacitor-community/text-to-speech';
import { Capacitor } from '@capacitor/core';

export class AlertSystem {
  private audioContext: AudioContext | null = null;
  private isPlaying: boolean = false;
  private speechSynth: SpeechSynthesis;
  private alertCount: number = 0;
  private audioElement: HTMLAudioElement | null = null;
  private isInitialized: boolean = false;
  private isNative: boolean = Capacitor.isNativePlatform();

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
    this.initializeSpeechSynthesis();
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
          
          // Also initialize speech synthesis
          this.initializeSpeechSynthesis();
          
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

  private initializeSpeechSynthesis() {
    if (!this.speechSynth) return;
    
    // Force load voices
    const loadVoices = () => {
      const voices = this.speechSynth.getVoices();
      console.log('Available voices:', voices.length);
      if (voices.length > 0) {
        console.log('Speech synthesis ready with voices:', voices.map(v => `${v.name} (${v.lang})`));
      }
    };
    
    // Load voices immediately if available
    loadVoices();
    
    // Also listen for voices changed event
    this.speechSynth.onvoiceschanged = loadVoices;
    
    // Test speech synthesis capability
    setTimeout(() => {
      if (this.speechSynth.getVoices().length === 0) {
        console.warn('No voices available for speech synthesis');
      }
    }, 1000);
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

  async speakAlert(message?: string, forceSpeak: boolean = false) {
    try {
      // Check if voice alerts are enabled (unless forced for testing)
      if (!forceSpeak) {
        const preferences = JSON.parse(localStorage.getItem('userPreferences') || '{}');
        if (preferences.voiceAlerts === false) {
          console.log('Voice alerts disabled in settings');
          return;
        }
      }
      
      const alertMessage = message || this.voiceAlerts[this.alertCount % this.voiceAlerts.length];
      console.log('🗣️ Attempting to speak:', alertMessage);
      
      // Use native TTS on mobile platforms
      if (this.isNative) {
        try {
          await TextToSpeech.speak({
            text: alertMessage,
            lang: 'en-US',
            rate: 1.0,
            pitch: 1.1,
            volume: 1.0,
            category: 'ambient'
          });
          console.log('✅ Native TTS completed:', alertMessage);
          return;
        } catch (nativeError) {
          console.error('❌ Native TTS failed:', nativeError);
          // Fall back to web speech synthesis
        }
      }
      
      // Web speech synthesis fallback
      if (!this.speechSynth) {
        console.warn("Speech synthesis not available");
        return;
      }
      
      // Force stop any ongoing speech
      this.speechSynth.cancel();
      
      // Wait a moment for any previous cancel to complete
      setTimeout(() => {
        const utterance = new SpeechSynthesisUtterance(alertMessage);
        utterance.rate = 1.0;
        utterance.pitch = 1.1;
        utterance.volume = 1.0;
        utterance.lang = 'en-US';
        
        // Get available voices
        const voices = this.speechSynth.getVoices();
        console.log('Available voices for speech:', voices.length);
        
        if (voices.length > 0) {
          // Prefer local English voices for better reliability
          let selectedVoice = voices.find(voice => 
            voice.lang.startsWith('en') && voice.localService
          ) || voices.find(voice => voice.lang.startsWith('en')) || voices[0];
          
          utterance.voice = selectedVoice;
          console.log('🎤 Using voice:', selectedVoice.name, selectedVoice.lang);
        }
        
        utterance.onstart = () => {
          console.log('✅ Speech started:', alertMessage);
        };
        
        utterance.onend = () => {
          console.log('✅ Speech completed successfully');
        };
        
        utterance.onerror = (e) => {
          console.error('❌ Speech error:', e.error);
        };
        
        // Speak the utterance
        this.speechSynth.speak(utterance);
        console.log('🎯 Speech utterance queued');
        
      }, 100);
      
    } catch (error) {
      console.error('❌ Error in speech synthesis:', error);
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
    console.log('🚨 TRIGGERING FULL ALERT - count:', this.alertCount);
    
    // Immediate feedback
    this.vibrateDevice(vibrationPatterns[intensity]);
    
    // Start speaking immediately (most important for user)
    console.log('🗣️ Starting voice alert...');
    this.speakAlert();
    
    // Play sound after a brief delay to not interfere with speech
    setTimeout(() => {
      console.log('🔊 Playing alert sound...');
      this.playAlertSound(volume);
    }, 200);
    
    // Additional alerts for persistent drowsiness
    setTimeout(() => {
      console.log('🔊 Playing secondary alert...');
      this.playAlertSound(volume * 0.9);
      this.vibrateDevice([300, 100, 300]);
    }, 2500);
    
    // Final voice reminder
    setTimeout(() => {
      console.log('🗣️ Final voice reminder...');
      this.speakAlert('Please pull over safely if you continue to feel drowsy.');
    }, 5000);
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

  // Test function to verify voice functionality
  async testVoiceAlert() {
    console.log('🧪 Testing voice alert functionality...');
    console.log('Platform:', this.isNative ? 'Native' : 'Web');
    console.log('Speech synthesis available:', !!this.speechSynth);
    
    if (this.isNative) {
      console.log('Using native TTS');
    } else {
      console.log('Voices loaded:', this.speechSynth?.getVoices().length || 0);
    }
    
    await this.speakAlert('Voice alert test successful. The monitoring system is working.', true);
    return true;
  }
}

export const alertSystem = new AlertSystem();

// Global function to test voice alerts (for debugging)
(window as any).testVoiceAlert = () => alertSystem.testVoiceAlert();
