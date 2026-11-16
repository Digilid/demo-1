import type { WeddingEvent } from '@/constants/weddingData';
import { COUPLE } from '@/constants/weddingData';

function toUTCStamp(iso: string) {
  return new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

export function googleCalendarUrl(ev: WeddingEvent) {
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: `${ev.title} · ${COUPLE.groom.name} & ${COUPLE.bride.name}`,
    dates: `${toUTCStamp(ev.start)}/${toUTCStamp(ev.end)}`,
    details: `${ev.description}\n\n${COUPLE.hashtag}`,
    location: ev.venue,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function escapeICS(s: string) {
  return s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

export function downloadICS(ev: WeddingEvent) {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Guruvayur Wedding Invitation//EN',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${ev.id}-${toUTCStamp(ev.start)}@wedding-invite`,
    `DTSTAMP:${toUTCStamp(new Date().toISOString())}`,
    `DTSTART:${toUTCStamp(ev.start)}`,
    `DTEND:${toUTCStamp(ev.end)}`,
    `SUMMARY:${escapeICS(`${ev.title} · ${COUPLE.groom.name} & ${COUPLE.bride.name}`)}`,
    `DESCRIPTION:${escapeICS(ev.description)}`,
    `LOCATION:${escapeICS(ev.venue)}`,
    'BEGIN:VALARM',
    'TRIGGER:-PT2H',
    'ACTION:DISPLAY',
    `DESCRIPTION:${escapeICS(ev.title)}`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ];
  const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${ev.id}.ics`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
