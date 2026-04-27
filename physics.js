import {
  GRAVITY,
  FLAP_VELOCITY,
  TERMINAL_VELOCITY,
} from './config.js';

export class PhysicsSystem {
  constructor(canvasHeight) {
    this._canvasHeight = canvasHeight;
    this._invincibilityRemaining = 0;
    this._ghosty = {
      x: 80,
      y: canvasHeight / 2 - 20,
      vy: 0,
      width: 40,
      height: 40,
    };
  }

  get ghosty() {
    return { ...this._ghosty };
  }

  flap() {
    this._ghosty.vy = FLAP_VELOCITY;
  }

  update(dt) {
    // Apply gravity and clamp to terminal velocity
    this._ghosty.vy = Math.min(this._ghosty.vy + GRAVITY * dt, TERMINAL_VELOCITY);
    // Update position
    this._ghosty.y += this._ghosty.vy * dt;
    // Decrement invincibility (dt is in seconds, convert to ms)
    if (this._invincibilityRemaining > 0) {
      this._invincibilityRemaining -= dt * 1000;
      if (this._invincibilityRemaining < 0) {
        this._invincibilityRemaining = 0;
      }
    }
  }

  reset() {
    this._ghosty.x = 80;
    this._ghosty.y = this._canvasHeight / 2 - 20;
    this._ghosty.vy = 0;
    this._invincibilityRemaining = 0;
  }

  getHitbox() {
    const g = this._ghosty;
    return {
      x: g.x + g.width * 0.15,
      y: g.y + g.height * 0.1,
      w: g.width * 0.7,
      h: g.height * 0.8,
    };
  }

  get invincibilityRemaining() {
    return this._invincibilityRemaining;
  }

  get isInvincible() {
    return this._invincibilityRemaining > 0;
  }

  triggerInvincibility(duration) {
    this._invincibilityRemaining = duration;
  }
}
