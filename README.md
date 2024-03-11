# qrsart

Generate QR codes with precision

- No dependencies
- Optimal segmentation
- Labeled output
- Built-in permutation logic

Drawbacks:
- No kanji support
- API not final (just getting started)
- Not perf optimized (yet)

## API

`createQR(data, { minVersion, maxVersion, ecl, mask }) => QRCode`

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

Coming soon

## Credits

- Nayuki's QR Code Generator
  - https://www.nayuki.io/page/creating-a-qr-code-step-by-step
  - https://www.nayuki.io/page/optimal-text-segmentation-for-qr-codes