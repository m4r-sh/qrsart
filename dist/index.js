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

// src/utils/modes.js
var NUMERIC_REGEX = /^[0-9]*$/;
var ALPHANUMERIC_REGEX = /^[A-Z0-9 $%*+.\/:-]*$/;
var ALPHANUMERIC_CHARSET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:";
var encoder = new TextEncoder;
var modes = {
  numeric: {
    modeBits: 1,
    charCost: (c) => NUMERIC_REGEX.test(c) ? 10 / 3 : Infinity,
    numCharCountBits: (v) => [10, 12, 14][Math.floor((v + 7) / 17)],
    write(data) {
      let bb = [];
      for (let i = 0;i < data.length; ) {
        const n = Math.min(data.length - i, 3);
        appendBits(parseInt(data.substr(i, n), 10), n * 3 + 1, bb);
        i += n;
      }
      return bb.slice();
    }
  },
  alpha: {
    modeBits: 2,
    charCost: (c) => ALPHANUMERIC_REGEX.test(c) ? 5.5 : Infinity,
    numCharCountBits: (v) => [9, 11, 13][Math.floor((v + 7) / 17)],
    write(data) {
      let bb = [];
      let i;
      for (i = 0;i + 2 <= data.length; i += 2) {
        let temp = ALPHANUMERIC_CHARSET.indexOf(data.charAt(i)) * 45;
        temp += ALPHANUMERIC_CHARSET.indexOf(data.charAt(i + 1));
        appendBits(temp, 11, bb);
      }
      if (i < data.length) {
        appendBits(ALPHANUMERIC_CHARSET.indexOf(data.charAt(i)), 6, bb);
      }
      return bb.slice();
    }
  },
  byte: {
    modeBits: 4,
    charCost: (c) => countUtf8Bytes(c) * 8,
    numCharCountBits: (v) => [8, 16, 16][Math.floor((v + 7) / 17)],
    test: (x) => true,
    write(str) {
      let data = encoder.encode(str);
      let bb = [];
      for (const b of data) {
        appendBits(b, 8, bb);
      }
      return bb.slice();
    }
  }
};
function appendBits(val, len, bb) {
  while (len > 31) {
    appendBits(val >>> len - 31, 31, bb);
    len -= 31;
  }
  if (val >>> len !== 0)
    throw new RangeError("Value out of range");
  for (let i = len - 1;i >= 0; i--)
    bb.push(val >>> i & 1);
}
function countUtf8Bytes(c) {
  let cp = c.codePointAt(0);
  if (cp < 0)
    throw "invalid";
  else if (cp < 128)
    return 1;
  else if (cp < 2048)
    return 2;
  else if (cp < 65536)
    return 3;
  else if (cp < 1114112)
    return 4;
  else
    throw "invalid";
}

// src/utils/reed-solomon.js
function reedSolomonComputeDivisor(degree) {
  if (degree < 1 || degree > 255) {
    throw new RangeError("Degree out of range");
  }
  let result = [];
  for (let i = 0;i < degree - 1; i++) {
    result.push(0);
  }
  result.push(1);
  let root = 1;
  for (let i = 0;i < degree; i++) {
    for (let j = 0;j < result.length; j++) {
      result[j] = reedSolomonMultiply(result[j], root);
      if (j + 1 < result.length) {
        result[j] ^= result[j + 1];
      }
    }
    root = reedSolomonMultiply(root, 2);
  }
  return result;
}
function reedSolomonComputeRemainder(data, divisor) {
  let result = divisor.map((_) => 0);
  for (const b of data) {
    const factor = b ^ result.shift();
    result.push(0);
    divisor.forEach((coef, i) => result[i] ^= reedSolomonMultiply(coef, factor));
  }
  return result;
}
function reedSolomonMultiply(x, y) {
  if (x >>> 8 != 0 || y >>> 8 != 0) {
    throw new RangeError("Byte out of range");
  }
  let z = 0;
  for (let i = 7;i >= 0; i--) {
    z = z << 1 ^ (z >>> 7) * 285;
    z ^= (y >>> i & 1) * x;
  }
  return z;
}

