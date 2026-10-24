// Advanced Crash Detection Engine — Multi-signal with Confidence Score

export interface CrashSignals {
  accelerationSpike: number;    // m/s²
  deltaAcceleration: number;    // change in acceleration
  orientationChange: number;    // degrees
  impactDuration: number;       // ms
  postImpactInactivity: boolean;
}

export interface CrashResult {
  detected: boolean;
  confidence: number;           // 0-100
  signals: CrashSignals;
  description: string;
}

type CrashCallback = (result: CrashResult) => void;

const HISTORY_SIZE = 20;
const COOLDOWN_MS = 15000;

class AdvancedCrashDetector {
  private listening = false;
  private motionHandler: ((e: DeviceMotionEvent) => void) | null = null;
  private orientationHandler: ((e: DeviceOrientationEvent) => void) | null = null;
  private onCrash: CrashCallback | null = null;
  private lastCrashTime = 0;

  private accelHistory: number[] = [];
  private lastOrientation = { alpha: 0, beta: 0, gamma: 0 };
  private currentOrientation = { alpha: 0, beta: 0, gamma: 0 };
  private impactStartTime = 0;
  private inImpact = false;
  private postImpactTimer: number | null = null;
  private postImpactInactivity = false;

  start(onCrash: CrashCallback) {
    if (this.listening) return;
    if (!window.DeviceMotionEvent) {
      console.warn('DeviceMotion not supported');
      return;
    }

    this.onCrash = onCrash;

    this.orientationHandler = (e: DeviceOrientationEvent) => {
      this.lastOrientation = { ...this.currentOrientation };
      this.currentOrientation = {
        alpha: e.alpha || 0,
        beta: e.beta || 0,
        gamma: e.gamma || 0,
      };
    };

    this.motionHandler = (e: DeviceMotionEvent) => this.handleMotion(e);

    window.addEventListener('deviceorientation', this.orientationHandler);
    window.addEventListener('devicemotion', this.motionHandler);
    this.listening = true;
    console.log('Advanced crash detection started');
  }

  stop() {
    if (this.motionHandler) window.removeEventListener('devicemotion', this.motionHandler);
    if (this.orientationHandler) window.removeEventListener('deviceorientation', this.orientationHandler);
    this.motionHandler = null;
    this.orientationHandler = null;
    this.listening = false;
    if (this.postImpactTimer) clearTimeout(this.postImpactTimer);
    console.log('Advanced crash detection stopped');
  }

  private handleMotion(e: DeviceMotionEvent) {
    const acc = e.accelerationIncludingGravity;
    if (!acc || acc.x == null || acc.y == null || acc.z == null) return;

    const force = Math.sqrt(acc.x ** 2 + acc.y ** 2 + acc.z ** 2);
    this.accelHistory.push(force);
    if (this.accelHistory.length > HISTORY_SIZE) this.accelHistory.shift();

    const now = Date.now();
    if (now - this.lastCrashTime < COOLDOWN_MS) return;

    const result = this.analyzeCrash(force, now);
    if (result.detected && result.confidence >= 60) {
      this.lastCrashTime = now;
      this.onCrash?.(result);
    }
  }

  private analyzeCrash(currentForce: number, now: number): CrashResult {
    // 1. Acceleration spike
    const accelerationSpike = currentForce;

    // 2. Delta acceleration (sudden change)
    const prev = this.accelHistory.length >= 2
      ? this.accelHistory[this.accelHistory.length - 2]
      : currentForce;
    const deltaAcceleration = Math.abs(currentForce - prev);

    // 3. Orientation change
    const dAlpha = Math.abs(this.currentOrientation.alpha - this.lastOrientation.alpha);
    const dBeta = Math.abs(this.currentOrientation.beta - this.lastOrientation.beta);
    const dGamma = Math.abs(this.currentOrientation.gamma - this.lastOrientation.gamma);
    const orientationChange = Math.min(180, dAlpha * 0.3 + dBeta + dGamma);

    // 4. Impact duration tracking
    if (currentForce > 20 && !this.inImpact) {
      this.inImpact = true;
      this.impactStartTime = now;
    } else if (currentForce < 15 && this.inImpact) {
      this.inImpact = false;
    }
    const impactDuration = this.inImpact ? now - this.impactStartTime : 0;

    // 5. Post-impact inactivity (device stops moving after impact)
    if (currentForce > 25) {
      if (this.postImpactTimer) clearTimeout(this.postImpactTimer);
      this.postImpactInactivity = false;
      this.postImpactTimer = window.setTimeout(() => {
        const recentForces = this.accelHistory.slice(-5);
        const avgRecent = recentForces.reduce((a, b) => a + b, 0) / recentForces.length;
        this.postImpactInactivity = avgRecent < 12; // near gravity only = stationary
      }, 2000);
    }

    // --- Confidence Scoring ---
    let confidence = 0;

    // Spike contribution (max 40 pts)
    if (accelerationSpike > 40) confidence += 40;
    else if (accelerationSpike > 25) confidence += 25;
    else if (accelerationSpike > 15) confidence += 10;

    // Delta contribution (max 25 pts)
    if (deltaAcceleration > 20) confidence += 25;
    else if (deltaAcceleration > 10) confidence += 15;
    else if (deltaAcceleration > 5) confidence += 8;

    // Orientation change (max 20 pts)
    if (orientationChange > 30) confidence += 20;
    else if (orientationChange > 15) confidence += 12;
    else if (orientationChange > 5) confidence += 5;

    // Post-impact inactivity (max 15 pts)
    if (this.postImpactInactivity) confidence += 15;

    confidence = Math.min(100, confidence);
    const detected = confidence >= 60;

    const description = this.buildDescription(accelerationSpike, orientationChange, this.postImpactInactivity);

    return {
      detected,
      confidence,
      signals: {
        accelerationSpike,
        deltaAcceleration,
        orientationChange,
        impactDuration,
        postImpactInactivity: this.postImpactInactivity,
      },
      description,
    };
  }

  private buildDescription(spike: number, orientation: number, inactivity: boolean): string {
    const parts: string[] = [];
    if (spike > 25) parts.push('High-force impact detected');
    if (orientation > 15) parts.push('Significant orientation change');
    if (inactivity) parts.push('Post-impact inactivity detected');
    return parts.join(' · ') || 'Possible impact detected';
  }

  isSupported() {
    return typeof window !== 'undefined' && 'DeviceMotionEvent' in window;
  }

  async requestPermission(): Promise<boolean> {
    const DME = DeviceMotionEvent as any;
    if (typeof DME?.requestPermission === 'function') {
      try {
        const result = await DME.requestPermission();
        return result === 'granted';
      } catch {
        return false;
      }
    }
    return true;
  }
}

export const advancedCrashDetector = new AdvancedCrashDetector();
