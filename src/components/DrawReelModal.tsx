import { useState, useEffect, useRef } from 'react';
import { Sparkles, Trophy, CheckCircle, ChevronRight, FastForward, Video } from 'lucide-react';
import { Follower } from '../types/draw';
import { BrandLogo } from './BrandLogo';
import { BRAND } from '../constants/brand';
import { sounds } from '../utils/audio';
import { fireConfetti, fireWinnerLockConfetti, fireTikTokGrandCelebration } from '../utils/confetti';

interface DrawReelModalProps {
  candidates: Follower[];
  targetWinners: Follower[];
  onComplete: () => void;
  onClose: () => void;
}

export function DrawReelModal({ candidates, targetWinners, onComplete, onClose }: DrawReelModalProps) {
  // Current stage: 1 = Winner 1, 2 = Winner 2, 3 = Winner 3, 4 = Final Screen
  const [stage, setStage] = useState<number>(1);
  const [currentDisplayUsername, setCurrentDisplayUsername] = useState<string>('');
  const [isSpinning, setIsSpinning] = useState<boolean>(true);
  const [lockedWinners, setLockedWinners] = useState<Follower[]>([]);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Total stages to draw
  const totalStages = Math.min(targetWinners.length, 3);

  // Pool for spinning excluding locked winners
  const getEligiblePool = (alreadyLocked: Follower[]) => {
    const lockedUsernames = new Set(alreadyLocked.map((w) => w.username.toLowerCase()));
    const pool = candidates.filter((c) => !lockedUsernames.has(c.username.toLowerCase()));
    return pool.length > 0 ? pool : candidates;
  };

  useEffect(() => {
    if (stage > totalStages) {
      // Finished all winners!
      setIsSpinning(false);
      fireTikTokGrandCelebration();
      sounds.playFanfare();
      return;
    }

    const currentWinner = targetWinners[stage - 1];
    if (!currentWinner) return;

    setIsSpinning(true);
    const pool = getEligiblePool(lockedWinners);

    // Progressive deceleration animation
    // Step intervals (ms): starts fast, slows down gradually
    const steps = [
      40, 40, 40, 45, 45, 50, 55, 65, 80, 100, 130, 170, 230, 310, 420, 580
    ];

    let stepIndex = 0;

    function runStep() {
      if (stepIndex < steps.length - 1) {
        // Random candidate from eligible pool for suspense
        const randomCandidate = pool[Math.floor(Math.random() * pool.length)];
        setCurrentDisplayUsername(randomCandidate ? randomCandidate.username : currentWinner.username);
        
        // Audio tick with rising pitch
        const pitch = 380 + stepIndex * 25;
        sounds.playTick(pitch);

        stepIndex++;
        timeoutRef.current = setTimeout(runStep, steps[stepIndex]);
      } else {
        // Lock in the real winner!
        setCurrentDisplayUsername(currentWinner.username);
        setIsSpinning(false);
        sounds.playWinner();
        fireWinnerLockConfetti(0.5);

        const newLocked = [...lockedWinners, currentWinner];
        setLockedWinners(newLocked);

        // Pause to appreciate this winner, then advance to next stage or finish
        timeoutRef.current = setTimeout(() => {
          setStage((prev) => prev + 1);
        }, 1600);
      }
    }

    runStep();

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [stage, targetWinners]);

  const handleSkipToFinish = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setLockedWinners(targetWinners);
    setStage(totalStages + 1);
    setIsSpinning(false);
    fireTikTokGrandCelebration();
    sounds.playFanfare();
  };

  const getStageBadge = (st: number) => {
    switch (st) {
      case 1:
        return { emoji: '🥇', label: 'Video 1 Hakkı', color: 'text-amber-400 border-amber-400/40 bg-amber-400/10' };
      case 2:
        return { emoji: '🥈', label: 'Video 2 Hakkı', color: 'text-[#25F4EE] border-[#25F4EE]/40 bg-[#25F4EE]/10' };
      case 3:
      default:
        return { emoji: '🥉', label: 'Video 3 Hakkı', color: 'text-[#FE2C55] border-[#FE2C55]/40 bg-[#FE2C55]/10' };
    }
  };

  const currentBadge = getStageBadge(stage <= totalStages ? stage : 3);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-md bg-zinc-950 rounded-3xl border border-zinc-800 shadow-2xl p-6 sm:p-7 overflow-hidden text-center">
        {/* Glow ambient background */}
        <div className="absolute -top-24 -left-24 w-52 h-52 bg-[#FE2C55]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-52 h-52 bg-[#25F4EE]/20 rounded-full blur-3xl pointer-events-none" />

        {/* Header bar inside modal */}
        <div className="flex items-center justify-between mb-4 relative z-10 pb-3 border-b border-zinc-800/80">
          <div className="flex items-center gap-2">
            <BrandLogo size="sm" className="w-7 h-7" />
            <div className="text-left">
              <span className="text-xs font-bold text-white block leading-tight">{BRAND.username}</span>
              <span className="text-[10px] text-zinc-400">
                {stage <= totalStages ? `Kura Çekiliyor · ${stage}/${totalStages}` : 'Kura Tamamlandı'}
              </span>
            </div>
          </div>

          {stage <= totalStages && (
            <button
              onClick={handleSkipToFinish}
              className="flex items-center gap-1 text-xs text-zinc-400 hover:text-white px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 transition-colors"
            >
              <FastForward className="w-3.5 h-3.5" />
              <span>Hızlı Geç</span>
            </button>
          )}
        </div>

        {stage <= totalStages ? (
          /* SPINNING REEL SCREEN */
          <div className="py-4 relative z-10">
            {/* Target Prize Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-bold mb-5 shadow-sm">
              <span>{currentBadge.emoji}</span>
              <span className={currentBadge.color}>{currentBadge.label}</span>
            </div>

            {/* Reel Box */}
            <div className="relative my-4 p-6 sm:p-8 rounded-2xl bg-zinc-900/90 border-2 border-zinc-700/60 shadow-inner overflow-hidden flex flex-col items-center justify-center min-h-[140px]">
              {/* Scanline / TikTok grid feel */}
              <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/40 pointer-events-none" />

              <div
                className={`text-2xl sm:text-3xl md:text-4xl font-black font-mono tracking-tight transition-all duration-100 ${
                  isSpinning
                    ? 'text-zinc-200 scale-95 blur-[0.4px]'
                    : 'text-white scale-110 drop-shadow-[0_0_20px_rgba(37,244,238,0.6)] animate-bounce'
                }`}
              >
                {currentDisplayUsername || '@...'}
              </div>

              <div className="mt-3 text-xs font-semibold text-zinc-400">
                {isSpinning ? (
                  <span className="inline-flex items-center gap-1.5 text-zinc-400">
                    <span className="animate-spin inline-block w-3 h-3 border-2 border-zinc-400 border-t-transparent rounded-full" />
                    Çekiliş dönüyor...
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-emerald-400 font-bold">
                    <CheckCircle className="w-3.5 h-3.5" />
                    Seçildi!
                  </span>
                )}
              </div>
            </div>

            {/* Previously locked winners in this session */}
            {lockedWinners.length > 0 && (
              <div className="mt-5 text-left border-t border-zinc-800/80 pt-4">
                <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-2">
                  Belirlenen Kazananlar
                </span>
                <div className="space-y-1.5">
                  {lockedWinners.map((w, idx) => (
                    <div
                      key={w.id}
                      className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-zinc-900/60 border border-zinc-800/60 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span>{idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}</span>
                        <span className="font-bold text-white font-mono">{w.username}</span>
                      </div>
                      <span className="text-[10px] text-zinc-400 font-semibold">Video {idx + 1}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* GRAND FINALE SCREEN */
          <div className="py-2 relative z-10">
            {/* Brand Logo & Account in Results */}
            <div className="flex items-center justify-center gap-2 mb-3">
              <BrandLogo size="sm" className="w-8 h-8" />
              <div className="text-left">
                <span className="text-xs font-bold text-white block">{BRAND.username}</span>
                <span className="text-[10px] text-zinc-400">Resmi Kura Sonucu</span>
              </div>
            </div>

            <div className="w-14 h-14 mx-auto rounded-full bg-gradient-to-tr from-[#FE2C55] to-[#25F4EE] p-0.5 mb-2 shadow-lg shadow-[#FE2C55]/20 flex items-center justify-center">
              <div className="w-full h-full rounded-full bg-zinc-950 flex items-center justify-center text-2xl">
                🎉
              </div>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-1">
              KURA TAMAMLANDI!
            </h2>
            <p className="text-xs text-zinc-400 mb-5">
              3 farklı takipçi rastgele seçildi ve video hakları dağıtıldı.
            </p>

            <div className="space-y-2.5 mb-6 text-left">
              {lockedWinners.map((winner, idx) => {
                const badge = getStageBadge(idx + 1);
                return (
                  <div
                    key={winner.id}
                    className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-between shadow-md"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{badge.emoji}</span>
                      <div>
                        <span className="text-[10px] font-bold text-zinc-400 uppercase block">
                          Video {idx + 1}
                        </span>
                        <span className="text-base sm:text-lg font-black text-white font-mono">
                          {winner.username}
                        </span>
                      </div>
                    </div>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${badge.color}`}>
                      Seçildi
                    </span>
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => {
                onComplete();
                onClose();
              }}
              className="w-full min-h-[48px] py-3 px-6 rounded-2xl bg-gradient-to-r from-[#FE2C55] to-[#ff0050] hover:brightness-110 text-white font-bold text-sm tracking-wide shadow-lg shadow-[#FE2C55]/25 active:scale-[0.98] transition-transform"
            >
              Sonuçları Gör ve Yayınla
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
