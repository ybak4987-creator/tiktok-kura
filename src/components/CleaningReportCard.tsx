import { useState } from 'react';
import { ShieldCheck, AlertTriangle, CheckCircle2, ChevronDown, ChevronUp, Ban, Users, RefreshCw } from 'lucide-react';
import { CleaningReport } from '../types/draw';

interface CleaningReportCardProps {
  report: CleaningReport;
  onDismiss?: () => void;
}

export function CleaningReportCard({ report, onDismiss }: CleaningReportCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getReasonBadge = (reason: 'duplicate' | 'profane' | 'invalid' | 'blacklisted') => {
    switch (reason) {
      case 'duplicate':
        return { label: 'Tekrar', color: 'text-amber-400 bg-amber-950/40 border-amber-800/60' };
      case 'profane':
        return { label: 'Uygunsuz İfade', color: 'text-rose-400 bg-rose-950/40 border-rose-800/60' };
      case 'invalid':
        return { label: 'Geçersiz Format', color: 'text-zinc-400 bg-zinc-900 border-zinc-700' };
      case 'blacklisted':
        return { label: 'Kara Liste', color: 'text-purple-400 bg-purple-950/40 border-purple-800/60' };
    }
  };

  const totalFiltered =
    report.duplicateCount + report.profaneCount + report.invalidCount + report.blacklistedCount;

  return (
    <div className="rounded-2xl bg-zinc-900/95 border border-zinc-800 p-4 sm:p-5 shadow-xl space-y-3.5">
      <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-zinc-800/80">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#25F4EE]/10 border border-[#25F4EE]/30 flex items-center justify-center">
            <ShieldCheck className="w-4 h-4 text-[#25F4EE]" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider">
              Kura Güvenliği & Temizleme Raporu
            </h3>
            <span className="text-[10px] text-zinc-400 font-mono">
              Otomatik duplicate, uygunsuzluk ve kura adaleti denetimi tamamlandı
            </span>
          </div>
        </div>

        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-[11px] text-zinc-400 hover:text-zinc-200 px-2 py-1 rounded-md"
          >
            Gizle
          </button>
        )}
      </div>

      {/* Primary Highlight Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {/* Toplam Kayıt */}
        <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800">
          <span className="text-[10px] uppercase font-bold text-zinc-400 block">Toplam Kayıt</span>
          <span className="text-lg sm:text-xl font-extrabold text-white font-mono tabular-nums">
            {report.totalInputLines.toLocaleString('tr-TR')}
          </span>
        </div>

        {/* Benzersiz Kullanıcı */}
        <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800">
          <span className="text-[10px] uppercase font-bold text-zinc-400 block">Benzersiz Kullanıcı</span>
          <span className="text-lg sm:text-xl font-extrabold text-[#25F4EE] font-mono tabular-nums">
            {report.uniqueUsers.toLocaleString('tr-TR')}
          </span>
        </div>

        {/* Kuraya Girecek Kişi */}
        <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-800/50 col-span-2 sm:col-span-1">
          <span className="text-[10px] uppercase font-bold text-emerald-400 block">Kuraya Girecek Kişi</span>
          <span className="text-lg sm:text-xl font-extrabold text-emerald-300 font-mono tabular-nums">
            {report.eligibleCount.toLocaleString('tr-TR')}
          </span>
        </div>

        {/* Tekrarlanan Kayıt */}
        <div className="p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800">
          <span className="text-[10px] uppercase font-bold text-zinc-400 block">Tekrarlanan Kayıt</span>
          <span className="text-sm sm:text-base font-bold text-amber-400 font-mono tabular-nums">
            {report.duplicateCount.toLocaleString('tr-TR')}
          </span>
        </div>

        {/* Uygunsuz/Engellenen Kayıt */}
        <div className="p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800">
          <span className="text-[10px] uppercase font-bold text-zinc-400 block">🚫 Uygunsuz Kayıt</span>
          <span className="text-sm sm:text-base font-bold text-rose-400 font-mono tabular-nums">
            {report.profaneCount.toLocaleString('tr-TR')}
          </span>
        </div>

        {/* Geçersiz / Kara Liste */}
        <div className="p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800">
          <span className="text-[10px] uppercase font-bold text-zinc-400 block">Geçersiz / Kara Liste</span>
          <span className="text-sm sm:text-base font-bold text-zinc-300 font-mono tabular-nums">
            {(report.invalidCount + report.blacklistedCount).toLocaleString('tr-TR')}
          </span>
        </div>
      </div>

      {/* Fairness Guarantee Notice */}
      <div className="p-3 rounded-xl bg-zinc-950/70 border border-zinc-800 flex items-start gap-2.5 text-xs text-zinc-300">
        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
        <p className="leading-relaxed text-[11px] sm:text-xs">
          <strong className="text-white font-semibold">Kura Adaleti Garantisi:</strong> Aynı kullanıcı adı listeye onlarca kez eklenmiş olsa dahi tek bir kayda indirgendi. Her benzersiz kullanıcının kura kazanma şansı tam olarak eşittir.
        </p>
      </div>

      {/* Detailed Excluded Samples Dropdown */}
      {report.sampleExcluded && report.sampleExcluded.length > 0 && (
        <div className="pt-1">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full flex items-center justify-between text-xs font-semibold text-zinc-400 hover:text-zinc-200 py-1"
          >
            <span>Filtrelenen Örnek Kayıtlar ({report.sampleExcluded.length})</span>
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {isExpanded && (
            <div className="mt-2 space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {report.sampleExcluded.map((item, idx) => {
                const badge = getReasonBadge(item.reason);
                return (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 rounded-lg bg-zinc-950 border border-zinc-800/80 text-xs font-mono"
                  >
                    <span className="text-zinc-300 truncate max-w-[200px]">{item.username}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded border font-sans font-semibold ${badge.color}`}>
                      {badge.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
