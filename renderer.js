import { PIPE_SPEED_MAX } from './config.js';

const SCORE_BAR_HEIGHT = 60;

/**
 * Interpolates between two hex colors based on t (0..1).
 */
function lerpColor(hexA, hexB, t) {
  const parse = h => [
    parseInt(h.slice(1, 3), 16),
    parseInt(h.slice(3, 5), 16),
    parseInt(h.slice(5, 7), 16),
  ];
  const [ar, ag, ab] = parse(hexA);
  const [br, bg, bb] = parse(hexB);
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const b = Math.round(ab + (bb - ab) * t);
  return `rgb(${r},${g},${b})`;
}

/**
 * Darken a hex color by a factor (0..1 where 0 = black, 1 = original).
 */
function darkenColor(hex, factor) {
  const r = Math.round(parseInt(hex.slice(1, 3), 16) * factor);
  const g = Math.round(parseInt(hex.slice(3, 5), 16) * factor);
  const b = Math.round(parseInt(hex.slice(5, 7), 16) * factor);
  return `rgb(${r},${g},${b})`;
}

export class Renderer {
  constructor(canvas, ctx) {
    this.canvas = canvas;
    this.ctx = ctx;

    // Offscreen canvas for the static background
    this._bgCanvas = document.createElement('canvas');
    this._bgCanvas.width = canvas.width;
    this._bgCanvas.height = canvas.height;
    this._bgCtx = this._bgCanvas.getContext('2d');
    this._buildBackground();
  }

  // ─── Background ────────────────────────────────────────────────────────────

  /**
   * Build the static background layers onto the offscreen canvas once.
   */
  _buildBackground() {
    const { _bgCtx: ctx, _bgCanvas: bg } = this;
    const W = bg.width;
    const H = bg.height;

    // 1. Sky gradient (top 70%)
    const skyH = H * 0.70;
    const grad = ctx.createLinearGradient(0, 0, 0, skyH);
    grad.addColorStop(0, '#87CEEB');
    grad.addColorStop(1, '#1a1a2e');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, skyH);

