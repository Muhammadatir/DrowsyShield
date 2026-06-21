// Crash detection using DeviceMotion API (accelerometer)
// Crash threshold: sudden G-force spike > 2.5G (25 m/s²)

const CRASH_THRESHOLD = 25; // m/s² (~2.5G)
const COOLDOWN_MS = 10000; // 10s between alerts

type CrashCallback = (force: number) => void;

class CrashDetector {
  private listening = false;
  private lastCrashTime = 0;
  private onCrash: CrashCallback | null = null;
  private handler: ((e: DeviceMotionEvent) => void) | null = null;

  start(onCrash: CrashCallback) {
    if (this.listening) return;
    if (!window.DeviceMotionEvent) {
      console.warn('DeviceMotion not supported');
      return;
    }

    this.onCrash = onCrash;
    this.handler = (e: DeviceMotionEvent) => this.handleMotion(e);
    window.addEventListener('devicemotion', this.handler);
    this.listening = true;
    console.log('Crash detection started');
  }

  stop() {
    if (this.handler) {
      window.removeEventListener('devicemotion', this.handler);
      this.handler = null;
    }
    this.listening = false;
    console.log('Crash detection stopped');
  }

  private handleMotion(e: DeviceMotionEvent) {
    const acc = e.accelerationIncludingGravity;
    if (!acc || acc.x == null || acc.y == null || acc.z == null) return;

    const force = Math.sqrt(acc.x ** 2 + acc.y ** 2 + acc.z ** 2);
    const now = Date.now();

    if (force > CRASH_THRESHOLD && now - this.lastCrashTime > COOLDOWN_MS) {
      this.lastCrashTime = now;
      console.log(`🚨 Crash detected! Force: ${force.toFixed(1)} m/s²`);
      this.onCrash?.(force);
    }
  }

  isSupported() {
    return typeof window !== 'undefined' && 'DeviceMotionEvent' in window;
  }

  // iOS 13+ requires permission
  async requestPermission(): Promise<boolean> {
    const DME = DeviceMotionEvent as any;
    if (typeof DMe?.requestPermission === 'function') {
      try {
        const result = await DMe.requestPermission();
        return result === 'granted';
      } catch {
        return false;
      }
    }
    return true; // Android / non-iOS doesn't need permission
  }
}

export const crashDetector = new CrashDetector();
