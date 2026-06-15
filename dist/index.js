// src/utils/ecls.js
var ECLS = [
  {
    formatBits: 1,
    codewords_per_block: new Uint8Array([-1, 7, 10, 15, 20, 26, 18, 20, 24, 30, 18, 20, 24, 26, 30, 22, 24, 28, 30, 28, 28, 28, 28, 30, 30, 26, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30]),
    num_ecc_blocks: new Uint8Array([-1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 4, 4, 4, 4, 4, 6, 6, 6, 6, 7, 8, 8, 9, 9, 10, 12, 12, 12, 13, 14, 15, 16, 17, 18, 19, 19, 20, 21, 22, 24, 25])
  },
  {
    formatBits: 0,
    codewords_per_block: new Uint8Array([-1, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26, 30, 22, 22, 24, 24, 28, 28, 26, 26, 26, 26, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28]),
    num_ecc_blocks: new Uint8Array([-1, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5, 5, 8, 9, 9, 10, 10, 11, 13, 14, 16, 17, 17, 18, 20, 21, 23, 25, 26, 28, 29, 31, 33, 35, 37, 38, 40, 43, 45, 47, 49])
  },
  {
    formatBits: 3,
    codewords_per_block: new Uint8Array([-1, 13, 22, 18, 26, 18, 24, 18, 22, 20, 24, 28, 26, 24, 20, 30, 24, 28, 28, 26, 30, 28, 30, 30, 30, 30, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30]),
    num_ecc_blocks: new Uint8Array([-1, 1, 1, 2, 2, 4, 4, 6, 6, 8, 8, 8, 10, 12, 16, 12, 17, 16, 18, 21, 20, 23, 23, 25, 27, 29, 34, 34, 35, 38, 40, 43, 45, 48, 51, 53, 56, 59, 62, 65, 68])
  },
  {
    formatBits: 2,
    codewords_per_block: new Uint8Array([-1, 17, 28, 22, 16, 22, 28, 26, 26, 24, 28, 24, 28, 22, 24, 24, 30, 28, 28, 26, 28, 30, 24, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30]),
    num_ecc_blocks: new Uint8Array([-1, 1, 1, 2, 4, 4, 4, 5, 6, 8, 8, 11, 11, 16, 16, 18, 16, 19, 21, 25, 25, 25, 34, 30, 32, 35, 37, 40, 42, 45, 48, 51, 54, 57, 60, 63, 66, 70, 74, 77, 81])
  }
];

