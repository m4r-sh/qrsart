export class Grid {
  constructor(w, h) {
    this.w = w
    this.h = h
    // Each byte stores 4 tiles (2 bits per pixel: 1 for value, 1 for used)
    this.data = new Uint8Array(Math.ceil((w * h) / 4))
  }

  #getPosition(x, y) {
    const idx = y * this.w + x
    return [idx >> 2, (idx & 3) << 1] // [byteIdx, shift]
  }

  set(x = 0, y = 0, v = 1) {
    if (x < 0 || x >= this.w || y < 0 || y >= this.h) return
    const [byteIdx, shift] = this.#getPosition(x, y)
    const mask = 3 << shift;
    const val = (v & 1) << shift | (1 << (shift + 1));
    this.data[byteIdx] = (this.data[byteIdx] & ~mask) | val
  }

  get(x = 0, y = 0) {
    if (x < 0 || x >= this.w || y < 0 || y >= this.h) return 0
    const [byteIdx, shift] = this.#getPosition(x, y)
    return (this.data[byteIdx] >> shift) & 1
  }

  used(x = 0, y = 0) {
    if (x < 0 || x >= this.w || y < 0 || y >= this.h) return 0
    const [byteIdx, shift] = this.#getPosition(x, y)
    return (this.data[byteIdx] >> (shift + 1)) & 1
  }

  *tiles(onlyOn = null) {
    const { w, h, data } = this
    let total_tiles = w * h
    for (let i = 0; i < data.length; i++) {
      const byte = data[i];
      if (byte === 0) continue;
      const idxBase = i << 2;
      for (let j = 0; j < 4; j++) {
        const idx = idxBase + j;
        if (idx >= total_tiles) break;
        const shift = j << 1;
        
        const isUsed = byte & (2 << shift);
        if (!isUsed) continue; // Skip unused tiles if onlyUsed is true

        const isOn = byte & (1 << shift);
        if(onlyOn == null || (!onlyOn == !isOn)){
          yield [idx % w, Math.floor(idx / w)]
        }
      }
    }
  }


  static union(...grids) {
    const max_w = Math.max(...grids.map(g => g.w))
    const max_h = Math.max(...grids.map(g => g.h))
    const result = new Grid(max_w, max_h)

    // Only iterate over used tiles from all grids
    for (const grid of grids) {
      for (const [x,y] of grid.tiles()) {
        if(!result.get(x,y)){
          result.set(x,y,grid.get(x,y))
        }
      }
    }
    return result
  }

  static erase(og,...grids) {
    const result = new Grid(og.w, og.h)
    for(const [x,y] of og.tiles()){
      if(!grids.some(g => g.used(x,y))){
        result.set(x,y,og.get(x,y))
      }
    }
    return result
  }

  static intersect(og,...grids) {
    const result = new Grid(og.w, og.h);
    for (const [x, y] of og.tiles()) {
      if (grids.every(g => g.used(x, y))) {
        result.set(x, y, og.get(x, y));
      }
    }
    return result;
  }
}