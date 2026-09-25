import { useState, useEffect } from 'react';
import {
  Users,
  Play,
  Sparkles,
  RotateCcw,
  Clock,
  Check,
  Copy,
  ExternalLink,
  ShieldCheck,
  FileText,
  AlertCircle,
  Eye,
  Settings2,
  Trash2,
  LogIn,
  Ban,
  ShieldAlert,
  HelpCircle,
  Lock,
  LogOut,
  KeyRound
} from 'lucide-react';
import { Follower, DrawSettings, DrawResult, CleaningReport, DrawHistoryRecord, DrawRules, DEFAULT_DRAW_RULES } from '../types/draw';
import { BrandLogo } from './BrandLogo';
import { BRAND } from '../constants/brand';
import {
  loadFollowers,
  cleanAndSaveFollowers,
  resetFollowersToDefault,
  clearFollowers,
  getSettings,
  updateSettings,
  updateDrawRules,
  getDrawResults,
  clearDraw,
  startDraw,
  publishResults,
  subscribeToDrawState,
  getLastCleaningReport,
  getDrawHistory,
  deleteDrawHistoryItem,
  clearDrawHistory,
  getAdminPassword,
  setAdminPassword,
} from '../services/drawService';
import { DrawReelModal } from './DrawReelModal';
import { CleaningReportCard } from './CleaningReportCard';
import { BlacklistManager } from './BlacklistManager';
import { DrawStatusDashboardCard } from './DrawStatusDashboardCard';
import { DrawHistoryTable } from './DrawHistoryTable';
import { DrawRulesSettings } from './DrawRulesSettings';
import { AdminWinnerCard } from './AdminWinnerCard';
import { fireTikTokGrandCelebration } from '../utils/confetti';

interface AdminViewProps {
  onGoToPublic: () => void;
  onLogout?: () => void;
}

