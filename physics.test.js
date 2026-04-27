import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fc from 'fast-check';
import { PhysicsSystem } from './physics.js';
import {
  GRAVITY,
  FLAP_VELOCITY,
  TERMINAL_VELOCITY,
  INVINCIBILITY_DURATION,
} from './config.js';

const CANVAS_HEIGHT = 640;

// ---------------------------------------------------------------------------
// Unit tests — PhysicsSystem basics
// ---------------------------------------------------------------------------
describe('PhysicsSystem — initial state', () => {
  it('initializes ghosty at correct position', () => {
    const ps = new PhysicsSystem(CANVAS_HEIGHT);
    const g = ps.ghosty;
    assert.equal(g.x, 80);
    assert.equal(g.y, CANVAS_HEIGHT / 2 - 20);
    assert.equal(g.vy, 0);
    assert.equal(g.width, 40);
    assert.equal(g.height, 40);
  });

  it('starts not invincible', () => {
    const ps = new PhysicsSystem(CANVAS_HEIGHT);
    assert.equal(ps.isInvincible, false);
    assert.equal(ps.invincibilityRemaining, 0);
  });
});

describe('PhysicsSystem — flap', () => {
  it('sets vy to FLAP_VELOCITY', () => {
    const ps = new PhysicsSystem(CANVAS_HEIGHT);
    ps.flap();
    assert.equal(ps.ghosty.vy, FLAP_VELOCITY);
  });
});

describe('PhysicsSystem — update', () => {
  it('applies gravity to vy', () => {
    const ps = new PhysicsSystem(CANVAS_HEIGHT);
    const dt = 1 / 60;
    ps.update(dt);
    const expected = Math.min(0 + GRAVITY * dt, TERMINAL_VELOCITY);
    assert.equal(ps.ghosty.vy, expected);
  });

  it('clamps vy to TERMINAL_VELOCITY', () => {
    const ps = new PhysicsSystem(CANVAS_HEIGHT);
    // Force vy near terminal
    ps._ghosty.vy = TERMINAL_VELOCITY - 1;
    ps.update(1); // large dt
    assert.equal(ps.ghosty.vy, TERMINAL_VELOCITY);
  });

  it('updates y by vy * dt', () => {
    const ps = new PhysicsSystem(CANVAS_HEIGHT);
    ps._ghosty.vy = 100;
    const yBefore = ps.ghosty.y;
    const dt = 0.1;
    // After update: vy = min(100 + GRAVITY*0.1, TERMINAL_VELOCITY), y += newVy * dt
    const newVy = Math.min(100 + GRAVITY * dt, TERMINAL_VELOCITY);
    ps.update(dt);
    assert.ok(Math.abs(ps.ghosty.y - (yBefore + newVy * dt)) < 1e-9);
  });
});

describe('PhysicsSystem — reset', () => {
  it('restores initial position and velocity', () => {
    const ps = new PhysicsSystem(CANVAS_HEIGHT);
    ps.flap();
    ps.update(0.5);
    ps.reset();
    const g = ps.ghosty;
    assert.equal(g.x, 80);
    assert.equal(g.y, CANVAS_HEIGHT / 2 - 20);
    assert.equal(g.vy, 0);
    assert.equal(ps.invincibilityRemaining, 0);
  });
});

describe('PhysicsSystem — getHitbox', () => {
  it('returns inset AABB', () => {
    const ps = new PhysicsSystem(CANVAS_HEIGHT);
    const g = ps.ghosty;
    const hb = ps.getHitbox();
    assert.ok(Math.abs(hb.x - (g.x + g.width * 0.15)) < 1e-9);
    assert.ok(Math.abs(hb.y - (g.y + g.height * 0.1)) < 1e-9);
    assert.ok(Math.abs(hb.w - g.width * 0.7) < 1e-9);
    assert.ok(Math.abs(hb.h - g.height * 0.8) < 1e-9);
  });
});

