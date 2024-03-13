import { QRCode } from "./QRCode.js";
import { findVersion } from "./segments.js";
export function createQR(data?: string, { minVersion, maxVersion, minEcl, mask }?: {
    minVersion?: number;
    maxVersion?: number;
    minEcl?: string;
    mask?: number;
}): QRCode;
import { PixelGrid } from "./PixelGrid.js";
import { permuteURL } from "./permute.js";
import { permuteWIFI } from "./permute.js";
export { QRCode, findVersion, PixelGrid, permuteURL, permuteWIFI };