// src/utils/modes.js
var NUMERIC_REGEX = /^[0-9]*$/;
var ALPHANUMERIC_REGEX = /^[A-Z0-9 $%*+.\/:-]*$/;
var ALPHANUMERIC_CHARSET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:";
var encoder = new TextEncoder;
var supportsKanji = testSupportsKanji();
var SHIFT_JIS_MAPPING = getMappingFromEncodingRanges("shift_jis", [33088, 33150], [33152, 33196], [33208, 33215], [33224, 33230], [33242, 33256], [33264, 33271], [33276, 33276], [33359, 33368], [33376, 33401], [33409, 33434], [33439, 33521], [33600, 33662], [33664, 33686], [33695, 33718], [33727, 33750], [33856, 33888], [33904, 33918], [33920, 33937], [33951, 33982], [34975, 35068], ...getSerialEncodingRanges(35136, 38908, [0, 62, 64, 188]), [38976, 39026], [39071, 39164], ...getSerialEncodingRanges(39232, 40956, [0, 62, 64, 188]), ...getSerialEncodingRanges(57408, 59900, [0, 62, 64, 188]), [59968, 60030], [60032, 60068]);
var CHAR_INDEX_ARRAY = new Uint8Array(128);
for (let i = 0;i < ALPHANUMERIC_CHARSET.length; i++) {
  CHAR_INDEX_ARRAY[ALPHANUMERIC_CHARSET.charCodeAt(i)] = i;
}
var MODES = [
  {
    modeBits: 1,
    name: "numeric",
    charCost: (c) => NUMERIC_REGEX.test(c) ? 10 / 3 : Infinity,
    numCharCountBits: (v) => [10, 12, 14][Math.floor((v + 7) / 17)],
    groupSize: 3,
    getMarginal: (c, phase = 0) => NUMERIC_REGEX.test(c) ? [4, 3, 3][phase % 3] : Infinity,
    write(data, bb, bitPosRef) {
      for (let i = 0;i < data.length; ) {
        const n = Math.min(data.length - i, 3);
        appendBits(parseInt(data.substr(i, n), 10), n * 3 + 1, bb, bitPosRef);
        i += n;
      }
    }
  },
  {
    modeBits: 2,
    name: "alpha",
    charCost: (c) => ALPHANUMERIC_REGEX.test(c) ? 5.5 : Infinity,
    numCharCountBits: (v) => [9, 11, 13][Math.floor((v + 7) / 17)],
    groupSize: 2,
    getMarginal: (c, phase = 0) => ALPHANUMERIC_REGEX.test(c) ? [6, 5][phase % 2] : Infinity,
    write(data, bb, bitPosRef) {
      let i;
      for (i = 0;i + 2 <= data.length; i += 2) {
        let temp = CHAR_INDEX_ARRAY[data.charCodeAt(i)] * 45;
        temp += CHAR_INDEX_ARRAY[data.charCodeAt(i + 1)];
        appendBits(temp, 11, bb, bitPosRef);
      }
      if (i < data.length) {
        appendBits(CHAR_INDEX_ARRAY[data.charCodeAt(i)], 6, bb, bitPosRef);
      }
    }
  },
  {
    modeBits: 4,
    name: "byte",
    charCost: (c) => countUtf8Bytes(c) * 8,
    groupSize: 1,
    numCharCountBits: (v) => [8, 16, 16][Math.floor((v + 7) / 17)],
    getMarginal: (c, phase = 0) => {
      return countUtf8Bytes(c) * 8;
    },
    write(str, bb, bitPosRef) {
      let data = encoder.encode(str);
      for (const b of data) {
        appendBits(b, 8, bb, bitPosRef);
      }
    }
  },
  {
    modeBits: 8,
    name: "kanji",
    numCharCountBits: (v) => [8, 10, 12][Math.floor((v + 7) / 17)],
    charCost: (c) => supportsKanji ? SHIFT_JIS_MAPPING.get(c) ? 13 : Infinity : Infinity,
    groupSize: 1,
    getMarginal: (c, _) => supportsKanji ? SHIFT_JIS_MAPPING.get(c) ? 13 : Infinity : Infinity,
    write(str, bb, bitPosRef) {
      for (let i = 0;i < str.length; i++) {
        let code = SHIFT_JIS_MAPPING.get(str.at(i));
        if (code) {
          if (code >= 33088 && code <= 40956) {
            code -= 33088;
          } else if (code >= 57408 && code <= 60351) {
            code -= 49472;
          } else {
            throw new Error(`illegal kanji character: ${str.at(i)}`);
          }
          code = (code >> 8) * 192 + (code & 255);
          appendBits(code, 13, bb, bitPosRef);
        }
      }
    }
  }
];
function appendBits(val, len, bb, bitPosRef) {
  if (len <= 0)
    return;
  if (len > 31) {
    appendBits(val >>> len - 31, 31, bb, bitPosRef);
    appendBits(val & (1 << len - 31) - 1, len - 31, bb, bitPosRef);
    return;
  }
  if (val >>> len !== 0) {
    throw new RangeError("Value out of range");
  }
  let pos = bitPosRef.pos;
  while (len > 0) {
    const bitsToWrite = Math.min(len, 8 - (pos & 7));
    const shift = len - bitsToWrite;
    const mask = (1 << bitsToWrite) - 1;
    const bits = val >>> shift & mask;
    bb[pos >>> 3] |= bits << 7 - (pos & 7) - bitsToWrite + 1;
    pos += bitsToWrite;
    len -= bitsToWrite;
  }
  bitPosRef.pos = pos;
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
function getMappingFromEncodingRanges(label, ...ranges) {
  const bytes = [];
  const codes = [];
  const mapping = new Map;
  const decoder = new TextDecoder(label, { fatal: true });
  for (const [start, end] of ranges) {
    for (let code = start;code <= end; code++) {
      bytes.push(code >> 8 & 255, code & 255);
      codes.push(code);
    }
  }
  const characters = decoder.decode(new Uint8Array(bytes));
  for (let i = 0;i < codes.length; i++) {
    const character = characters.at(i) || "";
    if (character && !mapping.has(character)) {
      mapping.set(character, codes[i]);
    }
  }
  return mapping;
}
function getSerialEncodingRanges(start, end, offsets, delta = 256) {
  const count = offsets.length - 1;
  const ranges = [];
  for (let i = start;i < end; i += delta) {
    for (let j = 0;j < count; j += 2) {
      ranges.push([i + offsets[j], i + offsets[j + 1]]);
    }
  }
  return ranges;
}
function testSupportsKanji() {
  try {
    const dec = new TextDecoder("shift_jis", { fatal: true });
    return dec.decode(Uint8Array.from([147, 199, 142, 230])) === "読取";
  } catch {
    return false;
  }
}

// src/utils/versions.js
function getNumRawDataModules(version) {
  let result = (16 * version + 128) * version + 64;
  if (version >= 2) {
    const numAlign = Math.floor(version / 7) + 2;
    result -= (25 * numAlign - 10) * numAlign - 55;
    result -= version >= 7 ? 36 : 0;
  }
  return result;
}
function getNumDataCodewords(version, ecl) {
  return (getNumRawDataModules(version) >> 3) - ECLS[ecl].codewords_per_block[version] * ECLS[ecl].num_ecc_blocks[version];
}

// src/encode/strategize.js
function findMinimumVersion(str, minVersion = 1, maxVersion = 40, minEcl = 0, minSurplus = 0) {
  let version = minVersion;
  let strat;
  for (;version <= maxVersion; version++) {
    if (version == minVersion || version == 10 || version == 27) {
      strat = minStrategy(str, version);
    }
    const dataCapacityBits = getNumDataCodewords(version, minEcl) * 8;
    if (strat.cost <= dataCapacityBits - minSurplus)
      break;
  }
  if (!strat || (strat.cost > getNumDataCodewords(version, minEcl) * 8 - minSurplus || version > maxVersion)) {
    throw new Error("Data too long");
  }
  return [strat, version];
}
function* allStrategies(str, version, ecl) {
  const chars = Array.from(str);
  const n = chars.length;
  const dataCapacityBits = getNumDataCodewords(version, ecl) * 8;
  const minCharCosts = new Array(n);
  for (let i = 0;i < n; i++) {
    let minC = Infinity;
    const c = chars[i];
    for (const mode of [0, 1, 2]) {
      const cost = MODES[mode].charCost(c);
      if (cost < minC)
        minC = cost;
    }
    minCharCosts[i] = minC === Infinity ? 0 : minC;
  }
  const cumMinRemaining = new Array(n + 1).fill(0);
  for (let i = n - 1;i >= 0; i--) {
    cumMinRemaining[i] = cumMinRemaining[i + 1] + minCharCosts[i];
  }
  const stack = [{ index: 0, strategy: new StrategyNode }];
  while (stack.length) {
    const { index, strategy } = stack.pop();
    if (index === n) {
      strategy.cost = Math.ceil(strategy.cost);
      yield strategy.getStrategy();
      continue;
    }
    const estimatedRemainingCost = cumMinRemaining[index + 1];
    const c = chars[index];
    for (const mode of [2, 1, 0]) {
      const charCost = MODES[mode].charCost(c);
      if (charCost === Infinity)
        continue;
      if (MODES[mode].name === strategy.mode) {
        const newCost2 = strategy.cost + charCost;
        if (newCost2 <= dataCapacityBits - estimatedRemainingCost) {
          stack.push({
            index: index + 1,
            strategy: strategy.extendMode(newCost2)
          });
        }
      }
      const headerBits = 4 + MODES[mode].numCharCountBits(version);
      const newCost = Math.ceil(strategy.cost) + headerBits + charCost;
      if (newCost <= dataCapacityBits - estimatedRemainingCost) {
        stack.push({
          index: index + 1,
          strategy: strategy.switchMode(MODES[mode].name, newCost)
        });
      }
    }
  }
}
var modeNames = ["byte", "numeric", "alpha", "kanji"];
var MAX_GROUP_SIZE = 3;
var NUM_MODES = 12;
var NUM_STATES = NUM_MODES * MAX_GROUP_SIZE;
var localmodes = {
  numeric: MODES[0],
  alpha: MODES[1],
  byte: MODES[2],
  kanji: MODES[3]
};
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
function naiveStrategy(str, version = 1, single_mode = null) {
  const chars = Array.from(str);
  const n = chars.length;
  let cost = 0;
  if (single_mode) {
    let curmode = localmodes[single_mode];
    if (!curmode)
      throw new Error(`Unknown mode: ${single_mode}`);
    const headerBits = 4 + curmode.numCharCountBits(version);
    cost += headerBits;
    for (let i = 0;i < n; i++) {
      let c = chars[i];
      let added = curmode.getMarginal(c, i);
      if (added == Infinity)
        throw new Error(`Character cannot be encoded in ${single_mode} mode`);
      cost += added;
    }
    return new Strategy(cost, [[single_mode, n]]);
  }
  let mode = "byte";
  if (n > 0) {
    if (chars.every((c) => localmodes.numeric.getMarginal(c, 0) !== Infinity)) {
      mode = "numeric";
    } else if (chars.every((c) => localmodes.alpha.getMarginal(c, 0) !== Infinity)) {
      mode = "alpha";
    }
  }
  return naiveStrategy(str, version, mode);
}
function minStrategy(str, version = 1) {
  const chars = Array.from(str);
  const n = chars.length;
  let prevStates = new Array(NUM_STATES).fill(null);
  let minCostPrevStrategy = new StrategyNode;
  prevStates[modeToIdx["none"] * MAX_GROUP_SIZE] = minCostPrevStrategy;
  for (let i = 1;i <= n; i++) {
    const c = chars[i - 1];
    const currStates = new Array(NUM_STATES).fill(null);
    for (let s = 0;s < NUM_STATES; s++) {
      const prev = prevStates[s];
      if (!prev)
        continue;
      const prevModeIdx = Math.floor(s / MAX_GROUP_SIZE);
      const prevMode = idxToMode[prevModeIdx];
      if (prevMode === "none")
        continue;
      const curmode = localmodes[prevMode];
      const prevPhase = s % MAX_GROUP_SIZE;
      const addedBits = curmode.getMarginal(c, prevPhase);
      if (addedBits !== Infinity) {
        const newPhase = (prevPhase + 1) % curmode.groupSize;
        const newState = modeToIdx[prevMode] * MAX_GROUP_SIZE + newPhase;
        const newCost = prev.cost + addedBits;
        const existing = currStates[newState];
        if (!existing || newCost < existing.cost) {
          currStates[newState] = prev.extendMode(newCost);
        }
      }
    }
    if (minCostPrevStrategy) {
      for (const mode of modeNames) {
        const curmode = localmodes[mode];
        const initialBits = curmode.getMarginal(c, 0);
        if (initialBits === Infinity)
          continue;
        const headerBits = 4 + curmode.numCharCountBits(version);
        const newCost = minCostPrevStrategy.cost + headerBits + initialBits;
        const newPhase = 1 % curmode.groupSize;
        const newState = modeToIdx[mode] * MAX_GROUP_SIZE + newPhase;
        const existing = currStates[newState];
        if (!existing || newCost < existing.cost) {
          currStates[newState] = minCostPrevStrategy.switchMode(mode, newCost);
        }
      }
    }
    let best = null;
    let minCost = Infinity;
    for (const state of currStates) {
      if (state && state.cost < minCost) {
        minCost = state.cost;
        best = state;
      }
    }
    minCostPrevStrategy = best;
    prevStates = currStates;
  }
  return minCostPrevStrategy.getStrategy(true);
}

class StrategyNode {
  constructor(prev = null, mode = "", cost = 0, is_new = true) {
    this.prev = prev;
    this.mode = mode;
    this.cost = cost;
    this.is_new = is_new;
  }
  extendMode(newCost) {
    return new StrategyNode(this, this.mode, newCost, false);
  }
  switchMode(newMode, newCost) {
    return new StrategyNode(this, newMode, newCost, true);
  }
  getStrategy(clear = false) {
    const perChar = [];
    let cur = this;
    while (cur.prev) {
      perChar.push([cur.mode, cur.is_new]);
      cur = cur.prev;
    }
    const steps = [];
    let curStep = null;
    for (let i = perChar.length - 1;i >= 0; i--) {
      const [mode, isNew] = perChar[i];
      if (isNew) {
        if (curStep) {
          steps.push(curStep);
        }
        curStep = [mode, 1];
      } else {
        curStep[1] = curStep[1] + 1;
      }
    }
    if (curStep) {
      steps.push(curStep);
    }
    if (clear) {
      this.prev = null;
    }
    return new Strategy(this.cost, steps);
  }
}

class Strategy {
  constructor(cost = 0, steps = []) {
    this.cost = cost;
    this.steps = steps;
  }
}
// src/utils/reed-solomon.js
var multiplyTable = Array(256).fill().map(() => Array(256).fill(-1));
var divisorCache = Array(256).fill(null);
function reedSolomonComputeDivisor(degree) {
  if (degree < 1 || degree > 255) {
    throw new RangeError("Degree out of range");
  }
  if (divisorCache[degree] !== null) {
    return divisorCache[degree].slice();
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
  divisorCache[degree] = result.slice();
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
  if (x >>> 8 !== 0 || y >>> 8 !== 0) {
    throw new RangeError("Byte out of range");
  }
  if (multiplyTable[x][y] !== -1) {
    return multiplyTable[x][y];
  }
  let z = 0;
  for (let i = 7;i >= 0; i--) {
    z = z << 1 ^ (z >>> 7) * 285;
    z ^= (y >>> i & 1) * x;
  }
  multiplyTable[x][y] = z;
  multiplyTable[y][x] = z;
  return z;
}

// src/encode/encoding.js
function parseVersion(version) {
  if (Array.isArray(version)) {
    let [minv = 1, maxv = 40] = version;
    return [minv, maxv];
  } else if (Number.isInteger(version)) {
    return [version, version];
  }
  return [2, 40];
}
function parseEcl(ecl) {
  if (Array.isArray(ecl)) {
    let [mine = 0, maxe = 3] = ecl;
    return [mine, maxe];
  } else if (Number.isInteger(ecl) && ecl >= 0 && ecl <= 3) {
    return [ecl, ecl];
  }
  return [0, 3];
}
function optimalStrategy(str, encodingOptions = {}) {
  let [minVersion, maxVersion] = parseVersion(encodingOptions.version);
  let [minEcl, maxEcl] = parseEcl(encodingOptions.ecl);
  let surplus = encodingOptions.surplus ?? 0;
  let [strategy, version] = findMinimumVersion(str, minVersion, maxVersion, minEcl, surplus);
  let ecl = minEcl;
  for (let i = ecl + 1;i <= maxEcl; i++) {
    if (strategy.cost <= getNumDataCodewords(version, i) * 8 - surplus) {
      ecl = i;
    } else
      break;
  }
  return { strategy, version, ecl };
}
var localmodes2 = {
  numeric: MODES[0],
  alpha: MODES[1],
  byte: MODES[2],
  kanji: MODES[3]
};
var encoder2 = new TextEncoder;

class CodewordSequence extends Uint8Array {
  constructor(str, strategy, version, ecl) {
    const chars = Array.from(str);
    const dataCapacityBits = getNumDataCodewords(version, ecl) * 8;
    const bufferSize = dataCapacityBits + 7 >> 3;
    const rawCodewords = getNumRawDataModules(version) >> 3;
    super(rawCodewords);
    const bb = new Uint8Array(bufferSize);
    const bitPosRef = { pos: 0 };
    let pos = 0;
    for (const [mode, len] of strategy.steps) {
      let curstr = chars.slice(pos, pos + len).join("");
      appendBits(localmodes2[mode].modeBits, 4, bb, bitPosRef);
      const count = mode === "byte" ? encoder2.encode(curstr).length : len;
      appendBits(count, localmodes2[mode].numCharCountBits(version), bb, bitPosRef);
      localmodes2[mode].write(curstr, bb, bitPosRef);
      pos += len;
    }
    appendBits(0, Math.min(4, dataCapacityBits - bitPosRef.pos), bb, bitPosRef);
    appendBits(0, (8 - bitPosRef.pos % 8) % 8, bb, bitPosRef);
    for (let padByte = 236;bitPosRef.pos < dataCapacityBits; padByte ^= 236 ^ 17) {
      appendBits(padByte, 8, bb, bitPosRef);
    }
    const numBlocks = ECLS[ecl].num_ecc_blocks[version];
    const blockEccLen = ECLS[ecl].codewords_per_block[version];
    const numShortBlocks = numBlocks - rawCodewords % numBlocks;
    const shortBlockLen = Math.floor(rawCodewords / numBlocks);
    const blocks = [];
    const rsDiv = reedSolomonComputeDivisor(blockEccLen);
    let k = 0;
    for (let i = 0;i < numBlocks; i++) {
      const blockDataLen = shortBlockLen - blockEccLen + (i < numShortBlocks ? 0 : 1);
      const dat = bb.slice(k >>> 3, k + blockDataLen * 8 >>> 3);
      k += blockDataLen * 8;
      const ecc = reedSolomonComputeRemainder(dat, rsDiv);
      const block = new Uint8Array(blockDataLen + ecc.length + (i < numShortBlocks ? 1 : 0));
      block.set(dat, 0);
      if (i < numShortBlocks) {
        block[blockDataLen] = 0;
      }
      block.set(ecc, blockDataLen + (i < numShortBlocks ? 1 : 0));
      blocks.push(block);
    }
    let idx = 0;
    for (let i = 0;i < blocks[0].length; i++) {
      blocks.forEach((block, j) => {
        if (i !== shortBlockLen - blockEccLen || j >= numShortBlocks) {
          this[idx++] = block[i];
        }
      });
    }
  }
  static get [Symbol.species]() {
    return Uint8Array;
  }
}
// src/grid/Grid.js
class Grid {
  constructor(w, h, valueBits = null, usedBits = null) {
    this.w = w;
    this.h = h ? h : w;
    const totalTiles = this.w * this.h;
    const wordCount = totalTiles + 31 >> 5;
    if (valueBits === null) {
      this.valueBits = new Uint32Array(wordCount);
    } else {
      if (!(valueBits instanceof Uint32Array) || valueBits.length !== wordCount) {
        throw new Error(`Provided valueBits must be a Uint32Array of correct length. Expected ${wordCount}, got ${valueBits.length}`);
      }
      this.valueBits = valueBits;
    }
    if (usedBits === null) {
      this.usedBits = new Uint32Array(wordCount);
    } else {
      if (!(usedBits instanceof Uint32Array) || usedBits.length !== wordCount) {
        throw new Error(`Provided usedBits must be a Uint32Array of correct length. Expected ${wordCount}, got ${usedBits.length}`);
      }
      this.usedBits = usedBits;
    }
  }
  #getBitPos(x, y) {
    const idx = y * this.w + x;
    return [idx >> 5, idx & 31];
  }
  clear() {
    this.valueBits.fill(0);
    this.usedBits.fill(0);
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
  *ons() {
    yield* this.tiles(true);
  }
  *offs() {
    yield* this.tiles(false);
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
          yield [idx % w, Math.floor(idx / w), isOn];
        }
      }
    }
  }
  clone() {
    return new Grid(this.w, this.h, this.valueBits.slice(), this.usedBits.slice());
  }
  crop(x, y, w, h) {
    const grid = new Grid(w, h);
    for (let i = 0;i < w; i++) {
      for (let j = 0;j < h; j++) {
        grid.set(i, j, this.get(i + x, j + y));
      }
    }
    return grid;
  }
  frame(x, y, w, h) {
    return this.crop(-x, -y, w, h);
  }
  union(...grids) {
    const wordCount = this.valueBits.length;
    for (const grid of grids) {
      for (let i = 0;i < wordCount; i++) {
        this.valueBits[i] |= grid.valueBits[i] & grid.usedBits[i];
        this.usedBits[i] |= grid.usedBits[i];
      }
    }
    return this;
  }
  erase(...gridsToErase) {
    const wordCount = this.valueBits.length;
    const mask_used = new Uint32Array(wordCount);
    for (const grid of gridsToErase) {
      for (let i = 0;i < wordCount; i++) {
        mask_used[i] |= grid.usedBits[i];
      }
    }
    for (let i = 0;i < wordCount; i++) {
      this.usedBits[i] &= ~mask_used[i];
      this.valueBits[i] &= this.usedBits[i];
    }
    return this;
  }
  intersect(...gridsToIntersect) {
    const wordCount = this.valueBits.length;
    const mask_used = new Uint32Array(wordCount).fill(4294967295 >>> 0);
    for (const grid of gridsToIntersect) {
      for (let i = 0;i < wordCount; i++) {
        mask_used[i] &= grid.usedBits[i];
      }
    }
    for (let i = 0;i < wordCount; i++) {
      this.usedBits[i] &= mask_used[i];
      this.valueBits[i] &= this.usedBits[i];
    }
    return this;
  }
  invert() {
    const wordCount = this.valueBits.length;
    for (let i = 0;i < wordCount; i++) {
      this.valueBits[i] = (~this.valueBits[i] & this.usedBits[i]) >>> 0;
    }
    return this;
  }
  xor(grid) {
    const wordCount = this.valueBits.length;
    for (let i = 0;i < wordCount; i++) {
      this.valueBits[i] ^= grid.valueBits[i];
      this.usedBits[i] |= grid.usedBits[i];
    }
    return this;
  }
  static union(og, ...rest) {
    return og.clone().union(...rest);
  }
  static erase(og, ...rest) {
    return og.clone().erase(...rest);
  }
  static intersect(og, ...rest) {
    return og.clone().intersect(...rest);
  }
  static invert(og) {
    return og.clone().invert();
  }
  static xor(og, other) {
    return og.clone().xor(other);
  }
}
// src/utils/qr-string.js
function encodeQRString(bytes) {
  return "QR-" + toUrlSafeBase64(bytes);
}
function decodeQRString(str) {
  const upper = str.toUpperCase();
  if (upper.startsWith("QR-")) {
    str = str.slice(3);
  } else if (upper.startsWith("QR")) {
    str = str.slice(2);
  }
  return fromUrlSafeBase64(str);
}
function toUrlSafeBase64(bytes) {
  let binary = "";
  for (let byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  let b64 = btoa(binary);
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}
function fromUrlSafeBase64(str) {
  let b64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (b64.length % 4)
    b64 += "=";
  const binary = atob(b64);
  return Uint8Array.from(binary, (c) => c.charCodeAt(0));
}
// src/utils/masks.js
var MASKS = [
  (x, y) => (x + y) % 2 == 0,
  (x, y) => y % 2 == 0,
  (x, y) => x % 3 == 0,
  (x, y) => (x + y) % 3 == 0,
  (x, y) => (Math.floor(x / 3) + Math.floor(y / 2)) % 2 == 0,
  (x, y) => x * y % 2 + x * y % 3 == 0,
  (x, y) => (x * y % 2 + x * y % 3) % 2 == 0,
  (x, y) => ((x + y) % 2 + x * y % 3) % 2 == 0
];
// src/utils/options.js
function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype;
}
function deepMerge(base, override = {}) {
  const out = { ...base };
  for (const [key, value] of Object.entries(override)) {
    if (isPlainObject(value) && isPlainObject(out[key])) {
      out[key] = deepMerge(out[key], value);
    } else if (value !== undefined) {
      out[key] = value;
    }
  }
  return out;
}
// src/utils/meta.js
var QRSART_VERSION = "0.13.0";
// src/grid/patterns.js
var staticFunctionalGridCache = new Array(41);
var dataPathCache = new Array(41);
var maskGridCache = new Map;
function getMaskGrid(version, mask) {
  const key = `${version}-${mask}`;
  if (!maskGridCache.has(key)) {
    const size = getSize(version);
    const grid = new Grid(size);
    const maskFn = MASKS[mask];
    const path = getDataPath(version);
    for (let i = 0;i < path.length; i += 2) {
      const x = path[i];
      const y = path[i + 1];
      grid.set(x, y, maskFn(x, y));
    }
    maskGridCache.set(key, grid);
  }
  return maskGridCache.get(key);
}
function getDataPath(version) {
  if (!dataPathCache[version]) {
    const reservedGrid = getFunctionalGrid(version);
    const size = getSize(version);
    const path = [];
    for (let right = size - 1;right >= 1; right -= 2) {
      if (right === 6)
        right = 5;
      for (let vert = 0;vert < size; vert++) {
        for (let j = 0;j < 2; j++) {
          const x = right - j;
          const upward = (right + 1 & 2) === 0;
          const y = upward ? size - 1 - vert : vert;
          if (!reservedGrid.used(x, y)) {
            path.push(x, y);
          }
        }
      }
    }
    dataPathCache[version] = path;
  }
  return dataPathCache[version];
}
function drawDataGrid(grid, codewords) {
  const version = getVersion(grid.w);
  const path = getDataPath(version);
  const totalDataBits = codewords.length * 8;
  for (let i = 0;i < path.length / 2; i++) {
    const x = path[i * 2];
    const y = path[i * 2 + 1];
    let bit = 0;
    if (i < totalDataBits) {
      const byteIndex = i >>> 3;
      const bitIndex = 7 - i % 8;
      bit = codewords[byteIndex] >> bitIndex & 1;
    }
    grid.set(x, y, bit);
  }
  return grid;
}
function drawFormatGrid(grid, ecl, mask) {
  const size = grid.w;
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
  return grid;
}
function getFunctionalGrid(version = 1, ecl = 0, mask = 0) {
  let static_fn_grid = getStaticFunctionalGrid(version).clone();
  drawFormatGrid(static_fn_grid, ecl, mask);
  return static_fn_grid;
}
function getStaticFunctionalGrid(version = 1) {
  if (!staticFunctionalGridCache[version]) {
    const grid = new Grid(getSize(version));
    drawFinderGrid(grid);
    drawTimingGrid(grid);
    drawAlignmentGrid(grid, version);
    drawVersionGrid(grid, version);
    staticFunctionalGridCache[version] = grid;
  }
  return staticFunctionalGridCache[version];
}
function drawFinderGrid(grid) {
  const size = grid.w;
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
function drawTimingGrid(grid) {
  for (let i = 8;i <= grid.w - 8; i++) {
    let is_on = i % 2 == 0;
    grid.set(6, i, is_on);
    grid.set(i, 6, is_on);
  }
  return grid;
}
function drawAlignmentGrid(grid, version) {
  let alignment_positions = getAlignmentPositions(version);
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
function drawVersionGrid(grid, version) {
  if (version < 7) {
    return grid;
  }
  let rem = version;
  for (let i = 0;i < 12; i++) {
    rem = rem << 1 ^ (rem >>> 11) * 7973;
  }
  const bits = version << 12 | rem;
  for (let i = 0;i < 18; i++) {
    const a = getSize(version) - 11 + i % 3;
    const b = Math.floor(i / 3);
    grid.set(a, b, bits >> i);
    grid.set(b, a, bits >> i);
  }
  return grid;
}
function getAlignmentPositions(version) {
  if (version == 1) {
    return [];
  }
  const numAlign = Math.floor(version / 7) + 2;
  const step = version == 32 ? 26 : Math.ceil((version * 4 + 4) / (numAlign * 2 - 2)) * 2;
  let result = [6];
  for (let pos = getSize(version) - 7;result.length < numAlign; pos -= step) {
    result.splice(1, 0, pos);
  }
  return result;
}
function getSize(version) {
  return (version << 2) + 17;
}
function getVersion(size) {
  return size - 17 >> 2;
}

// src/grid/QR.js
class QR {
  constructor({ version, ecl, mask, codewords, icon, preview, data }) {
    this.version = version;
    this.ecl = ecl;
    this.codewords = codewords;
    this._mask = mask;
    this.size = this.version * 4 + 17;
    Object.assign(this, { icon, preview, data });
  }
  get mask() {
    return this._mask;
  }
  set mask(v) {
    if (this._data_grid) {
      this._data_grid.xor(getMaskGrid(this.version, this._mask));
      this._data_grid.xor(getMaskGrid(this.version, v));
    }
    this._mask = v;
  }
  get grid() {
    return Grid.union(this.data_grid, getFunctionalGrid(this.version, this.ecl, this.mask));
  }
  get functional_grid() {
    return getFunctionalGrid(this.version, this.ecl, this.mask);
  }
  get finder_grid() {
    return drawFinderGrid(new Grid(this.size));
  }
  get timing_grid() {
    return drawTimingGrid(new Grid(this.size));
  }
  get alignment_grid() {
    return drawAlignmentGrid(new Grid(this.size), this.version);
  }
  get format_grid() {
    return drawFormatGrid(new Grid(this.size), this.ecl, this.mask);
  }
  get version_grid() {
    return drawVersionGrid(new Grid(this.size), this.version);
  }
  get data_grid() {
    if (this._data_grid) {
      return this._data_grid;
    }
    const data_grid = new Grid(this.size);
    drawDataGrid(data_grid, this.codewords);
    data_grid.xor(getMaskGrid(this.version, this.mask));
    this._data_grid = data_grid;
    return data_grid;
  }
  get rawdata_grid() {
    return Grid.xor(this.data_grid, getMaskGrid(this.version, this.mask));
  }
  clone() {
    return new QR({
      version: this.version,
      ecl: this.ecl,
      mask: this.mask,
      codewords: this.codewords.slice(),
      icon: this.icon,
      preview: this.preview,
      data: this.data
    });
  }
  toBytes() {
    return new Uint8Array([
      this.version & 255,
      (this.ecl & 3) << 3 | (this.mask & 7) << 5,
      ...this.codewords
    ]);
  }
  static fromBytes(bytes) {
    return new QR({
      version: bytes[0],
      ecl: bytes[1] >> 3 & 3,
      mask: bytes[1] >> 5 & 7,
      codewords: bytes.slice(2)
    });
  }
  toString() {
    return encodeQRString(this.toBytes());
  }
  toJSON() {
    return this.toString();
  }
  static fromString(str) {
    return QR.fromBytes(decodeQRString(str));
  }
  static fromJSON(str) {
    return QR.fromString(str);
  }
}
// src/features/Leaderboard.js
class Leaderboard {
  constructor(scorer, options = {}) {
    this.scorer = scorer;
    this.options = { capacity: 4, ...options };
    this.callbacks = [];
    this.buckets = {};
  }
  getOrMakeBuckets(metric) {
    if (!this.buckets[metric]) {
      this.buckets[metric] = {
        min: new BottomN(this.options.capacity),
        max: new TopN(this.options.capacity)
      };
    }
    return this.buckets[metric];
  }
  consider(qr) {
    qr = qr.clone();
    let { scores, cache = null } = this.scorer(qr);
    if (!scores) {
      throw new Error("Leaderboard scorer must return { scores }");
    }
    for (let [metric, score] of Object.entries(scores)) {
      let buckets = this.getOrMakeBuckets(metric);
      let min = { metric, direction: "min", score, qr, cache };
      let max = { metric, direction: "max", score, qr, cache };
      if (buckets.min.consider(score, min)) {
        this.notify(min);
      }
      if (buckets.max.consider(score, max)) {
        this.notify(max);
      }
    }
  }
  listen(cb) {
    this.callbacks.push(cb);
  }
  notify(result) {
    this.callbacks.forEach((cb) => cb(result));
  }
  min(metric) {
    return this.#standings(metric, "min");
  }
  max(metric) {
    return this.#standings(metric, "max");
  }
  results(metric) {
    return {
      min: [...this.min(metric)],
      max: [...this.max(metric)]
    };
  }
  allResults() {
    let results = {};
    for (let metric of Object.keys(this.buckets)) {
      results[metric] = this.results(metric);
    }
    return results;
  }
  *#standings(metric, direction) {
    let buckets = this.buckets[metric];
    if (!buckets)
      throw "metric not in leaderboard";
    for (const { object } of buckets[direction]) {
      yield object;
    }
  }
}
var ROOT_INDEX = 1;

class TopN {
  constructor(capacity = 64, objects = [], priorities = []) {
    if (capacity < 1)
      throw new Error("Capacity must be positive");
    this._capacity = capacity;
    this._objects = new Array(capacity + ROOT_INDEX);
    this._priorities = new Float64Array(capacity + ROOT_INDEX);
    this._length = objects.length;
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
  get size() {
    return this._length;
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
    let halfLength = ROOT_INDEX + (this._length >>> 1), lastIndex = this._length + ROOT_INDEX - 1;
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
  #push(object, priority) {
    if (this._length === this._capacity)
      throw new Error("Heap full");
    let pos = this._length + ROOT_INDEX;
    this._objects[pos] = object;
    this._priorities[pos] = priority;
    this._length++;
    this.#bubbleUp(pos);
  }
  #pop() {
    if (!this._length)
      return;
    const lastIndex = this._length + ROOT_INDEX - 1;
    const result = this._objects[ROOT_INDEX];
    this._objects[ROOT_INDEX] = this._objects[this._length + ROOT_INDEX - 1];
    this._priorities[ROOT_INDEX] = this._priorities[this._length + ROOT_INDEX - 1];
    this._objects[lastIndex] = null;
    this._priorities[lastIndex] = 0;
    this._length--;
    if (this._length > 0)
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
    if (this._length < this._capacity) {
      this.#push(object, score);
      return true;
    } else if (score > this._priorities[ROOT_INDEX]) {
      this._objects[ROOT_INDEX] = object;
      this._priorities[ROOT_INDEX] = score;
      this.#bubbleDown(ROOT_INDEX);
      return true;
    }
    return false;
  }
  *drain() {
    while (this._length > 0) {
      const score = this.peekPriority();
      const object = this.#pop();
      yield { score, object };
    }
  }
  *[Symbol.iterator]() {
    const items = [];
    for (let i = ROOT_INDEX;i < this._length + ROOT_INDEX; i++) {
      items.push({
        score: this._priorities[i],
        object: this._objects[i]
      });
    }
    items.sort((a, b) => b.score - a.score);
    for (const item of items) {
      yield item;
    }
  }
}

class BottomN extends TopN {
  consider(score, object) {
    return super.consider(-score, object);
  }
  peekPriority() {
    return -super.peekPriority();
  }
  *drain() {
    yield* super.drain();
  }
  *[Symbol.iterator]() {
    for (const { score, object } of super[Symbol.iterator]()) {
      yield { score: -score, object };
    }
  }
}
// src/features/scores/standardPenalty.js
function standardPenalty(grid) {
  const size = grid.w;
  const totalModules = size * size;
  const gridData = new Uint8Array(totalModules);
  let darkCount = 0;
  let penalty1 = 0;
  let penalty2 = 0;
  let penalty3 = 0;
  function countFinderPatterns(runHistory) {
    const n = runHistory[1];
    const core = n > 0 && runHistory[2] === n && runHistory[3] === n * 3 && runHistory[4] === n && runHistory[5] === n;
    if (!core)
      return 0;
    let count = 0;
    if (runHistory[0] >= n * 4 && runHistory[6] >= n)
      count++;
    if (runHistory[6] >= n * 4 && runHistory[0] >= n)
      count++;
    return count;
  }
  function finderPenaltyForLine(baseIndex, stride) {
    let penalty = 0;
    let runColor = 0;
    let runLength = 0;
    let padding = size;
    let runHistory = [];
    function addHistory(length) {
      runHistory.unshift(length + padding);
      padding = 0;
    }
    for (let i = 0;i < size; i++) {
      const color = gridData[baseIndex + i * stride];
      if (color === runColor) {
        runLength++;
      } else {
        addHistory(runLength);
        if (runColor === 0) {
          penalty += countFinderPatterns(runHistory) * 40;
        }
        runColor = color;
        runLength = 1;
      }
    }
    if (runColor === 1) {
      addHistory(runLength);
      runLength = 0;
    }
    padding = size;
    addHistory(runLength);
    penalty += countFinderPatterns(runHistory) * 40;
    return penalty;
  }
  for (let y = 0;y < size; y++) {
    const rowStart = y * size;
    for (let x = 0;x < size; x++) {
      const isDark = grid.get(x, y) ? 1 : 0;
      gridData[rowStart + x] = isDark;
      darkCount += isDark;
    }
    let count = 1;
    let prev = gridData[rowStart];
    for (let x = 1;x < size; x++) {
      const curr = gridData[rowStart + x];
      if (curr === prev) {
        count++;
      } else {
        if (count >= 5) {
          penalty1 += count - 2;
        }
        count = 1;
        prev = curr;
      }
    }
    if (count >= 5) {
      penalty1 += count - 2;
    }
    penalty3 += finderPenaltyForLine(rowStart, 1);
    if (y > 0) {
      const prevRowStart = (y - 1) * size;
      for (let x = 0;x < size - 1; x++) {
        const a = gridData[prevRowStart + x];
        if (a === gridData[prevRowStart + x + 1] && a === gridData[rowStart + x] && a === gridData[rowStart + x + 1]) {
          penalty2 += 3;
        }
      }
    }
  }
  for (let x = 0;x < size; x++) {
    let count = 1;
    let prev = gridData[x];
    for (let y = 1;y < size; y++) {
      const curr = gridData[y * size + x];
      if (curr === prev) {
        count++;
      } else {
        if (count >= 5) {
          penalty1 += count - 2;
        }
        count = 1;
        prev = curr;
      }
    }
    if (count >= 5) {
      penalty1 += count - 2;
    }
    penalty3 += finderPenaltyForLine(x, size);
  }
  const k = Math.floor(darkCount * 20 / totalModules);
  const penalty4 = 10 * Math.min(Math.abs(k - 10), Math.abs(k + 1 - 10));
  return {
    scores: {
      penalty: penalty1 + penalty2 + penalty3 + penalty4
    },
    cache: {
      penalty1,
      penalty2,
      penalty3,
      penalty4
    }
  };
}
// src/features/scores/findFits.js
function findFits(grid, shapes) {
  let sols = [];
  Object.keys(shapes).forEach((k) => {
    let shape = shapes[k];
    for (let [x, y] of grid.tiles()) {
      let is_valid = true;
      try {
        shape.points.forEach(([px, py, v = 1]) => {
          is_valid &= grid.used(x + px, y + py) && !grid.get(x + px, y + py) == !v;
        });
      } catch (e) {
        is_valid = false;
      }
      if (is_valid) {
        sols.push([k, [x, y]]);
      }
    }
  });
  let fits = sols.map(([k, [x, y]]) => ({ shape: shapes[k], coords: { x, y } }));
  return {
    scores: {
      candidates: fits.length
    },
    cache: {
      fits
    }
  };
}
// src/features/scores/packShapes.js
function packShapes(grid, shapes) {
  const { fits } = findFits(grid, shapes).cache;
  const { header, columns } = buildDLXMatrix(grid, fits);
  let col = header.right;
  let node = col.down;
  for (let i = 0;i < 10; i++) {
    if (node === col)
      break;
    node = node.down;
  }
  const { score, valid_fits } = runSolveDLX(header, columns);
  let used = new Grid(grid.w, grid.h);
  let placements = [];
  valid_fits.forEach((fit_idx) => {
    let { shape, coords } = fits[fit_idx];
    shape.points.forEach(([px, py]) => {
      used.set(coords.x + px, coords.y + py, 1);
    });
    placements.push({ shape, coords });
  });
  return {
    scores: {
      num_placements: score
    },
    cache: {
      used,
      unused: Grid.erase(grid, used),
      placements
    }
  };
}
function buildDLXMatrix(grid, fits) {
  const blackSquares = [];
  for (let y = 0;y < grid.h; y++) {
    for (let x = 0;x < grid.w; x++) {
      if (grid.get(x, y)) {
        blackSquares.push([x, y]);
      }
    }
  }
  const header = new DLXNode;
  const columnHeaders = blackSquares.map(([x, y]) => new ColumnHeader([x, y]));
  if (columnHeaders.length > 0) {
    for (let i = 0;i < columnHeaders.length; i++) {
      const curr = columnHeaders[i];
      const prev = i === 0 ? header : columnHeaders[i - 1];
      const next = i === columnHeaders.length - 1 ? header : columnHeaders[i + 1];
      curr.left = prev;
      curr.right = next;
      prev.right = curr;
      next.left = curr;
    }
    header.right = columnHeaders[0];
    header.left = columnHeaders[columnHeaders.length - 1];
  }
  const columns = new Map(columnHeaders.map((col2) => [`${col2.id[0]},${col2.id[1]}`, col2]));
  const matrix = [];
  fits.forEach((fit, rowIdx) => {
    const { shape, coords } = fit;
    const row = [];
    shape.points.forEach(([px, py]) => {
      const x = coords.x + px;
      const y = coords.y + py;
      const pos = `${x},${y}`;
      if (columns.has(pos)) {
        row.push(columns.get(pos));
      }
    });
    matrix.push({ rowIdx, nodes: row });
  });
  matrix.forEach(({ rowIdx, nodes: columnNodes }) => {
    const rowNodes = columnNodes.map(() => new DLXNode);
    columnNodes.forEach((col2, idx) => {
      const node = rowNodes[idx];
      node.column = col2;
      node.rowId = rowIdx;
      node.down = col2.down;
      node.up = col2;
      col2.down.up = node;
      col2.down = node;
      col2.size++;
      node.right = rowNodes[(idx + 1) % rowNodes.length];
      node.left = rowNodes[(idx - 1 + rowNodes.length) % rowNodes.length];
    });
    rowNodes.forEach((node, idx) => {
      node.right.left = node;
      node.left.right = node;
    });
  });
  let col = header.right;
  let count = 0;
  while (col !== header && count < blackSquares.length + 1) {
    col = col.right;
    count++;
  }
  return { header, columns: blackSquares.length };
}

class DLXNode {
  constructor() {
    this.left = this;
    this.right = this;
    this.up = this;
    this.down = this;
    this.column = null;
    this.rowId = null;
  }
}

class ColumnHeader extends DLXNode {
  constructor(id) {
    super();
    this.size = 0;
    this.id = id;
  }
}
function solveDLX(header, columns, solution = [], best = { score: 0, valid_fits: [] }, depth = 0, coveredSet = new Set) {
  if (solution.length > best.score) {
    best.score = solution.length;
    best.valid_fits = [...solution];
  }
  if (header.right === header) {
    return best;
  }
  if (depth >= columns) {
    return best;
  }
  let chosenCol = null;
  let minSize = Infinity;
  for (let col = header.right;col !== header; col = col.right) {
    if (col.size < minSize && col.size > 0) {
      minSize = col.size;
      chosenCol = col;
    }
  }
  if (!chosenCol || minSize === 0) {
    throw { done: true, result: best };
  }
  cover(chosenCol);
  coveredSet.add(chosenCol.id.join(","));
  for (let r = chosenCol.down;r !== chosenCol; r = r.down) {
    solution.push(r.rowId);
    const coveredCols = [];
    for (let j = r.right;j !== r; j = j.right) {
      if (!coveredSet.has(j.column.id.join(","))) {
        coveredCols.push(j.column);
        cover(j.column);
        coveredSet.add(j.column.id.join(","));
      }
    }
    solveDLX(header, columns, solution, best, depth + 1, coveredSet);
    solution.pop();
    while (coveredCols.length) {
      let col = coveredCols.pop();
      uncover(col);
      coveredSet.delete(col.id.join(","));
    }
  }
  uncover(chosenCol);
  coveredSet.delete(chosenCol.id.join(","));
  return best;
}
function runSolveDLX(header, columns) {
  try {
    return solveDLX(header, columns);
  } catch (e) {
    if (e.done) {
      return e.result;
    }
    throw e;
  }
}
function cover(column) {
  column.right.left = column.left;
  column.left.right = column.right;
  for (let i = column.down;i !== column; i = i.down) {
    for (let j = i.right;j !== i; j = j.right) {
      j.down.up = j.up;
      j.up.down = j.down;
      j.column.size--;
    }
  }
}
function uncover(column) {
  for (let i = column.up;i !== column; i = i.up) {
    for (let j = i.left;j !== i; j = j.left) {
      j.column.size++;
      j.down.up = j;
      j.up.down = j;
    }
  }
  column.right.left = column;
  column.left.right = column;
}
// src/features/scores/tileClusters.js
function tileClusters(grid, { diagonal = false, value = true } = {}) {
  let visited = new Grid(grid.w, grid.h);
  const shapes = [];
  const dots = [];
  function floodFill(x, y, shape) {
    if (!grid.used(x, y)) {
      return;
    }
    if (grid.get(x, y) != value || visited.get(x, y)) {
      return;
    }
    visited.set(x, y, true);
    shape.push([x, y]);
    floodFill(x - 1, y, shape);
    floodFill(x + 1, y, shape);
    floodFill(x, y - 1, shape);
    floodFill(x, y + 1, shape);
    if (diagonal) {
      floodFill(x - 1, y - 1, shape);
      floodFill(x + 1, y - 1, shape);
      floodFill(x - 1, y + 1, shape);
      floodFill(x + 1, y + 1, shape);
    }
  }
  for (let [x, y] of grid.tiles(value)) {
    if (!visited.get(x, y)) {
      const shape = [];
      floodFill(x, y, shape);
      if (shape.length > 1) {
        shapes.push(shape);
      } else {
        dots.push(shape[0]);
      }
    }
  }
  return {
    scores: {
      get num_dots() {
        return dots.length;
      },
      get num_shapes() {
        return shapes.length;
      },
      get biggest_shape() {
        if (shapes.length > 0) {
          return Math.max(...shapes.map((shape) => shape.length));
        }
        return dots.length > 0 ? 1 : 0;
      }
    },
    cache: {
      shapes,
      dots
    }
  };
}
// src/features/scores/penStrokes.js
function penStrokes(grid, {
  fill,
  expand_stroke,
  thickness = 0.7,
  radius
} = {}) {
  const useFill = fill ?? expand_stroke ?? true;
  const capRadius = radius ?? thickness / 2;
  let { shapes, dots } = tileClusters(grid).cache;
  let strokes = [];
  for (let shape of shapes) {
    let runs = extractRuns(shape);
    let chosen = greedyRuns(runs, shape);
    let groups = orderRunsPenDown(chosen);
    let svg_d = groups.map((group) => useFill ? runsToFilledSVGPath(group, { thickness, radius: capRadius }) : runsToSVGPath(group)).join(" ");
    strokes.push(svg_d);
  }
  const circlePath = (x, y, radius2 = 0.5) => {
    const r = +radius2.toFixed(2);
    const d = +(radius2 * 2).toFixed(2);
    return `M${+(x - radius2).toFixed(2)},${+y.toFixed(2)} a${r},${r} 0 1 0 ${d},0 a${r},${r} 0 1 0 ${-d},0z`;
  };
  let dots_path = dots.map(([x, y]) => circlePath(x, y, 0.5)).join("");
  return {
    scores: {
      num_dots: dots.length,
      num_clusters: shapes.length,
      num_paths: strokes.length,
      svg_len: strokes.join(" ").length + dots_path.length
    },
    cache: {
      strokes,
      dots
    }
  };
}
function runsToFilledSVGPath(group, { thickness = 0.7, radius = thickness / 2 } = {}) {
  const q = (x) => +x.toFixed(2);
  const parts = [];
  const half = thickness / 2;
  const cap = Math.max(0, Math.min(radius, half));
  for (const { run: rseg, from } of group) {
    const forward = from[0] === rseg.x0 && from[1] === rseg.y0;
    const sx = forward ? rseg.x0 : rseg.x1;
    const sy = forward ? rseg.y0 : rseg.y1;
    const ex = forward ? rseg.x1 : rseg.x0;
    const ey = forward ? rseg.y1 : rseg.y0;
    if (sx === ex && sy === ey) {
      parts.push(roundedRectPath(sx - half, sy - half, thickness, thickness, cap));
      continue;
    }
    if (sy === ey) {
      const left = Math.min(sx, ex) - half;
      const right = Math.max(sx, ex) + half;
      parts.push(roundedRectPath(left, sy - half, right - left, thickness, cap));
      continue;
    }
    if (sx === ex) {
      const top = Math.min(sy, ey) - half;
      const bot = Math.max(sy, ey) + half;
      parts.push(roundedRectPath(sx - half, top, thickness, bot - top, cap));
    }
  }
  return parts.join(" ");
  function roundedRectPath(x, y, w, h, r) {
    x = q(x);
    y = q(y);
    w = q(w);
    h = q(h);
    r = q(Math.max(0, Math.min(r, w / 2, h / 2)));
    if (!r)
      return `M${x} ${y}h${w}v${h}h${-w}z`;
    return `M${x + r} ${y}` + `h${q(w - 2 * r)}` + `a${r} ${r} 0 0 1 ${r} ${r}` + `v${q(h - 2 * r)}` + `a${r} ${r} 0 0 1 ${-r} ${r}` + `h${q(2 * r - w)}` + `a${r} ${r} 0 0 1 ${-r} ${-r}` + `v${q(2 * r - h)}` + `a${r} ${r} 0 0 1 ${r} ${-r}` + `z`;
  }
}
function runsToSVGPath(group) {
  let d = "";
  let cx = null, cy = null;
  let lastCmd = null;
  for (const { run: r, from } of group) {
    const horiz = r.y0 === r.y1;
    const forward = from[0] === r.x0 && from[1] === r.y0;
    const sx = forward ? r.x0 : r.x1;
    const sy = forward ? r.y0 : r.y1;
    const ex = forward ? r.x1 : r.x0;
    const ey = forward ? r.y1 : r.y0;
    if (cx !== sx || cy !== sy) {
      d += `M ${sx} ${sy} `;
      lastCmd = null;
    }
    if (horiz) {
      const len = ex - sx;
      if (lastCmd === "h")
        d += `${len} `;
      else {
        d += `h ${len} `;
        lastCmd = "h";
      }
    } else {
      const len = ey - sy;
      if (lastCmd === "v")
        d += `${len} `;
      else {
        d += `v ${len} `;
        lastCmd = "v";
      }
    }
    cx = ex;
    cy = ey;
  }
  return d.trim();
}
function extractRuns(shape) {
  const pixelSet = new Set(shape.map(([x, y]) => `${x},${y}`));
  const rows = [];
  const cols = [];
  for (const [x, y] of shape) {
    if (!pixelSet.has(`${x - 1},${y}`)) {
      let x1 = x;
      while (pixelSet.has(`${x1 + 1},${y}`)) {
        x1++;
      }
      const len = x1 - x + 1;
      if (len >= 2) {
        rows.push({ x0: x, y0: y, x1, y1: y, length: len });
      }
    }
  }
  for (const [x, y] of shape) {
    if (!pixelSet.has(`${x},${y - 1}`)) {
      let y1 = y;
      while (pixelSet.has(`${x},${y1 + 1}`)) {
        y1++;
      }
      const len = y1 - y + 1;
      if (len >= 2) {
        cols.push({ x0: x, y0: y, x1: x, y1, length: len });
      }
    }
  }
  return { rows, cols };
}
function greedyRuns({ rows, cols }, pixels) {
  const runs = rows.concat(cols);
  const covered = new Set;
  const total = pixels.length;
  const solution = [];
  const key = (x, y) => `${x},${y}`;
  function* runPixels(r) {
    if (r.y0 === r.y1) {
      for (let x = r.x0;x <= r.x1; x++)
        yield key(x, r.y0);
    } else {
      for (let y = r.y0;y <= r.y1; y++)
        yield key(r.x0, y);
    }
  }
  while (covered.size < total) {
    let best = null;
    let bestScore = -1;
    for (const r of runs) {
      let uncovered = 0;
      let overlap = 0;
      for (const p of runPixels(r)) {
        if (covered.has(p))
          overlap = 1;
        else
          uncovered++;
      }
      if (!uncovered)
        continue;
      const score = uncovered * 100 + overlap * 10 + r.length;
      if (score > bestScore) {
        bestScore = score;
        best = r;
      }
    }
    solution.push(best);
    for (const p of runPixels(best))
      covered.add(p);
  }
  return solution;
}
function orderRunsPenDown(runs) {
  const unused = new Set(runs);
  const groups = [];
  const ends = (r) => [[r.x0, r.y0], [r.x1, r.y1]];
  while (unused.size) {
    const group = [];
    let first = unused.values().next().value;
    unused.delete(first);
    let [a, b] = ends(first);
    let cx = b[0], cy = b[1];
    group.push({ run: first, from: a });
    while (true) {
      let best = null;
      let bestDist = Infinity;
      for (const r of unused) {
        if (!runsTouch(first, r))
          continue;
        const [e0, e1] = ends(r);
        const d0 = Math.abs(cx - e0[0]) + Math.abs(cy - e0[1]);
        const d1 = Math.abs(cx - e1[0]) + Math.abs(cy - e1[1]);
        if (d0 < bestDist) {
          bestDist = d0;
          best = { run: r, from: e0, to: e1 };
        }
        if (d1 < bestDist) {
          bestDist = d1;
          best = { run: r, from: e1, to: e0 };
        }
      }
      if (!best || bestDist > 1)
        break;
      unused.delete(best.run);
      group.push({ run: best.run, from: best.from });
      first = best.run;
      cx = best.to[0];
      cy = best.to[1];
    }
    groups.push(group);
  }
  return groups;
}
function runsTouch(a, b) {
  if (a.y0 === a.y1 && b.y0 === b.y1) {
    return Math.abs(a.y0 - b.y0) === 1 && !(a.x1 < b.x0 || b.x1 < a.x0);
  }
  if (a.x0 === a.x1 && b.x0 === b.x1) {
    return Math.abs(a.x0 - b.x0) === 1 && !(a.y1 < b.y0 || b.y1 < a.y0);
  }
  const h = a.y0 === a.y1 ? a : b;
  const v = a.x0 === a.x1 ? a : b;
  return v.x0 >= h.x0 && v.x0 <= h.x1 && h.y0 >= v.y0 && h.y0 <= v.y1 && (Math.abs(v.x0 - h.x0) <= 1 || Math.abs(h.y0 - v.y0) <= 1);
}
// src/render/utils.js
function drawAligns(qr, {
  roundness = 0,
  ring = 1,
  center = 1
} = {}) {
  let sizes = [
    2 * 2 + ring,
    2 * 2 - ring,
    0 * 2 + center
  ];
  let d = "";
  let aligns = getAlignmentPositions(qr.version);
  for (let i = 0;i < aligns.length; i++) {
    for (let j = 0;j < aligns.length; j++) {
      if (!(i == 0 && j == 0 || i == 0 && j == aligns.length - 1 || i == aligns.length - 1 && j == 0)) {
        let cx = aligns[i];
        let cy = aligns[j];
        sizes.forEach((s, index) => {
          let r = s * roundness * 0.5;
          d += boxPath(cx, cy, s, r, { clockwise: index !== 1 });
        });
      }
    }
  }
  return d;
}
function drawFinders(qr, {
  roundness = 0,
  ring = 1,
  center = 1
} = {}) {
  let sizes = [
    3 * 2 + ring,
    3 * 2 - ring,
    1 * 2 + center
  ];
  let d = "";
  Array.from([[0, 0], [0, qr.size - 7], [qr.size - 7, 0]]).forEach(([x, y]) => {
    let cx = x + 3;
    let cy = y + 3;
    sizes.forEach((s, index) => {
      let r = s * roundness * 0.5;
      d += boxPath(cx, cy, s, r, { clockwise: index !== 1 });
    });
  });
  return d;
}
function drawDots(xys = [[0, 0]], {
  size = 0.7,
  radius
} = {}) {
  const half = size * 0.5;
  const cornerRadius = Math.max(0, Math.min(radius ?? half, half));
  return xys.map(([x, y]) => {
    if (cornerRadius >= half)
      return circlePath(x, y, half);
    return boxPath(x, y, size, cornerRadius);
  }).join("");
}
function getIconBox(qr, slot = "auto") {
  const { size, version } = qr;
  const iconSize = Math.ceil(size / 5);
  const align = getAlignmentPositions(version);
  const hasMiddleAlign = align.length > 2 && align.length % 2 === 1;
  let centerX = Math.floor(size / 2);
  let centerY = centerX;
  if (hasMiddleAlign && slot !== "center") {
    const mid = align.length >> 1;
    if (slot === "bottom") {
      centerY = Math.floor((align[mid] + align[mid + 1]) / 2);
    } else {
      centerY = Math.floor((align[mid - 1] + align[mid]) / 2);
    }
  }
  const x = centerX - Math.floor(iconSize / 2);
  const y = centerY - Math.floor(iconSize / 2);
  return {
    x,
    y,
    width: iconSize,
    height: iconSize,
    cx: x + iconSize / 2,
    cy: y + iconSize / 2
  };
}
function boxPath(cx, cy, size, r = 0, options) {
  const half = size / 2;
  return rectPath(cx - half, cy - half, size, size, r, options);
}
function rectPath(x, y, w, h, r = 0, { clockwise = true } = {}) {
  if (r == 0)
    return sharpRectPath(x, y, w, h, clockwise);
  let rr = Math.min(r, w / 2, h / 2);
  x = round(x, 3);
  y = round(y, 3);
  w = round(w, 4);
  h = round(h, 4);
  rr = round(rr, 4);
  const sx = round(w - 2 * rr, 4);
  const sy = round(h - 2 * rr, 4);
  if (clockwise) {
    return `M${round(x + rr, 3)},${y}` + `h${sx}` + `a${rr},${rr} 0 0 1 ${rr},${rr}` + `v${sy}` + `a${rr},${rr} 0 0 1 ${-rr},${rr}` + `h${-sx}` + `a${rr},${rr} 0 0 1 ${-rr},${-rr}` + `v${-sy}` + `a${rr},${rr} 0 0 1 ${rr},${-rr}z`;
  }
  return `M${round(x + rr, 3)},${y}` + `a${rr},${rr} 0 0 0 ${-rr},${rr}` + `v${sy}` + `a${rr},${rr} 0 0 0 ${rr},${rr}` + `h${sx}` + `a${rr},${rr} 0 0 0 ${rr},${-rr}` + `v${-sy}` + `a${rr},${rr} 0 0 0 ${-rr},${-rr}z`;
}
function sharpRectPath(x, y, w, h, clockwise = true) {
  x = round(x, 2);
  y = round(y, 2);
  if (!clockwise) {
    return `M${x},${y}` + `v${h}` + `h${w}` + `v${-h}` + `Z`;
  }
  return `M${x},${y}` + `h${w}` + `v${h}` + `h${-w}` + `Z`;
}
function round(n, places = 4) {
  return +n.toFixed(places);
}
function circlePath(cx, cy, radius = 0.5) {
  const r = +radius.toFixed(2);
  return `M${+(cx - radius).toFixed(2)},${+cy.toFixed(2)} a${r},${r} 0 1 0 ${r * 2},0 a${r},${r} 0 1 0 ${-r * 2},0z`;
}

// src/render/index.js
var drawSVG_opts = {
  margin: 2,
  width: 100,
  height: 100,
  colors: {
    landmarks: "#000",
    dots: "#334",
    lines: "#334",
    icon: "#118",
    background: false
  },
  lines: { fill: true, thickness: 0.7 },
  dots: { size: 0.7 },
  finders: { ring: 1, center: 1, roundness: 0.2 },
  aligns: { ring: 1, center: 1, roundness: 0.2 },
  icon: undefined
};
function drawSVG(qr, options = {}) {
  const hasIconOverride = Object.hasOwn(options, "icon");
  let { margin, width, height, colors, lines, dots, finders, aligns, icon } = deepMerge(drawSVG_opts, options);
  let { finder_grid, alignment_grid, grid } = qr;
  let main_grid = Grid.erase(grid, finder_grid, alignment_grid);
  let icbx;
  icon = hasIconOverride ? icon : qr.icon;
  let preview = qr.preview ? `QR: ${qr.preview}` : `QR Code`;
  if (icon && icon.d) {
    icbx = getIconBox(qr, "bottom");
    for (let dx = 0;dx < icbx.width; dx++) {
      for (let dy = 0;dy < icbx.height; dy++) {
        main_grid.set(icbx.x + dx, icbx.y + dy, 0);
      }
    }
  }
  const lineThickness = lines.thickness ?? 0.7;
  const lineFill = lines.fill ?? true;
  const lineRadius = lines.radius ?? lineThickness / 2;
  let { strokes: data_strokes, dots: data_dots } = penStrokes(main_grid, {
    fill: lineFill,
    thickness: lineThickness,
    radius: lineRadius
  }).cache;
  const linesPath = lineFill ? `<path id="Lines" fill="${colors.lines}" stroke="none" d="${data_strokes.join(" ")}" />` : `<path id="Lines" stroke="${colors.lines}" d="${data_strokes.join(" ")}" fill="none" stroke-width='${lineThickness}' stroke-linejoin='round' stroke-linecap='round' />`;
  return `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${grid.w + margin * 2 + 1} ${grid.h + margin * 2 + 1}' width="${width}" height="${height}" data-qrsart="${QRSART_VERSION}">
<title>${preview}</title>
${qr.data ? `<desc>${qr.data}</desc>` : ``}
${colors.background ? `<g id="Background">
  <rect x="0" y="0" width="${grid.w + margin * 2 + 1}" height="${grid.h + margin * 2 + 1}" fill="${colors.background}" ></rect>
</g>
` : ``}<g transform="translate(${margin + 0.5},${margin + 0.5})" id="Patterns" fill="${colors.landmarks}">
  <path id="Alignments" d="${drawAligns(qr, aligns)}" />
  <path id="Finders" d="${drawFinders(qr, finders)}" />
</g>
${icon && icon.d ? `<g id="Icon" fill="${colors.icon}" stroke="none" fill-rule="evenodd" transform="translate(${margin + icbx.x},${margin + icbx.y}) scale(${icbx.width * icon.scale})" >
  ${icon.d.map((d) => ` <path d="${d}" /> `).join(`
  `)}
</g> ` : ``}
<g transform="translate(${margin + 0.5},${margin + 0.5})" id="Data">
  ${linesPath}
  <path id="Dots" stroke="none" fill="${colors.dots}" d="${drawDots(data_dots, dots)}" />
</g>
</svg>`.toString();
}
// src/data/DataType.js
function generateOrderings(n) {
  const result = [];
  const nums = Array.from({ length: n }, (_, i) => i);
  const visited = new Array(n).fill(false);
  function backtrack(current) {
    if (current.length === n) {
      result.push([...current]);
      return;
    }
    for (let i = 0;i < n; i++) {
      if (!visited[i]) {
        visited[i] = true;
        current.push(nums[i]);
        backtrack(current);
        current.pop();
        visited[i] = false;
      }
    }
  }
  backtrack([]);
  return result;
}
function permute_options(options = []) {
  const totals = options.map((c) => c && typeof c === "object" && ("total" in c) ? c.total : 1);
  return {
    total: totals.reduce((acc, t) => acc + t, 0),
    get: (k) => {
      let sumtotal = 0;
      for (let i = 0;i < options.length; i++) {
        if (k < sumtotal + totals[i]) {
          let sub_k = k - sumtotal;
          return typeof options[i] == "object" && "get" in options[i] ? options[i].get(sub_k) : options[i];
        } else {
          sumtotal += totals[i];
        }
      }
    }
  };
}
function permute_group(components = [], {
  join = ""
} = {}) {
  const totals = components.map((c) => typeof c === "object" && c !== null && ("total" in c) ? c.total : 1);
  return {
    total: totals.reduce((acc, t) => acc * t, 1),
    get: (k) => {
      let remainder = k;
      const parts = [];
      for (let i = components.length - 1;i >= 0; i--) {
        const t = totals[i];
        const partK = remainder % t;
        remainder = Math.floor(remainder / t);
        const component = components[i];
        if (typeof component === "string") {
          parts.unshift(component);
        } else if (component && typeof component === "object" && "get" in component) {
          parts.unshift(component.get(partK));
        } else {
          parts.unshift(String(component));
        }
      }
      return parts.join(join);
    }
  };
}
function permute_query(params = {}, {
  queryCaps = false,
  ordering = false
} = {}) {
  let items = Object.entries(params).filter(([k, v]) => k && v && v.length > 0);
  let orders = ordering ? generateOrderings(items.length) : [items.map((_, i) => i)];
  if (items.length == 1) {
    let [[key, value]] = items;
    let keyComp = permute_casing(`${key}=`, { any_casing: queryCaps });
    let encoded = encodeURIComponent(value);
    return { total: keyComp.total, get: (k) => `?${keyComp.get(k)}${encoded}` };
  }
  let group = permute_group([
    `?`,
    ...items.flatMap(([k, v]) => [
      permute_casing(`${k}=`, { any_casing: queryCaps }),
      encodeURIComponent(v)
    ])
  ], { join: "&" });
  return {
    total: orders.length * group.total,
    get: (k) => {
      let order_i = Math.floor(k / group.total);
      let group_i = k % group.total;
      let g = permute_group([
        ...orders[order_i].map((index) => items[index]).flatMap(([key, v]) => [
          permute_casing(`${key}=`, { any_casing: queryCaps }),
          encodeURIComponent(v)
        ])
      ], { join: "&" });
      return "?" + g.get(group_i).replace(/=&/g, "=");
    }
  };
}
function permute_casing(str = "", {
  same_casing = false,
  any_casing = false
} = {}) {
  if (any_casing) {
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
          result[pos] = k >> i & 1 ? str[pos].toLowerCase() : str[pos].toUpperCase();
        }
        return result.join("");
      }
    };
  } else if (same_casing) {
    return {
      total: 2,
      get: (k) => k == 0 ? str.toUpperCase() : str.toLowerCase()
    };
  } else {
    return { total: 1, get: (k) => str };
  }
}

