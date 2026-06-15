export function standardPenalty(grid) {
  const size = grid.w;
  const totalModules = size * size;
  const gridData = new Uint8Array(totalModules);
  let darkCount = 0;
  let penalty1 = 0;
  let penalty2 = 0;
  let penalty3 = 0;

  function countFinderPatterns(runHistory) {
    const n = runHistory[1];
    const core =
      n > 0 &&
      runHistory[2] === n &&
      runHistory[3] === n * 3 &&
      runHistory[4] === n &&
      runHistory[5] === n;

    if (!core) return 0;

    let count = 0;
    if (runHistory[0] >= n * 4 && runHistory[6] >= n) count++;
    if (runHistory[6] >= n * 4 && runHistory[0] >= n) count++;
    return count;
  }

  function finderPenaltyForLine(baseIndex, stride) {
    let penalty = 0;
    let runColor = 0;
    let runLength = 0;
    let padding = size;
    let runHistory = [];

    function addHistory(length) {
      runHistory.unshift(length + padding);
      padding = 0;
    }

    for (let i = 0; i < size; i++) {
      const color = gridData[baseIndex + i * stride];
      if (color === runColor) {
        runLength++;
      } else {
        addHistory(runLength);
        if (runColor === 0) {
          penalty += countFinderPatterns(runHistory) * 40;
        }
        runColor = color;
        runLength = 1;
      }
    }

    if (runColor === 1) {
      addHistory(runLength);
      runLength = 0;
    }
    padding = size;
    addHistory(runLength);
    penalty += countFinderPatterns(runHistory) * 40;

    return penalty;
  }

  for (let y = 0; y < size; y++) {
    const rowStart = y * size;

    // Fill row and count dark modules
    for (let x = 0; x < size; x++) {
      const isDark = grid.get(x, y) ? 1 : 0;
      gridData[rowStart + x] = isDark;
      darkCount += isDark;
    }

    // Penalty 1 for this row (adjacent same-color runs)
    let count = 1;
    let prev = gridData[rowStart];
    for (let x = 1; x < size; x++) {
      const curr = gridData[rowStart + x];
      if (curr === prev) {
        count++;
      } else {
        if (count >= 5) {
          penalty1 += count - 2;
        }
        count = 1;
        prev = curr;
      }
    }
    if (count >= 5) {
      penalty1 += count - 2;
    }

    penalty3 += finderPenaltyForLine(rowStart, 1);

    // Penalty 2 (2x2 same-color blocks) using previous row if available
    if (y > 0) {
      const prevRowStart = (y - 1) * size;
      for (let x = 0; x < size - 1; x++) {
        const a = gridData[prevRowStart + x];
        if (
          a === gridData[prevRowStart + x + 1] &&
          a === gridData[rowStart + x] &&
          a === gridData[rowStart + x + 1]
        ) {
          penalty2 += 3;
        }
      }
    }
  }

  // Penalty 1 and 3 for columns
  for (let x = 0; x < size; x++) {
    // Penalty 1 for this column
    let count = 1;
    let prev = gridData[x];
    for (let y = 1; y < size; y++) {
      const curr = gridData[y * size + x];
      if (curr === prev) {
        count++;
      } else {
        if (count >= 5) {
          penalty1 += count - 2;
        }
        count = 1;
        prev = curr;
      }
    }
    if (count >= 5) {
      penalty1 += count - 2;
    }

    penalty3 += finderPenaltyForLine(x, size);
  }

  // Penalty 4: Proportion of dark modules (simplified math)
  const k = Math.floor((darkCount * 20) / totalModules);
  const penalty4 = 10 * Math.min(Math.abs(k - 10), Math.abs(k + 1 - 10));

  return {
    scores: {
      penalty: penalty1 + penalty2 + penalty3 + penalty4
    },
    cache: {
      penalty1, penalty2, penalty3, penalty4
    }
  }
}
