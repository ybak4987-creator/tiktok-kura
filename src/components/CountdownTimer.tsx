import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface CountdownTimerProps {
  targetTimeStr: string; // e.g., "19:00"
  onTimeReached?: () => void;
  isActive?: boolean;
}

export function CountdownTimer({ targetTimeStr, onTimeReached, isActive = true }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number; totalSeconds: number }>({
    hours: 0,
    minutes: 0,
    seconds: 0,
    totalSeconds: 0,
  });

  useEffect(() => {
    let triggered = false;

    function calculate() {
      const now = new Date();
      const [targetHours, targetMinutes] = targetTimeStr.split(':').map((n) => parseInt(n, 10) || 0);

      const target = new Date(now);
      target.setHours(targetHours, targetMinutes, 0, 0);

      // If target time already passed today, target tomorrow's time
      if (target.getTime() <= now.getTime()) {
        target.setDate(target.getDate() + 1);
      }

      const diffMs = target.getTime() - now.getTime();
      const totalSeconds = Math.max(0, Math.floor(diffMs / 1000));

      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;

      setTimeLeft({ hours, minutes, seconds, totalSeconds });

      if (totalSeconds === 0 && !triggered && isActive) {
        triggered = true;
        if (onTimeReached) {
          onTimeReached();
        }
      }
    }

    calculate();
    const interval = setInterval(calculate, 1000);
    return () => clearInterval(interval);
  }, [targetTimeStr, onTimeReached, isActive]);

  const pad = (n: number) => n.toString().padStart(2, '0');

  return (
    <div className="w-full flex flex-col items-center">
      <div className="flex items-center gap-1.5 text-xs uppercase tracking-widest text-zinc-400 font-semibold mb-2">
        <Clock className="w-3.5 h-3.5 text-[#25F4EE]" />
        <span>Kuraya Kalan</span>
      </div>

      <div className="grid grid-cols-3 gap-2.5 sm:gap-4 w-full max-w-xs">
        {/* Hours */}
        <div className="flex flex-col items-center p-3 rounded-2xl bg-zinc-900/90 border border-zinc-800/80 shadow-lg shadow-black/40 relative overflow-hidden group">
          <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-[#25F4EE]/50 to-transparent" />
          <span className="text-3xl sm:text-4xl font-extrabold text-white font-mono tabular-nums tracking-tight">
            {pad(timeLeft.hours)}
          </span>
          <span className="text-[10px] sm:text-xs font-medium text-zinc-400 mt-1 uppercase">Saat</span>
        </div>

        {/* Minutes */}
        <div className="flex flex-col items-center p-3 rounded-2xl bg-zinc-900/90 border border-zinc-800/80 shadow-lg shadow-black/40 relative overflow-hidden group">
          <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-[#FE2C55]/50 to-transparent" />
          <span className="text-3xl sm:text-4xl font-extrabold text-white font-mono tabular-nums tracking-tight">
            {pad(timeLeft.minutes)}
          </span>
          <span className="text-[10px] sm:text-xs font-medium text-zinc-400 mt-1 uppercase">Dakika</span>
        </div>

        {/* Seconds */}
        <div className="flex flex-col items-center p-3 rounded-2xl bg-zinc-900/90 border border-zinc-800/80 shadow-lg shadow-black/40 relative overflow-hidden group">
          <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-[#25F4EE]/50 to-transparent" />
          <span className="text-3xl sm:text-4xl font-extrabold text-[#25F4EE] font-mono tabular-nums tracking-tight animate-pulse">
            {pad(timeLeft.seconds)}
          </span>
          <span className="text-[10px] sm:text-xs font-medium text-zinc-400 mt-1 uppercase">Saniye</span>
        </div>
      </div>
    </div>
  );
}
