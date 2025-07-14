// src/Grid.js
class Grid {
  constructor(w, h) {
    this.w = w;
    this.h = h;
    const totalTiles = w * h;
    const wordCount = totalTiles + 31 >> 5;
    this.valueBits = new Uint32Array(wordCount);
    this.usedBits = new Uint32Array(wordCount);
  }
  #getBitPos(x, y) {
    const idx = y * this.w + x;
    return [idx >> 5, idx & 31];
  }
  set(x = 0, y = 0, v = 1) {
    if (x < 0 || x >= this.w || y < 0 || y >= this.h)
      return;
    const [i, s] = this.#getBitPos(x, y);
    const bit = 1 << s;
    if (v & 1)
      this.valueBits[i] |= bit;
    else
      this.valueBits[i] &= ~bit;
    this.usedBits[i] |= bit;
  }
  get(x = 0, y = 0) {
    if (x < 0 || x >= this.w || y < 0 || y >= this.h)
      return 0;
    const [i, s] = this.#getBitPos(x, y);
    const bit = 1 << s;
    return this.valueBits[i] & bit ? 1 : 0;
  }
  used(x = 0, y = 0) {
    if (x < 0 || x >= this.w || y < 0 || y >= this.h)
      return 0;
    const [i, s] = this.#getBitPos(x, y);
    const bit = 1 << s;
    return this.usedBits[i] & bit ? 1 : 0;
  }
  *tiles(onlyOn = null) {
    const { w, h, usedBits, valueBits } = this;
    const totalTiles = w * h;
    const wordCount = usedBits.length;
    for (let i = 0;i < wordCount; i++) {
      const used = usedBits[i];
      if (used === 0)
        continue;
      const values = valueBits[i];
      const baseIdx = i << 5;
      for (let j = 0;j < 32; j++) {
        const idx = baseIdx + j;
        if (idx >= totalTiles)
          break;
        const mask = 1 << j;
        if (!(used & mask))
          continue;
        const isOn = (values & mask) !== 0;
        if (onlyOn == null || !onlyOn == !isOn) {
          yield [idx % w, Math.floor(idx / w)];
        }
      }
    }
  }
  toValueArray() {
    return this.valueBits.slice();
  }
  static union(...grids) {
    const max_w = Math.max(...grids.map((g) => g.w));
    const max_h = Math.max(...grids.map((g) => g.h));
    const result = new Grid(max_w, max_h);
    for (const grid of grids) {
      for (const [x, y] of grid.tiles()) {
        if (!result.get(x, y)) {
          result.set(x, y, grid.get(x, y));
        }
      }
    }
    return result;
  }
  static erase(og, ...grids) {
    const result = new Grid(og.w, og.h);
    for (const [x, y] of og.tiles()) {
      if (!grids.some((g) => g.used(x, y))) {
        result.set(x, y, og.get(x, y));
      }
    }
    return result;
  }
  static intersect(og, ...grids) {
    const result = new Grid(og.w, og.h);
    for (const [x, y] of og.tiles()) {
      if (grids.every((g) => g.used(x, y))) {
        result.set(x, y, og.get(x, y));
      }
    }
    return result;
  }
  static invert(grid) {
    const result = new Grid(grid.w, grid.h);
    for (const [x, y] of grid.tiles()) {
      result.set(x, y, !grid.get(x, y));
    }
    return result;
  }
}

// src/score/fits.js
function findFits(grid, shapes) {
  let sols = [];
  Object.keys(shapes).forEach((k) => {
    let shape = shapes[k];
    for (let [x, y] of grid.tiles()) {
      let is_valid = true;
      try {
        shape.points.forEach(([px, py, v = 1]) => {
          is_valid &= grid.used(x + px, y + py) && grid.get(x + px, y + py) == v;
        });
      } catch (e) {
        is_valid = false;
      }
      if (is_valid) {
        sols.push([k, [x, y]]);
      }
    }
  });
  return sols.map(([k, [x, y]]) => ({ shape: shapes[k], coords: { x, y } }));
}

