import { MinQueue } from './MinQueue'
import { permutations } from "./permutations"
import { QRCode } from '../QRCode'
import { allStrategies, optimalStrategy, constructCodewords } from '../segments'

export { allStrategies, optimalStrategy, constructCodewords, permutations }

export function search(batch,priorityFn,{
  capacity= 20,
  ecl,
  version
}={}){

  if(ecl == null || version == null){
    let opt = optimalStrategy(batch[0])
    if(ecl == null){ ecl = opt.ecl }
    if(version == null){ version = opt.version }
  }

  const queue = new MinQueue(capacity)
  let queue_items = []

  
  for(let item of batch){
    let all_segs = allStrategies(item,version,ecl)
    let encodings = all_segs.map(s => constructCodewords(item,s.steps,version,ecl))
    for(let codewords of encodings){
      for(let m = 0; m < 8; m++){
        let qr_params = { version, ecl, mask: m, codewords }
        let qr = new QRCode(qr_params)
        let { score, ...obj } = priorityFn(qr);
        queue.consider(score, { qr, item, computed: obj })
      }
    }
  }

  return queue.extractAll().map(x => ({
    ...x.object,
    score: x.score,
  }))
}

export function permute(type='url',value='https://qrs.art',options={}){
  return permutations[type](value,options)
}

export function batch(permutation = {},{
  start = 0,
  stride = 1,
  limit=null,
  loop=null
}={}){
  let { total, get } = permutation
  if(limit == null){ limit = total }
  if(loop == null){ loop = total }
  let results = []
  for(let i = 0; i < limit; i++){
    let index = (start + i * stride) % loop
    if(index >= total){ continue } // skip inflated values for even looping
    results.push(get(index))
  }
  return results;
}