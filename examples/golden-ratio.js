import { createCanvas } from "canvas";
import fs from 'fs'
import { createQR } from "../src/index.js";

let qr = createQR('Golden ratio φ = 1.6180339887498948482045868343656381177203091798057628621354486227052604628189024497072072041893911374......')

const canvas = createCanvas(qr.size,qr.size)
const ctx = canvas.getContext("2d")

let {data_pattern, functional_patterns, timing_patterns, alignment_patterns, finder_patterns, grid } = qr

for(let i = 0 ; i < grid.w; i++){
  for(let j = 0; j < grid.h; j++){
    ctx.fillStyle = '#fff'
    if(finder_patterns.getPixel(i,j) || alignment_patterns.getPixel(i,j) ){
      ctx.fillStyle = 'hsl(30,100%,30%)'
    } else if(grid.getPixel(i,j)){
      ctx.fillStyle = 'hsl(40,100%,50%)'
    }
    ctx.fillRect(i,j,1,1)
  }
}

fs.writeFileSync('./qr.png',canvas.toBuffer())
