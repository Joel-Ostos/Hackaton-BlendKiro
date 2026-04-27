# Implementation Plan: Flappy Kiro

## Overview

Build Flappy Kiro as a collection of single-responsibility ES modules coordinated by a central game loop. Tasks are ordered from foundational config and pure logic modules, through game loop wiring, then features, then visual polish. Each task builds directly on the previous ones with no orphaned code.

## Tasks

- [x] 1. Create `index.html` and `config.js`
  - Create `index.html` with a 480×640 `<canvas id="gameCanvas">`, centered via CSS flexbox, `image-rendering: pixelated`, loading `config.js` as a plain script and `game.js` as a module
  - Create `config.js` exporting all named constants: `GRAVITY`, `FLAP_VELOCITY`, `TERMINAL_VELOCITY`, `PIPE_SPEED_INITIAL`, `PIPE_SPEED_INCREMENT`, `PIPE_SPEED_MAX`, `PIPE_SPAWN_INTERVAL`, `GAP_SIZE`, `GAP_VERTICAL_MIN`, `GAP_VERTICAL_MAX`, `CLOUD_SPEED`, `CLOUD_COUNT`, `LIVES_INITIAL`, `INVINCIBILITY_DURATION`, `COIN_SCORE_VALUE`, `PIPE_SCORE_VALUE`, `SPEED_MILESTONE`, `PARTICLE_COUNT`, `PARTICLE_LIFETIME`, `SCREEN_SHAKE_DURATION`, `SCREEN_SHAKE_INTENSITY`
  - _Requirements: 2.1, 2.2, 2.3_

- [x] 2. Implement `collision.js` — pure AABB functions
  - [x] 2.1 Implement `aabbOverlap(a, b)` returning true iff the two `{x,y,w,h}` rectangles geometrically intersect
  - [x] 2.2 Implement `checkPipeCollision(ghostyHitbox, pipe, canvasHeight, scoreBarHeight)` using `aabbOverlap` against both top and bottom pipe AABBs derived from `pipe.gapCenterY` and `GAP_SIZE`
  - [x] 2.3 Implement `checkBoundaryCollision(ghostyHitbox, canvasHeight, scoreBarHeight)` returning true when hitbox extends above y=0 or below `canvasHeight - scoreBarHeight`
  - [x] 2.4 Implement `checkCoinCollision(ghostyHitbox, coin)` treating the coin circle as an AABB `{x: coin.x - coin.radius, y: coin.y - coin.radius, w: coin.radius*2, h: coin.radius*2}`
  - [x] 2.5 Write property test for `aabbOverlap` — Property 11
    - **Property 11: AABB overlap detection is correct for all rectangle pairs**
    - **Validates: Requirements 8.1, 8.2**
  - [x] 2.6 Write property test for `checkBoundaryCollision` — Property 12
    - **Property 12: Boundary collision detects all out-of-bounds positions**
    - **Validates: Requirements 8.3**
  - _Requirements: 8.1, 8.2, 8.3_

- [x] 3. Implement `state.js` — GameStateMachine
  - Implement `GameStateMachine` class with states `MENU | PLAYING | PAUSED | GAME_OVER`
  - Expose `get current()`, `isPlaying()`, `startGame()`, `pause()`, `resume()`, `gameOver()`, `reset()`
  - Enforce valid transitions only: MENU→PLAYING, PLAYING→PAUSED, PAUSED→PLAYING, PLAYING→GAME_OVER, any→MENU
  - _Requirements: 9.1, 9.2, 9.4, 9.5_

