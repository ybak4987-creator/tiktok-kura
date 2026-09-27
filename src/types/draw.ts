export interface Follower {
  id: string;
  username: string;
}

export type DrawStatus = 'idle' | 'drawing' | 'completed';

export interface DrawRules {
  requireFollowing: boolean; // Yalnızca takipçiler katılabilsin
  commentDeadlineMinutes: number; // Yorum süresi (kura öncesi dk, 0 = kura anına kadar)
  requireVideoLike: boolean; // Videoyu beğenme şartı
  minTagsRequired: number; // Yorumda arkadaş etiketleme (0 = zorunsuz)
  oneTicketPerPerson: boolean; // 1 kişi = 1 hak kuralı (tekilleştirme)
  filterSpamBots: boolean; // Şüpheli bot hesap filtresi
  backupWinnerCount: number; // Yedek talihli sayısı
  claimWindowHours: number; // Hak talep süresi (saat)
  customRulesNote: string; // Özel açıklama / kural notu
}

export const DEFAULT_DRAW_RULES: DrawRules = {
  requireFollowing: true,
  commentDeadlineMinutes: 30, // Kura saatinden 30 dk öncesine kadar yapılan yorumlar geçerlidir
  requireVideoLike: true,
  minTagsRequired: 0,
  oneTicketPerPerson: true,
  filterSpamBots: true,
  backupWinnerCount: 3,
  claimWindowHours: 24,
  customRulesNote: 'Kazananlar 24 saat içinde DM ile iletişime geçmelidir. Yanıt alınamazsa video hakkı sıradaki talihliye devredilir.',
};

export interface DrawSettings {
  drawTime: string; // "19:00"
  winnerCount: number; // default 3
  status: DrawStatus;
  autoDrawEnabled: boolean;
  lastDrawAt?: string;
  rules?: DrawRules;
}

export interface DrawResult {
  id: string;
  username: string;
  videoNumber: number; // 1, 2, 3
  createdAt: string;
}

export interface DrawHistoryWinner {
  videoNumber: number;
  username: string;
}

export interface DrawHistoryRecord {
  id: string;
  drawDate: string; // ISO date string or formatted
  drawTime: string; // e.g. "19:00"
  winners: DrawHistoryWinner[];
  totalEligibleCount?: number;
  status: 'completed' | 'archived';
  title?: string;
}

export interface CleaningReport {
  totalInputLines: number;      // Toplam kayıt
  uniqueUsers: number;          // Benzersiz kullanıcı
  duplicateCount: number;       // Tekrarlanan kayıt
  profaneCount: number;         // Uygunsuz kayıt
  invalidCount: number;         // Geçersiz kayıt
  blacklistedCount: number;     // Kara listedeki kayıt
  eligibleCount: number;        // Kuraya girecek kişi
  timestamp: string;
  sampleExcluded?: {
    username: string;
    reason: 'duplicate' | 'profane' | 'invalid' | 'blacklisted';
  }[];
}

export interface DrawState {
  settings: DrawSettings;
  results: DrawResult[];
  // followers are stored separately so they can never be leaked to public consumers
}
