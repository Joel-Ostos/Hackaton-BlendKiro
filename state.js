// state.js — GameStateMachine
// Manages game state transitions for Flappy Kiro

export const States = {
  MENU: 'MENU',
  PLAYING: 'PLAYING',
  PAUSED: 'PAUSED',
  GAME_OVER: 'GAME_OVER',
};

export class GameStateMachine {
  constructor() {
    this._current = States.MENU;
  }

  get current() {
    return this._current;
  }

  isPlaying() {
    return this._current === States.PLAYING;
  }

  startGame() {
    if (this._current !== States.MENU) {
      console.warn(`Invalid transition: startGame() called from state '${this._current}'`);
      return;
    }
    this._current = States.PLAYING;
  }

  pause() {
    if (this._current !== States.PLAYING) {
      console.warn(`Invalid transition: pause() called from state '${this._current}'`);
      return;
    }
    this._current = States.PAUSED;
  }

  resume() {
    if (this._current !== States.PAUSED) {
      console.warn(`Invalid transition: resume() called from state '${this._current}'`);
      return;
    }
    this._current = States.PLAYING;
  }

  gameOver() {
    if (this._current !== States.PLAYING) {
      console.warn(`Invalid transition: gameOver() called from state '${this._current}'`);
      return;
    }
    this._current = States.GAME_OVER;
  }

  reset() {
    this._current = States.MENU;
  }
}