class PermutationSet {
  constructor({ total, get }) {
    Object.assign(this, { total, get });
  }
  *[Symbol.iterator]() {
    yield* this.batch(0, 1);
  }
  *batch(start = 0, stride = 1) {
    let { total, get } = this;
    for (let i = start;i < total; i += stride) {
      yield [get(i), i];
    }
  }
}

class DataType {
  constructor(value, _parse, _permute, icon, preview) {
    Object.assign(this, { value, _parse, _permute });
    if (icon) {
      this.icon = icon(value);
    }
    if (preview) {
      this.preview = preview(value);
    }
  }
  permute(options = {}) {
    return new PermutationSet(this._permute(this.value, options));
  }
  toString() {
    return this._parse(this.value);
  }
  [Symbol.toPrimitive]() {
    return this.toString();
  }
  *[Symbol.iterator]() {
    yield* this.permute();
  }
}
function formatDateForICal(dateStr) {
  if (!dateStr.includes("T")) {
    return dateStr.replace(/-/g, "");
  }
  let formatted = dateStr.replace(/-/g, "").replace(/:/g, "");
  if (!formatted.endsWith("Z"))
    formatted += "Z";
  return formatted.replace("T", "T").slice(0, -1);
}
function escapeValue(value) {
  return value.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

// src/data/formats/bitcoin.js
function valueSchema() {
  return {
    description: "Bitcoin payment request based on BIP-21 URI scheme for scannable QR codes",
    examples: [
      {
        address: "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
        amount: 0.1,
        label: "Satoshi Nakamoto",
        message: "Donation for Bitcoin development"
      }
    ],
    type: "object",
    properties: {
      address: { description: "Bitcoin address (e.g., legacy, SegWit)", type: "string" },
      amount: { minimum: 0, description: "Amount in BTC (decimal)", type: "number" },
      label: { description: "Label for the payment (e.g., recipient name)", type: "string" },
      message: { description: "Message describing the payment", type: "string" }
    },
    additionalProperties: false,
    required: ["address"]
  };
}
function permuteSchema() {
  return { examples: [{}], type: "object", properties: {}, additionalProperties: false };
}
function permute(value = {}, options = {}) {
  return {
    total: 1,
    get(k) {
      return format(value);
    }
  };
}
function format(payment) {
  let uri = `bitcoin:${encodeURIComponent(payment.address)}`;
  const params = [];
  if (payment.amount !== undefined)
    params.push(`amount=${payment.amount}`);
  if (payment.label)
    params.push(`label=${encodeURIComponent(payment.label)}`);
  if (payment.message)
    params.push(`message=${encodeURIComponent(payment.message)}`);
  if (params.length > 0)
    uri += `?${params.join("&")}`;
  return uri;
}
function preview(value) {
  return "Bitcoin";
}
function icon() {
  return {
    d: [
      `M7.526 18.207v-1.759H4.595V14.69h1.758V5.31H4.595V3.552h2.931V1.793h1.758v1.759h1.759V1.793h1.758v2.003c.733.31 1.307.761 1.722 1.355.416.594.623 1.282.623 2.065 0 .472-.069.895-.207 1.27a3.496 3.496 0 0 1-.623 1.05c.586.277 1.066.716 1.441 1.319.374.602.562 1.242.562 1.92 0 1.016-.33 1.87-.99 2.562-.659.692-1.502 1.062-2.528 1.111v1.759h-1.758v-1.759H9.284v1.759H7.526Zm.586-9.086h3.371c.537 0 .989-.187 1.355-.559.366-.373.55-.82.55-1.343s-.187-.972-.56-1.347a1.833 1.833 0 0 0-1.345-.562H8.112v3.811Zm0 5.569h4.543c.537 0 .989-.187 1.355-.559.367-.373.55-.82.55-1.344 0-.523-.186-.971-.56-1.346a1.832 1.832 0 0 0-1.345-.562H8.112v3.811Z`
    ],
    scale: 1 / 20
  };
}

// src/data/formats/email.js
function valueSchema2() {
  return {
    description: "Open email client populated values",
    examples: [{ to: "dev@qrs.art", subject: "Docs Test", cc: "test@qrs.art" }],
    type: "object",
    properties: {
      to: { format: "email", type: "string" },
      subject: { type: "string" },
      body: { type: "string" },
      cc: { format: "email", type: "string" },
      bcc: { format: "email", type: "string" }
    },
    additionalProperties: false,
    required: ["to"]
  };
}
function permuteSchema2() {
  return {
    examples: [{ hostnameCaps: true, queryOrdering: true }],
    type: "object",
    properties: {
      prefixCaps: { type: "boolean" },
      hostnameCaps: { type: "boolean" },
      queryCaps: { type: "boolean" },
      queryOrdering: { type: "boolean" }
    },
    additionalProperties: false
  };
}
function permute2(value = {}, options = {}) {
  let { to, cc, bcc, subject, body } = value;
  let { prefixCaps, hostnameCaps, queryCaps, queryOrdering } = options;
  function upperDomainAddress(addr) {
    if (typeof addr == "string" && addr.indexOf("@") > 0 && addr.lastIndexOf("@") == addr.indexOf("@")) {
      let [user, hostname] = addr.split("@");
      return user + "@" + hostname.toUpperCase();
    }
    return "";
  }
  to = upperDomainAddress(to);
  cc = upperDomainAddress(cc);
  bcc = upperDomainAddress(bcc);
  const prefixComp = permute_casing("mailto:", { same_casing: prefixCaps });
  const messageComp = permute_query({ subject, cc, bcc, body }, { queryCaps, ordering: queryOrdering });
  return permute_group([
    prefixComp,
    to,
    messageComp
  ]);
}
function format2(value) {
  return permute2(value, {}).get(0);
}
function preview2(value) {
  return "Email";
}
function icon2() {
  return {
    d: [
      `M3 4a2 2 0 0 0-2 2v1.161l8.441 4.221a1.25 1.25 0 0 0 1.118 0L19 7.162V6a2 2 0 0 0-2-2H3Z`,
      `m19 8.839-7.77 3.885a2.75 2.75 0 0 1-2.46 0L1 8.839V14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8.839Z`
    ],
    scale: 1 / 20
  };
}

// src/data/formats/ethereum.js
function valueSchema3() {
  return {
    oneOf: [
      {
        description: "Simple Ethereum ETH payment request based on EIP-681 URI scheme for scannable QR codes",
        examples: [
          { address: "0xfb6916095ca1df60bb79Ce92ce3ea74c37c5d359", chainId: 1, amount: 0.1 }
        ],
        type: "object",
        properties: {
          address: { description: "Ethereum address or ENS name (recipient)", type: "string" },
          chainId: { minimum: 1, description: "Chain ID (e.g., 1 for mainnet)", type: "number" },
          amount: { minimum: 0, description: "Amount in ETH (decimal)", type: "number" }
        },
        additionalProperties: false,
        required: ["address", "amount"]
      },
      {
        description: "ERC-20 token transfer request based on EIP-681 URI scheme for scannable QR codes",
        examples: [
          {
            token: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
            address: "0xRecipientAddressHere",
            chainId: 1,
            amount: 10,
            decimals: 6
          }
        ],
        type: "object",
        properties: {
          token: { description: "ERC-20 token contract address", type: "string" },
          address: { description: "Recipient Ethereum address or ENS name", type: "string" },
          chainId: { minimum: 1, description: "Chain ID (e.g., 1 for mainnet)", type: "number" },
          amount: { minimum: 0, description: "Amount in token units (decimal)", type: "number" },
          decimals: { minimum: 0, description: "Token decimals (default: 18)", type: "number" }
        },
        additionalProperties: false,
        required: ["token", "address", "chainId", "amount", "decimals"]
      }
    ]
  };
}
function permuteSchema3() {
  return { examples: [{}], type: "object", properties: {}, additionalProperties: false };
}
function permute3(value = {}, options = {}) {
  return {
    total: 1,
    get(k) {
      return format3(value);
    }
  };
}
function format3(payment) {
  let { chainId = 1, amount, address, token, decimals } = payment;
  let uri = "ethereum:";
  if (token) {
    uri += encodeURIComponent(token);
    if (chainId) {
      uri += `@${chainId}`;
    }
    uri += `/transfer`;
    uri += `?address=${address}`;
    uri += `&uint256=${amount}e${decimals}`;
  } else {
    uri += encodeURIComponent(address);
    if (chainId) {
      uri += `@${chainId}`;
    }
    if (amount) {
      uri += `?value=${amount}e18`;
    }
  }
  return uri;
}
function preview3(value) {
  let commons = {
    "1": "Ethereum",
    "56": "BNB",
    "8453": "Base",
    "42161": "Arbitrum",
    "43114": "Avax",
    "137": "Polygon"
  };
  let chain = commons[`${value.chainId}`] ?? "EVM";
  return chain;
}
function icon3(value) {
  if (`${value.chainId}` == "1") {
    return {
      d: [
        "m10 14.296 5.287-3.131L10 18.588l-5.287-7.423L10 14.296Z",
        `m10 1.412 5.268 8.745L10 13.264l-5.268-3.107L10 1.412Z`
      ],
      scale: 1 / 20
    };
  } else {
    return {
      d: ["M3.116 5.809a1.73 1.73 0 0 1 1.721-1.721h10.326a1.73 1.73 0 0 1 1.721 1.721 2.86 2.86 0 0 0-1.721-.574H4.837a2.858 2.858 0 0 0-1.721.574Zm0 2.294a1.73 1.73 0 0 1 1.721-1.721h10.326a1.73 1.73 0 0 1 1.721 1.721 2.859 2.859 0 0 0-1.721-.573H4.837c-.62-.001-1.225.2-1.721.573Zm4.589.574c.42 0 .765.345.765.765 0 .839.691 1.53 1.53 1.53.839 0 1.53-.691 1.53-1.53 0-.42.345-.765.765-.765h2.868a1.73 1.73 0 0 1 1.721 1.721v4.207c0 .944-.777 1.72-1.721 1.72H4.837a1.729 1.729 0 0 1-1.721-1.72v-4.207a1.73 1.73 0 0 1 1.721-1.721h2.868Z"],
      scale: 1 / 20
    };
  }
}

// src/data/formats/phone.js
function valueSchema4() {
  return {
    description: "Call a phone number with optional extension",
    examples: [{ number: "9999999999", countryCode: 1 }],
    type: "object",
    properties: {
      number: {
        pattern: "[0-9]+",
        description: "local number only. non-numeric chars are ignored",
        type: "string"
      },
      countryCode: {
        pattern: "[0-9]+",
        description: "numeric country code. [list](https://countrycode.org/)",
        type: "string"
      },
      extension: { pattern: "[0-9]+", description: "optional extension", type: "string" }
    },
    additionalProperties: false,
    required: ["number"]
  };
}
function permuteSchema4() {
  return {
    description: "Per [RFC 3966](https://www.rfc-editor.org/rfc/rfc3966.html), spacers `.-()` are ignored, enabling safe permutation possibilities",
    examples: [
      {
        validSpacers: ["-", "."],
        parenGroups: true,
        prefixCaps: false,
        groupings: [[3, 3, 4]]
      }
    ],
    type: "object",
    properties: {
      validSpacers: {
        uniqueItems: true,
        default: ["-", "."],
        type: "array",
        items: { enum: ["-", "."], type: "string" }
      },
      prefixCaps: { type: "boolean" },
      parenGroups: { type: "boolean" },
      groupings: {
        default: [[3, 3, 4]],
        examples: [[[3, 3, 2, 2], [5, 5]], [[3, 3, 4], [3, 4, 3]]],
        type: "array",
        items: { type: "array", items: { minimum: 1, maximum: 9, type: "integer" } }
      }
    },
    additionalProperties: false
  };
}
function permute4(value, options = {}) {
  const { countryCode, extension, number } = value;
  let {
    validSpacers = ["-", "."],
    groupings = [[3, 3, 4]],
    parenGroups = false
  } = options;
  validSpacers = ["", ...validSpacers];
  const subPermutes = [];
  let cumulative = 0;
  for (let grouping of groupings) {
    if (countryCode && countryCode > 0) {
      let country_len = `${countryCode}`.length;
      grouping = [country_len, ...grouping];
    }
    const groupCount = grouping.length;
    const spacersPerGroup = groupCount - 1;
    const spacerOptions = validSpacers.length;
    const parenOpt = parenGroups ? 2 : 1;
    const subTotal = Math.pow(spacerOptions, spacersPerGroup) * Math.pow(parenOpt, groupCount);
    const subGet = function(grouping2) {
      function splitNumber(num, grouping3) {
        let result = [];
        let index = 0;
        let group_i = 0;
        for (let size of grouping3) {
          let end = group_i == grouping3.length - 1 ? num.length : index + size;
          result.push(num.slice(index, end));
          index += size;
          group_i++;
        }
        return result;
      }
      return function(subK) {
        if (subK < 0 || subK >= subTotal)
          throw new Error("Invalid");
        let full_num = countryCode && countryCode > 0 ? `${countryCode}${number}` : `${number}`;
        let groups = splitNumber(full_num, grouping2);
        let result = countryCode && countryCode > 0 ? `tel:+` : "tel:";
        let spacerChoices = [];
        for (let i = 0;i < spacersPerGroup; i++) {
          spacerChoices.push(validSpacers[Math.floor(subK / Math.pow(spacerOptions, i)) % spacerOptions]);
        }
        let parenChoices = [];
        if (parenGroups) {
          for (let i = 0;i < groupCount; i++) {
            parenChoices.push(Math.floor(subK / Math.pow(spacerOptions, spacersPerGroup) / Math.pow(parenOpt, i)) % 2 === 1);
          }
        } else {
          parenChoices = new Array(groupCount).fill(false);
        }
        for (let i = 0;i < groups.length; i++) {
          let group = groups[i];
          if (parenChoices[i]) {
            result += `(${group})`;
          } else {
            result += group;
          }
          if (i < groups.length - 1) {
            result += spacerChoices[i] || "";
          }
        }
        if (extension) {
          result += `;ext=${extension}`;
        }
        return result;
      };
    }(grouping);
    subPermutes.push({ start: cumulative, total: subTotal, get: subGet });
    cumulative += subTotal;
  }
  const total = cumulative;
  function get(k) {
    if (k < 0 || k >= total)
      throw new Error("Invalid permutation index");
    let current = k;
    for (let sub of subPermutes) {
      if (current < sub.total) {
        return sub.get(current);
      }
      current -= sub.total;
    }
  }
  return {
    total,
    get
  };
}
function format4(value) {
  return permute4(value, {
    validSpacers: ["-"],
    prefixCaps: false,
    groupings: [[3, 3, 4]]
  }).get(0);
}
function preview4(value) {
  return "Call";
}
function icon4() {
  return {
    d: [
      `M2 3.5A1.5 1.5 0 0 1 3.5 2h1.148a1.5 1.5 0 0 1 1.465 1.175l.716 3.223a1.5 1.5 0 0 1-1.052 1.767l-.933.267c-.41.117-.643.555-.48.95a11.542 11.542 0 0 0 6.254 6.254c.395.163.833-.07.95-.48l.267-.933a1.5 1.5 0 0 1 1.767-1.052l3.223.716A1.5 1.5 0 0 1 18 15.352V16.5a1.5 1.5 0 0 1-1.5 1.5H15c-1.149 0-2.263-.15-3.326-.43A13.022 13.022 0 0 1 2.43 8.326 13.019 13.019 0 0 1 2 5V3.5Z`
    ],
    scale: 1 / 20
  };
}

// src/data/formats/event.js
function valueSchema5() {
  return {
    description: "Event information based on VEvent spec for iCal links in QR codes",
    examples: [
      {
        summary: "Team Meeting",
        description: "Discuss project updates",
        location: "Conference Room A",
        start: "2025-08-15T10:00:00Z",
        end: "2025-08-15T11:00:00Z",
        url: "https://example.com/meeting",
        organizer: "mailto:organizer@example.com",
        geo: { latitude: 37.7749, longitude: -122.4194 },
        categories: ["work", "meeting"],
        status: "CONFIRMED",
        uid: "team-meeting@example.com",
        dtstamp: "2025-08-01T12:00:00Z"
      }
    ],
    type: "object",
    properties: {
      summary: { type: "string" },
      description: { type: "string" },
      location: { type: "string" },
      start: { description: "ISO 8601 date-time or date", type: "string" },
      end: {
        description: "ISO 8601 date-time or date (mutually exclusive with duration)",
        type: "string"
      },
      duration: { description: "ISO 8601 duration (mutually exclusive with end)", type: "string" },
      url: { type: "string" },
      organizer: { description: "Email or CAL-ADDRESS format", type: "string" },
      geo: {
        type: "object",
        properties: {
          latitude: { minimum: -90, maximum: 90, type: "number" },
          longitude: { minimum: -180, maximum: 180, type: "number" }
        },
        additionalProperties: false,
        required: ["latitude", "longitude"]
      },
      categories: { type: "array", items: { type: "string" } },
      status: { enum: ["TENTATIVE", "CONFIRMED", "CANCELLED"] },
      uid: {
        description: "Unique ID for this event. Omit for a deterministic ID derived from the event values, pass a string to set it manually, or pass `true` to generate a UUID.",
        oneOf: [{ type: "string" }, { type: "boolean" }],
        tsType: "string | boolean"
      },
      dtstamp: {
        description: "ISO 8601 date-time for the iCalendar DTSTAMP field. Defaults to the current time.",
        type: "string",
        tsType: "string | Date"
      }
    },
    additionalProperties: false,
    required: ["summary", "start"]
  };
}
function permuteSchema5() {
  return { examples: [{}], type: "object", properties: {}, additionalProperties: false };
}
function permute5(value = {}, options = {}) {
  return {
    total: 1,
    get(k) {
      return format5(value);
    }
  };
}
function format5(event) {
  let lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//QRSART",
    "BEGIN:VEVENT"
  ];
  lines.push(`UID:${eventUID(event)}`);
  lines.push(`DTSTAMP:${formatDateTimeForICal(event.dtstamp || new Date)}`);
  lines.push(`SUMMARY:${escapeValue(event.summary)}`);
  let dtstart = formatDateForICal(event.start);
  if (!event.start.includes("T"))
    dtstart = `;VALUE=DATE:${dtstart}`;
  else
    dtstart = `:${dtstart}`;
  lines.push(`DTSTART${dtstart}`);
  if (event.end) {
    let dtend = formatDateForICal(event.end);
    if (!event.end.includes("T"))
      dtend = `;VALUE=DATE:${dtend}`;
    else
      dtend = `:${dtend}`;
    lines.push(`DTEND${dtend}`);
  } else if (event.duration) {
    lines.push(`DURATION:${event.duration}`);
  }
  if (event.description)
    lines.push(`DESCRIPTION:${escapeValue(event.description)}`);
  if (event.location)
    lines.push(`LOCATION:${escapeValue(event.location)}`);
  if (event.url)
    lines.push(`URL:${escapeValue(event.url)}`);
  if (event.organizer)
    lines.push(`ORGANIZER:${escapeValue(event.organizer)}`);
  if (event.geo)
    lines.push(`GEO:${event.geo.latitude};${event.geo.longitude}`);
  if (event.categories)
    lines.push(`CATEGORIES:${event.categories.map(escapeValue).join(",")}`);
  if (event.status)
    lines.push(`STATUS:${event.status}`);
  lines.push("END:VEVENT", "END:VCALENDAR");
  return lines.join(`
`);
}
function formatDateTimeForICal(date) {
  if (date instanceof Date)
    date = date.toISOString();
  return `${date}`.replace(/[-:]/g, "").slice(0, 15) + "Z";
}
function eventUID(event) {
  if (event.uid === true)
    return `${crypto.randomUUID()}@QRS.ART`;
  if (event.uid)
    return escapeValue(`${event.uid}`);
  const identity = [
    event.summary,
    event.start,
    event.end || event.duration,
    event.location,
    event.url
  ].filter(Boolean).join("|");
  return `event-${fnv1a(identity)}@QRS.ART`;
}
function fnv1a(value) {
  let hash = 2166136261;
  for (let i = 0;i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}
function preview5(value) {
  return "Event";
}
function icon5() {
  return {
    d: [
      `M5.75 2c.411 0 .75.339.75.75V4h7V2.75c0-.411.339-.75.75-.75s.75.339.75.75V4h.25A2.763 2.763 0 0 1 18 6.75v8.5A2.763 2.763 0 0 1 15.25 18H4.75A2.763 2.763 0 0 1 2 15.25v-8.5A2.763 2.763 0 0 1 4.75 4H5V2.75c0-.411.339-.75.75-.75Zm-1 5.5c-.69 0-1.25.56-1.25 1.25v6.5c0 .69.56 1.25 1.25 1.25h10.5c.69 0 1.25-.56 1.25-1.25v-6.5c0-.69-.56-1.25-1.25-1.25H4.75Z`
    ],
    scale: 1 / 20
  };
}

// src/data/formats/geo.js
function valueSchema6() {
  return {
    description: "Link to a location using latitude and longitude",
    examples: [{ latitude: 38.71482, longitude: 115.44185 }],
    type: "object",
    properties: {
      latitude: { minimum: -90, maximum: 90, type: "number" },
      longitude: { minimum: -180, maximum: 180, type: "number" },
      altitude: { type: "number" }
    },
    additionalProperties: false,
    required: ["latitude", "longitude"]
  };
}
function permuteSchema6() {
  return {
    description: "Iterate over ~equal coordinates that point to the same location",
    examples: [{ prefixCaps: true, varyPrecision: true, maxDecimals: 10, precision: 5 }],
    type: "object",
    properties: {
      prefixCaps: { type: "boolean" },
      varyPrecision: { type: "boolean" },
      maxDecimals: { type: "integer" },
      precision: { type: "integer" }
    },
    additionalProperties: false
  };
}
function permute6(value = {}, options = {}) {
  let { latitude, longitude, altitude } = value;
  let { prefixCaps = false, varyPrecision = false, maxDecimals = 10, precision = 5 } = options;
  function coordComponent(x, vary = false) {
    x = (+x).toFixed(precision);
    let needed_digits = x.split(".")[1].replace(/0+$/, "").length;
    return {
      total: vary ? Math.max(1, maxDecimals - needed_digits + 1) : 1,
      get: (k) => {
        const dec = precision + k;
        return parseFloat(x).toFixed(needed_digits + k);
      }
    };
  }
  return permute_group([
    permute_casing("geo:", { any_casing: prefixCaps }),
    coordComponent(latitude, varyPrecision),
    ",",
    coordComponent(longitude, varyPrecision),
    altitude && altitude !== 0 ? "," + altitude : ""
  ], { join: "" });
}
function format6(value) {
  return permute6(value).get(0);
}
function preview6(value) {
  return "Location";
}
function icon6() {
  return {
    d: [
      `m9.69 18.933.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 0 0 .281-.14c.186-.096.446-.24.757-.433.62-.384 1.445-.966 2.274-1.765C15.302 14.988 17 12.493 17 9A7 7 0 1 0 3 9c0 3.492 1.698 5.988 3.355 7.584a13.731 13.731 0 0 0 2.273 1.765 11.842 11.842 0 0 0 .976.544l.062.029.018.008.006.003ZM10 11.25a2.25 2.25 0 1 0 0-4.5 2.25 2.25 0 0 0 0 4.5Z`
    ],
    scale: 1 / 20
  };
}

// src/data/formats/sms.js
function valueSchema7() {
  return {
    description: "Send an SMS text with an optional message",
    examples: [{ number: "9999999999", countryCode: 1, message: "Hello" }],
    type: "object",
    properties: {
      number: {
        pattern: "[0-9]+",
        description: "local number only. non-numeric chars are ignored",
        type: "string"
      },
      countryCode: {
        pattern: "[0-9]+",
        description: "numeric country code. [list](https://countrycode.org/)",
        type: "string"
      },
      message: { description: "optional message template", type: "string" }
    },
    additionalProperties: false,
    required: ["number"]
  };
}
function permuteSchema7() {
  return {
    examples: [{ validSpacers: ["-", "."], prefixCaps: false, groupings: [[3, 3, 4]] }],
    type: "object",
    properties: {
      prefixCaps: { description: "`8` permute casing of `sms`", type: "boolean" },
      queryCaps: { description: "`16` permute casing of `body`", type: "boolean" },
      validSpacers: {
        uniqueItems: true,
        default: ["-", "."],
        description: "`N^M` valid spacers `-.()` per spec",
        type: "array",
        items: { enum: ["-", "."], type: "string" }
      },
      groupings: {
        default: [[3, 3, 4]],
        examples: [[[3, 3, 2, 2], [5, 5]], [[3, 3, 4], [3, 4, 3]]],
        description: "`N^M` indexes for spacers to divide numbers. not deduped",
        type: "array",
        items: { type: "array", items: { minimum: 1, maximum: 9, type: "integer" } }
      }
    },
    additionalProperties: false
  };
}
function permute7(value = {}, options = {}) {
  const { countryCode, number, message } = value;
  let {
    validSpacers = ["-", "."],
    groupings = [[3, 3, 4]],
    prefixCaps,
    queryCaps
  } = options;
  const prefixComp = permute_casing("sms:", { same_casing: prefixCaps });
  const phoneComp = permute4({ countryCode, number }, {
    validSpacers,
    groupings,
    parenGroups: false
  });
  const messageComp = message && message.length > 0 ? permute_group([
    permute_casing("?body=", { any_casing: queryCaps }),
    encodeURIComponent(message)
  ]) : "";
  return permute_group([
    prefixComp,
    { get: (k) => phoneComp.get(k).substring(4), total: phoneComp.total },
    messageComp
  ]);
}
function format7(value) {
  return permute7(value, {
    validSpacers: ["-"],
    prefixCaps: false,
    queryCaps: false,
    groupings: [[3, 3, 4]]
  }).get(0);
}
function preview7(value) {
  return "Message";
}
function icon7() {
  return {
    d: [
      `M2 10c0-3.967 3.69-7 8-7 4.31 0 8 3.033 8 7s-3.69 7-8 7a9.165 9.165 0 0 1-1.504-.123 5.976 5.976 0 0 1-3.935 1.107.75.75 0 0 1-.584-1.143 3.478 3.478 0 0 0 .522-1.756C2.979 13.825 2 12.025 2 10Z`
    ],
    scale: 1 / 20
  };
}

// src/data/formats/url.js
function valueSchema8() {
  return {
    oneOf: [
      {
        title: "URL String",
        examples: [{ url: "https://qrs.art" }],
        type: "object",
        properties: {
          url: {
            examples: ["https://qrs.art"],
            description: "URL string. Normalized and parsed with `new URL(...)`",
            type: "string"
          }
        },
        additionalProperties: false,
        required: ["url"]
      },
      {
        title: "URL Object",
        description: "Ideal for granular permutations",
        examples: [{ protocol: "https", hostname: "qrs.art", search: "?page=1" }],
        type: "object",
        properties: {
          protocol: {
            examples: ["https"],
            description: 'Protocol string `"https"`',
            type: "string"
          },
          hostname: {
            examples: ["qrs.art"],
            description: 'Hostname string `"qrs.art"`',
            type: "string"
          },
          pathname: {
            examples: ["/studio"],
            description: 'Pathname string `"/studio"`',
            type: "string"
          },
          search: {
            examples: ["?page=1"],
            description: 'Query string `"?page=1"`. combined with `query`',
            type: "string"
          },
          query: {
            description: "Query object `{ page: 1}`. combined with `search`",
            type: "object",
            properties: {},
            additionalProperties: false
          },
          hash: {
            examples: ["#content"],
            description: 'Hash (not seen by server) `"#content"`',
            type: "string"
          }
        },
        additionalProperties: false,
        required: ["protocol", "hostname"]
      }
    ]
  };
}
function permuteSchema8() {
  return {
    description: "URLs are safely case-insenstive for both the *protocol* and *hostname*.",
    examples: [{ protocolCaps: true, hostnameCaps: true }],
    type: "object",
    properties: {
      protocolCaps: { description: "Flag to permute casing of protocol `2^N`", type: "boolean" },
      hostnameCaps: { description: "Flag to permute casing of hostname `2^N`", type: "boolean" },
      searchOrdering: { description: "Flag to reorder search string parameters `N!`", type: "boolean" }
    },
    additionalProperties: false
  };
}
function normalizeSearch(search = "", query) {
  const hasQuery = query && typeof query === "object" && Object.keys(query).length > 0;
  if (!hasQuery) {
    return search;
  }
  const params = new URLSearchParams(search);
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined) {
      continue;
    }
    if (Array.isArray(value)) {
      for (const item of value) {
        if (item !== undefined) {
          params.append(key, item);
        }
      }
    } else {
      params.append(key, value);
    }
  }
  const normalized = params.toString();
  return normalized ? `?${normalized}` : "";
}
function permuteSearch(search = "", searchOrdering = false) {
  if (!searchOrdering) {
    return search;
  }
  const items = Array.from(new URLSearchParams(search).entries());
  if (items.length <= 1) {
    return search;
  }
  const orders = generateOrderings(items.length);
  return {
    total: orders.length,
    get: (k) => {
      const params = new URLSearchParams;
      for (const itemIndex of orders[k]) {
        const [key, value] = items[itemIndex];
        params.append(key, value);
      }
      return `?${params.toString()}`;
    }
  };
}
function deconstructURL(value) {
  if (typeof value == "string" || value.url) {
    value = new URL(typeof value == "string" ? value : value.url);
  }
  let { protocol = "https:", hostname, pathname = "", search = "", query, hash = "" } = value;
  if (!protocol.endsWith(":")) {
    protocol = protocol + ":";
  }
  search = normalizeSearch(search, query);
  return { protocol, hostname, pathname, search, hash };
}
function permute8(value, options = {}) {
  let { protocol = "https:", hostname, pathname = "", search = "", hash = "" } = deconstructURL(value);
  const { protocolCaps = false, hostnameCaps = false, searchOrdering = false } = options;
  const protocolComp = permute_casing(protocol, { any_casing: protocolCaps });
  const hostnameComp = permute_casing(hostname, { any_casing: hostnameCaps });
  const pathComp = !pathname || pathname.length == 0 || pathname == "/" ? permute_options(["", "/"]) : pathname;
  const searchComp = permuteSearch(search, searchOrdering);
  const combined = permute_group([protocolComp, "//", hostnameComp, pathComp, searchComp, hash]);
  return {
    total: combined.total,
    get: (k) => combined.get(k)
  };
}
function format8(value) {
  return permute8(value, {
    protocolCaps: true,
    hostnameCaps: true
  }).get(0);
}
function preview8(value) {
  let { hostname = "" } = deconstructURL(value);
  return hostname.toLowerCase();
}
function icon8() {
  return {
    d: [
      `M12.232 4.232a2.5 2.5 0 0 1 3.536 3.536l-1.225 1.224a.75.75 0 0 0 1.061 1.06l1.224-1.224a4 4 0 0 0-5.656-5.656l-3 3a4 4 0 0 0 .225 5.865.75.75 0 0 0 .977-1.138 2.5 2.5 0 0 1-.142-3.667l3-3Z`,
      `M11.603 7.963a.75.75 0 0 0-.977 1.138 2.5 2.5 0 0 1 .142 3.667l-3 3a2.5 2.5 0 0 1-3.536-3.536l1.225-1.224a.75.75 0 0 0-1.061-1.06l-1.224 1.224a4 4 0 1 0 5.656 5.656l3-3a4 4 0 0 0-.225-5.865Z`
    ],
    scale: 1 / 20
  };
}

