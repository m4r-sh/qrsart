export function findVersion(str: any, { minVersion, maxVersion, minEcl }?: {
    minVersion?: number;
    maxVersion?: number;
    minEcl?: string;
}): {
    version: number;
    ecl: string;
    bitstring: string | any[];
};
export function optimalSegs(str: any, v?: number): {
    steps: any;
    size: number;
};
export function splitIntoSegments(str?: string, steps?: any[]): any[];