// src/score/DLX.js
class DLXNode {
  constructor() {
    this.left = this;
    this.right = this;
    this.up = this;
    this.down = this;
    this.column = null;
    this.rowId = null;
  }
}

class ColumnHeader extends DLXNode {
  constructor(id) {
    super();
    this.size = 0;
    this.id = id;
  }
}
function solveDLX(header, columns, solution = [], best = { score: 0, valid_fits: [] }, depth = 0, coveredSet = new Set) {
  if (solution.length > best.score) {
    best.score = solution.length;
    best.valid_fits = [...solution];
  }
  if (header.right === header) {
    return best;
  }
  if (depth >= columns) {
    return best;
  }
  let chosenCol = null;
  let minSize = Infinity;
  for (let col = header.right;col !== header; col = col.right) {
    if (col.size < minSize && col.size > 0) {
      minSize = col.size;
      chosenCol = col;
    }
  }
  if (!chosenCol || minSize === 0) {
    throw { done: true, result: best };
  }
  cover(chosenCol);
  coveredSet.add(chosenCol.id.join(","));
  for (let r = chosenCol.down;r !== chosenCol; r = r.down) {
    solution.push(r.rowId);
    const coveredCols = [];
    for (let j = r.right;j !== r; j = j.right) {
      if (!coveredSet.has(j.column.id.join(","))) {
        coveredCols.push(j.column);
        cover(j.column);
        coveredSet.add(j.column.id.join(","));
      }
    }
    solveDLX(header, columns, solution, best, depth + 1, coveredSet);
    solution.pop();
    while (coveredCols.length) {
      let col = coveredCols.pop();
      uncover(col);
      coveredSet.delete(col.id.join(","));
    }
  }
  uncover(chosenCol);
  coveredSet.delete(chosenCol.id.join(","));
  return best;
}
function runSolveDLX(header, columns) {
  try {
    return solveDLX(header, columns);
  } catch (e) {
    if (e.done) {
      return e.result;
    }
    throw e;
  }
}
function cover(column) {
  column.right.left = column.left;
  column.left.right = column.right;
  for (let i = column.down;i !== column; i = i.down) {
    for (let j = i.right;j !== i; j = j.right) {
      j.down.up = j.up;
      j.up.down = j.down;
      j.column.size--;
    }
  }
}
function uncover(column) {
  for (let i = column.up;i !== column; i = i.up) {
    for (let j = i.left;j !== i; j = j.left) {
      j.column.size++;
      j.down.up = j;
      j.up.down = j;
    }
  }
  column.right.left = column;
  column.left.right = column;
}

