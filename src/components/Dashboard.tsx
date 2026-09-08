import React, { useEffect, useState } from 'react';
import {
  LayoutDashboard,
  Bell,
  MessageSquare,
  Users,
  Download,
  Plus,
  ArrowRight,
  ShieldCheck,
  Calendar,
  FileText
} from 'lucide-react';
import { NoticeItem, ConversationItem, UserProfile, ActiveTab } from '../types';
import { useAuth } from '../context/AuthContext';
import { usePreferences } from '../context/PreferencesContext';
import { useNotifications } from '../context/NotificationsContext';
import {
  subscribeNoticeBoard,
  subscribeUserConversations,
  subscribeUsersDirectory
} from '../firebase/service';

interface DashboardProps {
  onSelectTab: (tab: ActiveTab) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onSelectTab }) => {
  const { currentUser, isAdmin, db } = useAuth();
  const { t, formatLocalizedDate } = usePreferences();
  const { noticesUnread, messagesUnread } = useNotifications();

  const [notices, setNotices] = useState<NoticeItem[]>([]);
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);

  useEffect(() => {
    const unsubscribe = subscribeNoticeBoard(db, setNotices);
    return () => unsubscribe();
  }, [db]);

  useEffect(() => {
    if (!currentUser) return;
    const unsubscribe = subscribeUserConversations(db, currentUser.uid, currentUser.role, setConversations);
    return () => unsubscribe();
  }, [db, currentUser]);

  useEffect(() => {
    const unsubscribe = subscribeUsersDirectory(db, setUsers);
    return () => unsubscribe();
  }, [db]);

  const downloadableCount =
    notices.filter((n) => !!n.fileUrl).length;
  const memberCount = users.length;
  const recentNotices = notices.slice(0, 3);

  const statCards = [
    {
      id: 'notices' as ActiveTab,
      icon: Bell,
      label: t('statNotices'),
      value: notices.length,
      badge: noticesUnread,
      color: 'blue'
    },
    {
      id: 'messages' as ActiveTab,
      icon: MessageSquare,
      label: t('statConversations'),
      value: conversations.length,
      badge: messagesUnread,
      color: 'sky'
    },
    {
      id: 'directory' as ActiveTab,
      icon: Users,
      label: t('statMembers'),
      value: memberCount,
      badge: 0,
      color: 'purple'
    },
    {
      id: 'notices' as ActiveTab,
      icon: Download,
      label: t('statDownloads'),
      value: downloadableCount,
      badge: 0,
      color: 'emerald'
    }
  ];

  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400',
    sky: 'bg-sky-50 dark:bg-sky-950/60 border-sky-200 dark:border-sky-800 text-sky-600 dark:text-sky-400',
    purple: 'bg-purple-50 dark:bg-purple-950/60 border-purple-200 dark:border-purple-800 text-purple-600 dark:text-purple-400',
    emerald: 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400'
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex items-center gap-2.5 border-b border-slate-200/80 dark:border-slate-800 pb-5">
        <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-xs">
          <LayoutDashboard className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            {t('dashboardTitle')}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {t('dashboardWelcome')} {currentUser?.displayName}
          </p>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <button
              key={`${card.id}-${idx}`}
              id={`dashboard-stat-${card.label}`}
              onClick={() => onSelectTab(card.id)}
              className="text-left rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-sm transition shadow-xs relative"
            >
              {card.badge > 0 && (
                <span className="absolute top-3 right-3 min-w-[1.25rem] h-5 px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {card.badge > 9 ? '9+' : card.badge}
                </span>
              )}
              <div className={`w-9 h-9 rounded-xl border flex items-center justify-center mb-3 ${colorClasses[card.color]}`}>
                <Icon className="w-4.5 h-4.5" />
              </div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white leading-none">{card.value}</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5">{card.label}</div>
            </button>
          );
        })}
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap items-center gap-2.5">
        {isAdmin && (
          <button
            id="dashboard-btn-new-notice"
            onClick={() => onSelectTab('notices')}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white shadow-md shadow-blue-600/20 hover:bg-blue-500 active:scale-98 transition"
          >
            <Plus className="w-4 h-4" />
            <span>{t('newNoticeBtn')}</span>
          </button>
        )}
        <button
          id="dashboard-btn-messages"
          onClick={() => onSelectTab('messages')}
          className="flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-xs transition"
        >
          <MessageSquare className="w-4 h-4 text-sky-600 dark:text-sky-400" />
          <span>{t('navDirectMessages')}</span>
        </button>
        <button
          id="dashboard-btn-directory"
          onClick={() => onSelectTab('directory')}
          className="flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-xs transition"
        >
          <Users className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          <span>{t('navDirectory')}</span>
        </button>
      </div>

      {/* Recent notices */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">{t('recentNoticesTitle')}</h2>
          <button
            id="dashboard-link-view-all-notices"
            onClick={() => onSelectTab('notices')}
            className="flex items-center gap-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition"
          >
            <span>{t('viewAllBtn')}</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {recentNotices.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 p-8 text-center shadow-xs">
            <Bell className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-xs text-slate-500 dark:text-slate-400">{t('noNoticesFoundDesc')}</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {recentNotices.map((notice) => (
              <button
                key={notice.id}
                id={`dashboard-notice-${notice.id}`}
                onClick={() => onSelectTab('notices')}
                className="w-full text-left rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-sm transition shadow-xs"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                      <span className="flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400">
                        <Calendar className="w-3 h-3" />
                        {formatLocalizedDate(notice.createdAt) || 'Recent'}
                      </span>
                    </div>
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white truncate">{notice.title}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">{notice.content}</p>
                  </div>
                  {notice.fileUrl && (
                    <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
