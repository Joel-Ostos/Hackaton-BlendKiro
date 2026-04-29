# Flappy Kiro

Un juego de navegador estilo arcade inspirado en Flappy Bird, construido con HTML5 Canvas y JavaScript vanilla — sin frameworks, sin dependencias externas.

Controla a **Ghosty**, un fantasma que debe navegar a través de las brechas entre tuberías mientras esquiva obstáculos y recolecta monedas.

![Flappy Kiro UI](img/example-ui.png)

---

## Cómo jugar

| Acción | Control |
|---|---|
| Volar / Aletear | `Espacio` o clic / toque |
| Pausar / Reanudar | `P` o `Escape` |
| Reiniciar | `Espacio` o clic en la pantalla de Game Over |

- Pasa por las brechas entre tuberías para sumar puntos
- Recoge monedas para obtener puntos extra
- Una colisión = Game Over (una sola vida)
- La velocidad de las tuberías aumenta progresivamente con el puntaje

---

## Ejecutar el juego

El juego usa módulos ES (`type="module"`), por lo que necesita un servidor HTTP local — no funciona abriendo `index.html` directamente como archivo.

```bash
# Opción 1 — npx serve
npx serve .

# Opción 2 — Python
python3 -m http.server 8080
```

Luego abre `http://localhost:3000` (o el puerto que indique) en tu navegador.

---

## Estructura del proyecto

```
/
├── index.html        — Página principal, carga config.js y game.js
├── config.js         — Todas las constantes del juego (física, velocidad, etc.)
├── game.js           — Loop principal, manejo de input, coordinación de subsistemas
├── renderer.js       — Todo el dibujo en canvas
├── physics.js        — Física de Ghosty (gravedad, aleteo, velocidad terminal)
├── obstacles.js      — Generación y movimiento de tuberías
├── coins.js          — Sistema de monedas
├── particles.js      — Sistema de partículas (estela de Ghosty)
├── audio.js          — Sonidos y música (Web Audio API)
├── collision.js      — Detección de colisiones AABB pura
├── state.js          — Máquina de estados del juego
├── score.js          — Puntaje, vidas y persistencia en localStorage
└── assets/
    ├── ghosty.png    — Sprite del personaje
    ├── jump.wav      — Sonido de aleteo
    └── game_over.wav — Sonido de colisión
```

---

## Configuración

Todos los parámetros del juego están centralizados en `config.js`. Puedes ajustarlos sin tocar la lógica del juego:

| Constante | Valor | Descripción |
|---|---|---|
| `GRAVITY` | 1800 | Aceleración gravitacional (px/s²) |
| `FLAP_VELOCITY` | -520 | Velocidad al aletear (px/s) |
| `TERMINAL_VELOCITY` | 700 | Velocidad máxima de caída (px/s) |
| `PIPE_SPEED_INITIAL` | 200 | Velocidad inicial de tuberías (px/s) |
| `PIPE_SPEED_MAX` | 400 | Velocidad máxima de tuberías (px/s) |
| `GAP_SIZE` | 200 | Tamaño de la brecha entre tuberías (px) |
| `LIVES_INITIAL` | 1 | Vidas al inicio |
| `COIN_SCORE_VALUE` | 5 | Puntos por moneda |
| `PIPE_SCORE_VALUE` | 1 | Puntos por tubería pasada |

---

## Tests

El proyecto incluye tests unitarios y de propiedades (property-based testing) con **fast-check**, cubriendo las 15 propiedades de corrección definidas en el diseño.

```bash
npm test
```

Los archivos de test son:

| Archivo | Propiedades cubiertas |
|---|---|
| `physics.test.js` | Gravedad, aleteo, posición proporcional a dt |
| `collision.test.js` | Overlap AABB, colisión con bordes |
| `score.test.js` | Velocidad por milestones, persistencia, incrementos |
| `obstacles.test.js` | Bounds de brecha, movimiento de tuberías |
| `coins.test.js` | Posición de monedas dentro de la brecha |
| `particles.test.js` | Culling de partículas por lifetime |
| `game.test.js` | Movimiento de nubes, deducción de vida por colisión |

---

## Arquitectura

Cada subsistema es un módulo ES independiente con una API pública clara. `game.js` es el único coordinador — ningún módulo importa a otro excepto `config.js`.

```
game.js (loop principal)
  ├── config.js       ← importado por todos
  ├── state.js        ← GameStateMachine
  ├── score.js        ← ScoreManager
  ├── physics.js      ← PhysicsSystem
  ├── obstacles.js    ← ObstacleGenerator
  ├── coins.js        ← CoinSystem
  ├── particles.js    ← ParticleSystem
  ├── collision.js    ← funciones puras AABB
  ├── audio.js        ← AudioManager
  └── renderer.js     ← Renderer
```

---

## Licencia

Ver [LICENCE.md](LICENCE.md)
