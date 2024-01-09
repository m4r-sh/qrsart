import { ecls } from "./utils/ecls.js";
import { modes, appendBits } from "./utils/modes.js";
import { reedSolomonComputeDivisor, reedSolomonComputeRemainder } from "./utils/reed-solomon.js";

export function findVersion(str,{
  minVersion=1,
  maxVersion=40,
  minEcl='low'
}={}){
  let version = minVersion;
  let ecl = minEcl;
  let dataUsedBits;
  let segs;
  for(;version <= maxVersion;version++){
    const dataCapacityBits = getNumDataCodewords(version,ecl) * 8;
    if(version == minVersion || version == 10 || version == 27){
      segs = optimalSegs(str,version)
    }
    const usedBits = Math.ceil(segs.size / 6)
    if(usedBits <= dataCapacityBits){
      dataUsedBits = usedBits
      break;
    }
  }
  if(!dataUsedBits){
    throw Error("Data too long")
  }

  let ecls = ['low','medium','quartile','high']
  let higher_ecls = ecls.slice(ecls.indexOf(minEcl)+1)
  for(const new_ecl of higher_ecls){
    if(dataUsedBits <= getNumDataCodewords(version,new_ecl) * 8){
      ecl = new_ecl
    } else break;
  }

  return { version, ecl, bitstring: construct_bitstring(str, segs.steps,version,ecl) }

  
}
// return the segment with the lowest length
// TODO: actually construct segment, no need to wait for that
function optimalSegs(str, v){
  const headCosts = {
    byte: (4 + modes.byte.numCharCountBits(v)) * 6,
    alpha: (4 + modes.alpha.numCharCountBits(v)) * 6,
    numeric: (4 + modes.numeric.numCharCountBits(v)) * 6
  }
  let possibilities = []
  let charCosts = Array.from(str).map((char,i) => {
    let cost = {
      byte: countUtf8Bytes(str.codePointAt(i)) * 8 * 6
    }
    if(modes.alpha.test(char)){
      cost.alpha = 33; // 5.5 bits per alphanumeric char
    }
    if(modes.numeric.test(char)){
      cost.numeric = 20; // 3.33 bits per digit
    }
    return cost;
  })

  Object.keys(charCosts[0]).forEach(mode_type => {
    possibilities.push({
      size: headCosts[mode_type] + charCosts[0][mode_type],
      steps: [mode_type]
    })
  })
  for(let i = 1; i < charCosts.length; i++){
    let costs = charCosts[i]
    let new_possibilities = []
    for(let p = 0; p < possibilities.length; p++){
      let pos = possibilities[p]
      Object.keys(costs).forEach(mode_type => {
        new_possibilities.push({
          size:  pos.steps[pos.steps.length-1] == mode_type
            // if no change in mode type
            ? (costs[mode_type] + pos.size)
            // else, include header cost and padding to end of last segment sum
            : (headCosts[mode_type] + Math.floor((pos.size+5) / 6) * 6 + costs[mode_type]),
          steps: [...pos.steps,mode_type]
        })
      })
    }
    let min_size = Math.min(...new_possibilities.map(p => p.size))
    // TODO: only include minimally necessary paths
    possibilities = new_possibilities.filter(x => x.size <= min_size + 20 * 6)
  }

  possibilities.sort((a,b) => a.size - b.size)
  return possibilities[0]
  
}

// TODO: when performing a huge search, would be good to include all matching ecls
// TODO: also, include going up some version #'s
function sorted_segs(str,v,sortFn){

}


function construct_bitstring(str, steps, version, ecl){

  // Pulled from original encode_segments

  let segs = splitIntoSegments(str,steps)

  // Concatenate all segments to create the data bit string
  let bb = [];
  for (const seg of segs) {
      appendBits(modes[seg.mode].modeBits, 4, bb);
      appendBits(seg.numChars, modes[seg.mode].numCharCountBits(version), bb);
      for (const b of seg.getData())
          bb.push(b);
  }
  // TODO: Opportunity for custom
  // Add terminator and pad up to a byte if applicable
  const dataCapacityBits = getNumDataCodewords(version, ecl) * 8;
  appendBits(0, Math.min(4, dataCapacityBits - bb.length), bb);
  appendBits(0, (8 - bb.length % 8) % 8, bb);
  // Pad with alternating bytes until data capacity is reached
  for (let padByte = 0xEC; bb.length < dataCapacityBits; padByte ^= 0xEC ^ 0x11)
      appendBits(padByte, 8, bb);
  // Pack bits into bytes in big endian
  let dataCodewords = [];
  while (dataCodewords.length * 8 < bb.length)
      dataCodewords.push(0);
  bb.forEach((b, i) => dataCodewords[i >>> 3] |= b << (7 - (i & 7)));



  // TODO: start here
  // pulled from interleave()
  // Calculate parameter numbers
  const numBlocks = ecls[ecl].num_ecc_blocks[version]
  const blockEccLen = ecls[ecl].codewords_per_block[version]
  const rawCodewords = Math.floor(getNumRawDataModules(version) / 8);
  const numShortBlocks = numBlocks - rawCodewords % numBlocks;
  const shortBlockLen = Math.floor(rawCodewords / numBlocks);
  // TODO: OPPORTUNITY FOR CUSTOM mayb? 
  // Split data into blocks and append ECC to each block
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
  // Interleave (not concatenate) the bytes from every block into a single sequence
  let result = [];
  for (let i = 0; i < blocks[0].length; i++) {
      blocks.forEach((block, j) => {
          // Skip the padding byte in short blocks
          if (i != shortBlockLen - blockEccLen || j >= numShortBlocks)
              result.push(block[i]);
      });
  }
  return result.map(n => n.toString(2).padStart(8,'0')).join('')
  return result;
}


function countUtf8Bytes(cp=0x80){
  if (cp < 0) throw 'invalid'
  else if (cp < 0x80) return 1;
  else if (cp < 0x800) return 2;
  else if (cp < 0x10000) return 3;
  else if (cp < 0x110000) return 4;
  else throw 'invalid'
}

function getNumRawDataModules(ver) {
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
      ecls[ecl].codewords_per_block[ver] * ecls[ecl].num_ecc_blocks[ver]
}

export function splitIntoSegments(str="",steps=[]){
  let segments = []
  let curMode = steps[0]
  let start = 0
  for(let i = 1; i <= str.length; i++){
    if(i >= str.length || steps[i] != curMode){
      let s = str.slice(start,i)

      segments.push(modes[curMode].write(s))
      curMode = steps[i];
      start = i;
    }
  }
  return segments;
}
