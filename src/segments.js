import { ECLS } from "./utils/ecls.js";
import { modes, appendBits } from "./utils/modes.js";
import { reedSolomonComputeDivisor, reedSolomonComputeRemainder } from "./utils/reed-solomon.js";

export function optimalStrategy(str,{
  minVersion = 1,
  maxVersion = 40,
  minEcl = 0,
  maxEcl = 3
}={}){
  let version = minVersion;
  let ecl = minEcl;
  let minimalSeg;


  if (modes['numeric'].charCost('1') * str.length > getNumDataCodewords(maxVersion, ecl) * 8) {
    throw new Error('Data too long');
  }

  // Find the smallest version that fits the minimal segmentation
  for (; version <= maxVersion; version++) {
    const dataCapacityBits = getNumDataCodewords(version, ecl) * 8;
    if(version == minVersion || version == 10 || version == 27){
      minimalSeg = findMinimalSegmentation(str, version);
    }
    if (minimalSeg && minimalSeg.cost <= dataCapacityBits) break;
  }

  if (!minimalSeg || minimalSeg.cost > getNumDataCodewords(version, ecl) * 8 || version > maxVersion) {
    throw new Error('Data too long');
  }

  // Maximize ECL
  for (let i = ecl + 1; i <= maxEcl; i++) {
    if(minimalSeg.cost <= getNumDataCodewords(version, i) * 8){
      ecl = i
    } else break;
  }

  return {
    version,
    ecl,
    codewords: constructCodewords(str, minimalSeg, version, ecl),
    strategy: minimalSeg,
  };
}


export function *allStrategies(str, version, ecl) {
  const dataCapacityBits = getNumDataCodewords(version, ecl) * 8;
  const n = str.length;

  const stack = [{ index: 0, strategy: new Strategy() }];

  while (stack.length) {
    const { index, strategy } = stack.pop();

    if (index === n) {
      yield strategy;
      continue;
    }

    for (const mode of ['byte','alpha','numeric']) {
      const charCost = modes[mode].charCost(str[index]);
      if (charCost === Infinity) continue;

      const headerBits = strategy.lastMode === mode ? 0 : 4 + modes[mode].numCharCountBits(version);
      let newCost = strategy.cost + headerBits + charCost;
      if (strategy.lastMode !== mode) newCost = Math.ceil(newCost);

      const estimatedRemainingCost = (n - 1 - index) * (10 / 3);
      if (newCost > dataCapacityBits - estimatedRemainingCost) continue;

      const newStrategy = strategy.addStep(mode, newCost);
      stack.push({ index: index + 1, strategy: newStrategy });
    }
  }
}


export function findMinimalSegmentation(str, version) {
  const n = str.length;
  const dp = Array(n + 1).fill().map(() => ({}));
  dp[0][''] = new Strategy();

  for (let i = 1; i <= n; i++) {
    for (const prevMode in dp[i - 1]) {
      const prev = dp[i - 1][prevMode];
      for (const mode of ['numeric', 'alpha', 'byte']) {
        const charCost = modes[mode].charCost(str[i - 1]);
        if (charCost === Infinity) continue;

        const headerBits = prev.lastMode === mode ? 0 : 4 + modes[mode].numCharCountBits(version);
        let newCost = prev.cost + headerBits + charCost;
        if (prev.lastMode !== mode) newCost = Math.ceil(newCost);

        const next = prev.addStep(mode, newCost);
        const existing = dp[i][mode];

        if (!existing || next.cost < existing.cost) {
          dp[i][mode] = next;
        }
      }
    }
  }

  const final = dp[n];
  let best = null;

  for (const mode in final) {
    if (!best || final[mode].cost < best.cost) {
      best = final[mode];
    }
  }

  return best;
}

