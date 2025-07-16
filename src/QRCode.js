import { ECLS } from './utils/ecls.js'
import { MASK_SHAPES } from './utils/masks.js'
import { Grid } from './Grid'
import { base58Decode, base58Encode } from './utils/base58.js'

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
    const grid = new Grid(this.size,this.size)
    drawFinder(grid,this)
    drawTiming(grid,this)
    drawAlignment(grid,this)
    // drawFormat(grid,this)
    drawVersion(grid,this)
    return grid
  }

  get finder_grid(){
    const grid = new Grid(this.size,this.size)
    drawFinder(grid,this)
    return grid;
  }

  get timing_grid(){
    const grid = new Grid(this.size,this.size)
    drawTiming(grid,this)
    return grid;
  }

  get alignment_grid(){
    const grid = new Grid(this.size,this.size)
    drawAlignment(grid,this)
    return grid
  }

  get format_grid(){
    const grid = new Grid(this.size,this.size)
    drawFormat(grid,this)
    return grid;
  }

  get version_grid(){
    const grid = new Grid(this.size,this.size)
    drawVersion(grid,this)
    return grid;
  }

  get data_grid() {
    const grid = new Grid(this.size,this.size)
    drawData(grid,this,this.functional_grid)
    return grid
  }

  get rawdata_grid(){
    const grid = new Grid(this.size,this.size)
    drawData(grid,this,this.functional_grid,true)
    return grid
  }

  get grid(){
    const grid = new Grid(this.size,this.size)
    drawFinder(grid,this)
    drawTiming(grid,this)
    drawAlignment(grid,this)
    // drawFormat(grid,this)
    drawVersion(grid,this)
    drawData(grid,this)
    return grid
  }

  toBytes(){
    return new Uint8Array([
      this.version & 0xFF,
      ((this.ecl & 0b11) << 3) | ((this.mask & 0b111) << 5),
      ...this.codewords
    ])
  }

  toString(){
    return base58Encode(this.toBytes());
  }

  static fromBytes(bytes){
    return new QRCode({
      version: bytes[0],
      ecl: (bytes[1] >> 3) & 0b11,
      mask: (bytes[1] >> 5) & 0b111,
      codewords: bytes.slice(2)
    })
  }

  static fromString(b58str){
    return QRCode.fromBytes(base58Decode(b58str))
  }
}

// TODO: optional mask for raw encoding to be xor permuted in gpu
function drawData(grid,qr_this,functional_grid,skip_mask=false){
  if(!functional_grid){ functional_grid = grid }
  let {codewords,mask,size} = qr_this
  drawFormat(grid,qr_this)
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
          if(skip_mask !== true) dat ^= MASK_SHAPES[mask](x, y);

          grid.set(x, y, dat);
          i++;
        }
      }
    }
  }
}

function drawFinder(grid,{ size }){
  for(let r = 0; r < 8; r++){
    for(let c = 0; c < 8; c++){
      let is_on = Math.max(Math.abs(3-r),Math.abs(3-c)) != 2 && !(r == 7 || c == 7)
      grid.set(r,c,is_on)
      grid.set(size-r-1,c,is_on)
      grid.set(r,size-c-1,is_on)
    }
  }
}

function drawTiming(grid,{ size }){
  for (let i = 8; i <= size - 8; i++) {
    let is_on = i % 2 == 0;
    grid.set(6, i, is_on);
    grid.set(i, 6, is_on);
  }
}

function drawAlignment(grid,{size,version}){
  let alignment_positions = get_alignment_positions(version,size)
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
}

function drawFormat(grid,{ ecl, mask, size }){
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
    grid.set(size - 1 - i, 8, bits >> i);
  for (let i = 8; i < 15; i++)
    grid.set(8, size - 15 + i, bits >> i);
  grid.set(8, size - 8, 1);
}

function drawVersion(grid,{version,size}){
  if (version < 7){ return }
  
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
}

function get_alignment_positions(version,size){
  if(version == 1){ return [] }
  const numAlign = Math.floor(version / 7) + 2;
  const step = (version == 32) ? 26 : Math.ceil((version * 4 + 4) / (numAlign * 2 - 2)) * 2;
  let result = [6];
  for (let pos = size - 7; result.length < numAlign; pos -= step){
    result.splice(1, 0, pos);
  }
  return result;
}
