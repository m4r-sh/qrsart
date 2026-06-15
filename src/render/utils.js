import { getAlignmentPositions, Grid } from '../grid';

export function drawAligns(qr, { 
  roundness=0,
  ring=1,
  center=1,
}={}){
  let sizes = [
    (2 * 2) + ring,
    (2 * 2) - ring,
    (0 * 2) + center
  ]
  let d = ''
  let aligns = getAlignmentPositions(qr.version)
  for(let i = 0; i < aligns.length; i++){
    for(let j = 0; j < aligns.length; j++){
      if (!(i == 0 && j == 0 || i == 0 && j == aligns.length - 1 || i == aligns.length - 1 && j == 0)){
        let cx = aligns[i]
        let cy = aligns[j]
        sizes.forEach((s, index) => {
          let r = s * roundness * 0.5
          d += boxPath(cx, cy, s, r, { clockwise: index !== 1 })
        })
      }
    }
  }
  return d
}

export function drawFinders(qr, { 
  roundness=0,
  ring=1,
  center=1,
}={}){
  let sizes = [
    (3 * 2) + ring,
    (3 * 2) - ring,
    (1 * 2) + center
  ]
  let d = ''
  Array.from([[0,0],[0,qr.size-7],[qr.size-7,0]]).forEach(([x,y]) => {
    let cx = x + 3
    let cy = y + 3
    sizes.forEach((s, index) => {
      let r = s * roundness * 0.5
      d += boxPath(cx, cy, s, r, { clockwise: index !== 1 })
    })
  })
  return d
}

export function drawDots(xys=[[0,0]], { 
  size = 0.7,
  radius,
}={}){
  const half = size * 0.5
  const cornerRadius = Math.max(0, Math.min(radius ?? half, half))

  return xys.map(([x,y]) => {
    if (cornerRadius >= half) return circlePath(x,y,half)
    return boxPath(x,y,size,cornerRadius)
  }).join('')
}

export function getIconBox(qr, slot = "auto") {
  const { size, version } = qr;
  const iconSize = Math.ceil(size / 5);

  const align = getAlignmentPositions(version);
  const hasMiddleAlign = align.length > 2 && align.length % 2 === 1;

  // true center tile (integer, correct for odd QR size)
  let centerX = Math.floor(size / 2);
  let centerY = centerX;

  if (hasMiddleAlign && slot !== "center") {
    const mid = align.length >> 1;
    if (slot === "bottom") {
      // clean midpoint of the gap below the central alignment
      centerY = Math.floor((align[mid] + align[mid + 1]) / 2);
    } else {
      // clean midpoint of the gap above the central alignment
      centerY = Math.floor((align[mid - 1] + align[mid]) / 2);
    }
  }

  const x = centerX - Math.floor(iconSize / 2);
  const y = centerY - Math.floor(iconSize / 2);

  return {
    x,
    y,
    width: iconSize,
    height: iconSize,
    cx: x + iconSize / 2,   // true geometric center of the icon box
    cy: y + iconSize / 2,
  };
}




export function boxPath(cx, cy, size, r = 0, options) {
  const half = size / 2;
  return rectPath(
    cx - half,
    cy - half,
    size,
    size,
    r,
    options
  );
}

export function rectPath(x, y, w, h, r = 0, { clockwise = true } = {}) {
  if (r == 0) return sharpRectPath(x, y, w, h, clockwise);

  let rr = Math.min(r, w / 2, h / 2);

  x = round(x, 3);
  y = round(y, 3);
  w = round(w, 4);
  h = round(h, 4);
  rr = round(rr, 4);

  const sx = round(w - 2 * rr, 4); // horizontal straight section
  const sy = round(h - 2 * rr, 4); // vertical straight section

  if (clockwise) {
    return (
      `M${round(x + rr, 3)},${y}` +        // Move to top-left corner + radius
      `h${sx}` +                          // Top edge
      `a${rr},${rr} 0 0 1 ${rr},${rr}` +  // Top-right corner
      `v${sy}` +                          // Right edge
      `a${rr},${rr} 0 0 1 ${-rr},${rr}` + // Bottom-right corner
      `h${-sx}` +                         // Bottom edge
      `a${rr},${rr} 0 0 1 ${-rr},${-rr}` + // Bottom-left corner
      `v${-sy}` +                         // Left edge
      `a${rr},${rr} 0 0 1 ${rr},${-rr}z`  // Top-left corner
    );
  }

  return (
    `M${round(x + rr, 3)},${y}` +
    `a${rr},${rr} 0 0 0 ${-rr},${rr}` +
    `v${sy}` +
    `a${rr},${rr} 0 0 0 ${rr},${rr}` +
    `h${sx}` +
    `a${rr},${rr} 0 0 0 ${rr},${-rr}` +
    `v${-sy}` +
    `a${rr},${rr} 0 0 0 ${-rr},${-rr}z`
  );
}

function sharpRectPath(x, y, w, h, clockwise = true) {
  x = round(x, 2);
  y = round(y, 2);

  if (!clockwise) {
    return (
      `M${x},${y}` +
      `v${h}` +
      `h${w}` +
      `v${-h}` +
      `Z`
    );
  }

  return (
    `M${x},${y}` + // Move to top-left corner
    `h${w}` +      // Top edge
    `v${h}` +      // Right edge
    `h${-w}` +     // Bottom edge
    `Z`            // Close path
  );
}

function round(n, places = 4) {
  return +n.toFixed(places);
}

export function circlePath(cx, cy, radius=0.5) {
  const r = +radius.toFixed(2);
  return `M${+(cx - radius).toFixed(2)},${+cy.toFixed(2)} a${r},${r} 0 1 0 ${r*2},0 a${r},${r} 0 1 0 ${-r*2},0z`;
}
