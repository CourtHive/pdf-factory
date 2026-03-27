export function participantName(participant: any): string {
  if (!participant) return '';

  if (participant.person) {
    const { standardFamilyName, standardGivenName } = participant.person;
    if (standardFamilyName) {
      return `${standardFamilyName.toUpperCase()}, ${standardGivenName || ''}`.trim();
    }
  }

  return participant.participantName || '';
}

export function nationality(participant: any): string {
  if (!participant) return '';
  return participant.person?.nationalityCode || '';
}

export function seedDisplay(seedValue: any): string {
  if (!seedValue) return '';
  return `[${seedValue}]`;
}

export function entryStatusDisplay(entryStatus: string): string {
  if (!entryStatus) return '';
  const map: Record<string, string> = {
    DIRECT_ACCEPTANCE: 'DA',
    WILDCARD: 'WC',
    LUCKY_LOSER: 'LL',
    QUALIFIER: 'Q',
    ALTERNATE: 'A',
    SPECIAL_EXEMPT: 'SE',
  };
  return map[entryStatus] || entryStatus;
}

export function formatScore(score: any): string {
  if (!score) return '';
  if (typeof score === 'string') return score;
  if (score.scoreStringSide1) return score.scoreStringSide1;
  return '';
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatTime(timeStr: string): string {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':');
  const hour = parseInt(h);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  let hour12 = hour;
  if (hour === 0) hour12 = 12;
  else if (hour > 12) hour12 = hour - 12;
  return `${hour12}:${m} ${ampm}`;
}

export function eventAbbreviation(eventName: string): string {
  if (!eventName) return '';
  return eventName
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

export function roundName(roundNumber: number, totalRounds: number): string {
  const remaining = totalRounds - roundNumber + 1;
  if (remaining === 1) return 'F';
  if (remaining === 2) return 'SF';
  if (remaining === 3) return 'QF';
  return `R${Math.pow(2, remaining)}`;
}
