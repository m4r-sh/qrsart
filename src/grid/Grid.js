export class Grid {
  constructor(w, h, valueBits = null, usedBits = null) {
    this.w = w;
    this.h = h ? h : w;
    const totalTiles = this.w * this.h;
    const wordCount = (totalTiles + 31) >> 5;
    
    if (valueBits === null) {
      this.valueBits = new Uint32Array(wordCount);
    } else {
      if (!(valueBits instanceof Uint32Array) || valueBits.length !== wordCount) {
        throw new Error(`Provided valueBits must be a Uint32Array of correct length. Expected ${wordCount}, got ${valueBits.length}`);
      }
      this.valueBits = valueBits;
    }
    
    if (usedBits === null) {
      this.usedBits = new Uint32Array(wordCount);
    } else {
      if (!(usedBits instanceof Uint32Array) || usedBits.length !== wordCount) {
        throw new Error(`Provided usedBits must be a Uint32Array of correct length. Expected ${wordCount}, got ${usedBits.length}`);
      }
      this.usedBits = usedBits;
    }
  }

  #getBitPos(x, y) {
    const idx = y * this.w + x;
    return [idx >> 5, idx & 31]; // [uint32 index, bit offset]
  }

  clear(){
    this.valueBits.fill(0)
    this.usedBits.fill(0)
  }

  set(x = 0, y = 0, v = 1) {
    if (x < 0 || x >= this.w || y < 0 || y >= this.h) return;
    const [i, s] = this.#getBitPos(x, y);
    const bit = 1 << s;

    // Set value bit
    if (v & 1) this.valueBits[i] |= bit;
    else this.valueBits[i] &= ~bit;

    // Mark as used
    this.usedBits[i] |= bit;
  }

  get(x = 0, y = 0) {
    if (x < 0 || x >= this.w || y < 0 || y >= this.h) return 0;
    const [i, s] = this.#getBitPos(x, y);
    const bit = 1 << s;
    return (this.valueBits[i] & bit) ? 1 : 0;
  }

  used(x = 0, y = 0) {
    if (x < 0 || x >= this.w || y < 0 || y >= this.h) return 0;
    const [i, s] = this.#getBitPos(x, y);
    const bit = 1 << s;
    return (this.usedBits[i] & bit) ? 1 : 0;
  }
  *ons(){ yield* this.tiles(true) }
  *offs(){ yield* this.tiles(false) }
  *tiles(onlyOn = null) {
    const { w, h, usedBits, valueBits } = this;
    const totalTiles = w * h;
    const wordCount = usedBits.length;

    for (let i = 0; i < wordCount; i++) {
      const used = usedBits[i];
      if (used === 0) continue;

      const values = valueBits[i];
      const baseIdx = i << 5;

      for (let j = 0; j < 32; j++) {
        const idx = baseIdx + j;
        if (idx >= totalTiles) break;

        const mask = 1 << j;
        if (!(used & mask)) continue;

        const isOn = (values & mask) !== 0;
        if (onlyOn == null || (!onlyOn == !isOn)) {
          yield [idx % w, Math.floor(idx / w), isOn];
        }
      }
    }
  }

  clone() {
    return new Grid(this.w, this.h, this.valueBits.slice(), this.usedBits.slice());
  }

  crop(x,y,w,h){
    const grid = new Grid(w,h)
    for(let i = 0; i < w; i++){
      for(let j = 0; j < h; j++){
        grid.set(i,j,this.get(i+x,j+y))
      }
    }
    return grid
  }

  frame(x,y,w,h){
    return this.crop(-x,-y,w,h)
  }

  // --- INSTANCE METHODS ---
  union(...grids) {
    const wordCount = this.valueBits.length;
    for (const grid of grids) {
      for (let i = 0; i < wordCount; i++) {
        this.valueBits[i] |= (grid.valueBits[i] & grid.usedBits[i]);
        this.usedBits[i] |= grid.usedBits[i];
      }
    }
    return this;
  }

  erase(...gridsToErase) {
    const wordCount = this.valueBits.length;
    const mask_used = new Uint32Array(wordCount);
    for (const grid of gridsToErase) {
      for (let i = 0; i < wordCount; i++) {
        mask_used[i] |= grid.usedBits[i];
      }
    }
    for (let i = 0; i < wordCount; i++) {
      this.usedBits[i] &= ~mask_used[i];
      this.valueBits[i] &= this.usedBits[i];
    }
    return this;
  }

  intersect(...gridsToIntersect) {
    const wordCount = this.valueBits.length;
    const mask_used = new Uint32Array(wordCount).fill(0xFFFFFFFF >>> 0);
    for (const grid of gridsToIntersect) {
      for (let i = 0; i < wordCount; i++) {
        mask_used[i] &= grid.usedBits[i];
      }
    }
    for (let i = 0; i < wordCount; i++) {
      this.usedBits[i] &= mask_used[i];
      this.valueBits[i] &= this.usedBits[i];
    }
    return this;
  }

  invert() {
    const wordCount = this.valueBits.length;
    for (let i = 0; i < wordCount; i++) {
      this.valueBits[i] = (~this.valueBits[i] & this.usedBits[i]) >>> 0;
    }
    return this;
  }

  xor(grid) {
    const wordCount = this.valueBits.length;
    for (let i = 0; i < wordCount; i++) {
      this.valueBits[i] ^= grid.valueBits[i];
      this.usedBits[i] |= grid.usedBits[i];
    }
    return this;
  }

  // --- IMMUTABLE STATIC METHODS ---
  static union(og,...rest) { return og.clone().union(...rest) }
  static erase(og, ...rest) { return og.clone().erase(...rest) }
  static intersect(og, ...rest) { return og.clone().intersect(...rest) }
  static invert(og) { return og.clone().invert() }
  static xor(og, other) {  return og.clone().xor(other) }
}
