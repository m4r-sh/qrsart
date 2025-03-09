// src/utils/ecls.js
var ECLS = [
  {
    formatBits: 1,
    codewords_per_block: [-1, 7, 10, 15, 20, 26, 18, 20, 24, 30, 18, 20, 24, 26, 30, 22, 24, 28, 30, 28, 28, 28, 28, 30, 30, 26, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
    num_ecc_blocks: [-1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 4, 4, 4, 4, 4, 6, 6, 6, 6, 7, 8, 8, 9, 9, 10, 12, 12, 12, 13, 14, 15, 16, 17, 18, 19, 19, 20, 21, 22, 24, 25]
  },
  {
    formatBits: 0,
    codewords_per_block: [-1, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26, 30, 22, 22, 24, 24, 28, 28, 26, 26, 26, 26, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28],
    num_ecc_blocks: [-1, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5, 5, 8, 9, 9, 10, 10, 11, 13, 14, 16, 17, 17, 18, 20, 21, 23, 25, 26, 28, 29, 31, 33, 35, 37, 38, 40, 43, 45, 47, 49]
  },
  {
    formatBits: 3,
    codewords_per_block: [-1, 13, 22, 18, 26, 18, 24, 18, 22, 20, 24, 28, 26, 24, 20, 30, 24, 28, 28, 26, 30, 28, 30, 30, 30, 30, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
    num_ecc_blocks: [-1, 1, 1, 2, 2, 4, 4, 6, 6, 8, 8, 8, 10, 12, 16, 12, 17, 16, 18, 21, 20, 23, 23, 25, 27, 29, 34, 34, 35, 38, 40, 43, 45, 48, 51, 53, 56, 59, 62, 65, 68]
  },
  {
    formatBits: 2,
    codewords_per_block: [-1, 17, 28, 22, 16, 22, 28, 26, 26, 24, 28, 24, 28, 22, 24, 24, 30, 28, 28, 26, 28, 30, 24, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
    num_ecc_blocks: [-1, 1, 1, 2, 4, 4, 4, 5, 6, 8, 8, 11, 11, 16, 16, 18, 16, 19, 21, 25, 25, 25, 34, 30, 32, 35, 37, 40, 42, 45, 48, 51, 54, 57, 60, 63, 66, 70, 74, 77, 81]
  }
];

// src/utils/masks.js
var MASK_SHAPES = [
  (x, y) => (x + y) % 2 == 0,
  (x, y) => y % 2 == 0,
  (x, y) => x % 3 == 0,
  (x, y) => (x + y) % 3 == 0,
  (x, y) => (Math.floor(x / 3) + Math.floor(y / 2)) % 2 == 0,
  (x, y) => x * y % 2 + x * y % 3 == 0,
  (x, y) => (x * y % 2 + x * y % 3) % 2 == 0,
  (x, y) => ((x + y) % 2 + x * y % 3) % 2 == 0
];

// src/Grid.js
class Grid {
  constructor(w, h) {
    this.w = w;
    this.h = h;
    this.data = new Uint8Array(Math.ceil(w * h / 4));
  }
  #getPosition(x, y) {
    const idx = y * this.w + x;
    return [idx >> 2, (idx & 3) << 1];
  }
  set(x = 0, y = 0, v = 1) {
    if (x < 0 || x >= this.w || y < 0 || y >= this.h)
      return;
    const [byteIdx, shift] = this.#getPosition(x, y);
    const mask = 3 << shift;
    const val = (v & 1) << shift | 1 << shift + 1;
    this.data[byteIdx] = this.data[byteIdx] & ~mask | val;
  }
  get(x = 0, y = 0) {
    if (x < 0 || x >= this.w || y < 0 || y >= this.h)
      return 0;
    const [byteIdx, shift] = this.#getPosition(x, y);
    return this.data[byteIdx] >> shift & 1;
  }
  used(x = 0, y = 0) {
    if (x < 0 || x >= this.w || y < 0 || y >= this.h)
      return 0;
    const [byteIdx, shift] = this.#getPosition(x, y);
    return this.data[byteIdx] >> shift + 1 & 1;
  }
  *tiles(onlyOn = null) {
    const { w, h, data } = this;
    let total_tiles = w * h;
    for (let i = 0;i < data.length; i++) {
      const byte = data[i];
      if (byte === 0)
        continue;
      const idxBase = i << 2;
      for (let j = 0;j < 4; j++) {
        const idx = idxBase + j;
        if (idx >= total_tiles)
          break;
        const shift = j << 1;
        const isUsed = byte & 2 << shift;
        if (!isUsed)
          continue;
        const isOn = byte & 1 << shift;
        if (onlyOn === true && !isOn)
          continue;
        if (onlyOn === false && isOn)
          continue;
        yield [idx % w, Math.floor(idx / w)];
      }
    }
  }
  static union(...grids) {
    const max_w = Math.max(...grids.map((g) => g.w));
    const max_h = Math.max(...grids.map((g) => g.h));
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
      if (!grids.some((g) => g.used(x, y))) {
        result.set(x, y, og.get(x, y));
      }
    }
    return result;
  }
  static intersect(og, ...grids) {
    const result = new Grid(og.w, og.h);
    for (const [x, y] of og.tiles()) {
      if (grids.every((g) => g.used(x, y))) {
        result.set(x, y, og.get(x, y));
      }
    }
    return result;
  }
}

// src/QRCode.js
class QRCode {
  constructor({
    version = 2,
    ecl = 0,
    mask = 0,
    bitstring = new Uint8Array
  } = {}) {
    this.version = version;
    this.ecl = ecl;
    this.mask = mask;
    this.bitstring = bitstring;
  }
  get size() {
    return this.version * 4 + 17;
  }
  get functional_grid() {
    let { finder_grid, timing_grid, alignment_grid, version_grid, format_grid } = this;
    return Grid.union(finder_grid, timing_grid, alignment_grid, version_grid, format_grid);
  }
  get finder_grid() {
    let { size } = this;
    let grid = new Grid(size, size);
    for (let r = 0;r < 8; r++) {
      for (let c = 0;c < 8; c++) {
        let is_on = Math.max(Math.abs(3 - r), Math.abs(3 - c)) != 2 && !(r == 7 || c == 7);
        grid.set(r, c, is_on);
        grid.set(size - r - 1, c, is_on);
        grid.set(r, size - c - 1, is_on);
      }
    }
    return grid;
  }
  get timing_grid() {
    let { size } = this;
    let grid = new Grid(size, size);
    for (let i = 8;i <= size - 8; i++) {
      let is_on = i % 2 == 0;
      grid.set(6, i, is_on);
      grid.set(i, 6, is_on);
    }
    return grid;
  }
  get alignment_positions() {
    let { version, size } = this;
    if (version == 1) {
      return [];
    }
    const numAlign = Math.floor(version / 7) + 2;
    const step = version == 32 ? 26 : Math.ceil((version * 4 + 4) / (numAlign * 2 - 2)) * 2;
    let result = [6];
    for (let pos = size - 7;result.length < numAlign; pos -= step) {
      result.splice(1, 0, pos);
    }
    return result;
  }
  get alignment_grid() {
    let { version, size, alignment_positions } = this;
    let grid = new Grid(size, size);
    const numAlign = alignment_positions.length;
    for (let i = 0;i < numAlign; i++) {
      for (let j = 0;j < numAlign; j++) {
        if (!(i == 0 && j == 0 || i == 0 && j == numAlign - 1 || i == numAlign - 1 && j == 0)) {
          for (let dy = -2;dy <= 2; dy++) {
            for (let dx = -2;dx <= 2; dx++) {
              let is_on = Math.max(Math.abs(dx), Math.abs(dy)) == 1 ? 0 : 1;
              grid.set(alignment_positions[i] + dx, alignment_positions[j] + dy, is_on);
            }
          }
        }
      }
    }
    return grid;
  }
  get format_grid() {
    let { ecl, mask, size } = this;
    let grid = new Grid(size, size);
    const data = ECLS[ecl].formatBits << 3 | mask;
    let rem = data;
    for (let i = 0;i < 10; i++) {
      rem = rem << 1 ^ (rem >>> 9) * 1335;
    }
    const bits = (data << 10 | rem) ^ 21522;
    for (let i = 0;i <= 5; i++)
      grid.set(8, i, bits >> i);
    grid.set(8, 7, bits >> 6);
    grid.set(8, 8, bits >> 7);
    grid.set(7, 8, bits >> 8);
    for (let i = 9;i < 15; i++)
      grid.set(14 - i, 8, bits >> i);
    for (let i = 0;i < 8; i++)
      grid.set(this.size - 1 - i, 8, bits >> i);
    for (let i = 8;i < 15; i++)
      grid.set(8, this.size - 15 + i, bits >> i);
    grid.set(8, this.size - 8, 1);
    return grid;
  }
  get version_grid() {
    let { version, size } = this;
    const grid = new Grid(size, size);
    if (version < 7) {
      return grid;
    }
    let rem = version;
    for (let i = 0;i < 12; i++) {
      rem = rem << 1 ^ (rem >>> 11) * 7973;
    }
    const bits = version << 12 | rem;
    for (let i = 0;i < 18; i++) {
      const a = size - 11 + i % 3;
      const b = Math.floor(i / 3);
      grid.set(a, b, bits >> i);
      grid.set(b, a, bits >> i);
    }
    return grid;
  }
  get data_grid() {
    let { size, functional_grid, bitstring, mask } = this;
    const grid = new Grid(size, size);
    let i = 0;
    for (let right = size - 1;right >= 1; right -= 2) {
      if (right === 6) {
        right = 5;
      }
      for (let vert = 0;vert < size; vert++) {
        for (let j = 0;j < 2; j++) {
          const x = right - j;
          const upward = (right + 1 & 2) === 0;
          const y = upward ? size - 1 - vert : vert;
          const isFunctional = functional_grid.used(x, y);
          if (!isFunctional) {
            let dat = 0;
            if (i < bitstring.length * 8) {
              const byteIndex = Math.floor(i / 8);
              const bitIndex = 7 - i % 8;
              dat = bitstring[byteIndex] >> bitIndex & 1;
            }
            dat ^= MASK_SHAPES[mask](x, y);
            grid.set(x, y, dat);
            i++;
          }
        }
      }
    }
    return grid;
  }
  get grid() {
    let { functional_grid, data_grid } = this;
    return Grid.union(functional_grid, data_grid);
  }
  static save(code) {
    let { version, ecl, mask, bitstring } = code;
    return new Uint8Array([
      version & 255,
      (ecl & 3) << 3 | (mask & 7) << 5,
      ...bitstring
    ]);
  }
  static load(data) {
    return new QRCode({
      version: data[0],
      ecl: data[1] >> 3 & 3,
      mask: data[1] >> 5 & 7,
      bitstring: data.slice(2)
    });
  }
}
export {
  QRCode,
  Grid
};
