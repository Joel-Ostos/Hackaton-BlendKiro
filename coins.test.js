import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fc from 'fast-check';
import { CoinSystem } from './coins.js';
import { GAP_SIZE, GAP_VERTICAL_MIN, GAP_VERTICAL_MAX } from './config.js';

// ---------------------------------------------------------------------------
// Unit tests — CoinSystem basics
// ---------------------------------------------------------------------------
describe('CoinSystem — initial state', () => {
  it('starts with no coins', () => {
    const cs = new CoinSystem();
    assert.deepEqual(cs.coins, []);
  });
});

describe('CoinSystem — spawnForPipe', () => {
  it('spawns at most 1 coin per pipe call', () => {
    const cs = new CoinSystem();
    const pipe = { x: 200, width: 60, gapCenterY: 250 };
    cs.spawnForPipe(pipe);
    assert.ok(cs.coins.length <= 1);
  });

  it('spawned coin has correct shape', () => {
    // Force a spawn by calling many times
    const cs = new CoinSystem();
    const pipe = { x: 200, width: 60, gapCenterY: 250 };
    let coin = null;
    for (let i = 0; i < 100 && !coin; i++) {
      cs.reset();
      cs.spawnForPipe(pipe);
      if (cs.coins.length === 1) coin = cs.coins[0];
    }
    assert.ok(coin !== null, 'expected at least one coin to spawn in 100 tries');
    assert.equal(typeof coin.id, 'number');
    assert.equal(typeof coin.x, 'number');
    assert.equal(typeof coin.y, 'number');
    assert.equal(coin.radius, 8);
    assert.equal(coin.collected, false);
  });

  it('coin x is centered in the pipe column', () => {
    const cs = new CoinSystem();
    const pipe = { x: 200, width: 60, gapCenterY: 250 };
    let coin = null;
    for (let i = 0; i < 100 && !coin; i++) {
      cs.reset();
      cs.spawnForPipe(pipe);
      if (cs.coins.length === 1) coin = cs.coins[0];
    }
    assert.ok(coin !== null);
    assert.equal(coin.x, pipe.x + pipe.width / 2);
  });
});

describe('CoinSystem — update', () => {
  it('moves coins left by pipeSpeed * dt', () => {
    const cs = new CoinSystem();
    // Manually inject a coin
    cs._coins = [{ id: 0, x: 300, y: 200, radius: 8, collected: false }];
    cs.update(0.1, 200);
    assert.ok(Math.abs(cs.coins[0].x - (300 - 200 * 0.1)) < 1e-9);
  });

  it('culls coins that move off the left edge', () => {
    const cs = new CoinSystem();
    cs._coins = [{ id: 0, x: 5, y: 200, radius: 8, collected: false }];
    // Move far enough: x + radius < 0 => x < -8, need to move 5 + 8 + 1 = 14px
    cs.update(14 / 200, 200);
    assert.equal(cs.coins.length, 0);
  });

  it('keeps coins still on screen', () => {
    const cs = new CoinSystem();
    cs._coins = [{ id: 0, x: 300, y: 200, radius: 8, collected: false }];
    cs.update(0.1, 200);
    assert.equal(cs.coins.length, 1);
  });
});

describe('CoinSystem — collect', () => {
  it('removes the coin with the matching id', () => {
    const cs = new CoinSystem();
    cs._coins = [
      { id: 0, x: 100, y: 200, radius: 8, collected: false },
      { id: 1, x: 200, y: 200, radius: 8, collected: false },
    ];
    cs.collect(0);
    assert.equal(cs.coins.length, 1);
    assert.equal(cs.coins[0].id, 1);
  });

  it('does nothing if id not found', () => {
    const cs = new CoinSystem();
    cs._coins = [{ id: 0, x: 100, y: 200, radius: 8, collected: false }];
    cs.collect(99);
    assert.equal(cs.coins.length, 1);
  });
});

describe('CoinSystem — reset', () => {
  it('clears all coins', () => {
    const cs = new CoinSystem();
    cs._coins = [{ id: 0, x: 100, y: 200, radius: 8, collected: false }];
    cs.reset();
    assert.deepEqual(cs.coins, []);
  });
});

// ---------------------------------------------------------------------------
// Feature: flappy-kiro, Property 8: Coins spawn within pipe gap bounds
// ---------------------------------------------------------------------------
describe('Property 8: Coins spawn within their pipe\'s gap bounds', () => {
  it('any coin spawned for a pipe has y within [gapCenterY - GAP_SIZE/2, gapCenterY + GAP_SIZE/2]', () => {
    // Validates: Requirements 6.1
    fc.assert(
      fc.property(
        fc.record({
          x: fc.double({ min: 0, max: 400, noNaN: true, noDefaultInfinity: true }),
          width: fc.constant(60),
          gapCenterY: fc.double({
            min: GAP_VERTICAL_MIN,
            max: GAP_VERTICAL_MAX,
            noNaN: true,
            noDefaultInfinity: true,
          }),
        }),
        (pipe) => {
          const gapTop = pipe.gapCenterY - GAP_SIZE / 2;
          const gapBottom = pipe.gapCenterY + GAP_SIZE / 2;

          // Call spawnForPipe many times to get coins (50% chance each call)
          const cs = new CoinSystem();
          for (let i = 0; i < 20; i++) {
            cs.spawnForPipe(pipe);
          }

          for (const coin of cs.coins) {
            assert.ok(
              coin.y >= gapTop,
              `coin.y=${coin.y} < gapTop=${gapTop}`
            );
            assert.ok(
              coin.y <= gapBottom,
              `coin.y=${coin.y} > gapBottom=${gapBottom}`
            );
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
