// src/search/MinQueue.js
var ROOT_INDEX = 1;

class MinQueue {
  constructor(capacity = 64, objects = [], priorities = []) {
    if (capacity < 1)
      throw new Error("Capacity must be positive");
    this._capacity = capacity;
    this._objects = new Array(capacity + ROOT_INDEX);
    this._priorities = new Float64Array(capacity + ROOT_INDEX);
    this.length = objects.length;
    if (objects.length !== priorities.length)
      throw new Error("Objects/priorities mismatch");
    if (capacity < objects.length)
      throw new Error("Capacity too small");
    for (let i = 0;i < objects.length; i++) {
      this._objects[i + ROOT_INDEX] = objects[i];
      this._priorities[i + ROOT_INDEX] = priorities[i];
    }
    for (let i = objects.length >>> 1;i >= ROOT_INDEX; i--)
      this.#bubbleDown(i);
  }
  get capacity() {
    return this._capacity;
  }
  clear() {
    this.length = 0;
  }
  size() {
    return this.length;
  }
  #bubbleUp(index) {
    let object = this._objects[index], priority = this._priorities[index];
    while (index > ROOT_INDEX) {
      let parentIndex = index >>> 1;
      if (this._priorities[parentIndex] <= priority)
        break;
      this._objects[index] = this._objects[parentIndex];
      this._priorities[index] = this._priorities[parentIndex];
      index = parentIndex;
    }
    this._objects[index] = object;
    this._priorities[index] = priority;
  }
  #bubbleDown(index) {
    let object = this._objects[index], priority = this._priorities[index];
    let halfLength = ROOT_INDEX + (this.length >>> 1), lastIndex = this.length + ROOT_INDEX - 1;
    while (index < halfLength) {
      let left = index << 1, childPriority = this._priorities[left], childObject = this._objects[left], childIndex = left;
      let right = left + 1;
      if (right <= lastIndex && this._priorities[right] < childPriority) {
        childPriority = this._priorities[right];
        childObject = this._objects[right];
        childIndex = right;
      }
      if (childPriority >= priority)
        break;
      this._objects[index] = childObject;
      this._priorities[index] = childPriority;
      index = childIndex;
    }
    this._objects[index] = object;
    this._priorities[index] = priority;
  }
  push(object, priority) {
    if (this.length === this._capacity)
      throw new Error("Heap full");
    let pos = this.length + ROOT_INDEX;
    this._objects[pos] = object;
    this._priorities[pos] = priority;
    this.length++;
    this.#bubbleUp(pos);
  }
  pop() {
    if (!this.length)
      return;
    const result = this._objects[ROOT_INDEX];
    this._objects[ROOT_INDEX] = this._objects[this.length + ROOT_INDEX - 1];
    this._priorities[ROOT_INDEX] = this._priorities[this.length + ROOT_INDEX - 1];
    this.length--;
    if (this.length > 0)
      this.#bubbleDown(ROOT_INDEX);
    return result;
  }
  peekPriority() {
    return this._priorities[ROOT_INDEX];
  }
  peek() {
    return this._objects[ROOT_INDEX];
  }
  consider(score, object) {
    if (this.length < this._capacity) {
      this.push(object, score);
    } else if (score > this._priorities[ROOT_INDEX]) {
      this._objects[ROOT_INDEX] = object;
      this._priorities[ROOT_INDEX] = score;
      this.#bubbleDown(ROOT_INDEX);
    }
  }
  extractAll() {
    const results = [];
    while (this.length > 0) {
      const score = this._priorities[ROOT_INDEX];
      const object = this.pop();
      results.unshift({ score, object });
    }
    return results;
  }
}

