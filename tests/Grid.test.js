import { test, expect } from 'bun:test';
import { Grid } from '../src/Grid'; 


function createTestGrid(w, h) {
  const grid = new Grid(w, h);
  grid.set(0, 0, 1); 
  grid.set(1, 1, 0); 
  grid.set(2, 2, 1); 
  return grid;
}


test('set and get pixel', () => {
  const grid = new Grid(5, 5);
  grid.set(1, 1, 1);
  expect(grid.get(1, 1)).toBe(1);
  expect(grid.get(0, 0)).toBe(0); 
  grid.set(2, 2, 0);
  expect(grid.get(2, 2)).toBe(0);
});

test('used pixel', () => {
  const grid = new Grid(5, 5);
  grid.set(1, 1, 1);
  expect(grid.used(1, 1)).toBe(1);
  expect(grid.used(0, 0)).toBe(0); 
});

test('out of bounds handling', () => {
  const grid = new Grid(3, 3);
  grid.set(-1, 0, 1); 
  grid.set(3, 0, 1);  
  grid.set(0, -1, 1); 
  grid.set(0, 3, 1);  
  expect(grid.get(-1, 0)).toBe(0);
  expect(grid.get(3, 0)).toBe(0);
  expect(grid.used(-1, 0)).toBe(0);
});

test('tiles iterator', () => {
  const grid = createTestGrid(5, 5);
  const used = [...grid.tiles()];
  expect(used).toEqual([
    [0,0],
    [1,1],
    [2,2],
  ]);
});

test('onTiles iterator', () => {
  const grid = createTestGrid(5, 5);
  const on = [...grid.tiles(true)];
  expect(on).toEqual([
    [0,0],
    [2,2],
  ]);
});

test('offTiles iterator', () => {
  const grid = createTestGrid(5, 5);
  const off = [...grid.tiles(false)];
  expect(off).toEqual([[1,1]]);
});

test('combine grids', () => {
  const g1 = new Grid(3, 3);
  g1.set(0, 0, 1);
  g1.set(1, 1, 0);
  
  const g2 = new Grid(3, 3);
  g2.set(1, 1, 1);
  g2.set(2, 2, 1);

  const combined = Grid.union(g1, g2);
  expect(combined.get(0, 0)).toBe(1);
  expect(combined.get(1, 1)).toBe(1); 
  expect(combined.get(2, 2)).toBe(1);
  expect(combined.used(0, 0)).toBe(1);
  expect(combined.used(1, 1)).toBe(1);
  expect(combined.used(2, 2)).toBe(1);
});


test('benchmark set and get (small dense grid)', async () => {
  const grid = new Grid(100, 100);
  const start = performance.now();
  for (let x = 0; x < 100; x++) {
    for (let y = 0; y < 100; y++) {
      grid.set(x, y, (x + y) % 2);
    }
  }
  const setTime = performance.now() - start;

  let sum = 0;
  const startGet = performance.now();
  for (let x = 0; x < 100; x++) {
    for (let y = 0; y < 100; y++) {
      sum += grid.get(x, y);
    }
  }
  const getTime = performance.now() - startGet;

  console.log(`Set 10,000 pixels: ${setTime.toFixed(2)}ms`);
  console.log(`Get 10,000 pixels: ${getTime.toFixed(2)}ms`);
  expect(sum).toBeGreaterThan(0); 
});

test('benchmark sparse grid iteration', async () => {
  const grid = new Grid(10_000, 10_000);
  
  for (let i = 0; i < 100; i++) {
    const x = Math.floor(Math.random() * 10_000);
    const y = Math.floor(Math.random() * 10_000);
    grid.set(x, y, 1);
  }

  const startOn = performance.now();
  let onCount = 0;
  for (const _ of grid.tiles(true)) onCount++;
  const onTime = performance.now() - startOn;

  const startUsed = performance.now();
  let usedCount = 0;
  for (const _ of grid.tiles()) usedCount++;
  const usedTime = performance.now() - startUsed;

  console.log(`Iterate 100 on pixels (sparse 6_900): ${onTime.toFixed(2)}ms`);
  console.log(`Iterate 100 used pixels (sparse 6_900): ${usedTime.toFixed(2)}ms`);
  expect(onCount).toBe(100);
  expect(usedCount).toBe(100);
});

test('benchmark combine (sparse grids)', async () => {
  const g1 = new Grid(10_000, 10_000);
  const g2 = new Grid(10_000, 10_000);
  
  for (let i = 0; i < 50; i++) {
    g1.set(Math.floor(Math.random() * 10_000), Math.floor(Math.random() * 10_000), 1);
    g2.set(Math.floor(Math.random() * 10_000), Math.floor(Math.random() * 10_000), 1);
  }

  const start = performance.now();
  const combined = Grid.union(g1, g2);
  const combineTime = performance.now() - start;

  let usedCount = 0;
  for (const _ of combined.tiles()) usedCount++;

  console.log(`Combine 2 sparse 6_900 grids (50 pixels each): ${combineTime.toFixed(2)}ms`);
  console.log(`Combined grid has ${usedCount} used pixels`);
  expect(usedCount).toBeGreaterThanOrEqual(50); 
});