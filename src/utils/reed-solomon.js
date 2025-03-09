export function reedSolomonComputeDivisor(degree) {
    if (degree < 1 || degree > 255){ throw new RangeError("Degree out of range") }
    let result = [];
    for (let i = 0; i < degree - 1; i++){
        result.push(0)
    }
    result.push(1);
    let root = 1;
    for (let i = 0; i < degree; i++) {
        for (let j = 0; j < result.length; j++) {
            result[j] = reedSolomonMultiply(result[j], root);
            if (j + 1 < result.length){
                result[j] ^= result[j + 1];
            }
        }
        root = reedSolomonMultiply(root, 0x02);
    }
    return result;
}

export function reedSolomonComputeRemainder(data, divisor) {
  let result = divisor.map(_ => 0);
  for (const b of data) { // Polynomial division
      const factor = b ^ result.shift();
      result.push(0);
      divisor.forEach((coef, i) => result[i] ^= reedSolomonMultiply(coef, factor));
  }
  return result;
}

export function reedSolomonMultiply(x, y) {
    if (x >>> 8 != 0 || y >>> 8 != 0){ throw new RangeError("Byte out of range") }
    // Russian peasant multiplication
    let z = 0;
    for (let i = 7; i >= 0; i--) {
        z = (z << 1) ^ ((z >>> 7) * 0x11D);
        z ^= ((y >>> i) & 1) * x;
    }
    return z;
}