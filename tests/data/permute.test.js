import {
  bitcoinData,
  emailData,
  ethereumData,
  eventData,
  formatData,
  geoData,
  phoneData,
  smsData,
  urlData,
  vcardData,
  wifiData,
} from '../../src/index'
import { describe, expect, test } from 'bun:test';

describe('data type instances', () => {
  test('phone()', () => {
    const p = phoneData({ number: '5559992222', countryCode: 1 })

    expect(p.toString()).toBe('tel:+15559992222')
    expect(`${p}`).toBe(p.toString())
    
    let count = 0
    for(let data of p.permute({validSpacers: ['-'], groupings: [[3, 3, 4]]})){
      count++
    }
    expect(count).toBe(8)
  });

  test('sms()', () => {
    const p = smsData({ number: '5559992222', countryCode: 1, message: 'Hello There' })

    expect(p.toString()).toBe('sms:+15559992222?body=Hello%20There')
    expect(`${p}`).toBe(p.toString())
    
    let count = 0
    for(let data of p.permute({validSpacers: ['-'], groupings: [[3, 3, 4]]})){
      count++
    }
    expect(count).toBe(8)
  });

  test('url()', () => {
    const p = urlData({ url: 'https://qrs.art' })

    expect(p.toString()).toBe('HTTPS://QRS.ART')
    expect(`${p}`).toBe(p.toString())
    
    let count = 0
    for(let data of p.permute({protocolCaps: true })){
      count++
    }
    expect(count).toBe(64)
  });

  test('wifi()', () => {
    const p = wifiData({ ssid: 'GuestNet', pass: '123456' })

    expect(p.toString()).toBe('WIFI:T:WPA;S:GuestNet;P:"123456";;')
    expect(`${p}`).toBe(p.toString())
    
    let count = 0
    for(let data of p.permute({ ordering: true })){
      count++
    }
    expect(count).toBe(6)
  });

  test('email()', () => {
    const p = emailData( { to: 'dev@qrs.art', subject: 'Email', cc: 'records@qrs.art' })

    expect(p.toString()).toBe('mailto:dev@QRS.ART?subject=Email&cc=records%40QRS.ART')
    expect(`${p}`).toBe(p.toString())
    
    let count = 0
    for(let data of p.permute({ queryOrdering: true, prefixCaps: true })){
      count++
    }
    expect(count).toBe(4)
  });

  test('geo()', () => {
    const p = geoData( { latitude: 38.71514, longitude: 115.4411398, altitude: 731 })

    expect(p.toString()).toBe('geo:38.71514,115.44114,731')
    expect(`${p}`).toBe(p.toString())
    
    let count = 0
    for(let data of p.permute({ prefixCaps: true })){
      count++
    }
    expect(count).toBe(8)
  });

  test('formatData()', () => {
    expect(formatData('url',{ url: 'https://qrs.art/' }))
      .toBe('HTTPS://QRS.ART')
    expect(formatData('sms',{ number: '8882224444', countryCode: 1, message: 'Sign Up'}))
      .toBe('sms:+18882224444?body=Sign%20Up')
    expect(formatData('phone',{ number: '8882224444', countryCode: 1, extension: '12' }))
      .toBe('tel:+18882224444;ext=12')
    expect(formatData('wifi', { ssid: 'Guests', pass: 'My;Pass', type: 'WPA' }))
      .toBe('WIFI:T:WPA;S:Guests;P:"My\\;Pass";;')
    expect(formatData('email', { to: 'dev@qrs.art', subject: 'Parse' }))
      .toBe('mailto:dev@QRS.ART?subject=Parse')
    expect(formatData('geo', { latitude: 38.71514, longitude: 115.4411398, altitude: 731 }))
      .toBe('geo:38.71514,115.44114,731')
  })

  test('single-value fallback permutations return formatted data', () => {
    const examples = [
      bitcoinData({
        address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
        amount: 0.1,
      }),
      ethereumData({
        address: '0xfb6916095ca1df60bb79Ce92ce3ea74c37c5d359',
        chainId: 1,
        amount: 0.1,
      }),
      vcardData({
        fullName: 'm4rsh',
        emails: [{ value: 'me@m4r.sh', type: 'work' }],
      }),
    ];

    for (const data of examples) {
      const permutations = data.permute();

      expect(permutations.total).toBe(1);
      expect(permutations.get(0)).toBe(data.toString());
    }
  });

  test('event fallback permutation is not empty', () => {
    const event = eventData({
      uid: 'event@example.com',
      dtstamp: '2026-06-01T00:00:00Z',
      summary: 'Launch',
      start: '2026-06-09T12:00:00Z',
      end: '2026-06-09T13:00:00Z',
    });

    const permutations = event.permute();
    const first = permutations.get(0);

    expect(permutations.total).toBe(1);
    expect(first).toContain('BEGIN:VCALENDAR');
    expect(first).toContain('DTSTAMP:20260601T000000Z');
    expect(first).toContain('SUMMARY:Launch');
    expect(first).not.toBe('');
  });

  test('event dtstamp accepts a Date for deterministic formatting', () => {
    const event = eventData({
      uid: 'event@example.com',
      dtstamp: new Date('2026-06-01T00:00:00Z'),
      summary: 'Launch',
      start: '2026-06-09T12:00:00Z',
    });

    expect(event.toString()).toContain('DTSTAMP:20260601T000000Z');
    expect(event.permute().get(0)).toContain('DTSTAMP:20260601T000000Z');
  });

  test('event derives deterministic uid by default', () => {
    const value = {
      dtstamp: '2026-06-01T00:00:00Z',
      summary: 'Launch',
      start: '2026-06-09T12:00:00Z',
      location: 'Studio',
    };

    const first = eventData(value).toString();
    const second = eventData(value).toString();

    expect(first).toBe(second);
    expect(first).toContain('UID:event-');
    expect(first).toContain('@QRS.ART');
  });

  test('vcard uid and rev can be deterministic', () => {
    const card = vcardData({
      fullName: 'm4rsh',
      uid: 'contact@m4r.sh',
      rev: new Date('2026-06-01T00:00:00Z'),
    });

    expect(card.toString()).toContain('UID:contact@m4r.sh');
    expect(card.toString()).toContain('REV:20260601T000000Z');
  });
});
