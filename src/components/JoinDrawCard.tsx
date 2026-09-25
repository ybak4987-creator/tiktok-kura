import { useState, useEffect } from 'react';
import { UserPlus, Check, Sparkles, AlertCircle, Search, HelpCircle, ShieldCheck, Heart } from 'lucide-react';
import { joinDraw, checkParticipantStatus, getParticipantCount, subscribeToDrawState } from '../services/drawService';
import { fireConfetti } from '../utils/confetti';
import { sounds } from '../utils/audio';

const MY_USERNAME_KEY = 'tiktok_kura_my_joined_username';

export function JoinDrawCard() {
  const [username, setUsername] = useState('');
  const [totalCount, setTotalCount] = useState<number>(() => getParticipantCount());
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'already' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });

  // Stored confirmed username from prior participation in this browser
  const [savedUsername, setSavedUsername] = useState<string | null>(() => {
    try {
      return localStorage.getItem(MY_USERNAME_KEY);
    } catch {
      return null;
    }
  });

  // Query / verification mode
  const [isCheckMode, setIsCheckMode] = useState(false);
  const [checkQuery, setCheckQuery] = useState('');
  const [checkResult, setCheckResult] = useState<{
    tested: boolean;
    isRegistered: boolean;
    message: string;
  } | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToDrawState(() => {
      setTotalCount(getParticipantCount());
    });
    return () => unsubscribe();
  }, []);

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || loading) return;

    setLoading(true);
    setFeedback({ type: null, message: '' });

    setTimeout(() => {
      const result = joinDraw(username);
      setLoading(false);

      if (result.success) {
        setFeedback({ type: 'success', message: result.message });
        if (result.follower) {
          try {
            localStorage.setItem(MY_USERNAME_KEY, result.follower.username);
            setSavedUsername(result.follower.username);
          } catch {
            // ignore
          }
        }
        sounds.playFanfare();
        fireConfetti();
        setUsername('');
      } else if (result.alreadyJoined) {
        setFeedback({ type: 'already', message: result.message });
        sounds.playTick(400);
      } else {
        setFeedback({ type: 'error', message: result.message });
        sounds.playTick(200);
      }
    }, 200);
  };

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkQuery.trim()) return;

    const res = checkParticipantStatus(checkQuery);
    setCheckResult({
      tested: true,
      isRegistered: res.isRegistered,
      message: res.message,
    });
    if (res.isRegistered) {
      sounds.playTick(600);
    }
  };

  return (
    <div className="rounded-3xl bg-gradient-to-b from-zinc-900/95 to-zinc-950/95 border-2 border-zinc-800/80 hover:border-zinc-700/80 p-5 sm:p-6 shadow-2xl shadow-black/80 space-y-4 transition-all">
      {/* Top Banner */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#FE2C55] to-[#25F4EE] p-0.5 shadow-lg shadow-[#FE2C55]/20">
            <div className="w-full h-full rounded-[14px] bg-zinc-950 flex items-center justify-center">
              <UserPlus className="w-5 h-5 text-[#25F4EE]" />
            </div>
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-white tracking-tight flex items-center gap-1.5">
              <span>Kuraya Katıl</span>
              <Sparkles className="w-4 h-4 text-[#FE2C55]" />
            </h2>
            <p className="text-[11px] text-zinc-400">
              Kullanıcı adını ekle, videolarda yer alma şansı yakala!
            </p>
          </div>
        </div>

        {/* Live counter badge */}
        <div className="flex flex-col items-end shrink-0">
          <span className="text-[10px] uppercase font-bold text-zinc-400 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Katılımcı</span>
          </span>
          <span className="text-lg font-black font-mono text-[#25F4EE] tabular-nums">
            {totalCount.toLocaleString('tr-TR')}
          </span>
        </div>
      </div>

      {/* Confirmed Entry Alert if user already joined on this device */}
      {savedUsername && !feedback.message && (
        <div className="p-3 rounded-2xl bg-emerald-950/40 border border-emerald-800/60 flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-2 text-xs text-emerald-300">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              Kayıtlı Profiliniz: <strong className="text-white font-mono">{savedUsername}</strong> (Havuzdasınız)
            </span>
          </div>
          <span className="text-[10px] text-emerald-400 font-bold bg-emerald-900/60 px-2 py-0.5 rounded-full border border-emerald-700/60">
            Aktif
          </span>
        </div>
      )}

      {/* Tab Switcher: Katıl vs Kontrol Et */}
      <div className="flex rounded-xl bg-zinc-950 p-1 border border-zinc-800">
        <button
          type="button"
          onClick={() => {
            setIsCheckMode(false);
            setFeedback({ type: null, message: '' });
          }}
          className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            !isCheckMode
              ? 'bg-zinc-800 text-white shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <UserPlus className="w-3.5 h-3.5 text-[#25F4EE]" />
          <span>Hemen Katıl</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setIsCheckMode(true);
            setFeedback({ type: null, message: '' });
          }}
          className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            isCheckMode
              ? 'bg-zinc-800 text-white shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Search className="w-3.5 h-3.5 text-zinc-400" />
          <span>Katılımımı Sorgula</span>
        </button>
      </div>

      {!isCheckMode ? (
        /* ================= 1. KATILMA FORMU ================= */
        <form onSubmit={handleJoin} className="space-y-3">
          <div className="space-y-1.5">
            <label htmlFor="join-username-input" className="block text-xs font-bold text-zinc-300">
              TikTok Kullanıcı Adınız:
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3.5 text-zinc-500 font-bold text-sm select-none">
                @
              </span>
              <input
                id="join-username-input"
                type="text"
                value={username.startsWith('@') ? username.slice(1) : username}
                onChange={(e) => {
                  const val = e.target.value.replace(/\s+/g, '');
                  setUsername(val);
                  if (feedback.type) setFeedback({ type: null, message: '' });
                }}
                placeholder="kullanici_adiniz"
                autoComplete="off"
                spellCheck="false"
                maxLength={30}
                className="w-full min-h-[48px] pl-8 pr-4 rounded-2xl bg-zinc-950 border border-zinc-700/80 focus:border-[#25F4EE] focus:ring-2 focus:ring-[#25F4EE]/20 text-white placeholder-zinc-600 text-sm font-semibold transition-all outline-none"
              />
            </div>
          </div>

          {/* Feedback Messages */}
          {feedback.message && (
            <div
              className={`p-3 rounded-2xl text-xs flex items-start gap-2 animate-fadeIn ${
                feedback.type === 'success'
                  ? 'bg-emerald-950/70 border border-emerald-800 text-emerald-300'
                  : feedback.type === 'already'
                  ? 'bg-amber-950/70 border border-amber-800 text-amber-300'
                  : 'bg-rose-950/70 border border-rose-800 text-rose-300'
              }`}
            >
              {feedback.type === 'success' ? (
                <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              )}
              <span className="leading-relaxed">{feedback.message}</span>
            </div>
          )}

          {/* Submit Action */}
          <button
            type="submit"
            disabled={loading || !username.trim()}
            className="w-full min-h-[48px] py-3 px-5 rounded-2xl bg-gradient-to-r from-[#FE2C55] via-[#ff0050] to-[#25F4EE] hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black text-sm tracking-wide shadow-xl shadow-[#FE2C55]/20 flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Kaydediliyor...</span>
              </span>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                <span>KURAYA KATIL (1 HAK)</span>
              </>
            )}
          </button>
        </form>
      ) : (
        /* ================= 2. SORGULAMA FORMU ================= */
        <form onSubmit={handleVerify} className="space-y-3">
          <div className="space-y-1.5">
            <label htmlFor="check-username-input" className="block text-xs font-bold text-zinc-300">
              Sorgulamak İstediğiniz Kullanıcı Adı:
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3.5 text-zinc-500 font-bold text-sm select-none">
                @
              </span>
              <input
                id="check-username-input"
                type="text"
                value={checkQuery.startsWith('@') ? checkQuery.slice(1) : checkQuery}
                onChange={(e) => {
                  setCheckQuery(e.target.value.replace(/\s+/g, ''));
                  setCheckResult(null);
                }}
                placeholder="kullanici_adiniz"
                autoComplete="off"
                spellCheck="false"
                maxLength={30}
                className="w-full min-h-[48px] pl-8 pr-4 rounded-2xl bg-zinc-950 border border-zinc-700/80 focus:border-[#25F4EE] focus:ring-2 focus:ring-[#25F4EE]/20 text-white placeholder-zinc-600 text-sm font-semibold transition-all outline-none"
              />
            </div>
          </div>

          {checkResult && (
            <div
              className={`p-3 rounded-2xl text-xs flex items-start gap-2 animate-fadeIn ${
                checkResult.isRegistered
                  ? 'bg-emerald-950/70 border border-emerald-800 text-emerald-300'
                  : 'bg-zinc-900 border border-zinc-800 text-zinc-300'
              }`}
            >
              {checkResult.isRegistered ? (
                <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <HelpCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              )}
              <span className="leading-relaxed">{checkResult.message}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={!checkQuery.trim()}
            className="w-full min-h-[44px] py-2.5 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-zinc-100 font-bold text-xs tracking-wide flex items-center justify-center gap-2 transition-all active:scale-95"
          >
            <Search className="w-3.5 h-3.5 text-[#25F4EE]" />
            <span>KONTROL ET</span>
          </button>
        </form>
      )}

      {/* Rules Mini Info */}
      <div className="pt-2 border-t border-zinc-800/60 flex items-center justify-between text-[11px] text-zinc-400 flex-wrap gap-2">
        <span className="flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>1 Kişi = 1 Hak</span>
        </span>
        <span className="flex items-center gap-1">
          <Heart className="w-3.5 h-3.5 text-[#FE2C55]" />
          <span>Tamamen Ücretsiz</span>
        </span>
        <span className="text-zinc-500 font-mono">
          🔒 Otomatik Tekilleştirme
        </span>
      </div>
    </div>
  );
}
