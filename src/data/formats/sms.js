import { permute_casing, permute_group } from "../DataType";
import { permute as permute_phone } from "./phone";

export function valueSchema(){
  return {
    description: "Send an SMS text with an optional message",
    examples: [{number: "9999999999", countryCode: 1, message: "Hello"}],
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
      message: {description: "optional message template", type: "string"}
    },
    additionalProperties: false,
    required: ["number"]
  }
}

export function permuteSchema(){
  return {
    examples: [{validSpacers: ["-", "."], prefixCaps: false, groupings: [[3, 3, 4]]}],
    type: "object",
    properties: {
      prefixCaps: {description: "`8` permute casing of `sms`", type: "boolean"},
      queryCaps: {description: "`16` permute casing of `body`", type: "boolean"},
      validSpacers: {
        uniqueItems: true,
        "default": ["-", "."],
        description: "`N^M` valid spacers `-.()` per spec",
        type: "array",
        items: {"enum": ["-", "."], type: "string"}
      },
      groupings: {
        "default": [[3, 3, 4]],
        examples: [[[3, 3, 2, 2], [5, 5]], [[3, 3, 4], [3, 4, 3]]],
        description: "`N^M` indexes for spacers to divide numbers. not deduped",
        type: "array",
        items: {type: "array", items: {minimum: 1, maximum: 9, type: "integer"}}
      }
    },
    additionalProperties: false
  }
}

export function permute(value={}, options={}) {
  const { countryCode, number, message } = value;
  let {
    validSpacers = ["-", "."],
    groupings = [[3, 3, 4]],
    prefixCaps,
    queryCaps
  } = options;

  const prefixComp = permute_casing('sms:', { same_casing: prefixCaps });
  const phoneComp = permute_phone({ countryCode, number }, {
    validSpacers,
    groupings,
    parenGroups: false
  })
  const messageComp = message && message.length > 0
    ? permute_group([
      permute_casing('?body=', { any_casing: queryCaps }),
      encodeURIComponent(message)
    ]) : ''
  

  return permute_group([
    prefixComp,
    { get: (k) => phoneComp.get(k).substring(4), total: phoneComp.total },
    messageComp
  ])
}


export function format(value){
  return permute(value, {
    validSpacers: ['-'],
    prefixCaps: false,
    queryCaps: false,
    groupings: [[3,3,4]]
  }).get(0)
}


export function preview(value){
  return 'Message'
}

// Source: Heroicons chat-bubble-oval-left, 20 solid.
// https://github.com/tailwindlabs/heroicons/blob/master/optimized/20/solid/chat-bubble-oval-left.svg
export function icon(){
  return {
    d: [
      `M2 10c0-3.967 3.69-7 8-7 4.31 0 8 3.033 8 7s-3.69 7-8 7a9.165 9.165 0 0 1-1.504-.123 5.976 5.976 0 0 1-3.935 1.107.75.75 0 0 1-.584-1.143 3.478 3.478 0 0 0 .522-1.756C2.979 13.825 2 12.025 2 10Z`
    ],
    scale: (1/20)
  }
}
