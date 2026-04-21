/**
 * Tournament Bridge — auto-populates HeaderConfig and FooterConfig from tournament record data.
 *
 * This is the bridge between factory's structured data and pdf-factory's rendering configs.
 * Factory provides the data; this module provides the mapping. Factory purity is preserved.
 */

import type { HeaderConfig, HeaderLayout, FooterConfig, FooterLayout } from '../config/types';

interface TournamentRecord {
  tournamentId?: string;
  tournamentName?: string;
  formalName?: string;
  startDate?: string;
  endDate?: string;
  hostCountryCode?: string;
  surfaceCategory?: string;
  totalPrizeMoney?: { amount: number; currencyCode: string }[];
  tournamentLevel?: string;
  tournamentTier?: { system?: string; value?: string };
  venues?: Venue[];
  participants?: Participant[];
  registrationProfile?: RegistrationProfile;
}

interface Venue {
  venueName?: string;
  addresses?: { city?: string; state?: string; countryCode?: string }[];
}

interface Participant {
  participantName?: string;
  participantRole?: string;
  participantRoleResponsibilities?: string[];
  person?: {
    standardGivenName?: string;
    standardFamilyName?: string;
    contacts?: { emailAddress?: string; telephone?: string; mobileTelephone?: string }[];
  };
}

interface RegistrationProfile {
  drawCeremonyDate?: string;
  sponsors?: { name: string; tier?: string }[];
}

function formatParticipantName(p: Participant): string {
  const person = p.person;
  if (person?.standardFamilyName) {
    const given = person.standardGivenName || '';
    return given ? person.standardFamilyName + ', ' + given : person.standardFamilyName;
  }
  return p.participantName || '';
}

function findParticipantByRole(participants: Participant[], role: string): Participant | undefined {
  return participants.find((p) => p.participantRole === role);
}

function findOfficialByResponsibility(participants: Participant[], responsibility: string): Participant | undefined {
  return participants.find(
    (p) =>
      p.participantRole === 'OFFICIAL' &&
      p.participantRoleResponsibilities?.some((r) => r.toUpperCase().includes(responsibility.toUpperCase())),
  );
}

function resolveLocation(record: TournamentRecord): string {
  const venue = record.venues?.[0];
  const addr = venue?.addresses?.[0];
  const parts: string[] = [];
  if (addr?.city) parts.push(addr.city);
  if (addr?.state) parts.push(addr.state);
  if (addr?.countryCode || record.hostCountryCode) parts.push(addr?.countryCode || record.hostCountryCode || '');
  return parts.join(', ');
}

function resolveCity(record: TournamentRecord): string | undefined {
  return record.venues?.[0]?.addresses?.[0]?.city;
}

function resolveCountry(record: TournamentRecord): string | undefined {
  return record.venues?.[0]?.addresses?.[0]?.countryCode || record.hostCountryCode;
}

function resolveGrade(record: TournamentRecord): string | undefined {
  if (record.tournamentTier) {
    const tier = record.tournamentTier;
    return tier.system ? tier.system + ' ' + (tier.value || '') : tier.value;
  }
  return record.tournamentLevel;
}

function formatPrizeMoney(record: TournamentRecord): string | undefined {
  const pm = record.totalPrizeMoney?.[0];
  if (!pm) return undefined;
  return String(pm.amount);
}

function formatCurrency(record: TournamentRecord): string | undefined {
  return record.totalPrizeMoney?.[0]?.currencyCode;
}

export interface BuildHeaderOptions {
  layout?: HeaderLayout;
  sectionLabel?: string;
  overrides?: Partial<HeaderConfig>;
}

/**
 * Auto-populate a HeaderConfig from structured tournament data.
 * All fields can be overridden via the overrides parameter.
 */
export function buildHeaderFromTournament(record: TournamentRecord, options: BuildHeaderOptions = {}): HeaderConfig {
  const { layout = 'itf', sectionLabel, overrides } = options;
  const participants = record.participants || [];

  const director = findParticipantByRole(participants, 'DIRECTOR');
  const referee = findOfficialByResponsibility(participants, 'REFEREE');
  const chiefUmpire =
    findOfficialByResponsibility(participants, 'CHIEF_UMPIRE') || findOfficialByResponsibility(participants, 'UMPIRE');
  const supervisor = findOfficialByResponsibility(participants, 'SUPERVISOR') || referee;

  const header: HeaderConfig = {
    layout,
    tournamentName: record.formalName || record.tournamentName || '',
    startDate: record.startDate,
    endDate: record.endDate,
    location: resolveLocation(record),
    city: resolveCity(record),
    country: resolveCountry(record),
    surface: record.surfaceCategory,
    grade: resolveGrade(record),
    tournamentId: record.tournamentId,
    organizer: director ? formatParticipantName(director) : undefined,
    supervisor: supervisor ? formatParticipantName(supervisor) : undefined,
    chiefUmpire: chiefUmpire ? formatParticipantName(chiefUmpire) : undefined,
    prizeMoney: formatPrizeMoney(record),
    currency: formatCurrency(record),
    sectionLabel,
    ...overrides,
  };

  return header;
}

export interface BuildFooterOptions {
  layout?: FooterLayout;
  seedAssignments?: FooterConfig['seedAssignments'];
  prizeMoney?: FooterConfig['prizeMoney'];
  overrides?: Partial<FooterConfig>;
}

/**
 * Auto-populate a FooterConfig from structured tournament data.
 * Seed assignments and prize money per round must be passed in since
 * they are draw/event-specific (not on the tournament root).
 */
export function buildFooterFromTournament(record: TournamentRecord, options: BuildFooterOptions = {}): FooterConfig {
  const { layout = 'standard', seedAssignments, prizeMoney, overrides } = options;
  const participants = record.participants || [];

  const officials = participants.filter((p) => p.participantRole === 'OFFICIAL' || p.participantRole === 'DIRECTOR');
  const signatureLines = officials.map((p) => ({
    role: p.participantRoleResponsibilities?.[0] || p.participantRole || 'Official',
    name: formatParticipantName(p),
  }));

  const footer: FooterConfig = {
    layout,
    showPageNumbers: true,
    showTimestamp: true,
    ...(signatureLines.length && { signatureLines }),
    ...(seedAssignments?.length && { seedAssignments }),
    ...(prizeMoney?.length && { prizeMoney }),
    ...(record.registrationProfile?.drawCeremonyDate && {
      drawCeremonyDate: record.registrationProfile.drawCeremonyDate,
    }),
    ...overrides,
  };

  return footer;
}
