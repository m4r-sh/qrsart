# qrsart

Generate QR codes with **aesthetic precision**. No dependencies, fast, low overhead.

- **Optimal Data Encoding**
- **Labeled Grid Outputs**
- **Permutation Search**

## Exports

**`qrsart`** - Main package for creating codes

```js
import { createQR, QRCode, Grid, optimalStrategy, constructCodewords } from 'qrsart'
```

**`qrsart/search`** - Search helpers to iterate over encodings

```js
import { search, batch, permute, allStrategies } from 'qrsart/search'
```

**`qrsart/refine`** - Debug views and grid manipulation

```js
import { gridInfo, modesInfo } from 'qrsart/refine'
```


## Installation

```sh
bun install qrsart
```

## Usage

### Basic QR Code Generation

```js
import { createQR } from 'qrsart';

// force specific version / ecl
const hello_world_qr = createQR('Hello, World!', {
  version: 1,
  ecl: 2,
  mask: 0
})
// allow version / ecl ranges
const hey_there_qr = createQR('Hey there', {
  minVersion: 2,
  maxVersion: 4,
  minEcl: 1,
  maxEcl: 3,
  mask: 2
})
```

### QR Grid Operations

```js
import { createQR, Grid } from 'qrsart'

let my_qr = createQR('Hi Github')
let crucial_grid = Grid.union(my_qr.alignment_grid, my_qr.timing_grid, my_qr.finder_grid)
let rest_grid = Grid.erase(my_qr.grid,crucial_grid)
for(let [x,y] of crucial_grid.tiles()){
  ctx.fillStyle = crucial_grid.get(x,y) ? '#000' : '#fff'
  ctx.fillRect(x,y,1,1)
}
for(let [x,y] of rest_grid.tiles()){
  ctx.fillStyle = crucial_grid.get(x,y) ? '#228' : '#fff'
  ctx.fillRect(x,y,1,1)
}
```

### Segmentation

```js
import { optimalStrategy, allStrategies, construct_codewords } from 'qrsart';

// get segmentation that uses fewest bits
const { version, ecl, codewords, steps, cost, budget } = optimalStrategy('Hello, world!');

// get all segmentations that fit in this version & ecl
const all_greetings = allStrategies('Hello, world!',version, ecl)
```

---

## API

### `createQR(data,options)`

Creates a new `QRCode` instance with optimal data segmentation.

#### data
Type: `String`

The data to be encoded in the URL. See [data types](#types).

#### options
Type: `Object`

- `mask`: number 0-7 specifying which [mask](#masks) to use
- `version`: number 1-40 specifying which [version](#versions) to use
- `ecl`: number 0-3 specifying which [ecl](#ecls) to use
- `minVersion`, `maxVersion`: specify a range of versions to try
- `minEcl`, `maxEcl`: specify a range of ecls to try

### `let qr = new QRCode({ mask, version, ecl, codewords })`

`QRCode` assumes the data has already been encoded into `codewords`. This class handles drawing to a `Grid` based on mask, version, ecl, and codewords.

- `mask`: number 0-7 specifying which [mask](#masks) to use
- `version`: number 1-40 specifying which [version](#versions) to use
- `ecl`: number 0-3 specifying which [ecl](#ecls) to use
- `codewords`: Uint8Array with each item representing a byte

#### Available Grids



#### `new Grid(w,h)`

#### `optimalStrategy(data,options)`

#### `allStrategies(data,options)`

#### `constructCodewords(data,steps,version,ecl)`

---

## Details

### Types

### Masks

### Versions

### ECLs

---

## Masks

## License

MIT