// src/data/formats/vcard.js
function valueSchema9() {
  return {
    description: "Contact information based on vCard spec for scannable QR codes",
    examples: [
      {
        fullName: "John Doe",
        givenName: "John",
        familyName: "Doe",
        organization: "Example Corp",
        title: "Software Engineer",
        phones: [{ value: "+1-123-456-7890", type: "work" }],
        emails: [{ value: "john.doe@example.com", type: "work" }],
        addresses: [
          {
            street: "123 Main St",
            locality: "Anytown",
            region: "CA",
            postalCode: "12345",
            country: "USA",
            type: "work"
          }
        ],
        url: "https://example.com",
        note: "Met at conference",
        birthday: "1980-01-01"
      }
    ],
    type: "object",
    properties: {
      fullName: { type: "string" },
      givenName: { type: "string" },
      familyName: { type: "string" },
      organization: { type: "string" },
      title: { type: "string" },
      photo: {
        type: "object",
        properties: { type: { enum: ["JPEG", "PNG", "GIF", "SVG+XML"] }, base64: { type: "string" } },
        additionalProperties: false,
        required: ["type", "base64"]
      },
      phones: {
        type: "array",
        items: {
          type: "object",
          properties: {
            value: { type: "string" },
            type: { enum: ["home", "work", "mobile", "fax", "other"] }
          },
          additionalProperties: false,
          required: ["value"]
        }
      },
      emails: {
        type: "array",
        items: {
          type: "object",
          properties: { value: { type: "string" }, type: { enum: ["home", "work", "other"] } },
          additionalProperties: false,
          required: ["value"]
        }
      },
      addresses: {
        type: "array",
        items: {
          type: "object",
          properties: {
            street: { type: "string" },
            locality: { type: "string" },
            region: { type: "string" },
            postalCode: { type: "string" },
            country: { type: "string" },
            type: { enum: ["home", "work", "other"] }
          },
          additionalProperties: false
        }
      },
      url: { type: "string" },
      note: { type: "string" },
      birthday: { description: "ISO 8601 date", type: "string" },
      uid: {
        description: "Stable contact UID. Use `true` to generate a UUID, or pass a string to keep output deterministic.",
        oneOf: [{ type: "string" }, { type: "boolean" }],
        tsType: "string | boolean"
      },
      rev: {
        description: "Revision timestamp. Use `true` for the current time, or pass an ISO date-time string or Date for deterministic output.",
        oneOf: [{ type: "string" }, { type: "boolean" }],
        tsType: "string | boolean | Date"
      }
    },
    additionalProperties: false,
    required: ["fullName"]
  };
}
function permuteSchema9() {
  return { examples: [{}], type: "object", properties: {}, additionalProperties: false };
}
function permute9(value = {}, options = {}) {
  return {
    total: 1,
    get(k) {
      return format9(value);
    }
  };
}
function format9(contact) {
  let lines = ["BEGIN:VCARD", "VERSION:4.0"];
  lines.push(`FN:${escapeValue(contact.fullName)}`);
  if (contact.givenName || contact.familyName) {
    lines.push(`N:${escapeValue(contact.familyName || "")};${escapeValue(contact.givenName || "")};;;`);
  }
  if (contact.organization)
    lines.push(`ORG:${escapeValue(contact.organization)}`);
  if (contact.title)
    lines.push(`TITLE:${escapeValue(contact.title)}`);
  if (contact.phones) {
    contact.phones.forEach((phone) => {
      const type = phone.type ? `TYPE=${phone.type.toUpperCase()}` : "";
      lines.push(`TEL;${type}:${escapeValue(phone.value)}`);
    });
  }
  if (contact.emails) {
    contact.emails.forEach((email) => {
      const type = email.type ? `TYPE=${email.type.toUpperCase()}` : "";
      lines.push(`EMAIL;${type}:${escapeValue(email.value)}`);
    });
  }
  if (contact.photo) {
    lines.push(`PHOTO;ENCODING=b;TYPE=${contact.photo.type.toUpperCase()}:${contact.photo.base64}`);
  }
  if (contact.addresses) {
    contact.addresses.forEach((addr) => {
      const type = addr.type ? `TYPE=${addr.type.toUpperCase()}` : "";
      const street = escapeValue(addr.street || "");
      const locality = escapeValue(addr.locality || "");
      const region = escapeValue(addr.region || "");
      const postal = escapeValue(addr.postalCode || "");
      const country = escapeValue(addr.country || "");
      lines.push(`ADR;${type}:;;${street};${locality};${region};${postal};${country}`);
    });
  }
  if (contact.url)
    lines.push(`URL:${escapeValue(contact.url)}`);
  if (contact.note)
    lines.push(`NOTE:${escapeValue(contact.note)}`);
  if (contact.birthday)
    lines.push(`BDAY:${contact.birthday.replace(/-/g, "")}`);
  if (contact.uid) {
    const uid = contact.uid === true ? `urn:uuid:${crypto.randomUUID()}` : contact.uid;
    lines.push(`UID:${escapeValue(`${uid}`)}`);
  }
  if (contact.rev) {
    const rev = contact.rev === true ? new Date : contact.rev;
    lines.push(`REV:${formatDateTimeForVCard(rev)}`);
  }
  lines.push("END:VCARD");
  return lines.join(`
`);
}
function formatDateTimeForVCard(date) {
  if (date instanceof Date)
    date = date.toISOString();
  return `${date}`.replace(/[-:]/g, "").slice(0, 15) + "Z";
}
function preview9(value) {
  return "Contact";
}
function icon9() {
  return {
    d: [
      `M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-5.5-2.5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0ZM10 12a5.99 5.99 0 0 0-4.793 2.39A6.483 6.483 0 0 0 10 16.5a6.483 6.483 0 0 0 4.793-2.11A5.99 5.99 0 0 0 10 12Z`
    ],
    scale: 1 / 20
  };
}

