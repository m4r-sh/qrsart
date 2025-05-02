export function findFits(grid,shapes){
  let sols = []
  Object.keys(shapes).forEach(k => {
    let shape = shapes[k]
    for(let [x,y] of grid.tiles()){
      let is_valid = true
      try {
        shape.points.forEach(([px,py,v=1]) => {
          is_valid &= grid.used(x+px,y+py) && grid.get(x+px,y+py) == v
        })
      } catch(e){
        is_valid = false
      }
      if(is_valid){
        sols.push([k,[x,y]])
      }
    }
  })
  return sols.map(([k,[x,y]]) => ({ shape: shapes[k], coords: {x,y} }))
}


function isPiecePlacementValid(grid,shape,{x,y}){
  try{
    let flag = 1
    shape.points.forEach(([px,py]) => {
      flag &= grid.get(x + px, y + py)
    })
    return flag
  } catch(e){
    return false
  }
}
