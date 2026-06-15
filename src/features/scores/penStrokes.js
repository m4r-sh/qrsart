import { tileClusters } from './tileClusters'

export function penStrokes(grid, { 
  fill,
  expand_stroke,
  thickness=0.7,
  radius,
}={}){
  const useFill = fill ?? expand_stroke ?? true
  const capRadius = radius ?? thickness / 2
  let { shapes, dots } = tileClusters(grid).cache
  let strokes = []
  for(let shape of shapes){
    let runs = extractRuns(shape)
    let chosen = greedyRuns(runs, shape)
    let groups = orderRunsPenDown(chosen)
    let svg_d = groups.map(group => 
      useFill ? runsToFilledSVGPath(group, { thickness, radius: capRadius }) : runsToSVGPath(group)
    ).join(' ')
    strokes.push(svg_d)
  }
  const circlePath = (x, y, radius = 0.5) => {
    const r = +radius.toFixed(2);
    const d = +(radius * 2).toFixed(2);
    return `M${+(x - radius).toFixed(2)},${+y.toFixed(2)} a${r},${r} 0 1 0 ${d},0 a${r},${r} 0 1 0 ${-d},0z`;
  };
  let dots_path = dots.map(([x,y]) => circlePath(x,y,0.5)).join('')

  return {
    scores: {
      num_dots: dots.length,
      num_clusters: shapes.length,
      num_paths: strokes.length,
      svg_len: strokes.join(' ').length + dots_path.length
    },
    cache: {
      strokes,
      dots
    }
  }
}


function runsToFilledSVGPath(group, { thickness = 0.7, radius = thickness / 2 } = {}) {
  const q = x => +(x.toFixed(2));
  const parts = [];

  const half = thickness / 2;
  const cap = Math.max(0, Math.min(radius, half));

  for (const { run: rseg, from } of group) {
    const forward = (from[0] === rseg.x0 && from[1] === rseg.y0);

    const sx = forward ? rseg.x0 : rseg.x1;
    const sy = forward ? rseg.y0 : rseg.y1;
    const ex = forward ? rseg.x1 : rseg.x0;
    const ey = forward ? rseg.y1 : rseg.y0;

    if (sx === ex && sy === ey) {
      parts.push(roundedRectPath(sx - half, sy - half, thickness, thickness, cap));
      continue;
    }

    if (sy === ey) {
      const left  = Math.min(sx, ex) - half;
      const right = Math.max(sx, ex) + half;

      parts.push(roundedRectPath(left, sy - half, right - left, thickness, cap));
      continue;
    }

    if (sx === ex) {
      const top = Math.min(sy, ey) - half;
      const bot = Math.max(sy, ey) + half;

      parts.push(roundedRectPath(sx - half, top, thickness, bot - top, cap));
    }
  }

  return parts.join(" ");

  function roundedRectPath(x, y, w, h, r) {
    x = q(x);
    y = q(y);
    w = q(w);
    h = q(h);
    r = q(Math.max(0, Math.min(r, w / 2, h / 2)));

    if (!r) return `M${x} ${y}h${w}v${h}h${-w}z`;

    return `M${x + r} ${y}` +
      `h${q(w - 2 * r)}` +
      `a${r} ${r} 0 0 1 ${r} ${r}` +
      `v${q(h - 2 * r)}` +
      `a${r} ${r} 0 0 1 ${-r} ${r}` +
      `h${q(2 * r - w)}` +
      `a${r} ${r} 0 0 1 ${-r} ${-r}` +
      `v${q(2 * r - h)}` +
      `a${r} ${r} 0 0 1 ${r} ${-r}` +
      `z`;
  }
}




function runsToSVGPath(group) {
  let d = '';
  let cx = null, cy = null;
  let lastCmd = null;

  for (const { run: r, from } of group) {
    const horiz = r.y0 === r.y1;

    const forward = (from[0] === r.x0 && from[1] === r.y0);
    const sx = forward ? r.x0 : r.x1;
    const sy = forward ? r.y0 : r.y1;
    const ex = forward ? r.x1 : r.x0;
    const ey = forward ? r.y1 : r.y0;

    if (cx !== sx || cy !== sy) {
      d += `M ${sx} ${sy} `;
      lastCmd = null;
    }

    if (horiz) {
      const len = ex - sx; // center-to-center delta
      if (lastCmd === 'h') d += `${len} `;
      else { d += `h ${len} `; lastCmd = 'h'; }
    } else {
      const len = ey - sy;
      if (lastCmd === 'v') d += `${len} `;
      else { d += `v ${len} `; lastCmd = 'v'; }
    }

    cx = ex;
    cy = ey;
  }

  return d.trim();
}


