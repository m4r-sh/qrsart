# qrsart

> Generate QR codes with aesthetic precision

- No dependencies
- Optimal segmentation
- Labeled output
- Built-in permutation logic

Drawbacks:
- No kanji support
- API not final (just getting started)
- Not perf optimized (yet)

## Install

```
$ bun add qrsart
```

## Usage

```js
import { createQR } from 'qrsart'

let qr = createQR('https://github.com/m4r-sh/qrsart',{
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
//   functional_patterns: PixelGrid,
//   finder_patterns: PixelGrid,
//   timing_patterns: PixelGrid,
//   alignment_positions: PixelGrid,
//   alignment_patterns: PixelGrid,
//   format_pattern: PixelGrid,
//   version_pattern: PixelGrid,
//   data_pattern: PixelGrid,
//   grid: PixelGrid,
// }
```

## API

`createQR(data, { minVersion, maxVersion, minEcl, mask }) => QRCode`

`findVersion(data="",{ minVersion, maxVersion, minEcl }) => { version, ecl, bitstring }`

`permuteURL(str,options) => []`
- `options`: `{protocols=['https','http'],protocol_caps=true,domain_caps=true,path_caps=false}`

`permuteWifi(name,pwd) => []`

`new PixelGrid(w,h)`
- `.setPixel(x,y,v)`
- `.getPixel(x,y)`
- `.usedPixel(x,y)`
- `PixelGrid.combine(...grids)`

`new QRCode({ bitstring, version, ecl, mask, data })`
- `.size`
- `.data`
- `.grid`
- `.data_pattern`
- `.functional_patterns`
- `.finder_patterns`
- `.alignment_patterns`
- `.timing_patterns`
- `.format_pattern`
- `.version_pattern`

## Examples

<table>
  <tr>
    <td>
      <h3>Tetris Shape Packing</h3>
      <a href="https://github.com/m4r-sh/qrsart/tree/main/examples/tetris">Example Code</a>
    </td>
    <td>
      <img src="https://raw.githubusercontent.com/m4r-sh/qrsart/main/examples/tetris/output.png" width="300"/>
    </td>
  </tr>
  <tr>
    <td>
      <h3>Debug View</h3>
      <a href="https://github.com/m4r-sh/qrsart/tree/main/examples/debug">Example Code</a>
    </td>
    <td>
      <img src="https://raw.githubusercontent.com/m4r-sh/qrsart/main/examples/debug/output.png" width="300"/>
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