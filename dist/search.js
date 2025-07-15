// src/search/MinQueue.js
var ROOT_INDEX = 1;

class MinQueue {
  constructor(capacity = 64, objects = [], priorities = []) {
    if (capacity < 1)
      throw new Error("Capacity must be positive");
    this._capacity = capacity;
    this._objects = new Array(capacity + ROOT_INDEX);
    this._priorities = new Float64Array(capacity + ROOT_INDEX);
    this.length = objects.length;
    if (objects.length !== priorities.length)
      throw new Error("Objects/priorities mismatch");
    if (capacity < objects.length)
      throw new Error("Capacity too small");
    for (let i = 0;i < objects.length; i++) {
      this._objects[i + ROOT_INDEX] = objects[i];
      this._priorities[i + ROOT_INDEX] = priorities[i];
    }
    for (let i = objects.length >>> 1;i >= ROOT_INDEX; i--)
      this.#bubbleDown(i);
  }
  get capacity() {
    return this._capacity;
  }
  clear() {
    this.length = 0;
  }
  size() {
    return this.length;
  }
  #bubbleUp(index) {
    let object = this._objects[index], priority = this._priorities[index];
    while (index > ROOT_INDEX) {
      let parentIndex = index >>> 1;
      if (this._priorities[parentIndex] <= priority)
        break;
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
      if (childPriority >= priority)
        break;
      this._objects[index] = childObject;
      this._priorities[index] = childPriority;
      index = childIndex;
    }
    this._objects[index] = object;
    this._priorities[index] = priority;
  }
  push(object, priority) {
    if (this.length === this._capacity)
      throw new Error("Heap full");
    let pos = this.length + ROOT_INDEX;
    this._objects[pos] = object;
    this._priorities[pos] = priority;
    this.length++;
    this.#bubbleUp(pos);
  }
  pop() {
    if (!this.length)
      return;
    const result = this._objects[ROOT_INDEX];
    this._objects[ROOT_INDEX] = this._objects[this.length + ROOT_INDEX - 1];
    this._priorities[ROOT_INDEX] = this._priorities[this.length + ROOT_INDEX - 1];
    this.length--;
    if (this.length > 0)
      this.#bubbleDown(ROOT_INDEX);
    return result;
  }
  peekPriority() {
    return this._priorities[ROOT_INDEX];
  }
  peek() {
    return this._objects[ROOT_INDEX];
  }
  consider(score, object) {
    if (this.length < this._capacity) {
      this.push(object, score);
      return true;
    } else if (score > this._priorities[ROOT_INDEX]) {
      this._objects[ROOT_INDEX] = object;
      this._priorities[ROOT_INDEX] = score;
      this.#bubbleDown(ROOT_INDEX);
      return true;
    }
    return false;
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

// src/search/permutations.js
var permutations = {
  case(str = "", {
    enableCaps = false
  } = {}) {
    if (!enableCaps) {
      return { total: 1, get: (k) => str };
    }
    const variablePositions = [];
    for (let i = 0;i < str.length; i++) {
      if (str[i].toLowerCase() !== str[i].toUpperCase()) {
        variablePositions.push(i);
      }
    }
    return {
      total: 2 ** variablePositions.length,
      get: (k) => {
        const result = str.split("");
        for (let i = 0;i < variablePositions.length; i++) {
          const pos = variablePositions[i];
          result[pos] = k >> i & 1 ? str[pos].toUpperCase() : str[pos].toLowerCase();
        }
        return result.join("");
      }
    };
  },
  group(components = [], {
    join = ""
  } = {}) {
    const totals = components.map((c) => typeof c.total === "number" ? c.total : 1);
    return {
      total: totals.reduce((acc, t) => acc * t, 1),
      get: (k) => {
        let remainder = k;
        const parts = [];
        for (let i = components.length - 1;i >= 0; i--) {
          const t = totals[i];
          const partK = remainder % t;
          remainder = Math.floor(remainder / t);
          parts.unshift(typeof components[i] === "string" ? components[i] : components[i].get(partK));
        }
        return parts.join(join);
      }
    };
  },
  url(url = "", {
    protocolCaps = false,
    domainCaps = false,
    pathCaps = false
  } = {}) {
    const [_, protocol, domain, pathname, query, hash] = url.match(/^(https?:\/\/)?([^\/]+)(\/[^?#]*)?(\?[^#]*)?(#.*)?$/i);
    if (!protocol || !domain) {
      throw "invalid url";
    }
    const protocolComp = permutations.case(protocol, { enableCaps: protocolCaps });
    const domainComp = permutations.case(domain, { enableCaps: domainCaps });
    const pathComp = permutations.case(pathname || "/", { enableCaps: pathCaps });
    const combined = permutations.group([protocolComp, domainComp, pathComp]);
    return {
      total: combined.total,
      get: (k) => combined.get(k) + (query || "") + (hash || "")
    };
  },
  phone(number = "0123456789", {
    forceCountry = false,
    validSpacers = [""],
    prefixCaps = false
  } = {}) {},
  email(address = "someone@example.com", {
    perfixCaps = false,
    domainCaps = false
  } = {}) {},
  emailMessage(address = "", {
    prefixCaps = false,
    domainCaps = false,
    queryCaps = false,
    queryOrdering = true
  } = {}) {},
  sms(number = "0123456789", {
    forceCountry = false,
    validSpacers = [""],
    prefixCaps = false,
    queryCaps = false
  } = {}) {},
  wifi({
    name = "",
    password = ""
  }) {
    let parts = [`T:WPA`, `S:` + name, `P:` + password];
    let orders = [[0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 1, 0], [2, 0, 1]];
    return {
      total: orders.length,
      get: (k) => `WIFI:${orders[k].map((i) => parts[i]).join(";")};;`
    };
  },
  vcard({ name = "", phone = "", email = "" }, {} = {}) {},
  event({ summary, dtstart }, {} = {}) {},
  geo({ latitude = "", longitude = "" } = {}, {} = {}) {},
  bitcoin({ address, amount }, {
    prefixCaps = true,
    queryCaps = true,
    queryOrder = true
  } = {}) {},
  ethereum({ address, amount }, {
    prefixCaps = true,
    queryCaps = true,
    queryOrder = true
  } = {}) {}
};

// src/search/index.js
function permuteData(type = "url", value = "https://qrs.art", options = {}) {
  let p = permutations[type](value, options);
  p[Symbol.iterator] = function* () {
    yield* iterateBatch(p, 0, 1);
  };
  return p;
}
function* iterateBatch(permSet, start = 0, stride = 1) {
  let { total, get } = permSet;
  for (let i = start;i < total; i += stride) {
    yield [get(i), i];
  }
}
export {
  permuteData,
  permutations,
  iterateBatch,
  MinQueue
};
