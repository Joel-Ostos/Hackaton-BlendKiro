import { PARTICLE_COUNT, PARTICLE_LIFETIME } from './config.js';

export class ParticleSystem {
  constructor() {
    this._particles = [];
  }

  get particles() {
    return this._particles;
  }

  emit(x, y) {
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      this._particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 100,   // -50 to 50 px/s
        vy: -Math.random() * 100,            // -100 to 0 px/s (upward drift)
        life: PARTICLE_LIFETIME,
        alpha: 1,
      });
    }
  }

  update(dt) {
    for (const p of this._particles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt * 1000;
      p.alpha = p.life / PARTICLE_LIFETIME;
    }
    this._particles = this._particles.filter(p => p.life > 0);
  }

  reset() {
    this._particles = [];
  }
}
