export class PixelGrid {
    static combine(...grids: any[]): PixelGrid;
    constructor(w: any, h: any);
    arr: Uint8Array;
    used: Uint8Array;
    w: any;
    h: any;
    setPixel(x?: number, y?: number, v?: number): void;
    getPixel(x?: number, y?: number): number;
    usedPixel(x?: number, y?: number): number;
}
