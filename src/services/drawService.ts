import {
  Follower,
  DrawSettings,
  DrawResult,
  CleaningReport,
  DrawHistoryRecord,
  DrawRules,
  DEFAULT_DRAW_RULES,
} from '../types/draw';
import { DEFAULT_SAMPLE_FOLLOWERS } from './mockFollowers';
import { containsInappropriateContent, isValidTikTokUsername, normalizeUsername } from '../utils/contentFilter';

const STORAGE_KEYS = {
  FOLLOWERS: 'tiktok_kura_followers_v1',
  SETTINGS: 'tiktok_kura_settings_v1',
  RESULTS: 'tiktok_kura_results_v1',
  BLACKLIST: 'tiktok_kura_blacklist_v1',
  REPORT: 'tiktok_kura_last_report_v1',
  HISTORY: 'tiktok_kura_history_v1',
  ADMIN_PASSWORD: 'tiktok_kura_admin_password_v1',
  ADMIN_SESSION: 'tiktok_kura_admin_session_v1',
};

const DEFAULT_ADMIN_PASSWORD = 'admin123';

// Initial default settings
const DEFAULT_SETTINGS: DrawSettings = {
  drawTime: '19:00',
  winnerCount: 3,
  status: 'idle',
  autoDrawEnabled: true,
  rules: { ...DEFAULT_DRAW_RULES },
};

type Listener = () => void;
const listeners = new Set<Listener>();

function notifyListeners() {
  listeners.forEach((l) => {
    try {
      l();
    } catch (err) {
      console.error('Listener notification error:', err);
    }
  });
}

/**
 * Storage helpers with memory fallback
 */
const memoryStore: Record<string, string> = {};

function safeGet(key: string): string | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem(key);
    }
  } catch {
    // Local storage unavailable
  }
  return memoryStore[key] || null;
}

function safeSet(key: string, value: string): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, value);
    }
  } catch {
    // Local storage unavailable
  }
  memoryStore[key] = value;
}

/**
 * Cryptographically secure random integer in [0, max - 1]
 */
function getRandomInt(max: number): number {
  if (max <= 0) return 0;
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    const array = new Uint32Array(1);
    window.crypto.getRandomValues(array);
    return array[0] % max;
  }
  return Math.floor(Math.random() * max);
}

/**
 * Normalizes username (ensures @, removes whitespace, lowercase)
 */
export function sanitizeUsername(raw: string): string {
  return normalizeUsername(raw);
}

/**
 * PUBLIC API (For Public View)
 * Note: loadFollowers is intentionally NOT in the public API contract to maintain follower privacy.
 */
export function getSettings(): DrawSettings {
  const raw = safeGet(STORAGE_KEYS.SETTINGS);
  if (!raw) {
    safeSet(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
    return { ...DEFAULT_SETTINGS, rules: { ...DEFAULT_DRAW_RULES } };
  }
  try {
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      rules: {
        ...DEFAULT_DRAW_RULES,
        ...(parsed.rules || {}),
      },
    };
  } catch {
    return { ...DEFAULT_SETTINGS, rules: { ...DEFAULT_DRAW_RULES } };
  }
}

export function updateDrawRules(rules: Partial<DrawRules>): DrawSettings {
  const current = getSettings();
  const updatedRules: DrawRules = {
    ...(current.rules || DEFAULT_DRAW_RULES),
    ...rules,
  };
  return updateSettings({ rules: updatedRules });
}

