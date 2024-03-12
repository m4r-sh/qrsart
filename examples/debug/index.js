import { createQR, PixelGrid } from '../../src'
import { createCanvas, loadImage } from '@napi-rs/canvas'
import { hueman } from 'hueman'
  
// --- QR CREATION ---

let qr = createQR('https://github.com/m4r-sh/qrsart', {
  minVersion: 7,
  minEcl: 'medium',
  mask: 5
})

debug(qr)

export async function debug(qr){
  // --- CANVAS SETUP ---
  let module_size = 100
  let padding = 4 * module_size
  let size = qr.size
  let w = padding * 2 + size * module_size
  let h = padding * 2 + size * module_size
  let canvas = createCanvas(w,h)
  let ctx = canvas.getContext('2d')
  ctx.fillStyle = '#fff'
  ctx.fillRect(0,0,w,h)
  ctx.translate(padding,padding)

  // --- Rendering Layers ---

  // 1. Timing Patterns (PURPLE)
  hue_squares(qr.timing_patterns,{ hue: 300, ctx, w, h, module_size, size })
  // 2. Finder Patterns (RED)
  hue_squares(qr.finder_patterns,{ hue: 0, ctx, w, h, module_size, size })
  // 3. Alignment Patterns (ORANGE)
  hue_squares(qr.alignment_patterns,{ hue: 30, ctx, w, h, module_size, size })
  // 4. Format Pattern (GREEN)
  hue_squares(qr.format_pattern,{ hue: 160, ctx, w, h, module_size, size })
  // 5. Version Pattern (BLUE)
  hue_squares(qr.version_pattern,{ hue: 220, ctx, w, h, module_size, size })
  // 6. Data Pattern (BLACK/WHITE)
  hue_squares(qr.data_pattern,{ hue: 220, sat: 0, ctx, w, h, module_size, size })

  // --- EXPORT ---
  const pngData = await canvas.encode('png')
  Bun.write(`./examples/debug/output.png`, pngData)
}


function hue_squares(grid,{ hue=0, sat=1, ctx, w, h, module_size, size}={}){
  for(let y = 0; y < size; y++){
    for(let x = 0; x < size; x++){
      if(grid.usedPixel(x,y)){
        if(grid.getPixel(x,y)){
          ctx.fillStyle = hueman(hue,sat,sat == 0 ? 0 : 0.3)
        } else {
          ctx.fillStyle =hueman(hue,sat, sat == 0 ? 1 : 0.8)
        }
        ctx.fillRect(x * module_size, y * module_size, module_size, module_size)
      }
    }
  }
  return grid 
}