import type { MockPlatformState } from './store';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;

function reviveDates(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(reviveDates);
  }
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    const next: Record<string, unknown> = {};
    for (const [key, entry] of Object.entries(record)) {
      if (typeof entry === 'string' && ISO_DATE.test(entry)) {
        next[key] = new Date(entry);
      } else {
        next[key] = reviveDates(entry);
      }
    }
    return next;
  }
  return value;
}

export function serializeMockPlatformState(state: MockPlatformState): string {
  return JSON.stringify(state);
}

export function deserializeMockPlatformState(raw: string): MockPlatformState {
  return reviveDates(JSON.parse(raw)) as MockPlatformState;
}
