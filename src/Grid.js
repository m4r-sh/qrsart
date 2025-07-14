export class Grid {
  constructor(w, h) {
    this.w = w;
    this.h = h;
    const totalTiles = w * h;
    const wordCount = Math.ceil(totalTiles / 32);
    this.valueBits = new Uint32Array(wordCount); // 1 bit per tile
    this.usedBits = new Uint32Array(wordCount);  // 1 bit per tile
  }

  #getBitPos(x, y) {
    const idx = y * this.w + x;
    return [idx >> 5, idx & 31]; // [uint32 index, bit offset]
  }

  set(x = 0, y = 0, v = 1) {
    if (x < 0 || x >= this.w || y < 0 || y >= this.h) return;
    const [i, s] = this.#getBitPos(x, y);
    const bit = 1 << s;

    // Set value bit
    if (v & 1) this.valueBits[i] |= bit;
    else this.valueBits[i] &= ~bit;

    // Mark as used
    this.usedBits[i] |= bit;
  }

  get(x = 0, y = 0) {
    if (x < 0 || x >= this.w || y < 0 || y >= this.h) return 0;
    const [i, s] = this.#getBitPos(x, y);
    const bit = 1 << s;
    return (this.valueBits[i] & bit) ? 1 : 0;
  }

  used(x = 0, y = 0) {
    if (x < 0 || x >= this.w || y < 0 || y >= this.h) return 0;
    const [i, s] = this.#getBitPos(x, y);
    const bit = 1 << s;
    return (this.usedBits[i] & bit) ? 1 : 0;
  }

  *tiles(onlyOn = null) {
    const { w, h, usedBits, valueBits } = this;
    const totalTiles = w * h;
    const wordCount = usedBits.length;

    for (let i = 0; i < wordCount; i++) {
      const used = usedBits[i];
      if (used === 0) continue;

      const values = valueBits[i];
      const baseIdx = i << 5;

      for (let j = 0; j < 32; j++) {
        const idx = baseIdx + j;
        if (idx >= totalTiles) break;

        const mask = 1 << j;
        if (!(used & mask)) continue;

        const isOn = (values & mask) !== 0;
        if (onlyOn == null || (!onlyOn == !isOn)) {
          yield [idx % w, Math.floor(idx / w)];
        }
      }
    }
  }

  toValueArray() {
    return this.valueBits.slice(); // GPU-friendly copy
  }

  static union(...grids) {
    const max_w = Math.max(...grids.map(g => g.w));
    const max_h = Math.max(...grids.map(g => g.h));
    const result = new Grid(max_w, max_h);

    for (const grid of grids) {
      for (const [x, y] of grid.tiles()) {
        if (!result.get(x, y)) {
          result.set(x, y, grid.get(x, y));
        }
      }
    }

    return result;
  }


  static erase(og, ...grids) {
    const result = new Grid(og.w, og.h);
    for (const [x, y] of og.tiles()) {
      if (!grids.some(g => g.used(x, y))) {
        result.set(x, y, og.get(x, y));
      }
    }
    return result;
  }

  static intersect(og, ...grids) {
    const result = new Grid(og.w, og.h);
    for (const [x, y] of og.tiles()) {
      if (grids.every(g => g.used(x, y))) {
        result.set(x, y, og.get(x, y));
      }
    }
    return result;
  }

  static invert(grid) {
    const result = new Grid(grid.w, grid.h);
    for (const [x, y] of grid.tiles()) {
      result.set(x, y, !grid.get(x, y));
    }
    return result;
  }
}
