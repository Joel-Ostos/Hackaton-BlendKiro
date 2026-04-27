import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fc from 'fast-check';
import { aabbOverlap, checkBoundaryCollision } from './collision.js';

// Arbitrary for a rectangle {x, y, w, h} with positive dimensions
const rectArb = fc.record({
  x: fc.float({ min: -1000, max: 1000, noNaN: true }),
  y: fc.float({ min: -1000, max: 1000, noNaN: true }),
  w: fc.float({ min: 1, max: 500, noNaN: true }),
  h: fc.float({ min: 1, max: 500, noNaN: true }),
});

// Reference implementation: do the rectangles geometrically intersect?
function geometricallyIntersect(a, b) {
  const overlapX = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
  const overlapY = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
  return overlapX > 0 && overlapY > 0;
}

// Feature: flappy-kiro, Property 11: AABB overlap detection is correct
describe('Property 11: AABB overlap detection is correct for all rectangle pairs', () => {
  it('aabbOverlap returns true iff rectangles geometrically intersect', () => {
    // Validates: Requirements 8.1, 8.2
    fc.assert(
      fc.property(rectArb, rectArb, (a, b) => {
        const result = aabbOverlap(a, b);
        const expected = geometricallyIntersect(a, b);
        assert.equal(result, expected,
          `aabbOverlap(${JSON.stringify(a)}, ${JSON.stringify(b)}) = ${result}, expected ${expected}`
        );
      }),
      { numRuns: 100 }
    );
  });

  it('aabbOverlap is symmetric', () => {
    fc.assert(
      fc.property(rectArb, rectArb, (a, b) => {
        assert.equal(aabbOverlap(a, b), aabbOverlap(b, a));
      }),
      { numRuns: 100 }
    );
  });

  it('a rect always overlaps itself', () => {
    fc.assert(
      fc.property(rectArb, (a) => {
        assert.equal(aabbOverlap(a, a), true);
      }),
      { numRuns: 100 }
    );
  });

  it('non-overlapping rects (separated on x-axis) return false', () => {
    fc.assert(
      fc.property(
        rectArb,
        fc.float({ min: 1, max: 100, noNaN: true }),
        (a, gap) => {
          const b = { x: a.x + a.w + gap, y: a.y, w: a.w, h: a.h };
          assert.equal(aabbOverlap(a, b), false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('non-overlapping rects (separated on y-axis) return false', () => {
    fc.assert(
      fc.property(
        rectArb,
        fc.float({ min: 1, max: 100, noNaN: true }),
        (a, gap) => {
          const b = { x: a.x, y: a.y + a.h + gap, w: a.w, h: a.h };
          assert.equal(aabbOverlap(a, b), false);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// Feature: flappy-kiro, Property 12: Boundary collision detects out-of-bounds positions
describe('Property 12: Boundary collision detects all out-of-bounds positions', () => {
  const canvasHeight = 640;
  const scoreBarHeight = 60;
  const playableBottom = canvasHeight - scoreBarHeight; // 580

  // Hitbox arbitrary with positive dimensions
  const hitboxArb = fc.record({
    x: fc.float({ min: 0, max: 480, noNaN: true }),
    y: fc.float({ min: -200, max: 700, noNaN: true }),
    w: fc.float({ min: 1, max: 50, noNaN: true }),
    h: fc.float({ min: 1, max: 50, noNaN: true }),
  });

  it('returns true iff hitbox extends above y=0 or below canvasHeight - scoreBarHeight', () => {
    // Validates: Requirements 8.3
    fc.assert(
      fc.property(hitboxArb, (hb) => {
        const result = checkBoundaryCollision(hb, canvasHeight, scoreBarHeight);
        const expected = hb.y < 0 || hb.y + hb.h > playableBottom;
        assert.equal(result, expected,
          `checkBoundaryCollision(${JSON.stringify(hb)}) = ${result}, expected ${expected}`
        );
      }),
      { numRuns: 100 }
    );
  });

  it('hitbox fully inside playable area returns false', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 1, max: 40, noNaN: true }),  // h
        fc.float({ min: 0, max: playableBottom - 41, noNaN: true }), // y
        (h, y) => {
          const hb = { x: 0, y, w: 10, h };
          // ensure y + h <= playableBottom
          if (y + h > playableBottom) return; // skip edge cases
          assert.equal(checkBoundaryCollision(hb, canvasHeight, scoreBarHeight), false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('hitbox above top boundary returns true', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0.001, max: 100, noNaN: true }), // amount above 0
        fc.double({ min: 1, max: 50, noNaN: true }),       // h
        (above, h) => {
          const hb = { x: 0, y: -above, w: 10, h };
          assert.equal(checkBoundaryCollision(hb, canvasHeight, scoreBarHeight), true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('hitbox below bottom boundary returns true', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0.001, max: 100, noNaN: true }), // amount below playableBottom
        fc.double({ min: 1, max: 50, noNaN: true }),       // h
        (below, h) => {
          // y + h > playableBottom  =>  y = playableBottom - h + below
          const y = playableBottom - h + below;
          const hb = { x: 0, y, w: 10, h };
          assert.equal(checkBoundaryCollision(hb, canvasHeight, scoreBarHeight), true);
        }
      ),
      { numRuns: 100 }
    );
  });
});
