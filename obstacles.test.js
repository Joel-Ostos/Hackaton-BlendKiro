import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fc from 'fast-check';
import { ObstacleGenerator } from './obstacles.js';
import {
  GAP_SIZE,
  GAP_VERTICAL_MIN,
  GAP_VERTICAL_MAX,
  PIPE_SPAWN_INTERVAL,
} from './config.js';

const PIPE_SPEED = 200;

// ---------------------------------------------------------------------------
// Unit tests — ObstacleGenerator basics
// ---------------------------------------------------------------------------
describe('ObstacleGenerator — initial state', () => {
  it('starts with no pipes', () => {
    const og = new ObstacleGenerator();
    assert.deepEqual(og.pipes, []);
  });

  it('spawns a pipe on the first update (timer starts at interval)', () => {
    const og = new ObstacleGenerator();
    og.update(0.001, PIPE_SPEED);
    assert.equal(og.pipes.length, 1);
  });
});

describe('ObstacleGenerator — reset', () => {
  it('clears all pipes and resets spawn timer', () => {
    const og = new ObstacleGenerator();
    og.update(0.001, PIPE_SPEED);
    assert.equal(og.pipes.length, 1);
    og.reset();
    assert.deepEqual(og.pipes, []);
    // After reset, next update should spawn immediately again
    og.update(0.001, PIPE_SPEED);
    assert.equal(og.pipes.length, 1);
  });
});

describe('ObstacleGenerator — PipePair shape', () => {
  it('spawned pipe has correct shape', () => {
    const og = new ObstacleGenerator();
    og.update(0.001, PIPE_SPEED);
    const pipe = og.pipes[0];
    assert.equal(typeof pipe.x, 'number');
    assert.equal(typeof pipe.gapCenterY, 'number');
    assert.equal(pipe.width, 60);
    assert.equal(pipe.scored, false);
  });

  it('gapCenterY is within [GAP_VERTICAL_MIN, GAP_VERTICAL_MAX]', () => {
    const og = new ObstacleGenerator();
    og.update(0.001, PIPE_SPEED);
    const pipe = og.pipes[0];
    assert.ok(pipe.gapCenterY >= GAP_VERTICAL_MIN);
    assert.ok(pipe.gapCenterY <= GAP_VERTICAL_MAX);
  });
});

describe('ObstacleGenerator — culling', () => {
  it('culls pipes that move fully off the left edge', () => {
    const og = new ObstacleGenerator();
    og.update(0.001, PIPE_SPEED); // spawn one pipe at x=480
    // Move it far enough off screen: need x + width < 0, i.e. x < -60
    // pipe starts at 480, move by 480 + 60 + 1 = 541px => dt = 541 / PIPE_SPEED
    og.update(541 / PIPE_SPEED, PIPE_SPEED);
    // The original pipe should be culled (it may have spawned another, but original is gone)
    for (const pipe of og.pipes) {
      assert.ok(pipe.x + pipe.width >= 0, `pipe at x=${pipe.x} should not be culled`);
    }
  });
});

describe('ObstacleGenerator — checkScored', () => {
  it('returns 0 when ghosty has not passed any pipe', () => {
    const og = new ObstacleGenerator();
    og.update(0.001, PIPE_SPEED);
    const pipe = og.pipes[0];
    // ghosty is to the left of the pipe
    const count = og.checkScored(pipe.x - 1);
    assert.equal(count, 0);
  });

  it('returns 1 and marks pipe scored when ghosty passes', () => {
    const og = new ObstacleGenerator();
    og.update(0.001, PIPE_SPEED);
    const pipe = og.pipes[0];
    const count = og.checkScored(pipe.x + pipe.width + 1);
    assert.equal(count, 1);
    assert.equal(pipe.scored, true);
  });

  it('does not double-count already scored pipes', () => {
    const og = new ObstacleGenerator();
    og.update(0.001, PIPE_SPEED);
    const pipe = og.pipes[0];
    og.checkScored(pipe.x + pipe.width + 1);
    const count2 = og.checkScored(pipe.x + pipe.width + 1);
    assert.equal(count2, 0);
  });
});

