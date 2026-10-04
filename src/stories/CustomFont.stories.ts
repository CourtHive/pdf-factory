import type { Meta, StoryObj } from '@storybook/html';

import { createDoc, getDefaultPageConfig } from '../composition/page';
import { setFont, SIZE, STYLE } from '../layout/fonts';
import type { FontDefinition } from '../layout/fonts';

/**
 * Custom Font (Latin-2 / Central-European)
 *
 * jsPDF's built-in `helvetica` is WinAnsi/Latin-1 only, so Czech / Croatian /
 * Polish / Hungarian diacritics render with missing or wrong glyphs. Pass a
 * TrueType font via `PageConfig.font` (or `registerFont(doc, def)`) to embed it —
 * `setFont` then uses it everywhere, falling back to helvetica when none is given.
 *
 * In production the font is fetched from competition-factory-server (`/fonts`) and
 * cached client-side. This story lets you upload any `.ttf` (e.g. DejaVu Sans or
 * Liberation Sans) and compare it against the built-in font.
 */

const SAMPLE_LINES = [
  'Czech:     Marketa Vondrousova / Markéta Vondroušová',
  'Czech:     Tomas Machac / Tomáš Macháč · Krejcikova / Krejčíková',
  'Croatian:  Djokovic / Đoković · Marin Cilic / Marin Čilić',
  'Polish:    Iga Swiatek / Iga Świątek · Lukasz / Łukasz',
  'Hungarian: Timea Babos / Tímea Babos · Marton / Márton',
  'Glyphs:    a c e n r s u y z  ->  ą č ě ń ř š ů ý ž đ ł ő ű',
];

const BOLD_SAMPLE = 'Bold run: Krejčíková · Đoković · Świątek';

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => {
      const result = String(reader.result); // data:font/ttf;base64,XXXX
      resolve(result.slice(result.indexOf(',') + 1));
    };
    reader.readAsDataURL(file);
  });
}

function buildSampleDoc(title: string, font?: FontDefinition) {
  const config = { ...getDefaultPageConfig(), orientation: 'portrait' as const, font };
  const doc = createDoc(config, 16);

  let y = config.margins.top + 8;
  setFont(doc, SIZE.TITLE, STYLE.BOLD);
  doc.text(title, config.margins.left, y);

  y += 12;
  setFont(doc, SIZE.BODY, STYLE.NORMAL);
  for (const line of SAMPLE_LINES) {
    doc.text(line, config.margins.left, y);
    y += 8;
  }

  y += 6;
  setFont(doc, SIZE.BODY, STYLE.BOLD);
  doc.text(BOLD_SAMPLE, config.margins.left, y);

  return doc;
}

function previewDoc(title: string, font?: FontDefinition) {
  const doc = buildSampleDoc(title, font);
  globalThis.open(URL.createObjectURL(doc.output('blob')));
}

function makeButton(label: string, background: string): HTMLButtonElement {
  const btn = document.createElement('button');
  btn.textContent = label;
  btn.style.cssText = `padding:10px 20px;font-size:14px;cursor:pointer;color:#fff;border:none;border-radius:4px;margin:0 10px 10px 0;background:${background};`;
  return btn;
}

function createCustomFontStory(): HTMLElement {
  const container = document.createElement('div');
  container.style.cssText = 'padding:20px;font-family:sans-serif;max-width:760px;';
  container.innerHTML = `
    <h2 style="margin-top:0">Custom Font — Latin-2 / Central-European</h2>
    <p style="color:#444;line-height:1.5">
      Built-in <strong>helvetica</strong> can't render Central-European diacritics.
      Upload a <code>.ttf</code> (DejaVu Sans or Liberation Sans work well) and compare.
      In each sample line the left spelling is ASCII, the right is the correct diacritic form.
      In production the font comes from <code>competition-factory-server</code> at <code>/fonts</code>.
    </p>`;

  let uploadedFont: FontDefinition | undefined;

  const helveticaBtn = makeButton('Preview with helvetica (built-in)', '#9b2226');
  helveticaBtn.onclick = () => previewDoc('Built-in helvetica (Latin-1)');

  const customBtn = makeButton('Preview with uploaded font', '#2d8a4e');
  customBtn.disabled = true;
  customBtn.style.opacity = '0.5';
  customBtn.onclick = () => {
    if (uploadedFont) previewDoc(`Embedded: ${uploadedFont.family}`, uploadedFont);
  };

  const status = document.createElement('div');
  status.style.cssText = 'margin:8px 0;color:#666;font-size:13px;';
  status.textContent = 'No font uploaded — upload a .ttf to enable the embedded preview.';

  const fileLabel = document.createElement('label');
  fileLabel.style.cssText = 'display:block;margin:12px 0;font-weight:bold;';
  fileLabel.textContent = 'Upload .ttf font: ';
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = '.ttf,font/ttf';
  fileInput.style.fontWeight = 'normal';
  fileInput.onchange = async () => {
    const file = fileInput.files?.[0];
    if (!file) return;
    const normal = await fileToBase64(file);
    const family = file.name.replace(/\.ttf$/i, '').replaceAll(/[^A-Za-z0-9]/g, '') || 'CustomFont';
    uploadedFont = { family, normal };
    customBtn.disabled = false;
    customBtn.style.opacity = '1';
    status.textContent = `Loaded "${file.name}" as family "${family}". Note: only the normal weight is embedded from a single upload; bold reuses it.`;
  };
  fileLabel.appendChild(fileInput);

  const buttons = document.createElement('div');
  buttons.style.marginTop = '8px';
  buttons.appendChild(helveticaBtn);
  buttons.appendChild(customBtn);

  container.appendChild(fileLabel);
  container.appendChild(status);
  container.appendChild(buttons);
  return container;
}

const meta: Meta = {
  title: 'PDF/Custom Font (Latin-2)',
  render: createCustomFontStory,
};

export default meta;
type Story = StoryObj;

export const Default: Story = {};
