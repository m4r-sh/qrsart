import { Grid } from "./Grid";
import { MASKS } from "../utils/masks";
import { ECLS } from "../utils/ecls";

// empty 0 position to match index with version number
const staticFunctionalGridCache = new Array(41);
const dataPathCache = new Array(41);
const maskGridCache = new Map()

export function getMaskGrid(version,mask){
    const key = `${version}-${mask}`;
    if (!maskGridCache.has(key)) {
      const size = getSize(version)
      const grid = new Grid(size);
      const maskFn = MASKS[mask];
      const path = getDataPath(version)

      for (let i = 0; i < path.length; i+=2) {
        const x = path[i]
        const y = path[i+1]
        grid.set(x, y, maskFn(x, y))
      }
      maskGridCache.set(key, grid);
    }
    return maskGridCache.get(key);
}

export function getDataPath(version){
  if(!dataPathCache[version]){
    const reservedGrid = getFunctionalGrid(version);
    const size = getSize(version)

    const path = [];
    for (let right = size - 1; right >= 1; right -= 2) {
      if (right === 6) right = 5; // Skip timing column
      for (let vert = 0; vert < size; vert++) {
        for (let j = 0; j < 2; j++) {
          const x = right - j;
          const upward = ((right + 1) & 2) === 0;
          const y = upward ? size - 1 - vert : vert;
          if (!reservedGrid.used(x, y)) {
            path.push(x,y);
          }
        }
      }
    }
    dataPathCache[version] = path
  }
  return dataPathCache[version]
}


export function drawDataGrid(grid, codewords) {
  const version = getVersion(grid.w)
  const path = getDataPath(version)
  const totalDataBits = codewords.length * 8;
  for (let i = 0; i < path.length / 2; i++) {
    const x = path[i*2]
    const y = path[i*2+1]
    let bit = 0;
    // Only calculate the bit if it's within the bounds of the actual data.
    // Beyond this, we are just filling with zeros, which is the default.
    if (i < totalDataBits) {
      const byteIndex = i >>> 3;
      const bitIndex = 7 - (i % 8);
      bit = (codewords[byteIndex] >> bitIndex) & 1;
    }
    grid.set(x, y, bit);
  }
  return grid
}


export function drawFormatGrid(grid,ecl,mask){
  const size = grid.w
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
  return grid
}

export function getFunctionalGrid(version=1,ecl=0,mask=0){
  // PERF: can likely reduce memory / overhead here
  let static_fn_grid = getStaticFunctionalGrid(version).clone()
  drawFormatGrid(static_fn_grid,ecl,mask)
  return static_fn_grid
}

function getStaticFunctionalGrid(version=1){
  if(!staticFunctionalGridCache[version]){
    const grid = new Grid(getSize(version))
    drawFinderGrid(grid)
    drawTimingGrid(grid)
    drawAlignmentGrid(grid,version)
    drawVersionGrid(grid,version)
    staticFunctionalGridCache[version] = grid
  }
  return staticFunctionalGridCache[version]
}

export function drawFinderGrid(grid){
  const size = grid.w
  for(let r = 0; r < 8; r++){
    for(let c = 0; c < 8; c++){
      let is_on = Math.max(Math.abs(3-r),Math.abs(3-c)) != 2 && !(r == 7 || c == 7)
      grid.set(r,c,is_on)
      grid.set(size-r-1,c,is_on)
      grid.set(r,size-c-1,is_on)
    }
  }
  return grid
}

export function drawTimingGrid(grid){
  for (let i = 8; i <= grid.w - 8; i++) {
    let is_on = i % 2 == 0;
    grid.set(6, i, is_on);
    grid.set(i, 6, is_on);
  }
  return grid
}

export function drawAlignmentGrid(grid, version){
  let alignment_positions = getAlignmentPositions(version)
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


export function drawVersionGrid(grid, version){
  if (version < 7){ return grid }
  let rem = version;
  for (let i = 0; i < 12; i++){
    rem = (rem << 1) ^ ((rem >>> 11) * 0x1F25);
  }
  const bits = version << 12 | rem;
  for (let i = 0; i < 18; i++) {
    const a = getSize(version) - 11 + i % 3;
    const b = Math.floor(i / 3);
    grid.set(a, b, bits >> i);
    grid.set(b, a, bits >> i);
  }
  return grid
}

export function getAlignmentPositions(version){
  if(version == 1){ return [] }
  const numAlign = Math.floor(version / 7) + 2;
  const step = (version == 32) ? 26 : Math.ceil((version * 4 + 4) / (numAlign * 2 - 2)) * 2;
  let result = [6];
  for (let pos = getSize(version) - 7; result.length < numAlign; pos -= step){
    result.splice(1, 0, pos);
  }
  return result;
}

function getSize(version){
  return (version << 2) + 17
}

function getVersion(size){
  return (size - 17) >> 2
}
