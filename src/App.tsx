import React, { useState } from 'react';
import {
  Menu,
  Shield,
  Bell,
  MessageSquare,
  Users,
  BookOpen,
  Sun,
  Moon,
  Globe,
  Clock,
  LogOut
} from 'lucide-react';
import { ActiveTab } from './types';
import { AuthProvider, useAuth } from './context/AuthContext';
import { PreferencesProvider, usePreferences } from './context/PreferencesContext';
import { NotificationsProvider, useNotifications } from './context/NotificationsContext';
import { Sidebar } from './components/Sidebar';
import { NoticeBoard } from './components/NoticeBoard';
import { DirectMessages } from './components/DirectMessages';
import { UserDirectory } from './components/UserDirectory';
import { AuthModal } from './components/AuthModal';
import { SetupGuideModal } from './components/SetupGuideModal';
import { FirebaseConfigModal } from './components/FirebaseConfigModal';
import { OfflineIndicator } from './components/OfflineIndicator';

function MainApp() {
  const { currentUser, role, isAdmin, isApproved, logout } = useAuth();
  const { theme, toggleTheme, language, toggleLanguage, t } = usePreferences();
  const { markNoticesRead, markMessagesRead } = useNotifications();
  const [activeTab, setActiveTab] = useState<ActiveTab>('notices');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [initialRecipientUid, setInitialRecipientUid] = useState<string | null>(null);

  const handleSelectTab = (tab: ActiveTab) => {
    setActiveTab(tab);
    if (tab === 'notices') markNoticesRead();
    if (tab === 'messages') markMessagesRead();
  };

  const handleStartMessageFromDirectory = (targetUid: string) => {
    setInitialRecipientUid(targetUid);
    setActiveTab('messages');
    markMessagesRead();
  };

  if (!isApproved) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex items-center justify-center p-4 antialiased transition-colors duration-200">
        <div className="w-full max-w-sm rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xl text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 flex items-center justify-center text-amber-500 dark:text-amber-400 mx-auto shadow-xs">
            <Clock className="w-6 h-6" />
          </div>
          <h1 className="text-base font-bold text-slate-900 dark:text-white">{t('pendingApprovalTitle')}</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{t('pendingApprovalDesc')}</p>
          <button
            id="btn-pending-signout"
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
          >
            <LogOut className="w-4 h-4" />
            <span>{t('signOut')}</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col md:flex-row antialiased selection:bg-blue-600 selection:text-white transition-colors duration-200">
      {/* Offline PWA Banner */}
      <OfflineIndicator />

      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onOpenConfigModal={() => setIsConfigModalOpen(true)}
        onOpenGuideModal={() => setIsGuideModalOpen(true)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200/90 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-4 sm:px-6 py-3.5 shadow-xs transition-colors duration-200">
          <div className="flex items-center gap-3">
            <button
              id="btn-toggle-sidebar"
              onClick={() => setIsMobileSidebarOpen(true)}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 md:hidden border border-slate-200 dark:border-slate-700 transition"
              title="Toggle Menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 tracking-tight capitalize flex items-center gap-2">
                {activeTab === 'notices' && (
                  <>
                    <Bell className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span>{t('noticeBoardTitle')}</span>
                  </>
                )}
                {activeTab === 'messages' && (
                  <>
                    <MessageSquare className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                    <span>{t('directMessagesTitle')}</span>
                  </>
                )}
                {activeTab === 'directory' && (
                  <>
                    <Users className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    <span>{t('directoryTitle')}</span>
                  </>
                )}
              </h2>
            </div>
          </div>

          {/* Top Right Quick Actions & Toggles */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Language Toggle */}
            <button
              id="btn-toggle-language"
              onClick={toggleLanguage}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-xs transition"
              title={language === 'en' ? 'Switch to Svenska' : 'Växla till English'}
            >
              <span className="text-sm leading-none" role="img" aria-label={language === 'en' ? 'English' : 'Svenska'}>
                {language === 'en' ? '🇬🇧' : '🇸🇪'}
              </span>
              <span className="font-mono text-[11px] font-bold uppercase tracking-wider">
                {language === 'en' ? 'EN' : 'SV'}
              </span>
            </button>

            {/* Dark / Light Theme Toggle */}
            <button
              id="btn-toggle-theme"
              onClick={toggleTheme}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 shadow-xs transition"
              title={theme === 'light' ? t('darkMode') : t('lightMode')}
            >
              {theme === 'light' ? (
                <Moon className="w-4 h-4 text-slate-600 hover:text-slate-900" />
              ) : (
                <Sun className="w-4 h-4 text-amber-400 hover:text-amber-300" />
              )}
            </button>

            {/* Quick Guide Trigger */}
            <button
              id="btn-top-docs"
              onClick={() => setIsGuideModalOpen(true)}
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-medium shadow-xs transition"
            >
              <BookOpen className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
              <span>{t('topDocsBtn')}</span>
            </button>

            {/* Role Badge Indicator */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs shadow-xs">
              <span className={`w-2 h-2 rounded-full ${isAdmin ? 'bg-emerald-500 animate-pulse' : 'bg-blue-500'}`} />
              <span className="text-slate-700 dark:text-slate-200 hidden sm:inline font-medium">
                {currentUser?.displayName || (role === 'admin' ? t('roleAdmin') : t('roleGuest'))}
              </span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold uppercase border ${
                isAdmin
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                  : 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
              }`}>
                {role === 'admin' ? t('roleAdmin') : t('roleMember')}
              </span>
            </div>
          </div>
        </header>

        {/* Tab Viewport */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {activeTab === 'notices' && <NoticeBoard />}
          {activeTab === 'messages' && (
            <DirectMessages
              initialRecipientUid={initialRecipientUid}
              onClearInitialRecipient={() => setInitialRecipientUid(null)}
            />
          )}
          {activeTab === 'directory' && (
            <UserDirectory onStartMessage={handleStartMessageFromDirectory} />
          )}
        </main>
      </div>

      {/* Modals */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      <SetupGuideModal
        isOpen={isGuideModalOpen}
        onClose={() => setIsGuideModalOpen(false)}
      />

      <FirebaseConfigModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <PreferencesProvider>
      <AuthProvider>
        <NotificationsProvider>
          <MainApp />
        </NotificationsProvider>
      </AuthProvider>
    </PreferencesProvider>
  );
}

