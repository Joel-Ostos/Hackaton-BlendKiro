export class AudioManager {
  constructor() {
    this.audioCtx = null;
    this.flapBuffer = null;
    this.collisionBuffer = null;
    this.musicNode = null;
  }

  async init() {
    try {
      this.audioCtx = new AudioContext();
    } catch (e) {
      console.warn('AudioManager: failed to create AudioContext', e);
      return;
    }

    await this._loadBuffer('assets/jump.wav', 'flapBuffer');
    await this._loadBuffer('assets/game_over.wav', 'collisionBuffer');
  }

  async _loadBuffer(url, prop) {
    try {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      this[prop] = await this.audioCtx.decodeAudioData(arrayBuffer);
    } catch (e) {
      console.warn(`AudioManager: failed to load ${url}`, e);
    }
  }

  playFlap() {
    if (!this.audioCtx || !this.flapBuffer) return;
    try {
      const source = this.audioCtx.createBufferSource();
      source.buffer = this.flapBuffer;
      source.connect(this.audioCtx.destination);
      source.start();
    } catch (e) {
      console.warn('AudioManager: playFlap failed', e);
    }
  }

  playCollision() {
    if (!this.audioCtx || !this.collisionBuffer) return;
    try {
      const source = this.audioCtx.createBufferSource();
      source.buffer = this.collisionBuffer;
      source.connect(this.audioCtx.destination);
      source.start();
    } catch (e) {
      console.warn('AudioManager: playCollision failed', e);
    }
  }

  playScore() {
    if (!this.audioCtx) return;
    try {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.value = 880;
      const now = this.audioCtx.currentTime;
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.08);
    } catch (e) {
      console.warn('AudioManager: playScore failed', e);
    }
  }

  playCoin() {
    if (!this.audioCtx) return;
    try {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.value = 1200;
      const now = this.audioCtx.currentTime;
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.06);
    } catch (e) {
      console.warn('AudioManager: playCoin failed', e);
    }
  }

  startMusic() {
    if (!this.audioCtx || this.musicNode) return;
    try {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.value = 55;
      gain.gain.value = 0.08;
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.loop = true;
      osc.start();
      this.musicNode = osc;
    } catch (e) {
      console.warn('AudioManager: startMusic failed', e);
    }
  }

  stopMusic() {
    if (!this.musicNode) return;
    try {
      this.musicNode.disconnect();
      this.musicNode.stop();
    } catch (e) {
      // already stopped or disconnected
    }
    this.musicNode = null;
  }

  setMuted(muted) {
    if (!this.audioCtx) return;
    try {
      if (muted) {
        this.audioCtx.suspend();
      } else {
        this.audioCtx.resume();
      }
    } catch (e) {
      console.warn('AudioManager: setMuted failed', e);
    }
  }
}
