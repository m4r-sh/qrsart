
// DLX Node class for the doubly-linked list structure
export class DLXNode {
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
export class ColumnHeader extends DLXNode {
  constructor(id) {
    super();
    this.size = 0; // Number of 1s in the column
    this.id = id; // Grid position [x, y]
  }
}

export function solveDLX(header, columns, solution = [], best = { score: 0, valid_fits: [] }, depth = 0, coveredSet = new Set()) {

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
export function runSolveDLX(header, columns) {
  try {
    return solveDLX(header, columns);
  } catch (e) {
    if (e.done) {
      return e.result;
    }
    throw e; // Re-throw if it's a real error
  }
}

// Adjust countColumns to count all remaining columns
function countColumns(header) {
  let count = 0;
  let col = header.right;
  while (col !== header && count < 200) {
    count++;
    col = col.right;
  }
  return count;
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


function countColumns(header) {
  let count = 0;
  let col = header.right;
  while (col !== header && count < 100) {
    count++;
    col = col.right;
  }
  return count;
}