import { ecls } from './utils/ecls.js'
import { PixelGrid } from './PixelGrid.js'

const MASK_SHAPES = [
  /* 0 */ (x,y) => (x + y) % 2 == 0,
  /* 1 */ (x,y) => y % 2 == 0,
  /* 2 */ (x,y) => x % 3 == 0,
  /* 3 */ (x,y) => (x + y) % 3 == 0,
  /* 4 */ (x,y) => (Math.floor(x / 3) + Math.floor(y / 2)) % 2 == 0,
  /* 5 */ (x,y) => x * y % 2 + x * y % 3 == 0,
  /* 6 */ (x,y) => (x * y % 2 + x * y % 3) % 2 == 0,
  /* 7 */ (x,y) => ((x + y) % 2 + x * y % 3) % 2 == 0,
]

export class QRCode {
  constructor({
    version=2,
    ecl=0,
    mask=0,
    bitstring=''
  }={}){
    this.version = version
    this.ecl = ecl
    this.mask = mask
    this.bitstring = bitstring
  }

  get size(){
    return this.version * 4 + 17
  }

  get functional_patterns(){
    let { finder_patterns, timing_patterns,alignment_patterns, version_pattern, format_pattern } = this
    return PixelGrid.combine(
      finder_patterns,
      timing_patterns,
      alignment_patterns,
      version_pattern,
      format_pattern
    )
  }

  get finder_patterns(){
    let { size } = this
    let grid = new PixelGrid(size,size)
    for(let r = 0; r < 8; r++){
      for(let c = 0; c < 8; c++){
        let is_on = Math.max(Math.abs(3-r),Math.abs(3-c)) != 2 && !(r == 7 || c == 7)
        grid.setPixel(r,c,is_on)
        grid.setPixel(size-r-1,c,is_on)
        grid.setPixel(r,size-c-1,is_on)
      }
    }
    return grid;
  }

  get timing_patterns(){
    let { size } = this
    let grid = new PixelGrid(size,size)
    for (let i = 8; i <= size - 8; i++) {
      let is_on = i % 2 == 0
        grid.setPixel(6, i, is_on);
        grid.setPixel(i, 6, is_on);
    }
    return grid;
  }

  get alignment_positions(){
    // Each position is in the range [0,177), and are used on both the x and y axes.
    // This could be implemented as lookup table of 40 variable-length lists of integers.
    let { version, size } = this
    if(version == 1){ return [] }
    const numAlign = Math.floor(version / 7) + 2;
    const step = (version == 32) ? 26 : Math.ceil((version * 4 + 4) / (numAlign * 2 - 2)) * 2;
    let result = [6];
    for (let pos = size - 7; result.length < numAlign; pos -= step){
      result.splice(1, 0, pos);
    }
    return result;
  }

  get alignment_patterns(){
    let { version, size, alignment_positions } = this
    let grid = new PixelGrid(size,size)
    const numAlign = alignment_positions.length;
    for (let i = 0; i < numAlign; i++) {
      for (let j = 0; j < numAlign; j++) {
        // Don't draw on the three finder corners
        if (!(i == 0 && j == 0 || i == 0 && j == numAlign - 1 || i == numAlign - 1 && j == 0)){
          for (let dy = -2; dy <= 2; dy++) {
            for (let dx = -2; dx <= 2; dx++){
              let is_on = Math.max(Math.abs(dx), Math.abs(dy)) == 1 ? 0 : 1
              grid.setPixel(alignment_positions[i] + dx, alignment_positions[j] + dy, is_on);
            }
          }
        }
      }
    }
    return grid
  }

  get format_pattern(){
    let { ecl, mask, size } = this
    let grid = new PixelGrid(size,size)
    const data = (ecls[ecl].formatBits << 3) | mask; // errCorrLvl is uint2, mask is uint3
    let rem = data;
    for (let i = 0; i < 10; i++){
      rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
    }
    const bits = (data << 10 | rem) ^ 0x5412; // uint15
    // Draw first copy
    for (let i = 0; i <= 5; i++)
      grid.setPixel(8, i, bits >> i);
    grid.setPixel(8, 7, bits >> 6);
    grid.setPixel(8, 8, bits >> 7);
    grid.setPixel(7, 8, bits >> 8);
    for (let i = 9; i < 15; i++)
      grid.setPixel(14 - i, 8, bits >> i);
    // Draw second copy
    for (let i = 0; i < 8; i++)
      grid.setPixel(this.size - 1 - i, 8, bits >> i);
    for (let i = 8; i < 15; i++)
      grid.setPixel(8, this.size - 15 + i, bits >> i);
    grid.setPixel(8, this.size - 8, 1); // Always dark
    return grid;
  }

  get version_pattern(){
    let { version, size } = this
    const grid = new PixelGrid(size, size);
    if (version < 7){
      return grid;
    }
    // Calculate error correction code and pack bits
    let rem = version; // version is uint6, in the range [7, 40]
    for (let i = 0; i < 12; i++){
      rem = (rem << 1) ^ ((rem >>> 11) * 0x1F25);
    }
    const bits = version << 12 | rem; // uint18
    // Draw two copies
    for (let i = 0; i < 18; i++) {
        const a = size - 11 + i % 3;
        const b = Math.floor(i / 3);
        grid.setPixel(a, b, bits >> i);
        grid.setPixel(b, a, bits >> i);
    }
    return grid;
  }

  get data_pattern(){
    let { size, functional_patterns, bitstring, mask } = this
    const grid = new PixelGrid(size, size);
    let i = 0;
    for(let right = size - 1; right >= 1; right -= 2){
      if(right == 6){
        right = 5
      }
      for(let vert = 0; vert < size; vert++){
        for(let j = 0; j < 2; j++){
          const x = right - j
          const upward = ((right + 1) & 2) == 0
          const y = upward ? size - 1 - vert : vert
          const isFunctional = functional_patterns.usedPixel(x,y)
          if(!isFunctional && i < bitstring.length){
            let dat = parseInt(bitstring[i])
            dat ^= (MASK_SHAPES[mask](x,y))
            grid.setPixel(x,y,dat)
            i++
          }
        }
      }
    }
    return grid
  }

  get grid(){
    let { functional_patterns, data_pattern } = this
    return PixelGrid.combine(functional_patterns, data_pattern)
  }
}

