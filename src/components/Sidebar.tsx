import React from 'react';
import {
  Bell,
  MessageSquare,
  Users,
  BookOpen,
  Shield,
  LogOut,
  LogIn,
  Flame,
  X,
  ChevronRight,
  Sun,
  Moon,
  Globe
} from 'lucide-react';
import { ActiveTab } from '../types';
import { useAuth } from '../context/AuthContext';
import { usePreferences } from '../context/PreferencesContext';
import { PWAInstallButton } from './PWAInstallButton';

interface SidebarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  onOpenAuthModal: () => void;
  onOpenConfigModal: () => void;
  onOpenGuideModal: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  isOpenMobile,
  onCloseMobile,
  onOpenAuthModal,
  onOpenConfigModal,
  onOpenGuideModal
}) => {
  const { currentUser, role, isAdmin, logout, switchDemoRole, isLiveFirebase } = useAuth();
  const { theme, toggleTheme, language, toggleLanguage, t } = usePreferences();

  const navItems = [
    {
      id: 'notices' as ActiveTab,
      label: t('navNoticeBoard'),
      icon: Bell,
      description: t('navNoticeBoardDesc')
    },
    {
      id: 'messages' as ActiveTab,
      label: t('navDirectMessages'),
      icon: MessageSquare,
      description: t('navDirectMessagesDesc')
    },
    {
      id: 'directory' as ActiveTab,
      label: isAdmin ? t('navAdminDirectory') : t('navDirectory'),
      icon: Users,
      description: t('navDirectoryDesc')
    },
    {
      id: 'guide' as ActiveTab,
      label: t('navGuide'),
      icon: BookOpen,
      description: t('navGuideDesc')
    }
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-xs md:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        id="app-sidebar"
        className={`fixed md:sticky top-0 left-0 z-40 h-screen w-72 flex flex-col justify-between border-r border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 transition-colors duration-200 duration-300 md:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Top Header & Brand */}
        <div>
          <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-sm font-extrabold text-slate-900 dark:text-white tracking-tight leading-none">
                  {t('appTitle')}
                </h1>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${isLiveFirebase ? 'bg-emerald-500' : 'bg-blue-500'}`} />
                  {isLiveFirebase ? t('appSubtitleLive') : t('appSubtitleLocal')}
                </p>
              </div>
            </div>

            {/* Mobile close */}
            <button
              onClick={onCloseMobile}
              className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-100 md:hidden transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-3.5 space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  id={`nav-item-${item.id}`}
                  onClick={() => {
                    if (item.id === 'guide') {
                      onOpenGuideModal();
                    } else {
                      onSelectTab(item.id);
                    }
                    onCloseMobile();
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-left transition group ${
                    isActive
                      ? 'bg-blue-50/80 dark:bg-blue-950/50 border border-blue-200/80 dark:border-blue-800/80 text-blue-700 dark:text-blue-300 font-semibold shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white border border-transparent'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:bg-slate-200/80 dark:group-hover:bg-slate-700 group-hover:text-slate-800 dark:group-hover:text-slate-200'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="text-xs tracking-tight truncate">{item.label}</div>
                    <div className="text-[10px] text-slate-400 dark:text-slate-500 truncate font-normal">
                      {item.description}
                    </div>
                  </div>

                  {isActive && <ChevronRight className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Section: Preferences Bar, Profile, Role switcher, PWA install */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 space-y-3 bg-slate-50/50 dark:bg-slate-950/50 transition-colors">
          {/* Theme & Language Quick Switches inside Sidebar */}
          <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              {language === 'en' ? 'Settings' : 'Inställningar'}
            </span>
            <div className="flex items-center gap-1.5">
              {/* Language Pill */}
              <button
                id="sidebar-toggle-language"
                onClick={toggleLanguage}
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                title={language === 'en' ? 'Switch to Svenska' : 'Växla till English'}
              >
                <span>{language === 'en' ? '🇬🇧 EN' : '🇸🇪 SV'}</span>
              </button>

              {/* Theme Pill */}
              <button
                id="sidebar-toggle-theme"
                onClick={toggleTheme}
                className="p-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                title={theme === 'light' ? t('darkMode') : t('lightMode')}
              >
                {theme === 'light' ? (
                  <Moon className="w-3.5 h-3.5 text-slate-600" />
                ) : (
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                )}
              </button>
            </div>
          </div>

          {/* PWA Install Button Component */}
          <div className="w-full">
            <PWAInstallButton />
          </div>

          {/* User Profile Card */}
          {currentUser ? (
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 shadow-xs">
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0 ${
                    isAdmin ? 'bg-emerald-600' : 'bg-blue-600'
                  }`}>
                    {currentUser.displayName.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[120px]">
                      {currentUser.displayName}
                    </div>
                    <span className={`inline-block text-[9px] px-1.5 py-0.2 rounded font-semibold border ${
                      isAdmin
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                        : 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                    }`}>
                      {isAdmin ? t('roleAdmin').toUpperCase() : t('roleMember').toUpperCase()}
                    </span>
                  </div>
                </div>

                <button
                  id="btn-logout"
                  onClick={logout}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  title={t('signOut')}
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>

              {/* Role Quick Toggle */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1 text-[10px]">
                <span className="text-slate-500 dark:text-slate-400">{t('switchRole')}</span>
                <div className="flex gap-1">
                  <button
                    id="btn-toggle-role-admin"
                    onClick={() => switchDemoRole('admin')}
                    className={`px-2 py-0.5 rounded font-medium transition ${
                      isAdmin
                        ? 'bg-emerald-600 text-white font-bold shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {t('roleAdmin')}
                  </button>
                  <button
                    id="btn-toggle-role-member"
                    onClick={() => switchDemoRole('member')}
                    className={`px-2 py-0.5 rounded font-medium transition ${
                      !isAdmin
                        ? 'bg-blue-600 text-white font-bold shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {t('roleMember')}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <button
              id="btn-open-login"
              onClick={onOpenAuthModal}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-blue-500 shadow-md shadow-blue-600/20 transition"
            >
              <LogIn className="w-4 h-4" />
              <span>{t('signInOrRegister')}</span>
            </button>
          )}

          {/* Quick Actions / Config Buttons */}
          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1">
            <button
              id="btn-open-firebase-config"
              onClick={onOpenConfigModal}
              className="flex items-center gap-1.5 hover:text-orange-600 dark:hover:text-orange-400 transition"
            >
              <Flame className="w-3.5 h-3.5 text-orange-500" />
              <span>{t('firebaseConfig')}</span>
            </button>

            <button
              id="btn-open-docs"
              onClick={onOpenGuideModal}
              className="flex items-center gap-1.5 hover:text-sky-600 dark:hover:text-sky-400 transition"
            >
              <BookOpen className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
              <span>{t('rulesAndDocs')}</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

