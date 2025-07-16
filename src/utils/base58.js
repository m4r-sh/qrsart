const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
const BASE = BigInt(58);

export function base58Encode(bytes) {
  let encoded = '';
  let num = BigInt(0);
  for (let byte of bytes) {
    num = num * BigInt(256) + BigInt(byte);
  }
  while (num > 0) {
    encoded = ALPHABET[Number(num % BASE)] + encoded;
    num = num / BASE;
  }
  return encoded;
}

export function base58Decode(encoded) {
  const charMap = new Map(ALPHABET.split('').map((c, i) => [c, BigInt(i)]));
  let num = BigInt(0);
  for (let char of encoded) {
    const value = charMap.get(char);
    if (value === undefined) throw new Error('Invalid Base58 character');
    num = num * BASE + value;
  }
  const bytes = [];
  while (num > 0) {
    bytes.unshift(Number(num % BigInt(256)));
    num = num / BigInt(256);
  }
  return new Uint8Array(bytes);
}