// src/data/formats/wifi.js
function valueSchema10() {
  return {
    oneOf: [
      {
        title: "WPA (default)",
        description: "Option for most WiFi setups (residential, small business)",
        examples: [{ ssid: "GuestNet", pass: "8080808", type: "WPA" }],
        type: "object",
        properties: {
          ssid: { maxLength: 32, type: "string" },
          pass: { type: "string" },
          type: { enum: ["WPA"], type: "string" },
          hidden: { type: "boolean" },
          disableTransition: { enum: [0, 1], default: 0, type: "integer" }
        },
        additionalProperties: false,
        required: ["ssid", "pass", "type"]
      },
      {
        title: "No Password",
        description: "Open network with no password. Scanners may join it without prompting for credentials.",
        examples: [{ ssid: "FreeNet", type: "nopass" }],
        type: "object",
        properties: {
          ssid: { maxLength: 32, type: "string" },
          type: { enum: ["nopass"], type: "string" },
          hidden: { type: "boolean" }
        },
        additionalProperties: false,
        required: ["ssid"]
      },
      {
        title: "EAP",
        description: "Used for enterprise Wifi configurations",
        examples: [
          {
            ssid: "CorpoNet",
            pass: "S3cret",
            type: "WPA2-EAP",
            eap: "PEAP",
            anon: "anon@qrs.art",
            identity: "me@qrs.art",
            phase2: "MSCHAPV2"
          }
        ],
        type: "object",
        properties: {
          ssid: { maxLength: 32, type: "string" },
          pass: { type: "string" },
          type: { enum: ["WPA2-EAP"], type: "string" },
          hidden: { type: "boolean" },
          eap: { enum: ["TTLS", "PWD", "PEAP", "TLS", "AKA", "FAST", "SIM"], type: "string" },
          anon: { type: "string" },
          identity: { type: "string" },
          phase2: { enum: ["GTC", "NONE", "PAP", "MSCHAP", "MSCHAPV2"], type: "string" }
        },
        additionalProperties: false,
        required: ["ssid", "type", "eap"]
      }
    ]
  };
}
function permuteSchema10() {
  return {
    description: "WiFi payload permutations cover safe field reordering, optional default fields, prefix casing, and optional quoting.",
    examples: [{ ordering: true }],
    type: "object",
    properties: {
      ordering: { description: "`N!` flag to reorder each pair", type: "boolean" },
      prefixCaps: { description: "`2` WIFI, wifi", type: "boolean" },
      permute_H_false: { description: '`2` "H:false", "" for public networks', type: "boolean" },
      permute_R_0: { description: '`2` "R:0", "" for WPA2 networks', type: "boolean" },
      permute_quotes: { description: "`1,2` use quotes when not necessary", type: "boolean" }
    },
    additionalProperties: false
  };
}
function permute10(value, options) {
  let { type, hidden, ssid, pass, disableTransition, eap, anon, identity, phase2 } = value;
  let {
    ordering = true,
    prefixCaps = false,
    permute_H_false = false,
    permute_R_0 = false,
    permute_quotes = false
  } = options;
  if (!type) {
    if (pass) {
      type = "WPA";
    }
  }
  const prefix = permute_casing("WIFI", { same_casing: prefixCaps });
  const parts = [
    field("T", type),
    field("S", ssid, { quote: permute_quotes }),
    field("P", pass, { quote: permute_quotes, quoteIfHex: true, quoteIfSpecial: true }),
    hidden ? field("H", "true") : optionField("H", "false", permute_H_false),
    disableTransition === 1 ? field("R", "1") : optionField("R", "0", permute_R_0 || disableTransition === 0),
    field("E", eap),
    field("A", anon),
    field("I", identity),
    field("PH2", phase2)
  ].filter(Boolean);
  const orders = ordering ? generateOrderings(parts.length) : [parts.map((_, i) => i)];
  const variants = parts.map((part) => part.length);
  const variantTotal = variants.reduce((total, count) => total * count, 1);
  return {
    total: prefix.total * orders.length * variantTotal,
    get: (k) => {
      const prefixK = k % prefix.total;
      k = Math.floor(k / prefix.total);
      const order = orders[k % orders.length];
      k = Math.floor(k / orders.length);
      const selected = parts.map((part, i) => {
        const partK = k % variants[i];
        k = Math.floor(k / variants[i]);
        return part[partK];
      });
      return `${prefix.get(prefixK)}:${order.map((i) => selected[i]).filter(Boolean).join(";")};;`;
    }
  };
}
function field(key, value, { quote = false, quoteIfHex = false, quoteIfSpecial = false } = {}) {
  if (value === undefined || value === null || value === "")
    return null;
  const escaped = escapeWifiValue(value);
  const needsQuotes = quoteIfHex && /^[0-9A-F]+$/i.test(escaped) || quoteIfSpecial && /[\s\\,;":]/g.test(escaped);
  const values = [`${key}:${needsQuotes ? `"${escaped}"` : escaped}`];
  if (quote && !needsQuotes)
    values.push(`${key}:"${escaped}"`);
  return values;
}
function optionField(key, value, include) {
  return include ? [null, `${key}:${value}`] : null;
}
function escapeWifiValue(value) {
  return `${value}`.replace(/([\\,;":])/g, "\\$1");
}
function format10(value) {
  return permute10(value, { ordering: false }).get(0);
}
function preview10(value) {
  return `WiFi`;
}
function icon10() {
  return {
    d: [
      "M.676 6.941A12.964 12.964 0 0 1 10 3c3.657 0 6.963 1.511 9.324 3.941a.75.75 0 0 1-.008 1.053l-.353.354a.75.75 0 0 1-1.069-.008C15.894 6.28 13.097 5 10 5 6.903 5 4.106 6.28 2.106 8.34a.75.75 0 0 1-1.069.008l-.353-.354a.75.75 0 0 1-.008-1.053Zm2.825 2.833A8.976 8.976 0 0 1 10 7a8.976 8.976 0 0 1 6.499 2.774.75.75 0 0 1-.011 1.049l-.354.354a.75.75 0 0 1-1.072-.012A6.978 6.978 0 0 0 10 9c-1.99 0-3.786.83-5.061 2.165a.75.75 0 0 1-1.073.012l-.354-.354a.75.75 0 0 1-.01-1.05Zm2.82 2.84A4.989 4.989 0 0 1 10 11c1.456 0 2.767.623 3.68 1.614a.75.75 0 0 1-.022 1.039l-.354.354a.75.75 0 0 1-1.085-.026A2.99 2.99 0 0 0 10 13c-.88 0-1.67.377-2.22.981a.75.75 0 0 1-1.084.026l-.354-.354a.75.75 0 0 1-.021-1.039Zm2.795 2.752a1.248 1.248 0 0 1 1.768 0 .75.75 0 0 1 0 1.06l-.354.354a.75.75 0 0 1-1.06 0l-.354-.353a.75.75 0 0 1 0-1.06Z"
    ],
    scale: 1 / 20
  };
}

// src/data/index.js
var formats = ["bitcoin", "event", "wifi", "phone", "geo", "vcard", "ethereum", "sms", "url", "email"];
function bitcoinData(v) {
  return new DataType(v, format, permute, icon, preview);
}
function eventData(v) {
  return new DataType(v, format5, permute5, icon5, preview5);
}
function wifiData(v) {
  return new DataType(v, format10, permute10, icon10, preview10);
}
function phoneData(v) {
  return new DataType(v, format4, permute4, icon4, preview4);
}
function geoData(v) {
  return new DataType(v, format6, permute6, icon6, preview6);
}
function vcardData(v) {
  return new DataType(v, format9, permute9, icon9, preview9);
}
function ethereumData(v) {
  return new DataType(v, format3, permute3, icon3, preview3);
}
function smsData(v) {
  return new DataType(v, format7, permute7, icon7, preview7);
}
function urlData(v) {
  return new DataType(v, format8, permute8, icon8, preview8);
}
function emailData(v) {
  return new DataType(v, format2, permute2, icon2, preview2);
}
function qrData(type, value) {
  let datatypes = {
    bitcoin: bitcoinData,
    event: eventData,
    wifi: wifiData,
    phone: phoneData,
    geo: geoData,
    vcard: vcardData,
    ethereum: ethereumData,
    sms: smsData,
    url: urlData,
    email: emailData
  };
  return datatypes[type](value);
}
function formatData(type, value) {
  const formats2 = {
    bitcoin: format,
    event: format5,
    wifi: format10,
    phone: format4,
    geo: format6,
    vcard: format9,
    ethereum: format3,
    sms: format7,
    url: format8,
    email: format2
  };
  return formats2[type](value);
}
function permuteData(type, value, options) {
  const permutations = {
    bitcoin: permute,
    event: permute5,
    wifi: permute10,
    phone: permute4,
    geo: permute6,
    vcard: permute9,
    ethereum: permute3,
    sms: permute7,
    url: permute8,
    email: permute2
  };
  return new PermutationSet(permutations[type](value, options));
}
function previewData(type, value) {
  const previews = {
    bitcoin: preview,
    event: preview5,
    wifi: preview10,
    phone: preview4,
    geo: preview6,
    vcard: preview9,
    ethereum: preview3,
    sms: preview7,
    url: preview8,
    email: preview2
  };
  return previews[type](value);
}
function iconData(type, value) {
  const icons = {
    bitcoin: icon,
    event: icon5,
    wifi: icon10,
    phone: icon4,
    geo: icon6,
    vcard: icon9,
    ethereum: icon3,
    sms: icon7,
    url: icon8,
    email: icon2
  };
  return icons[type](value);
}
function schemaData(type) {
  const valueSchemas = {
    bitcoin: valueSchema,
    event: valueSchema5,
    wifi: valueSchema10,
    phone: valueSchema4,
    geo: valueSchema6,
    vcard: valueSchema9,
    ethereum: valueSchema3,
    sms: valueSchema7,
    url: valueSchema8,
    email: valueSchema2
  };
  const permuteSchemas = {
    bitcoin: permuteSchema,
    event: permuteSchema5,
    wifi: permuteSchema10,
    phone: permuteSchema4,
    geo: permuteSchema6,
    vcard: permuteSchema9,
    ethereum: permuteSchema3,
    sms: permuteSchema7,
    url: permuteSchema8,
    email: permuteSchema2
  };
  return {
    value: valueSchemas[type](),
    permute: permuteSchemas[type]()
  };
}

// src/index.js
function parseMask(mask) {
  if (Number.isInteger(mask) && mask >= 0 && mask <= 7) {
    return mask;
  }
  return -1;
}
function* iterateQRs(data2, encodingOptions = {}) {
  let dat = data2.toString();
  let { icon: icon11, preview: preview11 } = data2;
  let { version, ecl } = optimalStrategy(dat, encodingOptions);
  for (let strategy of allStrategies(dat, version, ecl)) {
    let codewords = new CodewordSequence(dat, strategy, version, ecl);
    let qr = new QR({ version, ecl, codewords, mask: 0, icon: icon11, preview: preview11, data: dat });
    yield qr;
    for (let m = 1;m < 8; m++) {
      qr.mask = m;
      yield qr;
    }
  }
}
function createQR(data2, options = {}) {
  let { mask, ...encodingOptions } = options;
  mask = parseMask(mask);
  let dat = data2.toString();
  let { icon: icon11, preview: preview11 } = data2;
  let { strategy, version, ecl } = optimalStrategy(dat, encodingOptions);
  let codewords = new CodewordSequence(dat, strategy, version, ecl);
  if (mask == -1) {
    let qr = new QR({ version, ecl, codewords, mask: 0, icon: icon11, preview: preview11, data: dat });
    let best = [standardPenalty(qr.grid).scores.penalty, 0];
    for (let m = 1;m < 8; m++) {
      qr.mask = m;
      let penalty = standardPenalty(qr.grid).scores.penalty;
      if (penalty < best[0]) {
        best = [penalty, m];
      }
    }
    qr.mask = best[1];
    return qr;
  } else {
    return new QR({ version, ecl, codewords, mask, icon: icon11, preview: preview11, data: dat });
  }
}
export {
  wifiData,
  vcardData,
  urlData,
  tileClusters,
  supportsKanji,
  standardPenalty,
  smsData,
  schemaData,
  rectPath,
  qrData,
  previewData,
  phoneData,
  permuteData,
  penStrokes,
  packShapes,
  optimalStrategy,
  naiveStrategy,
  minStrategy,
  iterateQRs,
  iconData,
  getNumRawDataModules,
  getNumDataCodewords,
  getMaskGrid,
  getIconBox,
  getFunctionalGrid,
  getDataPath,
  getAlignmentPositions,
  geoData,
  formats,
  formatData,
  findMinimumVersion,
  findFits,
  eventData,
  ethereumData,
  emailData,
  drawSVG,
  drawFinders,
  drawDots,
  drawAligns,
  createQR,
  circlePath,
  boxPath,
  bitcoinData,
  allStrategies,
  TopN,
  Strategy,
  QR,
  MODES,
  MASKS,
  Leaderboard,
  Grid,
  ECLS,
  CodewordSequence,
  BottomN
};
