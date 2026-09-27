import { createHash } from 'node:crypto';
import periods from '../../../periods.json';
import { SITE_TYPE_LABELS } from '../../../src/types/settlement.ts';

export const PROJECT = 'hiddenfeed';
export const DATABASE = 'ai-studio-anadolutarihnces-f71dcc77-2c3d-464d-a885-67c82d256cf1';
export const BUCKET = 'hiddenfeed.firebasestorage.app';
export const INBOX = '1eK5ckw3evvoU5j59K2YpnqA-0ha5ukOG';
export const PERIODS = Object.keys(periods.periods);
export const SITE_TYPES = Object.keys(SITE_TYPE_LABELS);
export const LEASE_MS = 10 * 60_000;
export const MAX_ATTEMPTS = 5;
export const HOUR_LIMIT = 10;
export type Seed = {id: string; name: string; province: string; earliestPeriod: string; earliestYear?: number; importance?: number; aliases?: string[]; sourceHints?: string[]; externalIds?: string[]};
export function hash(value: unknown): string {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}
export function normalize(value: string): string {
  return value.toLocaleLowerCase('tr-TR').replaceAll('ı','i').normalize('NFD').replace(/\p{M}/gu,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
}
export function prepare(seed: Seed) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(seed.id) || !seed.name?.trim() || !seed.province?.trim()) throw new Error('Invalid seed identity');
  const rank = (periods.periods as any)[seed.earliestPeriod]?.order;
  if (!Number.isFinite(rank)) throw new Error('Unknown canonical earliestPeriod');
  if (seed.earliestYear !== undefined && !Number.isFinite(seed.earliestYear)) throw new Error('Invalid earliestYear');
  const importance = seed.importance ?? 2;
  if (![1,2,3].includes(importance)) throw new Error('Invalid importance');
  // Hints are research targets, never verified archaeological facts.
  return {...seed, periodRank: rank as number, earliestYear: seed.earliestYear ?? 9999, importance,
    identityKeys: [...new Set([`slug:${seed.id}`, ...[seed.name,...seed.aliases ?? []].map(n=>`name:${normalize(seed.province)}:${normalize(n)}`), ...seed.externalIds ?? []])].map(hash)};
}
export function nextRetry(attempt: number, now: number, jitter = Math.random()): number {
  return now + Math.min(24 * 3600_000, 300_000 * 2 ** Math.max(0, attempt - 1)) * (0.8 + 0.4*jitter);
}
export function terminalFailure(attempt: number, kind: 'technical'|'quality', qualityAttempts: number) {
  if (kind === 'quality' && qualityAttempts >= 2) return 'quarantine';
  if (attempt >= MAX_ATTEMPTS) return kind === 'quality' ? 'quarantine' : 'dead_letter';
  return 'deferred';
}
