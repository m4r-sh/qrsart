import { generateOrderings, permute_casing, permute_group, permute_options } from "../DataType";

export function valueSchema(){
  return {
    oneOf: [
      {
        title: "URL String",
        examples: [{url: "https://qrs.art"}],
        type: "object",
        properties: {
          url: {
            examples: ["https://qrs.art"],
            description: "URL string. Normalized and parsed with `new URL(...)`",
            type: "string"
          }
        },
        additionalProperties: false,
        required: ["url"]
      },
      {
        title: "URL Object",
        description: "Ideal for granular permutations",
        examples: [{protocol: "https", hostname: "qrs.art", search: "?page=1"}],
        type: "object",
        properties: {
          protocol: {
            examples: ["https"],
            description: "Protocol string `\"https\"`",
            type: "string"
          },
          hostname: {
            examples: ["qrs.art"],
            description: "Hostname string `\"qrs.art\"`",
            type: "string"
          },
          pathname: {
            examples: ["/studio"],
            description: "Pathname string `\"/studio\"`",
            type: "string"
          },
          search: {
            examples: ["?page=1"],
            description: "Query string `\"?page=1\"`. combined with `query`",
            type: "string"
          },
          query: {
            description: "Query object `{ page: 1}`. combined with `search`",
            type: "object",
            properties: {},
            additionalProperties: false
          },
          hash: {
            examples: ["#content"],
            description: "Hash (not seen by server) `\"#content\"`",
            type: "string"
          }
        },
        additionalProperties: false,
        required: ["protocol", "hostname"]
      }
    ]
  }
}

export function permuteSchema(){
  return {
    description: "URLs are safely case-insenstive for both the *protocol* and *hostname*.",
    examples: [{protocolCaps: true, hostnameCaps: true}],
    type: "object",
    properties: {
      protocolCaps: {description: "Flag to permute casing of protocol `2^N`", type: "boolean"},
      hostnameCaps: {description: "Flag to permute casing of hostname `2^N`", type: "boolean"},
      searchOrdering: {description: "Flag to reorder search string parameters `N!`", type: "boolean"}
    },
    additionalProperties: false
  }
}

function normalizeSearch(search='', query){
  const hasQuery = query && typeof query === 'object' && Object.keys(query).length > 0;
  if(!hasQuery){ return search }

  const params = new URLSearchParams(search);
  for(const [key, value] of Object.entries(query)){
    if(value === undefined){ continue }
    if(Array.isArray(value)){
      for(const item of value){
        if(item !== undefined){ params.append(key, item) }
      }
    } else {
      params.append(key, value)
    }
  }
  const normalized = params.toString();
  return normalized ? `?${normalized}` : ''
}

function permuteSearch(search='', searchOrdering=false){
  if(!searchOrdering){ return search }

  const items = Array.from(new URLSearchParams(search).entries());
  if(items.length <= 1){ return search }

  const orders = generateOrderings(items.length);
  return {
    total: orders.length,
    get: (k) => {
      const params = new URLSearchParams();
      for(const itemIndex of orders[k]){
        const [key, value] = items[itemIndex];
        params.append(key, value)
      }
      return `?${params.toString()}`
    }
  }
}

function deconstructURL(value){
  if(typeof value == 'string' || value.url){
    value = new URL(typeof value == 'string' ? value : value.url)
  }
  let { protocol='https:', hostname, pathname='', search='', query, hash='' } = value;
  if(!protocol.endsWith(':')){ protocol = protocol + ':'}
  search = normalizeSearch(search, query)
  return { protocol, hostname, pathname, search, hash }
}

export function permute(value, options={}) {
  let { protocol='https:', hostname, pathname='', search='', hash='' } = deconstructURL(value);
  
  const {protocolCaps = false, hostnameCaps = false, searchOrdering = false } = options

  
  
  const protocolComp = permute_casing(protocol, { any_casing: protocolCaps });
  const hostnameComp = permute_casing(hostname, { any_casing: hostnameCaps });
  const pathComp = !pathname || pathname.length == 0 || pathname == '/' ? permute_options(['','/']) : pathname
  const searchComp = permuteSearch(search, searchOrdering);
  const combined = permute_group([protocolComp,'//',hostnameComp, pathComp, searchComp, hash]);

  return {
    total: combined.total,
    get: (k) => combined.get(k)
  }
}


export function format(value){
  return permute(value, {
    protocolCaps: true,
    hostnameCaps: true
  }).get(0)
}


export function preview(value){
  let { hostname="" } = deconstructURL(value);
  return hostname.toLowerCase()
  
}

// Source: Heroicons link, 20 solid.
// https://github.com/tailwindlabs/heroicons/blob/master/optimized/20/solid/link.svg
export function icon(){
  return {
    d: [
      `M12.232 4.232a2.5 2.5 0 0 1 3.536 3.536l-1.225 1.224a.75.75 0 0 0 1.061 1.06l1.224-1.224a4 4 0 0 0-5.656-5.656l-3 3a4 4 0 0 0 .225 5.865.75.75 0 0 0 .977-1.138 2.5 2.5 0 0 1-.142-3.667l3-3Z`,
      `M11.603 7.963a.75.75 0 0 0-.977 1.138 2.5 2.5 0 0 1 .142 3.667l-3 3a2.5 2.5 0 0 1-3.536-3.536l1.225-1.224a.75.75 0 0 0-1.061-1.06l-1.224 1.224a4 4 0 1 0 5.656 5.656l3-3a4 4 0 0 0-.225-5.865Z`
    ],
    scale: (1/20)
  }
}
