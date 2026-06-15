export function valueSchema(){
  return {
    description: "Call a phone number with optional extension",
    examples: [{number: "9999999999", countryCode: 1}],
    type: "object",
    properties: {
      number: {
        pattern: "[0-9]+",
        description: "local number only. non-numeric chars are ignored",
        type: "string"
      },
      countryCode: {
        pattern: "[0-9]+",
        description: "numeric country code. [list](https://countrycode.org/)",
        type: "string"
      },
      extension: {pattern: "[0-9]+", description: "optional extension", type: "string"}
    },
    additionalProperties: false,
    required: ["number"]
  }
}

export function permuteSchema(){
  return {
    description: "Per [RFC 3966](https://www.rfc-editor.org/rfc/rfc3966.html), spacers `.-()` are ignored, enabling safe permutation possibilities",
    examples: [
      {
        validSpacers: ["-", "."],
        parenGroups: true,
        prefixCaps: false,
        groupings: [[3, 3, 4]]
      }
    ],
    type: "object",
    properties: {
      validSpacers: {
        uniqueItems: true,
        "default": ["-", "."],
        type: "array",
        items: {"enum": ["-", "."], type: "string"}
      },
      prefixCaps: {type: "boolean"},
      parenGroups: {type: "boolean"},
      groupings: {
        "default": [[3, 3, 4]],
        examples: [[[3, 3, 2, 2], [5, 5]], [[3, 3, 4], [3, 4, 3]]],
        type: "array",
        items: {type: "array", items: {minimum: 1, maximum: 9, type: "integer"}}
      }
    },
    additionalProperties: false
  }
}

export function permute(value, options={}) {
  const { countryCode, extension, number } = value;
  let {
    validSpacers = ["-", "."],
    groupings = [[3, 3, 4]],
    parenGroups = false
  } = options;

  validSpacers = ['', ...validSpacers]
  
  const subPermutes = [];
  let cumulative = 0;
  
  for (let grouping of groupings) {
    if(countryCode && countryCode > 0){
      let country_len = `${countryCode}`.length
      grouping = [country_len,...grouping]
    }
    const groupCount = grouping.length;
    const spacersPerGroup = groupCount - 1;
    const spacerOptions = validSpacers.length;
    const parenOpt = parenGroups ? 2 : 1;
    const subTotal = Math.pow(spacerOptions, spacersPerGroup) * Math.pow(parenOpt, groupCount);
    
    // Closure for this grouping
    const subGet = (function(grouping) {
      function splitNumber(num, grouping) {
        let result = [];
        let index = 0;
        let group_i = 0
        for (let size of grouping) {
          let end = group_i == grouping.length - 1
            ? num.length
            : index + size
          result.push(num.slice(index, end));
          index += size;
          group_i++
        }
        return result;
      }
      
      return function(subK) {
        if (subK < 0 || subK >= subTotal) throw new Error('Invalid');
        let full_num = (countryCode && countryCode > 0) ? `${countryCode}${number}` : `${number}`
        let groups = splitNumber(full_num, grouping);
        let result = (countryCode && countryCode > 0) ? `tel:+` : 'tel:';
        
        
        let spacerChoices = [];
        for (let i = 0; i < spacersPerGroup; i++) {
          spacerChoices.push(validSpacers[Math.floor(subK / Math.pow(spacerOptions, i)) % spacerOptions]);
        }
        
        let parenChoices = [];
        if (parenGroups) {
          for (let i = 0; i < groupCount; i++) {
            parenChoices.push(Math.floor(subK / Math.pow(spacerOptions, spacersPerGroup) / Math.pow(parenOpt, i)) % 2 === 1);
          }
        } else {
          parenChoices = new Array(groupCount).fill(false);
        }
        
        for (let i = 0; i < groups.length; i++) {
          let group = groups[i];
          if (parenChoices[i]) {
            result += `(${group})`;
          } else {
            result += group;
          }
          if (i < groups.length - 1) {
            result += spacerChoices[i] || '';
          }
        }
        
        if (extension) {
          result += `;ext=${extension}`;
        }
        
        return result;
      };
    })(grouping);
    
    subPermutes.push({ start: cumulative, total: subTotal, get: subGet });
    cumulative += subTotal;
  }
  
  const total = cumulative;
  
  function get(k) {
    if (k < 0 || k >= total) throw new Error('Invalid permutation index');
    let current = k;
    for (let sub of subPermutes) {
      if (current < sub.total) {
        return sub.get(current);
      }
      current -= sub.total;
    }
  }
  
  return {
    total,
    get
  };
}


export function format(value){
  return permute(value, {
    validSpacers: ['-'],
    prefixCaps: false,
    groupings: [[3,3,4]]
  }).get(0)
}

export function preview(value){
  return 'Call'
}

// Source: Heroicons phone, 20 solid.
// https://github.com/tailwindlabs/heroicons/blob/master/optimized/20/solid/phone.svg
export function icon(){
  return {
    d: [
      `M2 3.5A1.5 1.5 0 0 1 3.5 2h1.148a1.5 1.5 0 0 1 1.465 1.175l.716 3.223a1.5 1.5 0 0 1-1.052 1.767l-.933.267c-.41.117-.643.555-.48.95a11.542 11.542 0 0 0 6.254 6.254c.395.163.833-.07.95-.48l.267-.933a1.5 1.5 0 0 1 1.767-1.052l3.223.716A1.5 1.5 0 0 1 18 15.352V16.5a1.5 1.5 0 0 1-1.5 1.5H15c-1.149 0-2.263-.15-3.326-.43A13.022 13.022 0 0 1 2.43 8.326 13.019 13.019 0 0 1 2 5V3.5Z`
    ],
    scale: (1/20)
  }
}
