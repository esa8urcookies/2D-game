# Swarm Survivors (working title)

An original 2D survivor-style browser game built with HTML5 Canvas and
vanilla JavaScript — no game engine, no external libraries, no
copyrighted assets.

## How to run

The game uses ES modules, so it must be served over HTTP (opening
`index.html` directly with `file://` will not work in most browsers).

From the project folder, run any static file server, for example:

```bash
# Python 3
python3 -m http.server 8000

# or Node.js
npx serve .
```

Then open <http://localhost:8000> in your browser.

## Controls

- **Move:** WASD or Arrow Keys

## Tech notes

- Internal resolution is **1920x1080**; the canvas scales to fit the
  browser window while preserving 16:9.
- Character/monster sprites are authored at **182x182** pixels. For now
  they are drawn procedurally in `src/assets/ProceduralSprites.js` and
  can later be swapped for image files of the same size.
- Collision shapes are intentionally smaller than sprites so the game
  feels fair.

## Project structure

```
index.html                       Canvas element + module entry
styles.css                       Fullscreen layout and canvas centering
src/main.js                      Entry point
src/core/Game.js                 Game state + main loop (delta time)
src/core/Constants.js            Internal resolution constants
src/core/Input.js                Keyboard input (WASD / arrows)
src/core/Camera.js               Follows the player
src/core/MathUtils.js            Vector/math helpers
src/entities/Player.js           Player movement + contact feedback
src/entities/Enemy.js            Enemy types (slime, bat) + chasing
src/entities/Projectile.js       Auto-attack projectiles
src/entities/XPGem.js            (later step)
src/systems/Renderer.js          Draws background + entities
src/systems/Spawner.js           Off-screen ring spawning + ramp-up
src/systems/CollisionSystem.js   Projectile/enemy/player collisions
src/systems/WeaponSystem.js      Auto-fires at the nearest enemy
src/systems/UISystem.js          Title, timer, kills, FPS HUD
src/assets/ProceduralSprites.js  182x182 placeholder sprites
```
