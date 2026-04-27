import { GAP_SIZE } from './config.js';

const COIN_RADIUS = 8;
const CANVAS_WIDTH = 480;

export class CoinSystem {
  constructor() {
    this._coins = [];
    this._nextId = 0;
  }

  get coins() {
    return this._coins;
  }

  spawnForPipe(pipe) {
    // 50% chance to spawn a coin
    if (Math.random() < 0.5) return;

    const gapTop = pipe.gapCenterY - GAP_SIZE / 2;
    const gapBottom = pipe.gapCenterY + GAP_SIZE / 2;
    const y = gapTop + Math.random() * (gapBottom - gapTop);

    this._coins.push({
      id: this._nextId++,
      x: pipe.x + pipe.width / 2,
      y,
      radius: COIN_RADIUS,
      collected: false,
    });
  }

  update(dt, pipeSpeed) {
    for (const coin of this._coins) {
      coin.x -= pipeSpeed * dt;
    }
    // Cull coins that have moved fully off the left edge
    this._coins = this._coins.filter(coin => coin.x + coin.radius >= 0);
  }

  collect(coinId) {
    this._coins = this._coins.filter(coin => coin.id !== coinId);
  }

  reset() {
    this._coins = [];
    this._nextId = 0;
  }
}
