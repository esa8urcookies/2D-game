// Entry point: create the game and start the loop.

import { Game } from './core/Game.js';

const canvas = document.getElementById('game-canvas');
const game = new Game(canvas);
game.start();
