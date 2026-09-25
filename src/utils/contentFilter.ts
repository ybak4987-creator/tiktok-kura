/**
 * Content filter & TikTok username sanitizer.
 * Enforces controlled profanity checks without blocking innocent Turkish or global names.
 */

// Explicit offensive roots (Turkish & English slang)
const PROFANE_PATTERNS: RegExp[] = [
  // Explicit profanity roots
  /(?:^|[^a-z0-9])(?:orospu|kahpe|pezevenk|pic|yavsak|ibne|gotlek|yarrak|yarak|tasak|amk|aq|sik(?:is|ik|er|me)?|siktir|amcik|memeucu|porn|porno|anal|fuck|bitch|whore|nigger|cunt|slut)(?:[^a-z0-9]|$)/i,
  // Compound common vulgar patterns
  /(?:orospucocugu|ananisikeyim|sikik|amkcocuk|gotveren|gotluk|sikis)/i,
];

/**
 * Checks if a username contains explicitly inappropriate / profane terms.
 * Carefully avoids false positives for standard Turkish names like:
 * 'aslan', 'berk', 'can', 'samet', 'damla', 'gamze', 'murat', 'kasım', 'erdem', etc.
 */
export function containsInappropriateContent(rawUsername: string): boolean {
  const clean = rawUsername.replace(/^@/, '').toLowerCase().trim();
  if (!clean) return false;

  // Exact matches or targeted regex test
  for (const pattern of PROFANE_PATTERNS) {
    if (pattern.test(clean)) {
      return true;
    }
  }

  return false;
}

/**
 * TikTok username validity validator.
 * Rules:
 * - Can contain letters (a-z, A-Z), numbers (0-9), periods (.), and underscores (_)
 * - Cannot contain spaces, emojis, or punctuation symbols like !, ?, $, %, #, *, <, >, etc.
 * - Length (after @): 2 to 30 characters
 */
export function isValidTikTokUsername(rawUsername: string): boolean {
  const clean = rawUsername.replace(/^@/, '').trim();
  
  // Length check: 2 to 30 characters
  if (clean.length < 2 || clean.length > 30) {
    return false;
  }

  // Must only contain letters, digits, underscores, and periods
  const validRegex = /^[a-zA-Z0-9_.]+$/;
  return validRegex.test(clean);
}

/**
 * Normalizes username to standard format: lowercased, trimmed, prefixed with @.
 */
export function normalizeUsername(raw: string): string {
  let cleaned = raw.trim().replace(/\s+/g, '');
  if (!cleaned) return '';
  if (!cleaned.startsWith('@')) {
    cleaned = '@' + cleaned;
  }
  return cleaned.toLowerCase();
}
