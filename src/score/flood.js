import { Grid } from "../Grid";

export function groupTiles(grid, { diagonal = false, value = true } = {}) {
  let visited = new Grid(grid.w,grid.h)
  const shapes = [];

  function floodFill(x, y, shape) {
    if(!grid.used(x,y)){ return }
    if((grid.get(x,y) != value )|| visited.get(x,y)){ return }
    visited.set(x,y,true)
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

  for(let [x,y] of grid.tiles(value)){
    if(!visited.get(x,y)){
      const shape = [];
      floodFill(x, y, shape);
      shapes.push(shape);
    }
  }

  return shapes;
}
export function outlineShape(shape) {
  // Create a Set for fast lookup of shape pixels
  const s = new Set(shape.map(([x, y]) => `${x},${y}`));
  const w = Math.max(...shape.map(xy => xy[0])) + 1;
  const h = Math.max(...shape.map(xy => xy[1])) + 1;

  // Step 1: Generate boundary segments
  const segments = [];

  // Vertical segments
  for (let x = 0; x <= w; x++) {
    for (let y = 0; y < h; y++) {
      const leftInS = x > 0 && s.has(`${x-1},${y}`);
      const rightInS = x < w && s.has(`${x},${y}`);
      if (leftInS !== rightInS) {
        segments.push([x, y, 'v']);
      }
    }
  }

  // Horizontal segments
  for (let y = 0; y <= h; y++) {
    for (let x = 0; x < w; x++) {
      const bottomInS = y > 0 && s.has(`${x},${y-1}`);
      const topInS = y < h && s.has(`${x},${y}`);
      if (bottomInS !== topInS) {
        segments.push([x, y, 'h']);
      }
    }
  }

  // Step 2: Build endpoint-to-segments map
  const endpointToSegments = new Map();
  for (const seg of segments) {
    let p1, p2;
    if (seg[2] === 'v') {
      p1 = [seg[0], seg[1]];
      p2 = [seg[0], seg[1] + 1];
    } else {
      p1 = [seg[0], seg[1]];
      p2 = [seg[0] + 1, seg[1]];
    }
    const key1 = `${p1[0]},${p1[1]}`;
    const key2 = `${p2[0]},${p2[1]}`;
    if (!endpointToSegments.has(key1)) endpointToSegments.set(key1, []);
    if (!endpointToSegments.has(key2)) endpointToSegments.set(key2, []);
    endpointToSegments.get(key1).push(seg);
    endpointToSegments.get(key2).push(seg);
  }

  // Step 3: Trace all closed paths
  const visitedSegments = new Set();
  const paths = [];
  for (const startSeg of segments) {
    if (visitedSegments.has(startSeg)) continue;

    const path = [];
    let currentSeg = startSeg;
    let currentPoint;

    // Start with the first endpoint
    if (currentSeg[2] === 'v') {
      currentPoint = [currentSeg[0], currentSeg[1]];
    } else {
      currentPoint = [currentSeg[0], currentSeg[1]];
    }
    path.push([...currentPoint]);

    // Move to the second endpoint
    if (currentSeg[2] === 'v') {
      currentPoint = [currentSeg[0], currentSeg[1] + 1];
    } else {
      currentPoint = [currentSeg[0] + 1, currentSeg[1]];
    }
    path.push([...currentPoint]);
    visitedSegments.add(currentSeg);

    // Trace the path
    while (true) {
      const key = `${currentPoint[0]},${currentPoint[1]}`;
      const nextSegs = endpointToSegments.get(key).filter(
        (seg) => seg !== currentSeg && !visitedSegments.has(seg)
      );
      if (nextSegs.length === 0) break;
      currentSeg = nextSegs[0];
      visitedSegments.add(currentSeg);

      let nextPoint;
      if (currentSeg[2] === 'v') {
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
      if (nextPoint[0] === path[0][0] && nextPoint[1] === path[0][1]) break;
    }
    paths.push(path);
  }

  // Step 4: Classify paths as outer or holes and set orientation
  function computeSignedArea(path) {
    let area = 0;
    for (let i = 0; i < path.length - 1; i++) {
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

  // Process paths
  const pathsWithStats = paths.map(path => ({
    path,
    signedArea: computeSignedArea(path),
    bbArea: boundingBoxArea(path)
  }));

  // Find the outer path (largest bounding box)
  const outerIdx = pathsWithStats.reduce((maxIdx, curr, idx, arr) => 
    curr.bbArea > arr[maxIdx].bbArea ? idx : maxIdx, 0
  );
  const outerPath = pathsWithStats[outerIdx].path;
  if (pathsWithStats[outerIdx].signedArea < 0) {
    outerPath.reverse(); // Ensure counterclockwise
  }

  // Collect hole paths
  const holePaths = pathsWithStats
    .filter((_, idx) => idx !== outerIdx)
    .map(p => p.path);
  for (let holePath of holePaths) {
    if (computeSignedArea(holePath) > 0) {
      holePath.reverse(); // Ensure clockwise
    }
  }

  // Return outer path followed by holes
  return [outerPath, ...holePaths];
}