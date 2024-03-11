export const tetrominoes = getAllTetrominoes()

export function findFits(grid,shapes){
  let sols = []
  Object.keys(shapes).forEach(k => {
    let shape = shapes[k]
    for(let x = 0; x < grid.w; x++){
      for(let y = 0; y < grid.h; y++){
        if(isPiecePlacementValid(grid,shape,{ x, y })){
          sols.push({ shape_id: k, shape, coords: {x,y}})
        }
      }
    }
  })
  return sols
}

function getAllTetrominoes(){
  let dict = {}
  let tetris_colors = {
    o: { hue: 50 },
    i: { hue: 180 },
    t: { hue: 270 },
    s: { hue: 100 },
    z: { hue: 350 },
    l: { hue: 25 },
    r: { hue: 220 }
  }
  let all_shapes = get_shape_coordinates()
  Object.keys(all_shapes).forEach(k => {
    let vals = all_shapes[k]
    vals.forEach((coords,i) => {
      dict[`${k}_${i}`] = {
        points: coords,
        hue: tetris_colors[k].hue,
        w: Math.max(...coords.map(xy => xy[0])),
        h: Math.max(...coords.map(xy => xy[1]))
      }
    })
  })
  return dict;
}

function isPiecePlacementValid(grid,shape,{x,y}){
  try{
    let flag = 1
    shape.points.forEach(([px,py]) => {
      flag &= grid.getPixel(x + px, y + py)
    })
    return flag
  } catch(e){
    return false
  }
}

export function get_shape_coordinates(){
  let I = coordinatesToMask([[0,0],[0,1],[0,2],[0,3]])
  let L = coordinatesToMask([[0,0],[0,1],[0,2],[1,2]])
  let R = coordinatesToMask([[0,0],[1,0],[0,1],[0,2]])
  let S = coordinatesToMask([[0,1],[1,1],[1,0],[2,0]])
  let Z = coordinatesToMask([[0,0],[1,0],[1,1],[2,1]])
  let T = coordinatesToMask([[0,0],[1,0],[2,0],[1,1]])
  let O = coordinatesToMask([[0,0],[1,0],[0,1],[1,1]])

  let dict = {
    o: [O],
    i: [I,rotate90(I)],
    s: [S,rotate90(S)],
    z: [Z,rotate90(Z)],
    l: [L,rotate90(L),rotate90(rotate90(L)),rotate90(rotate90(rotate90(L)))],
    r: [R,rotate90(R),rotate90(rotate90(R)),rotate90(rotate90(rotate90(R)))],
    t: [T,rotate90(T),rotate90(rotate90(T)),rotate90(rotate90(rotate90(T)))]
  }

  let mapped_dict = {}
  Object.keys(dict).forEach(k => {
    mapped_dict[k] = dict[k].map(maskToCoordinates)
  })
  return mapped_dict
}

function coordinatesToMask(points=[]){
  // let [max_x,max_y] = points[0]
  // points.forEach(([x,y]) => {
  //   max_x = Math.max(x,max_x)
  //   max_y = Math.max(y,max_y)
  // })
  let max_x = Math.max(...points.map(xy => xy[0]))
  let max_y = Math.max(...points.map(xy => xy[1]))
  let mask = Array.from(Array(max_y+1), _ => Array(max_x+1).fill(0));
  points.forEach(([x,y]) => { mask[y][x] = 1 })
  return mask
}

function maskToCoordinates(mask){
  let pts = []
  for(let r = 0; r < mask.length; r++){
    for(let c = 0; c < mask[r].length; c++){
      if(mask[r][c]){
        pts.push([c,r])
      }
    }
  }
  return pts
}

function rotate90(matrix){
  return matrix[0].map((val, index) => matrix.map(row => row[index]).reverse())
}
