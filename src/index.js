import { findVersion } from "./segments.js";
import { QRCode } from "./QRCode.js";

function createQR(data,{
  minVersion=1,
  maxVersion=40,
  minEcl='low',
  mask=0
}={}){
  let { version, ecl, bitstring } = findVersion(data, { minVersion, minEcl, maxVersion })
  return new QRCode({
    version,
    ecl,
    mask,
    bitstring
  })
}

export { QRCode, findVersion, createQR }