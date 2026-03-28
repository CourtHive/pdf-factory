import type { DrawFormatConfig } from '../config/types';
import type { DrawSlot } from '../core/extractDrawData';

export function formatPlayerEntry(slot: DrawSlot, config: DrawFormatConfig): string {
  if (slot.isBye) return 'Bye';
  if (!slot.participantName) return '';

  const name = formatName(slot.participantName, config);
  const nat = formatNationality(slot.nationality, config);
  const seed = slot.seedValue ? formatSeed(slot.seedValue, config) : '';
  const entry = slot.entryStatus ? formatEntryStatus(slot.entryStatus, config) : '';

  const parts: string[] = [];

  if (config.seedPosition === 'before-position' && seed) parts.push(seed);
  parts.push(name);
  if (config.seedPosition === 'after-name' && seed) parts.push(seed);
  if (nat) parts.push(nat);
  if (config.seedPosition === 'after-country' && seed) parts.push(seed);
  if (entry) parts.push(entry);

  return parts.join(' ');
}

function formatName(participantName: string, config: DrawFormatConfig): string {
  // participantName comes as "LASTNAME, GivenName" from extractDrawData
  if (config.nameFormat === 'LAST First') {
    return participantName.replace(',', '');
  }
  if (config.nameFormat === 'F. LAST') {
    const match = participantName.match(/^([^,]+),\s*(.+)/);
    if (match) return `${match[2][0]}. ${match[1]}`;
  }
  return participantName;
}

function formatNationality(nat: string, config: DrawFormatConfig): string {
  if (!nat) return '';
  switch (config.nationalityFormat) {
    case 'parens':
      return `(${nat})`;
    case 'hyphen':
      return `-${nat}`;
    default:
      return nat;
  }
}

function formatSeed(seedValue: number, config: DrawFormatConfig): string {
  return config.seedFormat === 'parens' ? `(${seedValue})` : `[${seedValue}]`;
}

function formatEntryStatus(entryStatus: string, config: DrawFormatConfig): string {
  if (!entryStatus) return '';
  switch (config.entryFormat) {
    case 'parens':
      return `(${entryStatus})`;
    case 'hyphen':
      return `-${entryStatus}`;
    default:
      return entryStatus;
  }
}

export function formatMatchScore(score: string, config: DrawFormatConfig): string {
  if (!score) return '';
  // The score from the factory comes with hyphens as game separators
  // Convert to the preset's format if needed
  if (config.gameScoreSeparator === '/') {
    return score.replace(/(\d)-(\d)/g, `$1/$2`);
  }
  return score;
}
