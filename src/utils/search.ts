/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Search normalization and matching utilities for Anatolian Historical Atlas.
 * Provides Turkish-aware, diacritic-insensitive, and case-insensitive search normalization.
 */

import { Settlement } from '../types/settlement';
import { getPeriodLabel } from '../config/periods';

/**
 * Normalizes text for search comparison:
 * - Unicode normalize (NFD/NFC decomposition)
 * - Turkish-aware lowercase (İ -> i, I -> ı)
 * - Treat 'ı' and 'i' as equivalent
 * - Remove combining diacritical marks (accents)
 * - Map Turkish diacritics where useful:
 *   ç -> c, ğ -> g, ö -> o, ş -> s, ü -> u, â -> a, î -> i, û -> u
 * - Map regional historical characters: š -> s
 * - Normalize punctuation, hyphens, and whitespace
 *
 * Example transformations:
 * Karain      -> karain
 * KARAİN      -> karain
 * KARAIN      -> karain
 * Çatalhöyük  -> catalhoyuk
 * Göbekli     -> gobekli
 * Şanlıurfa   -> sanliurfa
 * Hattuša     -> hattusa
 */
export function normalizeForSearch(input?: string | null): string {
  if (!input) return '';
  return input
    // 1. Turkish-aware lowercase first (handles Turkish İ -> i and I -> ı)
    .toLocaleLowerCase('tr-TR')
    // 2. Canonical Unicode decomposition for combining accents
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    // 3. Treat dotless ı and dotted i as equivalent
    .replace(/ı/g, 'i')
    .replace(/i̇/g, 'i')
    // 4. Map Turkish special characters to ASCII equivalents
    .replace(/ç/g, 'c')
    .replace(/ğ/g, 'g')
    .replace(/ö/g, 'o')
    .replace(/ş/g, 's')
    .replace(/ü/g, 'u')
    // 5. Historical transcription characters (e.g. Hattuša)
    .replace(/š/g, 's')
    // 6. Treat punctuation, dashes, quotes, and slashes as whitespace
    .replace(/[-_’'`/.,;:()]/g, ' ')
    // 7. Collapse multiple spaces
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Checks if a candidate field matches the normalized search query.
 * Matches both standard spaced tokens and compact without spaces
 * (e.g. "gobekli tepe" matches "Göbeklitepe").
 */
export function matchesSearchQuery(candidate: string | undefined | null, normalizedQuery: string): boolean {
  if (!candidate || !normalizedQuery) return false;
  const normalizedCandidate = normalizeForSearch(candidate);
  if (!normalizedCandidate) return false;

  // Direct substring match with spaces preserved
  if (normalizedCandidate.includes(normalizedQuery)) return true;

  // Compact match (ignoring whitespace between words)
  const compactCandidate = normalizedCandidate.replace(/\s+/g, '');
  const compactQuery = normalizedQuery.replace(/\s+/g, '');
  if (compactQuery && compactCandidate.includes(compactQuery)) return true;

  return false;
}

/**
 * Filters settlements against a search query across:
 * - TR name
 * - EN name
 * - alternative names
 * - province (TR and EN)
 * - district (TR and EN)
 * - modern place
 * - periods (both ID and localized names)
 */
export function filterSettlements(
  settlements: Settlement[],
  query: string,
  lang: 'tr' | 'en' = 'tr'
): Settlement[] {
  const normalizedQuery = normalizeForSearch(query);
  if (!normalizedQuery) return [];

  return settlements.filter(s => {
    // 1. TR Name & EN Name
    if (matchesSearchQuery(s.nameTR || s.name, normalizedQuery)) return true;
    if (matchesSearchQuery(s.nameEN || s.name, normalizedQuery)) return true;
    if (matchesSearchQuery(s.name, normalizedQuery)) return true;

    // 2. Alternative Names
    if (s.alternativeNames && s.alternativeNames.length > 0) {
      for (const alt of s.alternativeNames) {
        if (matchesSearchQuery(alt, normalizedQuery)) return true;
      }
    }

    // 3. Province
    if (matchesSearchQuery(s.province, normalizedQuery)) return true;
    if (s.provinceTR && matchesSearchQuery(s.provinceTR, normalizedQuery)) return true;
    if (s.provinceEN && matchesSearchQuery(s.provinceEN, normalizedQuery)) return true;

    // 4. District
    if (matchesSearchQuery(s.district, normalizedQuery)) return true;
    if (s.districtTR && matchesSearchQuery(s.districtTR, normalizedQuery)) return true;
    if (s.districtEN && matchesSearchQuery(s.districtEN, normalizedQuery)) return true;

    // 5. Modern Place
    if (s.modernPlace && matchesSearchQuery(s.modernPlace, normalizedQuery)) return true;

    // 6. Periods (match translated period name or ID, e.g. "Neolitik" or "Neolithic")
    if (s.periods && s.periods.length > 0) {
      for (const p of s.periods) {
        const trLabel = getPeriodLabel(p, 'tr');
        const enLabel = getPeriodLabel(p, 'en');
        if (matchesSearchQuery(trLabel, normalizedQuery) || matchesSearchQuery(enLabel, normalizedQuery)) {
          return true;
        }
      }
    }

    return false;
  });
}
