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
var NUMERIC_MARGINS = [4, 3, 3];
var ALPHA_MARGINS = [6, 5];
var modes = {
  numeric: {
    modeBits: 1,
    charCost: (c) => NUMERIC_REGEX.test(c) ? 10 / 3 : Infinity,
    numCharCountBits: (v) => [10, 12, 14][Math.floor((v + 7) / 17)],
    groupSize: 3,
    getMarginal: (c, phase = 0) => NUMERIC_REGEX.test(c) ? NUMERIC_MARGINS[phase % 3] : Infinity,
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
    groupSize: 2,
    getMarginal: (c, phase = 0) => ALPHANUMERIC_REGEX.test(c) ? ALPHA_MARGINS[phase % 2] : Infinity,
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
    groupSize: 1,
    numCharCountBits: (v) => [8, 16, 16][Math.floor((v + 7) / 17)],
    getMarginal: (c, phase = 0) => countUtf8Bytes(c) * 8,
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
    codewords: constructCodewords(str, minimalSeg, version, ecl),
    strategy: minimalSeg
  };
}
function* allStrategies(str, version, ecl) {
  const dataCapacityBits = getNumDataCodewords(version, ecl) * 8;
  const n = str.length;
  const stack = [{ index: 0, strategy: new Strategy }];
  while (stack.length) {
    const { index, strategy } = stack.pop();
    if (index === n) {
      yield strategy;
      continue;
    }
    for (const mode of ["byte", "alpha", "numeric"]) {
      const charCost = modes[mode].charCost(str[index]);
      if (charCost === Infinity)
        continue;
      const headerBits = strategy.mode === mode ? 0 : 4 + modes[mode].numCharCountBits(version);
      let newCost = strategy.cost + headerBits + charCost;
      if (strategy.mode !== mode)
        newCost = Math.ceil(newCost);
      const estimatedRemainingCost = (n - 1 - index) * (10 / 3);
      if (newCost > dataCapacityBits - estimatedRemainingCost)
        continue;
      const newStrategy = strategy.addStep(mode, newCost);
      stack.push({ index: index + 1, strategy: newStrategy });
    }
  }
}
var modeNames = ["byte", "numeric", "alpha"];
var MAX_GROUP_SIZE = 3;
var NUM_MODES = 5;
var NUM_STATES = NUM_MODES * MAX_GROUP_SIZE;
var modeToIdx = {
  none: 0,
  byte: 1,
  numeric: 2,
  alpha: 3,
  kanji: 4
};
var idxToMode = [];
idxToMode[modeToIdx["none"]] = "none";
idxToMode[modeToIdx["byte"]] = "byte";
idxToMode[modeToIdx["numeric"]] = "numeric";
idxToMode[modeToIdx["alpha"]] = "alpha";
idxToMode[modeToIdx["kanji"]] = "kanji";
function findMinimalSegmentation(str, version = 1) {
  const n = str.length;
  let prevStates = new Array(NUM_STATES).fill(null);
  const noneState = modeToIdx["none"] * MAX_GROUP_SIZE + 0;
  prevStates[noneState] = new Strategy;
  for (let i = 1;i <= n; i++) {
    const c = str[i - 1];
    let currStates = new Array(NUM_STATES).fill(null);
    for (let s = 0;s < NUM_STATES; s++) {
      if (prevStates[s] === null)
        continue;
      const prev = prevStates[s];
      const prevModeIdx = Math.floor(s / MAX_GROUP_SIZE);
      const prevPhase = s % MAX_GROUP_SIZE;
      const prevMode = idxToMode[prevModeIdx];
      if (prevMode !== "none") {
        const curmode = modes[prevMode];
        const addedBits = curmode.getMarginal(c, prevPhase);
        if (addedBits !== Infinity) {
          const newPhase = (prevPhase + 1) % curmode.groupSize;
          const newState = modeToIdx[prevMode] * MAX_GROUP_SIZE + newPhase;
          const newCost = prev.cost + addedBits;
          const next = prev.addStep(prevMode, newCost);
          if (currStates[newState] === null || next.cost < currStates[newState].cost) {
            currStates[newState] = next;
          }
        }
      }
      for (const mode of modeNames) {
        const curmode = modes[mode];
        const initialBits = curmode.getMarginal(c, 0);
        if (initialBits === Infinity)
          continue;
        const headerBits = 4 + curmode.numCharCountBits(version);
        const newCost = prev.cost + headerBits + initialBits;
        const newPhase = 1 % curmode.groupSize;
        const newState = modeToIdx[mode] * MAX_GROUP_SIZE + newPhase;
        const next = prev.addStep(mode, newCost);
        if (currStates[newState] === null || next.cost < currStates[newState].cost) {
          currStates[newState] = next;
        }
      }
    }
    prevStates = currStates;
  }
  let best = null;
  let minCost = Infinity;
  for (let s = 0;s < NUM_STATES; s++) {
    if (prevStates[s] !== null && prevStates[s].cost < minCost) {
      minCost = prevStates[s].cost;
      best = prevStates[s];
    }
  }
  return best;
}
function constructCodewords(str, strategy, version, ecl) {
  let segs = splitIntoSegments(str, strategy);
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
function splitIntoSegments(str = "", strategy = {}) {
  let segments = [];
  let steps = strategy.steps;
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

class Strategy {
  constructor(prev = null, mode = "", cost = 0, length = 0) {
    this.prev = prev;
    this.mode = mode;
    this.cost = cost;
    this.length = length;
    this._steps = null;
  }
  addStep(mode, newCost) {
    return new Strategy(this, mode, newCost, this.length + 1);
  }
  get steps() {
    if (this._steps) {
      return this._steps;
    }
    const res = [];
    let cur = this;
    while (cur.prev) {
      res.push(cur.mode);
      cur = cur.prev;
    }
    this._steps = res.reverse();
    return this._steps;
  }
}

// src/utils/masks.js
var { floor } = Math;
var MASK_SHAPES = [
  (x, y) => (x + y) % 2 == 0,
  (x, y) => y % 2 == 0,
  (x, y) => x % 3 == 0,
  (x, y) => (x + y) % 3 == 0,
  (x, y) => (floor(x / 3) + floor(y / 2)) % 2 == 0,
  (x, y) => x * y % 2 + x * y % 3 == 0,
  (x, y) => (x * y % 2 + x * y % 3) % 2 == 0,
  (x, y) => ((x + y) % 2 + x * y % 3) % 2 == 0
];

// src/Grid.js
class Grid {
  constructor(w, h) {
    this.w = w;
    this.h = h;
    const totalTiles = w * h;
    const wordCount = totalTiles + 31 >> 5;
    this.valueBits = new Uint32Array(wordCount);
    this.usedBits = new Uint32Array(wordCount);
  }
  #getBitPos(x, y) {
    const idx = y * this.w + x;
    return [idx >> 5, idx & 31];
  }
  set(x = 0, y = 0, v = 1) {
    if (x < 0 || x >= this.w || y < 0 || y >= this.h)
      return;
    const [i, s] = this.#getBitPos(x, y);
    const bit = 1 << s;
    if (v & 1)
      this.valueBits[i] |= bit;
    else
      this.valueBits[i] &= ~bit;
    this.usedBits[i] |= bit;
  }
  get(x = 0, y = 0) {
    if (x < 0 || x >= this.w || y < 0 || y >= this.h)
      return 0;
    const [i, s] = this.#getBitPos(x, y);
    const bit = 1 << s;
    return this.valueBits[i] & bit ? 1 : 0;
  }
  used(x = 0, y = 0) {
    if (x < 0 || x >= this.w || y < 0 || y >= this.h)
      return 0;
    const [i, s] = this.#getBitPos(x, y);
    const bit = 1 << s;
    return this.usedBits[i] & bit ? 1 : 0;
  }
  *tiles(onlyOn = null) {
    const { w, h, usedBits, valueBits } = this;
    const totalTiles = w * h;
    const wordCount = usedBits.length;
    for (let i = 0;i < wordCount; i++) {
      const used = usedBits[i];
      if (used === 0)
        continue;
      const values = valueBits[i];
      const baseIdx = i << 5;
      for (let j = 0;j < 32; j++) {
        const idx = baseIdx + j;
        if (idx >= totalTiles)
          break;
        const mask = 1 << j;
        if (!(used & mask))
          continue;
        const isOn = (values & mask) !== 0;
        if (onlyOn == null || !onlyOn == !isOn) {
          yield [idx % w, Math.floor(idx / w)];
        }
      }
    }
  }
  toValueArray() {
    return this.valueBits.slice();
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
  static invert(grid) {
    const result = new Grid(grid.w, grid.h);
    for (const [x, y] of grid.tiles()) {
      result.set(x, y, !grid.get(x, y));
    }
    return result;
  }
}

// src/utils/base58.js
var ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
var BASE = BigInt(58);
function base58Encode(bytes) {
  let encoded = "";
  let num = BigInt(0);
  for (let byte of bytes) {
    num = num * BigInt(256) + BigInt(byte);
  }
  while (num > 0) {
    encoded = ALPHABET[Number(num % BASE)] + encoded;
    num = num / BASE;
  }
  return encoded;
}
function base58Decode(encoded) {
  const charMap = new Map(ALPHABET.split("").map((c, i) => [c, BigInt(i)]));
  let num = BigInt(0);
  for (let char of encoded) {
    const value = charMap.get(char);
    if (value === undefined)
      throw new Error("Invalid Base58 character");
    num = num * BASE + value;
  }
  const bytes = [];
  while (num > 0) {
    bytes.unshift(Number(num % BigInt(256)));
    num = num / BigInt(256);
  }
  return new Uint8Array(bytes);
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
    const grid = new Grid(this.size, this.size);
    drawFinder(grid, this);
    drawTiming(grid, this);
    drawAlignment(grid, this);
    drawVersion(grid, this);
    return grid;
  }
  get finder_grid() {
    const grid = new Grid(this.size, this.size);
    drawFinder(grid, this);
    return grid;
  }
  get timing_grid() {
    const grid = new Grid(this.size, this.size);
    drawTiming(grid, this);
    return grid;
  }
  get alignment_grid() {
    const grid = new Grid(this.size, this.size);
    drawAlignment(grid, this);
    return grid;
  }
  get format_grid() {
    const grid = new Grid(this.size, this.size);
    drawFormat(grid, this);
    return grid;
  }
  get version_grid() {
    const grid = new Grid(this.size, this.size);
    drawVersion(grid, this);
    return grid;
  }
  get data_grid() {
    const grid = new Grid(this.size, this.size);
    drawData(grid, this, this.functional_grid);
    return grid;
  }
  get rawdata_grid() {
    const grid = new Grid(this.size, this.size);
    drawData(grid, this, this.functional_grid, true);
    return grid;
  }
  get grid() {
    const grid = new Grid(this.size, this.size);
    drawFinder(grid, this);
    drawTiming(grid, this);
    drawAlignment(grid, this);
    drawVersion(grid, this);
    drawData(grid, this);
    return grid;
  }
  toBytes() {
    return new Uint8Array([
      this.version & 255,
      (this.ecl & 3) << 3 | (this.mask & 7) << 5,
      ...this.codewords
    ]);
  }
  toString() {
    return base58Encode(this.toBytes());
  }
  static fromBytes(bytes) {
    return new QRCode({
      version: bytes[0],
      ecl: bytes[1] >> 3 & 3,
      mask: bytes[1] >> 5 & 7,
      codewords: bytes.slice(2)
    });
  }
  static fromString(b58str) {
    return QRCode.fromBytes(base58Decode(b58str));
  }
}
function drawData(grid, qr_this, functional_grid, skip_mask = false) {
  if (!functional_grid) {
    functional_grid = grid;
  }
  let { codewords, mask, size } = qr_this;
  drawFormat(grid, qr_this);
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
          if (skip_mask !== true)
            dat ^= MASK_SHAPES[mask](x, y);
          grid.set(x, y, dat);
          i++;
        }
      }
    }
  }
}
function drawFinder(grid, { size }) {
  for (let r = 0;r < 8; r++) {
    for (let c = 0;c < 8; c++) {
      let is_on = Math.max(Math.abs(3 - r), Math.abs(3 - c)) != 2 && !(r == 7 || c == 7);
      grid.set(r, c, is_on);
      grid.set(size - r - 1, c, is_on);
      grid.set(r, size - c - 1, is_on);
    }
  }
}
function drawTiming(grid, { size }) {
  for (let i = 8;i <= size - 8; i++) {
    let is_on = i % 2 == 0;
    grid.set(6, i, is_on);
    grid.set(i, 6, is_on);
  }
}
function drawAlignment(grid, { size, version }) {
  let alignment_positions = get_alignment_positions(version, size);
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
}
function drawFormat(grid, { ecl, mask, size }) {
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
    grid.set(size - 1 - i, 8, bits >> i);
  for (let i = 8;i < 15; i++)
    grid.set(8, size - 15 + i, bits >> i);
  grid.set(8, size - 8, 1);
}
function drawVersion(grid, { version, size }) {
  if (version < 7) {
    return;
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
}
function get_alignment_positions(version, size) {
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
  MASK_SHAPES,
  Grid,
  ECLS
};