// src/segments.js
function optimalStrategy(str, {
  minVersion = 1,
  maxVersion = 40,
  minEcl = 0,
  maxEcl = 3
} = {}) {
  let version = minVersion;
  let ecl = minEcl;
  let minimalSeg;
  if (modes["numeric"].charCost("1") * str.length > getNumDataCodewords(maxVersion, ecl) * 8) {
    throw new Error("Data too long");
  }
  for (;version <= maxVersion; version++) {
    const dataCapacityBits = getNumDataCodewords(version, ecl) * 8;
    if (version == minVersion || version == 10 || version == 27) {
      minimalSeg = findMinimalSegmentation(str, version);
    }
    if (minimalSeg && minimalSeg.cost <= dataCapacityBits)
      break;
  }
  if (!minimalSeg || minimalSeg.cost > getNumDataCodewords(version, ecl) * 8 || version > maxVersion) {
    throw new Error("Data too long");
  }
  for (let i = ecl + 1;i <= maxEcl; i++) {
    if (minimalSeg.cost <= getNumDataCodewords(version, i) * 8) {
      ecl = i;
    } else
      break;
  }
  return {
    version,
    ecl,
    codewords: constructCodewords(str, minimalSeg.steps, version, ecl),
    cost: minimalSeg.cost,
    steps: minimalSeg.steps,
    strategy: packStrategy(minimalSeg.steps),
    budget: getNumDataCodewords(version, ecl) * 8
  };
}
function packStrategy(steps) {
  let arr = steps.map((mode) => ["byte", "numeric", "alpha", "kanji"].indexOf(mode));
  const packedLength = Math.ceil(arr.length / 4);
  const packed = new Uint8Array(packedLength);
  for (let i = 0;i < arr.length; i++) {
    const byteIndex = Math.floor(i / 4);
    const shift = (3 - i % 4) * 2;
    packed[byteIndex] |= (arr[i] & 3) << shift;
  }
  return packed;
}
function allStrategies(str, version, ecl) {
  const dataCapacityBits = getNumDataCodewords(version, ecl) * 8;
  const n = str.length;
  let paths = [{ cost: 0, steps: [], mode: "" }];
  for (let i = 0;i < n; i++) {
    const newPaths = [];
    for (const path of paths) {
      for (const mode of ["numeric", "alpha", "byte"]) {
        const charCost = modes[mode].charCost(str[i]);
        if (charCost === Infinity)
          continue;
        const headerBits = path.mode === mode ? 0 : 4 + modes[mode].numCharCountBits(version);
        const newCost = path.cost + headerBits + charCost;
        if (newCost > dataCapacityBits)
          continue;
        newPaths.push({
          cost: newCost,
          steps: [...path.steps, mode],
          strategy: packStrategy(path.steps),
          mode
        });
      }
    }
    paths = newPaths;
  }
  return paths;
}
function findMinimalSegmentation(str, version) {
  const n = str.length;
  const dp = Array(n + 1).fill().map(() => ({}));
  dp[0] = { "": { cost: 0, steps: [] } };
  let count = 0;
  for (let i = 1;i <= n; i++) {
    for (const prevMode in dp[i - 1]) {
      const prev = dp[i - 1][prevMode];
      for (const mode of ["numeric", "alpha", "byte"]) {
        const charCost = modes[mode].charCost(str[i - 1]);
        if (charCost === Infinity)
          continue;
        const headerBits = prevMode === mode ? 0 : 4 + modes[mode].numCharCountBits(version);
        const newCost = prev.cost + headerBits + charCost;
        if (!dp[i][mode] || newCost < dp[i][mode].cost) {
          dp[i][mode] = { cost: newCost, steps: [...prev.steps, mode] };
        }
      }
    }
  }
  const final = dp[n];
  let minCost = Infinity;
  let bestMode = "";
  for (const mode in final) {
    if (final[mode].cost < minCost) {
      minCost = final[mode].cost;
      bestMode = mode;
    }
  }
  return final[bestMode] ? {
    steps: final[bestMode].steps,
    cost: final[bestMode].cost
  } : null;
}
function constructCodewords(str, steps, version, ecl) {
  let segs = splitIntoSegments(str, steps);
  let bb = [];
  for (const { mode, str: str2 } of segs) {
    appendBits(modes[mode].modeBits, 4, bb);
    appendBits(str2.length, modes[mode].numCharCountBits(version), bb);
    for (const b of modes[mode].write(str2))
      bb.push(b);
  }
  const dataCapacityBits = getNumDataCodewords(version, ecl) * 8;
  appendBits(0, Math.min(4, dataCapacityBits - bb.length), bb);
  appendBits(0, (8 - bb.length % 8) % 8, bb);
  for (let padByte = 236;bb.length < dataCapacityBits; padByte ^= 236 ^ 17)
    appendBits(padByte, 8, bb);
  let dataCodewords = [];
  while (dataCodewords.length * 8 < bb.length)
    dataCodewords.push(0);
  bb.forEach((b, i) => dataCodewords[i >>> 3] |= b << 7 - (i & 7));
  const numBlocks = ECLS[ecl].num_ecc_blocks[version];
  const blockEccLen = ECLS[ecl].codewords_per_block[version];
  const rawCodewords = Math.floor(getNumRawDataModules(version) / 8);
  const numShortBlocks = numBlocks - rawCodewords % numBlocks;
  const shortBlockLen = Math.floor(rawCodewords / numBlocks);
  let blocks = [];
  const rsDiv = reedSolomonComputeDivisor(blockEccLen);
  for (let i = 0, k = 0;i < numBlocks; i++) {
    let dat = dataCodewords.slice(k, k + shortBlockLen - blockEccLen + (i < numShortBlocks ? 0 : 1));
    k += dat.length;
    const ecc = reedSolomonComputeRemainder(dat, rsDiv);
    if (i < numShortBlocks)
      dat.push(0);
    blocks.push(dat.concat(ecc));
  }
  let result = [];
  for (let i = 0;i < blocks[0].length; i++) {
    blocks.forEach((block, j) => {
      if (i != shortBlockLen - blockEccLen || j >= numShortBlocks)
        result.push(block[i]);
    });
  }
  return new Uint8Array(result);
}
function getNumRawDataModules(ver) {
  let result = (16 * ver + 128) * ver + 64;
  if (ver >= 2) {
    const numAlign = Math.floor(ver / 7) + 2;
    result -= (25 * numAlign - 10) * numAlign - 55;
    result -= ver >= 7 ? 36 : 0;
  }
  return result;
}
function getNumDataCodewords(ver, ecl) {
  return Math.floor(getNumRawDataModules(ver) / 8) - ECLS[ecl].codewords_per_block[ver] * ECLS[ecl].num_ecc_blocks[ver];
}
function splitIntoSegments(str = "", steps = []) {
  let segments = [];
  let curMode = steps[0];
  let start = 0;
  for (let i = 1;i <= str.length; i++) {
    if (i >= str.length || steps[i] != curMode) {
      segments.push({
        mode: curMode,
        str: str.slice(start, i)
      });
      curMode = steps[i];
      start = i;
    }
  }
  return segments;
}

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
        if (onlyOn == null || !onlyOn == !isOn) {
          yield [idx % w, Math.floor(idx / w)];
        }
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
    codewords = new Uint8Array
  } = {}) {
    this.version = version;
    this.ecl = ecl;
    this.mask = mask;
    this.codewords = codewords;
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
    let { size, functional_grid, codewords, mask } = this;
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
            if (i < codewords.length * 8) {
              const byteIndex = Math.floor(i / 8);
              const bitIndex = 7 - i % 8;
              dat = codewords[byteIndex] >> bitIndex & 1;
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
  static create() {
  }
  static save() {
  }
  static load() {
  }
  toString() {
    return `(QRCode) version:${this.version}, ecl:${this.ecl}, mask:${this.mask}`;
  }
  [Bun.inspect.custom]() {
    return `(QRCode) version:${this.version}, ecl:${this.ecl}, mask:${this.mask}`;
  }
}

// src/index.js
function createQR(data = "", {
  minVersion = 1,
  maxVersion = 40,
  minEcl = 0,
  maxEcl = 3,
  ecl = null,
  version = null,
  mask = 0
} = {}) {
  if (version)
    minVersion = maxVersion = version;
  if (ecl)
    minEcl = maxEcl = ecl;
  let opt = optimalStrategy(data, { minVersion, minEcl, maxEcl, maxVersion });
  return new QRCode({
    mask,
    version: opt.version,
    ecl: opt.ecl,
    codewords: opt.codewords
  });
}
export {
  optimalStrategy,
  createQR,
  constructCodewords,
  allStrategies,
  QRCode,
  Grid
};
