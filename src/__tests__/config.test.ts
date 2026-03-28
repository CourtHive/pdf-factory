import { describe, it, expect } from 'vitest';
import { PRESETS, getPreset, mergePreset } from '../config/formatPresets';

describe('Format presets', () => {
  it('has all expected presets', () => {
    const names = Object.keys(PRESETS);
    expect(names).toContain('wimbledon');
    expect(names).toContain('usOpen');
    expect(names).toContain('rolandGarros');
    expect(names).toContain('australianOpen');
    expect(names).toContain('itfJunior');
    expect(names).toContain('usta');
  });

  it('each preset has all required fields', () => {
    for (const [name, preset] of Object.entries(PRESETS)) {
      expect(preset.nameFormat, `${name}.nameFormat`).toBeDefined();
      expect(preset.gameScoreSeparator, `${name}.gameScoreSeparator`).toBeDefined();
      expect(preset.roundLabels, `${name}.roundLabels`).toBeDefined();
      expect(preset.renderStyle, `${name}.renderStyle`).toBeDefined();
      expect(preset.page, `${name}.page`).toBeDefined();
      expect(preset.page.pageSize, `${name}.page.pageSize`).toBeDefined();
    }
  });

  it('wimbledon uses hyphen game separator and space set separator', () => {
    const w = getPreset('wimbledon');
    expect(w.gameScoreSeparator).toEqual('-');
    expect(w.setScoreSeparator).toEqual(' ');
  });

  it('rolandGarros uses slash game separator and French round labels', () => {
    const rg = getPreset('rolandGarros');
    expect(rg.gameScoreSeparator).toEqual('/');
    expect(rg.roundLabels.F).toEqual('FINALE');
    expect(rg.roundLabels.R128).toEqual('1er TOUR');
  });

  it('usOpen uses pipe set separator', () => {
    const uso = getPreset('usOpen');
    expect(uso.setScoreSeparator).toEqual(' | ');
  });

  it('australianOpen uses letter portrait', () => {
    const ao = getPreset('australianOpen');
    expect(ao.page.pageSize).toEqual('letter');
    expect(ao.page.orientation).toEqual('portrait');
    expect(ao.nationalityFormat).toEqual('parens');
  });

  it('getPreset falls back to itfJunior for unknown names', () => {
    const preset = getPreset('nonexistent');
    expect(preset).toEqual(PRESETS.itfJunior);
  });

  it('mergePreset overrides specific fields', () => {
    const merged = mergePreset('wimbledon', { retirementLabel: 'RET' });
    expect(merged.retirementLabel).toEqual('RET');
    expect(merged.gameScoreSeparator).toEqual('-');
  });
});