export function constructCodewords(str, strategy, version, ecl) {

  let segs = splitIntoSegments(str,strategy)
  let bb = [];
  for (const { mode, str } of segs) {
      appendBits(modes[mode].modeBits, 4, bb);
      appendBits(str.length, modes[mode].numCharCountBits(version), bb);
      for (const b of modes[mode].write(str))
          bb.push(b);
  }
  const dataCapacityBits = getNumDataCodewords(version, ecl) * 8;
  appendBits(0, Math.min(4, dataCapacityBits - bb.length), bb);
  appendBits(0, (8 - bb.length % 8) % 8, bb);
  for (let padByte = 0xEC; bb.length < dataCapacityBits; padByte ^= 0xEC ^ 0x11)
      appendBits(padByte, 8, bb);
  let dataCodewords = [];
  while (dataCodewords.length * 8 < bb.length)
      dataCodewords.push(0);
  bb.forEach((b, i) => dataCodewords[i >>> 3] |= b << (7 - (i & 7)));
  const numBlocks = ECLS[ecl].num_ecc_blocks[version]
  const blockEccLen = ECLS[ecl].codewords_per_block[version]
  const rawCodewords = Math.floor(getNumRawDataModules(version) / 8);
  const numShortBlocks = numBlocks - rawCodewords % numBlocks;
  const shortBlockLen = Math.floor(rawCodewords / numBlocks);
  let blocks = [];
  const rsDiv = reedSolomonComputeDivisor(blockEccLen);
  for (let i = 0, k = 0; i < numBlocks; i++) {
      let dat = dataCodewords.slice(k, k + shortBlockLen - blockEccLen + (i < numShortBlocks ? 0 : 1));
      k += dat.length;
      const ecc = reedSolomonComputeRemainder(dat, rsDiv);
      if (i < numShortBlocks)
          dat.push(0);
      blocks.push(dat.concat(ecc));
  }
  let result = [];
  for (let i = 0; i < blocks[0].length; i++) {
      blocks.forEach((block, j) => {
          if (i != shortBlockLen - blockEccLen || j >= numShortBlocks)
              result.push(block[i]);
      });
  }
  return new Uint8Array(result);
}


export function getNumRawDataModules(ver) {
  let result = (16 * ver + 128) * ver + 64;
  if (ver >= 2) {
    const numAlign = Math.floor(ver / 7) + 2;
    result -= (25 * numAlign - 10) * numAlign - 55;
    result -= (ver >= 7) ? 36 : 0
  }
  return result;
}

export function getNumDataCodewords(ver, ecl) {
  return Math.floor(getNumRawDataModules(ver) / 8) -
      ECLS[ecl].codewords_per_block[ver] * ECLS[ecl].num_ecc_blocks[ver]
}

export function splitIntoSegments(str="",strategy={}){
  let segments = []
  let steps = strategy.steps
  let curMode = steps[0]
  let start = 0
  for(let i = 1; i <= str.length; i++){
    if(i >= str.length || steps[i] != curMode){
      segments.push({
        mode: curMode,
        str: str.slice(start,i),
      })
      curMode = steps[i];
      start = i;
    }
  }
  return segments;
}

const modeNames = ['byte', 'numeric', 'alpha', 'kanji'];
const modeCodes = { byte: 0, numeric: 1, alpha: 2, kanji: 3 }

export class Strategy {
  constructor(packed = new Uint8Array(0), length = 0, cost = 0, lastMode = '') {
    this.packed = packed;
    this.length = length;
    this.cost = cost;
    this.lastMode = lastMode;
    this._steps = null
  }

  addStep(mode, newCost) {
    let { length, packed } = this
    const byteIdx = Math.floor(length / 4);
    const shift = (3 - (length % 4)) * 2;
    const new_arr_len = packed.length + (byteIdx < packed.length ? 0 : 1)
    const new_packed = new Uint8Array(new_arr_len)
    new_packed.set(packed);
    new_packed[byteIdx] |= modeCodes[mode] << shift;
    return new Strategy(new_packed, length + 1, newCost, mode);
  }

  get steps(){
    if(this._steps){ return this._steps }
    return Array.from({ length: this.length }, (_, i) => {
      const b = this.packed[Math.floor(i / 4)];
      const shift = (3 - (i % 4)) * 2;
      return modeNames[(b >> shift) & 0b11];
    })
  }
}