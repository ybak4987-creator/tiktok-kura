import { useState } from 'react';
import {
  Sliders,
  Users,
  Clock,
  Heart,
  Tag,
  ShieldCheck,
  Bot,
  RotateCcw,
  Check,
  Copy,
  Info,
  ChevronDown,
  ChevronUp,
  FileText,
  AlertCircle
} from 'lucide-react';
import { DrawRules, DEFAULT_DRAW_RULES } from '../types/draw';

interface DrawRulesSettingsProps {
  rules: DrawRules;
  onUpdateRules: (updated: Partial<DrawRules>) => void;
  onResetRules: () => void;
  drawTime: string;
}

export function DrawRulesSettings({
  rules,
  onUpdateRules,
  onResetRules,
  drawTime,
}: DrawRulesSettingsProps) {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [copiedSummary, setCopiedSummary] = useState<boolean>(false);

  // Compute calculated cutoff time based on drawTime and commentDeadlineMinutes
  const getCutoffTimeDisplay = () => {
    if (!rules.commentDeadlineMinutes || rules.commentDeadlineMinutes === 0) {
      return `Kura anına kadar (${drawTime || '19:00'})`;
    }
    const [hh, mm] = (drawTime || '19:00').split(':').map(Number);
    const date = new Date();
    date.setHours(hh || 19, mm || 0, 0, 0);
    date.setMinutes(date.getMinutes() - rules.commentDeadlineMinutes);
    const cutoffHH = date.getHours().toString().padStart(2, '0');
    const cutoffMM = date.getMinutes().toString().padStart(2, '0');
    return `${cutoffHH}:${cutoffMM} (Kura saatinden ${rules.commentDeadlineMinutes} dk önce)`;
  };

  // Generate clean formatted text for TikTok video caption / pinned comment
  const generateRulesSummaryText = () => {
    return [
      '📌 TİKTOK KURA KATILIM KURALLARI & ŞARTLARI',
      '----------------------------------------',
      rules.requireFollowing ? '✅ @bilgi_xwrtxwrt hesabını takip ediyor olmak zorunludur.' : '⚪ Takip şartı aranmaz.',
      rules.requireVideoLike ? '✅ Kura videosunu beğenmiş olmak zorunludur.' : '',
      rules.minTagsRequired > 0
        ? `✅ Yorumda en az ${rules.minTagsRequired} arkadaşını etiketlemiş olmak gerekir.`
        : '',
      `⏱️ Son Yorum Kabulü: ${getCutoffTimeDisplay()}`,
      rules.oneTicketPerPerson ? '🎟️ 1 Kişi = 1 Hak (Mükerrer yorumlar şansı artırmaz).' : '',
      rules.filterSpamBots ? '🛡️ Bot ve sahte hesaplar otomatik elenir.' : '',
      `🏆 Asil Kazanan: 3 Kişi (3 Video Hakkı)`,
      rules.backupWinnerCount > 0 ? `👥 Yedek Talihli: ${rules.backupWinnerCount} Kişi` : '',
      `⏳ Hak Talep Süresi: ${rules.claimWindowHours} Saat içinde DM ile iletişim`,
      rules.customRulesNote ? `ℹ️ Not: ${rules.customRulesNote}` : '',
    ]
      .filter(Boolean)
      .join('\n');
  };

  const handleCopySummary = async () => {
    try {
      const text = generateRulesSummaryText();
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
      }
      setCopiedSummary(true);
      setTimeout(() => setCopiedSummary(false), 2500);
    } catch (err) {
      console.warn('Copy failed:', err);
    }
  };

  return (
    <div className="rounded-3xl bg-zinc-900/90 border border-zinc-800/80 p-5 sm:p-6 shadow-xl space-y-4">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800/80">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#25F4EE]/10 border border-[#25F4EE]/30 flex items-center justify-center text-[#25F4EE]">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-black uppercase tracking-wider text-white">
                Çekiliş Kuralları & Katılım Şartları
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-emerald-950/70 border border-emerald-800 text-[10px] font-mono text-emerald-300 font-bold">
                Canlı Ayarlar
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              Takip zorunluluğu, son yorum süresi, etiketleme ve güvenlik filtrelerini yapılandırın
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={handleCopySummary}
            className="text-xs font-bold px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 flex items-center gap-1.5 transition-colors"
            title="TikTok video açıklaması veya sabitlenen yorum için kuralları kopyala"
          >
            {copiedSummary ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Kopyalandı!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-[#25F4EE]" />
                <span>Kuralları Kopyala</span>
              </>
            )}
          </button>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
            title={isExpanded ? 'Menüyü Daralt' : 'Menüyü Genişlet'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Collapsible Rule Controls */}
      {isExpanded && (
        <div className="space-y-4 pt-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {/* 1. YALNIZCA TAKİPÇİLER ŞARTI */}
            <div className="p-4 rounded-2xl bg-zinc-950/70 border border-zinc-800/80 flex items-start justify-between gap-3">
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#25F4EE]" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    Yalnızca Takipçiler
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  Katılımcıların resmi hesabı takip ediyor olması şart koşulur.
                </p>
                <span className="text-[10px] font-mono text-[#25F4EE] block">
                  {rules.requireFollowing ? '✓ Takip Şartı Aktif' : '○ Herkes Katılabilir'}
                </span>
              </div>

              <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-0.5">
                <input
                  type="checkbox"
                  checked={rules.requireFollowing}
                  onChange={(e) => onUpdateRules({ requireFollowing: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#25F4EE]"></div>
              </label>
            </div>

            {/* 2. VİDEO BEĞENME ŞARTI */}
            <div className="p-4 rounded-2xl bg-zinc-950/70 border border-zinc-800/80 flex items-start justify-between gap-3">
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Heart className="w-4 h-4 text-[#FE2C55]" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    Video Beğeni Şartı
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  Kura videosunun beğenilmiş olması katılım kriteri sayılır.
                </p>
                <span className="text-[10px] font-mono text-rose-400 block">
                  {rules.requireVideoLike ? '✓ Beğeni Zorunlu' : '○ Beğeni İsteğe Bağlı'}
                </span>
              </div>

              <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-0.5">
                <input
                  type="checkbox"
                  checked={rules.requireVideoLike}
                  onChange={(e) => onUpdateRules({ requireVideoLike: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#FE2C55]"></div>
              </label>
            </div>

            {/* 3. YORUM SÜRESİ & SON KATILIM ZAMANI */}
            <div className="p-4 rounded-2xl bg-zinc-950/70 border border-zinc-800/80 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    Yorum Kabul Süresi
                  </span>
                </div>
                <span className="text-[11px] font-mono font-bold text-amber-300">
                  {rules.commentDeadlineMinutes === 0
                    ? 'Kura Anına Kadar'
                    : `-${rules.commentDeadlineMinutes} Dk Önce`}
                </span>
              </div>

              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Kura saatinden kaç dakika öncesine kadar yapılan yorumlar geçerlidir?
              </p>

              {/* Preset buttons */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {[
                  { value: 0, label: '0 Dk (Tam Saat)' },
                  { value: 15, label: '15 Dk Önce' },
                  { value: 30, label: '30 Dk Önce' },
                  { value: 60, label: '1 Saat Önce' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => onUpdateRules({ commentDeadlineMinutes: opt.value })}
                    className={`text-[11px] px-2.5 py-1 rounded-lg font-mono font-medium transition-all ${
                      rules.commentDeadlineMinutes === opt.value
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-sm'
                        : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              <div className="p-2 rounded-xl bg-zinc-900/60 border border-zinc-800 text-[10px] font-mono text-zinc-300 flex items-center gap-2">
                <Info className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Hesaplanan Kesilme Saati: {getCutoffTimeDisplay()}</span>
              </div>
            </div>

            {/* 4. ARKADAŞ ETİKETLEME KURALI */}
            <div className="p-4 rounded-2xl bg-zinc-950/70 border border-zinc-800/80 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-purple-400" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    Arkadaş Etiketleme
                  </span>
                </div>
                <span className="text-[11px] font-mono font-bold text-purple-300">
                  {rules.minTagsRequired === 0 ? 'Zorunsuz' : `En Az ${rules.minTagsRequired} Etiket`}
                </span>
              </div>

              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Yorumda etiketlenmesi gereken minimum arkadaş sayısı.
              </p>

              {/* Tag options */}
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { value: 0, label: 'Serbest' },
                  { value: 1, label: '1 Kişi' },
                  { value: 2, label: '2 Kişi' },
                  { value: 3, label: '3 Kişi' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => onUpdateRules({ minTagsRequired: opt.value })}
                    className={`text-center py-1.5 px-2 rounded-lg font-mono text-xs transition-all ${
                      rules.minTagsRequired === opt.value
                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/50 font-bold'
                        : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              <span className="text-[10px] text-zinc-500 block">
                {rules.minTagsRequired === 0
                  ? 'Sadece yorum atan herkes dahil edilir.'
                  : `Yorumunda @ arkadaşı olmayanlar listeden otomatik filtrelenir.`}
              </span>
            </div>

            {/* 5. GÜVENLİK & TEKİL HAK GARANTİSİ */}
            <div className="p-4 rounded-2xl bg-zinc-950/70 border border-zinc-800/80 flex items-start justify-between gap-3">
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    1 Kişi = 1 Hak Garantisi
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  Aynı kullanıcı 100 defa yazsa dahi kuraya tek 1 biletle girer.
                </p>
                <span className="text-[10px] font-mono text-emerald-400 block">
                  ✓ Adil Kura Algoritması Devrede
                </span>
              </div>

              <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-0.5">
                <input
                  type="checkbox"
                  checked={rules.oneTicketPerPerson}
                  onChange={(e) => onUpdateRules({ oneTicketPerPerson: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>

            {/* 6. BOT VE SPAM HESAP FİLTRESİ */}
            <div className="p-4 rounded-2xl bg-zinc-950/70 border border-zinc-800/80 flex items-start justify-between gap-3">
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Bot className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    Bot & Sahte Profil Filtresi
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  Şüpheli bot isimleri, küfürlü kelimeler ve kara liste hesaplarını eler.
                </p>
                <span className="text-[10px] font-mono text-cyan-400 block">
                  {rules.filterSpamBots ? '✓ Akıllı Filtre Devrede' : '○ Filtre Pasif'}
                </span>
              </div>

              <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-0.5">
                <input
                  type="checkbox"
                  checked={rules.filterSpamBots}
                  onChange={(e) => onUpdateRules({ filterSpamBots: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
              </label>
            </div>

            {/* 7. YEDEK TALİHLİ VE İLETİŞİM SÜRESİ */}
            <div className="p-4 rounded-2xl bg-zinc-950/70 border border-zinc-800/80 space-y-2.5 md:col-span-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Yedek talihli sayısı */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-300 block uppercase tracking-wider">
                    Yedek Talihli Sayısı:
                  </label>
                  <div className="flex items-center gap-2">
                    {[0, 1, 2, 3].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => onUpdateRules({ backupWinnerCount: num })}
                        className={`flex-1 py-1.5 rounded-xl font-mono text-xs font-bold transition-all ${
                          rules.backupWinnerCount === num
                            ? 'bg-zinc-100 text-zinc-950 shadow-sm'
                            : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
                        }`}
                      >
                        {num === 0 ? 'Yok' : `${num} Yedek`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Hak talep süresi */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-300 block uppercase tracking-wider">
                    DM İletişim / Talep Süresi:
                  </label>
                  <div className="flex items-center gap-2">
                    {[12, 24, 48, 72].map((hours) => (
                      <button
                        key={hours}
                        type="button"
                        onClick={() => onUpdateRules({ claimWindowHours: hours })}
                        className={`flex-1 py-1.5 rounded-xl font-mono text-xs font-bold transition-all ${
                          rules.claimWindowHours === hours
                            ? 'bg-[#25F4EE] text-zinc-950 shadow-sm'
                            : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
                        }`}
                      >
                        {hours}s
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* 8. ÖZEL KURAL / CANLI YAYIN METNİ */}
            <div className="p-4 rounded-2xl bg-zinc-950/70 border border-zinc-800/80 space-y-2 md:col-span-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5 uppercase tracking-wider">
                  <FileText className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Özel Kural & Canlı Yayın Açıklama Notu:</span>
                </label>
                <span className="text-[10px] text-zinc-500 font-mono">
                  Takipçilere duyurulacak not
                </span>
              </div>
              <textarea
                rows={2}
                value={rules.customRulesNote}
                onChange={(e) => onUpdateRules({ customRulesNote: e.target.value })}
                placeholder="Örn: Kazananlar 24 saat içinde DM ile iletişime geçmelidir. Yanıt alınamazsa video hakkı sıradaki yedek talihliye geçer."
                className="w-full p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 placeholder-zinc-500 focus:border-[#25F4EE] focus:ring-1 focus:ring-[#25F4EE] transition-colors resize-y leading-relaxed"
              />
            </div>
          </div>

          {/* Reset to defaults footer */}
          <div className="pt-2 flex items-center justify-between border-t border-zinc-800/60">
            <span className="text-[11px] text-zinc-500">
              Yapılan değişiklikler anında kaydedilir ve kura kontrol motoruna yansır.
            </span>

            <button
              onClick={onResetRules}
              className="text-[11px] px-3 py-1.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800 flex items-center gap-1.5 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Varsayılan Kurallara Dön</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
