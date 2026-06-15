import { generateOrderings, permute_casing } from "../DataType";

export function valueSchema(){
  return {
    oneOf: [
      {
        title: "WPA (default)",
        description: "Option for most WiFi setups (residential, small business)",
        examples: [{ssid: "GuestNet", pass: "8080808", type: "WPA"}],
        type: "object",
        properties: {
          ssid: {maxLength: 32, type: "string"},
          pass: {type: "string"},
          type: {"enum": ["WPA"], type: "string"},
          hidden: {type: "boolean"},
          disableTransition: {"enum": [0, 1], "default": 0, type: "integer"}
        },
        additionalProperties: false,
        required: ["ssid", "pass", "type"]
      },
      {
        title: "No Password",
        description: "Open network with no password. Scanners may join it without prompting for credentials.",
        examples: [{ssid: "FreeNet", type: "nopass"}],
        type: "object",
        properties: {
          ssid: {maxLength: 32, type: "string"},
          type: {"enum": ["nopass"], type: "string"},
          hidden: {type: "boolean"}
        },
        additionalProperties: false,
        required: ["ssid"]
      },
      {
        title: "EAP",
        description: "Used for enterprise Wifi configurations",
        examples: [
          {
            ssid: "CorpoNet",
            pass: "S3cret",
            type: "WPA2-EAP",
            eap: "PEAP",
            anon: "anon@qrs.art",
            identity: "me@qrs.art",
            phase2: "MSCHAPV2"
          }
        ],
        type: "object",
        properties: {
          ssid: {maxLength: 32, type: "string"},
          pass: {type: "string"},
          type: {"enum": ["WPA2-EAP"], type: "string"},
          hidden: {type: "boolean"},
          eap: {"enum": ["TTLS", "PWD", "PEAP", "TLS", "AKA", "FAST", "SIM"], type: "string"},
          anon: {type: "string"},
          identity: {type: "string"},
          phase2: {"enum": ["GTC", "NONE", "PAP", "MSCHAP", "MSCHAPV2"], type: "string"}
        },
        additionalProperties: false,
        required: ["ssid", "type", "eap"]
      }
    ]
  }
}

export function permuteSchema(){
  return {
    description: "WiFi payload permutations cover safe field reordering, optional default fields, prefix casing, and optional quoting.",
    examples: [{ordering: true}],
    type: "object",
    properties: {
      ordering: {description: "`N!` flag to reorder each pair", type: "boolean"},
      prefixCaps: {description: "`2` WIFI, wifi", type: "boolean"},
      permute_H_false: {description: "`2` \"H:false\", \"\" for public networks", type: "boolean"},
      permute_R_0: {description: "`2` \"R:0\", \"\" for WPA2 networks", type: "boolean"},
      permute_quotes: {description: "`1,2` use quotes when not necessary", type: "boolean"}
    },
    additionalProperties: false
  }
}

export function permute(value, options) {
  let { type, hidden, ssid, pass, disableTransition, eap, anon, identity, phase2 } = value;
  let {
    ordering = true,
    prefixCaps = false,
    permute_H_false = false,
    permute_R_0 = false,
    permute_quotes = false
  } = options;

  if(!type){
    if(pass){ type = 'WPA' }
  }

  const prefix = permute_casing('WIFI', { same_casing: prefixCaps })
  const parts = [
    field('T', type),
    field('S', ssid, { quote: permute_quotes }),
    field('P', pass, { quote: permute_quotes, quoteIfHex: true, quoteIfSpecial: true }),
    hidden ? field('H', 'true') : optionField('H', 'false', permute_H_false),
    disableTransition === 1
      ? field('R', '1')
      : optionField('R', '0', permute_R_0 || disableTransition === 0),
    field('E', eap),
    field('A', anon),
    field('I', identity),
    field('PH2', phase2)
  ].filter(Boolean)

  const orders = ordering ? generateOrderings(parts.length) : [parts.map((_, i) => i)]
  const variants = parts.map(part => part.length)
  const variantTotal = variants.reduce((total, count) => total * count, 1)

  return {
    total: prefix.total * orders.length * variantTotal,
    get: (k) => {
      const prefixK = k % prefix.total
      k = Math.floor(k / prefix.total)
      const order = orders[k % orders.length]
      k = Math.floor(k / orders.length)

      const selected = parts.map((part, i) => {
        const partK = k % variants[i]
        k = Math.floor(k / variants[i])
        return part[partK]
      })

      return `${prefix.get(prefixK)}:${order.map(i => selected[i]).filter(Boolean).join(';')};;`
    }
  };
}

function field(key, value, { quote = false, quoteIfHex = false, quoteIfSpecial = false } = {}) {
  if(value === undefined || value === null || value === '') return null

  const escaped = escapeWifiValue(value)
  const needsQuotes = quoteIfHex && /^[0-9A-F]+$/i.test(escaped) || quoteIfSpecial && /[\s\\,;":]/g.test(escaped)
  const values = [`${key}:${needsQuotes ? `"${escaped}"` : escaped}`]
  if(quote && !needsQuotes) values.push(`${key}:"${escaped}"`)
  return values
}

function optionField(key, value, include) {
  return include ? [null, `${key}:${value}`] : null
}

function escapeWifiValue(value) {
  return `${value}`.replace(/([\\,;":])/g, '\\$1')
}


export function format(value){
  return permute(value, { ordering: false }).get(0)
}

export function preview(value){
  return `WiFi`
}

// Source: Heroicons wifi, 20 solid.
// https://github.com/tailwindlabs/heroicons/blob/master/optimized/20/solid/wifi.svg
export function icon(){
  return {
    d: [
      'M.676 6.941A12.964 12.964 0 0 1 10 3c3.657 0 6.963 1.511 9.324 3.941a.75.75 0 0 1-.008 1.053l-.353.354a.75.75 0 0 1-1.069-.008C15.894 6.28 13.097 5 10 5 6.903 5 4.106 6.28 2.106 8.34a.75.75 0 0 1-1.069.008l-.353-.354a.75.75 0 0 1-.008-1.053Zm2.825 2.833A8.976 8.976 0 0 1 10 7a8.976 8.976 0 0 1 6.499 2.774.75.75 0 0 1-.011 1.049l-.354.354a.75.75 0 0 1-1.072-.012A6.978 6.978 0 0 0 10 9c-1.99 0-3.786.83-5.061 2.165a.75.75 0 0 1-1.073.012l-.354-.354a.75.75 0 0 1-.01-1.05Zm2.82 2.84A4.989 4.989 0 0 1 10 11c1.456 0 2.767.623 3.68 1.614a.75.75 0 0 1-.022 1.039l-.354.354a.75.75 0 0 1-1.085-.026A2.99 2.99 0 0 0 10 13c-.88 0-1.67.377-2.22.981a.75.75 0 0 1-1.084.026l-.354-.354a.75.75 0 0 1-.021-1.039Zm2.795 2.752a1.248 1.248 0 0 1 1.768 0 .75.75 0 0 1 0 1.06l-.354.354a.75.75 0 0 1-1.06 0l-.354-.353a.75.75 0 0 1 0-1.06Z'
    ],
    scale: (1/20)
  }
}
