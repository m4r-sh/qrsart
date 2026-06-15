import { Grid } from './Grid';
import { encodeQRString, decodeQRString } from '../utils';
import { drawFinderGrid, drawTimingGrid, drawAlignmentGrid, drawVersionGrid, getFunctionalGrid, drawFormatGrid, drawDataGrid, getMaskGrid } from './patterns';

export class QR {
  constructor({ version, ecl, mask, codewords, icon, preview, data }) {
    this.version = version;
    this.ecl = ecl;
    this.codewords = codewords;
    this._mask = mask;
    this.size = this.version * 4 + 17;
    Object.assign(this, { icon, preview, data })
  }

  get mask(){
    return this._mask
  }

  set mask(v){
    if(this._data_grid){ // undo previous mask + xor new mask
      this._data_grid.xor(getMaskGrid(this.version,this._mask))
      this._data_grid.xor(getMaskGrid(this.version,v))
    }
    this._mask = v
  }

  get grid() {
    return Grid.union(this.data_grid, getFunctionalGrid(this.version, this.ecl, this.mask));
  }
  // --- Subgrids ---

  get functional_grid(){ return getFunctionalGrid(this.version, this.ecl, this.mask) }
  get finder_grid(){ return drawFinderGrid(new Grid(this.size)) }
  get timing_grid(){ return drawTimingGrid(new Grid(this.size)) }
  get alignment_grid(){ return drawAlignmentGrid(new Grid(this.size), this.version) }
  get format_grid(){ return drawFormatGrid(new Grid(this.size),this.ecl,this.mask) }
  get version_grid(){ return drawVersionGrid(new Grid(this.size), this.version) }

  get data_grid() {
    if(this._data_grid){ return this._data_grid }
    const data_grid = new Grid(this.size);
    drawDataGrid(data_grid, this.codewords)
    data_grid.xor(getMaskGrid(this.version,this.mask))
    this._data_grid = data_grid
    return data_grid
  }

  get rawdata_grid(){
    return Grid.xor(this.data_grid,getMaskGrid(this.version,this.mask))
  }

  // --- Serialization ---

  clone(){
    return new QR({
      version: this.version,
      ecl: this.ecl,
      mask: this.mask,
      codewords: this.codewords.slice(),
      icon: this.icon,
      preview: this.preview,
      data: this.data
    })
  }

  toBytes() {
    return new Uint8Array([
      this.version & 0xFF,
      ((this.ecl & 0b11) << 3) | ((this.mask & 0b111) << 5),
      ...this.codewords
    ]);
  }

  static fromBytes(bytes) {
    return new QR({
      version: bytes[0],
      ecl: (bytes[1] >> 3) & 0b11,
      mask: (bytes[1] >> 5) & 0b111,
      codewords: bytes.slice(2)
    });
  }
  
  toString() { return encodeQRString(this.toBytes()) }
  toJSON(){ return this.toString() }
  static fromString(str) { return QR.fromBytes(decodeQRString(str)) }
  static fromJSON(str){ return QR.fromString(str) }
}