// src/score/pack.js
function packShapes(grid, shapes) {
  const fits = findFits(grid, shapes);
  const { header, columns } = buildDLXMatrix(grid, fits);
  let col = header.right;
  let node = col.down;
  for (let i = 0;i < 10; i++) {
    if (node === col)
      break;
    node = node.down;
  }
  const { score, valid_fits } = runSolveDLX(header, columns);
  let used = new Grid(grid.w, grid.h);
  let placements = [];
  valid_fits.forEach((fit_idx) => {
    let { shape, coords } = fits[fit_idx];
    shape.points.forEach(([px, py]) => {
      used.set(coords.x + px, coords.y + py, 1);
    });
    placements.push({ shape, coords });
  });
  let unused = Grid.erase(grid, used);
  return { score, placements, used, unused };
}
function buildDLXMatrix(grid, fits) {
  const blackSquares = [];
  for (let y = 0;y < grid.h; y++) {
    for (let x = 0;x < grid.w; x++) {
      if (grid.get(x, y)) {
        blackSquares.push([x, y]);
      }
    }
  }
  const header = new DLXNode;
  const columnHeaders = blackSquares.map(([x, y]) => new ColumnHeader([x, y]));
  if (columnHeaders.length > 0) {
    for (let i = 0;i < columnHeaders.length; i++) {
      const curr = columnHeaders[i];
      const prev = i === 0 ? header : columnHeaders[i - 1];
      const next = i === columnHeaders.length - 1 ? header : columnHeaders[i + 1];
      curr.left = prev;
      curr.right = next;
      prev.right = curr;
      next.left = curr;
    }
    header.right = columnHeaders[0];
    header.left = columnHeaders[columnHeaders.length - 1];
  }
  const columns = new Map(columnHeaders.map((col2) => [`${col2.id[0]},${col2.id[1]}`, col2]));
  const matrix = [];
  fits.forEach((fit, rowIdx) => {
    const { shape, coords } = fit;
    const row = [];
    shape.points.forEach(([px, py]) => {
      const x = coords.x + px;
      const y = coords.y + py;
      const pos = `${x},${y}`;
      if (columns.has(pos)) {
        row.push(columns.get(pos));
      }
    });
    matrix.push({ rowIdx, nodes: row });
  });
  matrix.forEach(({ rowIdx, nodes: columnNodes }) => {
    const rowNodes = columnNodes.map(() => new DLXNode);
    columnNodes.forEach((col2, idx) => {
      const node = rowNodes[idx];
      node.column = col2;
      node.rowId = rowIdx;
      node.down = col2.down;
      node.up = col2;
      col2.down.up = node;
      col2.down = node;
      col2.size++;
      node.right = rowNodes[(idx + 1) % rowNodes.length];
      node.left = rowNodes[(idx - 1 + rowNodes.length) % rowNodes.length];
    });
    rowNodes.forEach((node, idx) => {
      node.right.left = node;
      node.left.right = node;
    });
  });
  let col = header.right;
  let count = 0;
  while (col !== header && count < blackSquares.length + 1) {
    col = col.right;
    count++;
  }
  return { header, columns: blackSquares.length };
}
// src/score/flood.js
function groupTiles(grid, { diagonal = false, value = true } = {}) {
  let visited = new Grid(grid.w, grid.h);
  const shapes = [];
  function floodFill(x, y, shape) {
    if (!grid.used(x, y)) {
      return;
    }
    if (grid.get(x, y) != value || visited.get(x, y)) {
      return;
    }
    visited.set(x, y, true);
    shape.push([x, y]);
    floodFill(x - 1, y, shape);
    floodFill(x + 1, y, shape);
    floodFill(x, y - 1, shape);
    floodFill(x, y + 1, shape);
    if (diagonal) {
      floodFill(x - 1, y - 1, shape);
      floodFill(x + 1, y - 1, shape);
      floodFill(x - 1, y + 1, shape);
      floodFill(x + 1, y + 1, shape);
    }
  }
  for (let [x, y] of grid.tiles(value)) {
    if (!visited.get(x, y)) {
      const shape = [];
      floodFill(x, y, shape);
      shapes.push(shape);
    }
  }
  return shapes;
}
function outlineShape(shape) {
  const s = new Set(shape.map(([x, y]) => `${x},${y}`));
  const w = Math.max(...shape.map((xy) => xy[0])) + 1;
  const h = Math.max(...shape.map((xy) => xy[1])) + 1;
  const segments = [];
  for (let x = 0;x <= w; x++) {
    for (let y = 0;y < h; y++) {
      const leftInS = x > 0 && s.has(`${x - 1},${y}`);
      const rightInS = x < w && s.has(`${x},${y}`);
      if (leftInS !== rightInS) {
        segments.push([x, y, "v"]);
      }
    }
  }
  for (let y = 0;y <= h; y++) {
    for (let x = 0;x < w; x++) {
      const bottomInS = y > 0 && s.has(`${x},${y - 1}`);
      const topInS = y < h && s.has(`${x},${y}`);
      if (bottomInS !== topInS) {
        segments.push([x, y, "h"]);
      }
    }
  }
  const endpointToSegments = new Map;
  for (const seg of segments) {
    let p1, p2;
    if (seg[2] === "v") {
      p1 = [seg[0], seg[1]];
      p2 = [seg[0], seg[1] + 1];
    } else {
      p1 = [seg[0], seg[1]];
      p2 = [seg[0] + 1, seg[1]];
    }
    const key1 = `${p1[0]},${p1[1]}`;
    const key2 = `${p2[0]},${p2[1]}`;
    if (!endpointToSegments.has(key1))
      endpointToSegments.set(key1, []);
    if (!endpointToSegments.has(key2))
      endpointToSegments.set(key2, []);
    endpointToSegments.get(key1).push(seg);
    endpointToSegments.get(key2).push(seg);
  }
  const visitedSegments = new Set;
  const paths = [];
  for (const startSeg of segments) {
    if (visitedSegments.has(startSeg))
      continue;
    const path = [];
    let currentSeg = startSeg;
    let currentPoint;
    if (currentSeg[2] === "v") {
      currentPoint = [currentSeg[0], currentSeg[1]];
    } else {
      currentPoint = [currentSeg[0], currentSeg[1]];
    }
    path.push([...currentPoint]);
    if (currentSeg[2] === "v") {
      currentPoint = [currentSeg[0], currentSeg[1] + 1];
    } else {
      currentPoint = [currentSeg[0] + 1, currentSeg[1]];
    }
    path.push([...currentPoint]);
    visitedSegments.add(currentSeg);
    while (true) {
      const key = `${currentPoint[0]},${currentPoint[1]}`;
      const nextSegs = endpointToSegments.get(key).filter((seg) => seg !== currentSeg && !visitedSegments.has(seg));
      if (nextSegs.length === 0)
        break;
      currentSeg = nextSegs[0];
      visitedSegments.add(currentSeg);
      let nextPoint;
      if (currentSeg[2] === "v") {
        if (currentPoint[0] === currentSeg[0] && currentPoint[1] === currentSeg[1]) {
          nextPoint = [currentSeg[0], currentSeg[1] + 1];
        } else {
          nextPoint = [currentSeg[0], currentSeg[1]];
        }
      } else {
        if (currentPoint[0] === currentSeg[0] && currentPoint[1] === currentSeg[1]) {
          nextPoint = [currentSeg[0] + 1, currentSeg[1]];
        } else {
          nextPoint = [currentSeg[0], currentSeg[1]];
        }
      }
      path.push([...nextPoint]);
      currentPoint = nextPoint;
      if (nextPoint[0] === path[0][0] && nextPoint[1] === path[0][1])
        break;
    }
    paths.push(path);
  }
  function computeSignedArea(path) {
    let area = 0;
    for (let i = 0;i < path.length - 1; i++) {
      area += path[i][0] * path[i + 1][1] - path[i + 1][0] * path[i][1];
    }
    return area / 2;
  }
  function boundingBoxArea(path) {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const [x, y] of path) {
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
    return (maxX - minX) * (maxY - minY);
  }
  const pathsWithStats = paths.map((path) => ({
    path,
    signedArea: computeSignedArea(path),
    bbArea: boundingBoxArea(path)
  }));
  const outerIdx = pathsWithStats.reduce((maxIdx, curr, idx, arr) => curr.bbArea > arr[maxIdx].bbArea ? idx : maxIdx, 0);
  const outerPath = pathsWithStats[outerIdx].path;
  if (pathsWithStats[outerIdx].signedArea < 0) {
    outerPath.reverse();
  }
  const holePaths = pathsWithStats.filter((_, idx) => idx !== outerIdx).map((p) => p.path);
  for (let holePath of holePaths) {
    if (computeSignedArea(holePath) > 0) {
      holePath.reverse();
    }
  }
  return [outerPath, ...holePaths];
}
export {
  solveDLX,
  packShapes,
  outlineShape,
  groupTiles,
  findFits,
  DLXNode,
  ColumnHeader
};
