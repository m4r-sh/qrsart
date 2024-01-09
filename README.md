# qrsart

Generate QR codes with precision

- No dependencies
- Performant
- Simple API

Drawbacks:
- No kanji support
- 

## API

`createQR(data, { minVersion, maxVersion, ecl, mask })`

`findVersion(data,{ minVersion, maxVersion, minEcl })`

`new QRCode({ bitstring, version, ecl, mask })`
- `.size`
- `.grid`
- `.data_pattern`
- `.functional_patterns`
- `.finder_patterns`
- `.alignment_patterns`
- `.timing_patterns`
- `.format_pattern`
- `.version_pattern`


## Rendering

Coming soon

## Aesthetic Optimization

Coming soon

## Benchmarks

Coming soon

## Credits

- Nayuki's QR Code Generator
  - https://www.nayuki.io/page/creating-a-qr-code-step-by-step
  - https://www.nayuki.io/page/optimal-text-segmentation-for-qr-codes