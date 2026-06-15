import { permute_casing, permute_group, escapeValue } from "../DataType";
import { permute as permute_phone } from "./phone";

export function valueSchema(){
  return {
    description: "Contact information based on vCard spec for scannable QR codes",
    examples: [
      {
        fullName: "John Doe",
        givenName: "John",
        familyName: "Doe",
        organization: "Example Corp",
        title: "Software Engineer",
        phones: [{value: "+1-123-456-7890", type: "work"}],
        emails: [{value: "john.doe@example.com", type: "work"}],
        addresses: [
          {
            street: "123 Main St",
            locality: "Anytown",
            region: "CA",
            postalCode: "12345",
            country: "USA",
            type: "work"
          }
        ],
        url: "https://example.com",
        note: "Met at conference",
        birthday: "1980-01-01"
      }
    ],
    type: "object",
    properties: {
      fullName: {type: "string"},
      givenName: {type: "string"},
      familyName: {type: "string"},
      organization: {type: "string"},
      title: {type: "string"},
      photo: {
        type: "object",
        properties: {type: {"enum": ["JPEG", "PNG", "GIF", "SVG+XML"]}, base64: {type: "string"}},
        additionalProperties: false,
        required: ["type", "base64"]
      },
      phones: {
        type: "array",
        items: {
          type: "object",
          properties: {
            value: {type: "string"},
            type: {"enum": ["home", "work", "mobile", "fax", "other"]}
          },
          additionalProperties: false,
          required: ["value"]
        }
      },
      emails: {
        type: "array",
        items: {
          type: "object",
          properties: {value: {type: "string"}, type: {"enum": ["home", "work", "other"]}},
          additionalProperties: false,
          required: ["value"]
        }
      },
      addresses: {
        type: "array",
        items: {
          type: "object",
          properties: {
            street: {type: "string"},
            locality: {type: "string"},
            region: {type: "string"},
            postalCode: {type: "string"},
            country: {type: "string"},
            type: {"enum": ["home", "work", "other"]}
          },
          additionalProperties: false
        }
      },
      url: {type: "string"},
      note: {type: "string"},
      birthday: {description: "ISO 8601 date", type: "string"},
      uid: {
        description: "Stable contact UID. Use `true` to generate a UUID, or pass a string to keep output deterministic.",
        oneOf: [{type: "string"}, {type: "boolean"}],
        tsType: "string | boolean"
      },
      rev: {
        description: "Revision timestamp. Use `true` for the current time, or pass an ISO date-time string or Date for deterministic output.",
        oneOf: [{type: "string"}, {type: "boolean"}],
        tsType: "string | boolean | Date"
      }
    },
    additionalProperties: false,
    required: ["fullName"]
  }
}

export function permuteSchema(){
  return {examples: [{}], type: "object", properties: {}, additionalProperties: false}
}

export function permute(value={}, options={}) {

  return {
    total: 1,
    get(k){
      return format(value)
    }
  }
}


// @ Grok
// vCard toString() - Converts contact object to vCard 4.0 string
export function format(contact) {
  let lines = ['BEGIN:VCARD', 'VERSION:4.0'];

  // Mandatory FN
  lines.push(`FN:${escapeValue(contact.fullName)}`);

  // Structured name (N)
  if (contact.givenName || contact.familyName) {
    lines.push(`N:${escapeValue(contact.familyName || '')};${escapeValue(contact.givenName || '')};;;`);
  }

  // Organization and Title
  if (contact.organization) lines.push(`ORG:${escapeValue(contact.organization)}`);
  if (contact.title) lines.push(`TITLE:${escapeValue(contact.title)}`);

  // Phones
  if (contact.phones) {
    contact.phones.forEach(phone => {
      const type = phone.type ? `TYPE=${phone.type.toUpperCase()}` : '';
      lines.push(`TEL;${type}:${escapeValue(phone.value)}`);
    });
  }

  // Emails
  if (contact.emails) {
    contact.emails.forEach(email => {
      const type = email.type ? `TYPE=${email.type.toUpperCase()}` : '';
      lines.push(`EMAIL;${type}:${escapeValue(email.value)}`);
    });
  }

  // Photo
  if (contact.photo) {
    lines.push(`PHOTO;ENCODING=b;TYPE=${contact.photo.type.toUpperCase()}:${contact.photo.base64}`)
  }

  // Addresses
  if (contact.addresses) {
    contact.addresses.forEach(addr => {
      const type = addr.type ? `TYPE=${addr.type.toUpperCase()}` : '';
      const street = escapeValue(addr.street || '');
      const locality = escapeValue(addr.locality || '');
      const region = escapeValue(addr.region || '');
      const postal = escapeValue(addr.postalCode || '');
      const country = escapeValue(addr.country || '');
      lines.push(`ADR;${type}:;;${street};${locality};${region};${postal};${country}`);
    });
  }

  // URL, Note, Birthday
  if (contact.url) lines.push(`URL:${escapeValue(contact.url)}`);
  if (contact.note) lines.push(`NOTE:${escapeValue(contact.note)}`);
  if (contact.birthday) lines.push(`BDAY:${contact.birthday.replace(/-/g, '')}`); // YYYYMMDD

  if (contact.uid) {
    const uid = contact.uid === true ? `urn:uuid:${crypto.randomUUID()}` : contact.uid;
    lines.push(`UID:${escapeValue(`${uid}`)}`);
  }

  if (contact.rev) {
    const rev = contact.rev === true ? new Date() : contact.rev;
    lines.push(`REV:${formatDateTimeForVCard(rev)}`);
  }

  lines.push('END:VCARD');
  return lines.join('\n');
}

function formatDateTimeForVCard(date) {
  if (date instanceof Date) date = date.toISOString();
  return `${date}`.replace(/[-:]/g, '').slice(0, 15) + 'Z';
}


export function preview(value){
  return 'Contact' 
}

// Source: Heroicons user-circle, 20 solid.
// https://github.com/tailwindlabs/heroicons/blob/master/optimized/20/solid/user-circle.svg
export function icon(){
  return {
    d: [
      `M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-5.5-2.5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0ZM10 12a5.99 5.99 0 0 0-4.793 2.39A6.483 6.483 0 0 0 10 16.5a6.483 6.483 0 0 0 4.793-2.11A5.99 5.99 0 0 0 10 12Z`
    ],
    scale: (1/20)
  }
}
