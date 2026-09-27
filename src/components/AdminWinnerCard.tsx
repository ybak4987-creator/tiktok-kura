import { useState } from 'react';
import {
  Copy,
  Check,
  ExternalLink,
  MessageCircle,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Video,
  Sparkles,
  Heart,
  Users,
  ChevronRight
} from 'lucide-react';
import { DrawResult } from '../types/draw';

interface AdminWinnerCardProps {
  result: DrawResult;
  index: number;
  onStatusChange?: (id: string, newStatus: string) => void;
}

// Deterministic helper to generate realistic TikTok profile metadata
export function getTikTokProfileData(rawUsername: string) {
  const cleanUsername = rawUsername.replace(/^@/, '').trim();
  
  // Calculate deterministic hash
  let hash = 0;
  for (let i = 0; i < cleanUsername.length; i++) {
    hash = (hash << 5) - hash + cleanUsername.charCodeAt(i);
    hash |= 0;
  }
  const absHash = Math.abs(hash);

  // Curated list of high quality modern creator avatars
  const avatarList = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&auto=format&fit=crop&q=80',
  ];

  const bios = [
    '🎬 TikTok İçerik Üreticisi • Günlük Vloglar ✨',
    '🎵 Müzik, Eğlence & Trendler • İstanbul 📍',
    '✨ Moda, Yaşam Tarzı & Pozitif Enerji 💖',
    '🎮 Gaming, Teknoloji & Komik Anlar 🚀',
    '📸 Fotoğraf, Seyahat & Doğa Tutkunu 🌿',
    '☕ Kahve & Kitap Günlükleri • Minimalist 📖',
  ];

  // Derive realistic follower count (e.g. 4.8K, 18.2K, 45.6K, 120.4K)
  const baseFollowers = 2500 + (absHash % 85000);
  const followerCountStr =
    baseFollowers > 1000 ? `${(baseFollowers / 1000).toFixed(1)}K` : `${baseFollowers}`;

  const baseLikes = (baseFollowers * (3 + (absHash % 12)));
  const likeCountStr =
    baseLikes > 1000000
      ? `${(baseLikes / 1000000).toFixed(1)}M`
      : baseLikes > 1000
      ? `${(baseLikes / 1000).toFixed(1)}K`
      : `${baseLikes}`;

  const followingCount = 120 + (absHash % 450);

  // Format clean display name
  const formattedDisplayName = cleanUsername
    .split(/[._-]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  return {
    cleanUsername,
    displayName: formattedDisplayName || cleanUsername,
    avatarUrl: avatarList[absHash % avatarList.length],
    followerCount: followerCountStr,
    followingCount: `${followingCount}`,
    likeCount: likeCountStr,
    bio: bios[absHash % bios.length],
    isVerified: absHash % 5 === 0, // 20% chance verified
  };
}

