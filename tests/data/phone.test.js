import { permute as permute_phone } from '../../src/data/formats/phone'
import { describe, expect, test } from 'bun:test';

describe('permute phone number function', () => {
  test('uses default permutation options when omitted', () => {
    const result = permute_phone({ number: '5558675309', countryCode: '1' });

    expect(result.total).toBe(27);
    expect(result.get(0)).toBe('tel:+15558675309');
  });

  test('does not mutate caller-provided spacers', () => {
    const validSpacers = ['-'];
    permute_phone({ number: '5558675309' }, {
      validSpacers,
      groupings: [[3, 3, 4]]
    });

    expect(validSpacers).toEqual(['-']);
  });

  test('handles standard US number with [3,3,4] grouping and multiple spacers', () => {
    const value = { number: '1234567890' };
    const options = {
      validSpacers: ['-', '.'],
      parenGroups: true,
      groupings: [[3, 3, 4]]
    };
    const result = permute_phone(value, options);
    
    expect(result.total).toBe(72);
    expect(result.get(0)).toBe('tel:1234567890'); // No spacers, no parens
    expect(result.get(1)).toBe('tel:123-4567890'); // First spacer as '-'
    expect(result.get(3)).toBe('tel:123456-7890'); // First spacer as '.'
    expect(result.get(9)).toBe('tel:(123)4567890'); // First group with parens
    expect(result.get(27)).toBe('tel:(123)(456)7890'); // Both spacers as '-'
  });


  test('handles smaller grouping size', () => {
    const value = { number: '1234567890' };
    const options = {
      validSpacers: ['-', '.'],
      parenGroups: true,
      groupings: [[3, 3, 2]] // 2 shorter than numbers, auto adds to last group
    };
    const result = permute_phone(value, options);
    
    expect(result.total).toBe(72);
    expect(result.get(0)).toBe('tel:1234567890'); // No spacers, no parens
    expect(result.get(1)).toBe('tel:123-4567890'); // First spacer as '-'
    expect(result.get(3)).toBe('tel:123456-7890'); // First spacer as '.'
    expect(result.get(9)).toBe('tel:(123)4567890'); // First group with parens
    expect(result.get(27)).toBe('tel:(123)(456)7890'); // Both spacers as '-'
  });



  test('handles larger grouping size', () => {
    const value = { number: '1234567890' };
    const options = {
      validSpacers: ['-', '.'],
      parenGroups: true,
      groupings: [[3, 3, 6]] // 2 longer than numbers
    };
    const result = permute_phone(value, options);
    
    expect(result.total).toBe(72);
    expect(result.get(0)).toBe('tel:1234567890'); // No spacers, no parens
    expect(result.get(1)).toBe('tel:123-4567890'); // First spacer as '-'
    expect(result.get(3)).toBe('tel:123456-7890'); // First spacer as '.'
    expect(result.get(9)).toBe('tel:(123)4567890'); // First group with parens
    expect(result.get(27)).toBe('tel:(123)(456)7890'); // Both spacers as '-'
  });


  test('handles number with country code', () => {
    const value = { number: '1234567890', countryCode: 1 };
    const options = {
      validSpacers: ['-'],
      groupings: [[3, 3, 4]]
    };
    const result = permute_phone(value, options);
    
    expect(result.total).toBe(8);
    expect(result.get(0)).toBe('tel:+11234567890');
    expect(result.get(1)).toBe('tel:+1-1234567890');
    expect(result.get(2)).toBe('tel:+1123-4567890');
    expect(result.get(3)).toBe('tel:+1-123-4567890');
    expect(result.get(7)).toBe('tel:+1-123-456-7890');
  });

  test('handles number with extension', () => {
    const value = { number: '1234567890', extension: '123' };
    const options = {
      validSpacers: ['.'],
      groupings: [[3, 3, 4]]
    };
    const result = permute_phone(value, options);
    
    expect(result.total).toBe(4); // 2 spacers (^2) * 1 paren option (^3 groups) = 2^2 * 1 = 4
    expect(result.get(0)).toBe('tel:1234567890;ext=123');
    expect(result.get(1)).toBe('tel:123.4567890;ext=123');
    expect(result.get(2)).toBe('tel:123456.7890;ext=123');
    expect(result.get(3)).toBe('tel:123.456.7890;ext=123');
  });

  test('handles different grouping [5,5]', () => {
    const value = { number: '1234567890' };
    const options = {
      validSpacers: ['-'],
      groupings: [[5, 5]]
    };
    const result = permute_phone(value, options);
    
    expect(result.total).toBe(2); // 2 spacers (^1) * 1 paren option (^2 groups) = 2^1 * 1 = 2
    expect(result.get(0)).toBe('tel:1234567890');
    expect(result.get(1)).toBe('tel:12345-67890');
  });

  test('handles grouping [2,4,4] with parentheses', () => {
    const value = { number: '1234567890' };
    const options = {
      validSpacers: [],
      parenGroups: true,
      groupings: [[2, 4, 4]]
    };
    const result = permute_phone(value, options);
    
    expect(result.total).toBe(8);
    expect(result.get(0)).toBe('tel:1234567890');
    expect(result.get(1)).toBe('tel:(12)34567890');
    expect(result.get(2)).toBe('tel:12(3456)7890');
    expect(result.get(4)).toBe('tel:123456(7890)');
    expect(result.get(5)).toBe('tel:(12)3456(7890)');
    expect(result.get(7)).toBe('tel:(12)(3456)(7890)');
  });

  test('handles single group (no spacers)', () => {
    const value = { number: '12345' };
    const options = {
      validSpacers: ['-', '.'],
      parenGroups: true,
      groupings: [[5]]
    };
    const result = permute_phone(value, options);
    
    expect(result.total).toBe(2); // 0 spacers (^0) * 2 paren options (^1 group) = 1 * 2 = 2
    expect(result.get(0)).toBe('tel:12345');
    expect(result.get(1)).toBe('tel:(12345)');
  });

  test('handles empty spacers', () => {
    const value = { number: '1234567890' };
    const options = {
      validSpacers: [],
      groupings: [[3, 3, 4]]
    };
    const result = permute_phone(value, options);
    
    expect(result.total).toBe(1); // 1 spacer (^2) * 1 paren option (^3 groups) = 1^2 * 1 = 1
    expect(result.get(0)).toBe('tel:1234567890');
  });

  test('throws error for invalid k', () => {
    const value = { number: '1234567890' };
    const options = {
      validSpacers: ['-'],
      groupings: [[3, 3, 4]]
    };
    const result = permute_phone(value, options);
    
    expect(() => result.get(-1)).toThrow();
    expect(() => result.get(4)).toThrow(); // total is 4, so k=4 is out of bounds
  });

  test('handles country code and extension together', () => {
    const value = { number: '1234567890', countryCode: 44, extension: '123' };
    const options = {
      validSpacers: ['-'],
      groupings: [[3, 3, 4]]
    };
    const result = permute_phone(value, options);
    
    expect(result.total).toBe(8);
    expect(result.get(0)).toBe('tel:+441234567890;ext=123');
    expect(result.get(1)).toBe('tel:+44-1234567890;ext=123');
    expect(result.get(2)).toBe('tel:+44123-4567890;ext=123');
    expect(result.get(3)).toBe('tel:+44-123-4567890;ext=123');
    expect(result.get(7)).toBe('tel:+44-123-456-7890;ext=123');
  });

  test('handles multiple groupings with maximum permutations', () => {
    const value = { number: '1234567890' };
    const options = {
      validSpacers: ['-', '.'],
      parenGroups: true,
      groupings: [[3, 3, 4], [5, 5], [3, 3, 2, 2]]
    };
    const result = permute_phone(value, options);
    
    expect(result.total).toBe(516);
    
    let all = [];
    for (let i = 0; i < result.total; i++) {
      all.push(result.get(i));
    }
    
    const plain = 'tel:1234567890';
    const countPlain = all.filter(x => x === plain).length;
    expect(countPlain).toBe(3);
    
    const unique = new Set(all);
    expect(unique.size).toBe(479);
  });
});
