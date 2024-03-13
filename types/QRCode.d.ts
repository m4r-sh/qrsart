export class QRCode {
    constructor({ version, ecl, mask, bitstring, data }?: {
        version?: number;
        ecl?: number;
        mask?: number;
        bitstring?: string;
        data: any;
    });
    version: number;
    ecl: number;
    mask: number;
    bitstring: string;
    data: any;
    get size(): number;
    get functional_grid(): PixelGrid;
    get finder_grid(): PixelGrid;
    get timing_grid(): PixelGrid;
    get alignment_positions(): number[];
    get alignment_grid(): PixelGrid;
    get format_grid(): PixelGrid;
    get version_grid(): PixelGrid;
    get data_grid(): PixelGrid;
    get grid(): PixelGrid;
}
import { PixelGrid } from './PixelGrid.js';
