import {
  CLOUD_SPEED,
  CLOUD_COUNT,
  INVINCIBILITY_DURATION,
  COIN_SCORE_VALUE,
  PIPE_SCORE_VALUE,
  SCREEN_SHAKE_DURATION,
  SCREEN_SHAKE_INTENSITY,
} from './config.js';
import { GameStateMachine } from './state.js';
import { ScoreManager } from './score.js';
import { PhysicsSystem } from './physics.js';
import { ObstacleGenerator } from './obstacles.js';
import { CoinSystem } from './coins.js';
import { ParticleSystem } from './particles.js';
import { AudioManager } from './audio.js';
import { Renderer } from './renderer.js';
import {
  checkPipeCollision,
  checkBoundaryCollision,
  checkCoinCollision,
} from './collision.js';

const SCORE_BAR_HEIGHT = 60;
const CANVAS_WIDTH = 480;
const CANVAS_HEIGHT = 640;
const SCORE_POPUP_LIFETIME = 800; // ms

// ─── Subsystem instances ────────────────────────────────────────────────────

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const state = new GameStateMachine();
const score = new ScoreManager();
const physics = new PhysicsSystem(CANVAS_HEIGHT);
const obstacles = new ObstacleGenerator();
const coins = new CoinSystem();
const particles = new ParticleSystem();
const audio = new AudioManager();
const renderer = new Renderer(canvas, ctx);

// Load Ghosty sprite
const ghostyImage = new Image();
ghostyImage.src = 'assets/ghosty.png';
ghostyImage.onerror = () => console.warn('game.js: failed to load assets/ghosty.png');

// ─── Game state ─────────────────────────────────────────────────────────────

let lastTimestamp = 0;
let clouds = [];
let scorePopups = [];
let shakeState = {
  active: false,
  remaining: 0,
  intensity: 0,
  offsetX: 0,
  offsetY: 0,
};

// ─── Cloud helpers ──────────────────────────────────────────────────────────

function randomCloud(x) {
  return {
    x,
    y: Math.random() * (CANVAS_HEIGHT * 0.55),
    width: 60 + Math.random() * 60,   // 60–120 px
    height: 20 + Math.random() * 20,  // 20–40 px
  };
}

function updateClouds(dt) {
  for (const cloud of clouds) {
    cloud.x -= CLOUD_SPEED * dt;
    if (cloud.x + cloud.width < 0) {
      cloud.x = CANVAS_WIDTH + cloud.width;
      cloud.y = Math.random() * (CANVAS_HEIGHT * 0.55);
    }
  }
}

// ─── Score popup helpers ─────────────────────────────────────────────────────

function addScorePopup(x, y, value) {
  scorePopups.push({ x, y, value, life: SCORE_POPUP_LIFETIME, alpha: 1 });
}

function updateScorePopups(dt) {
  for (const popup of scorePopups) {
    popup.life -= dt * 1000;
    popup.y -= 30 * dt; // float upward
    popup.alpha = Math.max(0, popup.life / SCORE_POPUP_LIFETIME);
  }
  scorePopups = scorePopups.filter(p => p.life > 0);
}

// ─── Shake helpers ───────────────────────────────────────────────────────────

function startShake() {
  shakeState.active = true;
  shakeState.remaining = SCREEN_SHAKE_DURATION;
  shakeState.intensity = SCREEN_SHAKE_INTENSITY;
}

function updateShake(dt) {
  if (!shakeState.active) return;
  shakeState.remaining -= dt * 1000;
  if (shakeState.remaining <= 0) {
    shakeState.active = false;
    shakeState.remaining = 0;
    shakeState.offsetX = 0;
    shakeState.offsetY = 0;
  } else {
    shakeState.offsetX = (Math.random() * 2 - 1) * shakeState.intensity;
    shakeState.offsetY = (Math.random() * 2 - 1) * shakeState.intensity;
  }
}

// ─── Collision handling ──────────────────────────────────────────────────────

function handleCollision() {
  if (physics.isInvincible) return;
  score.loseLife();
  audio.playCollision();
  startShake();
  physics.triggerInvincibility(INVINCIBILITY_DURATION);
  if (score.lives === 0) {
    score.saveHighScore();
    state.gameOver();
  }
}

// ─── Assemble game state for renderer ────────────────────────────────────────

