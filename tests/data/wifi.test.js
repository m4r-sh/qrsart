import { allStrategies, minStrategy, optimalStrategy } from '../../dist';
import { permute as permute_wifi } from '../../src/data/formats/wifi'
import { describe, expect, test } from 'bun:test';

describe('permute wifi', () => {
  test('standard wpa with ssid + pass', () => {
    const value = { 
      type: 'WPA',
      ssid: 'Guest Wifi',
      pass: '251902'
    };
    const options = {
      ordering: true,
      prefixCaps: false
    };
    const result = permute_wifi(value, options);
    
    expect(result.total).toBe(6)
    expect(result.get(0)).toBe(`WIFI:T:WPA;S:Guest Wifi;P:"251902";;`)

  });
  test('standard wpa allStrategies', () => {
    const value = { 
      type: 'WPA',
      ssid: 'guest',
      pass: 'superGOOD'
    };
    const options = {
      ordering: true,
      prefixCaps: false
    };
    const result = permute_wifi(value, options);

    expect(optimalStrategy(result.get(0)).version).toBe(2)
    let total_encodings = 0
    for(let strat of allStrategies(result.get(0),2,0)){
      total_encodings++
    }
    expect(total_encodings).toBe(70)
  });
  test('hidden wpa with ssid + pass', () => {
    const value = { 
      type: 'WPA',
      ssid: 'HomeNet',
      pass: 'superstrongpass',
      hidden: true
    };
    const options = {
      ordering: true,
      prefixCaps: false
    };
    const result = permute_wifi(value, options);
    
    expect(result.total).toBe(24)
    expect(result.get(0)).toBe(`WIFI:T:WPA;S:HomeNet;P:superstrongpass;H:true;;`)
  });
  test('hidden nopass with ssid', () => {
    const value = { 
      ssid: 'GuestNet',
      hidden: true
    };
    const options = {
      ordering: true,
      prefixCaps: false
    };
    const result = permute_wifi(value, options);
    
    expect(result.total).toBe(2)
    expect(result.get(0)).toBe(`WIFI:S:GuestNet;H:true;;`)
  });

  test('enterprise eap fields', () => {
    const result = permute_wifi({
      ssid: 'CorpoNet',
      type: 'WPA2-EAP',
      eap: 'PEAP',
      identity: 'me@qrs.art',
      anon: 'anon@qrs.art',
      phase2: 'MSCHAPV2',
      pass: 'S3cret',
    }, { ordering: false });

    expect(result.total).toBe(1)
    expect(result.get(0)).toBe('WIFI:T:WPA2-EAP;S:CorpoNet;P:S3cret;E:PEAP;A:anon@qrs.art;I:me@qrs.art;PH2:MSCHAPV2;;')
  });

  test('optional default fields and prefix casing', () => {
    const result = permute_wifi({
      ssid: 'GuestNet',
      pass: 'superstrongpass',
      type: 'WPA',
    }, {
      ordering: false,
      prefixCaps: true,
      permute_H_false: true,
      permute_R_0: true,
    });

    expect(result.total).toBe(8)
    expect(result.get(0)).toBe('WIFI:T:WPA;S:GuestNet;P:superstrongpass;;')
    expect(result.get(7)).toBe('wifi:T:WPA;S:GuestNet;P:superstrongpass;H:false;R:0;;')
  });
});
