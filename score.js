import {
  PIPE_SCORE_VALUE,
  COIN_SCORE_VALUE,
  LIVES_INITIAL,
  PIPE_SPEED_INITIAL,
  PIPE_SPEED_INCREMENT,
  PIPE_SPEED_MAX,
  SPEED_MILESTONE,
} from './config.js';

const HIGH_SCORE_KEY = 'flappyKiroHighScore';

export class ScoreManager {
  constructor() {
    this._score = 0;
    this._lives = LIVES_INITIAL;
    this._highScore = 0;
  }

  get score() {
    return this._score;
  }

  get lives() {
    return this._lives;
  }

  get highScore() {
    return this._highScore;
  }

  addPipeScore() {
    this._score += PIPE_SCORE_VALUE;
    if (this._score > this._highScore) {
      this._highScore = this._score;
    }
  }

  addCoinScore() {
    this._score += COIN_SCORE_VALUE;
    if (this._score > this._highScore) {
      this._highScore = this._score;
    }
  }

  loseLife() {
    this._lives -= 1;
    return this._lives;
  }

  reset() {
    this._score = 0;
    this._lives = LIVES_INITIAL;
  }

  saveHighScore() {
    try {
      localStorage.setItem(HIGH_SCORE_KEY, String(this._highScore));
    } catch (e) {
      // SecurityError or other storage errors — silently ignore
    }
  }

  loadHighScore() {
    try {
      const stored = localStorage.getItem(HIGH_SCORE_KEY);
      this._highScore = stored !== null ? Number(stored) : 0;
    } catch (e) {
      // SecurityError or other storage errors — default to 0
      this._highScore = 0;
    }
  }

  getCurrentPipeSpeed() {
    return Math.min(
      PIPE_SPEED_INITIAL + Math.floor(this._score / SPEED_MILESTONE) * PIPE_SPEED_INCREMENT,
      PIPE_SPEED_MAX
    );
  }
}
