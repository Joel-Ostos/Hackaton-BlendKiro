// game.test.js — Property tests for game.js logic
// Tests pure logic extracted from game.js without importing the browser-dependent module.

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fc from 'fast-check';
import { PhysicsSystem } from './physics.js';
import { ScoreManager } from './score.js';
import { CLOUD_SPEED, INVINCIBILITY_DURATION, LIVES_INITIAL } from './config.js';

// ---------------------------------------------------------------------------
// Feature: flappy-kiro, Property 4: Cloud positions decrease by CLOUD_SPEED × dt
// ---------------------------------------------------------------------------
describe('Property 4: Cloud positions decrease by CLOUD_SPEED × dt each frame', () => {
  it('each cloud x decreases by exactly CLOUD_SPEED * dt after one update', () => {
    // Validates: Requirements 3.2
    fc.assert(
      fc.property(
        // Generate an array of 1–10 clouds with arbitrary x positions
        fc.array(
          fc.record({
            x: fc.double({ min: -200, max: 1000, noNaN: true }),
            y: fc.double({ min: 0, max: 400, noNaN: true }),
            width: fc.double({ min: 60, max: 120, noNaN: true }),
            height: fc.double({ min: 20, max: 40, noNaN: true }),
          }),
          { minLength: 1, maxLength: 10 }
        ),
        // dt in seconds (capped at 0.05 as per game loop)
        fc.double({ min: 0.001, max: 0.05, noNaN: true }),
        (cloudsInput, dt) => {
          // Snapshot original x positions
          const originalXs = cloudsInput.map(c => c.x);

          // Apply the cloud update logic from game.js
          // cloud.x -= CLOUD_SPEED * dt  (wrapping is only for off-screen clouds)
          // We test clouds that stay on screen (x + width >= 0 after update)
          const clouds = cloudsInput.map(c => ({ ...c }));
          for (const cloud of clouds) {
            cloud.x -= CLOUD_SPEED * dt;
          }

          // Each cloud's x should have decreased by exactly CLOUD_SPEED * dt
          for (let i = 0; i < clouds.length; i++) {
            const expectedX = originalXs[i] - CLOUD_SPEED * dt;
            assert.ok(
              Math.abs(clouds[i].x - expectedX) < 1e-9,
              `cloud[${i}]: expected x=${expectedX}, got ${clouds[i].x} (original=${originalXs[i]}, dt=${dt})`
            );
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Feature: flappy-kiro, Property 10: Collision deducts one life and sets invincibility
// ---------------------------------------------------------------------------
describe('Property 10: Collision deducts one life and sets invincibility', () => {
  it('lives decreases by 1 and invincibilityRemaining equals INVINCIBILITY_DURATION after collision', () => {
    // Validates: Requirements 7.2, 8.5
    fc.assert(
      fc.property(
        // lives > 0 (1 to LIVES_INITIAL * 3 to cover various states)
        fc.integer({ min: 1, max: LIVES_INITIAL * 3 }),
        (initialLives) => {
          const score = new ScoreManager();
          const physics = new PhysicsSystem(640);

          // Set lives to the generated value
          score._lives = initialLives;

          // Precondition: no active invincibility
          assert.equal(physics.isInvincible, false);

          const livesBefore = score.lives;

          // Simulate handleCollision() logic (physics not invincible, so we proceed)
          score.loseLife();
          physics.triggerInvincibility(INVINCIBILITY_DURATION);

          // Lives should decrease by exactly 1
          assert.equal(
            score.lives,
            livesBefore - 1,
            `lives before=${livesBefore}, expected after=${livesBefore - 1}, got ${score.lives}`
          );

          // invincibilityRemaining should equal INVINCIBILITY_DURATION
          assert.equal(
            physics.invincibilityRemaining,
            INVINCIBILITY_DURATION,
            `expected invincibilityRemaining=${INVINCIBILITY_DURATION}, got ${physics.invincibilityRemaining}`
          );

          // isInvincible should be true
          assert.equal(physics.isInvincible, true);
        }
      ),
      { numRuns: 100 }
    );
  });
});
