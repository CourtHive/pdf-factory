# pdf-factory

Generate and parse tournament PDFs from [TODS](https://itftennis.atlassian.net/wiki/spaces/TODS/overview) (Tennis Open Data Standards) data. Draw sheets, schedules, player lists, court cards, sign-in sheets, and match cards — with Grand Slam and tour-level presets.

Part of the [CourtHive](https://github.com/CourtHive) ecosystem.

## Storybook

Live examples and interactive documentation: **https://courthive.github.io/pdf-factory/**

## Install

```bash
pnpm add pdf-factory
# or
npm install pdf-factory
```

## Quick start

### Generate a draw sheet

```typescript
import { tournamentEngine } from 'tods-competition-factory';
import { generateDrawPDF } from 'pdf-factory';

// Load a TODS tournament record
tournamentEngine.setState(tournamentRecord);
const { drawIds } = tournamentEngine.getEvent({ eventId });

// Generate a PDF — returns a jsPDF doc
const doc = generateDrawPDF({
  tournamentRecord,
  drawId: drawIds[0],
  preset: 'wimbledon', // or 'usOpen', 'rolandGarros', 'australianOpen', 'itfJunior', ...
});

// Output as bytes
const pdfBytes = doc.output('arraybuffer');
```

### Generate a schedule (Order of Play)

```typescript
import { generateSchedulePDF, extractScheduleData } from 'pdf-factory';

const scheduleData = extractScheduleData({ tournamentRecord });
const doc = generateSchedulePDF({ scheduleData, tournamentRecord });
```

### Generate a player list

```typescript
import { generatePlayerListPDF, extractParticipantData } from 'pdf-factory';

const participants = extractParticipantData({ tournamentRecord, eventId });
const doc = generatePlayerListPDF({ participants, tournamentRecord });
```

### Generate court cards

```typescript
import { generateCourtCardPDF, extractCourtCardData } from 'pdf-factory';

const courtCards = extractCourtCardData({ tournamentRecord, eventId });
const doc = generateCourtCardPDF({ courtCards, tournamentRecord });
```

### Parse an existing PDF back to TODS

The parser entry point is separate (Node-only, depends on `pdf2json`):

```typescript
import { parsePdfBuffer, extractDrawFromPage } from 'pdf-factory/parser';

const parsed = await parsePdfBuffer(pdfBuffer);
const draw = extractDrawFromPage(parsed.pages[0]);
// draw.participants, draw.scores, draw.seeds, ...
```

## Presets

Format presets control name display, score formatting, seed placement, round labels, and page layout. Built-in presets mirror real-world tournament PDFs:

| Preset           | Style                 | Round labels          |
| ---------------- | --------------------- | --------------------- |
| `wimbledon`      | LAST, First (GBR) [1] | First Round ... Final |
| `usOpen`         | LAST, First (USA) [1] | Round 1 ... Final     |
| `rolandGarros`   | LAST First (FRA) [1]  | 1er TOUR ... FINALE   |
| `australianOpen` | LAST, First (AUS) [1] | First Round ... Final |
| `itfJunior`      | LAST, First (NAT) [1] | Round of 64 ... Final |
| `wtaTour`        | LAST, First (NAT) [1] | First Round ... Final |

Presets are composable — start from a built-in and override individual fields:

```typescript
import { getPreset, mergePreset } from 'pdf-factory';

const custom = mergePreset('wimbledon', {
  nameFormat: 'First LAST',
  showEntryStatus: true,
});
```

## Composition catalog

Higher-level composition presets bundle header layout, footer layout, draw format, and page config into named units. Categories: Grand Slam, Tour, ITF, National, Collegiate, Club.

```typescript
import { getCatalogPreset, listCatalogPresets } from 'pdf-factory';

const presets = listCatalogPresets(); // all available compositions
const wimbledon = getCatalogPreset('wimbledon');
```

See the [Header & Footer Catalog](HEADER_FOOTER_CATALOG.md) for the three-tier footer system derived from real-world tournament PDFs.

## Document types

| Generator                      | Description                                                |
| ------------------------------ | ---------------------------------------------------------- |
| `generateDrawPDF`              | Auto-selects renderer based on draw type                   |
| `generateTraditionalDrawPDF`   | Single elimination bracket                                 |
| `generateSplitDrawPDF`         | Large draws split across pages (halves/quarters + summary) |
| `generateFeedInDrawPDF`        | Feed-in consolation structures                             |
| `generateConsolationDrawPDF`   | Consolation bracket                                        |
| `generateCompassDrawPDF`       | Compass (8-direction) draws                                |
| `generateDoubleEliminationPDF` | Winners + losers bracket                                   |
| `generateLuckyDrawPDF`         | Lucky loser draw                                           |
| `generateMirroredDrawPDF`      | Mirrored (left-right) bracket                              |
| `generateBackdrawPDF`          | Backdraw structures                                        |
| `generateSchedulePDF`          | Order of Play (court grid)                                 |
| `generateScheduleV2PDF`        | Sequential schedule layout                                 |
| `generateSequentialOOP`        | Sequential Order of Play                                   |
| `generatePlayerListPDF`        | Participant list with seeds and rankings                   |
| `generateCourtCardPDF`         | Per-court assignment cards                                 |
| `generateSignInSheetPDF`       | Player sign-in sheet                                       |
| `generateMatchCardPDF`         | Individual match scoring card                              |

## Architecture

```
TODS tournament record
  → extractors (extractDrawData, extractScheduleData, ...)
    → composition (page config + preset + header/footer)
      → renderers (traditionalDraw, roundRobin, compass, ...)
        → jsPDF document (Uint8Array or blob)
```

Parser pipeline (reverse direction):

```
PDF file
  → pdf2json extraction
    → pdfRuler (spatial analysis, column/row detection)
      → TODS structure mapping
```

### Source layout

```
src/
  config/        Presets (Grand Slam formats, page sizes, composition catalog)
  core/          Data extractors (TODS → renderer-ready data)
  composition/   Page composition, header/footer layouts, print dispatcher
  generators/    High-level PDF generators (one per document type)
  renderers/     Draw-type-specific renderers (bracket, round robin, compass, ...)
  layout/        Page layout engine, header/footer primitives, fonts, tables
  parser/        PDF-to-TODS extraction (Node-only, separate entry point)
  comparison/    Visual regression utilities (pixel-level PDF comparison)
  utils/         Shared formatting primitives
  stories/       Storybook stories for visual development
```

## Development

```bash
pnpm install
pnpm storybook       # interactive dev on :6007
pnpm test            # vitest (watch mode)
pnpm test:run        # single run
pnpm test:coverage   # coverage report
pnpm lint            # eslint with fix
pnpm check-types     # tsc --noEmit
pnpm build           # vite library build → dist/
```

### Testing

Tests are split into two categories:

- **Generator tests** (always run) — generate PDFs from `mocksEngine` tournament data and verify output. No external fixtures needed.
- **Parser/fidelity tests** (local only) — parse third-party tournament PDFs in `fixtures/`. These are gitignored and skipped automatically in CI via `describe.skipIf(!hasFixtures)`.

To run parser tests locally, populate `fixtures/reference/` with PDF files (see `fixtures/reference/download-draws.sh`).

## Dependencies

- [jsPDF](https://github.com/parallax/jsPDF) + [jspdf-autotable](https://github.com/simonbengtsson/jsPDF-AutoTable) — PDF generation
- [tods-competition-factory](https://github.com/CourtHive/competition-factory) — tournament data structures and engine
- [pdf2json](https://github.com/nicbou/pdf2json) — PDF parsing (parser entry point only)

## License

MIT
