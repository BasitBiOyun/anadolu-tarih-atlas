import periodsData from '../../periods.json';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

const ADMIN_ONLY_FIELDS = new Set([
  '_internal',
  'adminnotes',
  'adminnote',
  'rawscrape',
  'draftreview',
  'workermetadata',
  'ingestionsecret',
  'debug',
  'internalid',
  'adminapproval',
  'unverifieddraft',
  'sourcetoken',
  'secretkey'
]);

// Extract all valid period IDs from periods.json
function getAllValidPeriodIds(): Set<string> {
  const ids = new Set<string>();
  if (periodsData.periods) {
    Object.keys(periodsData.periods).forEach(p => ids.add(p.toLowerCase()));
  }
  if (Array.isArray(periodsData.groups)) {
    periodsData.groups.forEach(g => {
      if (Array.isArray(g.periods)) {
        g.periods.forEach(p => ids.add(p.toLowerCase()));
      }
    });
  }
  return ids;
}

const VALID_PERIOD_IDS = getAllValidPeriodIds();

/**
 * Checks an object recursively for accidentally exposed internal admin-only keys.
 */
function findAdminOnlyFields(obj: any, currentPath = ''): string[] {
  const exposed: string[] = [];
  if (!obj || typeof obj !== 'object') return exposed;

  if (Array.isArray(obj)) {
    obj.forEach((item, index) => {
      exposed.push(...findAdminOnlyFields(item, `${currentPath}[${index}]`));
    });
    return exposed;
  }

  for (const [key, val] of Object.entries(obj)) {
    const normalizedKey = key.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (ADMIN_ONLY_FIELDS.has(normalizedKey)) {
      exposed.push(`${currentPath ? currentPath + '.' : ''}${key}`);
    }
    exposed.push(...findAdminOnlyFields(val, `${currentPath ? currentPath + '.' : ''}${key}`));
  }

  return exposed;
}

/**
 * Validates an archaeological site JSON against Atlas Schema Version 3 and 4 standards.
 * Performs strict validation without fabricating or modifying archaeological content.
 */
