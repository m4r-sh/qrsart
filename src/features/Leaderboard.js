export class Leaderboard {
  constructor(scorer, options={}){
    this.scorer = scorer
    this.options = { capacity: 4, ...options }
    this.callbacks = []
    this.buckets = {}
  }

  getOrMakeBuckets(metric){
    if(!this.buckets[metric]){
      this.buckets[metric] = {
        min: new BottomN(this.options.capacity),
        max: new TopN(this.options.capacity),
      }
    }
    return this.buckets[metric]
  }

  consider(qr){
    qr = qr.clone()
    let { scores, cache = null } = this.scorer(qr)
    if(!scores){
      throw new Error("Leaderboard scorer must return { scores }")
    }
    for(let [metric, score] of Object.entries(scores)){
      let buckets = this.getOrMakeBuckets(metric)
      let min = { metric, direction: "min", score, qr, cache }
      let max = { metric, direction: "max", score, qr, cache }
      if(buckets.min.consider(score, min)){
        this.notify(min)
      }
      if(buckets.max.consider(score, max)){
        this.notify(max)
      }
    }
  }

  listen(cb){
    this.callbacks.push(cb)
  }

  notify(result){
    this.callbacks.forEach(cb => cb(result)) 
  }

  min(metric){
    return this.#standings(metric, "min")
  }

  max(metric){
    return this.#standings(metric, "max")
  }

  results(metric){
    return {
      min: [...this.min(metric)],
      max: [...this.max(metric)],
    }
  }

  allResults(){
    let results = {}
    for(let metric of Object.keys(this.buckets)){
      results[metric] = this.results(metric)
    }
    return results
  }

  *#standings(metric, direction){
    let buckets = this.buckets[metric]
    if(!buckets) throw "metric not in leaderboard"

    for(const { object } of buckets[direction]){
      yield object
    }
  }
}


const ROOT_INDEX = 1;

export class TopN {
  constructor(capacity = 64, objects = [], priorities = []) {
    if (capacity < 1) throw new Error("Capacity must be positive");
    this._capacity = capacity;
    this._objects = new Array(capacity + ROOT_INDEX);
    this._priorities = new Float64Array(capacity + ROOT_INDEX);
    this._length = objects.length;

    if (objects.length !== priorities.length) throw new Error("Objects/priorities mismatch");
    if (capacity < objects.length) throw new Error("Capacity too small");

    for (let i = 0; i < objects.length; i++) {
      this._objects[i + ROOT_INDEX] = objects[i];
      this._priorities[i + ROOT_INDEX] = priorities[i];
    }
    for (let i = objects.length >>> 1; i >= ROOT_INDEX; i--) this.#bubbleDown(i);
  }

  get capacity() { return this._capacity }
  get size(){ return this._length }

  #bubbleUp(index) {
    let object = this._objects[index], priority = this._priorities[index];
    while (index > ROOT_INDEX) {
      let parentIndex = index >>> 1;
      if (this._priorities[parentIndex] <= priority) break;
      this._objects[index] = this._objects[parentIndex];
      this._priorities[index] = this._priorities[parentIndex];
      index = parentIndex;
    }
    this._objects[index] = object;
    this._priorities[index] = priority;
  }

  #bubbleDown(index) {
    let object = this._objects[index], priority = this._priorities[index];
    let halfLength = ROOT_INDEX + (this._length >>> 1), lastIndex = this._length + ROOT_INDEX - 1;
    while (index < halfLength) {
      let left = index << 1, childPriority = this._priorities[left], childObject = this._objects[left], childIndex = left;
      let right = left + 1;
      if (right <= lastIndex && this._priorities[right] < childPriority) {
        childPriority = this._priorities[right];
        childObject = this._objects[right];
        childIndex = right;
      }
      if (childPriority >= priority) break;
      this._objects[index] = childObject;
      this._priorities[index] = childPriority;
      index = childIndex;
    }
    this._objects[index] = object;
    this._priorities[index] = priority;
  }

  #push(object, priority) {
    if (this._length === this._capacity) throw new Error("Heap full");
    let pos = this._length + ROOT_INDEX;
    this._objects[pos] = object;
    this._priorities[pos] = priority;
    this._length++;
    this.#bubbleUp(pos);
  }

  #pop() {
    if (!this._length) return undefined;
    const lastIndex = this._length + ROOT_INDEX - 1;
    const result = this._objects[ROOT_INDEX];
    this._objects[ROOT_INDEX] = this._objects[this._length + ROOT_INDEX - 1];
    this._priorities[ROOT_INDEX] = this._priorities[this._length + ROOT_INDEX - 1];
    this._objects[lastIndex] = null; // null out last slot
    this._priorities[lastIndex] = 0;
    this._length--;
    if (this._length > 0) this.#bubbleDown(ROOT_INDEX);
    return result;
  }

  peekPriority() { return this._priorities[ROOT_INDEX] }
  peek() { return this._objects[ROOT_INDEX] }

  consider(score, object) {
    if (this._length < this._capacity) {
      this.#push(object, score);
      return true
    } else if (score > this._priorities[ROOT_INDEX]) {
      this._objects[ROOT_INDEX] = object;
      this._priorities[ROOT_INDEX] = score;
      this.#bubbleDown(ROOT_INDEX);
      return true
    }
    return false
  }

  *drain() {
    while (this._length > 0) {
      const score = this.peekPriority();
      const object = this.#pop();
      yield { score, object };
    }
  }

  *[Symbol.iterator]() {
    const items = [];
    for (let i = ROOT_INDEX; i < this._length + ROOT_INDEX; i++) {
      items.push({
        score: this._priorities[i],
        object: this._objects[i]
      });
    }
    // Sort descending so min (root) ends up at the end
    items.sort((a, b) => b.score - a.score);
    for (const item of items) {
      yield item;
    }
  }
}

export class BottomN extends TopN {
  consider(score,object){
    return super.consider(-score, object)
  }
  peekPriority(){
    return -super.peekPriority()
  }

  *drain(){
    yield* super.drain()
  }
  *[Symbol.iterator](){
    for (const { score, object } of super[Symbol.iterator]()) {
      yield { score: -score, object }; 
    }
  }
}
