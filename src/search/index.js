import { MinQueue } from './MinQueue'
import { permutations } from "./permutations"

export { permutations, MinQueue }

export function permuteData(type='url',value='https://qrs.art',options={}){
  let p = permutations[type](value,options)
  p[Symbol.iterator] = function* (){ yield* iterateBatch(p,0,1) }
  return p
}

export function *iterateBatch(permSet, start=0, stride=1){
  let { total, get } = permSet
  for(let i = start; i < total; i+=stride){
    yield get(i)
  }
}