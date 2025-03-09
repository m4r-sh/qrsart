import { ECLS } from "./utils/ecls.js";
import { modes, appendBits } from "./utils/modes.js";
import { reedSolomonComputeDivisor, reedSolomonComputeRemainder } from "./utils/reed-solomon.js";

export function findOptimalSegmentation(str,{
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
    bitstring: constructCodewords(str, minimalSeg.steps, version, ecl),
    cost: minimalSeg.cost,
    steps: minimalSeg.steps,
    budget: getNumDataCodewords(version, ecl) * 8
  };
}


export function findAllSegmentations(str, version, ecl) {
  const dataCapacityBits = getNumDataCodewords(version, ecl) * 8;
  const n = str.length;
  let paths = [{ cost: 0, steps: [], mode: '' }];

  for (let i = 0; i < n; i++) {
    const newPaths = [];
    for (const path of paths) {
      for (const mode of ['numeric', 'alpha', 'byte']) {
        const charCost = modes[mode].charCost(str[i])
        if (charCost === Infinity) continue;

        const headerBits = path.mode === mode ? 0 : 4 + modes[mode].numCharCountBits(version);
        const newCost = path.cost + headerBits + charCost;
        if (newCost > dataCapacityBits) continue;

        newPaths.push({
          cost: newCost,
          steps: [...path.steps, mode],
          mode,
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


function findMinimalSegmentation(str, version) {
  const n = str.length;
  // dp[i][mode] stores the minimal cost and steps up to position i ending in mode
  const dp = Array(n + 1).fill().map(() => ({}));
  dp[0] = { '': { cost: 0, steps: [] } };
  let count = 0
  for (let i = 1; i <= n; i++) {
    for (const prevMode in dp[i - 1]) {
      const prev = dp[i - 1][prevMode];
      for (const mode of ['numeric', 'alpha', 'byte']) {
        const charCost = modes[mode].charCost(str[i - 1]);
        if (charCost === Infinity) continue;
        const headerBits = prevMode === mode ? 0 : 4 + modes[mode].numCharCountBits(version);
        const newCost = prev.cost + headerBits + charCost;
        if (!dp[i][mode] || newCost < dp[i][mode].cost) {
          dp[i][mode] = { cost: newCost, steps: [...prev.steps, mode] };
        }
      }
    }
  }

  // Find the minimal cost among all modes at the end
  const final = dp[n];
  let minCost = Infinity;
  let bestMode = '';
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

export function constructCodewords(str, steps, version, ecl) {

  let segs = splitIntoSegments(str,steps)
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

function getNumDataCodewords(ver, ecl) {
  return Math.floor(getNumRawDataModules(ver) / 8) -
      ECLS[ecl].codewords_per_block[ver] * ECLS[ecl].num_ecc_blocks[ver]
}

export function splitIntoSegments(str="",steps=[]){
  let segments = []
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