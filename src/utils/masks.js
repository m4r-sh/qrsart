const { floor } = Math
export const MASK_SHAPES = [
  /* 0 */ (x,y) => (x + y) % 2 == 0,
  /* 1 */ (x,y) => y % 2 == 0,
  /* 2 */ (x,y) => x % 3 == 0,
  /* 3 */ (x,y) => (x + y) % 3 == 0,
  /* 4 */ (x,y) => (floor(x / 3) + floor(y / 2)) % 2 == 0,
  /* 5 */ (x,y) => x * y % 2 + x * y % 3 == 0,
  /* 6 */ (x,y) => (x * y % 2 + x * y % 3) % 2 == 0,
  /* 7 */ (x,y) => ((x + y) % 2 + x * y % 3) % 2 == 0,
]