export function AdminView({ onGoToPublic, onLogout }: AdminViewProps) {
  // Password change state
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [passwordFeedback, setPasswordFeedback] = useState<string | null>(null);

  // Admin Data State
  const [followers, setFollowers] = useState<Follower[]>([]);
  const [followerText, setFollowerText] = useState<string>('');
  const [settings, setSettings] = useState<DrawSettings>(getSettings());
  const [results, setResults] = useState<DrawResult[]>(getDrawResults());
  const [report, setReport] = useState<CleaningReport | null>(getLastCleaningReport());
  const [history, setHistory] = useState<DrawHistoryRecord[]>(getDrawHistory());

  // Feedback notifications
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string>('');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [copyAllSuccess, setCopyAllSuccess] = useState<boolean>(false);

  // Reel Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [pendingWinners, setPendingWinners] = useState<Follower[]>([]);
  const [pendingResults, setPendingResults] = useState<DrawResult[]>([]);

  // Load followers and sync
  const reloadData = () => {
    const list = loadFollowers();
    setFollowers(list);
    setFollowerText(list.map((f) => f.username).join('\n'));
    setSettings(getSettings());
    setResults(getDrawResults());
    setReport(getLastCleaningReport());
    setHistory(getDrawHistory());
  };

  useEffect(() => {
    reloadData();
    const unsubscribe = subscribeToDrawState(() => {
      setSettings(getSettings());
      setResults(getDrawResults());
      setReport(getLastCleaningReport());
      setHistory(getDrawHistory());
    });
    return () => unsubscribe();
  }, []);

  const handleDeleteHistoryRecord = (id: string) => {
    deleteDrawHistoryItem(id);
    setHistory(getDrawHistory());
    setSaveSuccessMessage('Çekiliş kaydı geçmişten silindi.');
    setTimeout(() => setSaveSuccessMessage(''), 2500);
  };

  const handleClearAllHistory = () => {
    clearDrawHistory();
    setHistory([]);
    setSaveSuccessMessage('Tüm çekiliş geçmişi temizlendi.');
    setTimeout(() => setSaveSuccessMessage(''), 2500);
  };

  const handleUpdateRules = (updated: Partial<DrawRules>) => {
    const updatedSettings = updateDrawRules(updated);
    setSettings(updatedSettings);
    setSaveSuccessMessage('Çekiliş kuralları ve katılım şartları güncellendi.');
    setTimeout(() => setSaveSuccessMessage(''), 2500);
  };

  const handleResetRules = () => {
    const updatedSettings = updateDrawRules(DEFAULT_DRAW_RULES);
    setSettings(updatedSettings);
    setSaveSuccessMessage('Çekiliş kuralları varsayılan değerlere sıfırlandı.');
    setTimeout(() => setSaveSuccessMessage(''), 2500);
  };

  // Handle follower text submission with automatic cleaning & deduplication
  const handleSaveFollowers = () => {
    const { followers: updated, report: newReport } = cleanAndSaveFollowers(followerText);
    setFollowers(updated);
    setFollowerText(updated.map((f) => f.username).join('\n'));
    setReport(newReport);
    setSaveSuccessMessage(
      `Liste temizlendi: ${newReport.eligibleCount.toLocaleString('tr-TR')} kuraya girecek kişi hazır!`
    );
    setTimeout(() => setSaveSuccessMessage(''), 3500);
  };

  const handleResetToDefault = () => {
    const def = resetFollowersToDefault();
    setFollowers(def);
    setFollowerText(def.map((f) => f.username).join('\n'));
    setReport(getLastCleaningReport());
    setSaveSuccessMessage('Örnek takipçi listesi (120 kişi) yüklendi ve doğrulandı.');
    setTimeout(() => setSaveSuccessMessage(''), 3000);
  };

  // Test dataset with duplicates, case variations, bad words, and invalid entries to demonstrate security
  const handleLoadSecurityTestData = () => {
    const testCases = [
      '@eren',
      '@eren',
      '@Eren',
      '@EREN',
      '   @eren   ',
      '@zeynep.vibes',
      'zeynep.vibes',
      '@burak.oz',
      '@melis.glow',
      '@caner_tech',
      '@ayse_nur99',
      '@fake_bot_spammer', // blacklisted
      '@orospu_fake_bot',  // profane
      'gecersiz kullanici!', // invalid (spaces and exclamation)
      '@mert_gaming',
      '@buse.daily',
      '@emre_fitness',
      '@irem_art'
    ];
    setFollowerText(testCases.join('\n'));
    const { followers: updated, report: newReport } = cleanAndSaveFollowers(testCases);
    setFollowers(updated);
    setFollowerText(updated.map((f) => f.username).join('\n'));
    setReport(newReport);
    setSaveSuccessMessage('Test verisi yüklendi ve güvenlik motoru tarafından temizlendi!');
    setTimeout(() => setSaveSuccessMessage(''), 4000);
  };

  const handleClearFollowers = () => {
    if (confirm('Tüm takipçi listesini temizlemek istediğinizden emin misiniz?')) {
      clearFollowers();
      setFollowers([]);
      setFollowerText('');
      setSaveSuccessMessage('Takipçi listesi temizlendi.');
      setTimeout(() => setSaveSuccessMessage(''), 3000);
    }
  };

  // Trigger draw with suspense reel animation
  // Automatically sanitizes, deduplicates, and ensures strict 1-ticket fairness
  const handleInitiateDraw = (isDemo: boolean = false) => {
    try {
      if (!followerText.trim() && followers.length === 0) {
        alert('Takipçi listesi boş! Lütfen önce takipçi ekleyin.');
        return;
      }

      // Automatically cleans and deduplicates whatever is in the textarea right now
      const { winners, results: newResults, report: newReport, cleanedFollowers } = startDraw(followerText || followers.map(f => f.username));

      // Synchronize state and UI immediately with the cleaned list
      setFollowers(cleanedFollowers);
      setFollowerText(cleanedFollowers.map((f) => f.username).join('\n'));
      setReport(newReport);

      if (cleanedFollowers.length < settings.winnerCount) {
        alert(`Temizleme sonrası kuraya katılabilecek ${cleanedFollowers.length} benzersiz takipçi kaldı. Kura için en az ${settings.winnerCount} kişi gereklidir.`);
        return;
      }

      if (newReport.duplicateCount > 0 || newReport.invalidCount > 0 || newReport.profaneCount > 0 || newReport.blacklistedCount > 0) {
        setSaveSuccessMessage(
          `Otomatik Temizleme: ${newReport.duplicateCount} mükerrer ve ${newReport.invalidCount + newReport.profaneCount + newReport.blacklistedCount} geçersiz kayıt ayıklandı. ${cleanedFollowers.length} benzersiz kullanıcı ile adil çekiliş başlatıldı!`
        );
        setTimeout(() => setSaveSuccessMessage(''), 4500);
      }

      // Execute reel animation with strictly unique eligible pool
      setPendingWinners(winners);
      setPendingResults(newResults);
      setIsModalOpen(true);
    } catch (err: unknown) {
      alert((err as Error).message || 'Kura başlatılırken bir hata oluştu.');
    }
  };

  // Called when reel animation completes
  const handleCompleteDrawReel = () => {
    publishResults(pendingResults);
    setResults(pendingResults);
    fireTikTokGrandCelebration();
  };

  // Clear draw results
  const handleClearDrawResults = () => {
    clearDraw();
    setResults([]);
    setSaveSuccessMessage('Mevcut kura sonuçları sıfırlandı. Sistem yeni kura için hazır.');
    setTimeout(() => setSaveSuccessMessage(''), 3000);
  };

  // Update draw time setting
  const handleTimeChange = (newTime: string) => {
    const updated = updateSettings({ drawTime: newTime });
    setSettings(updated);
  };

  // Preset time helpers
  const handleSetQuickPreset = (type: 'plus2' | '19:00' | '20:00' | '21:00') => {
    if (type === 'plus2') {
      const now = new Date();
      now.setMinutes(now.getMinutes() + 2);
      const hh = now.getHours().toString().padStart(2, '0');
      const mm = now.getMinutes().toString().padStart(2, '0');
      handleTimeChange(`${hh}:${mm}`);
    } else {
      handleTimeChange(type);
    }
  };

  // Copy single winner
  const handleCopyUsername = async (username: string, index: number) => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(username);
      } else {
        const input = document.createElement('input');
        input.value = username;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
      }
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch {
      alert(`Kullanıcı adı: ${username}`);
    }
  };

  // Copy formatted description for TikTok
  const handleCopyAllFormatted = async () => {
    if (results.length === 0) return;
    const text = `🎉 Bugünkü TikTok Kuramızın Kazananları: (@bilgi_xwrtxwrt)\n` +
      `🥇 Video 1: ${results[0]?.username || ''}\n` +
      `🥈 Video 2: ${results[1]?.username || ''}\n` +
      `🥉 Video 3: ${results[2]?.username || ''}\n\n` +
      `Tebrikler! Takip etmeye devam edin, sıradaki kura her gün ${settings.drawTime}'da!`;

    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
      }
      setCopyAllSuccess(true);
      setTimeout(() => setCopyAllSuccess(false), 2500);
    } catch {
      alert('Panoya kopyalanamadı.');
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-6 sm:py-8 space-y-6">
      {/* 
        ADMIN SAYFA SIRALAMASI:
        Logo + @bilgi_xwrtxwrt
        ↓
        Admin paneli
      */}
      <div className="flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80">
        <a
          href={BRAND.profileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2.5 group"
          title={`${BRAND.username} TikTok Profilini Aç`}
        >
          <BrandLogo size="sm" className="group-hover:scale-105 transition-transform" />
          <div className="min-w-0">
            <span className="text-xs sm:text-sm font-black text-white group-hover:text-[#25F4EE] transition-colors truncate block">
              {BRAND.username}
            </span>
            <span className="text-[10px] text-zinc-400 font-medium">
              Resmi TikTok Hesabı
            </span>
          </div>
          <ExternalLink className="w-3.5 h-3.5 text-zinc-400 group-hover:text-[#25F4EE] transition-colors ml-0.5" />
        </a>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => {
              setNewPasswordInput('');
              setPasswordFeedback(null);
              setIsPasswordModalOpen(true);
            }}
            className="min-h-[38px] px-3 py-1.5 rounded-xl bg-purple-950/40 hover:bg-purple-950/70 text-purple-300 hover:text-purple-200 border border-purple-800/60 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            title="Yönetici Giriş Şifresini Değiştir"
          >
            <KeyRound className="w-3.5 h-3.5 text-purple-400" />
            <span className="hidden sm:inline">Şifre Değiştir</span>
          </button>

          <button
            onClick={onGoToPublic}
            className="min-h-[38px] px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0"
          >
            <Eye className="w-3.5 h-3.5 text-[#25F4EE]" />
            <span className="hidden sm:inline">Kura Sayfası</span>
            <span className="sm:hidden">Sayfa</span>
          </button>

          {onLogout && (
            <button
              onClick={onLogout}
              className="min-h-[38px] px-3 py-1.5 rounded-xl bg-rose-950/40 hover:bg-rose-950/70 text-rose-300 hover:text-rose-200 border border-rose-900/60 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              title="Yönetici Oturumunu Kapat"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-400" />
              <span>Çıkış</span>
            </button>
          )}
        </div>
      </div>

      {/* Top Banner: Admin Dashboard */}
      <div className="flex items-center justify-between gap-3 pb-2 border-b border-zinc-800/80">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <h1 className="text-lg sm:text-xl font-black text-white tracking-tight">
              ADMIN DASHBOARD
            </h1>
            <span className="px-2 py-0.5 rounded-md bg-purple-950/60 border border-purple-800/60 text-purple-300 font-mono text-[10px] font-semibold">
              URL: /admin
            </span>
          </div>
          <p className="text-[11px] text-zinc-400 mt-0.5">
            Kura güvenliği, temizleme raporu, takipçi listesi ve çekiliş yönetimi
          </p>
        </div>
      </div>

      {/* Toast Notification */}
      {saveSuccessMessage && (
        <div className="p-3.5 rounded-2xl bg-emerald-950/60 border border-emerald-800/80 text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{saveSuccessMessage}</span>
        </div>
      )}

      {/* CANLI KATILIMCI & ÇEKİLİŞ DURUMU DASHBOARD KARTI (D3.JS GRAFİĞİ ENTEGRELİ) */}
      <DrawStatusDashboardCard
        followers={followers}
        settings={settings}
        results={results}
        report={report}
      />

      {/* PROMINENT METRIC BAR: UYGUNSUZ & ENGELLENEN KAYITLAR */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        <div className="p-3 rounded-2xl bg-zinc-900/90 border border-zinc-800">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
            Kuraya Girecek Kişi
          </span>
          <span className="text-xl sm:text-2xl font-extrabold text-[#25F4EE] font-mono tabular-nums">
            {followers.length.toLocaleString('tr-TR')}
          </span>
        </div>

        {/* 🚫 Uygunsuz/engellenen kayıtlar indicator */}
        <div className="p-3 rounded-2xl bg-zinc-900/90 border border-rose-950/70 bg-gradient-to-br from-rose-950/20 to-transparent">
          <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider block">
            🚫 Uygunsuz / Engellenen
          </span>
          <span className="text-xl sm:text-2xl font-extrabold text-rose-300 font-mono tabular-nums">
            {(report ? report.profaneCount + report.blacklistedCount : 0).toLocaleString('tr-TR')}
          </span>
        </div>

        <div className="p-3 rounded-2xl bg-zinc-900/90 border border-zinc-800 col-span-2 sm:col-span-1">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
            Tekrarlanan (Deduplicated)
          </span>
          <span className="text-xl sm:text-2xl font-extrabold text-amber-400 font-mono tabular-nums">
            {(report?.duplicateCount ?? 0).toLocaleString('tr-TR')}
          </span>
        </div>
      </div>

      {/* SONUÇ RAPORU CARD (If available) */}
      {report && <CleaningReportCard report={report} />}

      {/* 1. KURA AYARLARI CARD */}
      <div className="rounded-3xl bg-zinc-900/90 border border-zinc-800/80 p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#25F4EE]" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-200">
              Kura Ayarları
            </h2>
          </div>
          <span className="text-[11px] font-mono text-zinc-400">
            Durum: {settings.status === 'completed' ? 'Tamamlandı' : 'Beklemede'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Kura Saati */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-400 block">
              Kura Saati:
            </label>
            <input
              type="time"
              value={settings.drawTime}
              onChange={(e) => handleTimeChange(e.target.value)}
              className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-zinc-950 border border-zinc-700 text-white font-mono font-bold text-base focus:border-[#25F4EE] focus:ring-1 focus:ring-[#25F4EE] transition-colors"
            />
            {/* Quick time buttons */}
            <div className="flex items-center gap-1.5 pt-1 flex-wrap">
              <span className="text-[10px] text-zinc-400 font-medium mr-1">Hızlı:</span>
              <button
                onClick={() => handleSetQuickPreset('plus2')}
                className="text-[11px] px-2 py-1 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-mono transition-colors"
                title="Şu anki zamandan 2 dakika sonraya ayarla (test için)"
              >
                +2 Dk
              </button>
              <button
                onClick={() => handleSetQuickPreset('19:00')}
                className="text-[11px] px-2 py-1 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-mono transition-colors"
              >
                19:00
              </button>
              <button
                onClick={() => handleSetQuickPreset('20:00')}
                className="text-[11px] px-2 py-1 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-mono transition-colors"
              >
                20:00
              </button>
              <button
                onClick={() => handleSetQuickPreset('21:00')}
                className="text-[11px] px-2 py-1 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-mono transition-colors"
              >
                21:00
              </button>
            </div>
          </div>

          {/* Kazanan Sayısı */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-400 block">
              Kazanan Sayısı:
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                max="10"
                value={settings.winnerCount}
                onChange={(e) =>
                  updateSettings({ winnerCount: Math.max(1, parseInt(e.target.value) || 3) })
                }
                className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-zinc-950 border border-zinc-700 text-white font-mono font-bold text-base focus:border-[#25F4EE] focus:ring-1 focus:ring-[#25F4EE] transition-colors"
              />
              <span className="text-xs font-semibold text-zinc-400 whitespace-nowrap">
                Kişi (Video 1, 2, 3)
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 pt-1">
              Her kurada 3 farklı kişi seçilir ve aynı kişi tekrarlanamaz.
            </p>
          </div>
        </div>
      </div>

      {/* ÇEKİLİŞ KURALLARI VE KATILIM ŞARTLARI AYARLARI */}
      <DrawRulesSettings
        rules={settings.rules || DEFAULT_DRAW_RULES}
        onUpdateRules={handleUpdateRules}
        onResetRules={handleResetRules}
        drawTime={settings.drawTime}
      />

      {/* 2. KURA KONTROL BUTONLARI */}
      <div className="p-5 sm:p-6 rounded-3xl bg-zinc-900/90 border border-zinc-800/80 shadow-xl space-y-3">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#FE2C55]" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-200">
              Kura İşlemleri
            </h2>
          </div>
          <span className="text-xs text-zinc-400 font-mono">
            Kuraya Girecek: {followers.length.toLocaleString('tr-TR')} Kişi
          </span>
        </div>

        <p className="text-[11px] text-zinc-400">
          ⚡ <strong>Otomatik Temizleme Aktif:</strong> Butona bastığınızda liste anında taranır; tekrarlar (duplicate), küfürlü ve geçersiz satırlar ayıklanarak yalnızca benzersiz kullanıcılardan çekiliş yapılır.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {/* Main Draw Button */}
          <button
            onClick={() => handleInitiateDraw(false)}
            className="w-full min-h-[48px] px-5 py-3 rounded-2xl bg-gradient-to-r from-[#FE2C55] to-[#ff0050] hover:brightness-110 text-white font-black text-sm tracking-wide shadow-lg shadow-[#FE2C55]/25 flex items-center justify-center gap-2 active:scale-98 transition-all"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>KURAYI BAŞLAT</span>
          </button>

          {/* Instant Demo Draw */}
          <button
            onClick={() => handleInitiateDraw(true)}
            className="w-full min-h-[48px] px-5 py-3 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-zinc-100 font-bold text-sm tracking-wide border border-zinc-700 shadow-md flex items-center justify-center gap-2 active:scale-98 transition-all"
          >
            <Sparkles className="w-4 h-4 text-[#25F4EE]" />
            <span>DEMO KURASI YAP</span>
          </button>
        </div>

        {/* Clear Current Results Button */}
        {results.length > 0 && (
          <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between">
            <span className="text-xs text-zinc-400">
              Aktif kura sonuçları yayında.
            </span>
            <button
              onClick={handleClearDrawResults}
              className="text-xs font-semibold text-rose-400 hover:text-rose-300 px-3 py-1.5 rounded-lg bg-rose-950/30 hover:bg-rose-950/60 border border-rose-900/40 flex items-center gap-1.5 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>KURAYI TEMİZLE</span>
            </button>
          </div>
        )}
      </div>

      {/* 3. SON KURA SONUÇLARI CARD */}
      {results.length > 0 && (
        <div className="p-5 sm:p-6 rounded-3xl bg-zinc-900/90 border border-zinc-800/80 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
              <span>🎉</span>
              <span>SON KURA SONUÇLARI</span>
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={fireTikTokGrandCelebration}
                className="text-xs font-bold px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#FE2C55]/20 to-[#25F4EE]/20 hover:from-[#FE2C55]/30 hover:to-[#25F4EE]/30 text-white border border-[#25F4EE]/40 flex items-center gap-1.5 transition-all active:scale-95"
                title="Tüm ekranda TikTok konfeti kutlamasını patlat"
              >
                <span>🎉</span>
                <span className="hidden sm:inline">Kutlamayı Patlat</span>
              </button>

              <button
                onClick={handleCopyAllFormatted}
                className="text-xs font-bold px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 flex items-center gap-1.5 transition-colors"
              >
                {copyAllSuccess ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Kopyalandı!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-[#25F4EE]" />
                    <span>Toplu Kopyala</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {results.map((r, idx) => (
              <AdminWinnerCard key={r.id || idx} result={r} index={idx} />
            ))}
          </div>
        </div>
      )}

      {/* ÇEKİLİŞ GEÇMİŞİ TABLOSU */}
      <DrawHistoryTable
        history={history}
        onDeleteRecord={handleDeleteHistoryRecord}
        onClearHistory={handleClearAllHistory}
      />

      {/* 4. TAKİPÇİ LİSTESİ VE GÜVENLİK YÖNETİMİ */}
      <div className="p-5 sm:p-6 rounded-3xl bg-zinc-900/90 border border-zinc-800/80 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-[#25F4EE]" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-200">
              Takipçi Listesi (Otomatik Temizleme & Doğrulama)
            </h2>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {/* Kuraya girecek kişi sayısı */}
            <div className="px-3 py-1 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
              <span>Kuraya Girecek:</span>
              <span className="font-extrabold text-[#25F4EE] font-mono tabular-nums text-sm">
                {followers.length.toLocaleString('tr-TR')}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs text-zinc-400 leading-relaxed">
            Her satıra bir TikTok kullanıcı adı girin. Listeyi yüklediğinizde aynı kullanıcı adları (büyük/küçük harf duyarsız), küfürlü/uygunsuz ifadeler, geçersiz karakterler ve kara listedeki hesaplar <strong>otomatik olarak temizlenir</strong>.
          </p>

          <textarea
            rows={8}
            value={followerText}
            onChange={(e) => setFollowerText(e.target.value)}
            placeholder={`@ahmet\n@mehmet\n@zeynep\n@eren\n@ali\n@ayse`}
            className="w-full p-4 rounded-2xl bg-zinc-950 border border-zinc-800 text-zinc-200 font-mono text-xs sm:text-sm focus:border-[#25F4EE] focus:ring-1 focus:ring-[#25F4EE] transition-colors resize-y leading-relaxed"
          />
        </div>

        {/* Follower Actions */}
        <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-1">
          <button
            onClick={handleSaveFollowers}
            className="w-full sm:flex-1 min-h-[44px] px-5 py-2.5 rounded-xl bg-zinc-100 hover:bg-white text-zinc-950 font-extrabold text-xs uppercase tracking-wider shadow-md active:scale-98 transition-all flex items-center justify-center gap-1.5"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Takipçileri Temizle & Yükle</span>
          </button>

          <button
            onClick={handleResetToDefault}
            className="w-full sm:w-auto min-h-[44px] px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700 text-xs font-semibold transition-colors"
          >
            Örnek Liste (120 Kişi)
          </button>

          <button
            onClick={handleLoadSecurityTestData}
            className="w-full sm:w-auto min-h-[44px] px-3.5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-amber-300 border border-amber-800/40 text-xs font-semibold transition-colors"
            title="Deduplication ve filtreleme kurallarını test etmek için karışık veri yükle"
          >
            Filtre Testi Yükle
          </button>

          <button
            onClick={handleClearFollowers}
            className="w-full sm:w-auto min-h-[44px] px-3.5 py-2.5 rounded-xl bg-zinc-900/80 hover:bg-rose-950/40 text-rose-400 border border-zinc-800 hover:border-rose-900/60 text-xs font-semibold transition-colors"
            title="Listeyi Temizle"
          >
            <Trash2 className="w-4 h-4 mx-auto" />
          </button>
        </div>
      </div>

      {/* 5. KARA LİSTE BÖLÜMÜ */}
      <BlacklistManager onListUpdated={handleSaveFollowers} />

      {/* 6. ARCHITECTURAL / FAIRNESS NOTE */}
      <div className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800/60 text-left space-y-1.5 text-zinc-400">
        <span className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider block flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-[#25F4EE]" />
          <span>Kura Adaleti & Veri Güvenliği Protokolü</span>
        </span>
        <p className="text-[11px] leading-relaxed text-zinc-400">
          Kura algoritması yalnızca temizlenmiş benzersiz listeden seçim yapar. Bir kullanıcının listede 50 kez yer alması kazanma şansını asla artırmaz (tekil hak kuralı). Aynı kişi tek bir kura içerisinde birden fazla videoya seçilemez.
        </p>
      </div>

      {/* Reel suspense draw modal */}
      {isModalOpen && (
        <DrawReelModal
          candidates={followers}
          targetWinners={pendingWinners}
          onComplete={handleCompleteDrawReel}
          onClose={() => setIsModalOpen(false)}
        />
      )}

      {/* Password Change Modal */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-sm rounded-3xl bg-zinc-900 border border-zinc-800 p-6 shadow-2xl shadow-black space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-950/60 border border-purple-800/60 flex items-center justify-center">
                  <KeyRound className="w-4 h-4 text-purple-400" />
                </div>
                <h3 className="text-sm font-black text-white">Yönetici Şifresini Değiştir</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsPasswordModalOpen(false)}
                className="text-zinc-500 hover:text-white p-1 text-sm"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-zinc-400">
              Mevcut şifreniz: <code className="text-purple-300 font-mono bg-zinc-950 px-1.5 py-0.5 rounded border border-zinc-800">{getAdminPassword()}</code>. Dilediğiniz yeni bir şifre belirleyin:
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (newPasswordInput.trim().length < 4) {
                  setPasswordFeedback('Şifre en az 4 karakter uzunluğunda olmalıdır.');
                  return;
                }
                setAdminPassword(newPasswordInput.trim());
                setPasswordFeedback('✅ Şifreniz başarıyla kaydedildi!');
                setTimeout(() => {
                  setIsPasswordModalOpen(false);
                  setPasswordFeedback(null);
                  setNewPasswordInput('');
                }, 1200);
              }}
              className="space-y-3"
            >
              <input
                type="text"
                value={newPasswordInput}
                onChange={(e) => {
                  setNewPasswordInput(e.target.value);
                  setPasswordFeedback(null);
                }}
                placeholder="Yeni şifrenizi yazın..."
                className="w-full min-h-[44px] px-3.5 rounded-xl bg-zinc-950 border border-zinc-700 focus:border-purple-500 text-white font-mono text-sm outline-none"
                autoFocus
              />

              {passwordFeedback && (
                <p className={`text-xs ${passwordFeedback.startsWith('✅') ? 'text-emerald-400 font-bold' : 'text-rose-400'}`}>
                  {passwordFeedback}
                </p>
              )}

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="flex-1 py-2 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={!newPasswordInput.trim()}
                  className="flex-1 py-2 px-3 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white text-xs font-bold"
                >
                  Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
