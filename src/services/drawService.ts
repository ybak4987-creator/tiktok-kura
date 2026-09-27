import {
  Follower,
  DrawSettings,
  DrawResult,
  CleaningReport,
  DrawHistoryRecord,
  DrawRules,
  DEFAULT_DRAW_RULES,
} from '../types/draw';
import { containsInappropriateContent, isValidTikTokUsername, normalizeUsername } from '../utils/contentFilter';
import { adminLogin, adminLogout, adminSaveState, adminState, checkParticipant as remoteCheckParticipant, isSupabaseConfigured, joinParticipant as remoteJoinParticipant, publicState, renameParticipant as remoteRenameParticipant } from './supabaseApi';

const STORAGE_KEYS = {
  FOLLOWERS: 'tiktok_kura_followers_v3',
  SETTINGS: 'tiktok_kura_settings_v3',
  RESULTS: 'tiktok_kura_results_v3',
  BLACKLIST: 'tiktok_kura_blacklist_v3',
  REPORT: 'tiktok_kura_last_report_v3',
  HISTORY: 'tiktok_kura_history_v3',
  ADMIN_PASSWORD: 'tiktok_kura_admin_password_v3',
  ADMIN_SESSION: 'tiktok_kura_admin_session_v3',
};

const ADMIN_USERNAME_HASH = 'a40ae0e176327767c8b5df97682a1b298a39524a640eef9d5fff4af4ee20bd48';
const ADMIN_PASSWORD_HASH = 'a1917cfa80d56d8a1d45dd7fae9f1ad91ce96284e26068811ac1294965c86be8';

let remoteParticipantCount = 0;
let remoteAdminHydrated = false;
const ADMIN_TOKEN_KEY = 'tiktok_kura_admin_token_v3';
const CLAIM_TOKEN_KEY = 'tiktok_kura_claim_token_v3';

async function sha256(value: string): Promise<string> {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const data = new TextEncoder().encode(value);
    const digest = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('');
  }
  return '';
}

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

function getAdminToken(): string | null {
  try { return typeof window !== 'undefined' ? sessionStorage.getItem(ADMIN_TOKEN_KEY) : null; } catch { return null; }
}

async function persistAdminState() {
  if (!isSupabaseConfigured() || !remoteAdminHydrated) return;
  const token = getAdminToken();
  if (!token) return;
  try {
    await adminSaveState(token, {
      settings: getSettings(),
      results: getDrawResults(),
      history: getDrawHistory(),
      report: getLastCleaningReport(),
      followers: loadFollowers(),
      blacklist: getBlacklist(),
    });
  } catch (error) {
    console.error('Supabase admin state sync failed:', error);
  }
}

export async function hydrateFromSupabase(): Promise<void> {
  if (!isSupabaseConfigured() || (remoteAdminHydrated && isAdminSessionAuthenticated())) return;
  try {
    const state = await publicState();
    if (state.settings) safeSet(STORAGE_KEYS.SETTINGS, JSON.stringify(state.settings));
    if (state.results) safeSet(STORAGE_KEYS.RESULTS, JSON.stringify(state.results));
    if (state.history) safeSet(STORAGE_KEYS.HISTORY, JSON.stringify(state.history));
    remoteParticipantCount = Number(state.participantCount || 0);
    notifyListeners();
  } catch (error) {
    console.error('Supabase public state load failed:', error);
  }
}

export async function hydrateAdminFromSupabase(): Promise<void> {
  const token = getAdminToken();
  if (!isSupabaseConfigured() || !token) return;
  const state = await adminState(token);
  safeSet(STORAGE_KEYS.SETTINGS, JSON.stringify(state.settings || DEFAULT_SETTINGS));
  safeSet(STORAGE_KEYS.RESULTS, JSON.stringify(state.results || []));
  safeSet(STORAGE_KEYS.HISTORY, JSON.stringify(state.history || []));
  safeSet(STORAGE_KEYS.REPORT, JSON.stringify(state.report || null));
  safeSet(STORAGE_KEYS.FOLLOWERS, JSON.stringify(state.followers || []));
  safeSet(STORAGE_KEYS.BLACKLIST, JSON.stringify(state.blacklist || []));
  remoteParticipantCount = Array.isArray(state.followers) ? state.followers.length : 0;
  remoteAdminHydrated = true;
  notifyListeners();
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
    safeSet(STORAGE_KEYS.BLACKLIST, JSON.stringify([]));
    return [];
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
    void persistAdminState();
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
  void persistAdminState();
  notifyListeners();
  return updated;
}

export function clearBlacklist(): void {
  safeSet(STORAGE_KEYS.BLACKLIST, JSON.stringify([]));
  void persistAdminState();
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
  remoteParticipantCount = followers.length;
  safeSet(STORAGE_KEYS.REPORT, JSON.stringify(report));
  void persistAdminState();
  notifyListeners();

  return { followers, report };
}

/**
 * ADMIN API (Follower Management, Draw Triggers, Settings Configuration)
 */
