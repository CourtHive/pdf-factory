# PDF Factory Roadmap

Remaining work to bring pdf-factory to production quality.

---

## 1. Format Presets

Four presets are needed to unlock fidelity comparisons against existing reference PDFs.

- **ATP draw preset** — reference PDFs: `atp_draw1.pdf`, `atp_draw2.pdf`
- **WTA draw preset** — reference PDFs: `wta_brisbane_ws.pdf`, `wta_doha_ws.pdf`, `wta_dubai_ws.pdf`, `wta_hongkong_ws.pdf`, `wta_madrid_ws.pdf`, `wta_rome_ws.pdf`
- **WTA OOP preset** — sequential time-slot format; reference PDFs: 20+ `wta_*_oop.pdf`
- **LTA compass preset** — reference PDFs: `lta_8_compass.pdf`, `lta_16_compass.pdf`

---

## 2. Fidelity Comparison Section in Storybook

Fidelity tests run as automated pixel comparisons with pre-rendered reference PNGs, but there's no way to visually inspect reference vs. generated PDFs side-by-side in Storybook.

### New story group: `PDF/Fidelity`

For each reference PDF that has a corresponding generator:

- Left panel: rendered image of the original reference PDF
- Right panel: our generated PDF rendered as an image
- Below: fidelity score, pixel diff overlay toggle
- Controls: zoom, page selection (for multi-page PDFs)

### Implementation approach

- Use existing pre-rendered PNGs from `src/__tests__/__output__/fidelity/`
- Generate our PDF in the story, render to canvas via pdf.js
- Use the existing `visualCompare.ts` pixelmatch logic to show diff overlay
- Group by format: Grand Slam Draws, ATP/WTA Draws, OOP, Compass, etc.

### Reference-to-generator mapping

| Reference PDF         | Generator             | Preset            | Notes           |
| --------------------- | --------------------- | ----------------- | --------------- |
| `wimbledon_ms.pdf`    | traditionalDraw       | wimbledon         | 128 draw        |
| `usopen_ms.pdf`       | traditionalDraw       | usOpen            | 128 draw        |
| `ao_ws.pdf`           | traditionalDraw       | australianOpen    | Women's singles |
| `rg_ws.pdf`           | traditionalDraw       | rolandGarros      | Women's singles |
| `wta_*_ws.pdf`        | traditionalDraw       | (need WTA preset) | Various sizes   |
| `atp_draw*.pdf`       | traditionalDraw       | (need ATP preset) | Various sizes   |
| `lta_8_compass.pdf`   | compassDraw           | (need LTA preset) | 8-draw compass  |
| `usta_8_compass.pdf`  | compassDraw           | usta              | 8-draw compass  |
| `double_elim_*.pdf`   | doubleEliminationDraw | —                 | Various formats |
| `wimbledon_oop_*.pdf` | scheduleV2            | wimbledon         | OOP pages       |
| `wta_*_oop.pdf`       | scheduleV2            | (need WTA preset) | OOP pages       |
| `usopen_oop_*.pdf`    | scheduleV2            | usOpen            | OOP pages       |

---

## 3. Configurable Schedule Cell Content

Basic `detailed`/`compact` cell styles work, but providers need fine-grained control over what appears in each schedule grid cell.

### Fields to expose

- Participant names (full / abbreviated / last name only)
- Match number
- Event name / abbreviation
- Round name
- Nationality flags/codes
- Seedings
- Scheduled time
- Match format code
- Score (for completed matchUps)

### Storybook UI

A dedicated "Cell Configuration" story with:

- Checkbox controls for each field
- Live preview of cells with different configurations
- Preset buttons (compact, detailed, broadcast, minimal)

---

## 4. Composition Editor

Full visual editor that combines header + footer + cell config + format preset into a saved `CompositionConfig`. The types already exist in `src/composition/editorTypes.ts` and `src/composition/printModalTypes.ts`. The `printDispatcher.ts` stub validates request structure but doesn't execute generation. The editor would be a courthive-component that TMX and the admin app both use.

---

## Priority Order

1. **Format presets** (ATP, WTA, LTA) — unblocks fidelity comparisons
2. **Fidelity comparison Storybook section** — visual inspection of reference vs. generated
3. **Cell configuration UI** — provider-facing feature
4. **Composition editor** — integrates everything into a single config UI
