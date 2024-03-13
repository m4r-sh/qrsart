// src/utils/ecls.js
var ecls = {
  low: {
    formatBits: 1,
    codewords_per_block: [-1, 7, 10, 15, 20, 26, 18, 20, 24, 30, 18, 20, 24, 26, 30, 22, 24, 28, 30, 28, 28, 28, 28, 30, 30, 26, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
    num_ecc_blocks: [-1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 4, 4, 4, 4, 4, 6, 6, 6, 6, 7, 8, 8, 9, 9, 10, 12, 12, 12, 13, 14, 15, 16, 17, 18, 19, 19, 20, 21, 22, 24, 25]
  },
  medium: {
    formatBits: 0,
    codewords_per_block: [-1, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26, 30, 22, 22, 24, 24, 28, 28, 26, 26, 26, 26, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28],
    num_ecc_blocks: [-1, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5, 5, 8, 9, 9, 10, 10, 11, 13, 14, 16, 17, 17, 18, 20, 21, 23, 25, 26, 28, 29, 31, 33, 35, 37, 38, 40, 43, 45, 47, 49]
  },
  quartile: {
    formatBits: 3,
    codewords_per_block: [-1, 13, 22, 18, 26, 18, 24, 18, 22, 20, 24, 28, 26, 24, 20, 30, 24, 28, 28, 26, 30, 28, 30, 30, 30, 30, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
    num_ecc_blocks: [-1, 1, 1, 2, 2, 4, 4, 6, 6, 8, 8, 8, 10, 12, 16, 12, 17, 16, 18, 21, 20, 23, 23, 25, 27, 29, 34, 34, 35, 38, 40, 43, 45, 48, 51, 53, 56, 59, 62, 65, 68]
  },
  high: {
    formatBits: 2,
    codewords_per_block: [-1, 17, 28, 22, 16, 22, 28, 26, 26, 24, 28, 24, 28, 22, 24, 24, 30, 28, 28, 26, 28, 30, 24, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
    num_ecc_blocks: [-1, 1, 1, 2, 4, 4, 4, 5, 6, 8, 8, 11, 11, 16, 16, 18, 16, 19, 21, 25, 25, 25, 34, 30, 32, 35, 37, 40, 42, 45, 48, 51, 54, 57, 60, 63, 66, 70, 74, 77, 81]
  }
};

// src/utils/modes.js
function appendBits(val, len, bb) {
  if (len < 0 || len > 31 || val >>> len != 0)
    throw new RangeError("Value out of range");
  for (let i = len - 1;i >= 0; i--)
    bb.push(val >>> i & 1);
}
var NUMERIC_REGEX = /^[0-9]*$/;
var ALPHANUMERIC_REGEX = /^[A-Z0-9 $%*+.\/:-]*$/;
var ALPHANUMERIC_CHARSET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:";
var encoder = new TextEncoder;

class QRSegment {
  constructor({ mode, numChars, bitData, text }) {
    this.mode = mode;
    this.numChars = numChars;
    this.bitData = bitData;
    this.text = text;
  }
  getData() {
    return this.bitData.slice();
  }
}
var modes = {
  numeric: {
    modeBits: 1,
    numCharCountBits: (v) => [10, 12, 14][Math.floor((v + 7) / 17)],
    test(x) {
      return NUMERIC_REGEX.test(x);
    },
    write(data) {
      let bb = [];
      for (let i = 0;i < data.length; ) {
        const n = Math.min(data.length - i, 3);
        appendBits(parseInt(data.substr(i, n), 10), n * 3 + 1, bb);
        i += n;
      }
      return new QRSegment({
        mode: "numeric",
        numChars: data.length,
        bitData: bb,
        text: data
      });
    },
    charCost: 3.33
  },
  alpha: {
    modeBits: 2,
    numCharCountBits: (v) => [9, 11, 13][Math.floor((v + 7) / 17)],
    test(x) {
      return ALPHANUMERIC_REGEX.test(x);
    },
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
      return new QRSegment({
        mode: "alpha",
        numChars: data.length,
        bitData: bb,
        text: data
      });
    }
  },
  byte: {
    modeBits: 4,
    numCharCountBits: (v) => [8, 16, 16][Math.floor((v + 7) / 17)],
    write(str) {
      let data = encoder.encode(str);
      let bb = [];
      for (const b of data) {
        appendBits(b, 8, bb);
      }
      return new QRSegment({
        mode: "byte",
        numChars: data.length,
        bitData: bb,
        text: str
      });
    }
  }
};

// src/utils/reed-solomon.js
function reedSolomonComputeDivisor(degree) {
  if (degree < 1 || degree > 255)
    throw new RangeError("Degree out of range");
  let result = [];
  for (let i = 0;i < degree - 1; i++)
    result.push(0);
  result.push(1);
  let root = 1;
  for (let i = 0;i < degree; i++) {
    for (let j = 0;j < result.length; j++) {
      result[j] = reedSolomonMultiply(result[j], root);
      if (j + 1 < result.length)
        result[j] ^= result[j + 1];
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
  if (x >>> 8 != 0 || y >>> 8 != 0)
    throw new RangeError("Byte out of range");
  let z = 0;
  for (let i = 7;i >= 0; i--) {
    z = z << 1 ^ (z >>> 7) * 285;
    z ^= (y >>> i & 1) * x;
  }
  return z;
}

// src/segments.js
function findVersion(str, {
  minVersion = 1,
  maxVersion = 40,
  minEcl = "low"
} = {}) {
  let version = minVersion;
  let ecl = minEcl;
  let dataUsedBits;
  let segs;
  for (;version <= maxVersion; version++) {
    const dataCapacityBits = getNumDataCodewords(version, ecl) * 8;
    if (version == minVersion || version == 10 || version == 27) {
      segs = optimalSegs(str, version);
    }
    const usedBits = segs.size;
    if (usedBits <= dataCapacityBits) {
      dataUsedBits = usedBits;
      break;
    }
  }
  if (!dataUsedBits) {
    throw Error("Data too long");
  }
  let ecls3 = ["low", "medium", "quartile", "high"];
  let higher_ecls = ecls3.slice(ecls3.indexOf(minEcl) + 1);
  for (const new_ecl of higher_ecls) {
    if (dataUsedBits <= getNumDataCodewords(version, new_ecl) * 8) {
      ecl = new_ecl;
    } else
      break;
  }
  return { version, ecl, bitstring: construct_bitstring(str, segs.steps, version, ecl) };
}
function optimalSegs(str, v = 1) {
  const headCosts = {
    byte: (4 + modes.byte.numCharCountBits(v)) * 6,
    alpha: (4 + modes.alpha.numCharCountBits(v)) * 6,
    numeric: (4 + modes.numeric.numCharCountBits(v)) * 6
  };
  let possibilities = [];
  let charCosts = Array.from(str).map((char, i) => {
    let cost = {
      byte: countUtf8Bytes(str.codePointAt(i)) * 8 * 6
    };
    if (modes.alpha.test(char)) {
      cost.alpha = 33;
    }
    if (modes.numeric.test(char)) {
      cost.numeric = 20;
    }
    return cost;
  });
  Object.keys(charCosts[0]).forEach((mode_type) => {
    possibilities.push({
      size: headCosts[mode_type] + charCosts[0][mode_type],
      steps: [mode_type]
    });
  });
  for (let i = 1;i < charCosts.length; i++) {
    let costs = charCosts[i];
    let new_possibilities = [];
    let min_size = Infinity;
    for (let p = 0;p < possibilities.length; p++) {
      let pos = possibilities[p];
      Object.keys(costs).forEach((mode_type) => {
        let new_steps = mode_type == "byte" ? Array(costs[mode_type] / 48).fill(mode_type) : [mode_type];
        let new_size = pos.steps[pos.steps.length - 1] == mode_type ? costs[mode_type] + pos.size : headCosts[mode_type] + Math.floor((pos.size + 5) / 6) * 6 + costs[mode_type];
        min_size = Math.min(min_size, new_size);
        new_possibilities.push({
          size: new_size,
          steps: [...pos.steps, ...new_steps]
        });
      });
    }
    possibilities = new_possibilities.filter((x) => x.size <= min_size + [14, 20, 20][Math.floor((v + 7) / 17)] * 6);
  }
  possibilities.sort((a, b) => a.size - b.size);
  possibilities = possibilities.map((x) => ({ steps: x.steps, size: Math.ceil(x.size / 6) }));
  return possibilities[0];
}
var construct_bitstring = function(str, steps, version, ecl) {
  let segs = splitIntoSegments(str, steps);
  let bb = [];
  for (const seg of segs) {
    appendBits(modes[seg.mode].modeBits, 4, bb);
    appendBits(seg.numChars, modes[seg.mode].numCharCountBits(version), bb);
    for (const b of seg.getData())
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
  const numBlocks = ecls[ecl].num_ecc_blocks[version];
  const blockEccLen = ecls[ecl].codewords_per_block[version];
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
  return result.map((n) => n.toString(2).padStart(8, "0")).join("");
  return result;
};
var countUtf8Bytes = function(cp = 128) {
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
};
var getNumRawDataModules = function(ver) {
  let result = (16 * ver + 128) * ver + 64;
  if (ver >= 2) {
    const numAlign = Math.floor(ver / 7) + 2;
    result -= (25 * numAlign - 10) * numAlign - 55;
    result -= ver >= 7 ? 36 : 0;
  }
  return result;
};
var getNumDataCodewords = function(ver, ecl) {
  return Math.floor(getNumRawDataModules(ver) / 8) - ecls[ecl].codewords_per_block[ver] * ecls[ecl].num_ecc_blocks[ver];
};
function splitIntoSegments(str = "", steps = []) {
  let segments = [];
  let curMode = steps[0];
  let start = 0;
  for (let i = 1;i <= str.length; i++) {
    if (i >= str.length || steps[i] != curMode) {
      let s = str.slice(start, i);
      segments.push(modes[curMode].write(s));
      curMode = steps[i];
      start = i;
    }
  }
  return segments;
}

// src/PixelGrid.js
class PixelGrid {
  constructor(w, h) {
    this.arr = new Uint8Array(w * h);
    this.used = new Uint8Array(w * h);
    this.w = w;
    this.h = h;
  }
  setPixel(x = 0, y = 0, v = 1) {
    let { w, h } = this;
    if (x < 0 || x >= w || y < 0 || y >= h)
      return;
    this.arr[y * w + x] = v & 1;
    this.used[y * w + x] = 1;
  }
  getPixel(x = 0, y = 0) {
    let { w, h } = this;
    if (x < 0 || x >= w || y < 0 || y >= h)
      return 0;
    return this.arr[y * w + x];
  }
  usedPixel(x = 0, y = 0) {
    let { w, h } = this;
    if (x < 0 || x >= w || y < 0 || y >= h)
      return 0;
    return this.used[y * w + x];
  }
  static combine(...grids) {
    let max_w = Math.max(...grids.map((g) => g.w));
    let max_h = Math.max(...grids.map((g) => g.h));
    let grid = new PixelGrid(max_w, max_h);
    for (let i = 0;i < max_w; i++) {
      for (let j = 0;j < max_h; j++) {
        if (grids.some((g) => g.usedPixel(i, j))) {
          grid.setPixel(i, j, grids.some((g) => g.getPixel(i, j)));
        }
      }
    }
    return grid;
  }
}

// src/QRCode.js
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

class QRCode {
  constructor({
    version = 2,
    ecl = 0,
    mask = 0,
    bitstring = "",
    data
  } = {}) {
    this.version = version;
    this.ecl = ecl;
    this.mask = mask;
    this.bitstring = bitstring;
    this.data = data;
  }
  get size() {
    return this.version * 4 + 17;
  }
  get functional_grid() {
    let { finder_grid, timing_grid, alignment_grid, version_grid, format_grid } = this;
    return PixelGrid.combine(finder_grid, timing_grid, alignment_grid, version_grid, format_grid);
  }
  get finder_grid() {
    let { size } = this;
    let grid = new PixelGrid(size, size);
    for (let r = 0;r < 8; r++) {
      for (let c = 0;c < 8; c++) {
        let is_on = Math.max(Math.abs(3 - r), Math.abs(3 - c)) != 2 && !(r == 7 || c == 7);
        grid.setPixel(r, c, is_on);
        grid.setPixel(size - r - 1, c, is_on);
        grid.setPixel(r, size - c - 1, is_on);
      }
    }
    return grid;
  }
  get timing_grid() {
    let { size } = this;
    let grid = new PixelGrid(size, size);
    for (let i = 8;i <= size - 8; i++) {
      let is_on = i % 2 == 0;
      grid.setPixel(6, i, is_on);
      grid.setPixel(i, 6, is_on);
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
    let grid = new PixelGrid(size, size);
    const numAlign = alignment_positions.length;
    for (let i = 0;i < numAlign; i++) {
      for (let j = 0;j < numAlign; j++) {
        if (!(i == 0 && j == 0 || i == 0 && j == numAlign - 1 || i == numAlign - 1 && j == 0)) {
          for (let dy = -2;dy <= 2; dy++) {
            for (let dx = -2;dx <= 2; dx++) {
              let is_on = Math.max(Math.abs(dx), Math.abs(dy)) == 1 ? 0 : 1;
              grid.setPixel(alignment_positions[i] + dx, alignment_positions[j] + dy, is_on);
            }
          }
        }
      }
    }
    return grid;
  }
  get format_grid() {
    let { ecl, mask, size } = this;
    let grid = new PixelGrid(size, size);
    const data = ecls[ecl].formatBits << 3 | mask;
    let rem = data;
    for (let i = 0;i < 10; i++) {
      rem = rem << 1 ^ (rem >>> 9) * 1335;
    }
    const bits = (data << 10 | rem) ^ 21522;
    for (let i = 0;i <= 5; i++)
      grid.setPixel(8, i, bits >> i);
    grid.setPixel(8, 7, bits >> 6);
    grid.setPixel(8, 8, bits >> 7);
    grid.setPixel(7, 8, bits >> 8);
    for (let i = 9;i < 15; i++)
      grid.setPixel(14 - i, 8, bits >> i);
    for (let i = 0;i < 8; i++)
      grid.setPixel(this.size - 1 - i, 8, bits >> i);
    for (let i = 8;i < 15; i++)
      grid.setPixel(8, this.size - 15 + i, bits >> i);
    grid.setPixel(8, this.size - 8, 1);
    return grid;
  }
  get version_grid() {
    let { version, size } = this;
    const grid = new PixelGrid(size, size);
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
      grid.setPixel(a, b, bits >> i);
      grid.setPixel(b, a, bits >> i);
    }
    return grid;
  }
  get data_grid() {
    let { size, functional_grid, bitstring, mask } = this;
    const grid = new PixelGrid(size, size);
    let i = 0;
    for (let right = size - 1;right >= 1; right -= 2) {
      if (right == 6) {
        right = 5;
      }
      for (let vert = 0;vert < size; vert++) {
        for (let j = 0;j < 2; j++) {
          const x = right - j;
          const upward = (right + 1 & 2) == 0;
          const y = upward ? size - 1 - vert : vert;
          const isFunctional = functional_grid.usedPixel(x, y);
          if (!isFunctional && i < bitstring.length) {
            let dat = parseInt(bitstring[i]);
            dat ^= MASK_SHAPES[mask](x, y);
            grid.setPixel(x, y, dat);
            i++;
          }
        }
      }
    }
    return grid;
  }
  get grid() {
    let { functional_grid, data_grid } = this;
    return PixelGrid.combine(functional_grid, data_grid);
  }
}

// src/permute.js
function permuteWIFI(name = "", pwd = "") {
  let parts = [
    `T:WPA`,
    `S:${name}`,
    `P:${pwd}`
  ];
  return [
    [0, 1, 2],
    [0, 2, 1],
    [1, 0, 2],
    [1, 2, 0],
    [2, 1, 0],
    [2, 0, 1]
  ].map((part_order) => `WIFI:${part_order.map((i) => parts[i]).join(";")};;`);
}
function permuteURL(str = `m4r.sh/tetris`, {
  protocols = ["http", "https"],
  protocol_caps = true,
  domain_caps = true,
  path_caps = false
} = {}) {
  if (!str.toLowerCase().startsWith("http")) {
    str = `http://` + str;
  }
  let url = new URL(str);
  let { hostname, pathname, search, hash } = url;
  let protocol_arr = permuteProtocols({ protocols, protocol_caps });
  let domain_arr = permuteDomain({ domain: hostname, domain_caps });
  let path_arr = permutePath({ path: pathname, path_caps });
  let options = [];
  protocol_arr.forEach((protocol_str) => {
    domain_arr.forEach((domain_str) => {
      path_arr.forEach((path_str) => {
        options.push(`${protocol_str}://${domain_str}${path_str}${search}${hash}`);
      });
    });
  });
  return options;
}
var permuteProtocols = function({
  protocols = ["HTTP", "HTTPS"],
  protocol_caps = true
} = {}) {
  let options = [];
  protocols.forEach((protocol) => {
    options.push(...protocol_caps ? casePermutation(protocol) : [protocol]);
  });
  return options;
};
var permuteDomain = function({
  domain = "M4R.SH",
  domain_caps = true
} = {}) {
  return domain_caps ? casePermutation(domain) : [domain];
};
var permutePath = function({
  path = "/qr/tetris",
  path_caps = false
} = {}) {
  return path_caps ? casePermutation(path) : [path];
};
var casePermutation = function(str = "tEsT") {
  let sp = str.toLowerCase().split("");
  let perms = {};
  for (var i = 0, l = 1 << str.length;i < l; i++) {
    for (var j = i, k = 0;j; j >>= 1, k++) {
      sp[k] = j & 1 ? sp[k].toUpperCase() : sp[k].toLowerCase();
    }
    perms[sp.join("")] = true;
  }
  return Object.keys(perms);
};

// src/index.js
var createQR = function(data = "", {
  minVersion = 1,
  maxVersion = 40,
  minEcl = "low",
  mask = 0
} = {}) {
  let { version, ecl, bitstring } = findVersion(data, { minVersion, minEcl, maxVersion });
  return new QRCode({
    data,
    version,
    ecl,
    mask,
    bitstring
  });
};
export {
  permuteWIFI,
  permuteURL,
  findVersion,
  createQR,
  QRCode,
  PixelGrid
};