export function loadFollowers(): Follower[] {
  const raw = safeGet(STORAGE_KEYS.FOLLOWERS);
  if (!raw) {
    safeSet(STORAGE_KEYS.FOLLOWERS, JSON.stringify([]));
    return [];
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

export function clearFollowers(): void {
  safeSet(STORAGE_KEYS.FOLLOWERS, JSON.stringify([]));
  remoteParticipantCount = 0;
  void persistAdminState();
  notifyListeners();
}

export function updateSettings(partial: Partial<DrawSettings>): DrawSettings {
  const current = getSettings();
  const updated: DrawSettings = {
    ...current,
    ...partial,
  };
  safeSet(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
  void persistAdminState();
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

/**
 * DRAW HISTORY MANAGEMENT (Çekiliş Geçmişi)
 */
export function getDrawHistory(): DrawHistoryRecord[] {
  const raw = safeGet(STORAGE_KEYS.HISTORY);
  if (!raw) return [];
  try {
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export function addDrawHistoryRecord(record: DrawHistoryRecord): void {
  const current = getDrawHistory();
  // Prepend latest draw to the beginning
  const updated = [record, ...current.filter((item) => item.id !== record.id)];
  safeSet(STORAGE_KEYS.HISTORY, JSON.stringify(updated));
  void persistAdminState();
  notifyListeners();
}

export function deleteDrawHistoryItem(id: string): void {
  const current = getDrawHistory();
  const updated = current.filter((item) => item.id !== id);
  safeSet(STORAGE_KEYS.HISTORY, JSON.stringify(updated));
  void persistAdminState();
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

  void persistAdminState();
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
 * Executes a real draw from the current eligible follower list.
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
 * ADMIN AUTHENTICATION
 * Credentials are never rendered in the UI. The login verifies SHA-256 hashes.
 */
export async function verifyAdminCredentials(username: string, password: string): Promise<boolean> {
  if (!username.trim() || !password) return false;
  if (isSupabaseConfigured()) {
    try {
      const result = await adminLogin(username, password);
      if (result?.success && result?.token) {
        try { sessionStorage.setItem(ADMIN_TOKEN_KEY, result.token); } catch {}
        remoteAdminHydrated = false;
        await hydrateAdminFromSupabase();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Supabase admin login failed:', error);
      return false;
    }
  }
  const normalizedUsername = username.trim().toLowerCase();
  const [usernameHash, passwordHash] = await Promise.all([sha256(normalizedUsername), sha256(password)]);
  return usernameHash === ADMIN_USERNAME_HASH && passwordHash === ADMIN_PASSWORD_HASH;
}

export function isAdminSessionAuthenticated(): boolean {
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      return window.sessionStorage.getItem(STORAGE_KEYS.ADMIN_SESSION) === 'true';
    }
  } catch {}
  return memoryStore[STORAGE_KEYS.ADMIN_SESSION] === 'true';
}

export function setAdminSessionAuthenticated(authenticated: boolean): void {
  const token = getAdminToken();
  if (!authenticated && token && isSupabaseConfigured()) void adminLogout(token).catch(() => {});
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      if (authenticated) window.sessionStorage.setItem(STORAGE_KEYS.ADMIN_SESSION, 'true');
      else {
        window.sessionStorage.removeItem(STORAGE_KEYS.ADMIN_SESSION);
        window.sessionStorage.removeItem(ADMIN_TOKEN_KEY);
      }
    }
  } catch {}
  memoryStore[STORAGE_KEYS.ADMIN_SESSION] = authenticated ? 'true' : 'false';
  if (!authenticated) remoteAdminHydrated = false;
  notifyListeners();
}

/**
 * PUBLIC PARTICIPANT REGISTRATION (Kuraya Katıl)
 */
export function getParticipantCount(): number {
  return isSupabaseConfigured() && !remoteAdminHydrated ? remoteParticipantCount : loadFollowers().length;
}

export async function checkParticipantStatus(rawUsername: string): Promise<{
  isRegistered: boolean;
  normalizedUsername: string;
  message: string;
}> {
  const trimmed = rawUsername.trim();
  const normalized = trimmed ? normalizeUsername(trimmed.startsWith('@') ? trimmed : '@' + trimmed) : '';
  if (!normalized) return { isRegistered: false, normalizedUsername: '', message: 'Lütfen kullanıcı adınızı girin.' };
  if (isSupabaseConfigured()) {
    try { return await remoteCheckParticipant(normalized); }
    catch { return { isRegistered: false, normalizedUsername: normalized, message: 'Katılım bilgisi alınamadı. Lütfen tekrar deneyin.' }; }
  }
  const followers = loadFollowers();
  const exists = followers.some((f) => f.username.toLowerCase() === normalized.toLowerCase());
  return {
    isRegistered: exists,
    normalizedUsername: normalized,
    message: exists ? `${normalized} çekiliş listesinde kayıtlı. 1 çekiliş hakkınız aktif.` : `${normalized} henüz kuraya katılmamış.`,
  };
}

export async function joinDraw(rawUsername: string): Promise<{
  success: boolean; message: string; alreadyJoined?: boolean; follower?: Follower; claimToken?: string;
}> {
  const trimmed = rawUsername.trim();
  if (!trimmed) return { success: false, message: 'Lütfen TikTok kullanıcı adınızı yazın.' };
  const formatted = trimmed.startsWith('@') ? trimmed : '@' + trimmed;
  if (!isValidTikTokUsername(formatted)) return { success: false, message: 'Geçersiz TikTok kullanıcı adı.' };
  if (containsInappropriateContent(formatted)) return { success: false, message: 'Uygunsuz veya kural dışı kullanıcı adı kabul edilemez.' };
  const normalized = normalizeUsername(formatted);
  if (isSupabaseConfigured()) {
    try {
      const result = await remoteJoinParticipant(normalized);
      if (!result.success) return { success: false, alreadyJoined: true, message: result.message, follower: result.follower };
      remoteParticipantCount += 1;
      try { localStorage.setItem(CLAIM_TOKEN_KEY, result.claimToken); } catch {}
      notifyListeners();
      return result;
    } catch (error) {
      console.error('Supabase join failed:', error);
      return { success: false, message: 'Katılım kaydedilemedi. Lütfen tekrar deneyin.' };
    }
  }
  const blacklist = getBlacklist();
  if (blacklist.some((u) => u.toLowerCase() === normalized.toLowerCase())) return { success: false, message: 'Bu kullanıcı adı kuraya katılım için engellenmiştir.' };
  const current = loadFollowers();
  const existing = current.find((f) => f.username.toLowerCase() === normalized.toLowerCase());
  if (existing) return { success: false, alreadyJoined: true, message: `${normalized} bu kuraya zaten kayıtlı!`, follower: existing };
  const newFollower: Follower = { id: `f_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`, username: normalized };
  const updated = [newFollower, ...current];
  safeSet(STORAGE_KEYS.FOLLOWERS, JSON.stringify(updated));
  remoteParticipantCount = updated.length;
  notifyListeners();
  return { success: true, message: `Tebrikler ${normalized}! Kuraya başarıyla katıldınız. 1 çekiliş hakkınız havuza eklendi!`, follower: newFollower };
}

export async function updateParticipantUsername(oldUsername: string, newUsername: string): Promise<{ success: boolean; message: string; follower?: Follower }> {
  const oldNormalized = normalizeUsername(oldUsername.startsWith('@') ? oldUsername : `@${oldUsername}`);
  const newNormalized = normalizeUsername(newUsername.trim().startsWith('@') ? newUsername.trim() : `@${newUsername.trim()}`);
  if (!newUsername.trim()) return { success: false, message: 'Yeni kullanıcı adınızı yazın.' };
  if (!isValidTikTokUsername(newNormalized)) return { success: false, message: 'Geçersiz TikTok kullanıcı adı.' };
  if (containsInappropriateContent(newNormalized)) return { success: false, message: 'Uygunsuz kullanıcı adı kabul edilemez.' };
  if (isSupabaseConfigured()) {
    let claimToken = '';
    try { claimToken = localStorage.getItem(CLAIM_TOKEN_KEY) || ''; } catch {}
    if (!claimToken) return { success: false, message: 'Bu cihazdaki katılım doğrulaması bulunamadı. Lütfen aynı cihazdan devam edin.' };
    try {
      const result = await remoteRenameParticipant(oldNormalized, newNormalized, claimToken);
      if (!result.success) return { success: false, message: result.error || 'Kullanıcı adı güncellenemedi.' };
      const local = loadFollowers().filter((f) => f.username.toLowerCase() !== oldNormalized.toLowerCase());
      local.unshift(result.follower);
      safeSet(STORAGE_KEYS.FOLLOWERS, JSON.stringify(local));
      notifyListeners();
      return result;
    } catch (error) {
      console.error('Supabase rename failed:', error);
      return { success: false, message: 'İsim düzeltilemedi. Lütfen tekrar deneyin.' };
    }
  }
  const current = loadFollowers();
  const index = current.findIndex((f) => f.username.toLowerCase() === oldNormalized.toLowerCase());
  if (index === -1) return { success: false, message: 'Mevcut kullanıcı adınız bulunamadı.' };
  const duplicate = current.some((f, i) => i !== index && f.username.toLowerCase() === newNormalized.toLowerCase());
  if (duplicate) return { success: false, message: 'Bu kullanıcı adı zaten kuraya kayıtlı.' };
  if (getBlacklist().some((u) => u.toLowerCase() === newNormalized.toLowerCase())) return { success: false, message: 'Bu kullanıcı adı kuraya katılım için engellenmiştir.' };
  const updated = [...current];
  const follower = { ...updated[index], username: newNormalized };
  updated[index] = follower;
  safeSet(STORAGE_KEYS.FOLLOWERS, JSON.stringify(updated));
  notifyListeners();
  return { success: true, message: `Kullanıcı adınız ${newNormalized} olarak güncellendi.`, follower };
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
