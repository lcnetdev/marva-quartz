/**
 * Parses a bf:dimensions string and returns size classification and measurements.
 * Format is HEIGHT x WIDTH (x DEPTH).
 * If just one number, it's the height.
 * If multiple dimension sets exist, uses the largest height.
 * const result = parseDimensions('21 x 24 cm');
 * { size: "small", height: 21, width: 24, depth: false }
 *
 * Converts mm to cm.
 *
 * @param {string} str - The dimension string
 * @returns {{ size: string, height: number|false, width: number|false, depth: number|false }}
 */
function parseDimensions(str) {
  if (!str || typeof str !== 'string') {
    return { size: false, height: false, width: false, depth: false };
  }

  // Extract all dimension groups from the string.
  // A dimension group is: NUMBER x NUMBER (x NUMBER) unit
  // There can be multiple groups separated by "and", ",", "on sheet", "sheets", etc.
  // We want to find all "H x W" or "H x W x D" patterns with cm/mm units,
  // as well as standalone "N cm" or "N mm" heights.

  const result = { size: false, height: false, width: false, depth: false };

  // Normalize: replace various unicode x/× with ascii x, normalize whitespace
  let s = str
    .replace(/×/g, 'x')
    .replace(/х/g, 'x')  // cyrillic х
    .replace(/см/g, 'cm') // cyrillic см
    .replace(/X/g, 'x')
    .replace(/\b(\d+)\s*cn\b/g, '$1 cm')   // typo: cn → cm
    .replace(/\b(\d+)\s*sm\b/g, '$1 cm')   // typo: sm → cm
    .replace(/\b(\d+)\s+m\b/g, '$1 cm')    // typo: m → cm (with space to avoid matching "mm")
    .replace(/\s+/g, ' ')
    .trim();

  // Pattern for a number (integer or decimal, with optional fractions like 3/4)
  const numPat = '(\\d+(?:\\.\\d+)?(?:\\s+\\d+/\\d+)?)';

  // Find all "H x W x D cm/mm" or "H x W cm/mm" groups
  const dimGroupRegex = new RegExp(
    numPat + '\\s*x\\s*' + numPat + '(?:\\s*x\\s*' + numPat + ')?' + '\\s*(?:cm|mm|centimeters)',
    'gi'
  );

  // Find standalone height: "N cm" or "N mm" — not preceded by "x" or followed by "x"
  const standaloneRegex = new RegExp(
    '(?:^|[^x\\d.])\\s*' + numPat + '\\s*(?:cm|mm|centimeters)(?:\\b|\\.)(?!\\s*x)',
    'gi'
  );

  let candidates = [];
  let match;

  // 1. "N cm x N cm" format (e.g. "14 cm x 9 cm", "20 cm x 26 cm")
  const cmXcmRegex = new RegExp(numPat + '\\s*cm\\s*x\\s*' + numPat + '\\s*cm', 'gi');
  while ((match = cmXcmRegex.exec(s)) !== null) {
    const h = parseNum(match[1], 'cm');
    const w = parseNum(match[2], 'cm');
    if (h !== false) {
      candidates.push({ height: h, width: w, depth: false });
    }
  }

  // 2. "H x W (x D) cm/mm" groups (no unit between numbers)
  while ((match = dimGroupRegex.exec(s)) !== null) {
    const unit = /mm/i.test(match[0]) && !/cm/i.test(match[0]) ? 'mm' : 'cm';
    const h = parseNum(match[1], unit);
    const w = parseNum(match[2], unit);
    const d = match[3] ? parseNum(match[3], unit) : false;
    if (h !== false) {
      candidates.push({ height: h, width: w, depth: d });
    }
  }

  // 3. "N-N cm" range format (e.g. "15-21 cm") — use the larger value
  const rangeRegex = new RegExp(numPat + '\\s*-\\s*' + numPat + '\\s*(?:cm|mm)', 'gi');
  while ((match = rangeRegex.exec(s)) !== null) {
    const unit = /mm/i.test(match[0]) && !/cm/i.test(match[0]) ? 'mm' : 'cm';
    const a = parseNum(match[1], unit);
    const b = parseNum(match[2], unit);
    const h = (a !== false && b !== false) ? Math.max(a, b) : (a || b);
    if (h !== false) {
      candidates.push({ height: h, width: false, depth: false });
    }
  }

  // 4. Standalone "N cm" — only if no HxW groups found
  if (candidates.length === 0) {
    while ((match = standaloneRegex.exec(s)) !== null) {
      const unit = /mm/i.test(match[0]) && !/cm/i.test(match[0]) ? 'mm' : 'cm';
      const h = parseNum(match[1], unit);
      if (h !== false) {
        candidates.push({ height: h, width: false, depth: false });
      }
    }
  }

  // 5. Bracketed or start-of-string "N cm" (e.g. "[23] cm", "24 cm + ...")
  if (candidates.length === 0) {
    const startMatch = s.match(new RegExp('^\\[?' + numPat + '\\]?\\s*(?:cm|mm|centimeters)', 'i'));
    if (startMatch) {
      const unit = /mm/i.test(startMatch[0]) && !/cm/i.test(startMatch[0]) ? 'mm' : 'cm';
      const h = parseNum(startMatch[1], unit);
      if (h !== false) {
        candidates.push({ height: h, width: false, depth: false });
      }
    }
  }

  if (candidates.length === 0) {
    return result;
  }

  // Pick the candidate with the largest height; on tie prefer more detail
  let best = candidates[0];
  for (let i = 1; i < candidates.length; i++) {
    const c = candidates[i];
    if (c.height > best.height) {
      best = c;
    } else if (c.height === best.height) {
      const bestFields = (best.width !== false ? 1 : 0) + (best.depth !== false ? 1 : 0);
      const cFields = (c.width !== false ? 1 : 0) + (c.depth !== false ? 1 : 0);
      if (cFields > bestFields) best = c;
    }
  }

  result.height = round(best.height);
  result.width = best.width !== false ? round(best.width) : false;
  result.depth = best.depth !== false ? round(best.depth) : false;
  result.size = classifySize(result.height);

  return result;
}

/**
 * Parse a number string, handling fractions like "3 1/2".
 * Converts mm to cm if unit is 'mm'.
 */
function parseNum(str, unit) {
  if (!str) return false;
  str = str.trim();
  // Handle "N M/D" fractional format like "18 1/2"
  const fracMatch = str.match(/^(\d+(?:\.\d+)?)\s+(\d+)\/(\d+)$/);
  if (fracMatch) {
    const whole = parseFloat(fracMatch[1]);
    const num = parseFloat(fracMatch[2]);
    const den = parseFloat(fracMatch[3]);
    let val = whole + num / den;
    if (unit === 'mm') val /= 10;
    return val;
  }
  const val = parseFloat(str);
  if (isNaN(val)) return false;
  return unit === 'mm' ? val / 10 : val;
}

function round(val) {
  return Math.round(val * 100) / 100;
}

function classifySize(heightCm) {
  if (heightCm === false) return false;
  if (heightCm < 23) return 'small';
  if (heightCm <= 30) return 'medium';
  if (heightCm <= 37) return 'large';
  return 'oversize';
}

export { parseDimensions };
