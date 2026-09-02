import React from 'react';
import { WifiOff } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { usePreferences } from '../context/PreferencesContext';

export const OfflineIndicator: React.FC = () => {
  const { isOnline } = usePWAInstall();
  const { t } = usePreferences();

  if (isOnline) return null;

  return (
    <div
      id="offline-banner"
      className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 z-50 flex items-center gap-2.5 rounded-xl bg-amber-600 dark:bg-amber-700 px-4 py-2.5 text-xs font-medium text-white shadow-xl shadow-black/40 border border-amber-500/50 animate-bounce"
    >
      <WifiOff className="w-4 h-4 shrink-0" />
      <span>{t('offlineDesc')}</span>
    </div>
  );
};

