// A uniform spatial hash grid for fast neighbor queries.
//
// Without this, checking every enemy against every other enemy for
// separation is O(n²) — 180 enemies means ~32,000 pair checks every
// frame. The grid buckets entities into cells and only compares those
// in the same or adjacent cells, turning the common case into ~O(n).
//
// One rule makes the 3x3 neighbor lookup exact: the cell size must be
// at least the largest collision reach we ever test, so anything close
// enough to matter always lands in the queried block.

export class SpatialGrid {
  constructor(cellSize) {
    this.cellSize = cellSize;
    this.cells = new Map(); // packed cell key -> array of entities
  }

  /** Pack two small signed cell coords into one integer key. */
  static key(cx, cy) {
    // Offset keeps coords non-negative; 100000 span avoids collisions
    // for any reasonable world size.
    return (cx + 50000) * 100000 + (cy + 50000);
  }

  clear() {
    this.cells.clear();
  }

  /** Bucket every entity in the list by its cell. */
  build(entities) {
    this.clear();
    for (const entity of entities) {
      const cx = Math.floor(entity.x / this.cellSize);
      const cy = Math.floor(entity.y / this.cellSize);
      const k = SpatialGrid.key(cx, cy);
      let cell = this.cells.get(k);
      if (!cell) {
        cell = [];
        this.cells.set(k, cell);
      }
      cell.push(entity);
    }
  }

  /**
   * Call `fn(entity)` for every entity in the 3x3 block of cells
   * around world position (x, y). Reuses no allocations.
   */
  forEachNeighbor(x, y, fn) {
    const cx = Math.floor(x / this.cellSize);
    const cy = Math.floor(y / this.cellSize);
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const cell = this.cells.get(SpatialGrid.key(cx + dx, cy + dy));
        if (!cell) continue;
        for (let i = 0; i < cell.length; i++) fn(cell[i]);
      }
    }
  }
}
