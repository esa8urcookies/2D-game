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
- Character/monster sprites are authored at **182x182** pixels. Enemies
  are drawn procedurally in `src/assets/ProceduralSprites.js`; the
  player uses a procedural 4-direction pixel-art walking sheet from
  `src/assets/PixelHeroSheet.js`.
- To use custom player art, save a PNG at
  `src/assets/images/player-sheet.png` with 4 rows (down, left, up,
  right) and 4 frames per row (frame 0 = standing), then adjust
  `CUSTOM_SHEET` in `PixelHeroSheet.js` to match its cell size. The
  game loads it automatically and falls back to the procedural sheet
  if the file is missing.
- Collision shapes are intentionally smaller than sprites so the game
  feels fair.

## Project structure

```
index.html                       Canvas element + module entry
styles.css                       Fullscreen layout and canvas centering
src/main.js                      Entry point
src/config/GameConfig.js         ALL gameplay numbers in one place
src/core/Game.js                 Game states + main loop (delta time)
src/core/Input.js                Keyboard + mouse input
src/core/Camera.js               Follows the player, shake, culling
src/core/MathUtils.js            Vector/math/format helpers
src/core/DrawUtils.js            Shared sprite + bar drawing helpers
src/entities/Entity.js           Base class: position, velocity,
                                 radius, update, render
src/entities/Player.js           Movement, health, walk animation
src/entities/Enemy.js            Chasing, knockback, health bar
src/entities/Projectile.js       Auto-attack shots
src/entities/FloatingText.js     Rising damage numbers
src/entities/XPGem.js            XP gems with magnet attraction
src/config/Weapons.js            Weapon stat tables (levels 1-8)
src/config/Upgrades.js           Passive upgrade pool
src/weapons/Weapon.js            Weapon base class (level + cooldown)
src/weapons/ArcaneBolt.js        Projectile at nearest enemy
src/weapons/OrbitingBlade.js     Blades circling the player
src/weapons/HolyPulse.js         Area burst around the player
src/weapons/LightningMark.js     Strikes random visible enemies
src/systems/Renderer.js          Background + draw order + culling
src/systems/Spawner.js           Off-screen ring spawning + ramp-up
src/systems/CollisionSystem.js   Projectile/enemy/player collisions
src/systems/WeaponSystem.js      Auto-fires at the nearest enemy
src/systems/UISystem.js          HP bar, timer, kills HUD
src/systems/MenuSystem.js        Title, how-to, pause, game over
src/assets/ProceduralSprites.js  182x182 enemy placeholder sprites
src/assets/PixelHeroSheet.js     Player walk-cycle sprite sheet
src/assets/PixelFont.js          5x7 pixel font for all text
```