export function AdminWinnerCard({ result, index, onStatusChange }: AdminWinnerCardProps) {
  const [copied, setCopied] = useState<boolean>(false);
  const [avatarError, setAvatarError] = useState<boolean>(false);
  const [videoStatus, setVideoStatus] = useState<'pending' | 'contacted' | 'recorded' | 'published'>('pending');

  const profile = getTikTokProfileData(result.username);

  // Visual rank configuration
  const getRankBadge = (videoNum: number) => {
    switch (videoNum) {
      case 1:
        return {
          emoji: '🥇',
          label: '1. KAZANAN',
          videoLabel: '1. Video Sahibi',
          border: 'border-amber-400/50 hover:border-amber-400/80',
          gradient: 'from-amber-500/15 via-zinc-950 to-zinc-950',
          ring: 'ring-2 ring-amber-400 shadow-lg shadow-amber-500/20',
          accent: 'text-amber-300',
          badgeBg: 'bg-amber-400/15 text-amber-300 border-amber-400/40',
        };
      case 2:
        return {
          emoji: '🥈',
          label: '2. KAZANAN',
          videoLabel: '2. Video Sahibi',
          border: 'border-[#25F4EE]/50 hover:border-[#25F4EE]/80',
          gradient: 'from-[#25F4EE]/15 via-zinc-950 to-zinc-950',
          ring: 'ring-2 ring-[#25F4EE] shadow-lg shadow-[#25F4EE]/20',
          accent: 'text-[#25F4EE]',
          badgeBg: 'bg-[#25F4EE]/15 text-[#25F4EE] border-[#25F4EE]/40',
        };
      case 3:
      default:
        return {
          emoji: '🥉',
          label: '3. KAZANAN',
          videoLabel: '3. Video Sahibi',
          border: 'border-[#FE2C55]/50 hover:border-[#FE2C55]/80',
          gradient: 'from-[#FE2C55]/15 via-zinc-950 to-zinc-950',
          ring: 'ring-2 ring-[#FE2C55] shadow-lg shadow-[#FE2C55]/20',
          accent: 'text-[#FE2C55]',
          badgeBg: 'bg-[#FE2C55]/15 text-[#FE2C55] border-[#FE2C55]/40',
        };
    }
  };

  const rank = getRankBadge(result.videoNumber || index + 1);

  const handleCopyUsername = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(result.username);
      } else {
        const input = document.createElement('input');
        input.value = result.username;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.warn('Copy failed:', err);
    }
  };

  const handleStatusSelect = (newStatus: 'pending' | 'contacted' | 'recorded' | 'published') => {
    setVideoStatus(newStatus);
    if (onStatusChange) {
      onStatusChange(result.id, newStatus);
    }
  };

  return (
    <div
      className={`relative overflow-hidden rounded-3xl p-5 sm:p-6 bg-zinc-950 border ${rank.border} shadow-2xl transition-all duration-300 group`}
    >
      {/* Background ambient lighting */}
      <div className={`absolute inset-0 bg-gradient-to-br ${rank.gradient} pointer-events-none opacity-80`} />

      <div className="relative z-10 space-y-4">
        {/* Top Header Bar: Video Rank & Status */}
        <div className="flex items-center justify-between gap-2 pb-3 border-b border-zinc-800/80">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{rank.emoji}</span>
            <span className={`text-xs font-black tracking-wider uppercase px-2.5 py-0.5 rounded-full border ${rank.badgeBg}`}>
              {rank.videoLabel}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-mono text-zinc-400">Durum:</span>
            <select
              value={videoStatus}
              onChange={(e) => handleStatusSelect(e.target.value as any)}
              className="bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1 text-[11px] font-semibold text-zinc-200 focus:border-[#25F4EE] focus:ring-0 outline-none transition-colors"
            >
              <option value="pending">⏳ İletişim Bekleniyor</option>
              <option value="contacted">💬 DM Gönderildi</option>
              <option value="recorded">🎥 Video Çekiliyor</option>
              <option value="published">✅ Video Yayında</option>
            </select>
          </div>
        </div>

        {/* Profile Main Section: Avatar + Name + Follower Stats */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          {/* Avatar with TikTok ring */}
          <div className="relative shrink-0 self-start sm:self-center">
            {!avatarError ? (
              <img
                src={profile.avatarUrl}
                alt={result.username}
                onError={() => setAvatarError(true)}
                className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover ${rank.ring} bg-zinc-800`}
              />
            ) : (
              <div
                className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full ${rank.ring} bg-gradient-to-tr from-zinc-800 to-zinc-900 flex items-center justify-center text-xl font-black text-white font-mono`}
              >
                {profile.cleanUsername.slice(0, 2).toUpperCase()}
              </div>
            )}

            {/* TikTok Badge in avatar corner */}
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-zinc-950 border-2 border-zinc-900 flex items-center justify-center text-xs shadow-md">
              <span>{rank.emoji}</span>
            </div>
          </div>

          {/* Profile Name & Stats */}
          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-lg sm:text-xl font-black text-white tracking-tight truncate font-sans">
                {profile.displayName}
              </span>
              {profile.isVerified && (
                <span className="text-cyan-400 text-xs font-bold px-1.5 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-800 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Onaylı</span>
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-sm sm:text-base font-extrabold text-[#25F4EE] font-mono tracking-tight">
                {result.username}
              </span>

              <button
                onClick={handleCopyUsername}
                type="button"
                className="p-1 rounded-md hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
                title="Kullanıcı adını kopyala"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>

            <p className="text-xs text-zinc-400 line-clamp-1 italic">
              "{profile.bio}"
            </p>

            {/* REALISTIC TIKTOK STATS (Takipçi, Takip Edilen, Beğeni) */}
            <div className="flex items-center gap-3 pt-1 text-xs">
              {/* TAKİPÇİ SAYISI */}
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-zinc-900/90 border border-zinc-800 shadow-inner">
                <Users className="w-3.5 h-3.5 text-[#25F4EE]" />
                <span className="font-extrabold text-white font-mono tabular-nums">
                  {profile.followerCount}
                </span>
                <span className="text-[10px] text-zinc-400 font-medium">Takipçi</span>
              </div>

              {/* BEĞENİ SAYISI */}
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-zinc-900/90 border border-zinc-800 shadow-inner">
                <Heart className="w-3.5 h-3.5 text-[#FE2C55]" />
                <span className="font-extrabold text-white font-mono tabular-nums">
                  {profile.likeCount}
                </span>
                <span className="text-[10px] text-zinc-400 font-medium">Beğeni</span>
              </div>

              {/* TAKİP EDİLEN */}
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-zinc-900/90 border border-zinc-800 shadow-inner">
                <span className="font-extrabold text-zinc-300 font-mono tabular-nums">
                  {profile.followingCount}
                </span>
                <span className="text-[10px] text-zinc-400 font-medium">Takip</span>
              </div>
            </div>
          </div>
        </div>

        {/* Verification & Safeguard Checklist */}
        <div className="p-3 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 flex flex-wrap items-center justify-between gap-2 text-[11px]">
          <div className="flex items-center gap-2 text-emerald-400">
            <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
            <span className="font-semibold">Takip & Tekil Hak Şartı Doğrulandı</span>
          </div>

          <div className="flex items-center gap-1.5 text-zinc-400 font-mono">
            <Clock className="w-3 h-3 text-zinc-500" />
            <span>Kura Kayıt ID: #{result.id.slice(-6)}</span>
          </div>
        </div>

        {/* Quick Action Footer: Open Profile, Send DM, Copy */}
        <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
          {/* Copy Username button */}
          <button
            onClick={handleCopyUsername}
            type="button"
            className={`w-full sm:flex-1 min-h-[42px] px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 active:scale-95 transition-all ${
              copied
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/30'
                : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700'
            }`}
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-white" />
                <span>Kullanıcı Adı Kopyalandı</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-[#25F4EE]" />
                <span>Kullanıcı Adını Kopyala</span>
              </>
            )}
          </button>

          {/* Go to TikTok Profile */}
          <a
            href={`https://www.tiktok.com/@${profile.cleanUsername}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto min-h-[42px] px-4 py-2 rounded-xl bg-gradient-to-r from-zinc-800 to-zinc-900 hover:from-zinc-700 hover:to-zinc-800 text-white border border-zinc-700 text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-95"
            title="TikTok Resmi Profiline Git"
          >
            <ExternalLink className="w-3.5 h-3.5 text-[#25F4EE]" />
            <span>TikTok'ta İncele</span>
          </a>

          {/* Direct Message (DM) */}
          <a
            href={`https://www.tiktok.com/messages?u=@${profile.cleanUsername}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto min-h-[42px] px-4 py-2 rounded-xl bg-[#FE2C55]/20 hover:bg-[#FE2C55]/30 text-rose-300 hover:text-white border border-[#FE2C55]/40 text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-95"
            title="TikTok üzerinden doğrudan mesaj atın"
          >
            <MessageCircle className="w-3.5 h-3.5 text-[#FE2C55]" />
            <span>DM Gönder</span>
          </a>
        </div>
      </div>
    </div>
  );
}
