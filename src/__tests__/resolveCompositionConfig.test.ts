import { resolveCompositionConfig } from '../composition/resolveCompositionConfig';
import { mocksEngine, tournamentEngine } from 'tods-competition-factory';
import type { CompositionConfig } from '../composition/editorTypes';
import { describe, it, expect } from 'vitest';

const baseConfig = (overrides: Partial<CompositionConfig> = {}): Partial<CompositionConfig> => ({
  name: 'base',
  page: { pageSize: 'a4', orientation: 'portrait', margins: { top: 10, right: 10, bottom: 10, left: 10 } },
  header: { layout: 'itf', tournamentName: 'Test' },
  footer: { layout: 'standard', showTimestamp: true },
  ...overrides,
});

// an element holding a print policy where the factory's attachPolicies stores it
const withPrintPolicy = (print: Record<string, any>) => ({
  extensions: [{ name: 'appliedPolicies', value: { print: { policyName: 'test', ...print } } }],
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

  it('overlays the tournament print policy on top of provider default', () => {
    const providerConfig = {
      providerConfigSettings: {
        policies: { printPolicies: { draw: baseConfig({ name: 'provider' }) } },
      },
    };
    const tournamentRecord = withPrintPolicy({ draw: { name: 'tournament-override', header: { layout: 'minimal' } } });
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
    const tournamentRecord = withPrintPolicy({ draw: { name: 'tournament' } });
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

  it('returns empty when tournament has no print policy', () => {
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

  it('does not read an extension named print, which nothing writes', () => {
    const tournamentRecord = { extensions: [{ name: 'print', value: { draw: { name: 'legacy' } } }] };
    expect(resolveCompositionConfig({ tournamentRecord, printType: 'draw' })).toEqual({});
  });

  it('layers provider, tournament, event, draw and runtime in that order, each deep-merged', () => {
    const providerConfig = { providerConfigSettings: { policies: { printPolicies: { draw: baseConfig() } } } };
    const tournamentRecord = withPrintPolicy({ draw: { name: 'tournament', footer: { layout: 'minimal' } } });
    const event = withPrintPolicy({ draw: { name: 'event', header: { tournamentName: 'Event header' } } });
    const drawDefinition = withPrintPolicy({ draw: { name: 'draw', page: { orientation: 'landscape' } } });

    const resolved = resolveCompositionConfig({
      providerConfig,
      tournamentRecord,
      event,
      drawDefinition,
      printType: 'draw',
    });
    expect(resolved.name).toBe('draw');
    expect(resolved.page?.orientation).toBe('landscape');
    // each outer layer's other fields survive the inner overrides
    expect(resolved.page?.pageSize).toBe('a4');
    expect(resolved.header).toEqual({ layout: 'itf', tournamentName: 'Event header' });
    expect(resolved.footer?.layout).toBe('minimal');
    expect(resolved.footer?.showTimestamp).toBe(true);

    const withRuntime = resolveCompositionConfig({
      runtime: { name: 'runtime' } as Partial<CompositionConfig>,
      providerConfig,
      tournamentRecord,
      drawDefinition,
      printType: 'draw',
      event,
    });
    expect(withRuntime.name).toBe('runtime');
  });

  it('reads only the element given, not policies of other print types', () => {
    const event = withPrintPolicy({ schedule: { name: 'event-schedule' } });
    expect(resolveCompositionConfig({ event, printType: 'draw' })).toEqual({});
    expect(resolveCompositionConfig({ event, printType: 'schedule' }).name).toBe('event-schedule');
  });

  it("reads a print policy attached by the factory's attachPolicies", () => {
    const {
      tournamentRecord,
      drawIds: [drawId],
    } = mocksEngine.generateTournamentRecord({ drawProfiles: [{ drawSize: 4 }] });
    tournamentEngine.setState(tournamentRecord);
    let result = tournamentEngine.attachPolicies({
      policyDefinitions: { print: { policyName: 'tournament', draw: { header: { layout: 'minimal' } } } },
    });
    expect(result.success).toBe(true);
    result = tournamentEngine.attachPolicies({
      policyDefinitions: { print: { policyName: 'draw', draw: { footer: { layout: 'standard' } } } },
      drawId,
    });
    expect(result.success).toBe(true);

    const { tournamentRecord: record } = tournamentEngine.getTournament();
    const { drawDefinition, event } = tournamentEngine.getEvent({ drawId });
    const resolved = resolveCompositionConfig({ tournamentRecord: record, event, drawDefinition, printType: 'draw' });
    expect(resolved.header?.layout).toBe('minimal');
    expect(resolved.footer?.layout).toBe('standard');
  });
});
