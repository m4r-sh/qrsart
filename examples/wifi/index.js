import { createQR, PixelGrid, permuteWIFI } from '../../src'
import { createCanvas, loadImage } from '@napi-rs/canvas'
import { hueman } from 'hueman'
  
// --- QR CREATION ---

let wifi_options = permuteWIFI('Example','PASSWORD69420')

let qr = createQR(wifi_options[0], {
  minVersion: 2,
  minEcl: 'quartile',
  mask: 2
})

console.log({
  version: qr.version,
  mask: qr.mask,
  ecl: qr.ecl
})

wifi(qr)

export async function wifi(qr){
  // --- CANVAS SETUP ---
  let module_size = 100
  let size = qr.size
  let padding = size * module_size * (Math.sqrt(2) / 3)
  let w = padding * 2 + size * module_size
  let h = padding * 2 + size * module_size
  let canvas = createCanvas(w,h)
  let ctx = canvas.getContext('2d')
  ctx.fillStyle = '#fff'
  ctx.fillRect(0,0,w,h)
  ctx.translate(w/2,h/2)
  ctx.rotate(45 * (Math.PI / 180))
  ctx.translate(-w/2,-h/2)
  ctx.translate(padding,padding)

  // --- Rendering Layers ---

  black_squares(PixelGrid.combine(
    qr.finder_grid,
    qr.alignment_grid,
    qr.timing_grid,
  ),{ hue: 280, sat: 0, ctx, w, h, module_size, size })

  radial_lines(PixelGrid.combine(
    qr.format_grid,
    qr.version_grid,
    qr.data_grid
  ),{ ctx, w, h, module_size, size })

  // --- EXPORT ---
  const pngData = await canvas.encode('png')
  Bun.write(`./examples/wifi/output.png`, pngData)
}


function black_squares(grid,{ hue=0, sat=1, ctx, w, h, module_size, size}={}){
  for(let y = 0; y < size; y++){
    for(let x = 0; x < size; x++){
      if(grid.usedPixel(x,y) && grid.getPixel(x,y)){
        ctx.fillStyle = '#000000'
        ctx.fillRect(x * module_size, y * module_size, module_size, module_size)
      }
    }
  }
  return grid 
}

function radial_lines(grid,{ ctx, w, h, module_size, size}={}){
  for(let rad_i = 0; rad_i < size * Math.sqrt(2); rad_i++){
    let every_n = 2
    let hue_range = 100
    let hue_start = 200
    let thic = 0.5 + (rad_i % every_n == 0 ? 0.5 : 0.1)
    let gap = (1 - thic) / 2
    let in_thic = rad_i % every_n == 0 ? thic / 2 : thic
    let in_gap = (1 - in_thic) / 2
    let fill_fn = dist => hueman(rad_i * (hue_range / size) + hue_start,  rad_i % every_n == 0 ? 1 - dist : dist, rad_i % every_n == 0 ? 0.5 : 0.4)
    let fill = fill_fn(0)
    // x row
    for(let x = size-rad_i; x < size; x++){
      let y = size - rad_i - 1
      let dist = (x - (size - rad_i)) / (rad_i)
      if(grid.usedPixel(x,y)){
        ctx.fillStyle = fill_fn(dist);
        ctx.fillRect(x * module_size, (y + gap) * module_size, module_size, module_size * thic)
        if(!grid.getPixel(x,y)){
          ctx.fillStyle = '#fff';
          ctx.fillRect(x * module_size, (y + in_gap) * module_size, module_size, module_size * in_thic)
        }
      }
      // OUTER RING (flair)
      if(y < 0 && distance({x:size*0.75,y:size*0.75},{x,y}) <= size*0.75 * Math.sqrt(2)){
        ctx.fillStyle = fill_fn(dist);
        ctx.fillRect(x * module_size, (y + gap) * module_size, module_size, module_size * thic)
        if(Math.random() < 0.5){
          ctx.fillStyle = '#fff';
          ctx.fillRect(x * module_size, (y + in_gap) * module_size, module_size, module_size * in_thic)
        }
      }
    }
    // y col
    for(let y = size-rad_i; y < size; y++){
      let x = size - rad_i - 1
      let dist = (y - (size - rad_i)) / (rad_i)
      if(grid.usedPixel(x,y)){
        ctx.fillStyle = fill_fn(dist);
        ctx.fillRect((x + gap) * module_size, y * module_size, module_size * thic, module_size)
        if(!grid.getPixel(x,y)){
          ctx.fillStyle = '#fff';
          ctx.fillRect((x + in_gap) * module_size, y * module_size, module_size * in_thic, module_size)
        }
      }
      // OUTER RING (flair)
      if(x < 0 && distance({x:size*0.75,y:size*0.75},{x,y}) <= size*0.75 * Math.sqrt(2)){
        ctx.fillStyle = fill_fn(dist);
        ctx.fillRect((x + gap) * module_size, y * module_size, module_size * thic, module_size)
        if(Math.random() < 0.5){
          ctx.fillStyle = '#fff';
          ctx.fillRect((x + in_gap) * module_size, y * module_size, module_size * in_thic, module_size)
        }
      }
    }
    // vertex
    {
      let x = size - rad_i - 1
      let y = size - rad_i - 1
      if(grid.usedPixel(x,y)){
        ctx.fillStyle = fill;
        ctx.fillRect((x + gap) * module_size, (y + gap) * module_size, module_size * thic, module_size)
        ctx.fillRect((x + gap) * module_size, (y + gap) * module_size, module_size, module_size * thic)
      }
    }
  }
}

function distance(p1,p2){
  return Math.sqrt(Math.pow(p1.x - p2.x,2) + Math.pow(p1.y - p2.y,2))
}