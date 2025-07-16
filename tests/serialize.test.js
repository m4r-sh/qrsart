import { describe, expect, test } from 'bun:test';
import { QRCode, createQR } from '../src'; // Adjust path as needed

describe('QRCode Serialization', () => {
  test('Generic', () => {
    const qr = createQR('Some data', { version: 5 })

    let qr2 = QRCode.fromString(qr.toString())


    
    expect(qr.version).toBe(qr2.version); 
    expect(qr.size).toBe(qr2.size); 
    expect(qr.ecl).toBe(qr2.ecl); 
    expect(qr.mask).toBe(qr2.mask); 
    expect(qr.codewords).toEqual(qr2.codewords); 
  });


  test('toBytes() produces correct byte array', () => {
    const qr = new QRCode({
      version: 2,
      ecl: 1,
      mask: 3,
      codewords: new Uint8Array([65, 66, 67]) // 'ABC'
    });
    
    const bytes = qr.toBytes();
    expect(bytes[0]).toBe(2); // version
    expect(bytes[1]).toBe((1 << 3) | (3 << 5)); // ecl and mask combined
    expect(bytes[2]).toBe(65); // codewords
    expect(bytes[3]).toBe(66);
    expect(bytes[4]).toBe(67);
    expect(bytes.length).toBe(5);
  });

  test('fromBytes() reconstructs QRCode correctly', () => {
    const bytes = new Uint8Array([3, (2 << 3) | (4 << 5), 1, 2, 3]);
    const qr = QRCode.fromBytes(bytes);
    
    expect(qr.version).toBe(3);
    expect(qr.ecl).toBe(2);
    expect(qr.mask).toBe(4);
    expect(qr.codewords).toEqual(new Uint8Array([1, 2, 3]));
  });

  test('fromString() reconstructs QRCode from base64', () => {
    // Create a test QRCode first
    const original = new QRCode({
      version: 1,
      ecl: 3,
      mask: 7,
      codewords: new Uint8Array([88, 89, 90]) // 'XYZ'
    });
    const b64str = original.toString();
    
    const qr = QRCode.fromString(b64str);
    expect(qr.version).toBe(1);
    expect(qr.ecl).toBe(3);
    expect(qr.mask).toBe(7);
    expect(qr.codewords).toEqual(new Uint8Array([88, 89, 90]));
  });

  test('toBytes() and fromBytes() round trip', () => {
    const original = new QRCode({
      version: 5,
      ecl: 2,
      mask: 1,
      codewords: new Uint8Array([10, 20, 30, 40])
    });
    
    const bytes = original.toBytes();
    const reconstructed = QRCode.fromBytes(bytes);
    
    expect(reconstructed.version).toBe(original.version);
    expect(reconstructed.ecl).toBe(original.ecl);
    expect(reconstructed.mask).toBe(original.mask);
    expect(reconstructed.codewords).toEqual(original.codewords);
  });

  test('toString() and fromString() round trip', () => {
    const original = new QRCode({
      version: 4,
      ecl: 1,
      mask: 2,
      codewords: new Uint8Array([97, 98, 99]) // 'abc'
    });
    
    const str = original.toString();
    const reconstructed = QRCode.fromString(str);
    
    expect(reconstructed.version).toBe(original.version);
    expect(reconstructed.ecl).toBe(original.ecl);
    expect(reconstructed.mask).toBe(original.mask);
    expect(reconstructed.codewords).toEqual(original.codewords);
  });
});