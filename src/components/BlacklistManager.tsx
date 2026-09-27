import { useState } from 'react';
import { Ban, Plus, X, ShieldAlert, Check } from 'lucide-react';
import { getBlacklist, addToBlacklist, removeFromBlacklist, clearBlacklist } from '../services/drawService';

interface BlacklistManagerProps {
  onListUpdated?: () => void;
}

export function BlacklistManager({ onListUpdated }: BlacklistManagerProps) {
  const [blacklist, setBlacklist] = useState<string[]>(getBlacklist());
  const [newUsername, setNewUsername] = useState<string>('');
  const [feedback, setFeedback] = useState<string>('');

  const handleAdd = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newUsername.trim()) return;

    const updated = addToBlacklist(newUsername);
    setBlacklist(updated);
    setNewUsername('');
    setFeedback('Kara listeye eklendi.');
    setTimeout(() => setFeedback(''), 2500);
    if (onListUpdated) onListUpdated();
  };

  const handleRemove = (username: string) => {
    const updated = removeFromBlacklist(username);
    setBlacklist(updated);
    setFeedback('Kara listeden kaldırıldı.');
    setTimeout(() => setFeedback(''), 2500);
    if (onListUpdated) onListUpdated();
  };

  const handleClear = () => {
    if (confirm('Kara listeyi tamamen temizlemek istediğinize emin misiniz?')) {
      clearBlacklist();
      setBlacklist([]);
      setFeedback('Kara liste temizlendi.');
      setTimeout(() => setFeedback(''), 2500);
      if (onListUpdated) onListUpdated();
    }
  };

  return (
    <div className="rounded-3xl bg-zinc-900/90 border border-zinc-800/80 p-5 sm:p-6 shadow-xl space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Ban className="w-4 h-4 text-purple-400" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-200">
            Kara Liste (Engelli Hesaplar)
          </h2>
        </div>
        <span className="text-xs font-mono text-purple-300 font-semibold px-2 py-0.5 rounded-md bg-purple-950/40 border border-purple-800/50">
          {blacklist.length} Hesap Engelli
        </span>
      </div>

      <p className="text-xs text-zinc-400">
        Kara listedeki kullanıcılar takipçi listesinde bulunsa dahi kura çekilişine dahil edilmez ve asla seçilemez.
      </p>

      {/* Add to Blacklist Form */}
      <form onSubmit={handleAdd} className="flex gap-2">
        <input
          type="text"
          value={newUsername}
          onChange={(e) => setNewUsername(e.target.value)}
          placeholder="@engellenecek_kullanici"
          className="flex-1 min-h-[44px] px-3.5 py-2 rounded-xl bg-zinc-950 border border-zinc-700 text-white font-mono text-xs sm:text-sm focus:border-purple-400 focus:ring-1 focus:ring-purple-400 transition-colors"
        />
        <button
          type="submit"
          className="min-h-[44px] px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 active:scale-95 transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Ekle</span>
        </button>
      </form>

      {/* Feedback message */}
      {feedback && (
        <div className="text-xs text-purple-300 flex items-center gap-1.5">
          <Check className="w-3.5 h-3.5 text-purple-400" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Active Blacklist Tags */}
      {blacklist.length > 0 ? (
        <div className="space-y-2 pt-1">
          <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto p-1">
            {blacklist.map((user) => (
              <span
                key={user}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-950 border border-purple-900/60 text-xs font-mono text-purple-200"
              >
                <span>{user}</span>
                <button
                  type="button"
                  onClick={() => handleRemove(user)}
                  className="hover:text-rose-400 p-0.5 rounded transition-colors"
                  title="Engeli Kaldır"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            ))}
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="button"
              onClick={handleClear}
              className="text-[11px] text-zinc-400 hover:text-rose-400 transition-colors"
            >
              Kara Listeyi Temizle
            </button>
          </div>
        </div>
      ) : (
        <div className="p-3 rounded-xl bg-zinc-950/40 border border-zinc-800/60 text-center text-xs text-zinc-400">
          Kara listede henüz kayıt bulunmuyor.
        </div>
      )}
    </div>
  );
}
