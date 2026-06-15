export function generateOrderings(n) {
  const result = [];
  const nums = Array.from({ length: n }, (_, i) => i);
  const visited = new Array(n).fill(false);

  function backtrack(current) {
    if (current.length === n) {
      result.push([...current]);
      return;
    }
    for (let i = 0; i < n; i++) {
      if (!visited[i]) {
        visited[i] = true;
        current.push(nums[i]);
        backtrack(current);
        current.pop();
        visited[i] = false;
      }
    }
  }

  backtrack([]);
  return result;
}


export function permute_options(options = []){
  const totals = options.map(c => c && typeof c === 'object' && 'total' in c ? c.total : 1);
  return {
    total: totals.reduce((acc, t) => acc + t, 0),
    get: (k) => {
      let sumtotal = 0
      for(let i = 0; i < options.length; i++){
        if(k < sumtotal + totals[i]){
          let sub_k = k - sumtotal
          return typeof options[i] == 'object' && 'get' in options[i]
            ? options[i].get(sub_k)
            : options[i]
        } else {
          sumtotal += totals[i]
        }
      }
    }
  }
}

export function permute_group(components = [], {
  join = ''
}={}){
  
  const totals = components.map(c => typeof c === 'object' && c !== null && 'total' in c ? c.total : 1);
  
  return {
    total: totals.reduce((acc, t) => acc * t, 1),
    get: (k) => {
      let remainder = k;
      const parts = [];
      for (let i = components.length - 1; i >= 0; i--) {
        const t = totals[i];
        const partK = remainder % t;
        remainder = Math.floor(remainder / t);
        const component = components[i];
        if (typeof component === 'string') {
          parts.unshift(component);
        } else if (component && typeof component === 'object' && 'get' in component) {
          parts.unshift(component.get(partK));
        } else {
          parts.unshift(String(component));
        }
      }
      return parts.join(join);
    }
  };
}

export function permute_query(params={}, {
  queryCaps=false,
  ordering=false
}={}){
  let items = Object.entries(params).filter(([k,v]) => k && v && v.length > 0)
  let orders = ordering ? generateOrderings(items.length) : [items.map((_,i) => i)]

  if(items.length == 1){
    let [[key,value]] = items
    let keyComp = permute_casing(`${key}=`, { any_casing: queryCaps })
    let encoded = encodeURIComponent(value)
    return { total: keyComp.total, get: (k) => `?${keyComp.get(k)}${encoded}`}
  }


  let group = permute_group([
    `?`,
    ...items.flatMap(([k,v]) => [
      permute_casing(`${k}=`, { any_casing: queryCaps }),
      encodeURIComponent(v)
    ])
  ], { join: '&' })


  return {
    total: orders.length * group.total,
    get: (k) => {
      let order_i = Math.floor(k / group.total)
      let group_i = k % group.total
      let g = permute_group([
        ...orders[order_i].map(index => items[index]).flatMap(([key,v]) => [
          permute_casing(`${key}=`, { any_casing: queryCaps }),
          encodeURIComponent(v)
        ])
      ], { join: '&' })
      return '?' + g.get(group_i).replace(/=&/g,'=')
    }
  }
  
}

export function permute_casing(str='',{
  same_casing=false, // word + WORD
  any_casing=false // Word + wORd + word + ...
}={}){
  if(any_casing){
    const variablePositions = [];
    for (let i = 0; i < str.length; i++) {
      if (str[i].toLowerCase() !== str[i].toUpperCase()) {
        variablePositions.push(i);
      }
    }
    return {
      total: 2 ** variablePositions.length,
      get: (k) => {
        const result = str.split('');
        for (let i = 0; i < variablePositions.length; i++) {
          const pos = variablePositions[i];
          result[pos] = (k >> i) & 1 ? str[pos].toLowerCase() : str[pos].toUpperCase();
        }
        return result.join('');
      }
    };
  } else if(same_casing){
    return {
      total: 2,
      get: (k) => k == 0 ? str.toUpperCase() : str.toLowerCase()
    }
  } else {
    return {  total: 1,  get: (k) => str }
  }
}

export class PermutationSet{
  constructor({ total, get }){
    Object.assign(this, { total, get })
  }
  
  *[Symbol.iterator](){
    yield* this.batch(0,1)
  }

  *batch(start=0,stride=1){
    let { total, get } = this
    for(let i = start; i < total; i+=stride){
      yield [get(i), i]
    }
  }
}

export class DataType{
  constructor(value,_parse,_permute,icon,preview){
    Object.assign(this,{ value, _parse, _permute })
    if(icon){ this.icon = icon(value) }
    if(preview){ this.preview = preview(value) }
  }
  permute(options={}){
    return new PermutationSet(this._permute(this.value,options))
  }
  toString(){ return this._parse(this.value) }
  [Symbol.toPrimitive](){ return this.toString() }
  *[Symbol.iterator](){ yield* this.permute() }
}

// @ Grok
// Helper to format ISO date/time for iCal/vCard (detects date vs. date-time)
export function formatDateForICal(dateStr) {
  if (!dateStr.includes('T')) {
    // All-day date: YYYYMMDD
    return dateStr.replace(/-/g, '');
  }
  // Date-time: Assume UTC if ends with Z, else add Z
  let formatted = dateStr.replace(/-/g, '').replace(/:/g, '');
  if (!formatted.endsWith('Z')) formatted += 'Z';
  return formatted.replace('T', 'T').slice(0, -1); // Trim extra if needed
}

// @ Grok
// Helper to escape special chars (comma, semicolon, backslash, newline)
export function escapeValue(value) {
  return value.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}
