import { findMinimumVersion } from "./strategize";
import { MODES, appendBits } from "../utils/modes";
import { ECLS } from "../utils/ecls";
import { getNumDataCodewords, getNumRawDataModules } from "../utils/versions";
import { reedSolomonComputeDivisor, reedSolomonComputeRemainder } from "../utils/reed-solomon.js";



function parseVersion(version){
  if(Array.isArray(version)){
    let [minv=1,maxv=40] = version
    return [minv,maxv]
  } else if (Number.isInteger(version)){
    return [version,version]
  }
  return [2,40]
}

function parseEcl(ecl){
  if(Array.isArray(ecl)){
    let [mine=0,maxe=3] = ecl
    return [mine,maxe]
  } else if (Number.isInteger(ecl) && ecl >= 0 && ecl <= 3){
    return [ecl,ecl]
  }
  return [0,3]
}

export function optimalStrategy(str,encodingOptions={}){
  let [minVersion, maxVersion] = parseVersion(encodingOptions.version)
  let [minEcl, maxEcl] = parseEcl(encodingOptions.ecl)
  let surplus = encodingOptions.surplus ?? 0
  let [strategy,version] = findMinimumVersion(str,minVersion,maxVersion,minEcl,surplus)

  let ecl = minEcl
  for (let i = ecl + 1; i <= maxEcl; i++) {
    if(strategy.cost <= getNumDataCodewords(version, i) * 8 - surplus){
      ecl = i
    } else break;
  }

  return { strategy, version, ecl } 
}



const localmodes = {
  'numeric': MODES[0],
  'alpha': MODES[1],
  'byte': MODES[2],
  'kanji': MODES[3]
}

const encoder = new TextEncoder()
export class CodewordSequence extends Uint8Array {
  constructor(str, strategy, version, ecl) {
    const chars = Array.from(str);
    const dataCapacityBits = getNumDataCodewords(version, ecl) * 8;
    const bufferSize = (dataCapacityBits + 7) >> 3;
    const rawCodewords = getNumRawDataModules(version) >> 3;

    // Preallocate the final buffer
    super(rawCodewords);

    // Encode data into temporary buffer
    const bb = new Uint8Array(bufferSize);
    const bitPosRef = { pos: 0 };
    let pos = 0;
    for (const [mode, len] of strategy.steps) {
      let curstr = chars.slice(pos, pos + len).join("");
      appendBits(localmodes[mode].modeBits, 4, bb, bitPosRef);
        const count = mode === 'byte' ? encoder.encode(curstr).length : len;     
      appendBits(count, localmodes[mode].numCharCountBits(version), bb, bitPosRef);
      localmodes[mode].write(curstr, bb, bitPosRef);
      pos += len;
    }

    // Append terminator and padding
    appendBits(0, Math.min(4, dataCapacityBits - bitPosRef.pos), bb, bitPosRef);
    appendBits(0, (8 - (bitPosRef.pos % 8)) % 8, bb, bitPosRef);
    for (let padByte = 0xEC; bitPosRef.pos < dataCapacityBits; padByte ^= 0xEC ^ 0x11) {
      appendBits(padByte, 8, bb, bitPosRef);
    }

    // Error correction and interleaving
    const numBlocks = ECLS[ecl].num_ecc_blocks[version];
    const blockEccLen = ECLS[ecl].codewords_per_block[version];
    const numShortBlocks = numBlocks - rawCodewords % numBlocks;
    const shortBlockLen = Math.floor(rawCodewords / numBlocks);
    const blocks = [];
    const rsDiv = reedSolomonComputeDivisor(blockEccLen);

    let k = 0;
    for (let i = 0; i < numBlocks; i++) {
      const blockDataLen = shortBlockLen - blockEccLen + (i < numShortBlocks ? 0 : 1);
      const dat = bb.slice(k >>> 3, (k + blockDataLen * 8) >>> 3);
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

    // Interleave directly into this
    let idx = 0;
    for (let i = 0; i < blocks[0].length; i++) {
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



