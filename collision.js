import { GAP_SIZE } from './config.js';

/**
 * AABB overlap test.
 * @param {{x:number, y:number, w:number, h:number}} a
 * @param {{x:number, y:number, w:number, h:number}} b
 * @returns {boolean}
 */
export function aabbOverlap(a, b) {
  return a.x < b.x + b.w
      && a.x + a.w > b.x
      && a.y < b.y + b.h
      && a.y + a.h > b.y;
}

/**
 * Check if Ghosty's hitbox collides with a pipe pair.
 * @param {{x:number, y:number, w:number, h:number}} ghostyHitbox
 * @param {{x:number, gapCenterY:number, width:number}} pipe
 * @param {number} canvasHeight
 * @param {number} scoreBarHeight
 * @returns {boolean}
 */
export function checkPipeCollision(ghostyHitbox, pipe, canvasHeight, scoreBarHeight) {
  const gapTop = pipe.gapCenterY - GAP_SIZE / 2;
  const gapBottom = pipe.gapCenterY + GAP_SIZE / 2;

  const topPipeAABB = { x: pipe.x, y: 0, w: pipe.width, h: gapTop };
  const bottomPipeAABB = {
    x: pipe.x,
    y: gapBottom,
    w: pipe.width,
    h: canvasHeight - scoreBarHeight - gapBottom
  };

  return aabbOverlap(ghostyHitbox, topPipeAABB) || aabbOverlap(ghostyHitbox, bottomPipeAABB);
}

/**
 * Check if Ghosty's hitbox is out of the playable vertical bounds.
 * @param {{x:number, y:number, w:number, h:number}} ghostyHitbox
 * @param {number} canvasHeight
 * @param {number} scoreBarHeight
 * @returns {boolean}
 */
export function checkBoundaryCollision(ghostyHitbox, canvasHeight, scoreBarHeight) {
  return ghostyHitbox.y < 0
      || ghostyHitbox.y + ghostyHitbox.h > canvasHeight - scoreBarHeight;
}

/**
 * Check if Ghosty's hitbox overlaps a coin (coin circle treated as AABB).
 * @param {{x:number, y:number, w:number, h:number}} ghostyHitbox
 * @param {{x:number, y:number, radius:number}} coin
 * @returns {boolean}
 */
export function checkCoinCollision(ghostyHitbox, coin) {
  const coinAABB = {
    x: coin.x - coin.radius,
    y: coin.y - coin.radius,
    w: coin.radius * 2,
    h: coin.radius * 2
  };
  return aabbOverlap(ghostyHitbox, coinAABB);
}
