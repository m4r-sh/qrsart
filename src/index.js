import { findOptimalSegmentation, findAllSegmentations, constructCodewords } from "./segments"
import { QRCode } from "./QRCode"
import { Grid } from "./Grid"

function createQR(data="",{
  minVersion=1,
  maxVersion=40,
  minEcl=0,
  maxEcl=3,
  ecl=null,
  version=null,
  mask=0
}={}){
  if (version) minVersion = maxVersion = version;
  if (ecl) minEcl = maxEcl = ecl;
  let { version, ecl, bitstring } = findOptimalSegmentation(data, { minVersion, minEcl, maxEcl, maxVersion })
  return new QRCode({
    mask,
    version,
    ecl,
    bitstring
  })
}

export { 
  QRCode,
  createQR,
  Grid,
  findOptimalSegmentation,
  findAllSegmentations,
  constructCodewords
}