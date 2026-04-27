import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { GameStateMachine, States } from './state.js';

describe('GameStateMachine — initial state', () => {
  it('starts in MENU state', () => {
    const sm = new GameStateMachine();
    assert.equal(sm.current, 'MENU');
  });

  it('isPlaying() returns false in MENU', () => {
    const sm = new GameStateMachine();
    assert.equal(sm.isPlaying(), false);
  });
});

describe('GameStateMachine — valid transitions', () => {
  it('MENU → PLAYING via startGame()', () => {
    const sm = new GameStateMachine();
    sm.startGame();
    assert.equal(sm.current, 'PLAYING');
    assert.equal(sm.isPlaying(), true);
  });

  it('PLAYING → PAUSED via pause()', () => {
    const sm = new GameStateMachine();
    sm.startGame();
    sm.pause();
    assert.equal(sm.current, 'PAUSED');
    assert.equal(sm.isPlaying(), false);
  });

  it('PAUSED → PLAYING via resume()', () => {
    const sm = new GameStateMachine();
    sm.startGame();
    sm.pause();
    sm.resume();
    assert.equal(sm.current, 'PLAYING');
    assert.equal(sm.isPlaying(), true);
  });

  it('PLAYING → GAME_OVER via gameOver()', () => {
    const sm = new GameStateMachine();
    sm.startGame();
    sm.gameOver();
    assert.equal(sm.current, 'GAME_OVER');
    assert.equal(sm.isPlaying(), false);
  });

  it('reset() from PLAYING → MENU', () => {
    const sm = new GameStateMachine();
    sm.startGame();
    sm.reset();
    assert.equal(sm.current, 'MENU');
  });

  it('reset() from PAUSED → MENU', () => {
    const sm = new GameStateMachine();
    sm.startGame();
    sm.pause();
    sm.reset();
    assert.equal(sm.current, 'MENU');
  });

  it('reset() from GAME_OVER → MENU', () => {
    const sm = new GameStateMachine();
    sm.startGame();
    sm.gameOver();
    sm.reset();
    assert.equal(sm.current, 'MENU');
  });

  it('reset() from MENU stays MENU', () => {
    const sm = new GameStateMachine();
    sm.reset();
    assert.equal(sm.current, 'MENU');
  });
});

describe('GameStateMachine — invalid transitions are silently ignored', () => {
  it('pause() from MENU is ignored', () => {
    const sm = new GameStateMachine();
    sm.pause();
    assert.equal(sm.current, 'MENU');
  });

  it('resume() from MENU is ignored', () => {
    const sm = new GameStateMachine();
    sm.resume();
    assert.equal(sm.current, 'MENU');
  });

  it('gameOver() from MENU is ignored', () => {
    const sm = new GameStateMachine();
    sm.gameOver();
    assert.equal(sm.current, 'MENU');
  });

  it('startGame() from PLAYING is ignored', () => {
    const sm = new GameStateMachine();
    sm.startGame();
    sm.startGame();
    assert.equal(sm.current, 'PLAYING');
  });

  it('resume() from PLAYING is ignored', () => {
    const sm = new GameStateMachine();
    sm.startGame();
    sm.resume();
    assert.equal(sm.current, 'PLAYING');
  });

  it('gameOver() from PAUSED is ignored', () => {
    const sm = new GameStateMachine();
    sm.startGame();
    sm.pause();
    sm.gameOver();
    assert.equal(sm.current, 'PAUSED');
  });

  it('startGame() from GAME_OVER is ignored', () => {
    const sm = new GameStateMachine();
    sm.startGame();
    sm.gameOver();
    sm.startGame();
    assert.equal(sm.current, 'GAME_OVER');
  });
});
