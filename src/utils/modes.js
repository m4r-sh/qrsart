const NUMERIC_REGEX = /^[0-9]*$/;
const ALPHANUMERIC_REGEX = /^[A-Z0-9 $%*+.\/:-]*$/;
const ALPHANUMERIC_CHARSET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:";
const encoder = new TextEncoder()

const NUMERIC_MARGINS = [4,3,3]
const ALPHA_MARGINS = [6,5]

export let modes = {
  numeric: {
    modeBits: 1,
    charCost: (c) => NUMERIC_REGEX.test(c) ? (10/3) : Infinity,
    numCharCountBits: (v) => [10,12,14][Math.floor((v + 7)/17)],
    groupSize: 3,
    getMarginal: (c,phase=0) => NUMERIC_REGEX.test(c) ? NUMERIC_MARGINS[phase % 3] : Infinity,
    write(data){
      let bb = [];
      for (let i = 0; i < data.length;) { // Consume up to 3 digits per iteration
          const n = Math.min(data.length - i, 3);
          appendBits(parseInt(data.substr(i, n), 10), n * 3 + 1, bb);
          i += n;
      }
      return bb.slice()
    },
  },
  alpha: {
    modeBits: 2,
    charCost: (c) => ALPHANUMERIC_REGEX.test(c) ? 5.5 : Infinity,
    numCharCountBits: (v) => [9,11,13][Math.floor((v + 7)/17)],
    groupSize: 2,
    getMarginal: (c,phase=0) => ALPHANUMERIC_REGEX.test(c) ? ALPHA_MARGINS[phase % 2] : Infinity,
    write(data){
      let bb = [];
      let i;
      for (i = 0; i + 2 <= data.length; i += 2) { // Process groups of 2
          let temp = ALPHANUMERIC_CHARSET.indexOf(data.charAt(i)) * 45;
          temp += ALPHANUMERIC_CHARSET.indexOf(data.charAt(i + 1));
          appendBits(temp, 11, bb);
      }
      if (i < data.length){ // 1 character remaining
        appendBits(ALPHANUMERIC_CHARSET.indexOf(data.charAt(i)), 6, bb);
      }
      return bb.slice()
    }
  },
  byte: {
    modeBits: 4,
    charCost: (c) => countUtf8Bytes(c) * 8,
    groupSize: 1,
    numCharCountBits: (v) => [8,16,16][Math.floor((v + 7)/17)],
    getMarginal: (c,phase=0) => countUtf8Bytes(c) * 8,
    write(str){
      let data = encoder.encode(str)
      let bb = [];
      for (const b of data){
        appendBits(b, 8, bb);
      }
      return bb.slice()
    }
  }
}
export function appendBits(val, len, bb) {
  
  while (len > 31) {
    appendBits(val >>> (len - 31), 31, bb);
    len -= 31;
  }

  if (val >>> len !== 0)
    throw new RangeError("Value out of range");

  for (let i = len - 1; i >= 0; i--) // Append bit by bit
    bb.push((val >>> i) & 1);
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