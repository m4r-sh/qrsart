import { MinQueue } from './MinQueue'
import { permutations } from "./permutations"
import { QRCode } from '../QRCode'
import { findAllSegmentations } from '../segments'


export function search(batch,priorityFn,{
  capacity= 20,
  ecl=0,
  version=2
}={}){

  const queue = new MinQueue(capacity)
  let queue_items = []
  
  for(let item of batch){
    for(let {bitstring} of findAllSegmentations(item,version,ecl)){
      for(let m = 0; m < 8; m++){
        let qr_params = { version, ecl, mask: m, bitstring }
        let qr = new QRCode(qr_params)
        let { score, obj } = priorityFn(qr);
        queue.consider(score, { obj, qr_params})
      }
    }
  }

  return queue.extractAll()
}

export function permute(type='url',value='https://qrs.art',options={}){
  return permutations[type](value,options)
}

export function batch({
  permutation = {},
  start = 0,
  stride = 1,
  limit=1000,
  loop=20_000
}){
  let { total, get } = permutation
  let results = []
  for(let i = 0; i < limit; i++){
    let index = (start + i * stride) % loop
    if(index >= total){ continue } // skip inflated values for even looping
    results.push(get(index))
  }
  return results;
}