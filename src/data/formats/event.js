import { permute_casing, permute_group, formatDateForICal, escapeValue } from "../DataType";
import { permute as permute_phone } from "./phone";

export function valueSchema(){
  return {
    description: "Event information based on VEvent spec for iCal links in QR codes",
    examples: [
      {
        summary: "Team Meeting",
        description: "Discuss project updates",
        location: "Conference Room A",
        start: "2025-08-15T10:00:00Z",
        end: "2025-08-15T11:00:00Z",
        url: "https://example.com/meeting",
        organizer: "mailto:organizer@example.com",
        geo: {latitude: 37.7749, longitude: -122.4194},
        categories: ["work", "meeting"],
        status: "CONFIRMED",
        uid: "team-meeting@example.com",
        dtstamp: "2025-08-01T12:00:00Z"
      }
    ],
    type: "object",
    properties: {
      summary: {type: "string"},
      description: {type: "string"},
      location: {type: "string"},
      start: {description: "ISO 8601 date-time or date", type: "string"},
      end: {
        description: "ISO 8601 date-time or date (mutually exclusive with duration)",
        type: "string"
      },
      duration: {description: "ISO 8601 duration (mutually exclusive with end)", type: "string"},
      url: {type: "string"},
      organizer: {description: "Email or CAL-ADDRESS format", type: "string"},
      geo: {
        type: "object",
        properties: {
          latitude: {minimum: -90, maximum: 90, type: "number"},
          longitude: {minimum: -180, maximum: 180, type: "number"}
        },
        additionalProperties: false,
        required: ["latitude", "longitude"]
      },
      categories: {type: "array", items: {type: "string"}},
      status: {"enum": ["TENTATIVE", "CONFIRMED", "CANCELLED"]},
      uid: {
        description: "Unique ID for this event. Omit for a deterministic ID derived from the event values, pass a string to set it manually, or pass `true` to generate a UUID.",
        oneOf: [{type: "string"}, {type: "boolean"}],
        tsType: "string | boolean"
      },
      dtstamp: {
        description: "ISO 8601 date-time for the iCalendar DTSTAMP field. Defaults to the current time.",
        type: "string",
        tsType: "string | Date"
      }
    },
    additionalProperties: false,
    required: ["summary", "start"]
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
export function format(event) {
  let lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//QRSART',
    'BEGIN:VEVENT',
  ];

  lines.push(`UID:${eventUID(event)}`);
  lines.push(`DTSTAMP:${formatDateTimeForICal(event.dtstamp || new Date())}`);

  // Summary (mandatory in schema)
  lines.push(`SUMMARY:${escapeValue(event.summary)}`);

  // Start (DTSTART)
  let dtstart = formatDateForICal(event.start);
  if (!event.start.includes('T')) dtstart = `;VALUE=DATE:${dtstart}`;
  else dtstart = `:${dtstart}`;
  lines.push(`DTSTART${dtstart}`);

  // End or Duration (mutually exclusive)
  if (event.end) {
    let dtend = formatDateForICal(event.end);
    if (!event.end.includes('T')) dtend = `;VALUE=DATE:${dtend}`;
    else dtend = `:${dtend}`;
    lines.push(`DTEND${dtend}`);
  } else if (event.duration) {
    lines.push(`DURATION:${event.duration}`);
  }

  // Other fields
  if (event.description) lines.push(`DESCRIPTION:${escapeValue(event.description)}`);
  if (event.location) lines.push(`LOCATION:${escapeValue(event.location)}`);
  if (event.url) lines.push(`URL:${escapeValue(event.url)}`);
  if (event.organizer) lines.push(`ORGANIZER:${escapeValue(event.organizer)}`);
  if (event.geo) lines.push(`GEO:${event.geo.latitude};${event.geo.longitude}`);
  if (event.categories) lines.push(`CATEGORIES:${event.categories.map(escapeValue).join(',')}`);
  if (event.status) lines.push(`STATUS:${event.status}`);

  lines.push('END:VEVENT', 'END:VCALENDAR');
  return lines.join('\n');
}

function formatDateTimeForICal(date) {
  if (date instanceof Date) date = date.toISOString();
  return `${date}`.replace(/[-:]/g, '').slice(0, 15) + 'Z';
}

function eventUID(event) {
  if (event.uid === true) return `${crypto.randomUUID()}@QRS.ART`;
  if (event.uid) return escapeValue(`${event.uid}`);

  const identity = [
    event.summary,
    event.start,
    event.end || event.duration,
    event.location,
    event.url,
  ].filter(Boolean).join('|');

  return `event-${fnv1a(identity)}@QRS.ART`;
}

function fnv1a(value) {
  let hash = 0x811c9dc5;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}


export function preview(value){
  return "Event"
}

// Source: Heroicons calendar, 20 solid.
// https://github.com/tailwindlabs/heroicons/blob/master/optimized/20/solid/calendar.svg
export function icon(){
  return {
    d: [
      `M5.75 2c.411 0 .75.339.75.75V4h7V2.75c0-.411.339-.75.75-.75s.75.339.75.75V4h.25A2.763 2.763 0 0 1 18 6.75v8.5A2.763 2.763 0 0 1 15.25 18H4.75A2.763 2.763 0 0 1 2 15.25v-8.5A2.763 2.763 0 0 1 4.75 4H5V2.75c0-.411.339-.75.75-.75Zm-1 5.5c-.69 0-1.25.56-1.25 1.25v6.5c0 .69.56 1.25 1.25 1.25h10.5c.69 0 1.25-.56 1.25-1.25v-6.5c0-.69-.56-1.25-1.25-1.25H4.75Z`
    ],
    scale: (1/20)
  }
}
