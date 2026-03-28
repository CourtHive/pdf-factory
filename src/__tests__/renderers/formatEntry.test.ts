import { describe, it, expect } from 'vitest';
import { formatPlayerEntry, formatMatchScore } from '../../renderers/formatEntry';
import { getPreset } from '../../config/formatPresets';
import type { DrawSlot } from '../../core/extractDrawData';

const slot: DrawSlot = {
  drawPosition: 1,
  participantName: 'SINNER, Jannik',
  nationality: 'ITA',
  seedValue: 1,
  isBye: false,
};

describe('formatPlayerEntry', () => {
  it('formats Wimbledon style: [1] SINNER, Jannik ITA', () => {
    const result = formatPlayerEntry(slot, getPreset('wimbledon'));
    expect(result).toEqual('[1] SINNER, Jannik ITA');
  });

  it('formats Australian Open style: SINNER, Jannik [1] (ITA)', () => {
    const result = formatPlayerEntry(slot, getPreset('australianOpen'));
    expect(result).toEqual('SINNER, Jannik [1] (ITA)');
  });

  it('formats Roland Garros style: SINNER Jannik ITA [1]', () => {
    const result = formatPlayerEntry(slot, getPreset('rolandGarros'));
    expect(result).toEqual('SINNER Jannik ITA [1]');
  });

  it('returns Bye for bye slots', () => {
    const bye: DrawSlot = { drawPosition: 2, participantName: '', nationality: '', isBye: true };
    expect(formatPlayerEntry(bye, getPreset('wimbledon'))).toEqual('Bye');
  });

  it('returns empty for empty slots', () => {
    const empty: DrawSlot = { drawPosition: 3, participantName: '', nationality: '' };
    expect(formatPlayerEntry(empty, getPreset('wimbledon'))).toEqual('');
  });

  it('handles unseeded players', () => {
    const unseeded: DrawSlot = { drawPosition: 5, participantName: 'KOVACEVIC, Alex', nationality: 'USA' };
    expect(formatPlayerEntry(unseeded, getPreset('wimbledon'))).toEqual('KOVACEVIC, Alex USA');
  });
});

describe('formatMatchScore', () => {
  it('keeps hyphens for Wimbledon', () => {
    expect(formatMatchScore('6-4 6-3', getPreset('wimbledon'))).toEqual('6-4 6-3');
  });

  it('converts to slashes for Roland Garros', () => {
    expect(formatMatchScore('6-4 6-3', getPreset('rolandGarros'))).toEqual('6/4 6/3');
  });

  it('converts tiebreak scores for Australian Open', () => {
    expect(formatMatchScore('7-6(5) 6-3', getPreset('australianOpen'))).toEqual('7/6(5) 6/3');
  });

  it('returns empty for empty score', () => {
    expect(formatMatchScore('', getPreset('wimbledon'))).toEqual('');
  });
});
