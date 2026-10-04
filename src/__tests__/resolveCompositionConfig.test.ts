import { describe, it, expect } from 'vitest';
import { resolveCompositionConfig } from '../composition/resolveCompositionConfig';
import type { CompositionConfig } from '../composition/editorTypes';

const baseConfig = (overrides: Partial<CompositionConfig> = {}): Partial<CompositionConfig> => ({
  name: 'base',
  page: { pageSize: 'a4', orientation: 'portrait', margins: { top: 10, right: 10, bottom: 10, left: 10 } },
  header: { layout: 'itf', tournamentName: 'Test' },
  footer: { layout: 'standard', showTimestamp: true },
  ...overrides,
});

describe('resolveCompositionConfig', () => {
  it('returns empty when no layers provided', () => {
    expect(resolveCompositionConfig({ printType: 'draw' })).toEqual({});
  });

  it('returns provider default when only provider has a policy', () => {
    const providerConfig = {
      providerConfigSettings: {
        policies: { printPolicies: { draw: baseConfig({ name: 'provider-default' }) } },
      },
    };
    const resolved = resolveCompositionConfig({ providerConfig, printType: 'draw' });
    expect(resolved.name).toBe('provider-default');
    expect(resolved.header?.layout).toBe('itf');
  });

  it('overlays tournament extension on top of provider default', () => {
    const providerConfig = {
      providerConfigSettings: {
        policies: { printPolicies: { draw: baseConfig({ name: 'provider' }) } },
      },
    };
    const tournamentRecord = {
      extensions: [
        {
          name: 'print',
          value: { draw: { name: 'tournament-override', header: { layout: 'minimal' } } },
        },
      ],
    };
    const resolved = resolveCompositionConfig({ providerConfig, tournamentRecord, printType: 'draw' });
    expect(resolved.name).toBe('tournament-override');
    expect(resolved.header?.layout).toBe('minimal');
    // Provider's tournamentName preserved by deep merge
    expect(resolved.header?.tournamentName).toBe('Test');
    // Provider's footer preserved entirely (tournament didn't touch it)
    expect(resolved.footer?.layout).toBe('standard');
  });

  it('overlays runtime tweaks on top of everything', () => {
    const providerConfig = {
      providerConfigSettings: {
        policies: { printPolicies: { draw: baseConfig({ name: 'provider' }) } },
      },
    };
    const tournamentRecord = {
      extensions: [{ name: 'print', value: { draw: { name: 'tournament' } } }],
    };
    const runtime = { name: 'runtime', page: { orientation: 'landscape' as const } } as Partial<CompositionConfig>;
    const resolved = resolveCompositionConfig({ providerConfig, tournamentRecord, printType: 'draw', runtime });
    expect(resolved.name).toBe('runtime');
    expect(resolved.page?.orientation).toBe('landscape');
    // Provider's pageSize preserved
    expect(resolved.page?.pageSize).toBe('a4');
  });

  it('isolates print types — schedule policy does not bleed into draw', () => {
    const providerConfig = {
      providerConfigSettings: {
        policies: {
          printPolicies: {
            draw: baseConfig({ name: 'draw-policy' }),
            schedule: baseConfig({ name: 'schedule-policy' }),
          },
        },
      },
    };
    expect(resolveCompositionConfig({ providerConfig, printType: 'draw' }).name).toBe('draw-policy');
    expect(resolveCompositionConfig({ providerConfig, printType: 'schedule' }).name).toBe('schedule-policy');
  });

  it('returns empty when tournament has no print extension', () => {
    const tournamentRecord = { extensions: [{ name: 'something-else', value: { foo: 'bar' } }] };
    expect(resolveCompositionConfig({ tournamentRecord, printType: 'draw' })).toEqual({});
  });

  it('arrays in overlay replace base, not merge', () => {
    const providerConfig = {
      providerConfigSettings: {
        policies: {
          printPolicies: {
            draw: { footer: { layout: 'standard' as const, notes: ['a', 'b'] } },
          },
        },
      },
    };
    const runtime = { footer: { layout: 'standard' as const, notes: ['c'] } } as Partial<CompositionConfig>;
    const resolved = resolveCompositionConfig({ providerConfig, printType: 'draw', runtime });
    expect(resolved.footer?.notes).toEqual(['c']);
  });
});
