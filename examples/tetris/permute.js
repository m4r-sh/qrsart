import { createQR, PixelGrid } from '../../src'
import { tetrominoes, findFits } from './tetrominoes.js'

export function find_ideal_qr({
  data_options=[],
  ecl= 'medium',
  version= 3
}={}){
  let min = { 
    unused: Number.MAX_SAFE_INTEGER,
    qr: {},
    data: ''
  }
  data_options.forEach((data,i) => {
    if(i % 100 == 0 && i != 0){
      console.log(`${i} / ${data_options.length}: ${min.unused}`)
    }
    for(let m = 0; m < 8; m++){
      let qr = createQR(data,{
        mask:m,
        minEcl: ecl,
        minVersion: version
      })
      if(qr.version != version){
        console.log(`version mismatch: ${qr.version} ${version}`)
      }
      let num_unused = tetris_calc(PixelGrid.combine(
        qr.data_grid,
        qr.version_grid,
        qr.format_grid,
        qr.timing_grid
      ),qr.size)
      if(num_unused <= min.unused){
        min = { unused: num_unused, qr, data }
      }
    }
  })
  console.log(min)
  return min.qr
}


function tetris_calc(grid, size){
  let unused_grid = new PixelGrid(size, size)
  let unused_count = 0
  let used_grid = new PixelGrid(size,size)
  let fits = findFits(grid,tetrominoes)
  for(let i = 0; i < fits.length * 3; i++){
    let index = Math.floor(Math.random() * fits.length)
    let { shape, coords } = fits[index]
    if(!shape.points.some(([px,py]) => used_grid.usedPixel(px+coords.x,py+coords.y))){
      shape.points.forEach(([px,py]) => {
        let x = px + coords.x
        let y = py + coords.y
        used_grid.setPixel(x,y,true)
      })
    }
  }
  for(let y = 0; y < size; y++){
    for(let x = 0; x < size; x++){
      if(!used_grid.usedPixel(x,y) && grid.usedPixel(x,y)){
        unused_count++
        // unused_grid.setPixel(x,y,grid.getPixel(x,y))
      }
    }
  }
  return unused_count // return unused pixel grid: ;
}

