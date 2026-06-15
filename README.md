# qrsart

Generate QR codes with **aesthetic precision**. No dependencies, fast, powerful.

[Documentation](/API.md)

---

## Features

### ✅ Datatype Helpers

- Typescript & JSON Schema for each QR datatype
- Ability to permute functionally-equivalent URIs
- Built-in SVG icons from heroicons

### ✅ Encoding Permutations

- Only QR library to do this
- Generate millions of permutations per payload
- Unlock for aesthetic grid selection

### ✅ Optimal Segmentation

- Nayuki optimal segmentation
- Useful for selecting minimal version / highest ECL
- Makes a big difference for URLs & numeric paths

### ✅ Built-in SVG Renderer

- Labeled layers for use in design software
- Accessible title/description
- Automatic datatype icons (from heroicons)
- Style options

### ✅ Grid Manipulation Utilities

### ✅ Aesthetic Sorting Helpers

### ✅ Separate Encoding and Rendering

- Encoding worker: generate QR string
- Client-side render: draw SVG

### ✅ Kanji Support

Kanji mode requires `TextDecoder("shift_jis")` support

**Supported**: modern Chrome, Edge, Firefox, Safari, Node.js with full ICU, Deno, and Bun 1.2.21+

When Shift_JIS/Kanji mode is unavailable, the library falls back to byte mode. The QR code still works, but may be less compact. `supportsKanji` is exported to simplify feature detection.

---

## About

- MIT license
- Originally Inspired by [Nayuki's QR Code Generator](https://www.nayuki.io/page/qr-code-generator-library)
- QR Code is a registered trademark of [Denso Wave](https://www.qrcode.com/en/)

