/**
 * ─────────────────────────────────────────────────────────────
 *  WEDDING DATA — edit everything in this file to personalise
 *  the invitation. Nothing else in the project needs to change.
 * ─────────────────────────────────────────────────────────────
 */

export const COUPLE = {
  groom: {
    name: 'Arjun',
    fullName: 'Arjun Menon',
    parents: 'Son of Sri. Ravindran Menon & Smt. Lakshmi Menon',
    hometown: 'Thrissur',
  },
  bride: {
    name: 'Meera',
    fullName: 'Meera Nair',
    parents: 'Daughter of Sri. Gopinath Nair & Smt. Sreedevi Nair',
    hometown: 'Palakkad',
  },
  hashtag: '#ArjunWedsMeera',
};

export const WEDDING = {
  /** Shown on cards and the downloadable invitation */
  displayDate: 'Sunday, 24 January 2027',
  malayalamMonth: 'Makaram 1202',
  /** Short date for the gate screen */
  shortDate: '24 · 01 · 2027',
  timezone: 'Asia/Kolkata',
};

export type WeddingEvent = {
  id: string;
  title: string;
  malayalam: string;
  timeLabel: string;
  /** ISO 8601 with offset — used for calendar links */
  start: string;
  end: string;
  venue: string;
  description: string;
};

export const EVENTS: WeddingEvent[] = [
  {
    id: 'muhurtham',
    title: 'Muhurtham',
    malayalam: 'മുഹൂർത്തം',
    timeLabel: '9:15 AM – 9:45 AM',
    start: '2027-01-24T09:15:00+05:30',
    end: '2027-01-24T09:45:00+05:30',
    venue: 'Kalyana Mandapam, Guruvayur Temple East Nada',
    description: 'Thaali kettu in the divine presence of Lord Guruvayurappan.',
  },
  {
    id: 'sadhya',
    title: 'Kalyana Sadhya',
    malayalam: 'കല്യാണ സദ്യ',
    timeLabel: '11:30 AM – 2:30 PM',
    start: '2027-01-24T11:30:00+05:30',
    end: '2027-01-24T14:30:00+05:30',
    venue: 'Sadhya Hall, Guruvayur',
    description: 'A traditional feast served on banana leaf.',
  },
  {
    id: 'reception',
    title: 'Evening Reception',
    malayalam: 'സ്വീകരണം',
    timeLabel: '6:30 PM – 9:30 PM',
    start: '2027-01-24T18:30:00+05:30',
    end: '2027-01-24T21:30:00+05:30',
    venue: 'Reception Hall, Thrissur',
    description: 'An evening of music, blessings and celebration.',
  },
];

export const VENUE = {
  name: 'Sri Krishna Temple, Guruvayur',
  subtitle: 'Kalyana Mandapam · East Nada',
  address: 'East Nada, Guruvayur, Thrissur District, Kerala 680101',
  mapsUrl:
    'https://www.google.com/maps/search/?api=1&query=Guruvayur+Sri+Krishna+Temple+East+Nada',
  mapsEmbedUrl:
    'https://www.google.com/maps?q=Guruvayur+Sri+Krishna+Temple+East+Nada&output=embed',
  note: 'Please arrive 30 minutes before the Muhurtham. Temple dress rules apply inside the temple premises.',
};

export const DRESS_CODE = {
  title: 'Traditional Kerala',
  women: 'Kasavu saree or set-mundu',
  men: 'Kasavu mundu with shirt or jubba',
  note: 'Shades of cream, gold and maroon are warmly welcome.',
};

export const RSVP = {
  /**
   * POST endpoint that accepts JSON (Formspree, Google Apps Script,
   * your own API…). Leave empty to send RSVPs via WhatsApp instead.
   */
  endpoint: '',
  /** WhatsApp number in international format, digits only */
  whatsappNumber: '919999999999',
  deadline: '10 January 2027',
  maxGuests: 6,
};

export const BLESSING = {
  sanskrit: 'ॐ नमो नारायणाय',
  malayalam: 'ഓം നമോ നാരായണായ',
  transliteration: 'Om Namo Narayanaya',
  invocation: 'With the blessings of Lord Guruvayurappan',
  finalBlessing:
    'May the Lord of Guruvayur, who plays the flute of eternal love, bless this union with devotion, harmony and joy for all the years to come.',
  gratitude:
    'Your presence, your prayers and your love mean the world to us. Thank you for walking with us to the feet of Guruvayurappan.',
  signOff: 'With love — Arjun & Meera, and our families',
};

export const AUDIO = {
  /**
   * Optional: URL of a licensed ambient temple track (mp3/ogg in /public).
   * When empty, the site synthesises its own Nadaswaram-style melody,
   * shruti drone, temple bells and chant with the Web Audio API.
   */
  ambientTrackUrl: '',
  volume: 0.55,
};

export const SITE = {
  title: 'Arjun & Meera · Wedding at Guruvayur',
  description:
    'An immersive invitation to the wedding of Arjun & Meera at the Guruvayur Sri Krishna Temple.',
};
