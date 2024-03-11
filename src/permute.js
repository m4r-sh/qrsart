export function permuteWIFI(name="",pwd=""){
  let parts = [
    `T:WPA`,
    `S:${name}`,
    `P:${pwd}`
  ]
  return [
    [0,1,2],
    [0,2,1],
    [1,0,2],
    [1,2,0],
    [2,1,0],
    [2,0,1]
  ].map(part_order => `WIFI:${part_order.map(i => parts[i]).join(';')};;`)
}

export function permuteURL(str=`m4r.sh/tetris`,{
  protocols = ['http','https'],
  protocol_caps = true,
  domain_caps = true,
  path_caps = false
}={}){
  if(!str.toLowerCase().startsWith('http')){
    str = `http://` + str
  }
  let url = new URL(str)
  let { hostname, pathname, search, hash } = url

  let protocol_arr = permuteProtocols({ protocols, protocol_caps })
  let domain_arr = permuteDomain({ domain: hostname, domain_caps })
  let path_arr = permutePath({ path: pathname, path_caps })

  let options = []
  protocol_arr.forEach(protocol_str => {
    domain_arr.forEach(domain_str => {
      path_arr.forEach(path_str => {
        options.push(`${protocol_str}://${domain_str}${path_str}${search}${hash}`)
      })
    })
  })
  return options
}

function permuteProtocols({
  protocols=['HTTP','HTTPS'],
  protocol_caps=true
}={}){
  let options = []
  protocols.forEach(protocol => {
    options.push(...(protocol_caps ? casePermutation(protocol) : [protocol]))
  })
  return options
}

function permuteDomain({
  domain='M4R.SH',
  domain_caps=true
}={}){
  return domain_caps ? casePermutation(domain) : [domain]
}

function permutePath({
  path='/qr/tetris',
  path_caps=false
}={}){
  return path_caps ? casePermutation(path) : [path]
}


function casePermutation(str="tEsT"){
  let sp = str.toLowerCase().split("")
  let perms = {}
  for (var i = 0, l = 1 << str.length; i < l; i++) {
    for (var j = i, k = 0; j; j >>= 1, k++) {
      sp[k] = (j & 1) ? sp[k].toUpperCase() : sp[k].toLowerCase();
    }
    perms[sp.join("")] = true
  }
  return Object.keys(perms)
}