// A hand-made 5x7 pixel font, so all menu and HUD text is drawn as
// real pixels instead of a smooth browser font.
//
// Each glyph is 7 rows of 5 cells; '#' is a filled pixel. Text is
// drawn with fillRect per pixel, scaled up by a whole number so the
// pixels stay square and crisp.

const GLYPHS = {
  A: ['.###.', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
  B: ['####.', '#...#', '#...#', '####.', '#...#', '#...#', '####.'],
  C: ['.###.', '#...#', '#....', '#....', '#....', '#...#', '.###.'],
  D: ['####.', '#...#', '#...#', '#...#', '#...#', '#...#', '####.'],
  E: ['#####', '#....', '#....', '####.', '#....', '#....', '#####'],
  F: ['#####', '#....', '#....', '####.', '#....', '#....', '#....'],
  G: ['.###.', '#...#', '#....', '#.###', '#...#', '#...#', '.####'],
  H: ['#...#', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
  I: ['.###.', '..#..', '..#..', '..#..', '..#..', '..#..', '.###.'],
  J: ['....#', '....#', '....#', '....#', '#...#', '#...#', '.###.'],
  K: ['#...#', '#..#.', '#.#..', '##...', '#.#..', '#..#.', '#...#'],
  L: ['#....', '#....', '#....', '#....', '#....', '#....', '#####'],
  M: ['#...#', '##.##', '#.#.#', '#.#.#', '#...#', '#...#', '#...#'],
  N: ['#...#', '##..#', '#.#.#', '#..##', '#...#', '#...#', '#...#'],
  O: ['.###.', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
  P: ['####.', '#...#', '#...#', '####.', '#....', '#....', '#....'],
  Q: ['.###.', '#...#', '#...#', '#...#', '#.#.#', '#..#.', '.##.#'],
  R: ['####.', '#...#', '#...#', '####.', '#.#..', '#..#.', '#...#'],
  S: ['.####', '#....', '#....', '.###.', '....#', '....#', '####.'],
  T: ['#####', '..#..', '..#..', '..#..', '..#..', '..#..', '..#..'],
  U: ['#...#', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
  V: ['#...#', '#...#', '#...#', '#...#', '.#.#.', '.#.#.', '..#..'],
  W: ['#...#', '#...#', '#...#', '#.#.#', '#.#.#', '##.##', '#...#'],
  X: ['#...#', '#...#', '.#.#.', '..#..', '.#.#.', '#...#', '#...#'],
  Y: ['#...#', '#...#', '.#.#.', '..#..', '..#..', '..#..', '..#..'],
  Z: ['#####', '....#', '...#.', '..#..', '.#...', '#....', '#####'],
  0: ['.###.', '#...#', '#..##', '#.#.#', '##..#', '#...#', '.###.'],
  1: ['..#..', '.##..', '..#..', '..#..', '..#..', '..#..', '.###.'],
  2: ['.###.', '#...#', '....#', '...#.', '..#..', '.#...', '#####'],
  3: ['.###.', '#...#', '....#', '..##.', '....#', '#...#', '.###.'],
  4: ['...#.', '..##.', '.#.#.', '#..#.', '#####', '...#.', '...#.'],
  5: ['#####', '#....', '####.', '....#', '....#', '#...#', '.###.'],
  6: ['.###.', '#....', '#....', '####.', '#...#', '#...#', '.###.'],
  7: ['#####', '....#', '...#.', '..#..', '.#...', '.#...', '.#...'],
  8: ['.###.', '#...#', '#...#', '.###.', '#...#', '#...#', '.###.'],
  9: ['.###.', '#...#', '#...#', '.####', '....#', '....#', '.###.'],
  ':': ['.....', '..#..', '..#..', '.....', '..#..', '..#..', '.....'],
  '.': ['.....', '.....', '.....', '.....', '.....', '..#..', '..#..'],
  ',': ['.....', '.....', '.....', '.....', '..#..', '..#..', '.#...'],
  '!': ['..#..', '..#..', '..#..', '..#..', '..#..', '.....', '..#..'],
  '?': ['.###.', '#...#', '....#', '...#.', '..#..', '.....', '..#..'],
  '-': ['.....', '.....', '.....', '.###.', '.....', '.....', '.....'],
  '+': ['.....', '..#..', '..#..', '#####', '..#..', '..#..', '.....'],
  '/': ['....#', '...#.', '...#.', '..#..', '.#...', '.#...', '#....'],
  '>': ['#....', '.#...', '..#..', '...#.', '..#..', '.#...', '#....'],
  "'": ['..#..', '..#..', '.....', '.....', '.....', '.....', '.....'],
  ' ': ['.....', '.....', '.....', '.....', '.....', '.....', '.....'],
};

export const GLYPH_WIDTH = 5;
export const GLYPH_HEIGHT = 7;
const LETTER_SPACING = 1; // grid cells between characters

/** Width of a text string in pixels at the given scale. */
export function measurePixelText(text, scale) {
  if (text.length === 0) return 0;
  return (text.length * (GLYPH_WIDTH + LETTER_SPACING) - LETTER_SPACING) * scale;
}

/**
 * Draw pixel text at (x, y) = top-left corner.
 *
 * Options:
 *   scale        pixel size multiplier (whole numbers look best)
 *   color        main fill color
 *   shadeColor   optional darker color for the bottom rows (two-tone)
 *   outline      optional outline color (1 pixel-unit thick)
 *   align        'left' (default) or 'center' (x = center line)
 */
export function drawPixelText(ctx, text, x, y, options = {}) {
  const {
    scale = 4,
    color = '#ffffff',
    shadeColor = null,
    outline = null,
    align = 'left',
  } = options;

  const upper = String(text).toUpperCase();
  let startX = x;
  if (align === 'center') {
    startX = x - measurePixelText(upper, scale) / 2;
  }

  // Outline pass: the whole text stamped in 8 directions.
  if (outline) {
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        stampText(ctx, upper, startX + dx * scale, y + dy * scale, scale, outline, outline);
      }
    }
  }

  stampText(ctx, upper, startX, y, scale, color, shadeColor || color);
}

/** Internal: draw every glyph pixel once in the given colors. */
function stampText(ctx, text, x, y, scale, topColor, bottomColor) {
  let cursorX = x;

  for (const char of text) {
    const glyph = GLYPHS[char];
    if (glyph) {
      for (let row = 0; row < GLYPH_HEIGHT; row++) {
        // Two-tone shading: the lower third uses the darker color.
        ctx.fillStyle = row < 5 ? topColor : bottomColor;
        const line = glyph[row];
        for (let col = 0; col < GLYPH_WIDTH; col++) {
          if (line[col] === '#') {
            ctx.fillRect(cursorX + col * scale, y + row * scale, scale, scale);
          }
        }
      }
    }
    cursorX += (GLYPH_WIDTH + LETTER_SPACING) * scale;
  }
}
