const ROOT_INDEX = 1;

export class MinQueue {
  constructor(capacity = 64, objects = [], priorities = []) {
    if (capacity < 1) throw new Error("Capacity must be positive");
    this._capacity = capacity;
    this._objects = new Array(capacity + ROOT_INDEX);
    this._priorities = new Float64Array(capacity + ROOT_INDEX);
    this.length = objects.length;

    if (objects.length !== priorities.length) throw new Error("Objects/priorities mismatch");
    if (capacity < objects.length) throw new Error("Capacity too small");

    for (let i = 0; i < objects.length; i++) {
      this._objects[i + ROOT_INDEX] = objects[i];
      this._priorities[i + ROOT_INDEX] = priorities[i];
    }
    for (let i = objects.length >>> 1; i >= ROOT_INDEX; i--) this.#bubbleDown(i);
  }

  get capacity() { return this._capacity }
  clear() { this.length = 0 }
  size() { return this.length }

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
    let halfLength = ROOT_INDEX + (this.length >>> 1), lastIndex = this.length + ROOT_INDEX - 1;
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

  push(object, priority) {
    if (this.length === this._capacity) throw new Error("Heap full");
    let pos = this.length + ROOT_INDEX;
    this._objects[pos] = object;
    this._priorities[pos] = priority;
    this.length++;
    this.#bubbleUp(pos);
  }

  pop() {
    if (!this.length) return undefined;
    const result = this._objects[ROOT_INDEX];
    this._objects[ROOT_INDEX] = this._objects[this.length + ROOT_INDEX - 1];
    this._priorities[ROOT_INDEX] = this._priorities[this.length + ROOT_INDEX - 1];
    this.length--;
    if (this.length > 0) this.#bubbleDown(ROOT_INDEX);
    return result;
  }

  peekPriority() { return this._priorities[ROOT_INDEX] }
  peek() { return this._objects[ROOT_INDEX] }

  consider(score, object) {
    if (this.length < this._capacity) {
      this.push(object, score);
      return true
    } else if (score > this._priorities[ROOT_INDEX]) {
      this._objects[ROOT_INDEX] = object;
      this._priorities[ROOT_INDEX] = score;
      this.#bubbleDown(ROOT_INDEX);
      return true
    }
    return false
  }

  extractAll() {
    const results = [];
    while (this.length > 0) {
      const score = this._priorities[ROOT_INDEX];
      const object = this.pop();
      results.unshift({ score, object });
    }
    return results;
  }
}