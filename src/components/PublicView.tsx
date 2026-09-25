import { useState, useEffect } from 'react';
import { Video, Share2, Check, ExternalLink, ShieldCheck, Clock, Users, Heart } from 'lucide-react';
import { DrawSettings, DrawResult } from '../types/draw';
import { getSettings, getDrawResults, subscribeToDrawState } from '../services/drawService';
import { CountdownTimer } from './CountdownTimer';
import { WinnerCard } from './WinnerCard';
import { BrandLogo } from './BrandLogo';
import { BRAND } from '../constants/brand';
import { JoinDrawCard } from './JoinDrawCard';

interface PublicViewProps {
  onGoToAdmin?: () => void;
}

export function PublicView({ onGoToAdmin }: PublicViewProps) {
  const [settings, setSettings] = useState<DrawSettings>(getSettings());
  const [results, setResults] = useState<DrawResult[]>(getDrawResults());
  const [shareCopied, setShareCopied] = useState(false);

  useEffect(() => {
    // Subscribe to state changes from admin
    const unsubscribe = subscribeToDrawState(() => {
      setSettings(getSettings());
      setResults(getDrawResults());
    });
    return () => unsubscribe();
  }, []);

  const isCompleted = settings.status === 'completed' && results.length > 0;

  const handleShare = async () => {
    const text = isCompleted
      ? `🎉 TikTok Kura Kazananları Belli Oldu! (@bilgi_xwrtxwrt)\n🥇 Video 1: ${results[0]?.username || ''}\n🥈 Video 2: ${results[1]?.username || ''}\n🥉 Video 3: ${results[2]?.username || ''}`
      : `🎁 ${BRAND.username} TikTok Kuramız ${settings.drawTime}'da çekilecek! Şansını yakala!`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: `${BRAND.username} - TIKTOK KURA`,
          text,
          url: window.location.href,
        });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
        setShareCopied(true);
        setTimeout(() => setShareCopied(false), 2000);
      }
    } catch {
      // User cancelled share
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto px-4 py-5 sm:py-7 space-y-6">
      {/* ================= 1. MARKA & LOGO ALANI ================= */}
      <div className="flex flex-col items-center justify-center text-center space-y-2 pt-1">
        <a
          href={BRAND.profileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="group block transition-transform duration-200 active:scale-95"
          title={`${BRAND.username} TikTok Profilini Aç`}
        >
          <BrandLogo size="lg" className="group-hover:scale-105 transition-transform" />
        </a>

        <div className="space-y-0.5">
          <a
            href={BRAND.profileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm sm:text-base font-black text-white hover:text-[#25F4EE] transition-colors"
          >
            <span>{BRAND.username}</span>
            <ExternalLink className="w-3.5 h-3.5 text-[#25F4EE]" />
          </a>
          <p className="text-[11px] text-zinc-400 font-medium">
            Resmi TikTok Takipçi Kura Portalı
          </p>
        </div>
      </div>

      {/* ================= 2. BAŞLIK ================= */}
      <div className="text-center space-y-1.5">
        <div className="inline-flex items-center justify-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-xs font-semibold text-zinc-300">
          <span>{isCompleted ? '🎉' : '🎁'}</span>
          <span>TIKTOK KURASI</span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          {isCompleted ? 'KURA TAMAMLANDI' : 'VİDEO HAKLARI ÇEKİLİŞİ'}
        </h1>

        <p className="text-xs text-zinc-400 max-w-xs mx-auto leading-relaxed">
          {isCompleted
            ? '3 şanslı takipçimiz seçildi ve videolarımda paylaşılacaktır!'
            : 'Her kura saatinde 3 farklı takipçimiz seçilip videolarımda etiketlenecektir.'}
        </p>
      </div>

      {/* ================= 2.5. TAKİPÇİ KURAYA KATILIM KARTI ================= */}
      <JoinDrawCard />

      {/* ================= 3. KURA DURUMU & GERİ SAYIM / KAZANANLAR ================= */}
      {!isCompleted ? (
        /* ================= PRE-DRAW / WAITING STATE ================= */
        <div className="space-y-5">
          {/* Schedule & Countdown Card */}
          <div className="rounded-3xl bg-zinc-900/90 border border-zinc-800/80 p-5 sm:p-6 shadow-2xl shadow-black/60 relative overflow-hidden text-center">
            <div className="absolute -top-16 -left-16 w-32 h-32 bg-[#FE2C55]/10 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -bottom-16 -right-16 w-32 h-32 bg-[#25F4EE]/10 rounded-full blur-2xl pointer-events-none" />

            {/* Next draw time callout */}
            <div className="mb-5 pb-5 border-b border-zinc-800/80">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-1">
                Bir Sonraki Kura
              </span>
              <div className="inline-flex items-center gap-2">
                <span className="text-3xl sm:text-4xl font-extrabold text-white font-mono tabular-nums tracking-tight">
                  {settings.drawTime || '19:00'}
                </span>
                <span className="text-xs font-bold text-[#25F4EE] px-2 py-0.5 rounded-md bg-[#25F4EE]/10 border border-[#25F4EE]/20">
                  Bugün
                </span>
              </div>
            </div>

            {/* Live Countdown */}
            <CountdownTimer
              targetTimeStr={settings.drawTime || '19:00'}
              isActive={settings.status === 'idle'}
            />

            <div className="mt-5 pt-4 border-t border-zinc-800/80">
              <div className="flex items-center justify-center gap-2 text-xs font-medium text-zinc-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Kura çekilişi saatinde yönetici tarafından canlı yayında gerçekleştirilecektir.</span>
              </div>
            </div>
          </div>

          {/* Reward Distribution Explanation */}
          <div className="rounded-2xl bg-zinc-900/50 border border-zinc-800/60 p-4 sm:p-5">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-300 mb-3">
              <Video className="w-4 h-4 text-[#25F4EE]" />
              <span>Kura Ödül Dağılımı</span>
            </div>

            <div className="space-y-2.5">
              <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/70">
                <div className="flex items-center gap-2.5">
                  <span className="text-lg">🥇</span>
                  <span className="text-xs font-semibold text-zinc-200">1. Seçilen Takipçi</span>
                </div>
                <span className="text-xs font-bold text-amber-300 font-mono">Video 1</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/70">
                <div className="flex items-center gap-2.5">
                  <span className="text-lg">🥈</span>
                  <span className="text-xs font-semibold text-zinc-200">2. Seçilen Takipçi</span>
                </div>
                <span className="text-xs font-bold text-[#25F4EE] font-mono">Video 2</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/70">
                <div className="flex items-center gap-2.5">
                  <span className="text-lg">🥉</span>
                  <span className="text-xs font-semibold text-zinc-200">3. Seçilen Takipçi</span>
                </div>
                <span className="text-xs font-bold text-[#FE2C55] font-mono">Video 3</span>
              </div>
            </div>
          </div>

          {/* Official Participation Rules Card (Dinamik Kural Bilgilendirmesi) */}
          {settings.rules && (
            <div className="rounded-2xl bg-zinc-900/40 border border-zinc-800/60 p-4 sm:p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#25F4EE]" />
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                    Katılım Şartları & Kurallar
                  </span>
                </div>
                <span className="text-[10px] font-mono text-zinc-400 bg-zinc-950 px-2 py-0.5 rounded-full border border-zinc-800">
                  Resmi Şartlar
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {/* Rule 1: Takip */}
                <div className="p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800/80 flex items-center gap-2.5">
                  <Users className="w-3.5 h-3.5 text-[#25F4EE] shrink-0" />
                  <span className="text-zinc-300">
                    {settings.rules.requireFollowing ? 'Yalnızca Takipçiler Geçerlidir' : 'Takip Şartı Yoktur'}
                  </span>
                </div>

                {/* Rule 2: Yorum Süresi */}
                <div className="p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800/80 flex items-center gap-2.5">
                  <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="text-zinc-300">
                    {settings.rules.commentDeadlineMinutes === 0
                      ? 'Kura anına kadar yapılan yorumlar'
                      : `Kura saatinden ${settings.rules.commentDeadlineMinutes} dk önceki yorumlar`}
                  </span>
                </div>

                {/* Rule 3: 1 Kişi = 1 Hak */}
                <div className="p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800/80 flex items-center gap-2.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="text-zinc-300">1 Kişi = Tam 1 Çekiliş Hakkı</span>
                </div>

                {/* Rule 4: Video Beğenisi */}
                <div className="p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800/80 flex items-center gap-2.5">
                  <Heart className="w-3.5 h-3.5 text-[#FE2C55] shrink-0" />
                  <span className="text-zinc-300">
                    {settings.rules.requireVideoLike ? 'Video Beğenisi Zorunludur' : 'Beğeni İsteğe Bağlıdır'}
                  </span>
                </div>
              </div>

              {settings.rules.customRulesNote && (
                <p className="text-[11px] text-zinc-400 font-mono bg-zinc-950/50 p-2.5 rounded-xl border border-zinc-800/60 leading-relaxed">
                  ℹ️ {settings.rules.customRulesNote}
                </p>
              )}
            </div>
          )}
        </div>
      ) : (
        /* ================= COMPLETED DRAW STATE ================= */
        <div className="space-y-4">
          {/* Logo & Brand in Results Banner */}
          <div className="p-3 rounded-2xl bg-zinc-900/70 border border-zinc-800 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <BrandLogo size="sm" />
              <div>
                <a
                  href={BRAND.profileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-bold text-white hover:text-[#25F4EE] block"
                >
                  {BRAND.username}
                </a>
                <span className="text-[10px] text-zinc-400">Resmi Kura Sonucu</span>
              </div>
            </div>
            <span className="text-[10px] font-bold text-emerald-400 px-2 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-800">
              Onaylandı ✓
            </span>
          </div>

          <div className="flex items-center justify-between px-1 pt-1">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Kazanan Takipçiler
            </span>
            <span className="text-xs text-zinc-400 font-mono">
              {results.length} Kişi Seçildi
            </span>
          </div>

          {/* Winner Cards */}
          <div className="space-y-3">
            {results.map((result, idx) => (
              <WinnerCard key={result.id || idx} result={result} index={idx} />
            ))}
          </div>

          {/* Next Draw Countdown after completion */}
          <div className="mt-6 p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 text-center">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block mb-1">
              Sıradaki Kura Hazırlığı
            </span>
            <p className="text-xs text-zinc-300">
              Yeni kura saati: <span className="font-bold text-white font-mono">{settings.drawTime}</span>
            </p>
          </div>
        </div>
      )}

      {/* ================= 4. BELİRGİN "TIKTOK HESABINA GİT" BUTONU ================= */}
      <div className="pt-1">
        <a
          href={BRAND.profileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full min-h-[48px] py-3.5 px-6 rounded-2xl bg-gradient-to-r from-[#FE2C55] via-[#ff0050] to-[#25F4EE] hover:brightness-110 text-white font-extrabold text-sm tracking-wide shadow-xl shadow-[#FE2C55]/20 flex items-center justify-center gap-2.5 active:scale-[0.98] transition-all"
        >
          <BrandLogo size="sm" className="w-6 h-6 border border-white/20" />
          <span>TikTok Hesabına Git</span>
          <ExternalLink className="w-4 h-4 ml-0.5" />
        </a>
      </div>

      {/* Secondary Actions: Share */}
      <div className="flex flex-col sm:flex-row items-center gap-2.5">
        <button
          onClick={handleShare}
          className="w-full min-h-[44px] px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 font-semibold text-xs tracking-wide flex items-center justify-center gap-2 active:scale-95 transition-all"
        >
          {shareCopied ? (
            <>
              <Check className="w-4 h-4 text-emerald-400" />
              <span>Kura Bilgisi Kopyalandı</span>
            </>
          ) : (
            <>
              <Share2 className="w-4 h-4 text-zinc-400" />
              <span>Arkadaşlarınla Paylaş</span>
            </>
          )}
        </button>
      </div>

      {/* ================= 5. SAYFA ALTI BİLGİ & TIKTOK HESABI ================= */}
      <div className="text-center pt-3 pb-2 border-t border-zinc-900 space-y-1.5">
        <p className="text-xs text-zinc-400">
          TikTok:{' '}
          <a
            href={BRAND.profileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-zinc-200 font-bold hover:text-[#25F4EE] transition-colors underline underline-offset-4"
          >
            {BRAND.username}
          </a>
        </p>
        <p className="text-[11px] text-zinc-400">
          🔒 Şeffaf ve adil kura algoritması ile otomatik seçilir
        </p>
      </div>
    </div>
  );
}
