// Shared game constants.
// These live in their own file (instead of Game.js) so any module can
// import them without creating circular imports.

// Internal resolution. All game logic and drawing uses these
// coordinates; the canvas is scaled to the window afterwards.
export const GAME_WIDTH = 1920;
export const GAME_HEIGHT = 1080;