    // Fill the rest (below sky, above ground) with the dark night colour
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, skyH, W, H - skyH);

    // 2. City skyline silhouette
    this._drawSkyline(ctx, W, H);

    // 3. Circuit-board ground (bottom 15% above score bar)
    this._drawCircuitGround(ctx, W, H);
  }

  _drawSkyline(ctx, W, H) {
    const horizonY = H * 0.68;
    const buildings = [
      { x: 0,   w: 40,  h: 90 },
      { x: 35,  w: 30,  h: 60 },
      { x: 60,  w: 50,  h: 120 },
      { x: 105, w: 25,  h: 75 },
      { x: 125, w: 45,  h: 100 },
      { x: 165, w: 35,  h: 55 },
      { x: 195, w: 55,  h: 130 },
      { x: 245, w: 30,  h: 80 },
      { x: 270, w: 40,  h: 95 },
      { x: 305, w: 50,  h: 110 },
      { x: 350, w: 30,  h: 65 },
      { x: 375, w: 45,  h: 85 },
      { x: 415, w: 35,  h: 105 },
      { x: 445, w: 40,  h: 70 },
    ];
    ctx.fillStyle = '#2a2a3e';
    for (const b of buildings) {
      ctx.fillRect(b.x, horizonY - b.h, b.w, b.h);
    }
    // Small windows
    ctx.fillStyle = '#ffff88';
    for (const b of buildings) {
      for (let wy = horizonY - b.h + 8; wy < horizonY - 8; wy += 14) {
        for (let wx = b.x + 5; wx < b.x + b.w - 5; wx += 10) {
          if (Math.sin(wx * 7 + wy * 13) > 0.2) {
            ctx.fillRect(wx, wy, 4, 5);
          }
        }
      }
    }
  }

  _drawCircuitGround(ctx, W, H) {
    const groundTop = H - SCORE_BAR_HEIGHT - H * 0.15;
    const groundH = H * 0.15;

    // Base
    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, groundTop, W, groundH);

    // Neon green lines
    ctx.strokeStyle = '#00ff41';
    ctx.lineWidth = 1;

    // Horizontal lines
    const hStep = 18;
    for (let y = groundTop + hStep; y < H - SCORE_BAR_HEIGHT; y += hStep) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }

    // Vertical lines (sparse)
    const vPositions = [30, 80, 140, 200, 260, 320, 380, 440];
    for (const x of vPositions) {
      ctx.beginPath();
      ctx.moveTo(x, groundTop);
      ctx.lineTo(x, H - SCORE_BAR_HEIGHT);
      ctx.stroke();
    }

    // Pads at intersections
    ctx.fillStyle = '#00ff41';
    for (const x of vPositions) {
      for (let y = groundTop + hStep; y < H - SCORE_BAR_HEIGHT; y += hStep) {
        ctx.fillRect(x - 3, y - 3, 6, 6);
      }
    }
  }

  /**
   * Draw the cached background then render scrolling clouds on top.
   */
  drawBackground(clouds) {
    const { ctx, canvas } = this;
    ctx.drawImage(this._bgCanvas, 0, 0);

    // Clouds
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    for (const cloud of clouds) {
      this._drawCloud(ctx, cloud);
    }
  }

  _drawCloud(ctx, cloud) {
    const { x, y, width, height } = cloud;
    ctx.save();
    ctx.fillStyle = 'rgba(220,235,255,0.9)';
    // Draw as overlapping ellipses for a fluffy look
    const rx = width / 2;
    const ry = height / 2;
    ctx.beginPath();
    ctx.ellipse(x + rx, y + ry, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(x + rx * 0.5, y + ry * 1.1, rx * 0.6, ry * 0.7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(x + rx * 1.5, y + ry * 1.1, rx * 0.55, ry * 0.65, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // ─── Pipes ─────────────────────────────────────────────────────────────────

  drawPipes(pipes, canvasHeight, scoreBarHeight, currentPipeSpeed) {
    const { ctx } = this;
    const t = Math.min(1, Math.max(0, currentPipeSpeed / PIPE_SPEED_MAX));
    const bodyColor = lerpColor('#00bcd4', '#7c3aed', t);
    const capColor = darkenColor(
      t < 0.5 ? '#00bcd4' : '#7c3aed',
      0.65
    );
    const outlineColor = darkenColor(
      t < 0.5 ? '#00bcd4' : '#7c3aed',
      0.45
    );
    const CAP_EXTRA = 6; // cap is wider by this many px on each side
    const CAP_H = 14;

    for (const pipe of pipes) {
      const gapTop = pipe.gapCenterY - 80; // GAP_SIZE / 2 = 80
      const gapBottom = pipe.gapCenterY + 80;
      const pw = pipe.width;
      const px = pipe.x;

      // ── Top pipe ──
      const topH = gapTop;
      if (topH > 0) {
        // Body
        ctx.fillStyle = bodyColor;
        ctx.fillRect(px, 0, pw, topH);
        // Cap (at bottom of top pipe)
        ctx.fillStyle = capColor;
        ctx.fillRect(px - CAP_EXTRA, topH - CAP_H, pw + CAP_EXTRA * 2, CAP_H);
        // Outline
        ctx.strokeStyle = outlineColor;
        ctx.lineWidth = 2;
        ctx.strokeRect(px, 0, pw, topH);
        ctx.strokeRect(px - CAP_EXTRA, topH - CAP_H, pw + CAP_EXTRA * 2, CAP_H);
      }

      // ── Bottom pipe ──
      const bottomY = gapBottom;
      const bottomH = canvasHeight - scoreBarHeight - bottomY;
      if (bottomH > 0) {
        // Body
        ctx.fillStyle = bodyColor;
        ctx.fillRect(px, bottomY, pw, bottomH);
        // Cap (at top of bottom pipe)
        ctx.fillStyle = capColor;
        ctx.fillRect(px - CAP_EXTRA, bottomY, pw + CAP_EXTRA * 2, CAP_H);
        // Outline
        ctx.strokeStyle = outlineColor;
        ctx.lineWidth = 2;
        ctx.strokeRect(px, bottomY, pw, bottomH);
        ctx.strokeRect(px - CAP_EXTRA, bottomY, pw + CAP_EXTRA * 2, CAP_H);
      }
    }
  }

  // ─── Coins ─────────────────────────────────────────────────────────────────

  drawCoins(coins) {
    const { ctx } = this;
    for (const coin of coins) {
      ctx.save();
      ctx.fillStyle = '#ff9800';
      ctx.beginPath();
      ctx.arc(coin.x, coin.y, coin.radius, 0, Math.PI * 2);
      ctx.fill();
      // Shine highlight
      ctx.fillStyle = 'rgba(255,255,200,0.5)';
      ctx.beginPath();
      ctx.arc(coin.x - coin.radius * 0.25, coin.y - coin.radius * 0.25, coin.radius * 0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  // ─── Ghosty ────────────────────────────────────────────────────────────────

  drawGhosty(ghosty, ghostyImage, isInvincible) {
    const { ctx } = this;
    ctx.save();
    if (isInvincible) {
      // Flicker: alternate alpha every 100ms
      const flicker = Math.floor(Date.now() / 100) % 2 === 0;
      ctx.globalAlpha = flicker ? 1.0 : 0.3;
    }
    if (ghostyImage && ghostyImage.complete && ghostyImage.naturalWidth > 0) {
      ctx.drawImage(ghostyImage, ghosty.x, ghosty.y, ghosty.width, ghosty.height);
    } else {
      // Fallback: white rectangle
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(ghosty.x, ghosty.y, ghosty.width || 40, ghosty.height || 40);
    }
    ctx.restore();
  }

  // ─── Particles ─────────────────────────────────────────────────────────────

  drawParticles(particles) {
    const { ctx } = this;
    for (const p of particles) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.fillStyle = '#a78bfa';
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  // ─── HUD & Score Bar ───────────────────────────────────────────────────────

  drawHUD(score, lives, highScore) {
    // Top HUD: title text
    const { ctx, canvas } = this;
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(0, 0, canvas.width, 36);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('FLAPPY KIRO', 10, 22);
    ctx.textAlign = 'right';
    ctx.fillText(`SCORE: ${score}`, canvas.width - 10, 22);
    ctx.restore();
  }

  drawScoreBar(score, lives, highScore) {
    const { ctx, canvas } = this;
    const barY = canvas.height - SCORE_BAR_HEIGHT;

    ctx.save();
    // Background
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, barY, canvas.width, SCORE_BAR_HEIGHT);
    // Top border
    ctx.strokeStyle = '#00ff41';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, barY);
    ctx.lineTo(canvas.width, barY);
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px monospace';

    // Lives (hearts)
    ctx.textAlign = 'left';
    const hearts = '♥'.repeat(Math.max(0, lives));
    ctx.fillStyle = '#ff4d6d';
    ctx.fillText(hearts, 10, barY + 36);

    // Score
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText(`${score}`, canvas.width / 2, barY + 36);

    // High score
    ctx.textAlign = 'right';
    ctx.font = '13px monospace';
    ctx.fillStyle = '#aaaacc';
    ctx.fillText(`BEST: ${highScore}`, canvas.width - 10, barY + 36);

    ctx.restore();
  }

  // ─── Score Popups ──────────────────────────────────────────────────────────

  drawScorePopups(popups) {
    const { ctx } = this;
    for (const popup of popups) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, popup.alpha);
      ctx.fillStyle = '#ffd700';
      ctx.font = 'bold 20px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`+${popup.value}`, popup.x, popup.y);
      ctx.restore();
    }
  }

  // ─── Overlays ──────────────────────────────────────────────────────────────

  drawMenuScreen(highScore) {
    const { ctx, canvas } = this;
    const W = canvas.width;
    const H = canvas.height;

    ctx.save();
    ctx.fillStyle = 'rgba(10,10,30,0.75)';
    ctx.fillRect(0, 0, W, H);

    // Title
    ctx.fillStyle = '#00ff41';
    ctx.font = 'bold 42px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('FLAPPY KIRO', W / 2, H / 2 - 80);

    // Subtitle
    ctx.fillStyle = '#a78bfa';
    ctx.font = '18px monospace';
    ctx.fillText('A ghost in the machine', W / 2, H / 2 - 45);

    // High score
    ctx.fillStyle = '#ffffff';
    ctx.font = '16px monospace';
    ctx.fillText(`BEST: ${highScore}`, W / 2, H / 2);

    // Start prompt (pulsing via time)
    const pulse = Math.sin(Date.now() / 400) * 0.3 + 0.7;
    ctx.globalAlpha = pulse;
    ctx.fillStyle = '#00ff41';
    ctx.font = 'bold 20px monospace';
    ctx.fillText('PRESS SPACE / TAP TO START', W / 2, H / 2 + 60);

    ctx.restore();
  }

  drawPauseOverlay() {
    const { ctx, canvas } = this;
    const W = canvas.width;
    const H = canvas.height;

    ctx.save();
    ctx.fillStyle = 'rgba(10,10,30,0.6)';
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('PAUSED', W / 2, H / 2 - 20);

    ctx.fillStyle = '#aaaacc';
    ctx.font = '16px monospace';
    ctx.fillText('Press P or ESC to resume', W / 2, H / 2 + 20);

    ctx.restore();
  }

  drawGameOverScreen(score, highScore) {
    const { ctx, canvas } = this;
    const W = canvas.width;
    const H = canvas.height;

    ctx.save();
    ctx.fillStyle = 'rgba(10,10,30,0.8)';
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = '#ff4d6d';
    ctx.font = 'bold 40px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', W / 2, H / 2 - 80);

    ctx.fillStyle = '#ffffff';
    ctx.font = '22px monospace';
    ctx.fillText(`Score: ${score}`, W / 2, H / 2 - 30);

    ctx.fillStyle = '#ffd700';
    ctx.font = '18px monospace';
    ctx.fillText(`Best: ${highScore}`, W / 2, H / 2 + 10);

    const pulse = Math.sin(Date.now() / 400) * 0.3 + 0.7;
    ctx.globalAlpha = pulse;
    ctx.fillStyle = '#00ff41';
    ctx.font = 'bold 18px monospace';
    ctx.fillText('PRESS SPACE / TAP TO RESTART', W / 2, H / 2 + 70);

    ctx.restore();
  }

  // ─── Screen Shake ──────────────────────────────────────────────────────────

  applyScreenShake(shakeState) {
    this._shakeApplied = false;
    if (shakeState && shakeState.active) {
      this.ctx.save();
      this.ctx.translate(shakeState.offsetX || 0, shakeState.offsetY || 0);
      this._shakeApplied = true;
    }
  }

  clearShake() {
    if (this._shakeApplied) {
      this.ctx.restore();
      this._shakeApplied = false;
    }
  }

  // ─── Full render pipeline ──────────────────────────────────────────────────

  /**
   * Render a complete frame given the assembled game state.
   * @param {object} gameState
   */
  render(gameState) {
    const {
      state,
      ghosty,
      pipes = [],
      coins = [],
      particles = [],
      clouds = [],
      score = 0,
      lives = 0,
      highScore = 0,
      shakeState,
      scorePopups = [],
      currentPipeSpeed = 0,
    } = gameState;

    const { canvas } = this;
    const canvasHeight = canvas.height;

    // 1. Apply screen shake
    this.applyScreenShake(shakeState);

    // 2. Background
    this.drawBackground(clouds);

    // 3. Pipes
    this.drawPipes(pipes, canvasHeight, SCORE_BAR_HEIGHT, currentPipeSpeed);

    // 4. Coins
    this.drawCoins(coins);

    // 5. Particles
    this.drawParticles(particles);

    // 6. Ghosty
    const ghostyImage = gameState.ghostyImage || null;
    const isInvincible = gameState.isInvincible || false;
    this.drawGhosty(ghosty, ghostyImage, isInvincible);

    // 7. Score popups
    this.drawScorePopups(scorePopups);

    // 8. HUD (top bar)
    this.drawHUD(score, lives, highScore);

    // 9. Score bar (bottom bar)
    this.drawScoreBar(score, lives, highScore);

    // 10. Clear shake transform
    this.clearShake();

    // 11. Overlay (if not PLAYING)
    if (state === 'MENU') {
      this.drawMenuScreen(highScore);
    } else if (state === 'PAUSED') {
      this.drawPauseOverlay();
    } else if (state === 'GAME_OVER') {
      this.drawGameOverScreen(score, highScore);
    }
  }
}
