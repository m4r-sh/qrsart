import { run, bench, group, baseline } from 'mitata';
import { QRCode, optimalStrategy, createQR } from '../dist/index.js';

await speed()
await size()

async function speed(){
  
  group({ name: 'optimalStrategy', summary: false }, () => {
    baseline('single char ALPHA', () => {
      let a = optimalStrategy('A')
    });
    bench('10-20 char NUMBERS', () => {
      let a = optimalStrategy(generateString('0123456789',10,20))
    });
    bench('10-20 char ALPHA', () => {
      let a = optimalStrategy(generateString('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:',10,20))
    });
    bench('100-200 char NUMBERS', () => {
      let a = optimalStrategy(generateString('0123456789',100,200))
    });
    bench('100-200 char ALPHA', () => {
      let a = optimalStrategy(generateString('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:',100,200))
    });
  });

  group({ name: 'createQR', summary: false }, () => {
    baseline('single char ALPHA', () => {
      let a = createQR('A').grid
    });
    bench('10-20 char NUMBERS', () => {
      let a = createQR(generateString('0123456789',10,20)).grid
    });
    bench('10-20 char ALPHA', () => {
      let a = createQR(generateString('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:',10,20)).grid
    });
    bench('100-200 char NUMBERS', () => {
      let a = createQR(generateString('0123456789',100,200)).grid
    });
    bench('100-200 char ALPHA', () => {
      let a = createQR(generateString('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:',100,200)).grid
    });
  });

  
  await run({
    avg: true, // enable/disable avg column (default: true)
    colors: true, // enable/disable colors (default: true)
    min_max: true, // enable/disable min/max column (default: true)
    percentiles: false
  });
}

async function size(){
  console.log('\n'+'-'.repeat(20)+'\n')
  console.log(await getSize('qrsart ','./dist/index.min.js'))
  console.log(await getSize('/search','./dist/search.min.js'))
  console.log(await getSize('/score ','./dist/score.min.js'))
}

async function getSize(type='qrsart',p='./dist/index.min.js'){
  const data = await Bun.file(p).arrayBuffer()
  const compressed = Bun.gzipSync(data)
  let gzip_kb = (compressed.byteLength/1000).toFixed(2) + ' kB'
  return `(${type})  ${gzip_kb}`
}


function generateString(dict='0123456789',min=10,max=20){
  let str = ""
  let num_chars = Math.floor(Math.random() * (max-min+1)) + min
  for(let i = 0; i < num_chars; i++){
    str += dict.charAt(Math.floor(Math.random() * dict.length))
  }
  return str
}