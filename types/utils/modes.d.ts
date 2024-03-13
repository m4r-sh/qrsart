export function appendBits(val: any, len: any, bb: any): void;
export namespace modes {
    namespace numeric {
        let modeBits: number;
        function numCharCountBits(v: any): number;
        function test(x: any): boolean;
        function write(data: any): QRSegment;
        let charCost: number;
    }
    namespace alpha {
        let modeBits_1: number;
        export { modeBits_1 as modeBits };
        export function numCharCountBits_1(v: any): number;
        export { numCharCountBits_1 as numCharCountBits };
        export function test(x: any): boolean;
        export function write(data: any): QRSegment;
    }
    namespace byte {
        let modeBits_2: number;
        export { modeBits_2 as modeBits };
        export function numCharCountBits_2(v: any): number;
        export { numCharCountBits_2 as numCharCountBits };
        export function write(str: any): QRSegment;
    }
}
declare class QRSegment {
    constructor({ mode, numChars, bitData, text }: {
        mode: any;
        numChars: any;
        bitData: any;
        text: any;
    });
    mode: any;
    numChars: any;
    bitData: any;
    text: any;
    getData(): any;
}
export {};
