import { allStrategies, CodewordSequence, optimalStrategy  } from "./encode"
import { QR } from "./grid"
import { standardPenalty } from "./features"


function parseMask(mask){
  if(Number.isInteger(mask) && mask >= 0 && mask <= 7){ return mask }
  return -1
}


export function *iterateQRs(data, encodingOptions={}){
  let dat = data.toString()
  let { icon, preview } = data
  let { version, ecl } = optimalStrategy(dat, encodingOptions)
  for(let strategy of allStrategies(dat, version, ecl)){
    let codewords = new CodewordSequence(dat,strategy,version,ecl)
    let qr = new QR({ version, ecl, codewords, mask: 0, icon, preview, data: dat })
    yield qr
    for(let m = 1; m < 8; m++){
      qr.mask = m
      yield qr
    }
  }
}

export function createQR(data, options={}){
  let { mask, ...encodingOptions } = options
  mask = parseMask(mask)
  let dat = data.toString()
  let { icon, preview } = data
  let { strategy, version, ecl } = optimalStrategy(dat, encodingOptions)
  let codewords = new CodewordSequence(dat, strategy, version, ecl)
  if(mask == -1){
    let qr = new QR({ version, ecl, codewords, mask: 0, icon, preview, data: dat }) 
    let best = [ standardPenalty(qr.grid).scores.penalty, 0 ]
    for(let m = 1; m < 8; m++){
      qr.mask = m
      let penalty = standardPenalty(qr.grid).scores.penalty
      if(penalty < best[0]){ best = [penalty, m] }
    }
    qr.mask = best[1]
    return qr
  } else {
    return new QR({ version, ecl, codewords, mask, icon, preview, data: dat })  
  }
}

export { ECLS, MASKS, MODES, getNumDataCodewords, getNumRawDataModules, supportsKanji } from './utils'
export { Grid, QR, getMaskGrid, getDataPath, getAlignmentPositions, getFunctionalGrid } from './grid'
export { optimalStrategy, CodewordSequence, findMinimumVersion, allStrategies, naiveStrategy, minStrategy, Strategy } from './encode'
export { TopN, BottomN, Leaderboard, standardPenalty, findFits, packShapes, tileClusters, penStrokes } from './features'
export { rectPath, boxPath, circlePath, getIconBox, drawDots, drawAligns, drawFinders, drawSVG } from './render'

export * from './data'
