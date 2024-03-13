export class PixelGrid {
  constructor(w,h){
    this.arr = new Uint8Array(w * h);
    this.used = new Uint8Array(w * h)
    this.w = w;
    this.h = h;
  }
  setPixel(x=0,y=0,v=1){
    let { w, h } = this
    if(x < 0 || x >= w || y < 0 || y >= h) return;
    this.arr[y * w + x] = (v & 1)
    this.used[y * w + x] = 1
  }
  getPixel(x=0,y=0){
    let { w, h } = this
    if(x < 0 || x >= w || y < 0 || y >= h) return 0;
    return this.arr[y * w + x]
  }
  usedPixel(x=0,y=0){
    let { w, h } = this
    if(x < 0 || x >= w || y < 0 || y >= h) return 0;
    return this.used[y * w + x]
  }
  static combine(...grids){
    let max_w = Math.max(...grids.map(g => g.w))
    let max_h = Math.max(...grids.map(g => g.h))
    let grid = new PixelGrid(max_w,max_h)
    for(let i = 0; i < max_w; i++){
      for(let j = 0; j < max_h; j++){
        if(grids.some(g => g.usedPixel(i,j))){
          grid.setPixel(i,j,grids.some(g => g.getPixel(i,j)))
        }
      }
    }
    return grid
  }
}