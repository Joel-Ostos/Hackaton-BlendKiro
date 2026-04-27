import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fc from 'fast-check';
import { ParticleSystem } from './particles.js';
import { PARTICLE_COUNT, PARTICLE_LIFETIME } from './config.js';

// ---------------------------------------------------------------------------
// Unit tests — ParticleSystem basics
// ---------------------------------------------------------------------------
describe('ParticleSystem — initial state', () => {
  it('starts with no particles', () => {
    const ps = new ParticleSystem();
    assert.deepEqual(ps.particles, []);
  });
});

describe('ParticleSystem — emit', () => {
  it(`spawns exactly PARTICLE_COUNT (${PARTICLE_COUNT}) particles`, () => {
    const ps = new ParticleSystem();
    ps.emit(100, 200);
    assert.equal(ps.particles.length, PARTICLE_COUNT);
  });

  it('particles start at the emitted position', () => {
    const ps = new ParticleSystem();
    ps.emit(50, 75);
    for (const p of ps.particles) {
      assert.equal(p.x, 50);
      assert.equal(p.y, 75);
    }
  });

  it('particles start with life = PARTICLE_LIFETIME and alpha = 1', () => {
    const ps = new ParticleSystem();
    ps.emit(0, 0);
    for (const p of ps.particles) {
      assert.equal(p.life, PARTICLE_LIFETIME);
      assert.equal(p.alpha, 1);
    }
  });

  it('particles have vx in [-50, 50] and vy in [-100, 0]', () => {
    const ps = new ParticleSystem();
    for (let i = 0; i < 50; i++) ps.emit(0, 0);
    for (const p of ps.particles) {
      assert.ok(p.vx >= -50 && p.vx <= 50, `vx=${p.vx} out of range`);
      assert.ok(p.vy >= -100 && p.vy <= 0, `vy=${p.vy} out of range`);
    }
  });

  it('accumulates particles across multiple emits', () => {
    const ps = new ParticleSystem();
    ps.emit(0, 0);
    ps.emit(0, 0);
    assert.equal(ps.particles.length, PARTICLE_COUNT * 2);
  });
});

describe('ParticleSystem — update', () => {
  it('advances particle position by vx*dt and vy*dt', () => {
    const ps = new ParticleSystem();
    ps.emit(100, 200);
    const before = ps.particles.map(p => ({ x: p.x, y: p.y, vx: p.vx, vy: p.vy }));
    const dt = 0.1;
    ps.update(dt);
    for (let i = 0; i < before.length; i++) {
      assert.ok(Math.abs(ps.particles[i].x - (before[i].x + before[i].vx * dt)) < 1e-9);
      assert.ok(Math.abs(ps.particles[i].y - (before[i].y + before[i].vy * dt)) < 1e-9);
    }
  });

  it('decrements life by dt * 1000', () => {
    const ps = new ParticleSystem();
    ps.emit(0, 0);
    const dt = 0.05;
    ps.update(dt);
    for (const p of ps.particles) {
      assert.ok(Math.abs(p.life - (PARTICLE_LIFETIME - dt * 1000)) < 1e-9);
    }
  });

  it('sets alpha = life / PARTICLE_LIFETIME', () => {
    const ps = new ParticleSystem();
    ps.emit(0, 0);
    ps.update(0.1);
    for (const p of ps.particles) {
      assert.ok(Math.abs(p.alpha - p.life / PARTICLE_LIFETIME) < 1e-9);
    }
  });

  it('removes particles whose life reaches zero', () => {
    const ps = new ParticleSystem();
    ps.emit(0, 0);
    // Update with dt that fully exhausts lifetime
    ps.update(PARTICLE_LIFETIME / 1000);
    assert.equal(ps.particles.length, 0);
  });
});

describe('ParticleSystem — reset', () => {
  it('clears all particles', () => {
    const ps = new ParticleSystem();
    ps.emit(0, 0);
    ps.reset();
    assert.deepEqual(ps.particles, []);
  });
});

// ---------------------------------------------------------------------------
// Feature: flappy-kiro, Property 15: Particles are culled after PARTICLE_LIFETIME
// ---------------------------------------------------------------------------
describe('Property 15: Particles are culled after PARTICLE_LIFETIME', () => {
  it('after update(dt), no particle has life <= 0', () => {
    // Validates: Requirements 10.5
    fc.assert(
      fc.property(
        // dt: a positive time step (up to 2x PARTICLE_LIFETIME to cover full expiry)
        fc.double({ min: 0.001, max: (PARTICLE_LIFETIME * 2) / 1000, noNaN: true, noDefaultInfinity: true }),
        // number of emit calls before update
        fc.integer({ min: 0, max: 10 }),
        (dt, emitCount) => {
          const ps = new ParticleSystem();
          for (let i = 0; i < emitCount; i++) {
            ps.emit(Math.random() * 480, Math.random() * 640);
          }
          ps.update(dt);
          for (const p of ps.particles) {
            assert.ok(p.life > 0, `particle life=${p.life} should be > 0 after culling`);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