// extract_runs, greedy_runs, order_runs_pen_down


export function extractRuns(shape) {
  const pixelSet = new Set( shape.map(([x, y]) => `${x},${y}`) )
  const rows = [];
  const cols = [];

  // horizontal
  for (const [x, y] of shape) {
    if (!pixelSet.has(`${x - 1},${y}`)) {
      let x1 = x;
      while (pixelSet.has(`${x1 + 1},${y}`)) {
        x1++;
      }

      const len = x1 - x + 1;
      if (len >= 2) {
        rows.push({ x0: x, y0: y, x1, y1: y, length: len });
      }
    }
  }
  // vertical
  for (const [x, y] of shape) {
    if (!pixelSet.has(`${x},${y - 1}`)) {
      let y1 = y;
      while (pixelSet.has(`${x},${y1 + 1}`)) {
        y1++;
      }
      const len = y1 - y + 1;
      if (len >= 2) {
        cols.push({ x0: x, y0: y, x1: x, y1, length: len });
      }
    }
  }

  return { rows, cols };
}

export function greedyRuns({ rows, cols }, pixels) {
  const runs = rows.concat(cols);
  const covered = new Set();
  const total = pixels.length;
  const solution = [];

  const key = (x, y) => `${x},${y}`;

  function* runPixels(r) {
    if (r.y0 === r.y1) {
      for (let x = r.x0; x <= r.x1; x++) yield key(x, r.y0);
    } else {
      for (let y = r.y0; y <= r.y1; y++) yield key(r.x0, y);
    }
  }

  while (covered.size < total) {
    let best = null;
    let bestScore = -1;

    for (const r of runs) {
      let uncovered = 0;
      let overlap = 0;

      for (const p of runPixels(r)) {
        if (covered.has(p)) overlap = 1;
        else uncovered++;
      }

      if (!uncovered) continue;

      const score = uncovered * 100 + overlap * 10 + r.length;// + Math.random();
      if (score > bestScore) {
        bestScore = score;
        best = r;
      }
    }

    solution.push(best);
    for (const p of runPixels(best)) covered.add(p);
  }

  return solution;
}


export function orderRunsPenDown(runs) {
  const unused = new Set(runs);
  const groups = [];

  const ends = (r) => [[r.x0, r.y0], [r.x1, r.y1]];

  while (unused.size) {
    const group = [];
    let first = unused.values().next().value;
    unused.delete(first);

    let [a, b] = ends(first);
    let cx = b[0], cy = b[1];
    group.push({ run: first, from: a });

    while (true) {
      let best = null;
      let bestDist = Infinity;

      for (const r of unused) {
        if (!runsTouch(first, r)) continue;

        const [e0, e1] = ends(r);

        // allow same-point overlap (dist 0) or edge-adjacent (dist 1)
        const d0 = Math.abs(cx - e0[0]) + Math.abs(cy - e0[1]);
        const d1 = Math.abs(cx - e1[0]) + Math.abs(cy - e1[1]);

        if (d0 < bestDist) { bestDist = d0; best = { run: r, from: e0, to: e1 }; }
        if (d1 < bestDist) { bestDist = d1; best = { run: r, from: e1, to: e0 }; }
      }

      if (!best || bestDist > 1) break;

      unused.delete(best.run);
      group.push({ run: best.run, from: best.from });
      first = best.run;
      cx = best.to[0]; cy = best.to[1];
    }

    groups.push(group);
  }

  return groups;
}


function runsTouch(a, b) {
  // horizontal + horizontal
  if (a.y0 === a.y1 && b.y0 === b.y1) {
    return Math.abs(a.y0 - b.y0) === 1 &&
           !(a.x1 < b.x0 || b.x1 < a.x0);
  }

  // vertical + vertical
  if (a.x0 === a.x1 && b.x0 === b.x1) {
    return Math.abs(a.x0 - b.x0) === 1 &&
           !(a.y1 < b.y0 || b.y1 < a.y0);
  }

  // horizontal + vertical
  const h = a.y0 === a.y1 ? a : b;
  const v = a.x0 === a.x1 ? a : b;

  return (
    v.x0 >= h.x0 && v.x0 <= h.x1 &&
    h.y0 >= v.y0 && h.y0 <= v.y1 &&
    (Math.abs(v.x0 - h.x0) <= 1 || Math.abs(h.y0 - v.y0) <= 1)
  );
}
