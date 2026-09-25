import { useState } from 'react';
import {
  History,
  Calendar,
  Trophy,
  Copy,
  Check,
  Trash2,
  Search,
  Video,
  Sparkles,
  RefreshCw,
  FileSpreadsheet,
  Download,
} from 'lucide-react';
import { DrawHistoryRecord } from '../types/draw';

interface DrawHistoryTableProps {
  history: DrawHistoryRecord[];
  onDeleteRecord?: (id: string) => void;
  onClearHistory?: () => void;
}

export function DrawHistoryTable({
  history,
  onDeleteRecord,
  onClearHistory,
}: DrawHistoryTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [exportSuccess, setExportSuccess] = useState<boolean>(false);

  // Format ISO or date string to Turkish locale
  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('tr-TR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const handleCopyUsername = async (username: string, key: string) => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(username);
      } else {
        const input = document.createElement('input');
        input.value = username;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
      }
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch (err) {
      console.warn('Copy failed:', err);
    }
  };

  const handleCopyRecordSummary = async (record: DrawHistoryRecord, key: string) => {
    const text = `🏆 Kura Tarihi: ${formatDate(record.drawDate)} (${record.drawTime})\n🥇 1. Video: ${
      record.winners.find((w) => w.videoNumber === 1)?.username || '-'
    }\n🥈 2. Video: ${
      record.winners.find((w) => w.videoNumber === 2)?.username || '-'
    }\n🥉 3. Video: ${
      record.winners.find((w) => w.videoNumber === 3)?.username || '-'
    }`;

    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
      }
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch (err) {
      console.warn('Copy summary failed:', err);
    }
  };

  // Filter history by search query
  const filteredHistory = history.filter((record) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase().trim();
    const dateMatches = formatDate(record.drawDate).toLowerCase().includes(query);
    const timeMatches = (record.drawTime || '').toLowerCase().includes(query);
    const winnerMatches = record.winners.some((w) => w.username.toLowerCase().includes(query));
    return dateMatches || timeMatches || winnerMatches;
  });

  // Export historical data to CSV format
  const handleExportCSV = () => {
    const recordsToExport = filteredHistory.length > 0 ? filteredHistory : history;
    if (recordsToExport.length === 0) return;

    const escapeCsvCell = (val: string | number | undefined | null) => {
      if (val === undefined || val === null) return '""';
      const str = String(val);
      return `"${str.replace(/"/g, '""')}"`;
    };

    const headers = [
      'Kura ID',
      'Çekiliş Tarihi',
      'Çekiliş Saati',
      'Toplam Katılımcı',
      '1. Video Sahibi (🥇)',
      '2. Video Sahibi (🥈)',
      '3. Video Sahibi (🥉)',
      'Tüm Kazananlar',
      'Kura Başlığı',
      'Kayıt Durumu',
    ];

    const rows = recordsToExport.map((record) => {
      const w1 = record.winners.find((w) => w.videoNumber === 1)?.username || '-';
      const w2 = record.winners.find((w) => w.videoNumber === 2)?.username || '-';
      const w3 = record.winners.find((w) => w.videoNumber === 3)?.username || '-';
      const allWinners = record.winners
        .map((w) => `Video ${w.videoNumber}: ${w.username}`)
        .join(' | ');

      return [
        record.id,
        formatDate(record.drawDate),
        record.drawTime || '19:00',
        record.totalEligibleCount ?? record.winners.length,
        w1,
        w2,
        w3,
        allWinners,
        record.title || 'Canlı Takipçi Kurası',
        record.status === 'completed' ? 'Tamamlandı' : 'Arşivlendi',
      ]
        .map(escapeCsvCell)
        .join(',');
    });

    // \uFEFF ensures UTF-8 BOM so Excel and other spreadsheet viewers render Turkish characters correctly
    const csvContent = '\uFEFF' + [headers.map(escapeCsvCell).join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const dateStamp = new Date().toISOString().slice(0, 10);
    link.setAttribute('download', `tiktok-cekilis-gecmisi-${dateStamp}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setExportSuccess(true);
    setTimeout(() => setExportSuccess(false), 2500);
  };

  return (
    <div className="rounded-3xl bg-zinc-900/90 border border-zinc-800/80 p-5 sm:p-6 shadow-xl space-y-4">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800/80">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <History className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-black uppercase tracking-wider text-white">
                Çekiliş Geçmişi
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-[10px] font-mono text-zinc-300 font-bold">
                {history.length} Kura Kayıtlı
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              Gerçekleşen çekilişlerin tarih, saat ve kazanan video hakları kayıtları
            </p>
          </div>
        </div>

        {/* Action buttons: CSV Export & Clear history */}
        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          {history.length > 0 && (
            <button
              onClick={handleExportCSV}
              type="button"
              className="text-[11px] font-bold px-3 py-1.5 rounded-xl bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 hover:text-emerald-200 border border-emerald-800/80 hover:border-emerald-700 flex items-center gap-1.5 transition-all active:scale-95 shadow-sm"
              title="Çekiliş geçmişini Excel, Google E-Tablolar ve Apple Numbers uyumlu CSV dosyası olarak indir"
            >
              {exportSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-300">CSV İndirildi!</span>
                </>
              ) : (
                <>
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                  <span>
                    CSV İndir {searchQuery.trim() ? `(${filteredHistory.length})` : ''}
                  </span>
                </>
              )}
            </button>
          )}

          {history.length > 0 && onClearHistory && (
            <button
              onClick={() => {
                if (window.confirm('Tüm çekiliş geçmişi kayıtlarını silmek istediğinize emin misiniz?')) {
                  onClearHistory();
                }
              }}
              type="button"
              className="text-[11px] px-3 py-1.5 rounded-xl bg-zinc-950 hover:bg-rose-950/60 text-zinc-400 hover:text-rose-300 border border-zinc-800 hover:border-rose-900/70 flex items-center gap-1.5 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Geçmişi Temizle</span>
            </button>
          )}
        </div>
      </div>

      {/* Search Filter Bar */}
      {history.length > 0 && (
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tarih veya kullanıcı adı ile geçmişte ara... (@burak, 24 Eylül)"
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:border-[#25F4EE] focus:ring-1 focus:ring-[#25F4EE] transition-colors font-mono"
          />
        </div>
      )}

      {/* Content Area */}
      {filteredHistory.length === 0 ? (
        <div className="p-8 rounded-2xl bg-zinc-950/60 border border-dashed border-zinc-800 text-center space-y-2">
          <History className="w-8 h-8 text-zinc-600 mx-auto" />
          <p className="text-xs font-semibold text-zinc-300">
            {searchQuery ? 'Aramanıza uygun kura kaydı bulunamadı.' : 'Henüz kaydedilmiş çekiliş geçmişi yok.'}
          </p>
          <p className="text-[11px] text-zinc-500 max-w-xs mx-auto">
            Kura tamamlanıp sonuçlar yayınlandığında kazananlar otomatik olarak bu tabloya arşivlenir.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* DESKTOP / TABLET STRUCTURED TABLE (hidden on very narrow screens) */}
          <div className="hidden md:block overflow-x-auto rounded-2xl border border-zinc-800/80 bg-zinc-950/70">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-900/80 text-[10px] font-bold uppercase tracking-wider text-zinc-400 border-b border-zinc-800">
                <tr>
                  <th className="py-3 px-4">Tarih & Saat</th>
                  <th className="py-3 px-4">
                    <span className="flex items-center gap-1 text-amber-400 font-bold">
                      <span>🥇</span> Video 1 Sahibi
                    </span>
                  </th>
                  <th className="py-3 px-4">
                    <span className="flex items-center gap-1 text-[#25F4EE] font-bold">
                      <span>🥈</span> Video 2 Sahibi
                    </span>
                  </th>
                  <th className="py-3 px-4">
                    <span className="flex items-center gap-1 text-[#FE2C55] font-bold">
                      <span>🥉</span> Video 3 Sahibi
                    </span>
                  </th>
                  <th className="py-3 px-3 text-center">Katılımcı</th>
                  <th className="py-3 px-3 text-right">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 font-mono">
                {filteredHistory.map((record) => {
                  const w1 = record.winners.find((w) => w.videoNumber === 1);
                  const w2 = record.winners.find((w) => w.videoNumber === 2);
                  const w3 = record.winners.find((w) => w.videoNumber === 3);

                  return (
                    <tr
                      key={record.id}
                      className="hover:bg-zinc-900/40 transition-colors group"
                    >
                      {/* Tarih & Saat */}
                      <td className="py-3.5 px-4 font-sans whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                          <div>
                            <span className="font-bold text-white text-xs block">
                              {formatDate(record.drawDate)}
                            </span>
                            <span className="text-[10px] font-mono text-zinc-400">
                              Saat: {record.drawTime || '19:00'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Video 1 */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {w1 ? (
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-amber-300">
                              {w1.username}
                            </span>
                            <button
                              onClick={() => handleCopyUsername(w1.username, `${record.id}_w1`)}
                              className="p-1 rounded hover:bg-zinc-800 text-zinc-500 hover:text-white transition-colors"
                              title="Kullanıcı adını kopyala"
                            >
                              {copiedKey === `${record.id}_w1` ? (
                                <Check className="w-3 h-3 text-emerald-400" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        ) : (
                          <span className="text-zinc-600">-</span>
                        )}
                      </td>

                      {/* Video 2 */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {w2 ? (
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-[#25F4EE]">
                              {w2.username}
                            </span>
                            <button
                              onClick={() => handleCopyUsername(w2.username, `${record.id}_w2`)}
                              className="p-1 rounded hover:bg-zinc-800 text-zinc-500 hover:text-white transition-colors"
                              title="Kullanıcı adını kopyala"
                            >
                              {copiedKey === `${record.id}_w2` ? (
                                <Check className="w-3 h-3 text-emerald-400" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        ) : (
                          <span className="text-zinc-600">-</span>
                        )}
                      </td>

                      {/* Video 3 */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {w3 ? (
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-[#FE2C55]">
                              {w3.username}
                            </span>
                            <button
                              onClick={() => handleCopyUsername(w3.username, `${record.id}_w3`)}
                              className="p-1 rounded hover:bg-zinc-800 text-zinc-500 hover:text-white transition-colors"
                              title="Kullanıcı adını kopyala"
                            >
                              {copiedKey === `${record.id}_w3` ? (
                                <Check className="w-3 h-3 text-emerald-400" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        ) : (
                          <span className="text-zinc-600">-</span>
                        )}
                      </td>

                      {/* Havuz */}
                      <td className="py-3.5 px-3 text-center whitespace-nowrap">
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300">
                          {record.totalEligibleCount ? `${record.totalEligibleCount} Kişi` : '100+'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-3 text-right whitespace-nowrap font-sans">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleCopyRecordSummary(record, `${record.id}_all`)}
                            className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 transition-colors"
                            title="Tüm sonuçları kopyala"
                          >
                            {copiedKey === `${record.id}_all` ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>

                          {onDeleteRecord && (
                            <button
                              onClick={() => onDeleteRecord(record.id)}
                              className="p-1.5 rounded-lg hover:bg-rose-950 text-zinc-500 hover:text-rose-400 transition-colors"
                              title="Bu kaydı sil"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* MOBILE RESPONSIVE CARDS (shown on smaller mobile screens) */}
          <div className="md:hidden space-y-2.5">
            {filteredHistory.map((record) => {
              const w1 = record.winners.find((w) => w.videoNumber === 1);
              const w2 = record.winners.find((w) => w.videoNumber === 2);
              const w3 = record.winners.find((w) => w.videoNumber === 3);

              return (
                <div
                  key={record.id}
                  className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800/80 space-y-3"
                >
                  {/* Top card header */}
                  <div className="flex items-center justify-between pb-2 border-b border-zinc-800/60">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-[#25F4EE]" />
                      <span className="font-bold text-xs text-white">
                        {formatDate(record.drawDate)}
                      </span>
                      <span className="text-[10px] font-mono text-zinc-400 px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800">
                        {record.drawTime || '19:00'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleCopyRecordSummary(record, `${record.id}_mob_all`)}
                        className="p-1.5 rounded-lg bg-zinc-900 text-zinc-300 border border-zinc-800"
                        title="Tümünü Kopyala"
                      >
                        {copiedKey === `${record.id}_mob_all` ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>

                      {onDeleteRecord && (
                        <button
                          onClick={() => onDeleteRecord(record.id)}
                          className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400"
                          title="Kaydı Sil"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* 3 Winner lines */}
                  <div className="space-y-1.5 font-mono text-xs">
                    {w1 && (
                      <div className="flex items-center justify-between p-2 rounded-xl bg-zinc-900/60 border border-zinc-800/60">
                        <div className="flex items-center gap-2">
                          <span>🥇</span>
                          <span className="text-[10px] font-sans font-bold text-zinc-400">Video 1</span>
                        </div>
                        <span className="font-bold text-amber-300">{w1.username}</span>
                      </div>
                    )}

                    {w2 && (
                      <div className="flex items-center justify-between p-2 rounded-xl bg-zinc-900/60 border border-zinc-800/60">
                        <div className="flex items-center gap-2">
                          <span>🥈</span>
                          <span className="text-[10px] font-sans font-bold text-zinc-400">Video 2</span>
                        </div>
                        <span className="font-bold text-[#25F4EE]">{w2.username}</span>
                      </div>
                    )}

                    {w3 && (
                      <div className="flex items-center justify-between p-2 rounded-xl bg-zinc-900/60 border border-zinc-800/60">
                        <div className="flex items-center gap-2">
                          <span>🥉</span>
                          <span className="text-[10px] font-sans font-bold text-zinc-400">Video 3</span>
                        </div>
                        <span className="font-bold text-[#FE2C55]">{w3.username}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