- [x] 4. Implement `score.js` — ScoreManager
  - [x] 4.1 Implement `ScoreManager` class with `get score()`, `get lives()`, `get highScore()`, `addPipeScore()`, `addCoinScore()`, `loseLife()`, `reset()`
  - [x] 4.2 Implement `saveHighScore()` and `loadHighScore()` using `localStorage`, catching `SecurityError` and defaulting to 0
  - [x] 4.3 Implement `getCurrentPipeSpeed()` returning `min(PIPE_SPEED_INITIAL + floor(score / SPEED_MILESTONE) * PIPE_SPEED_INCREMENT, PIPE_SPEED_MAX)`
  - [x] 4.4 Write property test for `getCurrentPipeSpeed` — Property 7
    - **Property 7: Pipe speed scales correctly with score milestones**
    - **Validates: Requirements 5.4**
  - [x] 4.5 Write property test for `saveHighScore` / `loadHighScore` round trip — Property 14
    - **Property 14: High score persists across save/load round trip**
    - **Validates: Requirements 9.6**
  - [x] 4.6 Write property test for pipe score increment — Property 13
    - **Property 13: Score increments by PIPE_SCORE_VALUE on each gap pass**
    - **Validates: Requirements 9.3**
  - [x] 4.7 Write property test for coin score increment — Property 9
    - **Property 9: Coin collection increases score by COIN_SCORE_VALUE**
    - **Validates: Requirements 6.2**
  - _Requirements: 5.4, 6.2, 9.3, 9.6_

- [x] 5. Implement `physics.js` — PhysicsSystem
  - [x] 5.1 Implement `PhysicsSystem` class with `constructor(canvasHeight)`, `get ghosty()`, `flap()`, `update(dt)`, `reset()`, `getHitbox()`
  - [x] 5.2 `update(dt)` applies `GRAVITY * dt` to `vy`, clamps to `TERMINAL_VELOCITY`, then updates `y += vy * dt`
  - [x] 5.3 `flap()` sets `vy = FLAP_VELOCITY` unconditionally
  - [x] 5.4 `getHitbox()` returns inset AABB: `x + width*0.15`, `y + height*0.1`, `width*0.7`, `height*0.8`
  - [x] 5.5 Add `invincibilityRemaining` field; `update(dt)` decrements it; expose `isInvincible` getter
  - [x] 5.6 Add `triggerInvincibility(duration)` method setting `invincibilityRemaining = duration`
  - [x] 5.7 Write property test for gravity accumulation — Property 1
    - **Property 1: Gravity accumulates velocity each frame**
    - **Validates: Requirements 4.1, 4.3**
  - [x] 5.8 Write property test for flap velocity — Property 2
    - **Property 2: Flap sets velocity unconditionally**
    - **Validates: Requirements 4.2**
  - [x] 5.9 Write property test for position update proportional to dt — Property 3
    - **Property 3: Position updates proportionally to delta time**
    - **Validates: Requirements 4.5**
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 6. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Implement `obstacles.js` — ObstacleGenerator
  - [x] 7.1 Implement `ObstacleGenerator` class with `get pipes()`, `update(dt, pipeSpeed)`, `reset()`, `checkScored(ghostyX)`
  - [x] 7.2 `update` moves all pipes left by `pipeSpeed * dt`, spawns a new `PipePair` when the spawn timer exceeds `PIPE_SPAWN_INTERVAL`, culls pipes whose `x + width < 0`
  - [x] 7.3 New `PipePair` has `gapCenterY` randomized uniformly in `[GAP_VERTICAL_MIN, GAP_VERTICAL_MAX]` and `scored: false`
  - [x] 7.4 `checkScored(ghostyX)` marks pipes as `scored = true` when `ghostyX > pipe.x + pipe.width` and returns the count of newly scored pipes
  - [x] 7.5 Write property test for pipe gap bounds — Property 5
    - **Property 5: Pipe gap size and center are always within configured bounds**
    - **Validates: Requirements 5.2**
  - [x] 7.6 Write property test for pipe movement — Property 6
    - **Property 6: Pipe positions decrease by pipeSpeed × dt each frame**
    - **Validates: Requirements 5.3**
  - _Requirements: 5.1, 5.2, 5.3, 5.5_

