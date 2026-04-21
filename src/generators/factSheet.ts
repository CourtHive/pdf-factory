/**
 * Fact Sheet Generator — produces structured tournament information PDFs.
 *
 * Pulls from tournament record fields, registration profile, venues, participants,
 * and events. Appends free-form notes HTML as plain text at the bottom.
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { buildHeaderFromTournament } from '../composition/tournamentBridge';
import { renderHeader } from '../composition/headerLayouts';
import { getFactSheetTemplate, type FactSheetSectionType } from '../config/factSheetCatalog';
import { setFont, SIZE, STYLE } from '../layout/fonts';
import { drawPageFooter } from '../layout/headers';

const MARGIN = 15;

interface FactSheetOptions {
  templateId?: string;
  enabledSections?: FactSheetSectionType[];
}

function stripHtml(html: string): string {
  // Use DOM when available; simple character-walk fallback for Node
  if (typeof document !== 'undefined') {
    const el = document.createElement('div');
    el.innerHTML = html;
    return el.textContent || '';
  }
  let result = '';
  let inTag = false;
  for (const ch of html) {
    if (ch === '<') {
      inTag = true;
      continue;
    }
    if (ch === '>') {
      inTag = false;
      continue;
    }
    if (!inTag) result += ch;
  }
  return result.trim();
}

function sectionHeading(doc: jsPDF, title: string, y: number): number {
  setFont(doc, SIZE.HEADING, STYLE.BOLD);
  doc.setTextColor(40);
  doc.text(title.toUpperCase(), MARGIN, y);
  doc.setTextColor(0);
  y += 1.5;
  doc.setDrawColor(180);
  doc.setLineWidth(0.2);
  doc.line(MARGIN, y, doc.internal.pageSize.getWidth() - MARGIN, y);
  y += 4;
  return y;
}

function bodyText(doc: jsPDF, text: string, y: number, maxWidth?: number): number {
  setFont(doc, SIZE.BODY, STYLE.NORMAL);
  const width = maxWidth || doc.internal.pageSize.getWidth() - MARGIN * 2;
  const lines = doc.splitTextToSize(text, width);
  doc.text(lines, MARGIN, y);
  return y + lines.length * 3.2;
}

function checkPageBreak(doc: jsPDF, y: number, needed: number): number {
  const pageHeight = doc.internal.pageSize.getHeight();
  if (y + needed > pageHeight - 20) {
    doc.addPage();
    return 20;
  }
  return y;
}

function renderTournamentHeader(doc: jsPDF, record: any, y: number): number {
  const pageConfig = {
    pageSize: 'a4' as const,
    orientation: 'portrait' as const,
    margins: { top: y, right: MARGIN, bottom: 15, left: MARGIN },
  };
  const headerConfig = buildHeaderFromTournament(record, { layout: 'itf' });
  const headerHeight = renderHeader(doc, headerConfig, pageConfig);
  return y + headerHeight;
}

function renderContacts(doc: jsPDF, record: any, y: number): number {
  const participants = record.participants || [];
  const nonCompetitors = participants.filter((p: any) => p.participantRole && p.participantRole !== 'COMPETITOR');
  if (!nonCompetitors.length) return y;

  y = checkPageBreak(doc, y, 20);
  y = sectionHeading(doc, 'Tournament Contacts', y);

  const rows = nonCompetitors.map((p: any) => {
    const person = p.person || {};
    const name =
      [person.standardGivenName, person.standardFamilyName].filter(Boolean).join(' ') || p.participantName || '';
    const role = p.participantRoleResponsibilities?.[0] || p.participantRole || '';
    const contact = person.contacts?.[0] || {};
    const details = [contact.emailAddress, contact.telephone || contact.mobileTelephone].filter(Boolean).join(' | ');
    return [name, role, details];
  });

  autoTable(doc, {
    startY: y,
    head: [['Name', 'Role', 'Contact']],
    body: rows,
    margin: { left: MARGIN, right: MARGIN },
    styles: { fontSize: 7, cellPadding: 1.5 },
    headStyles: { fillColor: [60, 60, 60], textColor: 255, fontStyle: 'bold' },
    theme: 'grid',
  });

  return (doc as any).lastAutoTable.finalY + 6;
}

function renderEvents(doc: jsPDF, record: any, y: number): number {
  const events = record.events || [];
  if (!events.length) return y;

  y = checkPageBreak(doc, y, 20);
  y = sectionHeading(doc, 'Events', y);

  const rows = events.map((e: any) => {
    const drawSize = e.drawDefinitions?.[0]?.drawSize || '';
    return [e.eventName || '', e.eventType || '', e.matchUpFormat || '', String(drawSize)];
  });

  autoTable(doc, {
    startY: y,
    head: [['Event', 'Type', 'Format', 'Draw Size']],
    body: rows,
    margin: { left: MARGIN, right: MARGIN },
    styles: { fontSize: 7, cellPadding: 1.5 },
    headStyles: { fillColor: [60, 60, 60], textColor: 255, fontStyle: 'bold' },
    theme: 'grid',
  });

  return (doc as any).lastAutoTable.finalY + 6;
}

function renderEntryInfo(doc: jsPDF, record: any, y: number): number {
  const rp = record.registrationProfile;
  if (!rp) return y;

  const lines: string[] = [];
  if (rp.entriesOpen) lines.push('Entries Open: ' + rp.entriesOpen);
  if (rp.entriesClose) lines.push('Entries Close: ' + rp.entriesClose);
  if (rp.withdrawalDeadline) lines.push('Withdrawal Deadline: ' + rp.withdrawalDeadline);
  if (rp.entryMethod) lines.push('Entry Method: ' + rp.entryMethod);
  if (rp.entryUrl) lines.push('Entry URL: ' + rp.entryUrl);
  if (rp.eligibilityNotes) lines.push('Eligibility: ' + rp.eligibilityNotes);

  if (rp.entryFees?.length) {
    const feeStr = rp.entryFees
      .map((f: any) => {
        const label = f.eventType ? f.eventType + ': ' : '';
        return label + f.currencyCode + ' ' + f.amount;
      })
      .join(', ');
    lines.push('Entry Fees: ' + feeStr);
  }

  if (!lines.length) return y;

  y = checkPageBreak(doc, y, 10 + lines.length * 3.5);
  y = sectionHeading(doc, 'Entry Information', y);

  setFont(doc, SIZE.BODY, STYLE.NORMAL);
  for (const line of lines) {
    doc.text(line, MARGIN, y);
    y += 3.5;
  }
  return y + 3;
}

function renderVenueInfo(doc: jsPDF, record: any, y: number): number {
  const venues = record.venues || [];
  if (!venues.length) return y;

  y = checkPageBreak(doc, y, 15);
  y = sectionHeading(doc, 'Venue', y);

  setFont(doc, SIZE.BODY, STYLE.NORMAL);
  for (const venue of venues) {
    setFont(doc, SIZE.BODY, STYLE.BOLD);
    doc.text(venue.venueName || 'Venue', MARGIN, y);
    y += 3.5;
    setFont(doc, SIZE.BODY, STYLE.NORMAL);

    const addr = venue.addresses?.[0];
    if (addr) {
      const parts = [addr.street, addr.city, addr.state, addr.postalCode, addr.countryCode].filter(Boolean);
      if (parts.length) {
        doc.text(parts.join(', '), MARGIN, y);
        y += 3.5;
      }
    }
    const courts = venue.courts?.length;
    if (courts) {
      doc.text('Courts: ' + courts, MARGIN, y);
      y += 3.5;
    }
  }
  return y + 3;
}

function renderLogisticsSection(doc: jsPDF, title: string, section: any, y: number): number {
  if (!section) return y;
  const hasOptions = section.options?.length;
  const hasNotes = section.notes && stripHtml(section.notes);
  if (!hasOptions && !hasNotes) return y;

  y = checkPageBreak(doc, y, 15);
  y = sectionHeading(doc, title, y);

  if (hasOptions) {
    const rows = section.options.map((opt: any) => {
      const details = [opt.phone, opt.email, opt.priceRange].filter(Boolean).join(' | ');
      return [opt.name, opt.address || '', details];
    });

    autoTable(doc, {
      startY: y,
      head: [['Name', 'Address', 'Details']],
      body: rows,
      margin: { left: MARGIN, right: MARGIN },
      styles: { fontSize: 7, cellPadding: 1.5 },
      headStyles: { fillColor: [60, 60, 60], textColor: 255, fontStyle: 'bold' },
      theme: 'grid',
    });

    y = (doc as any).lastAutoTable.finalY + 3;
  }

  if (hasNotes) {
    y = bodyText(doc, stripHtml(section.notes), y);
  }

  return y + 3;
}

function renderPrizeMoney(doc: jsPDF, record: any, y: number): number {
  const pm = record.totalPrizeMoney;
  if (!pm?.length) return y;

  y = checkPageBreak(doc, y, 10);
  y = sectionHeading(doc, 'Prize Money', y);

  setFont(doc, SIZE.BODY, STYLE.NORMAL);
  for (const p of pm) {
    doc.text(p.currencyCode + ' ' + p.amount.toLocaleString(), MARGIN, y);
    y += 3.5;
  }
  return y + 3;
}

function renderOfficials(doc: jsPDF, record: any, y: number): number {
  const participants = record.participants || [];
  const officials = participants.filter(
    (p: any) => p.participantRole === 'OFFICIAL' || p.participantRole === 'DIRECTOR',
  );
  if (!officials.length) return y;

  y = checkPageBreak(doc, y, 15);
  y = sectionHeading(doc, 'Officials', y);

  const rows = officials.map((p: any) => {
    const person = p.person || {};
    const name =
      [person.standardGivenName, person.standardFamilyName].filter(Boolean).join(' ') || p.participantName || '';
    const role = p.participantRoleResponsibilities?.[0] || p.participantRole || '';
    return [name, role];
  });

  autoTable(doc, {
    startY: y,
    head: [['Name', 'Role']],
    body: rows,
    margin: { left: MARGIN, right: MARGIN },
    styles: { fontSize: 7, cellPadding: 1.5 },
    headStyles: { fillColor: [60, 60, 60], textColor: 255, fontStyle: 'bold' },
    theme: 'grid',
  });

  return (doc as any).lastAutoTable.finalY + 6;
}

function renderRegulations(doc: jsPDF, record: any, y: number): number {
  const rp = record.registrationProfile;
  if (!rp) return y;

  const lines: string[] = [];
  if (rp.codeOfConduct) {
    const coc = rp.codeOfConduct;
    lines.push('Code of Conduct: ' + (coc.name || '') + (coc.url ? ' — ' + coc.url : ''));
  }
  if (rp.regulations?.length) {
    for (const reg of rp.regulations) {
      lines.push((reg.name || 'Regulation') + (reg.url ? ' — ' + reg.url : ''));
    }
  }
  if (rp.dressCode) lines.push('Dress Code: ' + rp.dressCode);
  if (rp.contingencyPlan) lines.push('Contingency: ' + rp.contingencyPlan);

  if (!lines.length) return y;

  y = checkPageBreak(doc, y, 10 + lines.length * 3.5);
  y = sectionHeading(doc, 'Regulations', y);

  setFont(doc, SIZE.BODY, STYLE.NORMAL);
  for (const line of lines) {
    doc.text(line, MARGIN, y);
    y += 3.5;
  }
  return y + 3;
}

function renderSponsors(doc: jsPDF, record: any, y: number): number {
  const sponsors = record.registrationProfile?.sponsors;
  if (!sponsors?.length) return y;

  y = checkPageBreak(doc, y, 10);
  y = sectionHeading(doc, 'Sponsors', y);

  setFont(doc, SIZE.BODY, STYLE.NORMAL);
  for (const s of sponsors) {
    const tierLabel = s.tier ? ' [' + s.tier + ']' : '';
    doc.text(s.name + tierLabel, MARGIN, y);
    y += 3.5;
  }
  return y + 3;
}

function renderSocialEvents(doc: jsPDF, record: any, y: number): number {
  const events = record.registrationProfile?.socialEvents;
  if (!events?.length) return y;

  const rp = record.registrationProfile;
  y = checkPageBreak(doc, y, 15);
  y = sectionHeading(doc, 'Social Events & Ceremonies', y);

  setFont(doc, SIZE.BODY, STYLE.NORMAL);
  if (rp?.drawCeremonyDate) {
    doc.text('Draw Ceremony: ' + rp.drawCeremonyDate, MARGIN, y);
    y += 3.5;
  }
  if (rp?.awardsCeremonyDate) {
    doc.text('Awards Ceremony: ' + rp.awardsCeremonyDate, MARGIN, y);
    y += 3.5;
  }

  for (const e of events) {
    setFont(doc, SIZE.BODY, STYLE.BOLD);
    doc.text(e.name, MARGIN, y);
    y += 3.5;
    setFont(doc, SIZE.BODY, STYLE.NORMAL);
    const details = [e.date, e.time, e.location].filter(Boolean).join(' | ');
    if (details) {
      doc.text(details, MARGIN, y);
      y += 3.5;
    }
    if (e.description) {
      doc.text(e.description, MARGIN, y);
      y += 3.5;
    }
  }
  return y + 3;
}

function renderCustomNotes(doc: jsPDF, record: any, y: number): number {
  const notes = record.notes;
  if (!notes) return y;

  const plain = stripHtml(notes);
  if (!plain) return y;

  y = checkPageBreak(doc, y, 15);
  y = sectionHeading(doc, 'Additional Information', y);
  y = bodyText(doc, plain, y);
  return y + 3;
}

const SECTION_RENDERERS: Record<FactSheetSectionType, (doc: jsPDF, record: any, y: number) => number> = {
  'tournament-header': renderTournamentHeader,
  contacts: renderContacts,
  events: renderEvents,
  'entry-info': renderEntryInfo,
  'venue-info': renderVenueInfo,
  accommodation: (doc, rec, y) =>
    renderLogisticsSection(doc, 'Accommodation', rec.registrationProfile?.accommodation, y),
  transportation: (doc, rec, y) =>
    renderLogisticsSection(doc, 'Transportation', rec.registrationProfile?.transportation, y),
  hospitality: (doc, rec, y) => renderLogisticsSection(doc, 'Hospitality', rec.registrationProfile?.hospitality, y),
  medical: (doc, rec, y) => renderLogisticsSection(doc, 'Medical', rec.registrationProfile?.medicalInfo, y),
  regulations: renderRegulations,
  'prize-money': renderPrizeMoney,
  officials: renderOfficials,
  sponsors: renderSponsors,
  'social-events': renderSocialEvents,
  'custom-notes': renderCustomNotes,
};

/**
 * Generate a structured tournament fact sheet PDF.
 *
 * @param tournamentRecord - Full tournament record from tods-competition-factory
 * @param options - Template selection and section overrides
 * @returns jsPDF document
 */
export function generateFactSheet(tournamentRecord: any, options: FactSheetOptions = {}): jsPDF {
  const { templateId = 'itf-junior' } = options;
  const template = getFactSheetTemplate(templateId);
  const sections = template?.sections || getFactSheetTemplate('itf-junior')!.sections;

  const enabledSet = options.enabledSections ? new Set(options.enabledSections) : null;

  const doc = new jsPDF({ orientation: 'portrait', format: 'a4' });
  let y = MARGIN;

  for (const section of sections) {
    if (!section.enabled) continue;
    if (enabledSet && !enabledSet.has(section.type)) continue;

    const renderer = SECTION_RENDERERS[section.type];
    if (renderer) {
      y = renderer(doc, tournamentRecord, y);
    }
  }

  // Page footers
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    drawPageFooter(doc, 'Generated ' + new Date().toLocaleDateString(), i);
  }

  return doc;
}
