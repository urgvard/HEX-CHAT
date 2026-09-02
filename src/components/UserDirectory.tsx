import React, { useEffect, useState } from 'react';
import {
  Users,
  MessageSquare,
  Search,
  Calendar
} from 'lucide-react';
import { UserProfile } from '../types';
import { useAuth } from '../context/AuthContext';
import { usePreferences } from '../context/PreferencesContext';
import { subscribeUsersDirectory } from '../firebase/service';

interface UserDirectoryProps {
  onStartMessage: (targetUid: string) => void;
}

export const UserDirectory: React.FC<UserDirectoryProps> = ({ onStartMessage }) => {
  const { currentUser, isAdmin, db } = useAuth();
  const { t, formatLocalizedDate, language } = usePreferences();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'member'>('all');

  useEffect(() => {
    setIsLoading(true);
    const unsubscribe = subscribeUsersDirectory(db, (fetchedUsers) => {
      setUsers(fetchedUsers);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [db]);

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const adminCount = users.filter((u) => u.role === 'admin').length;
  const memberCount = users.filter((u) => u.role === 'member').length;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 flex items-center justify-center text-purple-600 dark:text-purple-400 shadow-xs">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">{t('directoryTitle')}</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">{t('directorySubtitle')}</p>
            </div>
          </div>
        </div>

        {/* Stats Pills */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>{t('adminsCount')}: <strong>{adminCount}</strong></span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            <span>{t('membersCount')}: <strong>{memberCount}</strong></span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="input-search-users"
            type="text"
            placeholder={t('searchDirectoryPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 dark:focus:ring-purple-900/40 shadow-xs transition"
          />
        </div>

        <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs shrink-0">
          {(['all', 'admin', 'member'] as const).map((tab) => (
            <button
              key={tab}
              id={`filter-role-${tab}`}
              onClick={() => setRoleFilter(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition ${
                roleFilter === tab
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {tab === 'all' ? t('allRoles') : tab === 'admin' ? `${t('roleAdmin')}s` : `${t('roleMember')}s`}
            </button>
          ))}
        </div>
      </div>

      {/* User Cards Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 py-6">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 animate-pulse space-y-3 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-xl" />
                <div className="space-y-1 flex-1">
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-2/3" />
                  <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 p-12 text-center shadow-xs">
          <Users className="w-10 h-10 text-slate-400 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">{t('noMembersFound')}</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{t('noMembersFoundDesc')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredUsers.map((user) => {
            const isMe = user.uid === currentUser?.uid;
            const isUserAdmin = user.role === 'admin';
            const joinedDate = formatLocalizedDate(user.createdAt) || '2026';

            return (
              <div
                key={user.uid}
                id={`user-card-${user.uid}`}
                className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 hover:border-slate-300 dark:hover:border-slate-700 transition flex flex-col justify-between group shadow-xs hover:shadow-sm"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-base text-white shadow-sm ${
                        isUserAdmin ? 'bg-gradient-to-br from-emerald-600 to-teal-700' : 'bg-gradient-to-br from-blue-600 to-indigo-700'
                      }`}>
                        {user.displayName.charAt(0).toUpperCase()}
                      </div>

                      <div>
                        <div className="flex items-center gap-1.5">
                          <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-[150px]">
                            {user.displayName}
                          </h3>
                          {isMe && (
                            <span className="text-[10px] bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 px-1.5 py-0.2 rounded font-semibold">
                              {t('youBadge')}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[170px]">
                          {user.email}
                        </p>
                      </div>
                    </div>

                    <span className={`text-[10px] px-2 py-0.5 rounded-md font-semibold border shrink-0 ${
                      isUserAdmin
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                        : 'bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300'
                    }`}>
                      {isUserAdmin ? t('roleAdmin') : t('roleMember')}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{t('memberSince')} {joinedDate}</span>
                  </div>
                </div>

                {/* Message action */}
                {!isMe && (
                  <button
                    id={`btn-message-user-${user.uid}`}
                    onClick={() => onStartMessage(user.uid)}
                    className="mt-4 w-full flex items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white py-2 text-xs font-semibold shadow-xs transition"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    <span>{t('sendMessageBtn')}</span>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