- [x] 8. Implement `coins.js` — CoinSystem
  - [x] 8.1 Implement `CoinSystem` class with `get coins()`, `spawnForPipe(pipe)`, `update(dt, pipeSpeed)`, `collect(coinId)`, `reset()`
  - [x] 8.2 `spawnForPipe` randomly spawns 0 or 1 coin per pipe; coin `y` is within `[gapCenterY - GAP_SIZE/2, gapCenterY + GAP_SIZE/2]`; coin `x` is centered in the pipe gap horizontally
  - [x] 8.3 `update` moves coins left at `pipeSpeed * dt`, culls off-screen coins
  - [x] 8.4 `collect(coinId)` removes the coin with the matching id from the active list
  - [x] 8.5 Write property test for coin spawn position — Property 8
    - **Property 8: Coins spawn within their pipe's gap bounds**
    - **Validates: Requirements 6.1**
  - _Requirements: 6.1, 6.2_

- [x] 9. Implement `particles.js` — ParticleSystem
  - [x] 9.1 Implement `ParticleSystem` class with `emit(x, y)`, `update(dt)`, `get particles()`, `reset()`
  - [x] 9.2 `emit` spawns `PARTICLE_COUNT` particles at `(x, y)` each with random `vx`, `vy` drift, `life = PARTICLE_LIFETIME`, `alpha = 1`
  - [x] 9.3 `update(dt)` advances each particle position by `vx*dt`, `vy*dt`, decrements `life` by `dt * 1000`, sets `alpha = life / PARTICLE_LIFETIME`, removes particles with `life <= 0`
  - [x] 9.4 Write property test for particle culling — Property 15
    - **Property 15: Particles are culled after PARTICLE_LIFETIME**
    - **Validates: Requirements 10.5**
  - _Requirements: 10.5_

- [x] 10. Implement `audio.js` — AudioManager
  - [x] 10.1 Implement `AudioManager` class with `init()`, `playFlap()`, `playScore()`, `playCollision()`, `playCoin()`, `startMusic()`, `stopMusic()`, `setMuted(muted)`
  - [x] 10.2 `init()` creates `AudioContext`, fetches and decodes `assets/jump.wav` into `flapBuffer` and `assets/game_over.wav` into `collisionBuffer`; wrap in try/catch and log warnings on failure
  - [x] 10.3 `playFlap()` and `playCollision()` create `BufferSourceNode` from decoded buffers and connect to destination
  - [x] 10.4 `playScore()` synthesizes an 880 Hz sine wave, 80ms, with gain envelope via Web Audio API
  - [x] 10.5 `playCoin()` synthesizes a 1200 Hz sine wave, 60ms, with gain envelope via Web Audio API
  - [x] 10.6 `startMusic()` creates a looping low-frequency oscillator (55 Hz) ambient drone; `stopMusic()` disconnects it
  - [x] 10.7 `setMuted(true)` calls `audioCtx.suspend()`; `setMuted(false)` calls `audioCtx.resume()`
  - _Requirements: 10.1, 10.2, 10.3, 10.4_

- [x] 11. Implement `renderer.js` — Renderer
  - [x] 11.1 Implement `Renderer` class constructor accepting `canvas` and `ctx`; cache an offscreen canvas for the static background
  - [x] 11.2 Implement `drawBackground(clouds)`: draw sky gradient (`#87CEEB` → `#1a1a2e`), city skyline silhouette (dark grey rectangles), circuit-board ground (`#0d1117` base with neon green `#00ff41` lines and pads), then draw each cloud
  - [x] 11.3 Implement `drawPipes(pipes, canvasHeight, scoreBarHeight)`: draw top and bottom pipe bodies as filled rectangles with color interpolated from `#00bcd4` (low speed) to `#7c3aed` (max speed) based on `currentPipeSpeed / PIPE_SPEED_MAX`; add pipe caps (slightly wider, darker) and 2px outline stroke
  - [x] 11.4 Implement `drawCoins(coins)`: draw each coin as an orange filled circle at `(coin.x, coin.y)` with `coin.radius`
  - [x] 11.5 Implement `drawGhosty(ghosty, ghostyImage, isInvincible)`: draw `ghostyImage` at `(ghosty.x, ghosty.y)`; when `isInvincible`, flicker by alternating `globalAlpha` between 1.0 and 0.3 every 100ms
  - [x] 11.6 Implement `drawParticles(particles)`: draw each particle as a small filled circle using `particle.alpha` for `globalAlpha`
  - [x] 11.7 Implement `drawHUD(score, lives, highScore)` and `drawScoreBar(score, lives, highScore)`: dark bottom bar with white text showing score, lives (as heart icons or text), and high score
  - [x] 11.8 Implement `drawScorePopups(popups)`: render floating "+N" text at each popup's `(x, y)` fading out via `alpha`
  - [x] 11.9 Implement `drawMenuScreen(highScore)`, `drawPauseOverlay()`, `drawGameOverScreen(score, highScore)` as semi-transparent overlays with centered text
  - [x] 11.10 Implement `applyScreenShake(shakeState)` translating the canvas context by `shakeState.offsetX / offsetY`; implement `clearShake()` resetting the transform
  - _Requirements: 1.1, 1.2, 1.3, 3.1, 3.2, 3.3, 3.4, 9.1, 9.5, 10.6_

