import { search, permute, batch } from './dist/search'
import { allStrategies, optimalStrategy } from './src/segments'

main()

function main(){

  let res = optimalStrategy('HTTPS://qrs.ART',{ minVersion: 2, minEcl: 2 })
  console.log(res.codewords)

  // let permutation = permute('url','http://QRS.ART',{
  //   domainCaps: false,
  //   protocolCaps: true,
  //   pathCaps: false
  // })

  // console.log(`permutations: ` + permutation.total)

  // let arr = batch(permutation)

  // console.log(`batch: ` + arr.length)

  // let record = new Set();

  // let ecl = 2
  // let version = 2

  // let total_count = 0
  // for(let item of arr){
  //   let all_possible_segs = allStrategies(item,version,ecl)
  //   total_count+=all_possible_segs.length
  //   all_possible_segs.forEach(s => {
  //     record.add(item+s.steps.map(str => str[0]).join(','))
  //   })
  // }
  // console.log({total_count})
  // let results = search(
  //   batch(permutation),
  //   function priorityFn(qr){
  //     let darkcount = 0
  //     for(let [x,y] of qr.grid.tiles(1)){
  //       darkcount++
  //     }
  //     return { score: darkcount }
  //   },
  //   {
  //     capacity: 5,
  //     ecl,
  //     version
  //   }
  // )

  // console.log(results)
}