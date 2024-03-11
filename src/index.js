import { findVersion } from "./segments.js";
import { QRCode } from "./QRCode.js";
import { PixelGrid } from "./PixelGrid.js";
import { permuteURL, permuteWIFI } from "./permute.js";

function createQR(data,{
  minVersion=1,
  maxVersion=40,
  minEcl='low',
  mask=0
}={}){
  let { version, ecl, bitstring } = findVersion(data, { minVersion, minEcl, maxVersion })
  return new QRCode({
    data,
    version,
    ecl,
    mask,
    bitstring
  })
}

export { 
  QRCode,
  findVersion,
  createQR,
  PixelGrid,
  permuteURL,
  permuteWIFI
}