- [x] 12. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 13. Implement `game.js` — entry point, game loop, and wiring
  - [x] 13.1 Instantiate all subsystems: `GameStateMachine`, `ScoreManager`, `PhysicsSystem`, `ObstacleGenerator`, `CoinSystem`, `ParticleSystem`, `AudioManager`, `Renderer`; load `ghosty.png` image element
  - [x] 13.2 Implement `init()`: call `score.loadHighScore()`, initialize clouds array (`CLOUD_COUNT` clouds at random positions), attach input event listeners, call `requestAnimationFrame(gameLoop)`
  - [x] 13.3 Implement `gameLoop(timestamp)`: compute `dt = min((timestamp - lastTimestamp) / 1000, 0.05)`, update all subsystems when `state.isPlaying()`, then call `renderer.render(assembleGameState())`
  - [x] 13.4 Implement the update block: call `physics.update(dt)`, `obstacles.update(dt, score.getCurrentPipeSpeed())`, `coins.update(dt, score.getCurrentPipeSpeed())`, `particles.emit(...)`, `particles.update(dt)`, update score popups, update shake state, update clouds
  - [x] 13.5 Implement collision checks each frame: iterate pipes calling `collision.checkPipeCollision`; call `collision.checkBoundaryCollision`; iterate coins calling `collision.checkCoinCollision`; call `handleCollision()` or coin collection logic accordingly
  - [x] 13.6 Implement `handleCollision()`: skip if `physics.isInvincible`; call `score.loseLife()`, `audio.playCollision()`, start screen shake, call `physics.triggerInvincibility(INVINCIBILITY_DURATION)`; if `score.lives == 0` call `score.saveHighScore()` and `state.gameOver()`
  - [x] 13.7 Implement pipe scoring: call `obstacles.checkScored(physics.ghosty.x)` and for each passed pipe call `score.addPipeScore()`, `audio.playScore()`, add score popup
  - [x] 13.8 Implement `handleInput(event)`: on Space/tap in MENU call `audio.init()` then `state.startGame()`; in PLAYING call `physics.flap()` and `audio.playFlap()`; P/Escape toggles pause; in GAME_OVER call `resetGame()`
  - [x] 13.9 Implement `resetGame()`: call `state.reset()`, `score.reset()`, `physics.reset()`, `obstacles.reset()`, `coins.reset()`, `particles.reset()`, clear score popups and shake state
  - [x] 13.10 Write property test for cloud movement — Property 4
    - **Property 4: Cloud positions decrease by CLOUD_SPEED × dt each frame**
    - **Validates: Requirements 3.2**
  - [x] 13.11 Write property test for collision life deduction — Property 10
    - **Property 10: Collision deducts one life and sets invincibility**
    - **Validates: Requirements 7.2, 8.5**
  - _Requirements: 4.2, 7.1, 7.2, 7.3, 8.4, 8.5, 9.2, 9.3, 9.4, 10.1, 10.2, 10.3_

- [x] 14. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at logical milestones
- Property tests use fast-check with a minimum of 100 iterations per property
- All 15 correctness properties from the design are covered across tasks 2, 4, 5, 7, 8, 9, and 13
- No magic numbers outside `config.js` — all modules import constants from there
