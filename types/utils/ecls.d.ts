export namespace ecls {
    namespace low {
        let formatBits: number;
        let codewords_per_block: number[];
        let num_ecc_blocks: number[];
    }
    namespace medium {
        let formatBits_1: number;
        export { formatBits_1 as formatBits };
        let codewords_per_block_1: number[];
        export { codewords_per_block_1 as codewords_per_block };
        let num_ecc_blocks_1: number[];
        export { num_ecc_blocks_1 as num_ecc_blocks };
    }
    namespace quartile {
        let formatBits_2: number;
        export { formatBits_2 as formatBits };
        let codewords_per_block_2: number[];
        export { codewords_per_block_2 as codewords_per_block };
        let num_ecc_blocks_2: number[];
        export { num_ecc_blocks_2 as num_ecc_blocks };
    }
    namespace high {
        let formatBits_3: number;
        export { formatBits_3 as formatBits };
        let codewords_per_block_3: number[];
        export { codewords_per_block_3 as codewords_per_block };
        let num_ecc_blocks_3: number[];
        export { num_ecc_blocks_3 as num_ecc_blocks };
    }
}
