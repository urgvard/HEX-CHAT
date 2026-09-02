import React, { useEffect, useState, useRef } from 'react';
import {
  MessageSquare,
  Send,
  Paperclip,
  FileText,
  Download,
  Search,
  Shield,
  ArrowLeft,
  X,
  CheckCheck,
  Sparkles
} from 'lucide-react';
import { ConversationItem, MessageItem, UserProfile } from '../types';
import { useAuth } from '../context/AuthContext';
import { usePreferences } from '../context/PreferencesContext';
import {
  subscribeUserConversations,
  subscribeConversationMessages,
  sendDirectMessage,
  subscribeUsersDirectory,
  getConversationId,
  uploadAttachmentFile
} from '../firebase/service';
import { triggerNotificationEmail } from '../lib/notifyEmail';

interface DirectMessagesProps {
  initialRecipientUid?: string | null;
  onClearInitialRecipient?: () => void;
}

export const DirectMessages: React.FC<DirectMessagesProps> = ({
  initialRecipientUid,
  onClearInitialRecipient
}) => {
  const { currentUser, isAdmin, db, storage, firebaseUser } = useAuth();
  const { t, formatLocalizedTime, language } = usePreferences();
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [activeRecipient, setActiveRecipient] = useState<UserProfile | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  
  const [messageText, setMessageText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showMobileChat, setShowMobileChat] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Subscribe to Users Directory to populate user metadata
  useEffect(() => {
    const unsubscribe = subscribeUsersDirectory(db, (users) => {
      setAllUsers(users);
    });
    return () => unsubscribe();
  }, [db]);

  // Subscribe to Conversations for current user
  useEffect(() => {
    if (!currentUser) return;
    const unsubscribe = subscribeUserConversations(
      db,
      currentUser.uid,
      currentUser.role,
      (convs) => {
        setConversations(convs);
      }
    );
    return () => unsubscribe();
  }, [db, currentUser]);

  // Handle Initial Recipient if passed from Directory tab
  useEffect(() => {
    if (!initialRecipientUid || !currentUser || allUsers.length === 0) return;
    
    const target = allUsers.find((u) => u.uid === initialRecipientUid);
    if (target) {
      const convId = getConversationId(currentUser.uid, target.uid);
      setActiveConversationId(convId);
      setActiveRecipient(target);
      setShowMobileChat(true);
      if (onClearInitialRecipient) onClearInitialRecipient();
    }
  }, [initialRecipientUid, currentUser, allUsers, onClearInitialRecipient]);

  // If no conversation is selected and we have conversations, or member viewing admin
  useEffect(() => {
    if (!activeConversationId && conversations.length > 0 && allUsers.length > 0 && !showMobileChat) {
      // Pick first conversation
      const firstConv = conversations[0];
      const otherUid = firstConv.participants.find((p) => p !== currentUser?.uid) || firstConv.participants[0];
      const otherUser = allUsers.find((u) => u.uid === otherUid);
      setActiveConversationId(firstConv.id);
      if (otherUser) setActiveRecipient(otherUser);
    } else if (!activeConversationId && !isAdmin && allUsers.length > 0 && currentUser) {
      // If member and no conversation exists yet, default to starting conversation with Admin
      const adminUser = allUsers.find((u) => u.role === 'admin') || allUsers[0];
      if (adminUser && adminUser.uid !== currentUser.uid) {
        const convId = getConversationId(currentUser.uid, adminUser.uid);
        setActiveConversationId(convId);
        setActiveRecipient(adminUser);
      }
    }
  }, [conversations, activeConversationId, allUsers, currentUser, isAdmin, showMobileChat]);

  // Subscribe to real-time messages in active conversation
  useEffect(() => {
    if (!activeConversationId) {
      setMessages([]);
      return;
    }

    const unsubscribe = subscribeConversationMessages(db, activeConversationId, (msgs) => {
      setMessages(msgs);
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    });

    return () => unsubscribe();
  }, [db, activeConversationId]);

  const handleSelectConversation = (conv: ConversationItem) => {
    const otherUid = conv.participants.find((p) => p !== currentUser?.uid) || conv.participants[0];
    const otherUser = allUsers.find((u) => u.uid === otherUid);
    setActiveConversationId(conv.id);
    if (otherUser) {
      setActiveRecipient(otherUser);
    }
    setShowMobileChat(true);
  };

  const handleSelectUserToChat = (targetUser: UserProfile) => {
    if (!currentUser) return;
    const convId = getConversationId(currentUser.uid, targetUser.uid);
    setActiveConversationId(convId);
    setActiveRecipient(targetUser);
    setShowMobileChat(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Enforce 10MB limit
    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setErrorMessage(t('fileTooLargeError'));
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setErrorMessage(null);
    setSelectedFile(file);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !activeRecipient) return;
    if (!messageText.trim() && !selectedFile) return;

    setIsSending(true);
    setErrorMessage(null);

    try {
      let fileUrl: string | undefined = undefined;
      let fileName: string | undefined = undefined;

      if (selectedFile) {
        const convId = getConversationId(currentUser.uid, activeRecipient.uid);
        const uploadRes = await uploadAttachmentFile(
          storage,
          'conversation_attachments',
          convId,
          selectedFile,
          (percent) => setUploadProgress(percent)
        );
        fileUrl = uploadRes.fileUrl;
        fileName = uploadRes.fileName;
      }

      await sendDirectMessage(db, {
        senderId: currentUser.uid,
        senderName: currentUser.displayName,
        recipientId: activeRecipient.uid,
        text: messageText.trim(),
        fileUrl,
        fileName
      });

      if (firebaseUser) {
        firebaseUser.getIdToken().then((idToken) =>
          triggerNotificationEmail(idToken, 'new_dm', { recipientUid: activeRecipient.uid })
        );
      }

      setMessageText('');
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setUploadProgress(null);
    } catch (err: any) {
      console.error('Send message error:', err);
      setErrorMessage(err.message || 'Failed to send message.');
    } finally {
      setIsSending(false);
    }
  };

  // Filter conversations & users
  const availableMembers = allUsers.filter(
    (u) => u.uid !== currentUser?.uid && (isAdmin || u.role === 'admin')
  );

  return (
    <div className="h-[calc(100vh-8.5rem)] max-w-6xl mx-auto flex rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
      {/* LEFT PANE: Conversation & User Directory List */}
      <div
        className={`w-full md:w-80 lg:w-96 flex flex-col border-r border-slate-200/90 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/70 shrink-0 ${
          showMobileChat ? 'hidden md:flex' : 'flex'
        }`}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-200/90 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">{t('directMessagesTitle')}</h2>
            </div>
            <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700">
              {isAdmin ? t('roleAdmin') : t('roleMember')}
            </span>
          </div>

          {/* Search box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="input-search-conversations"
              type="text"
              placeholder={t('searchConversations')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/40 shadow-xs transition"
            />
          </div>
        </div>

        {/* List of active threads / recipients */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
          {conversations.length > 0 && (
            <div className="p-2">
              <div className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 dark:text-slate-500 px-3 py-1.5">
                {t('activeConversations')} ({conversations.length})
              </div>
              {conversations.map((conv) => {
                const otherUid = conv.participants.find((p) => p !== currentUser?.uid) || conv.participants[0];
                const otherUser = allUsers.find((u) => u.uid === otherUid);
                const isActive = activeConversationId === conv.id;
                const displayName = otherUser?.displayName || (otherUid.includes('admin') ? 'Community Admin' : 'Community Member');
                const isOtherAdmin = otherUser?.role === 'admin';

                return (
                  <button
                    key={conv.id}
                    id={`conv-item-${conv.id}`}
                    onClick={() => handleSelectConversation(conv)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition ${
                      isActive
                        ? 'bg-white dark:bg-slate-800 border border-blue-200/90 dark:border-blue-700/80 text-slate-900 dark:text-white shadow-xs'
                        : 'hover:bg-slate-100/80 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="relative shrink-0">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm text-white shadow-xs ${
                        isOtherAdmin ? 'bg-emerald-600' : 'bg-blue-600'
                      }`}>
                        {displayName.charAt(0).toUpperCase()}
                      </div>
                      {isOtherAdmin && (
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-white dark:bg-slate-900 border border-emerald-500 flex items-center justify-center shadow-xs">
                          <Shield className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span className="text-xs font-semibold truncate text-slate-900 dark:text-white">
                          {displayName}
                        </span>
                        {conv.updatedAt && (
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 shrink-0">
                            {formatLocalizedTime(conv.updatedAt)}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        {conv.lastMessage || 'No messages yet'}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Directory of contacts (for Admin to initiate DMs or Member to message Admin) */}
          <div className="p-2">
            <div className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 dark:text-slate-500 px-3 py-1.5">
              {isAdmin ? t('allMembers') : t('startChatWithAdmin')}
            </div>
            {availableMembers.map((user) => {
              const convId = currentUser ? getConversationId(currentUser.uid, user.uid) : '';
              const hasThread = conversations.some((c) => c.id === convId);
              if (hasThread) return null; // already shown in active threads

              return (
                <button
                  key={user.uid}
                  id={`btn-chat-user-${user.uid}`}
                  onClick={() => handleSelectUserToChat(user)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl text-left hover:bg-slate-100/80 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300 transition"
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs text-white shrink-0 ${
                    user.role === 'admin' ? 'bg-emerald-600' : 'bg-slate-600 dark:bg-slate-700'
                  }`}>
                    {user.displayName.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                      {user.displayName}
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 capitalize">
                      {user.role === 'admin' ? t('roleAdmin') : t('roleMember')} • {user.email}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* RIGHT PANE: Active Chat Window */}
      <div
        className={`flex-1 flex flex-col bg-slate-50/40 dark:bg-slate-950/40 ${
          !showMobileChat ? 'hidden md:flex' : 'flex'
        }`}
      >
        {activeRecipient ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-3">
                {/* Back button on mobile */}
                <button
                  onClick={() => setShowMobileChat(false)}
                  className="md:hidden p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-100 transition"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>

                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm text-white shadow-xs ${
                  activeRecipient.role === 'admin' ? 'bg-emerald-600' : 'bg-blue-600'
                }`}>
                  {activeRecipient.displayName.charAt(0).toUpperCase()}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                      {activeRecipient.displayName}
                    </h3>
                    <span className={`text-[10px] px-2 py-0.5 rounded-md font-medium border ${
                      activeRecipient.role === 'admin'
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                        : 'bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300'
                    }`}>
                      {activeRecipient.role === 'admin' ? t('roleAdmin') : t('roleMember')}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">{activeRecipient.email}</p>
                </div>
              </div>

              <div className="text-right hidden sm:block">
                <span className="inline-flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  {t('directMessagesTitle')}
                </span>
              </div>
            </div>

            {/* Message Feed Window */}
            <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-3 shadow-xs">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">{t('noMessagesYet')}</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mt-1">
                    {t('noMessagesDesc')}
                  </p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isMe = msg.senderId === currentUser?.uid;
                  const formattedTime = formatLocalizedTime(msg.timestamp);

                  return (
                    <div
                      key={msg.id}
                      id={`msg-bubble-${msg.id}`}
                      className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                    >
                      <div className="flex items-end gap-2 max-w-[85%] sm:max-w-[70%]">
                        {!isMe && (
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0 mb-1 ${
                            activeRecipient.role === 'admin' ? 'bg-emerald-600' : 'bg-slate-600'
                          }`}>
                            {activeRecipient.displayName.charAt(0).toUpperCase()}
                          </div>
                        )}

                        <div
                          className={`rounded-2xl px-4 py-2.5 text-xs sm:text-sm leading-relaxed shadow-xs ${
                            isMe
                              ? 'bg-blue-600 text-white rounded-br-xs'
                              : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-bl-xs border border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          {/* Text content */}
                          {msg.text && <p className="whitespace-pre-line">{msg.text}</p>}

                          {/* Attachment (if present) */}
                          {msg.fileUrl && (
                            <div className={`mt-2 pt-2 border-t ${isMe ? 'border-blue-500/50' : 'border-slate-100 dark:border-slate-700'}`}>
                              <a
                                id={`link-msg-attachment-${msg.id}`}
                                href={msg.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`flex items-center gap-2.5 p-2 rounded-xl text-xs transition ${
                                  isMe
                                    ? 'bg-blue-700/80 hover:bg-blue-800 text-white'
                                    : 'bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 text-blue-600 dark:text-blue-300 border border-slate-200 dark:border-slate-600'
                                }`}
                              >
                                <FileText className="w-4 h-4 shrink-0" />
                                <span className="truncate max-w-[160px] sm:max-w-xs font-medium">
                                  {msg.fileName || t('downloadAttachment')}
                                </span>
                                <Download className="w-3.5 h-3.5 shrink-0 ml-auto opacity-80" />
                              </a>
                            </div>
                          )}

                          <div
                            className={`flex items-center justify-end gap-1 mt-1 text-[10px] ${
                              isMe ? 'text-blue-200' : 'text-slate-400 dark:text-slate-400'
                            }`}
                          >
                            <span>{formattedTime}</span>
                            {isMe && <CheckCheck className="w-3 h-3 text-blue-200" />}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Error Notification */}
            {errorMessage && (
              <div className="mx-4 p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300">
                {errorMessage}
              </div>
            )}

            {/* Upload Progress Bar */}
            {uploadProgress !== null && (
              <div className="mx-4 p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1 shadow-xs">
                <div className="flex justify-between text-[10px] text-slate-500 dark:text-slate-400">
                  <span>{t('uploadingAttachment')}</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full h-1 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 transition-all duration-200"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Input Bar */}
            <form onSubmit={handleSendMessage} className="p-3 sm:p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              {/* Selected File Chip */}
              {selectedFile && (
                <div className="mb-2 flex items-center justify-between p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300">
                  <div className="flex items-center gap-2 truncate">
                    <FileText className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                    <span className="truncate max-w-xs font-medium">{selectedFile.name}</span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">
                      ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="text-slate-400 hover:text-rose-600 p-1"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              <div className="flex items-center gap-2">
                {/* File picker button */}
                <input
                  ref={fileInputRef}
                  id="input-dm-file"
                  type="file"
                  onChange={handleFileChange}
                  className="hidden"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.webp"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition shadow-xs"
                  title={t('attachFileTooltip')}
                >
                  <Paperclip className="w-4 h-4" />
                </button>

                {/* Text input */}
                <input
                  id="input-dm-message-text"
                  type="text"
                  placeholder={t('typeMessagePlaceholder')}
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  className="flex-1 px-4 py-2.5 text-xs sm:text-sm rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/40 transition"
                />

                {/* Send Button */}
                <button
                  id="btn-send-dm"
                  type="submit"
                  disabled={isSending || (!messageText.trim() && !selectedFile)}
                  className="p-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-500 active:scale-98 transition disabled:opacity-40 disabled:hover:bg-blue-600 shadow-md shadow-blue-600/20"
                  title={t('sendMessageBtn')}
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-8">
            <MessageSquare className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-3" />
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">{t('noConversationSelected')}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mt-1">
              {t('selectConversationPrompt')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

