import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import fc from 'fast-check';
import { ScoreManager } from './score.js';
import {
  PIPE_SCORE_VALUE,
  COIN_SCORE_VALUE,
  LIVES_INITIAL,
  PIPE_SPEED_INITIAL,
  PIPE_SPEED_INCREMENT,
  PIPE_SPEED_MAX,
  SPEED_MILESTONE,
} from './config.js';

// ---------------------------------------------------------------------------
// In-memory localStorage mock for Node.js (no real localStorage in Node)
// ---------------------------------------------------------------------------
function makeLocalStorageMock() {
  const store = {};
  return {
    getItem(key) { return Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null; },
    setItem(key, value) { store[key] = String(value); },
    removeItem(key) { delete store[key]; },
    clear() { Object.keys(store).forEach(k => delete store[k]); },
  };
}

// Install mock before tests run
globalThis.localStorage = makeLocalStorageMock();

// ---------------------------------------------------------------------------
// Unit tests — ScoreManager basics
// ---------------------------------------------------------------------------
describe('ScoreManager — initial state', () => {
  it('starts with score 0', () => {
    const sm = new ScoreManager();
    assert.equal(sm.score, 0);
  });

  it(`starts with ${LIVES_INITIAL} lives`, () => {
    const sm = new ScoreManager();
    assert.equal(sm.lives, LIVES_INITIAL);
  });

  it('starts with highScore 0', () => {
    const sm = new ScoreManager();
    assert.equal(sm.highScore, 0);
  });
});

describe('ScoreManager — addPipeScore / addCoinScore / loseLife / reset', () => {
  it('addPipeScore increments score by PIPE_SCORE_VALUE', () => {
    const sm = new ScoreManager();
    sm.addPipeScore();
    assert.equal(sm.score, PIPE_SCORE_VALUE);
  });

  it('addCoinScore increments score by COIN_SCORE_VALUE', () => {
    const sm = new ScoreManager();
    sm.addCoinScore();
    assert.equal(sm.score, COIN_SCORE_VALUE);
  });

  it('loseLife decrements lives and returns new count', () => {
    const sm = new ScoreManager();
    const returned = sm.loseLife();
    assert.equal(sm.lives, LIVES_INITIAL - 1);
    assert.equal(returned, LIVES_INITIAL - 1);
  });

  it('reset restores score to 0 and lives to LIVES_INITIAL', () => {
    const sm = new ScoreManager();
    sm.addPipeScore();
    sm.loseLife();
    sm.reset();
    assert.equal(sm.score, 0);
    assert.equal(sm.lives, LIVES_INITIAL);
  });
});

describe('ScoreManager — getCurrentPipeSpeed at boundary values', () => {
  it('returns PIPE_SPEED_INITIAL when score is 0', () => {
    const sm = new ScoreManager();
    assert.equal(sm.getCurrentPipeSpeed(), PIPE_SPEED_INITIAL);
  });

  it('does not exceed PIPE_SPEED_MAX', () => {
    const sm = new ScoreManager();
    // Force a very high score by calling addPipeScore many times
    for (let i = 0; i < 1000; i++) sm.addPipeScore();
    assert.equal(sm.getCurrentPipeSpeed(), PIPE_SPEED_MAX);
  });
});

// ---------------------------------------------------------------------------
// Feature: flappy-kiro, Property 7: Pipe speed scales correctly with score milestones
// ---------------------------------------------------------------------------
describe('Property 7: Pipe speed scales correctly with score milestones', () => {
  it('getCurrentPipeSpeed matches formula for any score', () => {
    // Validates: Requirements 5.4
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 10000 }), (s) => {
        const sm = new ScoreManager();
        // Directly set internal score to avoid side-effects of addPipeScore
        sm._score = s;
        const expected = Math.min(
          PIPE_SPEED_INITIAL + Math.floor(s / SPEED_MILESTONE) * PIPE_SPEED_INCREMENT,
          PIPE_SPEED_MAX
        );
        assert.equal(sm.getCurrentPipeSpeed(), expected,
          `score=${s}: expected speed ${expected}, got ${sm.getCurrentPipeSpeed()}`
        );
      }),
      { numRuns: 100 }
    );
  });

  it('speed never exceeds PIPE_SPEED_MAX', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 10000 }), (s) => {
        const sm = new ScoreManager();
        sm._score = s;
        assert.ok(sm.getCurrentPipeSpeed() <= PIPE_SPEED_MAX);
      }),
      { numRuns: 100 }
    );
  });

  it('speed is never below PIPE_SPEED_INITIAL', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 10000 }), (s) => {
        const sm = new ScoreManager();
        sm._score = s;
        assert.ok(sm.getCurrentPipeSpeed() >= PIPE_SPEED_INITIAL);
      }),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Feature: flappy-kiro, Property 14: High score persists across save/load round trip
// ---------------------------------------------------------------------------
describe('Property 14: High score persists across save/load round trip', () => {
  it('loadHighScore returns the same value that was saved', () => {
    // Validates: Requirements 9.6
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 1_000_000 }), (score) => {
        // Fresh mock storage for each run
        globalThis.localStorage = makeLocalStorageMock();

        const writer = new ScoreManager();
        writer._highScore = score;
        writer.saveHighScore();

        const reader = new ScoreManager();
        reader.loadHighScore();

        assert.equal(reader.highScore, score,
          `saved ${score}, loaded ${reader.highScore}`
        );
      }),
      { numRuns: 100 }
    );
  });

  it('loadHighScore defaults to 0 when nothing is stored', () => {
    globalThis.localStorage = makeLocalStorageMock();
    const sm = new ScoreManager();
    sm.loadHighScore();
    assert.equal(sm.highScore, 0);
  });

  it('loadHighScore defaults to 0 when localStorage throws SecurityError', () => {
    globalThis.localStorage = {
      getItem() { throw new DOMException('blocked', 'SecurityError'); },
      setItem() { throw new DOMException('blocked', 'SecurityError'); },
    };
    const sm = new ScoreManager();
    sm.loadHighScore();
    assert.equal(sm.highScore, 0);
    // Restore
    globalThis.localStorage = makeLocalStorageMock();
  });
});

// ---------------------------------------------------------------------------
// Feature: flappy-kiro, Property 13: Score increments by PIPE_SCORE_VALUE on gap pass
// ---------------------------------------------------------------------------
describe('Property 13: Score increments by PIPE_SCORE_VALUE on each gap pass', () => {
  it('addPipeScore always adds exactly PIPE_SCORE_VALUE', () => {
    // Validates: Requirements 9.3
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 10000 }), (initialScore) => {
        const sm = new ScoreManager();
        sm._score = initialScore;
        const before = sm.score;
        sm.addPipeScore();
        assert.equal(sm.score, before + PIPE_SCORE_VALUE,
          `score went from ${before} to ${sm.score}, expected ${before + PIPE_SCORE_VALUE}`
        );
      }),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Feature: flappy-kiro, Property 9: Coin collection increases score by COIN_SCORE_VALUE
// ---------------------------------------------------------------------------
describe('Property 9: Coin collection increases score by COIN_SCORE_VALUE', () => {
  it('addCoinScore always adds exactly COIN_SCORE_VALUE', () => {
    // Validates: Requirements 6.2
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 10000 }), (initialScore) => {
        const sm = new ScoreManager();
        sm._score = initialScore;
        const before = sm.score;
        sm.addCoinScore();
        assert.equal(sm.score, before + COIN_SCORE_VALUE,
          `score went from ${before} to ${sm.score}, expected ${before + COIN_SCORE_VALUE}`
        );
      }),
      { numRuns: 100 }
    );
  });
});
