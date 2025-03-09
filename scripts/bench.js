import { run, bench, group, baseline } from 'mitata';
import { QRCode, findOptimalSegmentation, createQR } from '../dist/index.js';

await speed()
await size()

async function speed(){
  
  group({ name: 'findOptimalSegmentation', summary: false }, () => {
    baseline('single char ALPHA', () => {
      let a = findOptimalSegmentation('A')
    });
    bench('10-20 char NUMBERS', () => {
      let a = findOptimalSegmentation(generateString('0123456789',10,20))
    });
    bench('10-20 char ALPHA', () => {
      let a = findOptimalSegmentation(generateString('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:',10,20))
    });
    bench('100-200 char NUMBERS', () => {
      let a = findOptimalSegmentation(generateString('0123456789',100,200))
    });
    bench('100-200 char ALPHA', () => {
      let a = findOptimalSegmentation(generateString('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:',100,200))
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
  const min_file = Bun.file('./dist/index.min.js')
  const data = await min_file.arrayBuffer()
  const compressed = Bun.gzipSync(data)
  console.log('minified: ' + data.byteLength + ' bytes')
  console.log('compressed: ' + compressed.byteLength + ' bytes')
  const lite_file = Bun.file('./dist/lite.min.js')
  const data2 = await lite_file.arrayBuffer()
  const compressed2 = Bun.gzipSync(data2)
  console.log('lite: minified: ' + data2.byteLength + ' bytes')
  console.log('lite: compressed: ' + compressed2.byteLength + ' bytes')
}


function generateString(dict='0123456789',min=10,max=20){
  let str = ""
  let num_chars = Math.floor(Math.random() * (max-min+1)) + min
  for(let i = 0; i < num_chars; i++){
    str += dict.charAt(Math.floor(Math.random() * dict.length))
  }
  return str
}