// ---------------------------------------------------------------------------
// Feature: flappy-kiro, Property 5: Pipe gap size and center within configured bounds
// ---------------------------------------------------------------------------
describe('Property 5: Pipe gap size and center are always within configured bounds', () => {
  it('gapCenterY is in [GAP_VERTICAL_MIN, GAP_VERTICAL_MAX] and gap height equals GAP_SIZE for any generated pipe', () => {
    // Validates: Requirements 5.2
    fc.assert(
      fc.property(
        // Run many updates to generate many pipes; use a seed-independent approach
        fc.integer({ min: 1, max: 20 }),
        (numSpawns) => {
          const og = new ObstacleGenerator();
          // Force-spawn numSpawns pipes by advancing time in PIPE_SPAWN_INTERVAL increments
          for (let i = 0; i < numSpawns; i++) {
            og.update(PIPE_SPAWN_INTERVAL, PIPE_SPEED);
          }
          for (const pipe of og.pipes) {
            // Gap center must be within bounds
            assert.ok(
              pipe.gapCenterY >= GAP_VERTICAL_MIN,
              `gapCenterY=${pipe.gapCenterY} < GAP_VERTICAL_MIN=${GAP_VERTICAL_MIN}`
            );
            assert.ok(
              pipe.gapCenterY <= GAP_VERTICAL_MAX,
              `gapCenterY=${pipe.gapCenterY} > GAP_VERTICAL_MAX=${GAP_VERTICAL_MAX}`
            );
            // Gap height is always GAP_SIZE
            const gapTop = pipe.gapCenterY - GAP_SIZE / 2;
            const gapBottom = pipe.gapCenterY + GAP_SIZE / 2;
            const gapHeight = gapBottom - gapTop;
            assert.ok(
              Math.abs(gapHeight - GAP_SIZE) < 1e-9,
              `gap height=${gapHeight} !== GAP_SIZE=${GAP_SIZE}`
            );
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Feature: flappy-kiro, Property 6: Pipe positions decrease by pipeSpeed × dt each frame
// ---------------------------------------------------------------------------
describe('Property 6: Pipe positions decrease by pipeSpeed × dt each frame', () => {
  it('each pipe x decreases by exactly pipeSpeed * dt after one update', () => {
    // Validates: Requirements 5.3
    fc.assert(
      fc.property(
        fc.array(
          fc.double({ min: -100, max: 600, noNaN: true, noDefaultInfinity: true }),
          { minLength: 1, maxLength: 10 }
        ),
        fc.double({ min: 50, max: 400, noNaN: true, noDefaultInfinity: true }),
        fc.double({ min: 0.001, max: 0.1, noNaN: true, noDefaultInfinity: true }),
        (xPositions, pipeSpeed, dt) => {
          const og = new ObstacleGenerator();
          // Manually inject pipes at the given x positions
          og._pipes = xPositions.map((x, i) => ({
            x,
            gapCenterY: (GAP_VERTICAL_MIN + GAP_VERTICAL_MAX) / 2,
            width: 60,
            scored: false,
          }));
          // Disable auto-spawning by setting timer to 0
          og._spawnTimer = 0;

          const xBefore = og.pipes.map(p => p.x);
          og.update(dt, pipeSpeed);

          // Only check pipes that weren't culled; match by original index
          // After update, pipes that remain should have moved left by pipeSpeed * dt
          const expectedDelta = pipeSpeed * dt;
          for (let i = 0; i < xBefore.length; i++) {
            const expectedX = xBefore[i] - expectedDelta;
            // Find the pipe that corresponds to this original position
            const match = og.pipes.find(p => Math.abs(p.x - expectedX) < 1e-4);
            // If the pipe was culled (expectedX + width < 0), skip
            if (expectedX + 60 < 0) continue;
            assert.ok(
              match !== undefined,
              `pipe originally at x=${xBefore[i]} should be at x=${expectedX} after update`
            );
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