function assembleGameState() {
  return {
    state: state.current,
    ghosty: physics.ghosty,
    pipes: obstacles.pipes,
    coins: coins.coins,
    particles: particles.particles,
    clouds,
    score: score.score,
    lives: score.lives,
    highScore: score.highScore,
    shakeState,
    scorePopups,
    ghostyImage,
    isInvincible: physics.isInvincible,
    currentPipeSpeed: score.getCurrentPipeSpeed(),
  };
}

// ─── Game loop ───────────────────────────────────────────────────────────────

function gameLoop(timestamp) {
  const dt = Math.min((timestamp - lastTimestamp) / 1000, 0.05);
  lastTimestamp = timestamp;

  if (state.isPlaying()) {
    // Update subsystems
    physics.update(dt);
    obstacles.update(dt, score.getCurrentPipeSpeed());
    coins.update(dt, score.getCurrentPipeSpeed());

    // Particle trail behind Ghosty
    const g = physics.ghosty;
    particles.emit(g.x, g.y + g.height / 2);
    particles.update(dt);

    // Score popups & shake
    updateScorePopups(dt);
    updateShake(dt);

    // Clouds
    updateClouds(dt);

    // ── Collision checks ──────────────────────────────────────────────────
    const hitbox = physics.getHitbox();

    // Pipe collisions
    for (const pipe of obstacles.pipes) {
      if (checkPipeCollision(hitbox, pipe, CANVAS_HEIGHT, SCORE_BAR_HEIGHT)) {
        handleCollision();
        break;
      }
    }

    // Boundary collision
    if (checkBoundaryCollision(hitbox, CANVAS_HEIGHT, SCORE_BAR_HEIGHT)) {
      handleCollision();
    }

    // Coin collisions
    for (const coin of [...coins.coins]) {
      if (checkCoinCollision(hitbox, coin)) {
        coins.collect(coin.id);
        score.addCoinScore();
        audio.playCoin();
        addScorePopup(coin.x, coin.y, COIN_SCORE_VALUE);
      }
    }

    // ── Pipe scoring ──────────────────────────────────────────────────────
    const passed = obstacles.checkScored(physics.ghosty.x);
    for (let i = 0; i < passed; i++) {
      score.addPipeScore();
      audio.playScore();
      addScorePopup(CANVAS_WIDTH / 2, physics.ghosty.y, PIPE_SCORE_VALUE);
    }
  } else {
    // Still update clouds in non-playing states for visual continuity
    updateClouds(dt);
  }

  renderer.render(assembleGameState());
  requestAnimationFrame(gameLoop);
}

// ─── Input handling ──────────────────────────────────────────────────────────

function handleInput(event) {
  const isSpace = event.type === 'keydown' && event.code === 'Space';
  const isTap = event.type === 'touchstart' || event.type === 'click';
  const isPause = event.type === 'keydown' &&
    (event.code === 'KeyP' || event.code === 'Escape');

  const current = state.current;

  if (isPause) {
    if (current === 'PLAYING') state.pause();
    else if (current === 'PAUSED') state.resume();
    return;
  }

  if (isSpace || isTap) {
    if (current === 'MENU') {
      audio.init();
      state.startGame();
    } else if (current === 'PLAYING') {
      physics.flap();
      audio.playFlap();
    } else if (current === 'GAME_OVER') {
      resetGame();
    }
  }
}

// ─── Reset ───────────────────────────────────────────────────────────────────

function resetGame() {
  state.reset();
  score.reset();
  physics.reset();
  obstacles.reset();
  coins.reset();
  particles.reset();
  scorePopups = [];
  shakeState = {
    active: false,
    remaining: 0,
    intensity: 0,
    offsetX: 0,
    offsetY: 0,
  };
}

// ─── Init ────────────────────────────────────────────────────────────────────

function init() {
  score.loadHighScore();

  // Initialize clouds at random positions across the canvas
  clouds = [];
  for (let i = 0; i < CLOUD_COUNT; i++) {
    clouds.push(randomCloud(Math.random() * CANVAS_WIDTH));
  }

  // Input event listeners
  window.addEventListener('keydown', handleInput);
  canvas.addEventListener('touchstart', handleInput, { passive: true });
  canvas.addEventListener('click', handleInput);

  requestAnimationFrame(gameLoop);
}

init();
