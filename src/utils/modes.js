const NUMERIC_REGEX = /^[0-9]*$/;
const ALPHANUMERIC_REGEX = /^[A-Z0-9 $%*+.\/:-]*$/;
const ALPHANUMERIC_CHARSET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:";
const encoder = new TextEncoder()

export const supportsKanji = testSupportsKanji()
const SHIFT_JIS_MAPPING = getMappingFromEncodingRanges(
  'shift_jis',
  [0x8140, 0x817e],[0x8180, 0x81ac],[0x81b8, 0x81bf],[0x81c8, 0x81ce],
  [0x81da, 0x81e8],[0x81f0, 0x81f7],[0x81fc, 0x81fc],[0x824f, 0x8258],
  [0x8260, 0x8279],[0x8281, 0x829a],[0x829f, 0x82f1],[0x8340, 0x837e],
  [0x8380, 0x8396],[0x839f, 0x83b6],[0x83bf, 0x83d6],[0x8440, 0x8460],
  [0x8470, 0x847e],[0x8480, 0x8491],[0x849f, 0x84be],[0x889f, 0x88fc],
  ...getSerialEncodingRanges(0x8940, 0x97fc, [0, 62, 64, 188]),
  [0x9840, 0x9872],[0x989f, 0x98fc],
  ...getSerialEncodingRanges(0x9940, 0x9ffc, [0, 62, 64, 188]),
  ...getSerialEncodingRanges(0xe040, 0xe9fc, [0, 62, 64, 188]),
  [0xea40, 0xea7e],[0xea80, 0xeaa4]
);

// Build fixed-size array (size 128 for ASCII)
const CHAR_INDEX_ARRAY = new Uint8Array(128);
for (let i = 0; i < ALPHANUMERIC_CHARSET.length; i++) {
  CHAR_INDEX_ARRAY[ALPHANUMERIC_CHARSET.charCodeAt(i)] = i;
}



export let MODES = [
  // NUMERIC
  {
    modeBits: 1,
    name: 'numeric',
    charCost: (c) => NUMERIC_REGEX.test(c) ? (10/3) : Infinity,
    numCharCountBits: (v) => [10,12,14][Math.floor((v + 7)/17)],
    groupSize: 3,
    getMarginal: (c,phase=0) => NUMERIC_REGEX.test(c) ? [4,3,3][phase % 3] : Infinity,
    write(data, bb, bitPosRef){
      for (let i = 0; i < data.length;) { // Consume up to 3 digits per iteration
          const n = Math.min(data.length - i, 3);
          appendBits(parseInt(data.substr(i, n), 10), n * 3 + 1, bb, bitPosRef);
          i += n;
      }
    },
  },
  // ALPHA
  {
    modeBits: 2,
    name: 'alpha',
    charCost: (c) => ALPHANUMERIC_REGEX.test(c) ? 5.5 : Infinity,
    numCharCountBits: (v) => [9,11,13][Math.floor((v + 7)/17)],
    groupSize: 2,
    getMarginal: (c,phase=0) => ALPHANUMERIC_REGEX.test(c) ? [6,5][phase % 2] : Infinity,
    write(data, bb, bitPosRef){
      let i;
      for (i = 0; i + 2 <= data.length; i += 2) {
        let temp = CHAR_INDEX_ARRAY[data.charCodeAt(i)] * 45;
        temp += CHAR_INDEX_ARRAY[data.charCodeAt(i + 1)];
        appendBits(temp, 11, bb, bitPosRef);
      }
      if (i < data.length) {
        appendBits(CHAR_INDEX_ARRAY[data.charCodeAt(i)], 6, bb, bitPosRef);
      }
    }
  },
  // BYTE
  {
    modeBits: 4,
    name: 'byte',
    charCost: (c) => countUtf8Bytes(c) * 8,
    groupSize: 1,
    numCharCountBits: (v) => [8,16,16][Math.floor((v + 7)/17)],
    getMarginal: (c,phase=0) => {
      return countUtf8Bytes(c) * 8
    },
    write(str, bb, bitPosRef){
      let data = encoder.encode(str)
      for (const b of data){
        appendBits(b, 8, bb, bitPosRef);
      }
    }
  },
  // KANJI
  {
    modeBits: 0x08,
    name: 'kanji',
    numCharCountBits: (v) => [8,10,12][Math.floor((v + 7) / 17)],
    charCost: (c) => supportsKanji ? (SHIFT_JIS_MAPPING.get(c) ? 13 : Infinity) : Infinity,
    groupSize: 1,
    getMarginal: (c,_) => supportsKanji ? (SHIFT_JIS_MAPPING.get(c) ? 13 : Infinity) : Infinity,
    write(str, bb, bitPosRef){
      for (let i = 0; i < str.length; i++) {
        let code = SHIFT_JIS_MAPPING.get(str.at(i))
        if(code){
          if (code >= 0x8140 && code <= 0x9ffc) { code -= 0x8140; } else if (code >= 0xe040 && code <= 0xebbf) { code -= 0xc140;
          } else {
            throw new Error(`illegal kanji character: ${str.at(i)}`);
          }
          code = (code >> 8) * 0xc0 + (code & 0xff);
          appendBits(code, 13, bb, bitPosRef)
        }
      }
    }
  }
]

export function appendBits(val, len, bb, bitPosRef) {
  if (len <= 0) return;

  if (len > 31) {
    appendBits(val >>> (len - 31), 31, bb, bitPosRef);
    appendBits(val & ((1 << (len - 31)) - 1), len - 31, bb, bitPosRef);
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
    const bits = (val >>> shift) & mask;
    bb[pos >>> 3] |= bits << (7 - (pos & 7) - bitsToWrite + 1);
    pos += bitsToWrite;
    len -= bitsToWrite;
  }
  bitPosRef.pos = pos;
}


function countUtf8Bytes(c){
  let cp = c.codePointAt(0)
  if (cp < 0) throw 'invalid'
  else if (cp < 0x80) return 1;
  else if (cp < 0x800) return 2;
  else if (cp < 0x10000) return 3;
  else if (cp < 0x110000) return 4;
  else throw 'invalid'
}



function getMappingFromEncodingRanges(label, ...ranges){
  const bytes = [];
  const codes = [];
  const mapping= new Map();
  const decoder = new TextDecoder(label, { fatal: true });

  for (const [start, end] of ranges) {
    for (let code = start; code <= end; code++) {
      bytes.push((code >> 8) & 0xff, code & 0xff);
      codes.push(code);
    }
  }

  const characters = decoder.decode(new Uint8Array(bytes));

  for (let i = 0; i < codes.length; i++) {
    const character = characters.at(i) || ''
    if (character && !mapping.has(character)) {
      mapping.set(character, codes[i]);
    }
  }
  return mapping;
}



function getSerialEncodingRanges(start, end, offsets, delta=256){
  const count = offsets.length - 1;
  const ranges = [];
  for (let i = start; i < end; i += delta ) {
    for (let j = 0; j < count; j += 2) {
      ranges.push([i + offsets[j], i + offsets[j + 1]]);
    }
  }
  return ranges;
}

export function testSupportsKanji(){
  try {
    const dec = new TextDecoder("shift_jis", { fatal: true });
    return dec.decode(Uint8Array.from([ 147, 199, 142, 230 ])) === "読取";
  } catch {
    return false;
  }
}
