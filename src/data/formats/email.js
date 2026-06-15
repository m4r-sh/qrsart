import { permute_casing, permute_group, permute_query } from "../DataType";

export function valueSchema(){
  return {
    description: "Open email client populated values",
    examples: [{to: "dev@qrs.art", subject: "Docs Test", cc: "test@qrs.art"}],
    type: "object",
    properties: {
      to: {format: "email", type: "string"},
      subject: {type: "string"},
      body: {type: "string"},
      cc: {format: "email", type: "string"},
      bcc: {format: "email", type: "string"}
    },
    additionalProperties: false,
    required: ["to"]
  }
}

export function permuteSchema(){
  return {
    examples: [{hostnameCaps: true, queryOrdering: true}],
    type: "object",
    properties: {
      prefixCaps: {type: "boolean"},
      hostnameCaps: {type: "boolean"},
      queryCaps: {type: "boolean"},
      queryOrdering: {type: "boolean"}
    },
    additionalProperties: false
  }
}

export function permute(value={}, options={}) {
  let { to, cc, bcc, subject, body } = value;
  let { prefixCaps, hostnameCaps, queryCaps, queryOrdering } = options;

  function upperDomainAddress(addr){
    if(typeof addr == 'string' && addr.indexOf('@') > 0 && addr.lastIndexOf('@') == addr.indexOf('@')){
      let [user,hostname] = addr.split('@')
      return user + '@' + hostname.toUpperCase()
    }
    return ''
  }

  to = upperDomainAddress(to)
  cc = upperDomainAddress(cc)
  bcc = upperDomainAddress(bcc)


  const prefixComp = permute_casing('mailto:', { same_casing: prefixCaps });
  
  const messageComp = permute_query(
    { subject, cc, bcc, body },
    { queryCaps, ordering: queryOrdering }
  )


  return permute_group([
    prefixComp,
    to,
    messageComp
  ])
}


export function format(value){
  return permute(value, { }).get(0)
}

export function preview(value){
  return 'Email'
}

// Source: Heroicons envelope, 20 solid.
// https://github.com/tailwindlabs/heroicons/blob/master/optimized/20/solid/envelope.svg
export function icon(){
  return {
    d: [
      `M3 4a2 2 0 0 0-2 2v1.161l8.441 4.221a1.25 1.25 0 0 0 1.118 0L19 7.162V6a2 2 0 0 0-2-2H3Z`,
      `m19 8.839-7.77 3.885a2.75 2.75 0 0 1-2.46 0L1 8.839V14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8.839Z`
    ],
    scale: (1/20)
  }
}
