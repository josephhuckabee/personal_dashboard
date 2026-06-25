const monthIndex: Record<string, number> = {
  january: 0, jan: 0, february: 1, feb: 1, march: 2, mar: 2, april: 3, apr: 3, may: 4, june: 5, jun: 5,
  july: 6, jul: 6, august: 7, aug: 7, september: 8, sep: 8, sept: 8, october: 9, oct: 9, november: 10, nov: 10, december: 11, dec: 11,
};

function categoryFor(title: string) {
  const value = title.toLowerCase();
  if (/semester|school|course|class|exam|wgu|study/.test(value)) return 'Education';
  if (/flight|hotel|korea|travel|visa|passport|trip/.test(value)) return 'Travel';
  if (/mover|move|lease|home|apartment|utilities/.test(value)) return 'Home / Logistics';
  if (/doctor|workout|health|dentist|therapy/.test(value)) return 'Health';
  if (/pay|budget|bill|tax|invoice/.test(value)) return 'Finance';
  return 'Personal';
}

function locationFor(title: string) {
  const match = title.match(/\bto\s+([A-Z][A-Za-z\s]+)$/);
  return match?.[1]?.trim() || null;
}

export function parseContextInput(input: string, now = new Date()) {
  const year = now.getFullYear();
  return input.split(/[,;\n]+/).map((part) => part.trim()).filter(Boolean).map((part) => {
    const dateMatch = part.match(/\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t|tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+(\d{1,2})(?:,\s*(\d{4}))?/i);
    const timeMatch = part.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i);
    const cleanTitle = part.replace(dateMatch?.[0] || '', '').replace(timeMatch?.[0] || '', '').trim().replace(/\s+/g, ' ');
    const month = dateMatch ? monthIndex[dateMatch[1].toLowerCase()] : null;
    const day = dateMatch ? Number(dateMatch[2]) : null;
    const eventYear = dateMatch?.[3] ? Number(dateMatch[3]) : year;
    const date = month != null && day ? new Date(Date.UTC(eventYear, month, day)) : null;
    let hour: number | null = null;
    if (timeMatch) {
      hour = Number(timeMatch[1]) % 12;
      if (timeMatch[3].toLowerCase() === 'pm') hour += 12;
    }
    const eventTime = hour == null ? null : `${String(hour).padStart(2, '0')}:${timeMatch?.[2] || '00'}:00`;
    return {
      raw_input: part,
      title: cleanTitle || part,
      event_date: date ? date.toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
      event_time: eventTime,
      category: categoryFor(cleanTitle || part),
      location: locationFor(cleanTitle || part),
      notes: date ? null : 'Date was not clear. Please confirm.',
      confidence_score: date ? 88 : 45,
      needs_confirmation: !date,
    };
  });
}
