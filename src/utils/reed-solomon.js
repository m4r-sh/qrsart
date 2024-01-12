export function reedSolomonComputeDivisor(degree) {
  if (degree < 1 || degree > 255)
      throw new RangeError("Degree out of range");
  // Polynomial coefficients are stored from highest to lowest power, excluding the leading term which is always 1.
  // For example the polynomial x^3 + 255x^2 + 8x + 93 is stored as the uint8 array [255, 8, 93].
  let result = [];
  for (let i = 0; i < degree - 1; i++)
      result.push(0);
  result.push(1); // Start off with the monomial x^0
  // Compute the product polynomial (x - r^0) * (x - r^1) * (x - r^2) * ... * (x - r^{degree-1}),
  // and drop the highest monomial term which is always 1x^degree.
  // Note that r = 0x02, which is a generator element of this field GF(2^8/0x11D).
  let root = 1;
  for (let i = 0; i < degree; i++) {
      // Multiply the current product by (x - r^i)
      for (let j = 0; j < result.length; j++) {
          result[j] = reedSolomonMultiply(result[j], root);
          if (j + 1 < result.length)
              result[j] ^= result[j + 1];
      }
      root = reedSolomonMultiply(root, 0x02);
  }
  return result;
}
// Returns the Reed-Solomon error correction codeword for the given data and divisor polynomials.
export function reedSolomonComputeRemainder(data, divisor) {
  let result = divisor.map(_ => 0);
  for (const b of data) { // Polynomial division
      const factor = b ^ result.shift();
      result.push(0);
      divisor.forEach((coef, i) => result[i] ^= reedSolomonMultiply(coef, factor));
  }
  return result;
}
// Returns the product of the two given field elements modulo GF(2^8/0x11D). The arguments and result
// are unsigned 8-bit integers. This could be implemented as a lookup table of 256*256 entries of uint8.
export function reedSolomonMultiply(x, y) {
    if (x >>> 8 != 0 || y >>> 8 != 0)
    throw new RangeError("Byte out of range");
    // Russian peasant multiplication
    let z = 0;
    for (let i = 7; i >= 0; i--) {
    z = (z << 1) ^ ((z >>> 7) * 0x11D);
    z ^= ((y >>> i) & 1) * x;
    }
    return z;
}