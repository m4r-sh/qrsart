# API Reference

- [Overview](#overview)
- [Data Formats](#data-formats)
- [Rendering](#rendering)
- [Grid](#grid)
- [Features](#features)
- [Encode](#encode)
- [Utils](#utils)

## Overview

---

### Simple QR Code Generation

#### createQR(data,options)

With no options, `createQR` chooses an efficient segmentation, the smallest allowed version that fits, the highest error-correction level that fits that version, and the lowest standard-penalty mask.

~~~js
import { createQR, drawSVG } from 'qrsart'

let qr = createQR("https://qrs.art")
let svg = drawSVG(qr)
~~~

Structured data helpers make it easy to produce scanner-friendly QR content without manually constructing URI formats. Passing a helper such as `vcardData(...)`, `smsData(...)`, or `urlData(...)` into `createQR` attaches the formatted data string, preview text, and built-in SVG icon to the returned QR instance. `drawSVG` uses those optional fields for its `<title>`, `<desc>`, and icon slot.

Encoding options can constrain the version and ECL search, reserve surplus space, or select a specific mask; rendering options control the resulting SVG style.

~~~js
import { createQR, drawSVG, vcardData } from 'qrsart'


let contact = vcardData({
  fullName: "m4rsh",
  title: "webmaster",
  emails: [{ value: "me@m4r.sh", type: "work" }]
})

let contactQR = createQR(contact, {
  version: [1, 20],
  ecl: [0, 3],
})

contactQR.data    // "BEGIN:VCARD..."
contactQR.preview // "m4rsh"
contactQR.icon    // { d: [...], scale: 1 / 20 }

let contactSVG = drawSVG(contactQR, {
  width: 320,
  height: 320,
  margin: 3,
  colors: {
    landmarks: "#000",
    dots: "hsl(210,80%,40%)",
    lines: "hsl(220,100%,50%)",
    background: "hsl(210,90%,95%)"
  },
  lines: { fill: true, thickness: 0.7, radius: 0.35 },
  dots: { size: 0.7, radius: 0.35 },
  finders: { roundness: 0.2, ring: 1.0, center: 1.0 },
  aligns:  { roundness: 0.2, ring: 0.9, center: 1.1 },
})

~~~



---

### Search Equivalent QRs

#### iterateQRs(data,options)

Iterate equivalent QR encodings and masks so you can choose one by aesthetic features instead of accepting only the default.

Metadata from data helpers is preserved across every yielded QR. This example finds a URL QR with the fewest isolated data dots, then renders the winning candidate.

For efficiency, each mask candidate for a given encoding reuses and mutates the same `QR` instance. Score or render each yielded value immediately, or call `qr.clone()` before storing candidates. `Leaderboard.consider(qr)` clones internally.

~~~js
import { iterateQRs, urlData, Leaderboard, tileClusters, drawSVG } from 'qrsart'

let url = urlData({
  protocol: "https",
  hostname: "qrs.art",
  pathname: "/studio"
})

let leaderboard = new Leaderboard(
  qr => tileClusters(qr.data_grid),
)

for(let qr of iterateQRs(url, { surplus: 12 })){
  leaderboard.consider(qr)
}

let best = leaderboard.min("num_dots").next().value
let svg = drawSVG(best.qr)
~~~

---

## Data Formats

- [URL](#url)
- [WiFi](#wifi)
- [Phone](#phone)
- [SMS](#sms)
- [Email](#email)
- [Contact](#contact)
- [Calendar Event](#calendar-event)
- [Geographic Location](#geographic-location)
- [Bitcoin Payment](#bitcoin-payment)
- [Ethereum Payment](#ethereum-payment)

QR codes can encode any string, but scanners recognize a smaller set of well-known data formats and can turn them into useful actions: opening a URL, joining WiFi, creating a contact, composing a message, or requesting a payment.

The data helpers save you from constructing these strings yourself. Each supported format provides:
- a JSON schema describing its input value and permutation options
- a formatter that produces a scanner-friendly string
- a `DataType` wrapper with string conversion, permutation helpers, and optional renderer metadata

~~~js
import {
  schemaData,
  formatData,
  urlData
} from 'qrsart'

let value = { url: "https://qrs.art" }

let urlSchema = schemaData("url")

urlSchema.value      // schema for URL values
urlSchema.permute    // schema for URL permutation options

formatData("url", value)
String(urlData(value))
~~~

A `DataType` can be passed directly to `createQR`. The resulting QR keeps the formatted string as `qr.data`, a short accessibility label as `qr.preview`, and a built-in icon descriptor as `qr.icon` when that format provides one.

~~~js
import { createQR, drawSVG, smsData } from 'qrsart'

let sms = smsData({
  number: "5558675309",
  message: "QRs forever"
})

let qr = createQR(sms)

qr.data    // "SMSTO:5558675309:QRs forever"
qr.preview // "5558675309"
qr.icon    // { d: [...], scale: 1 / 20 }

drawSVG(qr) // includes title, desc, and the built-in SMS icon
~~~

Icons are currently SVG path descriptors shaped as `{ d: string[], scale: number }`. The built-in icons were authored for a 20-by-20 coordinate space, so their scale is `1 / 20`.

Individual wrappers are exported as `urlData`, `wifiData`, `phoneData`, `smsData`, `emailData`, `vcardData`, `eventData`, `geoData`, `bitcoinData`, and `ethereumData`. The `formats` export lists the available format names.

---

### Deterministic Permutations

Some specifications allow multiple strings to mean the same thing. For example, URI schemes and hostnames are case-insensitive, so `https://qrs.art` and `HTTPS://QRS.ART` identify the same URL even though they produce different QR patterns.

A larger safe permutation space gives aesthetic QR projects more equivalent patterns to search. Permutation sets expose `{ total, get(index) }`, so every variation has a deterministic index and the work can be divided among processes without generating all earlier values.

~~~js
import { urlData } from 'qrsart'

let data = urlData({
  protocol: "https",
  hostname: "qrs.art"
})

let permutations = data.permute({
  protocolCaps: true,
  hostnameCaps: true
})

permutations.total
permutations.get(42)

// Split work across four processes
for(let [value,index] of permutations.batch(/* process index */, 4)){
  // generate and score this equivalent value
}
~~~

The same API is also available as `permuteData(type,value,options)`. Formats without a meaningful permutation space currently focus on canonical formatting.

---

### URL

#### urlData(value)

Format a URL for scanners and browsers.

Specification: [RFC 3986: URI Generic Syntax](https://www.rfc-editor.org/rfc/rfc3986). URI schemes and hosts are case-insensitive; paths, queries, and fragments are generally not.

Permutations: protocol casing, hostname casing, and the optional root slash.

~~~js
import { urlData, schemaData } from 'qrsart'

let url = urlData({
  protocol: "https",
  hostname: "qrs.art",
  pathname: "/studio",
  search: "?page=1"
})

String(url)
schemaData("url").value
~~~

---

### WiFi

#### wifiData(value)

Format network credentials so supported scanners can offer to join the network.

Specification: the [ZXing WiFi network configuration format](https://github.com/zxing/zxing/wiki/Barcode-Contents#wi-fi-network-config-android-ios-11) is a widely-supported de facto scanner convention rather than an RFC.

Permutations: safely reorder the semicolon-delimited WiFi fields.

~~~js
import { wifiData } from 'qrsart'

let wifi = wifiData({
  ssid: "GuestNet",
  pass: "8080808",
  type: "WPA"
})

String(wifi)
let permutations = wifi.permute({ ordering: true })
~~~

---

### Phone

#### phoneData(value)

Format a phone number so scanners can open a dialer.

Specification: [RFC 3966: The `tel` URI for Telephone Numbers](https://www.rfc-editor.org/rfc/rfc3966). Visual separators such as hyphens, periods, and parentheses do not change the number.

Permutations: valid visual separators, grouping choices, and optional parentheses.

~~~js
import { phoneData } from 'qrsart'

let phone = phoneData({
  number: "9999999999",
  countryCode: "1",
  extension: "12"
})

String(phone)
let permutations = phone.permute({
  validSpacers: ["-", "."],
  parenGroups: true,
  groupings: [[3, 3, 4]]
})
~~~

---

### SMS

#### smsData(value)

Format a phone number and optional message so scanners can open an SMS composer.

Specification: [RFC 5724: The `sms` URI Scheme](https://www.rfc-editor.org/rfc/rfc5724), using the phone-number syntax from RFC 3966.

Permutations: phone-number separators and groupings, plus safe casing variations for the URI scheme and message field.

~~~js
import { smsData } from 'qrsart'

let sms = smsData({
  number: "9999999999",
  countryCode: "1",
  message: "Hello"
})

String(sms)
let permutations = sms.permute({
  validSpacers: ["-", "."],
  groupings: [[3, 3, 4]],
  prefixCaps: true,
  queryCaps: true
})
~~~

---

### Email

#### emailData(value)

Format recipients and message fields so scanners can open an email composer.

Specification: [RFC 6068: The `mailto` URI Scheme](https://www.rfc-editor.org/rfc/rfc6068).

Permutations: equivalent domain casing, URI-scheme casing, query-field casing, and query-field ordering.

~~~js
import { emailData } from 'qrsart'

let email = emailData({
  to: "dev@qrs.art",
  subject: "Docs Test",
  cc: "test@qrs.art"
})

String(email)
let permutations = email.permute({
  prefixCaps: true,
  queryCaps: true,
  queryOrdering: true
})
~~~

---

### Contact

#### vcardData(value)

Format contact information as a vCard that supported scanners can add to an address book.

Specification: [RFC 6350: vCard Format Specification](https://www.rfc-editor.org/rfc/rfc6350).

~~~js
import { vcardData } from 'qrsart'

let contact = vcardData({
  fullName: "John Doe",
  givenName: "John",
  familyName: "Doe",
  organization: "Example Corp",
  title: "Software Engineer",
  phones: [{ value: "+1-123-456-7890", type: "work" }],
  emails: [{ value: "john.doe@example.com", type: "work" }]
})

String(contact)
~~~

---

### Calendar Event

#### eventData(value)

Format event information as an iCalendar object that supported scanners can add to a calendar.

Specification: [RFC 5545: iCalendar](https://www.rfc-editor.org/rfc/rfc5545), particularly the `VEVENT` component.

~~~js
import { eventData } from 'qrsart'

let event = eventData({
  summary: "Team Meeting",
  description: "Discuss project updates",
  location: "Conference Room A",
  start: "2025-08-15T10:00:00Z",
  end: "2025-08-15T11:00:00Z",
  uid: "team-meeting@example.com",
  dtstamp: "2025-08-01T12:00:00Z"
})

String(event)
~~~

---

### Geographic Location

#### geoData(value)

Format coordinates so scanners can open a mapping application.

Specification: [RFC 5870: The `geo` URI Scheme](https://www.rfc-editor.org/rfc/rfc5870).

Permutations: URI-scheme casing and equivalent coordinate precision using trailing zeroes.

~~~js
import { geoData } from 'qrsart'

let location = geoData({
  latitude: 38.71482,
  longitude: 115.44185
})

String(location)
let permutations = location.permute({
  prefixCaps: true,
  varyPrecision: true,
  precision: 5,
  maxDecimals: 10
})
~~~

---

### Bitcoin Payment

#### bitcoinData(value)

Format a Bitcoin payment request with an optional amount, label, and message.

Specification: [BIP 21: URI Scheme](https://bips.dev/21/). The current formatter implements the familiar BIP 21 `bitcoin:` payment fields.

~~~js
import { bitcoinData } from 'qrsart'

let payment = bitcoinData({
  address: "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
  amount: 0.1,
  label: "Satoshi Nakamoto",
  message: "Donation for Bitcoin development"
})

String(payment)
~~~

---

### Ethereum Payment

#### ethereumData(value)

Format an Ether payment or ERC-20 token transfer request.

Specification: [ERC-681: URL Format for Transaction Requests](https://eips.ethereum.org/EIPS/eip-681).

~~~js
import { ethereumData } from 'qrsart'

let payment = ethereumData({
  address: "0xfb6916095ca1df60bb79Ce92ce3ea74c37c5d359",
  chainId: 1,
  amount: 0.1
})

String(payment)
~~~

---

## Rendering

---

### Generate Complete SVGs

#### `drawSVG(qr,options)`

Render an SVG string from a QR instance.

If the QR was created from a data helper, `drawSVG` uses `qr.preview` for the SVG `<title>`, `qr.data` for `<desc>`, and `qr.icon` for the icon slot unless `options.icon` overrides it. The root `<svg>` also includes `data-qrsart` with the library version.

~~~js
import { createQR, drawSVG } from 'qrsart'

let qr = createQR("SVG Supremacy")
drawSVG(qr, {
  margin: 2,
  width: 100,
  height: 100,
  colors: {
    landmarks: "#000",
    dots:  "hsl(0,50%,30%)",
    lines: "hsl(0,80%,40%)",
    icon:  "hsl(0,100%,50%)",
    background: false
  },
  lines: { fill: true, thickness: 0.7, radius: 0.35 },
  dots:  { size: 0.7, radius: 0.35 },
  finders: { roundness: 0.2, ring: 1.0, center: 1.0 },
  aligns:  { roundness: 0.0, ring: 0.8, center: 1.1 },
  icon: null // omit, override, or set to null to suppress qr.icon
})
~~~

Use stroke mode when you want the old centerline-path behavior.

~~~js
drawSVG(qr, {
  lines: { fill: false, thickness: 0.7 }
})
~~~

---

### SVG path components

#### `drawFinders(qr,options)`

Render SVG path data for the three finder patterns.

~~~js
import { createQR, drawFinders } from 'qrsart'

let qr = createQR("Finder paths")
let d = drawFinders(qr, {
  roundness: 0.2,
  ring: 1,
  center: 1
})
~~~

#### `drawAligns(qr,options)`

Render SVG path data for the QR alignment patterns.

~~~js
import { createQR, drawAligns } from 'qrsart'

let qr = createQR("Alignment paths", { version: 7 })
let d = drawAligns(qr, {
  roundness: 0.15,
  ring: 0.9,
  center: 1
})
~~~

#### `drawDots(points,options)`

Render a list of grid coordinates as SVG path data.
Use `size` for the visual footprint and `radius` for corner roundness.

~~~js
import { drawDots } from 'qrsart'

let d = drawDots([
  [0, 0],
  [2, 1],
  [4, 3]
], {
  size: 0.75,
  radius: 0.2
})
~~~

#### `circlePath(cx,cy,r)`

Create SVG path data for a circle centered on a grid coordinate.

~~~js
import { circlePath } from 'qrsart'

let d = circlePath(3, 4, 0.5)
~~~

#### `boxPath(cx,cy,s,r)`

Create SVG path data for a centered square, optionally with rounded corners.

~~~js
import { boxPath } from 'qrsart'

let d = boxPath(3, 4, 2, 0.25)
~~~

#### `rectPath(x,y,w,h,r)`

Create SVG path data for a rectangle, optionally with rounded corners.

~~~js
import { rectPath } from 'qrsart'

let d = rectPath(1, 2, 8, 4, 0.5)
~~~

---

### Placement Utilities

#### `getIconBox(qr,slot)`

`slot: "auto" | "top" | "center" | "bottom"`

Find a box where an icon can be placed without disrupting the QR code (center isn't ideal for larger QR Codes).

Icon descriptors use `{ d: string[], scale: number }`. Built-in data icons use path data authored for a 20-by-20 viewbox and `scale: 1 / 20`.

~~~js
import { createQR, getIconBox } from 'qrsart'

let qr = createQR("Icon placement")
let box = getIconBox(qr, "bottom")

// { x, y, width, height, cx, cy }
~~~

---

## Grid

---

### QR Class

#### `QR({ version,ecl,mask,codewords })`

Represent a QR code that has already been encoded into codewords.

`QR` is useful when you want to render, serialize, deserialize, or inspect an already-encoded QR code. Its component grids are especially handy for custom renderers that draw each QR layer with a different style.

~~~js
import { QR, createQR, Grid } from 'qrsart'

let qr = createQR("split the layers")

let without_finders = Grid.erase(qr.grid, qr.finder_grid)

qr.grid           // complete QR grid
qr.finder_grid    // finder patterns
qr.alignment_grid // alignment patterns
qr.data_grid      // masked data modules
qr.rawdata_grid   // unmasked data modules
~~~

Changing the mask on an existing `QR` is efficient. The QR keeps its data grid and XORs away the old mask before XORing in the new one, instead of redrawing the whole code.

~~~js
import { createQR } from 'qrsart'

let qr = createQR("set mask", { mask: 0 })
let mask0 = qr.grid.clone() 
qr.mask = 3
let mask3 = qr.grid
~~~

Serialization keeps the encoded QR compact, so you can restore it without re-running the encoder.

~~~js
import { QR, createQR } from 'qrsart'

let qr = createQR("save me")

let bytes = qr.toBytes()
let fromBytes = QR.fromBytes(bytes)

let str = qr.toString()
let fromString = QR.fromString(str)
~~~

---

### Grid Class

#### `Grid(width,height)`

A fast bitpacked grid for marking, combining, slicing, and iterating QR modules.

`Grid` stores values and usage flags in `Uint32Array` bitfields, so its core operations stay fast with bitwise operations. Instance operations mutate the grid they are called on; static operations clone first and return a new grid.

~~~js
import { Grid } from 'qrsart'

let a = new Grid(21,21)
let b = new Grid(21) // height inferred

a.set(3, 3, 1)
b.set(3, 3, 1)
b.set(4, 3, 1)

a.erase(b) // mutates a
let c = Grid.erase(b, a) // leaves b and a alone
~~~

The basic tile helpers are useful when you need to draw or inspect individual modules.

~~~js
import { Grid } from 'qrsart'

let grid = new Grid(5)

grid.set(1, 1, 1)
grid.set(2, 1, 0)

grid.get(1, 1)  // 1
grid.used(2, 1) // 1
grid.used(3, 1) // 0
~~~

Iterators expose used tiles, on tiles, or off tiles. This is usually the easiest way to turn a grid into paths, shapes, or custom drawing commands.

~~~js
import { Grid } from 'qrsart'

let grid = new Grid(5)
grid.set(1, 1, 1)
grid.set(2, 1, 0)
grid.set(3, 1, 1)

for(let [x,y,isOn] of grid.tiles()){
  // every used tile
}

for(let [x,y] of grid.ons()){
  // only used tiles with value 1
}

for(let [x,y] of grid.offs()){
  // only used tiles with value 0
}
~~~

Grid operations are the main reason to reach for the class directly. They are useful for drawing QR patterns internally, and for segmenting or manipulating QR grids after generation.

~~~js
import { createQR, Grid } from 'qrsart'

let qr = createQR("style me")

let landmarks = Grid.union(
  qr.finder_grid,
  qr.alignment_grid
)

let data = Grid.erase(qr.grid, landmarks)
let reversed = Grid.invert(data)
~~~

`crop`, `frame`, and `clone` help you work with smaller regions without changing the original grid.

~~~js
import { createQR } from 'qrsart'

let qr = createQR("crop")

let topLeft = qr.grid.crop(0, 0, 9, 9)
let withMargin = qr.grid.frame(2, 2, qr.size + 4, qr.size + 4)
let copy = qr.grid.clone()
~~~

---

### Pattern Functions

#### `getFunctionalGrid(version,ecl,mask)`

Build the functional QR modules for a version, error-correction level, and mask.

~~~js
import { getFunctionalGrid } from 'qrsart'
let grid = getFunctionalGrid(4, 1, 3)
~~~

#### `getMaskGrid(version,mask)`

Build the mask grid for a QR version and mask index.

~~~js
import { getMaskGrid } from 'qrsart'
let mask = getMaskGrid(4, 3)
~~~

#### `getDataPath(version)`

Return the QR data-module path as alternating `x,y` coordinates.

~~~js
import { getDataPath } from 'qrsart'
let path = getDataPath(4)
let first = [path[0], path[1]]
~~~

#### `getAlignmentPositions(version)`

Return the alignment-pattern center positions for a QR version.

~~~js
import { getAlignmentPositions } from 'qrsart'
getAlignmentPositions(1) // []
getAlignmentPositions(7) // [6, 22, 38]
~~~

---

## Features

QR codes have many equivalent ways to encode the same message. At the very least, the QR spec gives us 8 possible masks to choose from. However, with clever data permutations and iterating over equivalent encodings, this number can easily surpass a million functionally equivalent encodings.

The spec defines a standard penalty score for selecting a mask that should scan well. That is a good default, but it is not the only useful way to rank QR codes. We can also sort QRs by aesthetic features, which makes it easier to choose codes that render cleanly in a custom style.

~~~js
import { iterateQRs, Leaderboard, standardPenalty } from 'qrsart'

let leaderboard = new Leaderboard(qr => standardPenalty(qr.grid))

for(let qr of iterateQRs("many equivalent codes")){
  leaderboard.consider(qr)
}

let lowestPenalty = leaderboard.min("penalty")
let highestPenalty = leaderboard.max("penalty")
~~~

---

### Scoring Functions

A Scoring function is the first parameter to a `Leaderboard`. It returns { scores, cache }. scores can contain multiple numeric metrics, and cache can hold computed data that renderers or later steps may reuse so they do not repeat the same work. Leaderboards track both the min and max for each metric in scores using `TopN` and `BottomN`.

#### `standardPenalty(grid)`

Score a complete QR grid using the standard QR mask penalty.

Intent: prefer masks that avoid long runs, large same-color blocks, finder-like false patterns, and poor dark/light balance.

Scores:
- `penalty`: total standard penalty, where lower is better

Cache:
- `penalty1`: adjacent same-color run penalty
- `penalty2`: 2x2 same-color block penalty
- `penalty3`: finder-like pattern penalty
- `penalty4`: dark/light balance penalty

#### `findFits(grid,shapes)`

Find every place a collection of shapes can fit exactly against a grid (overlapping)

Intent: locate candidate placements for icons, tiles, texture units, or other visual motifs that should match existing QR modules.

Scores:
- `candidates`: number of valid placements found

Cache:
- `fits`: candidate placements as `{ shape, coords }`

~~~js
import { createQR, findFits } from 'qrsart'

let qr = createQR("shape fits")
let shapes = {
  corner: {
    points: [ [0, 0, 1], [1, 0, 1], [0, 1, 1] ]
  }
}

let { scores, cache } = findFits(qr.data_grid, shapes)
~~~

#### `packShapes(grid,shapes)`

Choose a **non-overlapping** set of valid shape placements.

Intent: pack matching shapes onto a QR grid, then reuse the selected placements or the covered/uncovered grids for rendering.

Scores:
- `num_placements`: number of selected placements

Cache:
- `placements`: selected placements as `{ shape, coords }`
- `used`: grid covered by selected placements
- `unused`: remaining grid after selected placements are erased

~~~js
import { createQR, packShapes } from 'qrsart'

let qr = createQR("pack shapes")
let { scores, cache } = packShapes(qr.data_grid, /* shapes */)
~~~

#### `tileClusters(grid,options)`

Group connected tiles into shapes and isolated dots.

`options: { diagonal, value }`

Intent: measure and reuse the natural clusters in a QR grid, optionally including diagonal connections or targeting off tiles instead of on tiles.

Scores:
- `num_dots`: number of single-tile clusters
- `num_shapes`: number of multi-tile clusters
- `biggest_shape`: size of the largest multi-tile cluster, `1` when only isolated tiles exist, or `0` when the grid has no matching tiles

Cache:
- `shapes`: arrays of connected points
- `dots`: isolated points

~~~js
import { createQR, tileClusters } from 'qrsart'

let qr = createQR("clusters")
let { scores, cache } = tileClusters(qr.data_grid, {
  diagonal: false,
  value: true
})
~~~

#### `penStrokes(grid,options)`

Convert tile clusters into compact SVG path lines.

`options: { fill, thickness, radius, expand_stroke }`

Intent: turn QR data modules into line-like fills or strokes and dots for renderers that want a drawn or plotted look. `expand_stroke` remains supported as the older name for choosing filled output.

Scores:
- `num_dots`: number of isolated dots
- `num_clusters`: number of multi-tile clusters
- `num_paths`: number of generated stroke paths
- `svg_len`: combined path string length

Cache:
- `strokes`: SVG path data for clustered tiles
- `dots`: isolated points

~~~js
import { createQR, penStrokes } from 'qrsart'

let qr = createQR("pen strokes")
let { scores, cache } = penStrokes(qr.data_grid, {
  fill: true,
  thickness: 0.7,
  radius: 0.35
})
~~~

---

### Tracking Best Options

#### `Leaderboard(scorer,options)`

Track the extreme values for every metric returned by a scorer.

A feature scorer returns `{ scores, cache }`. `scores` can contain multiple numeric metrics, and `cache` can hold computed data that renderers or later steps may reuse so they do not repeat the same work.

~~~js
import { Leaderboard } from 'qrsart'

let leaderboard = new Leaderboard(
  qr => ({
    scores: {
      visual_balance: /* number */,
      empty_center: /* number */
    },
    cache: {
      reusable_geometry: /* anything useful */
    }
  }),
  { capacity: 8 }
)

leaderboard.listen(result => {
  // { metric, direction, score, qr, cache }
})

leaderboard.consider(qr)
leaderboard.min("visual_balance")
leaderboard.max("empty_center")
leaderboard.results("visual_balance")
leaderboard.allResults()
~~~

#### `TopN(capacity)`

Keep the highest-scoring objects seen so far.

~~~js
import { TopN } from 'qrsart'

let top = new TopN(3)

top.consider(10, /* object */)
top.consider(42, /* object */)

top.peekPriority()
top.peek()

for(let { score, object } of top){
  // highest scores first
}
~~~

#### `BottomN(capacity)`

Keep the lowest-scoring objects seen so far.

~~~js
import { BottomN } from 'qrsart'

let bottom = new BottomN(3)

bottom.consider(10, /* object */)
bottom.consider(2, /* object */)

for(let { score, object } of bottom){
  // lowest scores first
}
~~~

## Encode

Encoding is performed automatically by `createQR`, but these exports are useful to understand or control how a string is converted to QR Code codewords.

QR encoding has two optimization targets:
- choose the smallest version that fits
- choose the highest error-correction level that still fits

QR Codes with a *lower version* are generally easier to scan. Usually, the size of the QR Code is determined by the destination, whether it's on a sticker, a billboard, or a website. Lower versions have less tiles on their grid, so cameras can detect them with less effort and from farther away.



However, sometimes there's a tradeoff between QR version and Error Correction Level (ECL). ECL determines what percentage of tiles can be occluded while still scanning successfully. For outdoor, printed, or partially occluded environments, high ECL's are recommended. However, for screens or QRs with low risk of visual faults, it's perfectly fine to have a low ECL.



QR Code Data is encoded into a sequence of bits called "Codewords" before it's placed on a grid. These codewords are composed of segments with a **header** and a **payload**. The header contains information about the "mode" of segment, and the four standard modes are: `Numeric`, `Alpha`, `Byte`, and `Kanji`. Encoding a sequence of 10 numbers is much cheaper in `Numeric` mode than `Byte` mode, for example.

The process of converting a string of characters into these segments is algorithmically interesting because switching modes has a cost. Like [Nayuki's QR Code generator work](https://www.nayuki.io/page/qr-code-generator-library) on optimal segment switching, this library treats segmentation as a cost problem instead of always picking one mode for the whole string.

The unique capability provided by `qrsart` is `allStrategies`: given a fixed version and ECL, it can iterate every valid segmentation strategy that fits. That is what enables the root `iterateQRs` API to explore many equivalent QRs for aesthetic scoring.

---

### Strategy Selection

#### `optimalStrategy(data,options)`

Choose a segmentation strategy, QR version, and error-correction level for a string.

`options: { version, ecl, surplus }`

The search first finds the smallest version that can fit the data at the minimum allowed ECL. Smaller QR versions are physically simpler, which usually means they can scan from farther away at the same printed size. After the version is chosen, the encoder tries to raise ECL as high as it can without increasing the version.

`surplus` reserves extra unused bits during this search. This is useful when you plan to iterate equivalent encodings later and want guaranteed room for alternate segmentations.

~~~js
import { optimalStrategy } from 'qrsart'

optimalStrategy("HELLO 12345", {
  version: [1, 10],
  ecl: [0, 3],
  surplus: 16
})

// { strategy, version, ecl }
~~~

#### `findMinimumVersion(data,minVersion,maxVersion,minEcl,minSurplus)`

Find the smallest QR version that can fit the data at a required minimum ECL.

This is the version-search half of `optimalStrategy`. It returns the minimum-cost strategy for the selected version along with the version number.

~~~js
import { findMinimumVersion } from 'qrsart'

findMinimumVersion( "small if possible",
    1,  /* minVersion */
    40, /* maxVersion */
    1,  /* minEcl */
    16  /* surplus */
)

// [strategy, version]
~~~

#### `minStrategy(data,version)`

Find the lowest-bit-cost mode segmentation for a string at a specific QR version.

This uses dynamic programming over encoding modes and mode phases, so it can choose useful switches between numeric, alpha, byte, and kanji segments when that saves bits.

~~~js
import { minStrategy } from 'qrsart'

let strategy = minStrategy("ABC-123-example", 4)

strategy.cost
strategy.steps // [["alpha", 7], ["byte", 7]]
~~~

#### `naiveStrategy(data,version,mode)`

Build a simple single-mode strategy.

Without an explicit mode, this picks numeric if everything is numeric, alpha if everything fits the QR alphanumeric charset, and byte otherwise. With an explicit mode, it throws if the data cannot be represented in that mode.

~~~js
import { naiveStrategy } from 'qrsart'

let auto = naiveStrategy("HELLO 123", 1)
let numeric = naiveStrategy("123456", 1, "numeric")
~~~

---

### Equivalent Strategies

#### `allStrategies(data,version,ecl)`

Iterate every segmentation strategy that fits within a fixed version and ECL.

Most QR encoders only need one good strategy; `allStrategies` intentionally exposes the search space so you can generate many equivalent codeword sequences, render many QR candidates, and score them with feature functions.

~~~js
import { allStrategies, CodewordSequence, QR } from 'qrsart'

let data = "many possible encodings"
let version = 6
let ecl = 2

for(let strategy of allStrategies(data, version, ecl)){
  let codewords = new CodewordSequence(data, strategy, version, ecl)
  let qr = new QR({ version, ecl, mask: 0, codewords })
  // try masks, score features, render candidates, etc.
}
~~~

The root `iterateQRs(data, options)` helper builds on this idea by yielding QR instances across valid strategies and masks.

---

### Encoded Output

#### `Strategy(cost,steps)`

A mode segmentation plan.

`cost` is the approximate bit cost of the data payload. `steps` is an array of `[mode, length]` pairs, where each step describes a run of characters encoded in one QR mode.

~~~js
import { Strategy } from 'qrsart'

let strategy = new Strategy(24, [
  ["alpha", 5],
  ["numeric", 3]
])
~~~

#### `CodewordSequence(data,strategy,version,ecl)`

Encode a string and strategy into final QR codewords.

This writes mode headers, character counts, payload bits, terminator and pad bytes, then computes Reed-Solomon error correction and interleaves the blocks according to the QR spec.

~~~js
import { CodewordSequence, minStrategy } from 'qrsart'

let data = "codewords"
let version = 3
let ecl = 1
let strategy = minStrategy(data, version)

let codewords = new CodewordSequence(data, strategy, version, ecl)
~~~

---

## Utils

These exports are mostly QR-spec reference data. They are useful when you need to reason about capacity, masks, modes, or error correction directly, but most projects can stay at the higher-level `createQR`, `iterateQRs`, and renderer APIs.

The package root exports:
- `ECLS`
- `MASKS`
- `MODES`
- `supportsKanji`
- `getNumDataCodewords(version,ecl)`
- `getNumRawDataModules(version)`

---

### Error Correction

#### `ECLS`

QR codes use Reed-Solomon error correction. The QR spec defines four error-correction levels, usually written as L, M, Q, and H. Higher levels reserve more codewords for error correction, which makes the QR more resilient to damage or styling, but leaves less room for data.

In this library, ECL values are numeric:
- `0`: low, roughly 7% recovery
- `1`: medium, roughly 15% recovery
- `2`: quartile, roughly 25% recovery
- `3`: high, roughly 30% recovery

Each `ECLS[ecl]` entry contains the spec tables needed to build and read QR codewords:
- `formatBits`: the 2-bit value written into the QR format information
- `codewords_per_block[version]`: error-correction codewords per block
- `num_ecc_blocks[version]`: number of error-correction blocks

~~~js
import { ECLS } from 'qrsart'

let high = ECLS[3]
let formatBits = high.formatBits
let eccCodewords = high.codewords_per_block[7]
let eccBlocks = high.num_ecc_blocks[7]
~~~

ECL is one of the main tradeoffs in QR generation. If you increase it, the code can tolerate more disruption, but the same message may require a larger version. If you decrease it, the QR can be smaller or hold more data, but has less tolerance for damage, logos, unusual rendering, or poor scanning conditions.

---

### Masks

#### `MASKS`

The QR spec defines 8 mask patterns. A mask flips selected data modules after the data has been placed, which helps avoid visual patterns that are hard for scanners to read.

`MASKS` is an array of functions. Each function receives `(x,y)` and returns whether that mask applies at that coordinate. Masks are applied only to data modules, not finder patterns, timing patterns, format information, or other functional areas.

~~~js
import { MASKS } from 'qrsart'

let shouldFlip = MASKS[3](12, 8)
~~~

The standard QR flow tries all 8 masks and chooses the one with the lowest standard penalty. This library also exposes `iterateQRs` and feature scoring so you can compare masks, encodings, and aesthetic properties yourself.

---

### Modes

#### `MODES`

QR data can be encoded in several modes. More specific modes are denser, but can only represent certain characters.

`MODES` contains the mode definitions used by the encoder:
- `numeric`: digits only
- `alpha`: QR alphanumeric charset
- `byte`: UTF-8 bytes
- `kanji`: Shift JIS kanji mode

Each mode includes its QR mode bits, character-count width behavior, rough character costs, marginal costs, and a low-level `write` function used by the encoder.

`supportsKanji` is a boolean environment check used by kanji mode. It is `true` when the current runtime supports the Shift JIS encoding data needed for QR kanji segments.

~~~js
import { MODES, supportsKanji } from 'qrsart'

let numeric = MODES.find(mode => mode.name == "numeric")
let canEncode = numeric.charCost("7") < Infinity
~~~

These are mostly useful for understanding or extending encoding behavior. For normal use, pass a string to `createQR` and let the strategy functions choose a mode sequence.

---

### Capacity

#### `getNumRawDataModules(version)`

Return the number of QR modules available for raw data and error-correction bits after functional patterns are reserved.

~~~js
import { getNumRawDataModules } from 'qrsart'

let modules = getNumRawDataModules(7)
~~~

#### `getNumDataCodewords(version,ecl)`

Return the number of data codewords available for a QR version and error-correction level.

This subtracts the Reed-Solomon error-correction codewords for the selected ECL from the raw codeword capacity. Higher ECL values usually mean fewer available data codewords.

~~~js
import { getNumDataCodewords } from 'qrsart'

let lowCapacity = getNumDataCodewords(7, 0)
let highCapacity = getNumDataCodewords(7, 3)
~~~

---