// src/search/permutations.js
var permutations = {
  case(str = "", {
    enableCaps = false
  } = {}) {
    if (!enableCaps) {
      return { total: 1, get: (k) => str };
    }
    const variablePositions = [];
    for (let i = 0;i < str.length; i++) {
      if (str[i].toLowerCase() !== str[i].toUpperCase()) {
        variablePositions.push(i);
      }
    }
    return {
      total: 2 ** variablePositions.length,
      get: (k) => {
        const result = str.split("");
        for (let i = 0;i < variablePositions.length; i++) {
          const pos = variablePositions[i];
          result[pos] = k >> i & 1 ? str[pos].toUpperCase() : str[pos].toLowerCase();
        }
        return result.join("");
      }
    };
  },
  group(components = [], {
    join = ""
  } = {}) {
    const totals = components.map((c) => typeof c.total === "number" ? c.total : 1);
    return {
      total: totals.reduce((acc, t) => acc * t, 1),
      get: (k) => {
        let remainder = k;
        const parts = [];
        for (let i = components.length - 1;i >= 0; i--) {
          const t = totals[i];
          const partK = remainder % t;
          remainder = Math.floor(remainder / t);
          parts.unshift(typeof components[i] === "string" ? components[i] : components[i].get(partK));
        }
        return parts.join(join);
      }
    };
  },
  url(url = "", {
    protocolCaps = false,
    domainCaps = false,
    pathCaps = false
  } = {}) {
    const parsed = new URL(url.startsWith("https") ? url : `https://${url}`);
    const protocolComp = permutations.case(parsed.protocol, { enableCaps: protocolCaps });
    const domainComp = permutations.case(parsed.hostname, { enableCaps: domainCaps });
    const pathComp = permutations.case(parsed.pathname || "/", { enableCaps: pathCaps });
    const combined = permutations.group([protocolComp, "//", domainComp, pathComp]);
    return {
      total: combined.total,
      get: (k) => combined.get(k) + (parsed.search || "") + (parsed.hash || "")
    };
  },
  phone(number = "0123456789", {
    forceCountry = false,
    validSpacers = [""],
    prefixCaps = false
  } = {}) {
  },
  email(address = "someone@example.com", {
    perfixCaps = false,
    domainCaps = false
  } = {}) {
  },
  emailMessage(address = "", {
    prefixCaps = false,
    domainCaps = false,
    queryCaps = false,
    queryOrdering = true
  } = {}) {
  },
  sms(number = "0123456789", {
    forceCountry = false,
    validSpacers = [""],
    prefixCaps = false,
    queryCaps = false
  } = {}) {
  },
  wifi({
    name = "",
    pwd = ""
  }) {
    let parts = [`T:WPA`, `S:` + name, `P:` + pwd];
    let orders = [[0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 1, 0], [2, 0, 1]];
    return {
      total: orders.length,
      get: (k) => `WIFI:${orders[k].map((i) => parts[i]).join(";")};;`
    };
  },
  vcard({ name = "", phone = "", email = "" }, {} = {}) {
  },
  event({ summary, dtstart }, {} = {}) {
  },
  geo({ latitude = "", longitude = "" } = {}, {} = {}) {
  },
  bitcoin({ address, amount }, {
    prefixCaps = true,
    queryCaps = true,
    queryOrder = true
  } = {}) {
  },
  ethereum({ address, amount }, {
    prefixCaps = true,
    queryCaps = true,
    queryOrder = true
  } = {}) {
  }
};

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
  if (len < 0 || len > 31 || val >>> len != 0)
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
function findAllSegmentations(str, version, ecl) {
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
          mode
        });
      }
    }
    paths = newPaths;
  }
  return paths.map(({ steps, cost }) => ({
    steps,
    cost,
    bitstring: constructCodewords(str, steps, version, ecl)
  }));
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

// src/search/index.js
function search(batch, priorityFn, {
  capacity = 20,
  ecl = 0,
  version = 2
} = {}) {
  const queue = new MinQueue(capacity);
  let queue_items = [];
  for (let item of batch) {
    for (let { bitstring } of findAllSegmentations(item, version, ecl)) {
      for (let m = 0;m < 8; m++) {
        let qr_params = { version, ecl, mask: m, bitstring };
        let qr = new QRCode(qr_params);
        let { score, obj } = priorityFn(qr);
        queue.consider(score, { obj, qr_params });
      }
    }
  }
  return queue.extractAll();
}
function permute(type = "url", value = "https://qrs.art", options = {}) {
  return permutations[type](value, options);
}
function batch({
  permutation = {},
  start = 0,
  stride = 1,
  limit = 1000,
  loop = 20000
}) {
  let { total, get } = permutation;
  let results = [];
  for (let i = 0;i < limit; i++) {
    let index = (start + i * stride) % loop;
    if (index >= total) {
      continue;
    }
    results.push(get(index));
  }
  return results;
}
export {
  search,
  permute,
  batch
};
