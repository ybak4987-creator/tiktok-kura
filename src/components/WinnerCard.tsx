import { useState } from 'react';
import { Copy, Check, Video, ExternalLink, Users, Heart, CheckCircle2 } from 'lucide-react';
import { DrawResult } from '../types/draw';
import { getTikTokProfileData } from './AdminWinnerCard';

interface WinnerCardProps {
  result: DrawResult;
  index: number;
}

export function WinnerCard({ result, index }: WinnerCardProps) {
  const [copied, setCopied] = useState(false);
  const [fallbackActive, setFallbackActive] = useState(false);
  const [avatarError, setAvatarError] = useState(false);

  const profile = getTikTokProfileData(result.username);

  const getRankBadge = (num: number) => {
    switch (num) {
      case 1:
        return {
          emoji: '🥇',
          label: '1. KAZANAN',
          border: 'border-amber-400/40 hover:border-amber-400/70',
          gradient: 'from-amber-500/10 via-amber-500/5 to-transparent',
          accent: 'text-amber-300',
          badgeBg: 'bg-amber-400/20 text-amber-300 border-amber-400/30',
        };
      case 2:
        return {
          emoji: '🥈',
          label: '2. KAZANAN',
          border: 'border-cyan-400/40 hover:border-cyan-400/70',
          gradient: 'from-[#25F4EE]/10 via-[#25F4EE]/5 to-transparent',
          accent: 'text-[#25F4EE]',
          badgeBg: 'bg-[#25F4EE]/20 text-[#25F4EE] border-[#25F4EE]/30',
        };
      case 3:
      default:
        return {
          emoji: '🥉',
          label: '3. KAZANAN',
          border: 'border-[#FE2C55]/40 hover:border-[#FE2C55]/70',
          gradient: 'from-[#FE2C55]/10 via-[#FE2C55]/5 to-transparent',
          accent: 'text-[#FE2C55]',
          badgeBg: 'bg-[#FE2C55]/20 text-[#FE2C55] border-[#FE2C55]/30',
        };
    }
  };

  const config = getRankBadge(result.videoNumber || index + 1);

  const handleCopy = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(result.username);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } else {
        setFallbackActive(true);
      }
    } catch {
      setFallbackActive(true);
    }
  };

  return (
    <div
      className={`relative overflow-hidden rounded-2xl p-4 sm:p-5 bg-zinc-900/90 border ${config.border} shadow-xl shadow-black/50 transition-all duration-300 group`}
    >
      {/* Background tint */}
      <div className={`absolute inset-0 bg-gradient-to-br ${config.gradient} pointer-events-none`} />

      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3.5 min-w-0">
          {/* Avatar with Rank Ring */}
          <div className="relative shrink-0">
            {!avatarError ? (
              <img
                src={profile.avatarUrl}
                alt={result.username}
                onError={() => setAvatarError(true)}
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover ring-2 ring-zinc-700 bg-zinc-800 shadow-md"
              />
            ) : (
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-zinc-800 ring-2 ring-zinc-700 flex items-center justify-center text-lg font-bold text-white">
                {profile.cleanUsername.slice(0, 2).toUpperCase()}
              </div>
            )}
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-zinc-950 border border-zinc-800 flex items-center justify-center text-xs shadow-md">
              <span>{config.emoji}</span>
            </div>
          </div>

          {/* User & Video Info */}
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-xs font-bold tracking-wider px-2 py-0.5 rounded-full border ${config.badgeBg}`}>
                Video {result.videoNumber} Hakkı
              </span>
              <span className="text-[11px] font-mono text-zinc-300 font-semibold flex items-center gap-1 bg-zinc-950/80 px-2 py-0.5 rounded-full border border-zinc-800">
                <Users className="w-3 h-3 text-[#25F4EE]" />
                <span>{profile.followerCount} Takipçi</span>
              </span>
            </div>

            <div>
              <div className="text-base sm:text-lg font-black text-white tracking-tight truncate hover:text-zinc-100 flex items-center gap-1.5">
                <span>{profile.displayName}</span>
                {profile.isVerified && <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />}
              </div>
              <div className="text-xs sm:text-sm font-bold text-[#25F4EE] font-mono">
                {result.username}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-800/60">
          <button
            onClick={handleCopy}
            type="button"
            className={`flex-1 sm:flex-initial min-h-[44px] px-4 py-2.5 rounded-xl font-semibold text-xs tracking-wider uppercase transition-all flex items-center justify-center gap-1.5 active:scale-95 ${
              copied
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/30'
                : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700'
            }`}
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-white" />
                <span>Kopyalandı</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-zinc-300" />
                <span>Kopyala</span>
              </>
            )}
          </button>

          <a
            href={`https://www.tiktok.com/${result.username.replace(/^@/, '@')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="min-h-[44px] min-w-[44px] p-2.5 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700 flex items-center justify-center transition-colors"
            title="TikTok Profiline Git"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>

      {/* Fallback for environments where clipboard is blocked */}
      {fallbackActive && (
        <div className="mt-3 pt-3 border-t border-zinc-800 flex items-center gap-2">
          <input
            type="text"
            readOnly
            value={result.username}
            onFocus={(e) => e.target.select()}
            className="flex-1 bg-black/60 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 font-mono"
          />
          <button
            onClick={() => setFallbackActive(false)}
            className="text-[11px] text-zinc-400 hover:text-zinc-200 px-2 py-1"
          >
            Kapat
          </button>
        </div>
      )}
    </div>
  );
}
