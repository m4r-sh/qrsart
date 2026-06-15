import { permute as permute_sms } from '../../src/data/formats/sms'
import { describe, expect, test } from 'bun:test';

describe('permute sms number function', () => {
  test('uses default permutation options when omitted', () => {
    const result = permute_sms({ number: '5558675309', countryCode: '1' });

    expect(result.total).toBe(27);
    expect(result.get(0)).toBe('sms:+15558675309');
  });

  test('handles standard US number with [3,3,4] grouping and multiple spacers', () => {
    const value = { number: '1234567890' };
    const options = {
      validSpacers: ['-', '.'],
      groupings: [[3, 3, 4]]
    };
    const result = permute_sms(value, options);
    
    expect(result.total).toBe(9);
    expect(result.get(0)).toBe('sms:1234567890');
    expect(result.get(1)).toBe('sms:123-4567890');
    expect(result.get(2)).toBe('sms:123.4567890');
    expect(result.get(3)).toBe('sms:123456-7890'); 
    expect(result.get(4)).toBe('sms:123-456-7890'); 
    expect(result.get(5)).toBe('sms:123.456-7890'); 
    expect(result.get(6)).toBe('sms:123456.7890'); 
    expect(result.get(7)).toBe('sms:123-456.7890'); 
    expect(result.get(8)).toBe('sms:123.456.7890');     
  });


  test('handles standard US number with [3,3,4] grouping and country code', () => {
    const value = { number: '1234567890', countryCode: 1 };
    const options = {
      validSpacers: ['-', '.'],
      groupings: [[3, 3, 4]]
    };
    const result = permute_sms(value, options);
    
    expect(result.total).toBe(27);
    expect(result.get(0)).toBe('sms:+11234567890');
    expect(result.get(1)).toBe('sms:+1-1234567890');
    expect(result.get(2)).toBe('sms:+1.1234567890');
    expect(result.get(3)).toBe('sms:+1123-4567890');
    expect(result.get(4)).toBe('sms:+1-123-4567890');
    expect(result.get(5)).toBe('sms:+1.123-4567890'); 
    expect(result.get(6)).toBe('sms:+1123.4567890'); 
    expect(result.get(26)).toBe('sms:+1.123.456.7890');     
  });

  test('handles standard US number with [3,3,4] grouping and country code and message', () => {
    const value = { number: '1234567890', countryCode: 1, message: 'Hello' };
    const options = {
      validSpacers: ['-', '.'],
      groupings: [[3, 3, 4]]
    };
    const result = permute_sms(value, options);
    
    expect(result.total).toBe(27);
    expect(result.get(0)).toBe('sms:+11234567890?body=Hello');
    expect(result.get(1)).toBe('sms:+1-1234567890?body=Hello');
    expect(result.get(2)).toBe('sms:+1.1234567890?body=Hello');
    expect(result.get(3)).toBe('sms:+1123-4567890?body=Hello');
    expect(result.get(4)).toBe('sms:+1-123-4567890?body=Hello');
    expect(result.get(5)).toBe('sms:+1.123-4567890?body=Hello'); 
    expect(result.get(6)).toBe('sms:+1123.4567890?body=Hello'); 
    expect(result.get(26)).toBe('sms:+1.123.456.7890?body=Hello');     
  });

  test('large permutations', () => {
    const value = { number: '1234567890', countryCode: 1, message: 'Hello' };
    const options = {
      validSpacers: ['-', '.'],
      groupings: [
        [3, 3, 2, 2],
      ],
      prefixCaps: true,
      queryCaps: true
    };
    const result = permute_sms(value, options);
    
    expect(result.total).toBe(2592);   
  });

});
