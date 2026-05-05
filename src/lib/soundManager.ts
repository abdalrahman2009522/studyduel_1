/**
 * Simple Audio manager using standard Web Audio API to generate game-like sounds
 * without needing external assets.
 */

class SoundManager {
  private ctx: AudioContext | null = null;

  private init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  private playTone(freq: number, type: OscillatorType, duration: number, volume: number = 0.1) {
    this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    
    gain.gain.setValueAtTime(volume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  playClick() {
    this.playTone(440, 'sine', 0.1, 0.05);
  }

  playSuccess() {
    this.playTone(523.25, 'sine', 0.1, 0.1);
    setTimeout(() => this.playTone(659.25, 'sine', 0.1, 0.1), 100);
    setTimeout(() => this.playTone(783.99, 'sine', 0.3, 0.1), 200);
  }

  playError() {
    this.playTone(220, 'sawtooth', 0.3, 0.05);
  }

  playTimer() {
    this.playTone(880, 'sine', 0.05, 0.02);
  }

  playPowerUp() {
    this.playTone(400, 'sine', 0.1, 0.1);
    this.playTone(600, 'sine', 0.1, 0.1);
    this.playTone(800, 'sine', 0.3, 0.1);
  }

  playOpponentFound() {
    this.playTone(300, 'square', 0.2, 0.05);
    setTimeout(() => this.playTone(600, 'square', 0.4, 0.05), 200);
  }

  playLevelUp() {
    this.playTone(261.63, 'sine', 0.1, 0.1); // C4
    setTimeout(() => this.playTone(329.63, 'sine', 0.1, 0.1), 100); // E4
    setTimeout(() => this.playTone(392.00, 'sine', 0.1, 0.1), 200); // G4
    setTimeout(() => this.playTone(523.25, 'sine', 0.3, 0.1), 300); // C5
  }

  playNotification() {
    this.playTone(880, 'sine', 0.1, 0.05);
    setTimeout(() => this.playTone(660, 'sine', 0.2, 0.05), 100);
  }

  playCancel() {
    this.playTone(400, 'sine', 0.1, 0.05);
    setTimeout(() => this.playTone(200, 'sine', 0.2, 0.05), 100);
  }
}

export const soundManager = new SoundManager();
