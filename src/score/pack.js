import { Grid } from "../../src/Grid"
import { findFits } from "./fits"
import { runSolveDLX, solveDLX, DLXNode, ColumnHeader } from "./DLX"

export function packShapes(grid, shapes){
  const fits = findFits(grid, shapes)
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
  let unused = Grid.erase(grid,used)
  return { score, placements, used, unused }
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

  // Create column headers (one per black square)
  // const header = new DLXNode(); // Root node
  // let prev = header;
  // const columns = new Map();
  // blackSquares.forEach(([x, y], idx) => {
  //   const col = new ColumnHeader([x, y]);
  //   col.right = header;
  //   col.left = prev;
  //   prev.right = col;
  //   prev = col;
  //   columns.set(`${x},${y}`, col);
  // });
  // header.left = prev;

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

  // Link nodes
  // matrix.forEach(({ rowIdx, nodes }) => {
  //   nodes.forEach((col, idx) => {
  //     const node = new DLXNode();
  //     node.column = col;
  //     node.rowId = rowIdx;

  //     // Vertical linking
  //     node.down = col.down;
  //     node.up = col;
  //     col.down.up = node;
  //     col.down = node;
  //     col.size++;

  //     // Horizontal linking
  //     node.right = nodes[(idx + 1) % nodes.length];
  //     node.left = nodes[(idx - 1 + nodes.length) % nodes.length];
  //     node.right.left = node;
  //     node.left.right = node;
  //   });
  // });

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
