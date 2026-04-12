# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Mentat Orchestration (READ FIRST)

Before doing anything else, read `../Mentat/CLAUDE.md`, `../Mentat/TASKS.md`, `../Mentat/standards/coding-standards.md`, and every file in `../Mentat/in-flight/`. Mentat is the orchestration layer for the entire CourtHive ecosystem; its standards override per-repo conventions when they conflict. If you are about to start **building** (not just planning), you must claim a surface in `../Mentat/in-flight/` and run the air-traffic-control conflict check first. See the parent `../CLAUDE.md` "Mentat Orchestration" section for the full protocol.

## Project Overview

PDF generation and parsing library for tennis tournament data built on TODS (Tennis Open Data Standards). Generates draw sheets, schedules, player lists, and court cards using jsPDF + jspdf-autotable. Parses existing tournament PDFs back into TODS structures using a ruler-based extraction system.

## Commands

```bash
pnpm install              # Install dependencies (pnpm only)
pnpm build                # Vite production build to dist/
pnpm check-types          # TypeScript type check (tsc --noEmit)
pnpm lint                 # ESLint with auto-fix
pnpm format               # Prettier on src/
pnpm test                 # Vitest (watch mode, TZ=UTC)
pnpm test:run             # Single test run
pnpm test:coverage        # Coverage report
pnpm test:ui              # Vitest UI
pnpm storybook            # Storybook dev server on :6007
pnpm commit               # Interactive conventional commit (cz-git)
```

## Architecture

### Source Layout

```
src/
  __tests__/     -- test suites with reference PDFs and snapshot comparison
  comparison/    -- pixel-level PDF comparison utilities (pixelmatch, pngjs)
  composition/   -- high-level PDF document composers
  config/        -- configuration constants and defaults
  core/          -- core PDF primitives and shared types
  generators/    -- document generators (draw sheets, schedules, player lists)
  layout/        -- page layout engine, header/footer, margin management
  parser/        -- PDF-to-TODS extraction (pdfRuler-based)
  renderers/     -- draw renderers (traditional bracket, round robin, lucky loser)
  stories/       -- Storybook stories for visual PDF preview
  utils/         -- shared utilities
```

### Generator Pipeline

```
TODS data -> composition (select preset + config)
  -> generators (build content blocks)
    -> layout (page dimensions, headers, footers)
      -> renderers (draw-type-specific rendering)
        -> jsPDF output (Uint8Array or blob)
```

### Parser Pipeline

```
PDF file -> pdf2json extraction
  -> pdfRuler (spatial analysis, column/row detection)
    -> TODS structure mapping
```

### Presets

Grand Slam presets define page sizes, fonts, margins, and layout rules for tournament-specific PDF generation. Located in config.

### Build Output

Vite builds to `dist/` as ES module with TypeScript declarations. Separate entry points for main library and parser (`./parser` export).

## Key Conventions

- **Package manager**: pnpm only
- **Module system**: ESNext (type: "module" in package.json)
- **Path aliases**: `@core/*`, `@generators/*`, `@layout/*`, `@utils/*` (tsconfig paths)
- **`noImplicitAny`**: false in tsconfig
- **`@typescript-eslint/no-explicit-any`**: OFF
- **Test snapshots**: Visual regression via pixel comparison of rendered PDFs against reference images
- **Imports**: Sort longest-first
- **Lint discipline**: Zero warnings -- fix all before deploy

## Ecosystem Standards

This repo follows CourtHive ecosystem coding standards documented in the Mentat orchestration repo at `../Mentat/standards/coding-standards.md`.
