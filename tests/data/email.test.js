import { permute as permute_email } from '../../src/data/formats/email'
import { emailData } from '../../src'
import { describe, expect, test } from 'bun:test';

describe('permute email', () => {

  test('permute_email: { to, subject }', () => {
    const comp = permute_email({ to: 'dev@qrs.art', subject: 'Testing' },{
      prefixCaps: false,
      hostnameCaps: false,
      queryCaps: false,
      queryOrdering: true
    });
    expect(comp.total).toBe(1);
    expect(comp.get(0)).toBe('mailto:dev@QRS.ART?subject=Testing');
  });


  test('emailData', () => {
    let my_email = emailData({ to: 'dev@qrs.art', subject: 'Testing' })
    let num_opts

    num_opts = 0
    for(let _ of my_email){ num_opts++ }
    expect(num_opts).toBe(1)

    num_opts = 0
    for(let _ of my_email.permute({prefixCaps: true})){ num_opts++ }
    expect(num_opts).toBe(2)

    num_opts = 0
    for(let _ of my_email.permute({queryCaps: true})){ num_opts++ }
    expect(num_opts).toBe(128)

  })

  test('permute_email: { to, subject, body, cc, bcc }', () => {
    const comp = permute_email({ to: 'dev@qrs.art', subject: 'Testing', cc: 'tests@qrs.art', bcc: 'other@qrs.art' },{
      prefixCaps: false,
      hostnameCaps: false,
      queryCaps: false,
      queryOrdering: true
    });
    expect(comp.total).toBe(6);
    expect(comp.get(0)).toBe('mailto:dev@QRS.ART?subject=Testing&cc=tests%40QRS.ART&bcc=other%40QRS.ART');
    expect(comp.get(5)).toBe('mailto:dev@QRS.ART?bcc=other%40QRS.ART&cc=tests%40QRS.ART&subject=Testing');
  });

  test('permute_email: { to, subject, cc }', () => {
    const comp = permute_email({ to: 'dev@qrs.art', subject: 'Testing', cc: 'tests@qrs.art' },{
      prefixCaps: true,
      hostnameCaps: false,
      queryCaps: true,
      queryOrdering: true
    });
    expect(comp.get(0)).toBe('MAILTO:dev@QRS.ART?SUBJECT=Testing&CC=tests%40QRS.ART')
    expect(comp.total).toBe(2048);
  });


  test('permute_email: { to, subject, cc }', () => {
    const comp = permute_email({ to: 'dev@qrs.art', subject: 'Testing', cc: 'dev@qrs.art' },{
      prefixCaps: false,
      hostnameCaps: true,
      queryCaps: false,
      queryOrdering: true
    });
    expect(comp.total).toBe(2);
  });

  test('permute_email: { to, subject, cc }', () => {
    const comp = permute_email({ 
      to: 'dev@qrs.art',
      subject: 'Docs Test',
      body: 'hello',
      cc: 'test@qrs.art'
    },{
      hostnameCaps: true,
      queryOrdering: true
    });
    expect(comp.total).toBe(6);
  });
});
