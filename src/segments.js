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

      const headerBits = strategy.mode === mode ? 0 : 4 + modes[mode].numCharCountBits(version);
      let newCost = strategy.cost + headerBits + charCost;
      if (strategy.mode !== mode) newCost = Math.ceil(newCost);

      const estimatedRemainingCost = (n - 1 - index) * (10 / 3);
      if (newCost > dataCapacityBits - estimatedRemainingCost) continue;

      const newStrategy = strategy.addStep(mode, newCost);
      stack.push({ index: index + 1, strategy: newStrategy });
    }
  }
}

const modeNames = ['byte','numeric','alpha']

const MAX_GROUP_SIZE = 3;
const NUM_MODES = 5; // Includes 'none' and reserve for 'kanji'
const NUM_STATES = NUM_MODES * MAX_GROUP_SIZE; // 15

const modeToIdx = {
  'none': 0,
  'byte': 1,
  'numeric': 2,
  'alpha': 3,
  'kanji': 4, // Reserved, not used yet
};

const idxToMode = [];
idxToMode[modeToIdx['none']] = 'none';
idxToMode[modeToIdx['byte']] = 'byte';
idxToMode[modeToIdx['numeric']] = 'numeric';
idxToMode[modeToIdx['alpha']] = 'alpha';
idxToMode[modeToIdx['kanji']] = 'kanji';

const groupSizes = [1, 1, 3, 2, 1]; // none:1, byte:1, numeric:3, alpha:2, kanji:1

export function findMinimalSegmentation(str, version=1) {
  const n = str.length;

  let prevStates = new Array(NUM_STATES).fill(null);
  const noneState = modeToIdx['none'] * MAX_GROUP_SIZE + 0;
  prevStates[noneState] = new Strategy();

  for (let i = 1; i <= n; i++) {
    const c = str[i - 1];
    let currStates = new Array(NUM_STATES).fill(null);

    for (let s = 0; s < NUM_STATES; s++) {
      if (prevStates[s] === null) continue;

      const prev = prevStates[s];
      const prevModeIdx = Math.floor(s / MAX_GROUP_SIZE);
      const prevPhase = s % MAX_GROUP_SIZE;
      const prevMode = idxToMode[prevModeIdx];

      // Extend if possible
      if (prevMode !== 'none') {
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

      // Switch to a new mode (start new segment)
      for (const mode of modeNames) {
        const curmode = modes[mode];
        const initialBits = curmode.getMarginal(c, 0);
        if (initialBits === Infinity) continue;
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

  for (let s = 0; s < NUM_STATES; s++) {
    if (prevStates[s] !== null && prevStates[s].cost < minCost) {
      minCost = prevStates[s].cost;
      best = prevStates[s];
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


export class Strategy {
  constructor(prev = null, mode = '', cost = 0, length = 0) {
    this.prev = prev;
    this.mode = mode;
    this.cost = cost;
    this.length = length;
    this._steps = null
  }

  addStep(mode, newCost) {
    return new Strategy(this, mode, newCost, this.length + 1)
  }

  get steps(){
    if(this._steps){ return this._steps }
    const res = []
    let cur = this
    while(cur.prev){
      res.push(cur.mode)
      cur = cur.prev;
    }
    this._steps = res.reverse()
    return this._steps
  }
}