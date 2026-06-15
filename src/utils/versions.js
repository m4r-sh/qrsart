import { ECLS } from "./ecls";

export function getNumRawDataModules(version) {
  let result = (16 * version + 128) * version + 64;
  if (version >= 2) {
    const numAlign = Math.floor(version / 7) + 2;
    result -= (25 * numAlign - 10) * numAlign - 55;
    result -= (version >= 7) ? 36 : 0
  }
  return result;
}

export function getNumDataCodewords(version, ecl) {
  return (getNumRawDataModules(version) >> 3) -
      ECLS[ecl].codewords_per_block[version] * ECLS[ecl].num_ecc_blocks[version]
}