export function validateSiteJson(data: any): ValidationResult {
  const errors: string[] = [];

  // 1. Basic JSON & Object Structure
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return {
      isValid: false,
      errors: ['Input must be a valid JSON object.']
    };
  }

  // 2. schemaVersion
  if (data.schemaVersion === undefined || data.schemaVersion === null) {
    errors.push('Missing required field: "schemaVersion".');
  } else if (data.schemaVersion !== 3 && data.schemaVersion !== 4) {
    errors.push(`Unsupported schemaVersion "${data.schemaVersion}". Atlas validator supports schemaVersion 3 and schemaVersion 4.`);
  }

  // 3. id
  if (!data.id || typeof data.id !== 'string' || !data.id.trim()) {
    errors.push('Missing or invalid required field: "id" must be a non-empty string slug.');
  } else {
    const validSlugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    if (!validSlugRegex.test(data.id)) {
      errors.push(`Invalid site id format "${data.id}". Must be a lowercase hyphenated slug (e.g. "acemhoyuk", "gobekli-tepe").`);
    }
  }

  // 4. core exists
  if (!data.core || typeof data.core !== 'object' || Array.isArray(data.core)) {
    errors.push('Missing required object: "core".');
    return { isValid: false, errors };
  }

  const { core } = data;

  // 5. coordinates
  if (!core.coordinates || typeof core.coordinates !== 'object') {
    errors.push('Missing required object: "core.coordinates".');
  } else {
    const { latitude, longitude } = core.coordinates;
    if (typeof latitude !== 'number' || isNaN(latitude)) {
      errors.push('Invalid coordinate: "core.coordinates.latitude" must be a valid finite number.');
    } else if (latitude < -90 || latitude > 90) {
      errors.push(`Out of range coordinate: "core.coordinates.latitude" (${latitude}) must be between -90 and 90.`);
    }

    if (typeof longitude !== 'number' || isNaN(longitude)) {
      errors.push('Invalid coordinate: "core.coordinates.longitude" must be a valid finite number.');
    } else if (longitude < -180 || longitude > 180) {
      errors.push(`Out of range coordinate: "core.coordinates.longitude" (${longitude}) must be between -180 and 180.`);
    }
  }

  // 6. chronology
  if (!core.chronology || !Array.isArray(core.chronology) || core.chronology.length === 0) {
    errors.push('Missing or empty required array: "core.chronology" must contain at least one chronological horizon entry.');
  } else {
    core.chronology.forEach((entry: any, idx: number) => {
      if (!entry || typeof entry !== 'object') {
        errors.push(`Invalid chronology entry at index ${idx}: must be an object.`);
        return;
      }
      if (!entry.periodId || typeof entry.periodId !== 'string') {
        errors.push(`Chronology entry at index ${idx} is missing "periodId".`);
      } else {
        const normalizedPeriodId = entry.periodId.toLowerCase().trim();
        if (!VALID_PERIOD_IDS.has(normalizedPeriodId)) {
          errors.push(`Chronology entry at index ${idx} contains unrecognized periodId "${entry.periodId}". Must match a valid period defined in periods.json.`);
        }
      }

      if (entry.startYear !== undefined && entry.startYear !== null && typeof entry.startYear !== 'number') {
        errors.push(`Chronology entry at index ${idx}: startYear must be a number.`);
      }
      if (entry.endYear !== undefined && entry.endYear !== null && typeof entry.endYear !== 'number') {
        errors.push(`Chronology entry at index ${idx}: endYear must be a number.`);
      }
      if (typeof entry.startYear === 'number' && typeof entry.endYear === 'number' && entry.startYear > entry.endYear) {
        errors.push(`Chronology entry at index ${idx}: startYear (${entry.startYear}) cannot be greater than endYear (${entry.endYear}).`);
      }
    });
  }

  // 7. sources and citation validation
  const declaredSourceIds = new Set<string>();
  const declaredCitationNumbers = new Set<number>();

  if (core.sources) {
    if (!Array.isArray(core.sources)) {
      errors.push('"core.sources" must be an array of bibliographic source objects.');
    } else {
      core.sources.forEach((src: any, idx: number) => {
        if (!src || typeof src !== 'object') {
          errors.push(`Source at index ${idx} is not an object.`);
          return;
        }
        if (!src.title || typeof src.title !== 'string') {
          errors.push(`Source at index ${idx} is missing a title.`);
        }

        const sId = src.id || src.sourceId;
        if (sId) {
          if (declaredSourceIds.has(sId)) {
            errors.push(`Duplicate source id "${sId}" in core.sources.`);
          }
          declaredSourceIds.add(sId);
        }

        if (src.citationNumber !== undefined && src.citationNumber !== null) {
          if (typeof src.citationNumber !== 'number' || !Number.isInteger(src.citationNumber) || src.citationNumber < 1) {
            errors.push(`Source at index ${idx} has invalid citationNumber "${src.citationNumber}". Must be a positive integer.`);
          } else {
            if (declaredCitationNumbers.has(src.citationNumber)) {
              errors.push(`Citation number conflict: duplicate citationNumber ${src.citationNumber} found in core.sources.`);
            }
            declaredCitationNumbers.add(src.citationNumber);
          }
        }
      });
    }
  }

  // 8. content.tr and content.en
  if (!data.content || typeof data.content !== 'object' || Array.isArray(data.content)) {
    errors.push('Missing required object: "content".');
    return { isValid: errors.length === 0, errors };
  }

  if (!data.content.tr || typeof data.content.tr !== 'object' || Array.isArray(data.content.tr)) {
    errors.push('Missing required localized content: "content.tr".');
  } else {
    if (!data.content.tr.name || typeof data.content.tr.name !== 'string' || !data.content.tr.name.trim()) {
      errors.push('Missing or empty required field: "content.tr.name".');
    }
  }

  if (!data.content.en || typeof data.content.en !== 'object' || Array.isArray(data.content.en)) {
    errors.push('Missing required localized content: "content.en".');
  } else {
    if (!data.content.en.name || typeof data.content.en.name !== 'string' || !data.content.en.name.trim()) {
      errors.push('Missing or empty required field: "content.en.name".');
    }
  }

  // 9. Source cross-reference validation in content
  // Collect all sourceIds referenced in content text or structured fields
  const referencedSourceIds = new Set<string>();

  function scanForSourceReferences(node: any) {
    if (!node) return;
    if (typeof node === 'string') {
      // Check for inline source citations: [src:source_id], [cite:source_id] or {sourceId: ...}
      const inlineMatches = node.matchAll(/\[(?:src|cite|ref):([a-zA-Z0-9_\-]+)\]/g);
      for (const match of inlineMatches) {
        if (match[1]) referencedSourceIds.add(match[1]);
      }
      return;
    }
    if (Array.isArray(node)) {
      node.forEach(scanForSourceReferences);
      return;
    }
    if (typeof node === 'object') {
      if (node.sourceId && typeof node.sourceId === 'string') {
        referencedSourceIds.add(node.sourceId);
      }
      if (node.sourceIds && Array.isArray(node.sourceIds)) {
        node.sourceIds.forEach((s: any) => {
          if (typeof s === 'string') referencedSourceIds.add(s);
        });
      }
      Object.values(node).forEach(scanForSourceReferences);
    }
  }

  scanForSourceReferences(data.content);

  // Verify each referenced sourceId exists in core.sources
  for (const refId of referencedSourceIds) {
    if (!declaredSourceIds.has(refId)) {
      errors.push(`Unresolved source reference: sourceId "${refId}" used in content does not exist in core.sources.`);
    }
  }

  // 10. Check for accidentally exposed internal admin-only fields
  const exposedAdminFields = findAdminOnlyFields(data);
  if (exposedAdminFields.length > 0) {
    errors.push(
      `Disallowed internal admin fields detected in record: ${exposedAdminFields.join(', ')}. Internal workflow metadata must not be exposed in public site content.`
    );
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}
