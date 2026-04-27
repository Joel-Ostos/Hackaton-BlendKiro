import {
  PIPE_SPAWN_INTERVAL,
  GAP_SIZE,
  GAP_VERTICAL_MIN,
  GAP_VERTICAL_MAX,
} from './config.js';

const CANVAS_WIDTH = 480;
const PIPE_WIDTH = 60;

function randomGapCenterY() {
  return GAP_VERTICAL_MIN + Math.random() * (GAP_VERTICAL_MAX - GAP_VERTICAL_MIN);
}

export class ObstacleGenerator {
  constructor() {
    this._pipes = [];
    // Start timer at interval so a pipe spawns immediately on first update
    this._spawnTimer = PIPE_SPAWN_INTERVAL;
  }

  get pipes() {
    return this._pipes;
  }

  update(dt, pipeSpeed) {
    // Move all pipes left
    for (const pipe of this._pipes) {
      pipe.x -= pipeSpeed * dt;
    }

    // Advance spawn timer
    this._spawnTimer += dt;

    // Spawn a new pipe when timer exceeds interval
    if (this._spawnTimer >= PIPE_SPAWN_INTERVAL) {
      this._spawnTimer -= PIPE_SPAWN_INTERVAL;
      this._pipes.push({
        x: CANVAS_WIDTH,
        gapCenterY: randomGapCenterY(),
        width: PIPE_WIDTH,
        scored: false,
      });
    }

    // Cull pipes that have moved fully off the left edge
    this._pipes = this._pipes.filter(pipe => pipe.x + pipe.width >= 0);
  }

  reset() {
    this._pipes = [];
    this._spawnTimer = PIPE_SPAWN_INTERVAL;
  }

  checkScored(ghostyX) {
    let count = 0;
    for (const pipe of this._pipes) {
      if (!pipe.scored && ghostyX > pipe.x + pipe.width) {
        pipe.scored = true;
        count++;
      }
    }
    return count;
  }
}
