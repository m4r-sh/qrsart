import { ECLS } from './utils/ecls.js'
import { MASK_SHAPES } from './utils/masks.js'
import { Grid } from './Grid'

// todo: save a functional grid for each version (cache on-demand)
// only calculate specific grids on demand, instead of up-front (if possible - save memory)

export class QRCode {
  constructor({
    version=2,
    ecl=0,
    mask=0,
    codewords=new Uint8Array()
  }={}){
    this.version = version
    this.ecl = ecl
    this.mask = mask
    this.codewords = codewords
  }

  get size(){
    return this.version * 4 + 17
  }

  get functional_grid(){
    let { finder_grid, timing_grid,alignment_grid, version_grid, format_grid } = this
    return Grid.union(
      finder_grid,
      timing_grid,
      alignment_grid,
      version_grid,
      format_grid
    )
  }

  get finder_grid(){
    let { size } = this
    let grid = new Grid(size,size)
    for(let r = 0; r < 8; r++){
      for(let c = 0; c < 8; c++){
        let is_on = Math.max(Math.abs(3-r),Math.abs(3-c)) != 2 && !(r == 7 || c == 7)
        grid.set(r,c,is_on)
        grid.set(size-r-1,c,is_on)
        grid.set(r,size-c-1,is_on)
      }
    }
    return grid;
  }

  get timing_grid(){
    let { size } = this
    let grid = new Grid(size,size)
    for (let i = 8; i <= size - 8; i++) {
      let is_on = i % 2 == 0
        grid.set(6, i, is_on);
        grid.set(i, 6, is_on);
    }
    return grid;
  }

  get alignment_positions(){
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

  get alignment_grid(){
    let { version, size, alignment_positions } = this
    let grid = new Grid(size,size)
    const numAlign = alignment_positions.length;
    for (let i = 0; i < numAlign; i++) {
      for (let j = 0; j < numAlign; j++) {
        if (!(i == 0 && j == 0 || i == 0 && j == numAlign - 1 || i == numAlign - 1 && j == 0)){
          for (let dy = -2; dy <= 2; dy++) {
            for (let dx = -2; dx <= 2; dx++){
              let is_on = Math.max(Math.abs(dx), Math.abs(dy)) == 1 ? 0 : 1
              grid.set(alignment_positions[i] + dx, alignment_positions[j] + dy, is_on);
            }
          }
        }
      }
    }
    return grid
  }

  get format_grid(){
    let { ecl, mask, size } = this
    let grid = new Grid(size,size)
    const data = (ECLS[ecl].formatBits << 3) | mask;
    let rem = data;
    for (let i = 0; i < 10; i++){
      rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
    }
    const bits = (data << 10 | rem) ^ 0x5412;
    
    for (let i = 0; i <= 5; i++)
      grid.set(8, i, bits >> i);
    grid.set(8, 7, bits >> 6);
    grid.set(8, 8, bits >> 7);
    grid.set(7, 8, bits >> 8);
    for (let i = 9; i < 15; i++)
      grid.set(14 - i, 8, bits >> i);
    
    for (let i = 0; i < 8; i++)
      grid.set(this.size - 1 - i, 8, bits >> i);
    for (let i = 8; i < 15; i++)
      grid.set(8, this.size - 15 + i, bits >> i);
    grid.set(8, this.size - 8, 1);
    return grid;
  }

  get version_grid(){
    let { version, size } = this
    const grid = new Grid(size, size);
    if (version < 7){
      return grid;
    }
    
    let rem = version;
    for (let i = 0; i < 12; i++){
      rem = (rem << 1) ^ ((rem >>> 11) * 0x1F25);
    }
    const bits = version << 12 | rem;
    
    for (let i = 0; i < 18; i++) {
        const a = size - 11 + i % 3;
        const b = Math.floor(i / 3);
        grid.set(a, b, bits >> i);
        grid.set(b, a, bits >> i);
    }
    return grid;
  }

  get data_grid() {
    let { size, functional_grid, codewords, mask } = this;
    const grid = new Grid(size, size);
    let i = 0;
  
    for (let right = size - 1; right >= 1; right -= 2) {
      if (right === 6) {
        right = 5;
      }
      for (let vert = 0; vert < size; vert++) {
        for (let j = 0; j < 2; j++) {
          const x = right - j;
          const upward = ((right + 1) & 2) === 0;
          const y = upward ? size - 1 - vert : vert;
          const isFunctional = functional_grid.used(x, y);
          if (!isFunctional) {
            
            let dat = 0;
            if (i < codewords.length * 8) {
              const byteIndex = Math.floor(i / 8);
              const bitIndex = 7 - (i % 8);
              dat = (codewords[byteIndex] >> bitIndex) & 1;
            }
            dat ^= MASK_SHAPES[mask](x, y);
            grid.set(x, y, dat);
            i++;
          }
        }
      }
    }
    return grid;
  }

  get grid(){
    let { functional_grid, data_grid } = this
    return Grid.union(functional_grid, data_grid)
  }

  static create(){
    
  }

  static save(){

  }

  static load(){

  }

  toString(){
    return `(QRCode) version:${this.version}, ecl:${this.ecl}, mask:${this.mask}`
  }
  [Bun.inspect.custom](){
    return `(QRCode) version:${this.version}, ecl:${this.ecl}, mask:${this.mask}`
  }
}

