import { useState } from 'react';
import { Lock, KeyRound, Eye, EyeOff, ArrowLeft, ShieldAlert, Check } from 'lucide-react';
import { verifyAdminPassword, setAdminSessionAuthenticated } from '../services/drawService';
import { BrandLogo } from './BrandLogo';

interface AdminLoginGateProps {
  onSuccess: () => void;
  onGoBack: () => void;
}

export function AdminLoginGate({ onSuccess, onGoBack }: AdminLoginGateProps) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setError('Lütfen yönetici şifresini girin.');
      return;
    }

    setLoading(true);
    setError(null);

    setTimeout(() => {
      const isValid = verifyAdminPassword(password);
      setLoading(false);

      if (isValid) {
        setAdminSessionAuthenticated(true);
        onSuccess();
      } else {
        setError('Hatalı yönetici şifresi! Lütfen tekrar deneyin.');
        setPassword('');
      }
    }, 250);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm rounded-3xl bg-zinc-900/95 border border-zinc-800 p-6 sm:p-7 shadow-2xl shadow-black relative overflow-hidden space-y-5">
        {/* Glow accent */}
        <div className="absolute -top-12 -right-12 w-28 h-28 bg-[#FE2C55]/15 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-28 h-28 bg-[#25F4EE]/15 rounded-full blur-2xl pointer-events-none" />

        {/* Top Header */}
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center justify-center shadow-inner relative">
            <Lock className="w-6 h-6 text-purple-400" />
            <span className="w-2 h-2 rounded-full bg-purple-500 absolute top-2 right-2 animate-ping" />
          </div>

          <h2 className="text-xl font-black text-white tracking-tight">
            Yönetici Girişi
          </h2>
          <p className="text-xs text-zinc-400">
            Kura yönetimi ve ayarlar için lütfen şifrenizi girin.
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label
              htmlFor="admin-password-input"
              className="block text-xs font-bold text-zinc-300"
            >
              Yönetici Şifresi
            </label>
            <div className="relative flex items-center">
              <KeyRound className="w-4 h-4 text-zinc-500 absolute left-3.5" />
              <input
                id="admin-password-input"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="Şifrenizi yazın..."
                autoFocus
                className="w-full min-h-[46px] pl-10 pr-10 rounded-2xl bg-zinc-950 border border-zinc-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 text-white placeholder-zinc-600 text-sm font-mono transition-all outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 text-zinc-500 hover:text-zinc-300 p-1"
                title={showPassword ? 'Şifreyi gizle' : 'Şifreyi göster'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Error notice */}
          {error && (
            <div className="p-3 rounded-xl bg-rose-950/70 border border-rose-800 text-rose-300 text-xs flex items-center gap-2 animate-shake">
              <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || !password}
            className="w-full min-h-[46px] py-2.5 px-4 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:brightness-110 disabled:opacity-40 text-white font-black text-sm tracking-wide shadow-lg shadow-purple-600/20 flex items-center justify-center gap-2 active:scale-98 transition-all"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Lock className="w-4 h-4" />
                <span>GİRİŞ YAP</span>
              </>
            )}
          </button>
        </form>

        {/* Security hint note */}
        <div className="p-3 rounded-xl bg-zinc-950/80 border border-zinc-800/80 text-[11px] text-zinc-400 space-y-1">
          <p className="font-semibold text-zinc-300">
            🔑 Varsayılan Yönetici Şifresi: <code className="text-purple-300 font-mono bg-purple-950/60 px-1.5 py-0.5 rounded border border-purple-800/60">admin123</code>
          </p>
          <p className="text-[10px] text-zinc-500">
            Panele girdikten sonra bu şifreyi dilediğiniz gibi güncelleyebilirsiniz.
          </p>
        </div>

        {/* Safe Back Link */}
        <div className="pt-1 text-center">
          <button
            type="button"
            onClick={onGoBack}
            className="text-xs text-zinc-400 hover:text-zinc-200 inline-flex items-center gap-1.5 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kura Sayfasına Geri Dön</span>
          </button>
        </div>
      </div>
    </div>
  );
}
