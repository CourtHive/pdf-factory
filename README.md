# pdf-factory

Generate tournament PDFs from TODS data — draw sheets, schedules, player lists, court cards.

## Storybook

Live examples and interactive documentation:

**https://courthive.github.io/pdf-factory/**

## Install

```bash
pnpm add pdf-factory
```

## Usage

```typescript
import { generateDrawSheet, generateSchedule, generatePlayerList } from 'pdf-factory';
```

All generators accept TODS tournament data and return jsPDF documents.

## Development

```bash
pnpm install
pnpm storybook       # dev server on :6007
pnpm test            # vitest
pnpm test:run        # single run
pnpm test:coverage   # coverage report
pnpm lint            # eslint with fix
pnpm check-types     # tsc --noEmit
pnpm build           # vite build
```

## Architecture

```
src/
  generators/    PDF generators (draw sheets, schedules, player lists, court cards)
  renderers/     Low-level PDF rendering (traditional, round robin, lucky loser)
  parser/        PDF-to-TODS extraction (pdfRuler-based)
  composition/   PDF composition and layout assembly
  layout/        Page layout and positioning
  core/          Core types and shared logic
  config/        Presets (Grand Slam formats, page sizes)
  utils/         Shared utilities
  stories/       Storybook stories
```

## Dependencies

- [jsPDF](https://github.com/parallax/jsPDF) + [jspdf-autotable](https://github.com/simonbengtsson/jsPDF-AutoTable) for PDF generation
- [tods-competition-factory](https://github.com/CourtHive/competition-factory) for tournament data structures

## License

MIT
