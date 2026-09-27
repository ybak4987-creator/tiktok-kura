import { Volume2, VolumeX, ShieldCheck, ArrowLeft } from 'lucide-react';
import { sounds } from '../utils/audio';
import { BrandLogo } from './BrandLogo';
import { BRAND } from '../constants/brand';
import { useState } from 'react';

interface NavbarProps {
  currentView: 'public' | 'admin';
  onViewChange: (view: 'public' | 'admin') => void;
}

export function Navbar({ currentView, onViewChange }: NavbarProps) {
  const [soundEnabled, setSoundEnabled] = useState(sounds.enabled);

  const toggleSound = () => {
    sounds.enabled = !sounds.enabled;
    setSoundEnabled(sounds.enabled);
    if (sounds.enabled) {
      sounds.playTick(500);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-[#0b0c10]/90 backdrop-blur-md border-b border-zinc-800/80 transition-colors">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
        {/* Zone 1: Logo & Brand Wordmark */}
        <a
          href="/"
          onClick={(e) => {
            e.preventDefault();
            onViewChange('public');
          }}
          className="flex items-center gap-2.5 group text-left cursor-pointer"
        >
          <BrandLogo size="sm" className="group-hover:scale-105 transition-transform" />
          <div className="flex flex-col">
            <span className="text-sm sm:text-base font-extrabold tracking-tight text-white group-hover:text-zinc-200 transition-colors leading-tight">
              TIKTOK KURA
            </span>
            <span className="text-[10px] text-zinc-400 font-mono hidden sm:inline leading-tight">
              {BRAND.username}
            </span>
          </div>
        </a>

        {/* Zone 2: Navigation state based strictly on URL */}
        <div className="flex items-center gap-2 sm:gap-3">
          {currentView === 'admin' ? (
            /* When on /admin, show Admin badge and button to return to public page */
            <div className="flex items-center gap-2">
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-950/50 border border-purple-800/60 text-purple-300 font-mono text-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
                <span>Yönetici Paneli</span>
              </span>

              <a
                href="/"
                onClick={(e) => {
                  e.preventDefault();
                  onViewChange('public');
                }}
                className="min-h-[34px] px-3 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white border border-zinc-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Kura Ekranı</span>
              </a>
            </div>
          ) : (
            /* When on public view (/), public followers see ONLY live badge (no admin button/links) */
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[11px] sm:text-xs">Canlı Kura</span>
              </span>
            </div>
          )}

          {/* Zone 3: Audio Control */}
          <button
            onClick={toggleSound}
            className={`min-h-[36px] min-w-[36px] p-2 rounded-xl border transition-colors flex items-center justify-center ${
              soundEnabled
                ? 'bg-zinc-900/80 border-zinc-800 text-zinc-300 hover:text-white'
                : 'bg-zinc-900/40 border-zinc-800/60 text-zinc-600 hover:text-zinc-400'
            }`}
            title={soundEnabled ? 'Sesi Kapat' : 'Sesi Aç'}
            aria-label={soundEnabled ? 'Sesi Kapat' : 'Sesi Aç'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-[#25F4EE]" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </header>
  );
}
