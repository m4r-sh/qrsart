import { Grid } from '../../grid'

export function tileClusters(grid, { diagonal=false, value=true } = {}){
  let visited = new Grid(grid.w,grid.h)
  const shapes = [];
  const dots = [];

  function floodFill(x, y, shape) {
    if(!grid.used(x,y)){ return }
    if((grid.get(x,y) != value )|| visited.get(x,y)){ return }
    visited.set(x,y,true)
    shape.push([x, y]);
    floodFill(x - 1, y, shape);
    floodFill(x + 1, y, shape);
    floodFill(x, y - 1, shape);
    floodFill(x, y + 1, shape);
    if (diagonal) {
      floodFill(x - 1, y - 1, shape);
      floodFill(x + 1, y - 1, shape);
      floodFill(x - 1, y + 1, shape);
      floodFill(x + 1, y + 1, shape);
    }
  }

  for(let [x,y] of grid.tiles(value)){
    if(!visited.get(x,y)){
      const shape = [];
      floodFill(x, y, shape);
      if(shape.length > 1){ shapes.push(shape) }
      else { dots.push(shape[0]) }
    }
  }

  return {
    scores: {
      get num_dots(){ return dots.length },
      get num_shapes(){ return shapes.length },
      get biggest_shape(){
        if(shapes.length > 0){ return Math.max(...shapes.map(shape => shape.length)) }
        return dots.length > 0 ? 1 : 0
      }
    },
    cache: {
      shapes,
      dots
    }
  }
}
