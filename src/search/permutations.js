export const permutations = {
  case(str='',{
    enableCaps=false
  }={}) {
    if (!enableCaps) { return { total: 1, get: (k) => str } }
  
    // Identify where upper/lowercase differ
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
          result[pos] = (k >> i) & 1 ? str[pos].toUpperCase() : str[pos].toLowerCase();
        }
        return result.join('');
      }
    }
  },
  group(components=[],{
    join=''
  }={}){
    const totals = components.map(c => typeof c.total === 'number' ? c.total : 1);
    return {
      total: totals.reduce((acc, t) => acc * t, 1),
      get: (k) => {
        let remainder = k;
        const parts = [];
        for (let i = components.length - 1; i >= 0; i--) {
          const t = totals[i];
          const partK = remainder % t;
          remainder = Math.floor(remainder / t);
          parts.unshift(typeof components[i] === 'string' ? components[i] : components[i].get(partK));
        }
        return parts.join(join);
      }
    };
  },
  url(url='',{
    protocolCaps=false,
    domainCaps=false,
    pathCaps=false
  }={}) {
    const [_,protocol,domain,pathname,query,hash] = url.match(/^(https?:\/\/)?([^\/]+)(\/[^?#]*)?(\?[^#]*)?(#.*)?$/i);
    if(!protocol || !domain){ throw 'invalid url' }
    const protocolComp = permutations.case(protocol, { enableCaps: protocolCaps });
    const domainComp = permutations.case(domain, { enableCaps: domainCaps });
    const pathComp = permutations.case(pathname || '/', { enableCaps: pathCaps });
    const combined = permutations.group([protocolComp, domainComp, pathComp]);
    return {
      total: combined.total,
      get: (k) => combined.get(k) + (query || '') + (hash || '')
    }
  },
  // TODO
  phone(number='0123456789',{
    forceCountry=false,
    validSpacers=[''],
    prefixCaps=false
  }={}){
    
  },
  // TODO
  email(address='someone@example.com',{
    perfixCaps=false,
    domainCaps=false
  }={}){

  },
  // TODO
  emailMessage(address='',{
    prefixCaps=false,
    domainCaps=false,
    queryCaps=false,
    queryOrdering=true
  }={}){

  },
  // TODO
  sms(number='0123456789',{
    forceCountry=false,
    validSpacers=[''],
    prefixCaps=false,
    queryCaps=false
  }={}){

  },
  // TODO
  
  wifi({
    name='',
    pwd=''
  }){
    let parts = [`T:WPA`,`S:`+name,`P:`+pwd]
    let orders = [[0,1,2],[0,2,1],[1,0,2],[1,2,0],[2,1,0],[2,0,1]]
    return {
      total: orders.length,
      get: (k) => `WIFI:${orders[k].map(i => parts[i]).join(';')};;`
    }
  },
  // TODO
  vcard({ name='', phone='', email='' },{
    // FILL IN
  }={}){

  },
  // TODO
  event({ summary, dtstart },{
    // FILL IN
  }={}){

  },
  // TODO
  geo({ latitude= '', longitude= '' }={},{
    // FILL IN
  }={}){
    
  },
  // TODO
  bitcoin({ address, amount }, {
    prefixCaps=true,
    queryCaps=true,
    queryOrder=true
  }={}){

  },
  // TODO
  ethereum({ address, amount }, {
    prefixCaps=true,
    queryCaps=true,
    queryOrder=true
  }={}){

  }
}
