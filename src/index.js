import { optimalStrategy, allStrategies, constructCodewords } from "./segments"
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
  let opt = optimalStrategy(data, { minVersion, minEcl, maxEcl, maxVersion })
  return new QRCode({
    mask,
    version: opt.version,
    ecl: opt.ecl,
    codewords: opt.codewords
  })
}

export { 
  QRCode,
  Grid,
  createQR,
  optimalStrategy,
  allStrategies,
  constructCodewords
}