describe('PhysicsSystem — invincibility', () => {
  it('triggerInvincibility sets invincibilityRemaining', () => {
    const ps = new PhysicsSystem(CANVAS_HEIGHT);
    ps.triggerInvincibility(INVINCIBILITY_DURATION);
    assert.equal(ps.invincibilityRemaining, INVINCIBILITY_DURATION);
    assert.equal(ps.isInvincible, true);
  });

  it('update decrements invincibilityRemaining', () => {
    const ps = new PhysicsSystem(CANVAS_HEIGHT);
    ps.triggerInvincibility(1000);
    ps.update(0.1); // 100ms
    assert.ok(ps.invincibilityRemaining < 1000);
    assert.ok(ps.invincibilityRemaining >= 0);
  });

  it('invincibilityRemaining does not go below 0', () => {
    const ps = new PhysicsSystem(CANVAS_HEIGHT);
    ps.triggerInvincibility(50);
    ps.update(1); // 1000ms >> 50ms
    assert.equal(ps.invincibilityRemaining, 0);
    assert.equal(ps.isInvincible, false);
  });
});

// ---------------------------------------------------------------------------
// Feature: flappy-kiro, Property 1: Gravity accumulates velocity each frame
// ---------------------------------------------------------------------------
describe('Property 1: Gravity accumulates velocity each frame', () => {
  it('new vy equals min(vy + GRAVITY * dt, TERMINAL_VELOCITY) for any vy and dt > 0', () => {
    // Validates: Requirements 4.1, 4.3
    fc.assert(
      fc.property(
        fc.integer({ min: -2000, max: 2000 }),
        fc.double({ min: 0.001, max: 0.1, noNaN: true }),
        (initialVy, dt) => {
          const ps = new PhysicsSystem(CANVAS_HEIGHT);
          ps._ghosty.vy = initialVy;
          ps.update(dt);
          const expected = Math.min(initialVy + GRAVITY * dt, TERMINAL_VELOCITY);
          assert.ok(
            Math.abs(ps.ghosty.vy - expected) < 1e-6,
            `vy=${initialVy}, dt=${dt}: expected ${expected}, got ${ps.ghosty.vy}`
          );
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Feature: flappy-kiro, Property 2: Flap sets velocity unconditionally
// ---------------------------------------------------------------------------
describe('Property 2: Flap sets velocity unconditionally', () => {
  it('vy equals FLAP_VELOCITY after flap regardless of prior state', () => {
    // Validates: Requirements 4.2
    fc.assert(
      fc.property(
        fc.integer({ min: -2000, max: 2000 }),
        (initialVy) => {
          const ps = new PhysicsSystem(CANVAS_HEIGHT);
          ps._ghosty.vy = initialVy;
          ps.flap();
          assert.equal(
            ps.ghosty.vy,
            FLAP_VELOCITY,
            `prior vy=${initialVy}: expected FLAP_VELOCITY=${FLAP_VELOCITY}, got ${ps.ghosty.vy}`
          );
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Feature: flappy-kiro, Property 3: Position updates proportionally to delta time
// ---------------------------------------------------------------------------
describe('Property 3: Position updates proportionally to delta time', () => {
  it('change in y equals (vy after gravity) * dt for any vy and dt', () => {
    // Validates: Requirements 4.5
    fc.assert(
      fc.property(
        fc.integer({ min: -2000, max: 2000 }),
        fc.double({ min: 0.001, max: 0.1, noNaN: true }),
        (initialVy, dt) => {
          const ps = new PhysicsSystem(CANVAS_HEIGHT);
          ps._ghosty.vy = initialVy;
          const yBefore = ps.ghosty.y;
          // Compute expected: velocity after gravity applied, then position delta
          const vyAfterGravity = Math.min(initialVy + GRAVITY * dt, TERMINAL_VELOCITY);
          const expectedDeltaY = vyAfterGravity * dt;
          ps.update(dt);
          const actualDeltaY = ps.ghosty.y - yBefore;
          assert.ok(
            Math.abs(actualDeltaY - expectedDeltaY) < 1e-6,
            `vy=${initialVy}, dt=${dt}: expected deltaY=${expectedDeltaY}, got ${actualDeltaY}`
          );
        }
      ),
      { numRuns: 100 }
    );
  });
});
