<p align="center">
  <img src="https://raw.githubusercontent.com/m4r-sh/qrsart/main/docs/qrsart-github-icon.png" alt="Logo" height=150>
</p>
<h1 align="center">qrsart</h1>
<h3 align="center">generate QR codes with aesthetic precision</h3>

<p align="center">
<a href="https://bundlephobia.com/package/qrsart" target="_new"><img height=20 src="https://img.shields.io/bundlephobia/minzip/qrsart" /></a>
<a href="https://www.npmjs.com/package/qrsart" target="_new"><img height=20 src="https://img.shields.io/npm/v/qrsart" /></a>
</p>

---

**Benefits**:

- No dependencies
- Optimal data segmentation
- Labeled grid output
- Built-in permutation logic
- Isomorphic: Works in browser / NodeJS / Bun

**Drawbacks**:

- No kanji support
- API not final (just getting started)
- Not perf optimized (yet)

## Install

```
bun install qrsart
```

## Usage

```js
import { createQR } from 'qrsart'

let qr = createQR('HTTPS://GITHUB.COM/m4r-sh/qrsart',{
  minVersion: 2, // 1 - 40
  minEcl: 'medium', // 'low','medium','quartile','high'
  mask: 0, // 0 - 7
})

console.log(qr)

// QRCode {
//   version: 3,
//   ecl: "quartile",
//   mask: 0,
//   data: "HTTPS://GITHUB.COM/m4r-sh/qrsart",
//   size: 29,
//   bitstring: "001000...110000",
//   functional_grid: PixelGrid,
//   finder_grid: PixelGrid,
//   timing_grid: PixelGrid,
//   alignment_positions: PixelGrid,
//   alignment_grid: PixelGrid,
//   format_grid: PixelGrid,
//   version_grid: PixelGrid,
//   data_grid: PixelGrid,
//   grid: PixelGrid,
// }
```

To see an image generation example, check out [examples](https://github.com/m4r-sh/qrsart/tree/main/examples)

## API

### createQR(data, options)
Returns: `QRCode`

Creates a QRCode object which can be used in custom render logic

#### data
Type: `String`

The raw text to be encoded into the QR Code

#### options
Type: `Object`

- `minVersion`: number (0 - 40)
- `maxVersion`: number (0 - 40)
- `mask`: number (0 - 8)
- `minEcl`: string ('low' | 'medium' | 'quartile' | 'high')

---

### PixelGrid(w,h)

Helper class for 2D matrix of pixels

- `.setPixel(x,y,v)`
- `.getPixel(x,y)`
- `.usedPixel(x,y)`
- `PixelGrid.combine(...grids)`

---

### QRCode({ bitstring, version, ecl, mask, data })

Helper class for QR Code data

- `.size`
- `.data`
- `.grid`
- `.data_grid`
- `.functional_grid`
- `.finder_grid`
- `.alignment_grid`
- `.timing_grid`
- `.format_grid`
- `.version_grid`

---

### permuteURL(url, options)
Returns: `[String]`

Permutes a URL into an array of all possible variations of the same URL.

#### url
Type: `String`

A URL, i.e. `https://github.com/m4r-sh` or `m4r.sh`

#### options
Type: `Object`

Options for URL variation. Caps options permute the substring into every possible uppercase/lowercase combination.

- `protocols`: `['http','https']`
- `protocol_caps`: `true`
- `domain_caps`: `true`
- `path_caps`: `false`

---

### permuteWIFI(name, pwd)
Returns: `[String]`

Permutes a WiFi name/pwd into an array of all possible encoding orders.

#### name
Type: `String`

The name of the WiFi network

#### pwd
Type: `String`

The password of the WiFi network

## Examples

<table>
  <tr>
    <td>
      <img src="https://github.com/m4r-sh/qrsart/blob/main/examples/tetris/output.png" width="300"/>
    </td>
    <td>
      <h3>Tetromino Shape Packing</h3>
      <a href="https://github.com/m4r-sh/qrsart/tree/main/examples/tetris">Example Code</a>
    </td>
  </tr>
  <tr>
    <td>
      <img src="https://github.com/m4r-sh/qrsart/blob/main/examples/debug/output.png" width="300"/>
    </td>
    <td>
      <h3>Debug View</h3>
      <a href="https://github.com/m4r-sh/qrsart/tree/main/examples/debug">Example Code</a>
    </td>
  </tr>
  <tr>
    <td>
      <img src="https://github.com/m4r-sh/qrsart/blob/main/examples/wifi/output.png" width="300"/>
    </td>
    <td>
      <h3>Tilted WiFi</h3>
      <a href="https://github.com/m4r-sh/qrsart/tree/main/examples/wifi">Example Code</a>
    </td>
  </tr>
</table>

## Credits

- Nayuki's QR Code Generator
  - https://www.nayuki.io/page/creating-a-qr-code-step-by-step
  - https://www.nayuki.io/page/optimal-text-segmentation-for-qr-codes
- Russ Cox's Qart Codes
  - https://research.swtch.com/qart
  - https://research.swtch.com/qr/draw/
- QRazyBox
  - https://merri.cx/qrazybox/help/getting-started/about-qr-code.html