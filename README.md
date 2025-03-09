# qrsart

Generate QR codes with **aesthetic precision** and **optimal data segmentation**. No dependencies, fast, low overhead.

## Features

- **Precise QR Code Generation** – Control every aspect of the QR structure
- **Optimal Data Segmentation** – Automatically finds the best encoding strategy
- **Labeled Grid Outputs** – Visualize QR sub-structures
- **Permutation Search** – Explore equivalent encodings for predefined patterns

## Exports

**`qrsart`** - Main package for creating and rendering codes

```js
import { createQR, QRCode, Grid, findOptimalSegmentation, findAllSegmentations, constructCodewords } from 'qrsart'
```

**`qrsart/search`** - Search helpers to iterate over equivalent encodings

```js
import { search, batch, permute, findOptimalSegmentation, findAllSegmentations, constructCodewords } from 'qrsart/search'
```

**`qrsart/lite`** - Only QRCode and Grid classes. Bring your own segmentation.

```js
import { QRCode, Grid } from 'qrsart/lite'
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

### Segmentation (advanced)

```js
import { findOptimalSegmentation, findAllSegmentations, construct_codewords } from 'qrsart';

// get segmentation that uses fewest bits
const { version, ecl, bitstring, steps, cost, budget } = findOptimalSegmentation('Hello, world!');

// get all segmentations that fit in this version & ecl
const all_greetings = findAllSegmentations('Hello, world!',version, ecl)
```

## License

MIT