export function getDrawResults(): DrawResult[] {
  const raw = safeGet(STORAGE_KEYS.RESULTS);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

/**
 * BLACKLIST MANAGEMENT (Kara Liste)
 */
export function getBlacklist(): string[] {
  const raw = safeGet(STORAGE_KEYS.BLACKLIST);
  if (!raw) {
    // Pre-populate with a couple of demo bot/spammer usernames for easy visual testing
    const defaultBlacklist = ['@fake_bot_spammer', '@reklam_hesabi'];
    safeSet(STORAGE_KEYS.BLACKLIST, JSON.stringify(defaultBlacklist));
    return defaultBlacklist;
  }
  try {
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export function addToBlacklist(rawUsername: string): string[] {
  const username = normalizeUsername(rawUsername);
  if (!username || username === '@') return getBlacklist();

  const current = getBlacklist();
  if (!current.includes(username)) {
    const updated = [...current, username];
    safeSet(STORAGE_KEYS.BLACKLIST, JSON.stringify(updated));
    notifyListeners();
    return updated;
  }
  return current;
}

export function removeFromBlacklist(username: string): string[] {
  const normalized = normalizeUsername(username);
  const current = getBlacklist();
  const updated = current.filter((u) => u.toLowerCase() !== normalized.toLowerCase());
  safeSet(STORAGE_KEYS.BLACKLIST, JSON.stringify(updated));
  notifyListeners();
  return updated;
}

export function clearBlacklist(): void {
  safeSet(STORAGE_KEYS.BLACKLIST, JSON.stringify([]));
  notifyListeners();
}

/**
 * CLEANING & REPORTING ENGINE
 */
export function getLastCleaningReport(): CleaningReport | null {
  const raw = safeGet(STORAGE_KEYS.REPORT);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Fully cleans and sanitizes follower input:
 * 1. Duplicate check (case-insensitive, trims spaces)
 * 2. Inappropriate / Profanity filter
 * 3. Invalid characters & length check (auto-adds @)
 * 4. Blacklist exclusion
 * 5. Guarantees each unique user has exactly 1 entry in the draw pool
 */
export function cleanAndSaveFollowers(input: string[] | string): {
  followers: Follower[];
  report: CleaningReport;
} {
  const rawLines = Array.isArray(input) ? input : input.split('\n');
  const blacklistSet = new Set(getBlacklist().map((u) => u.toLowerCase()));

  let totalInputLines = 0;
  let duplicateCount = 0;
  let profaneCount = 0;
  let invalidCount = 0;
  let blacklistedCount = 0;

  const seen = new Set<string>();
  const followers: Follower[] = [];
  const sampleExcluded: CleaningReport['sampleExcluded'] = [];

  rawLines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed) return; // ignore pure whitespace empty lines

    totalInputLines++;

    // Ensure @ prefix for evaluation
    let formatted = trimmed;
    if (!formatted.startsWith('@')) {
      formatted = '@' + formatted;
    }

    // 1. Invalid username check
    if (!isValidTikTokUsername(formatted)) {
      invalidCount++;
      if (sampleExcluded.length < 10) {
        sampleExcluded.push({ username: trimmed, reason: 'invalid' });
      }
      return;
    }

    // 2. Inappropriate / Profane content check
    if (containsInappropriateContent(formatted)) {
      profaneCount++;
      if (sampleExcluded.length < 10) {
        sampleExcluded.push({ username: formatted, reason: 'profane' });
      }
      return;
    }

    const normalized = normalizeUsername(formatted);

    // 3. Blacklist check
    if (blacklistSet.has(normalized)) {
      blacklistedCount++;
      if (sampleExcluded.length < 10) {
        sampleExcluded.push({ username: formatted, reason: 'blacklisted' });
      }
      return;
    }

    // 4. Duplicate check (Case-insensitive)
    if (seen.has(normalized)) {
      duplicateCount++;
      if (sampleExcluded.length < 10) {
        sampleExcluded.push({ username: formatted, reason: 'duplicate' });
      }
      return;
    }

    // Clean, unique, eligible record
    seen.add(normalized);
    followers.push({
      id: `f_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      username: normalized,
    });
  });

  const report: CleaningReport = {
    totalInputLines,
    uniqueUsers: seen.size,
    duplicateCount,
    profaneCount,
    invalidCount,
    blacklistedCount,
    eligibleCount: followers.length,
    timestamp: new Date().toISOString(),
    sampleExcluded,
  };

  safeSet(STORAGE_KEYS.FOLLOWERS, JSON.stringify(followers));
  safeSet(STORAGE_KEYS.REPORT, JSON.stringify(report));
  notifyListeners();

  return { followers, report };
}

/**
 * ADMIN API (Follower Management, Draw Triggers, Settings Configuration)
 */
export function loadFollowers(): Follower[] {
  const raw = safeGet(STORAGE_KEYS.FOLLOWERS);
  if (!raw) {
    // Seed with cleaned realistic default followers
    const { followers } = cleanAndSaveFollowers(DEFAULT_SAMPLE_FOLLOWERS);
    return followers;
  }
  try {
    const list: Follower[] = JSON.parse(raw);
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export function saveFollowers(input: string[] | string): Follower[] {
  const { followers } = cleanAndSaveFollowers(input);
  return followers;
}

export function resetFollowersToDefault(): Follower[] {
  const { followers } = cleanAndSaveFollowers(DEFAULT_SAMPLE_FOLLOWERS);
  return followers;
}

export function clearFollowers(): void {
  safeSet(STORAGE_KEYS.FOLLOWERS, JSON.stringify([]));
  notifyListeners();
}

export function updateSettings(partial: Partial<DrawSettings>): DrawSettings {
  const current = getSettings();
  const updated: DrawSettings = {
    ...current,
    ...partial,
  };
  safeSet(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
  notifyListeners();
  return updated;
}

/**
 * Selects N unique random winners from the followers pool.
 * Draw Fairness Guaranteed:
 * - Each unique follower has exactly 1 entry.
 * - Same user cannot be selected multiple times.
 * - Cryptographically random selection when available.
 */
export function selectWinners(count: number, followers: Follower[]): Follower[] {
  if (followers.length === 0) return [];
  
  // Double-verify absolute uniqueness: Map keyed by lowercased username
  const uniquePoolMap = new Map<string, Follower>();
  for (const f of followers) {
    const key = f.username.toLowerCase();
    if (!uniquePoolMap.has(key)) {
      uniquePoolMap.set(key, f);
    }
  }

  const pool = Array.from(uniquePoolMap.values());
  const winners: Follower[] = [];
  const needed = Math.min(count, pool.length);

  for (let i = 0; i < needed; i++) {
    const randomIndex = getRandomInt(pool.length);
    const selected = pool.splice(randomIndex, 1)[0];
    winners.push(selected);
  }

  return winners;
}

const DEFAULT_HISTORY_RECORDS: DrawHistoryRecord[] = [
  {
    id: 'hist_20260924_1900',
    drawDate: '2026-09-24T19:00:00.000Z',
    drawTime: '19:00',
    totalEligibleCount: 120,
    status: 'completed',
    title: 'Akşam Canlı Yayın Kurası',
    winners: [
      { videoNumber: 1, username: '@burak.yilmaz' },
      { videoNumber: 2, username: '@gamze_celik' },
      { videoNumber: 3, username: '@ali_ozturk' },
    ],
  },
  {
    id: 'hist_20260923_1900',
    drawDate: '2026-09-23T19:00:00.000Z',
    drawTime: '19:00',
    totalEligibleCount: 114,
    status: 'completed',
    title: 'Akşam Canlı Yayın Kurası',
    winners: [
      { videoNumber: 1, username: '@zeynep_demir' },
      { videoNumber: 2, username: '@emre_arslan' },
      { videoNumber: 3, username: '@merve_sahin' },
    ],
  },
  {
    id: 'hist_20260922_1900',
    drawDate: '2026-09-22T19:00:00.000Z',
    drawTime: '19:00',
    totalEligibleCount: 108,
    status: 'completed',
    title: 'Hafta Başı Takipçi Çekilişi',
    winners: [
      { videoNumber: 1, username: '@ayse_kaya' },
      { videoNumber: 2, username: '@berkay_koc' },
      { videoNumber: 3, username: '@fatma_yildiz' },
    ],
  },
];

/**
 * DRAW HISTORY MANAGEMENT (Çekiliş Geçmişi)
 */
export function getDrawHistory(): DrawHistoryRecord[] {
  const raw = safeGet(STORAGE_KEYS.HISTORY);
  if (!raw) {
    safeSet(STORAGE_KEYS.HISTORY, JSON.stringify(DEFAULT_HISTORY_RECORDS));
    return DEFAULT_HISTORY_RECORDS;
  }
  try {
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list : DEFAULT_HISTORY_RECORDS;
  } catch {
    return DEFAULT_HISTORY_RECORDS;
  }
}

export function addDrawHistoryRecord(record: DrawHistoryRecord): void {
  const current = getDrawHistory();
  // Prepend latest draw to the beginning
  const updated = [record, ...current.filter((item) => item.id !== record.id)];
  safeSet(STORAGE_KEYS.HISTORY, JSON.stringify(updated));
  notifyListeners();
}

export function deleteDrawHistoryItem(id: string): void {
  const current = getDrawHistory();
  const updated = current.filter((item) => item.id !== id);
  safeSet(STORAGE_KEYS.HISTORY, JSON.stringify(updated));
  notifyListeners();
}

export function clearDrawHistory(): void {
  safeSet(STORAGE_KEYS.HISTORY, JSON.stringify([]));
  notifyListeners();
}

/**
 * Publishes results to public-accessible state
 */
export function publishResults(results: DrawResult[]): void {
  safeSet(STORAGE_KEYS.RESULTS, JSON.stringify(results));
  const settings = getSettings();
  const eligibleCount = loadFollowers().length;
  updateSettings({ status: 'completed', lastDrawAt: new Date().toISOString() });

  // Record into draw history automatically
  if (results && results.length > 0) {
    const historyItem: DrawHistoryRecord = {
      id: `hist_${Date.now()}`,
      drawDate: new Date().toISOString(),
      drawTime: settings.drawTime || '19:00',
      totalEligibleCount: eligibleCount,
      status: 'completed',
      title: 'Canlı Takipçi Kurası',
      winners: results.map((r) => ({
        videoNumber: r.videoNumber,
        username: r.username,
      })),
    };
    addDrawHistoryRecord(historyItem);
  }

  notifyListeners();
}

/**
 * Clears current draw results and sets status back to idle
 */
export function clearDraw(): void {
  safeSet(STORAGE_KEYS.RESULTS, JSON.stringify([]));
  updateSettings({ status: 'idle' });
  notifyListeners();
}

/**
 * Executes a draw (either scheduled or demo).
 * Automatically cleans and deduplicates the input list if provided,
 * ensuring each unique user has exactly 1 ticket in the draw.
 */
export function startDraw(input?: string | string[] | Follower[]): {
  winners: Follower[];
  results: DrawResult[];
  report: CleaningReport;
  cleanedFollowers: Follower[];
} {
  let cleanedFollowers: Follower[];
  let report: CleaningReport;

  if (typeof input === 'string' || (Array.isArray(input) && typeof input[0] === 'string')) {
    // Clean raw text input
    const cleanResult = cleanAndSaveFollowers(input as string | string[]);
    cleanedFollowers = cleanResult.followers;
    report = cleanResult.report;
  } else {
    // If no input or array of Follower objects passed, re-verify existing storage
    const currentFollowers = loadFollowers();
    const usernames = currentFollowers.map((f) => f.username);
    const cleanResult = cleanAndSaveFollowers(usernames);
    cleanedFollowers = cleanResult.followers;
    report = cleanResult.report;
  }

  // Blacklist secondary barrier
  const blacklistSet = new Set(getBlacklist().map((u) => u.toLowerCase()));

  // Absolute uniqueness & single-ticket guarantee
  const uniquePoolMap = new Map<string, Follower>();
  for (const f of cleanedFollowers) {
    const norm = f.username.toLowerCase();
    if (!blacklistSet.has(norm) && !uniquePoolMap.has(norm)) {
      uniquePoolMap.set(norm, f);
    }
  }

  const eligibleFollowers = Array.from(uniquePoolMap.values());

  if (eligibleFollowers.length === 0) {
    throw new Error('Kuraya katılabilecek uygun takipçi bulunamadı! Lütfen geçerli TikTok kullanıcı adları ekleyin.');
  }

  const settings = getSettings();
  const winnerCount = Math.max(1, settings.winnerCount || 3);

  if (eligibleFollowers.length < winnerCount) {
    throw new Error(
      `Kuraya girecek benzersiz takipçi sayısı (${eligibleFollowers.length}), seçilecek kazanan sayısından (${winnerCount}) az olamaz.`
    );
  }

  // Draw strictly from the unique pool
  const selectedFollowers = selectWinners(winnerCount, eligibleFollowers);

  const results: DrawResult[] = selectedFollowers.map((follower, index) => ({
    id: `draw_${Date.now()}_${index + 1}`,
    username: follower.username,
    videoNumber: index + 1,
    createdAt: new Date().toISOString(),
  }));

  return {
    winners: selectedFollowers,
    results,
    report,
    cleanedFollowers: eligibleFollowers,
  };
}

/**
 * ADMIN PASSWORD & AUTHENTICATION MANAGEMENT
 */
export function getAdminPassword(): string {
  const custom = safeGet(STORAGE_KEYS.ADMIN_PASSWORD);
  return custom && custom.trim() ? custom.trim() : DEFAULT_ADMIN_PASSWORD;
}

export function setAdminPassword(newPassword: string): boolean {
  if (!newPassword || newPassword.trim().length < 4) {
    return false;
  }
  safeSet(STORAGE_KEYS.ADMIN_PASSWORD, newPassword.trim());
  return true;
}

export function verifyAdminPassword(password: string): boolean {
  const current = getAdminPassword();
  return password.trim() === current;
}

export function isAdminSessionAuthenticated(): boolean {
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      return window.sessionStorage.getItem(STORAGE_KEYS.ADMIN_SESSION) === 'true';
    }
  } catch {
    // fallback
  }
  return memoryStore[STORAGE_KEYS.ADMIN_SESSION] === 'true';
}

export function setAdminSessionAuthenticated(authenticated: boolean): void {
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      if (authenticated) {
        window.sessionStorage.setItem(STORAGE_KEYS.ADMIN_SESSION, 'true');
      } else {
        window.sessionStorage.removeItem(STORAGE_KEYS.ADMIN_SESSION);
      }
    }
  } catch {
    // fallback
  }
  memoryStore[STORAGE_KEYS.ADMIN_SESSION] = authenticated ? 'true' : 'false';
  notifyListeners();
}

/**
 * PUBLIC PARTICIPANT REGISTRATION (Kuraya Katıl)
 */
export function getParticipantCount(): number {
  return loadFollowers().length;
}

export function checkParticipantStatus(rawUsername: string): {
  isRegistered: boolean;
  normalizedUsername: string;
  message: string;
} {
  const trimmed = rawUsername.trim();
  if (!trimmed) {
    return { isRegistered: false, normalizedUsername: '', message: 'Lütfen kullanıcı adınızı girin.' };
  }
  let formatted = trimmed.startsWith('@') ? trimmed : '@' + trimmed;
  const normalized = normalizeUsername(formatted);
  const followers = loadFollowers();
  const exists = followers.some((f) => f.username.toLowerCase() === normalized.toLowerCase());

  return {
    isRegistered: exists,
    normalizedUsername: normalized,
    message: exists
      ? `✅ ${normalized} çekiliş listesinde kayıtlı! 1 çekiliş hakkınız aktiftir.`
      : `ℹ️ ${normalized} henüz kuraya katılmamış. Aşağıdan hemen katılabilirsiniz!`,
  };
}

export function joinDraw(rawUsername: string): {
  success: boolean;
  message: string;
  alreadyJoined?: boolean;
  follower?: Follower;
} {
  const trimmed = rawUsername.trim();
  if (!trimmed) {
    return { success: false, message: 'Lütfen TikTok kullanıcı adınızı yazın.' };
  }

  let formatted = trimmed;
  if (!formatted.startsWith('@')) {
    formatted = '@' + formatted;
  }

  // 1. TikTok username syntax check
  if (!isValidTikTokUsername(formatted)) {
    return {
      success: false,
      message: 'Geçersiz TikTok kullanıcı adı! (2-24 karakter, yalnızca harf, rakam, nokta ve altçizgi içerebilir)',
    };
  }

  // 2. Profanity / Inappropriate content filter
  if (containsInappropriateContent(formatted)) {
    return {
      success: false,
      message: 'Uygunsuz veya kural dışı kullanıcı adı kabul edilemez.',
    };
  }

  const normalized = normalizeUsername(formatted);

  // 3. Blacklist check
  const blacklist = getBlacklist();
  if (blacklist.some((u) => u.toLowerCase() === normalized.toLowerCase())) {
    return {
      success: false,
      message: 'Bu kullanıcı adı kuraya katılım için engellenmiştir.',
    };
  }

  // 4. Duplicate check against existing pool
  const current = loadFollowers();
  const existing = current.find((f) => f.username.toLowerCase() === normalized.toLowerCase());

  if (existing) {
    return {
      success: false,
      alreadyJoined: true,
      message: `${normalized} bu kuraya zaten kayıtlı! Kural gereği 1 kişi = 1 çekiliş hakkı geçerlidir. Kura listesindesiniz!`,
      follower: existing,
    };
  }

  // 5. Add new follower to the pool
  const newFollower: Follower = {
    id: `f_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    username: normalized,
  };

  const updated = [newFollower, ...current];
  safeSet(STORAGE_KEYS.FOLLOWERS, JSON.stringify(updated));

  // Synchronize report count
  const lastReport = getLastCleaningReport();
  if (lastReport) {
    lastReport.eligibleCount = updated.length;
    lastReport.uniqueUsers = updated.length;
    safeSet(STORAGE_KEYS.REPORT, JSON.stringify(lastReport));
  }

  notifyListeners();

  return {
    success: true,
    message: `🎉 Tebrikler ${normalized}! Kuraya başarıyla katıldınız. 1 çekiliş hakkınız havuza eklendi!`,
    follower: newFollower,
  };
}

/**
 * State subscription hook for UI components
 */
export function subscribeToDrawState(callback: Listener): () => void {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}
