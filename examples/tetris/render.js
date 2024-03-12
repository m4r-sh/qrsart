import { createQR, PixelGrid } from '../../src'
import { createCanvas, loadImage } from '@napi-rs/canvas'
import { tetrominoes, findFits } from './tetrominoes.js'
import { hueman } from 'hueman'

export async function tetris_render(qr){

  // --- CANVAS SETUP ---
  let module_size = 100
  let padding = 100
  let w = padding * 2 + qr.size * module_size
  let h = padding * 2 + qr.size * module_size
  let canvas = createCanvas(w,h)
  let ctx = canvas.getContext('2d')
  ctx.fillStyle = '#fff'
  ctx.fillRect(0,0,w,h)
  ctx.translate(padding,padding)

  // --- Rendering Layers ---
  // 1. Black Squares
  b_w_squares(PixelGrid.combine(
    qr.finder_patterns,
    qr.alignment_patterns
  ),{ ctx, w, h, padding, module_size, size: qr.size })

  // 2. Tetrominoes
  let unused = tetrisFill(PixelGrid.combine(
    qr.data_pattern,
    qr.version_pattern,
    qr.format_pattern,
    qr.timing_patterns
  ),{ ctx, w, h, padding, module_size, size: qr.size })

  // 3. Gray lines
  b_w_veritcal_rods(unused,{ ctx, w, h, padding, module_size, size: qr.size })

  // --- EXPORT ---
  const pngData = await canvas.encode('png')
  Bun.write(`./examples/tetris/output.png`, pngData)
}

function tetrisFill(grid, { ctx, w, h, module_size, size }){
  let unused_grid = new PixelGrid(size, size)
  let used_grid = new PixelGrid(size,size)
  let fits = findFits(grid,tetrominoes)
  let num_shapes = 0
  for(let i = 0; i < fits.length * 3; i++){
    let index = Math.floor(Math.random() * fits.length)
    let { shape, coords } = fits[index]
    let gradient_rect = [(coords.x) * module_size,(coords.y) * module_size,coords.x * module_size, (shape.h + coords.y) * module_size]
    let gradient = ctx.createLinearGradient(...gradient_rect)
    gradient.addColorStop(0.0,hueman(shape.hue,0.8,0.55))
    gradient.addColorStop(1.0,hueman(shape.hue,1,0.4))
    if(!shape.points.some(([px,py]) => used_grid.usedPixel(px+coords.x,py+coords.y))){
      num_shapes++
      shape.points.forEach(([px,py]) => {
        let x = px + coords.x
        let y = py + coords.y
        ctx.fillStyle = gradient
        ctx.fillRect(x * module_size, y * module_size, module_size, module_size)
        ctx.strokeStyle = hueman(shape.hue,1,0.75,1)
        ctx.lineWidth = module_size/10
        ctx.beginPath()
        ctx.rect((x + 0.1) * module_size, (y + 0.1) * module_size, module_size * 0.8, module_size * 0.8)
        ctx.closePath()
        ctx.stroke()
        used_grid.setPixel(x,y,true)
        let r = module_size * 0.4
        ctx.fillStyle = hueman(shape.hue,1,0.25,1)
        ctx.beginPath()
        ctx.rect((x+0.3) * module_size, (y+0.3) * module_size,r,r)
        ctx.closePath()
        ctx.fill()
      })
    }
  }
  for(let y = 0; y < size; y++){
    for(let x = 0; x < size; x++){
      if(!used_grid.usedPixel(x,y) && grid.usedPixel(x,y)){
        unused_grid.setPixel(x,y,grid.getPixel(x,y))
      }
    }
  }
  return unused_grid // return unused pixel grid: ;
}

function b_w_squares(grid,{ ctx, w, h, module_size, size }){
  for(let y = 0; y < size; y++){
    for(let x = 0; x < size; x++){
      if(grid.usedPixel(x,y)){
        ctx.lineWidth = 0
        ctx.fillStyle = grid.getPixel(x,y) ? '#000' : 'transparent'
        ctx.fillRect(x * module_size, y * module_size, module_size, module_size)
        if(grid.getPixel(x,y)){
          ctx.strokeStyle = 'rgba(255,255,255,0.2)'
          ctx.lineWidth = module_size/10
          ctx.beginPath()
          ctx.rect((x + 0.1) * module_size, (y + 0.1) * module_size, module_size * 0.8, module_size * 0.8)
          ctx.closePath()
          ctx.stroke()
        }
      }
    }
  }
  return grid 
}

function b_w_veritcal_rods(grid,{ ctx, w, h, padding, module_size, size }){
  for(let y = 0; y < size; y++){
    for(let x = 0; x < size; x++){
      if(grid.usedPixel(x,y) && grid.getPixel(x,y)){
        if(!grid.getPixel(x,y-1)){
          let height = 1
          while(grid.usedPixel(x,y+height) && grid.getPixel(x,y+height)){
            height++;
          }
          ctx.fillStyle =  `rgba(0,0,0,0.6)`
          ctx.beginPath()
          ctx.roundRect((x + 0.35) * module_size, (y + 0.15) * module_size, module_size * 0.3, module_size * 0.7 + module_size * (height - 1), module_size * 0.05)
          ctx.closePath()
          ctx.fill()

        }
      }
    }
  }
  return grid 
}