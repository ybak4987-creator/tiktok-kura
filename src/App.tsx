/**
 * TIKTOK KURA - Mobil Öncelikli Takipçi Kura Sistemi
 */
import { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { PublicView } from './components/PublicView';
import { AdminView } from './components/AdminView';
import { AdminLoginGate } from './components/AdminLoginGate';
import { isAdminSessionAuthenticated, setAdminSessionAuthenticated } from './services/drawService';
import { ExternalLink } from 'lucide-react';
import { BRAND } from './constants/brand';

export default function App() {
  // Check if current browser URL points to admin route
  // Supports: /admin, /admin/, #/admin, #admin, ?view=admin, ?admin
  const checkIsAdminUrl = (): boolean => {
    if (typeof window === 'undefined') return false;
    const path = window.location.pathname.toLowerCase();
    const hash = window.location.hash.toLowerCase();
    const search = window.location.search.toLowerCase();
    const params = new URLSearchParams(window.location.search);

    return (
      path === '/admin' ||
      path === '/admin/' ||
      path.endsWith('/admin') ||
      path.endsWith('/admin/') ||
      path.includes('/admin') ||
      hash.includes('admin') ||
      params.get('view') === 'admin' ||
      search.includes('admin')
    );
  };

  const [currentView, setCurrentView] = useState<'public' | 'admin'>(() =>
    checkIsAdminUrl() ? 'admin' : 'public'
  );

  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() =>
    isAdminSessionAuthenticated()
  );

  // Navigate function that updates URL in browser history and synchronizes state
  const handleViewChange = useCallback((view: 'public' | 'admin') => {
    setCurrentView(view);
    const targetPath = view === 'admin' ? '/admin' : '/';
    
    // Only push if path is actually different to avoid duplicate history
    if (window.location.pathname !== targetPath) {
      window.history.pushState({ view }, '', targetPath);
    }
  }, []);

  // Listen to browser URL changes (back/forward button, manual address bar edits)
  useEffect(() => {
    const handleLocationSync = () => {
      const isAdmin = checkIsAdminUrl();
      setCurrentView(isAdmin ? 'admin' : 'public');
      setIsAdminAuthenticated(isAdminSessionAuthenticated());
    };

    window.addEventListener('popstate', handleLocationSync);
    window.addEventListener('hashchange', handleLocationSync);

    // Initial synchronization on mount
    handleLocationSync();

    return () => {
      window.removeEventListener('popstate', handleLocationSync);
      window.removeEventListener('hashchange', handleLocationSync);
    };
  }, []);

  const handleAdminLogout = () => {
    setAdminSessionAuthenticated(false);
    setIsAdminAuthenticated(false);
    handleViewChange('public');
  };

  return (
    <div className="min-h-screen bg-[#0b0c10] text-zinc-100 flex flex-col selection:bg-[#FE2C55]/30 selection:text-white font-sans">
      {/* Top Navbar: Adapts cleanly based on URL route (no admin shortcut in public view) */}
      <Navbar
        currentView={currentView}
        onViewChange={handleViewChange}
      />

      {/* Main Content Area */}
      <main className="flex-1 pb-16 sm:pb-12">
        {currentView === 'public' ? (
          <PublicView />
        ) : !isAdminAuthenticated ? (
          /* Password Protected Admin Gate */
          <AdminLoginGate
            onSuccess={() => setIsAdminAuthenticated(true)}
            onGoBack={() => handleViewChange('public')}
          />
        ) : (
          <AdminView
            onGoToPublic={() => handleViewChange('public')}
            onLogout={handleAdminLogout}
          />
        )}
      </main>

      {/* Quiet, Professional Footer */}
      <footer className="border-t border-zinc-800/60 py-4 text-center text-xs text-zinc-400">
        <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <span className="font-bold text-zinc-300">TIKTOK KURA</span>
            <span aria-hidden="true">·</span>
            <span>Video Hakları Dağıtım Sistemi</span>
          </div>

          <div className="flex items-center gap-4 text-xs">
            {/* TikTok Official Account Link */}
            <div className="flex items-center gap-1.5">
              <span>TikTok:</span>
              <a
                href={BRAND.profileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-white hover:text-[#25F4EE] transition-colors inline-flex items-center gap-1 underline underline-offset-2"
              >
                <span>{BRAND.username}</span>
                <ExternalLink className="w-3 h-3 text-[#25F4EE]" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
