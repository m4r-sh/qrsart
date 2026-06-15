
import { Grid } from "../../grid"
import { findFits } from "./findFits"

export function packShapes(grid, shapes){
  const { fits } = findFits(grid, shapes).cache
  const { header, columns } = buildDLXMatrix(grid, fits)
  let col = header.right;
  let node = col.down;
  for (let i = 0; i < 10; i++) {
    if (node === col) break;
    node = node.down;
  }
  const { score, valid_fits } = runSolveDLX(header, columns)
  let used = new Grid(grid.w,grid.h)
  let placements = []
  valid_fits.forEach(fit_idx => {
    let { shape, coords } = fits[fit_idx]
    shape.points.forEach(([px,py]) => {
      used.set(coords.x + px, coords.y + py,1)
    })
    placements.push({ shape, coords })
  })
  return {
    scores: {
      num_placements: score,
    },
    cache: {
      used,
      unused: Grid.erase(grid, used),
      placements
    }
  }
}

// Build the DLX matrix
function buildDLXMatrix(grid, fits) {
  const blackSquares = [];
  for (let y = 0; y < grid.h; y++) {
    for (let x = 0; x < grid.w; x++) {
      if (grid.get(x, y)) {
        blackSquares.push([x, y]);
      }
    }
  }

  const header = new DLXNode();
  const columnHeaders = blackSquares.map(([x, y]) => new ColumnHeader([x, y]));
  if (columnHeaders.length > 0) {
    // Link columns
    for (let i = 0; i < columnHeaders.length; i++) {
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
 const columns = new Map(columnHeaders.map(col => [`${col.id[0]},${col.id[1]}`, col]));

  // Create rows (one per valid placement)
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
    const rowNodes = columnNodes.map(() => new DLXNode()); // Create row nodes
    columnNodes.forEach((col, idx) => {
      const node = rowNodes[idx];
      node.column = col;
      node.rowId = rowIdx;
  
      // Vertical linking
      node.down = col.down;
      node.up = col;
      col.down.up = node;
      col.down = node;
      col.size++;
  
      // Horizontal linking among row nodes
      node.right = rowNodes[(idx + 1) % rowNodes.length];
      node.left = rowNodes[(idx - 1 + rowNodes.length) % rowNodes.length];
    });
    // Fix circular links after setting all pointers
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


/*---------------*/
/*----- DLX -----*/
/*---------------*/

// DLX Node class for the doubly-linked list structure
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

// Column header for DLX
class ColumnHeader extends DLXNode {
  constructor(id) {
    super();
    this.size = 0; // Number of 1s in the column
    this.id = id; // Grid position [x, y]
  }
}

function solveDLX(header, columns, solution = [], best = { score: 0, valid_fits: [] }, depth = 0, coveredSet = new Set()) {

  // Update best solution if current is better
  if (solution.length > best.score) {
    best.score = solution.length;
    best.valid_fits = [...solution];
  }

  // Base case: all columns covered
  if (header.right === header) {
    return best;
  }

  // Stop if we've tried more rows than columns
  if (depth >= columns) {
    return best;
  }

  let chosenCol = null;
  let minSize = Infinity;
  for (let col = header.right; col !== header; col = col.right) {
    if (col.size < minSize && col.size > 0) {
      minSize = col.size;
      chosenCol = col;
    }
  }

  // No columns left to cover with size > 0, return best (maximum cover reached)
  if (!chosenCol || minSize === 0) {
    // Force exit by throwing a custom signal (or modify to return a special object if preferred)
    throw { done: true, result: best };
  }

  cover(chosenCol);
  coveredSet.add(chosenCol.id.join(','));
  for (let r = chosenCol.down; r !== chosenCol; r = r.down) {
    solution.push(r.rowId);
    const coveredCols = [];
    for (let j = r.right; j !== r; j = j.right) {
      if (!coveredSet.has(j.column.id.join(','))) {
        coveredCols.push(j.column);
        cover(j.column);
        coveredSet.add(j.column.id.join(','));
      }
    }
    solveDLX(header, columns, solution, best, depth + 1, coveredSet);
    solution.pop();
    while (coveredCols.length) {
      let col = coveredCols.pop();
      uncover(col);
      coveredSet.delete(col.id.join(','));
    }
  }
  uncover(chosenCol);
  coveredSet.delete(chosenCol.id.join(','));
  return best;
}

// Wrap the call to catch the exit signal
function runSolveDLX(header, columns) {
  try {
    return solveDLX(header, columns);
  } catch (e) {
    if (e.done) {
      return e.result;
    }
    throw e; // Re-throw if it's a real error
  }
}


function cover(column) {
  column.right.left = column.left;
  column.left.right = column.right;
  for (let i = column.down; i !== column; i = i.down) {
    for (let j = i.right; j !== i; j = j.right) {
      j.down.up = j.up;
      j.up.down = j.down;
      j.column.size--;
    }
  }
}

function uncover(column) {
  for (let i = column.up; i !== column; i = i.up) {
    for (let j = i.left; j !== i; j = j.left) {
      j.column.size++;
      j.down.up = j;
      j.up.down = j;
    }
  }
  column.right.left = column;
  column.left.right = column;
}
