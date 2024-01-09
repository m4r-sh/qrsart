const NUMERIC_REGEX = /^[0-9]*$/;
const ALPHANUMERIC_REGEX = /^[A-Z0-9 $%*+.\/:-]*$/;
const ALPHANUMERIC_CHARSET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:";

let encoder = new TextEncoder()

class QRSegment {
  constructor({mode,numChars,bitData,text}){
    this.mode = mode
    this.numChars = numChars
    this.bitData = bitData
    this.text = text
  }
  getData(){
    return this.bitData.slice()
  }
}

export let modes = {
  numeric: {
    modeBits: 1,
    numCharCountBits: (v) => [10,12,14][Math.floor((v + 7)/17)],
    test(x){
      return NUMERIC_REGEX.test(x)
    },
    write(data){
      let bb = [];
      for (let i = 0; i < data.length;) { // Consume up to 3 digits per iteration
          const n = Math.min(data.length - i, 3);
          appendBits(parseInt(data.substr(i, n), 10), n * 3 + 1, bb);
          i += n;
      }
      return new QRSegment({
        mode: 'numeric',
        numChars: data.length,
        bitData: bb,
        text: data
      })
    },
    charCost: 3.33,
  },
  alpha: {
    modeBits: 2,
    numCharCountBits: (v) => [9,11,13][Math.floor((v + 7)/17)],
    test(x){
      return ALPHANUMERIC_REGEX.test(x)
    },
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

      return new QRSegment({
        mode: 'alpha',
        numChars: data.length,
        bitData: bb,
        text: data
      })
    }
  },
  byte: {
    modeBits: 4,
    numCharCountBits: (v) => [8,16,16][Math.floor((v + 7)/17)],
    write(str){
      let data = encoder.encode(str)
      let bb = [];
      for (const b of data){
        appendBits(b, 8, bb);
      }
      return new QRSegment({
        mode: 'byte',
        numChars: data.length,
        bitData: bb,
        text: str
      })
    }
  },
  kanji: {
    modeBits: 8,
    numCharCountBits: (v) => [8,10,12][Math.floor((v + 7)/17)],
    write(data){
      throw Error('Not supporting kanji yet')
    }
  },
  eci: {
    modeBits: 7,
    numCharCountBits: (v) => [0,0,0][Math.floor((v + 7)/17)],
    write(data){
      let bb = [];
      if (data < 0)
          throw new RangeError("ECI assignment value out of range");
      else if (data < (1 << 7))
          appendBits(data, 8, bb);
      else if (data < (1 << 14)) {
          appendBits(0b10, 2, bb);
          appendBits(data, 14, bb);
      }
      else if (data < 1000000) {
          appendBits(0b110, 3, bb);
          appendBits(data, 21, bb);
      }
      else
          throw new RangeError("ECI assignment value out of range");
      return new QRSegment(Mode.ECI, 0, bb);
    }
  }
}

export function appendBits(val, len, bb) {
  if (len < 0 || len > 31 || val >>> len != 0)
    throw new RangeError("Value out of range");
  for (let i = len - 1; i >= 0; i--) // Append bit by bit
    bb.push((val >>> i) & 1);
}