import { useState, useEffect, useRef, useMemo } from 'react';
import { Sparkles, Trophy, CheckCircle2, FastForward, Video, Volume2, VolumeX, X, RotateCcw, Heart, Flame } from 'lucide-react';
import { Follower, DrawResult } from '../types/draw';
import { BrandLogo } from './BrandLogo';
import { BRAND } from '../constants/brand';
import { sounds } from '../utils/audio';
import { fireConfetti, fireWinnerLockConfetti, fireTikTokGrandCelebration } from '../utils/confetti';

interface TikTokDrawAnimationProps {
  candidates: Follower[];
  targetWinners: Follower[];
  isOpen: boolean;
  onClose: () => void;
  onComplete?: (results: DrawResult[]) => void;
  title?: string;
  isLiveAutoDraw?: boolean;
}

interface FloatingHeartItem {
  id: number;
  x: number;
  color: string;
  size: number;
  duration: number;
}

export function TikTokDrawAnimation({
  candidates,
  targetWinners,
  isOpen,
  onClose,
  onComplete,
  title = 'CANLI TIKTOK KURASI',
  isLiveAutoDraw = false,
}: TikTokDrawAnimationProps) {
  // Current stage: 1 = Winner 1, 2 = Winner 2, 3 = Winner 3, 4 = Final Podium
  const [stage, setStage] = useState<number>(1);
  const [isSpinning, setIsSpinning] = useState<boolean>(true);
  const [lockedWinners, setLockedWinners] = useState<Follower[]>([]);
  const [soundMuted, setSoundMuted] = useState<boolean>(!sounds.enabled);

  // Reel visible strip: [top2, top1, center (target), bottom1, bottom2]
  const [drumItems, setDrumItems] = useState<string[]>([]);
  const [flashHighlight, setFlashHighlight] = useState<boolean>(false);
  const [floatingHearts, setFloatingHearts] = useState<FloatingHeartItem[]>([]);

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const heartIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const totalStages = Math.min(Math.max(targetWinners.length, 1), 3);

  // Safe fallback candidate pool
  const candidateUsernames = useMemo(() => {
    if (candidates && candidates.length > 0) {
      return candidates.map((c) => c.username);
    }
    // Fallback realistic usernames if empty
    return [
      '@mehmet_can', '@ayse_kaya', '@burak.yilmaz', '@zeynep_demir',
      '@emre_arslan', '@gamze_celik', '@ali_ozturk', '@merve_sahin',
      '@berkay_koc', '@fatma_yildiz', '@onur_aydin', '@selin_polat'
    ];
  }, [candidates]);

  // Floating TikTok live hearts generator
  useEffect(() => {
    if (!isOpen) return;

    const colors = ['#FE2C55', '#25F4EE', '#FFFFFF', '#FF0050', '#00F2FE', '#FFD700'];
    let counter = 0;

    heartIntervalRef.current = setInterval(() => {
      counter++;
      const newHeart: FloatingHeartItem = {
        id: Date.now() + counter,
        x: Math.random() * 80 + 10, // 10% to 90%
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 12 + 14,
        duration: Math.random() * 1.5 + 2.0,
      };

      setFloatingHearts((prev) => [...prev.slice(-15), newHeart]);
    }, 450);

    return () => {
      if (heartIntervalRef.current) {
        clearInterval(heartIntervalRef.current);
      }
    };
  }, [isOpen]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setStage(1);
      setLockedWinners([]);
      setIsSpinning(true);
      setFlashHighlight(false);
    }
  }, [isOpen]);

  // Main stage deceleration runner
  useEffect(() => {
    if (!isOpen) return;

    if (stage > totalStages) {
      // Grand finale screen
      setIsSpinning(false);
      fireTikTokGrandCelebration();
      sounds.playFanfare();

      if (onComplete) {
        const finalResults: DrawResult[] = (lockedWinners.length > 0 ? lockedWinners : targetWinners).map(
          (w, idx) => ({
            id: `draw_${Date.now()}_${idx + 1}`,
            username: w.username,
            videoNumber: idx + 1,
            createdAt: new Date().toISOString(),
          })
        );
        onComplete(finalResults);
      }
      return;
    }

    const currentWinner = targetWinners[stage - 1];
    if (!currentWinner) return;

    setIsSpinning(true);
    setFlashHighlight(false);

    // Filter candidate pool to avoid displaying already chosen winners in current reel
    const lockedUsernamesSet = new Set(lockedWinners.map((w) => w.username.toLowerCase()));
    const eligibleUsernames = candidateUsernames.filter(
      (u) => !lockedUsernamesSet.has(u.toLowerCase()) && u.toLowerCase() !== currentWinner.username.toLowerCase()
    );
    const pool = eligibleUsernames.length > 5 ? eligibleUsernames : candidateUsernames;

    // Progressive deceleration timing steps in ms
    // Starts fast (40ms), slows down with suspense intervals
    const steps = [
      35, 35, 35, 40, 40, 45, 50, 60, 75, 95, 125, 165, 220, 295, 410, 560, 750
    ];

    let stepIndex = 0;

    function getSpinStrip(centerUsername: string): string[] {
      const p1 = pool[Math.floor(Math.random() * pool.length)] || '@tiktok_user1';
      const p2 = pool[Math.floor(Math.random() * pool.length)] || '@tiktok_user2';
      const p3 = pool[Math.floor(Math.random() * pool.length)] || '@tiktok_user3';
      const p4 = pool[Math.floor(Math.random() * pool.length)] || '@tiktok_user4';
      return [p1, p2, centerUsername, p3, p4];
    }

    function runStep() {
      if (stepIndex < steps.length - 1) {
        const randomCandidate = pool[Math.floor(Math.random() * pool.length)] || currentWinner.username;
        setDrumItems(getSpinStrip(randomCandidate));

        // Pitch climbs as suspense intensifies
        const pitch = 360 + stepIndex * 26;
        sounds.playTick(pitch);

        stepIndex++;
        timeoutRef.current = setTimeout(runStep, steps[stepIndex]);
      } else {
        // Dramatic final lock!
        setDrumItems(getSpinStrip(currentWinner.username));
        setIsSpinning(false);
        setFlashHighlight(true);
        sounds.playWinner();
        fireWinnerLockConfetti(0.5);

        const updatedLocked = [...lockedWinners, currentWinner];
        setLockedWinners(updatedLocked);

        // Pause to celebrate the locked winner, then advance
        timeoutRef.current = setTimeout(() => {
          setFlashHighlight(false);
          setStage((prev) => prev + 1);
        }, 1750);
      }
    }

    runStep();

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [stage, isOpen, targetWinners, candidateUsernames]);

  const handleSkipToFinish = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setLockedWinners(targetWinners);
    setStage(totalStages + 1);
    setIsSpinning(false);
    fireTikTokGrandCelebration();
    sounds.playFanfare();

    if (onComplete) {
      const finalResults: DrawResult[] = targetWinners.map((w, idx) => ({
        id: `draw_${Date.now()}_${idx + 1}`,
        username: w.username,
        videoNumber: idx + 1,
        createdAt: new Date().toISOString(),
      }));
      onComplete(finalResults);
    }
  };

  const handleRestart = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setStage(1);
    setLockedWinners([]);
    setIsSpinning(true);
    setFlashHighlight(false);
  };

  const toggleSound = () => {
    sounds.enabled = !sounds.enabled;
    setSoundMuted(!sounds.enabled);
    if (sounds.enabled) {
      sounds.playTick(500);
    }
  };

  if (!isOpen) return null;

  const currentStageBadge =
    stage === 1
      ? { label: '1. VİDEO HAKKI', color: 'from-amber-400 to-yellow-500', textCol: 'text-amber-300', emoji: '🥇', video: 'Video 1' }
      : stage === 2
      ? { label: '2. VİDEO HAKKI', color: 'from-[#25F4EE] to-cyan-500', textCol: 'text-[#25F4EE]', emoji: '🥈', video: 'Video 2' }
      : { label: '3. VİDEO HAKKI', color: 'from-[#FE2C55] to-rose-600', textCol: 'text-[#FE2C55]', emoji: '🥉', video: 'Video 3' };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-xl overflow-y-auto selection:bg-[#FE2C55]/30">
      {/* Container with TikTok Cyber Aesthetic */}
      <div className="relative w-full max-w-lg bg-[#0b0c10] rounded-3xl border border-zinc-800 shadow-2xl overflow-hidden p-5 sm:p-7 text-center">
        {/* Glow ambient background lasers */}
        <div className="absolute -top-32 -left-32 w-64 h-64 bg-[#FE2C55]/25 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-[#25F4EE]/25 rounded-full blur-3xl pointer-events-none" />

        {/* Floating TikTok live hearts layer */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
          {floatingHearts.map((heart) => (
            <div
              key={heart.id}
              className="absolute bottom-4 flex items-center justify-center transition-all animate-floatUp"
              style={{
                left: `${heart.x}%`,
                animationDuration: `${heart.duration}s`,
              }}
            >
              <Heart
                style={{
                  color: heart.color,
                  fill: heart.color,
                  width: `${heart.size}px`,
                  height: `${heart.size}px`,
                  opacity: 0.85,
                  filter: `drop-shadow(0 0 6px ${heart.color})`,
                }}
              />
            </div>
          ))}
        </div>

        {/* Top TikTok Live Status Bar */}
        <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-zinc-800/80 relative z-30">
          <div className="flex items-center gap-2.5">
            <BrandLogo size="sm" className="w-8 h-8 shadow-md" />
            <div className="text-left">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black text-white">{BRAND.username}</span>
                <span className="w-3.5 h-3.5 rounded-full bg-[#25F4EE] text-black text-[9px] font-black flex items-center justify-center">
                  ✓
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-zinc-400">
                <span className="inline-block w-2 h-2 rounded-full bg-[#FE2C55] animate-ping" />
                <span className="font-bold text-zinc-300 uppercase tracking-wider">CANLI KURA</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={toggleSound}
              className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 transition-colors"
              title={soundMuted ? 'Sesi Aç' : 'Sesi Kapat'}
            >
              {soundMuted ? <VolumeX className="w-4 h-4 text-zinc-500" /> : <Volume2 className="w-4 h-4 text-[#25F4EE]" />}
            </button>

            {stage <= totalStages && (
              <button
                onClick={handleSkipToFinish}
                className="flex items-center gap-1 text-xs font-bold text-zinc-300 hover:text-white px-2.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 transition-colors"
                title="Hemen Sonuçları Gör"
              >
                <FastForward className="w-3.5 h-3.5 text-[#FE2C55]" />
                <span className="hidden sm:inline">Hızlı Geç</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 transition-colors"
              title="Kapat"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {stage <= totalStages ? (
          /* ================= ACTIVE LIVE DRAWING STAGE ================= */
          <div className="py-2 relative z-30 space-y-4">
            {/* Active Prize Category Banner */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-900/90 border border-zinc-700/80 shadow-md">
              <span className="text-base">{currentStageBadge.emoji}</span>
              <span className={`text-xs font-black tracking-wider uppercase ${currentStageBadge.textCol}`}>
                {currentStageBadge.label} ÇEKİLİYOR
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 font-bold">
                {stage}/{totalStages}
              </span>
            </div>

            {/* LIVE TIKTOK CYBER ROULETTE REEL */}
            <div
              className={`relative my-2 p-5 sm:p-6 rounded-3xl bg-zinc-950/90 border-2 transition-all duration-300 shadow-2xl overflow-hidden flex flex-col items-center justify-center min-h-[190px] ${
                flashHighlight
                  ? 'border-emerald-400 shadow-[0_0_35px_rgba(52,211,153,0.5)] scale-[1.02]'
                  : 'border-zinc-800 shadow-[0_0_30px_rgba(254,44,85,0.2)]'
              }`}
            >
              {/* Scanline & duotone light overlay */}
              <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-black/80 pointer-events-none z-10" />

              {/* TikTok duotone laser beams */}
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#FE2C55] to-transparent animate-pulse" />
              <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#25F4EE] to-transparent animate-pulse" />

              {/* Left & Right Laser Crosshair Indicators */}
              <div className="absolute left-2.5 top-1/2 -translate-y-1/2 z-20 flex items-center gap-1 text-[#FE2C55] font-black text-xs animate-pulse">
                ▶
              </div>
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 z-20 flex items-center gap-1 text-[#25F4EE] font-black text-xs animate-pulse">
                ◀
              </div>

              {/* 5-Item Spinning Drum Viewport */}
              <div className="w-full flex flex-col items-center justify-center gap-2 relative z-10">
                {/* Top Blurred Ghost User */}
                <div className="text-xs font-mono text-zinc-600 opacity-40 blur-[0.7px] select-none truncate max-w-[240px]">
                  {drumItems[1] || '@bekleniyor...'}
                </div>

                {/* TARGET WINNER FOCUS FRAME */}
                <div
                  className={`w-full py-2.5 px-4 rounded-2xl flex items-center justify-center gap-2 transition-all duration-150 ${
                    flashHighlight
                      ? 'bg-gradient-to-r from-[#FE2C55]/20 via-emerald-500/20 to-[#25F4EE]/20 border border-emerald-400/60 shadow-inner'
                      : 'bg-zinc-900/60 border border-zinc-800'
                  }`}
                >
                  <span className="text-xl sm:text-2xl">{currentStageBadge.emoji}</span>
                  <div
                    className={`font-black font-mono tracking-tight transition-all duration-100 truncate max-w-[280px] ${
                      isSpinning
                        ? 'text-xl sm:text-2xl text-zinc-200 blur-[0.3px] scale-95'
                        : 'text-2xl sm:text-3xl text-white font-extrabold scale-105 drop-shadow-[0_0_18px_rgba(37,244,238,0.8)]'
                    }`}
                  >
                    {drumItems[2] || '@kullanici'}
                  </div>
                </div>

                {/* Bottom Blurred Ghost User */}
                <div className="text-xs font-mono text-zinc-600 opacity-40 blur-[0.7px] select-none truncate max-w-[240px]">
                  {drumItems[3] || '@siradaki...'}
                </div>
              </div>

              {/* Status Ticker under the drum */}
              <div className="mt-3 relative z-20">
                {isSpinning ? (
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900/80 border border-zinc-800 text-[11px] font-bold text-zinc-300">
                    <span className="w-2 h-2 rounded-full bg-[#FE2C55] animate-ping" />
                    <span>Takipçi havuzundan rastgele seçiliyor...</span>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-800 text-xs font-bold text-emerald-400 animate-bounce">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>{currentStageBadge.video} Sahibi Belirlendi!</span>
                  </div>
                )}
              </div>
            </div>

            {/* PREVIOUSLY DETERMINED WINNERS PODIUM DECK */}
            <div className="text-left bg-zinc-900/60 rounded-2xl border border-zinc-800/80 p-3.5 space-y-2">
              <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                <span>Belirlenen Video Hakları</span>
                <span className="font-mono text-[#25F4EE]">{lockedWinners.length} / 3</span>
              </div>

              <div className="grid grid-cols-1 gap-1.5">
                {[1, 2, 3].map((stepIdx) => {
                  const winner = lockedWinners[stepIdx - 1];
                  const badge =
                    stepIdx === 1
                      ? { label: 'Video 1', emoji: '🥇', col: 'text-amber-400' }
                      : stepIdx === 2
                      ? { label: 'Video 2', emoji: '🥈', col: 'text-[#25F4EE]' }
                      : { label: 'Video 3', emoji: '🥉', col: 'text-[#FE2C55]' };

                  return (
                    <div
                      key={stepIdx}
                      className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all ${
                        winner
                          ? 'bg-zinc-900 border border-zinc-700/80 text-white'
                          : stepIdx === stage
                          ? 'bg-zinc-900/40 border border-[#FE2C55]/40 text-zinc-400 animate-pulse'
                          : 'bg-zinc-950/40 border border-zinc-900 text-zinc-600'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span>{badge.emoji}</span>
                        <span className={`font-bold ${badge.col}`}>{badge.label}</span>
                      </div>

                      {winner ? (
                        <div className="flex items-center gap-1.5 font-mono font-bold text-white">
                          <span>{winner.username}</span>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        </div>
                      ) : stepIdx === stage ? (
                        <span className="text-[11px] text-[#FE2C55] font-semibold animate-pulse">
                          Çekiliyor...
                        </span>
                      ) : (
                        <span className="text-[11px] text-zinc-600 font-mono">Bekliyor</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          /* ================= GRAND CELEBRATION FINALE SCREEN ================= */
          <div className="py-3 relative z-30 space-y-5 animate-fadeIn">
            {/* Celebration Icon */}
            <div className="w-16 h-16 mx-auto rounded-3xl bg-gradient-to-tr from-[#FE2C55] via-purple-600 to-[#25F4EE] p-0.5 shadow-xl shadow-[#FE2C55]/30 flex items-center justify-center">
              <div className="w-full h-full rounded-[22px] bg-zinc-950 flex items-center justify-center text-3xl">
                🏆
              </div>
            </div>

            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-800 text-xs font-bold text-emerald-300 mb-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Kura Başarıyla Tamamlandı</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                KAZANANLAR BELİRLENDİ!
              </h2>
              <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
                3 farklı takipçi adil algoritma ile seçildi ve video hakları dağıtıldı.
              </p>
            </div>

            {/* 3 Winner Result Cards */}
            <div className="space-y-2.5 text-left">
              {(lockedWinners.length > 0 ? lockedWinners : targetWinners).map((winner, idx) => {
                const badge =
                  idx === 0
                    ? { emoji: '🥇', label: 'Video 1 Sahibi', border: 'border-amber-400/50', bg: 'bg-amber-400/10' }
                    : idx === 1
                    ? { emoji: '🥈', label: 'Video 2 Sahibi', border: 'border-[#25F4EE]/50', bg: 'bg-[#25F4EE]/10' }
                    : { emoji: '🥉', label: 'Video 3 Sahibi', border: 'border-[#FE2C55]/50', bg: 'bg-[#FE2C55]/10' };

                return (
                  <div
                    key={winner.id || idx}
                    className={`p-3.5 rounded-2xl bg-zinc-900/90 border ${badge.border} flex items-center justify-between shadow-lg`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{badge.emoji}</span>
                      <div>
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                          {badge.label}
                        </span>
                        <span className="text-base sm:text-lg font-black text-white font-mono">
                          {winner.username}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-950/70 border border-emerald-700 text-emerald-400 flex items-center gap-1">
                      <span>✓ Seçildi</span>
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Actions: Replay & Close/Publish */}
            <div className="pt-2 flex flex-col sm:flex-row items-center gap-2.5">
              <button
                onClick={handleRestart}
                className="w-full sm:w-auto min-h-[44px] px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5 text-[#25F4EE]" />
                <span>Tekrar Oynat</span>
              </button>

              <button
                onClick={onClose}
                className="w-full sm:flex-1 min-h-[48px] py-3 px-6 rounded-2xl bg-gradient-to-r from-[#FE2C55] via-[#ff0050] to-[#25F4EE] hover:brightness-110 text-white font-extrabold text-sm tracking-wide shadow-xl shadow-[#FE2C55]/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                <span>Sonuçları Sayfada Gör</span>
                <CheckCircle2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
