import React, { useState } from 'react';
import { Download, Smartphone, Share, PlusSquare, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { usePreferences } from '../context/PreferencesContext';

export const PWAInstallButton: React.FC<{ collapsed?: boolean }> = ({ collapsed = false }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const { t } = usePreferences();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  // If already installed as a standalone PWA, hide the button
  if (isInstalled) {
    return null;
  }

  const handleInstallClick = async () => {
    setIsInstalling(true);
    try {
      await install();
    } finally {
      setIsInstalling(false);
    }
  };

  return (
    <>
      {/* Android / Chromium / Desktop Install Button */}
      {isInstallable && (
        <button
          id="btn-pwa-install"
          onClick={handleInstallClick}
          disabled={isInstalling}
          className={`flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium shadow-md shadow-blue-500/20 hover:from-blue-500 hover:to-indigo-500 active:scale-98 transition ${
            collapsed ? 'p-2.5 w-full' : 'px-3.5 py-2.5 text-xs w-full'
          }`}
          title="Install as Mobile / Desktop App"
        >
          <Download className="w-4 h-4 shrink-0 animate-bounce" />
          {!collapsed && <span>{t('installApp')}</span>}
        </button>
      )}

      {/* iOS Safari Guide Button (When on iOS browser) */}
      {isIOS && (
        <button
          id="btn-ios-install-guide"
          onClick={() => setShowIOSGuide(true)}
          className={`flex items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white shadow-xs transition ${
            collapsed ? 'p-2.5 w-full' : 'px-3.5 py-2 text-xs w-full'
          }`}
          title="Install on iOS Home Screen"
        >
          <Smartphone className="w-4 h-4 shrink-0 text-blue-600 dark:text-blue-400" />
          {!collapsed && <span>{t('installIOS')}</span>}
        </button>
      )}

      {/* Default fallback for other browsers or direct prompt */}
      {!isInstallable && !isIOS && (
        <button
          id="btn-app-info"
          onClick={() => setShowIOSGuide(true)}
          className={`flex items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white shadow-xs transition ${
            collapsed ? 'p-2.5 w-full' : 'px-3 py-2 text-xs w-full'
          }`}
          title="Mobile Download Instructions"
        >
          <Smartphone className="w-4 h-4 shrink-0 text-blue-600 dark:text-blue-400" />
          {!collapsed && <span>{t('mobilePWAReady')}</span>}
        </button>
      )}

      {/* iOS & Mobile Installation Instructions Modal */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl text-slate-900 dark:text-white">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-xs">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-900 dark:text-white">{t('pwaModalTitle')}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{t('pwaModalSubtitle')}</p>
                </div>
              </div>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 my-5 text-sm">
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 p-4">
                <div className="font-semibold text-blue-600 dark:text-blue-400 mb-2 flex items-center gap-2 text-xs">
                  <span className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400" />
                  {t('iosSafariHeader')}
                </div>
                <ol className="space-y-2 text-slate-700 dark:text-slate-300 text-xs list-decimal list-inside">
                  <li className="flex items-start gap-2">
                    <Share className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                    <span>{t('iosStep1')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <PlusSquare className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <span>{t('iosStep2')}</span>
                  </li>
                  <li>{t('iosStep3')}</li>
                </ol>
              </div>

              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 p-4">
                <div className="font-semibold text-emerald-700 dark:text-emerald-400 mb-2 flex items-center gap-2 text-xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-600 dark:bg-emerald-400" />
                  {t('androidDesktopHeader')}
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300">
                  {t('androidStep1')}
                </p>
              </div>
            </div>

            <button
              id="btn-close-install-guide"
              onClick={() => setShowIOSGuide(false)}
              className="w-full rounded-xl bg-slate-900 dark:bg-slate-100 py-2.5 text-sm font-semibold text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-white shadow-xs transition"
            >
              {t('gotItBtn')}
            </button>
          </div>
        </div>
      )}
    </>
  );
};

