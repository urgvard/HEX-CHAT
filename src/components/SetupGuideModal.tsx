import React, { useState } from 'react';
import {
  Shield,
  Database,
  Copy,
  Check,
  X,
  Server,
  Key,
  Flame,
  FileCode,
  FolderCheck
} from 'lucide-react';
import { usePreferences } from '../context/PreferencesContext';

interface SetupGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SetupGuideModal: React.FC<SetupGuideModalProps> = ({ isOpen, onClose }) => {
  const { t } = usePreferences();
  const [activeTab, setActiveTab] = useState<'section1' | 'section2' | 'section3'>('section1');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const firestoreRulesCode = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Default deny all access
    match /{document=**} {
      allow read, write: if false;
    }

    // Helper functions
    function isSignedIn() {
      return request.auth != null;
    }

    function isValidId(id) {
      return id is string && id.size() <= 128 && id.matches('^[a-zA-Z0-9_\\\\-]+$');
    }

    function isAdmin() {
      return isSignedIn() && (
        request.auth.token.email == 'urgvard@gmail.com' ||
        (exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin')
      );
    }

    // A signed-in user whose own profile is approved (or has no status field at
    // all, i.e. an account from before this field existed -- treated as approved
    // for backward compatibility). Community content (notices, DMs) is gated on
    // this so a newly self-registered member has no access until an admin
    // approves them.
    function isApprovedMember() {
      return isSignedIn() &&
        exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.get('status', 'approved') == 'approved';
    }

    function isValidUser(data) {
      return data.keys().hasAll(['uid', 'email', 'displayName', 'role', 'createdAt']) &&
             data.uid is string && data.uid.size() <= 128 &&
             data.email is string && data.email.size() <= 256 &&
             data.displayName is string && data.displayName.size() <= 100 &&
             data.role in ['admin', 'member'] &&
             data.createdAt is timestamp &&
             (!('status' in data) || data.status in ['pending', 'approved']) &&
             (!('notifyOnDMs' in data) || data.notifyOnDMs is bool) &&
             (!('notifyOnNotices' in data) || data.notifyOnNotices is bool);
    }

    function isValidNotice(data) {
      return data.keys().hasAll(['title', 'content', 'createdBy', 'createdAt']) &&
             data.title is string && data.title.size() > 0 && data.title.size() <= 200 &&
             data.content is string && data.content.size() > 0 && data.content.size() <= 10000 &&
             data.createdBy is string && data.createdBy == request.auth.uid &&
             data.createdAt is timestamp &&
             (!('fileUrl' in data) || (data.fileUrl is string && data.fileUrl.size() <= 2048)) &&
             (!('fileName' in data) || (data.fileName is string && data.fileName.size() <= 256));
    }

    function isValidConversation(data) {
      return data.keys().hasAll(['participants', 'lastMessage', 'updatedAt']) &&
             data.participants is list && data.participants.size() == 2 &&
             data.participants[0] is string && data.participants[1] is string &&
             data.lastMessage is string && data.lastMessage.size() <= 1000 &&
             data.updatedAt is timestamp &&
             (!('lastMessageSenderId' in data) || (data.lastMessageSenderId is string && data.lastMessageSenderId.size() <= 128));
    }

    function isValidMessage(data) {
      return data.keys().hasAll(['senderId', 'text', 'timestamp']) &&
             data.senderId is string && data.senderId == request.auth.uid &&
             data.text is string && data.text.size() <= 5000 &&
             data.timestamp is timestamp &&
             (!('fileUrl' in data) || (data.fileUrl is string && data.fileUrl.size() <= 2048)) &&
             (!('fileName' in data) || (data.fileName is string && data.fileName.size() <= 256));
    }

    // 1. Users Collection
    // get/list are split (rather than a single \`allow read\`) because a \`list\`
    // query has no filter on document ID, so Firestore can't statically prove
    // isValidId(userId) holds for an unconstrained wildcard and rejects the whole
    // query up front — even against an empty collection. Only \`get\` (a concrete,
    // known document ID) can safely check it.
    match /users/{userId} {
      allow get: if isSignedIn() && isValidId(userId);
      allow list: if isApprovedMember() || isAdmin();
      // Self-registration is always locked to role 'member' and status 'pending' --
      // only an admin can create a profile with any other role/status.
      allow create: if isSignedIn() && isValidId(userId) && request.auth.uid == userId && isValidUser(request.resource.data) &&
        ((request.resource.data.role == 'member' && request.resource.data.status == 'pending') || isAdmin());
      // A user may update their own profile but cannot change their own role or
      // approval status -- only an admin can promote/approve.
      allow update: if isSignedIn() && isValidId(userId) && isValidUser(request.resource.data) && (
        (request.auth.uid == userId &&
         request.resource.data.role == resource.data.role &&
         request.resource.data.get('status', 'approved') == resource.data.get('status', 'approved')) ||
        isAdmin()
      );
      allow delete: if isAdmin() && isValidId(userId);
    }

    // 2. Notice Board Collection
    // Same get/list split as Users above, and for the same reason. Reads are
    // additionally gated on approval so a pending member has no community access.
    match /notice_board/{noticeId} {
      allow get: if (isApprovedMember() || isAdmin()) && isValidId(noticeId);
      allow list: if isApprovedMember() || isAdmin();
      allow create: if isAdmin() && isValidId(noticeId) && isValidNotice(request.resource.data);
      allow update: if isAdmin() && isValidId(noticeId) && isValidNotice(request.resource.data);
      allow delete: if isAdmin() && isValidId(noticeId);
    }

    // 3. Conversations Collection
    // Gated on approval, same reasoning as Notice Board above.
    match /conversations/{conversationId} {
      allow get: if (isApprovedMember() || isAdmin()) && isValidId(conversationId) &&
        (request.auth.uid in resource.data.participants || isAdmin());
      allow list: if (isApprovedMember() || isAdmin()) &&
        (request.auth.uid in resource.data.participants || isAdmin());
      allow create: if (isApprovedMember() || isAdmin()) && isValidId(conversationId) &&
        request.auth.uid in request.resource.data.participants &&
        isValidConversation(request.resource.data);
      allow update: if (isApprovedMember() || isAdmin()) && isValidId(conversationId) &&
        (request.auth.uid in resource.data.participants || isAdmin()) &&
        isValidConversation(request.resource.data);
      allow delete: if isAdmin() && isValidId(conversationId);

      // Subcollection: Messages
      // Same get/list split as Users/Notice Board: conversationId is a fixed parent
      // path segment (safe to check even in list), but messageId is the query's own
      // unconstrained wildcard, so isValidId(messageId) can only be checked on get.
      match /messages/{messageId} {
        allow get: if (isApprovedMember() || isAdmin()) && isValidId(conversationId) && isValidId(messageId) &&
          (request.auth.uid in get(/databases/$(database)/documents/conversations/$(conversationId)).data.participants || isAdmin());
        allow list: if (isApprovedMember() || isAdmin()) && isValidId(conversationId) &&
          (request.auth.uid in get(/databases/$(database)/documents/conversations/$(conversationId)).data.participants || isAdmin());
        allow create: if (isApprovedMember() || isAdmin()) && isValidId(conversationId) && isValidId(messageId) &&
          request.auth.uid in get(/databases/$(database)/documents/conversations/$(conversationId)).data.participants &&
          isValidMessage(request.resource.data);
        allow update: if isSignedIn() && isValidId(conversationId) && isValidId(messageId) &&
          ((resource.data.senderId == request.auth.uid && isValidMessage(request.resource.data)) || isAdmin());
        allow delete: if isSignedIn() && isValidId(conversationId) && isValidId(messageId) &&
          (resource.data.senderId == request.auth.uid || isAdmin());
      }
    }
  }
}`;

  const storageRulesCode = `rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {

    function isSignedIn() {
      return request.auth != null;
    }

    function isUnder10MB() {
      return request.resource == null || request.resource.size <= 10 * 1024 * 1024;
    }

    function isAdmin() {
      return isSignedIn() && (
        request.auth.token.email == 'urgvard@gmail.com' ||
        request.auth.token.role == 'admin'
      );
    }

    // Notice Board Attachments (10MB max, admin write, authenticated read)
    match /notice_attachments/{noticeId}/{fileName} {
      allow read: if isSignedIn();
      allow write: if isAdmin() && isUnder10MB();
      allow delete: if isAdmin();
    }

    // Direct Message Attachments (10MB max, authenticated write, authenticated read)
    match /conversation_attachments/{conversationId}/{fileName} {
      allow read: if isSignedIn();
      allow write: if isSignedIn() && isUnder10MB();
      allow delete: if isSignedIn() && (request.auth.uid == request.resource.metadata.uploadedBy || isAdmin());
    }

    // General attachments fallback
    match /attachments/{allPaths=**} {
      allow read: if isSignedIn();
      allow write: if isSignedIn() && isUnder10MB();
      allow delete: if isSignedIn();
    }
  }
}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl text-slate-900 dark:text-white overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-950/60 border border-orange-200 dark:border-orange-800 flex items-center justify-center text-orange-500 dark:text-orange-400 shadow-xs">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">{t('guideTitle')}</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">{t('guideSubtitle')}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-5 gap-4">
          <button
            onClick={() => setActiveTab('section1')}
            className={`py-3 text-xs font-semibold border-b-2 flex items-center gap-2 transition ${
              activeTab === 'section1'
                ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Server className="w-4 h-4" />
            <span>{t('tabConsole')}</span>
          </button>
          <button
            onClick={() => setActiveTab('section2')}
            className={`py-3 text-xs font-semibold border-b-2 flex items-center gap-2 transition ${
              activeTab === 'section2'
                ? 'border-emerald-600 text-emerald-600 dark:border-emerald-400 dark:text-emerald-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>{t('tabSecurity')}</span>
          </button>
          <button
            onClick={() => setActiveTab('section3')}
            className={`py-3 text-xs font-semibold border-b-2 flex items-center gap-2 transition ${
              activeTab === 'section3'
                ? 'border-purple-600 text-purple-600 dark:border-purple-400 dark:text-purple-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <FileCode className="w-4 h-4" />
            <span>{t('tabPwa')}</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm bg-slate-50/30 dark:bg-slate-950/20">
          {activeTab === 'section1' && (
            <div className="space-y-6">
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4 shadow-xs">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Flame className="w-4 h-4 text-orange-500" />
                  1. Enable Firebase Authentication (Email/Password)
                </h3>
                <ol className="space-y-2 text-xs text-slate-700 dark:text-slate-300 list-decimal list-inside leading-relaxed">
                  <li>Navigate to the <a href="https://console.firebase.google.com" target="_blank" rel="noreferrer" className="text-blue-600 dark:text-blue-400 underline font-medium">Firebase Console</a> and select or create your project.</li>
                  <li>In the left sidebar, click <strong>Authentication</strong> &gt; <strong>Get Started</strong>.</li>
                  <li>In the <strong>Sign-in method</strong> tab, click <strong>Email/Password</strong>.</li>
                  <li>Toggle the first switch to <strong>Enable</strong> and click <strong>Save</strong>.</li>
                </ol>
              </div>

              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4 shadow-xs">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Database className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  2. Create Cloud Firestore Database
                </h3>
                <ol className="space-y-2 text-xs text-slate-700 dark:text-slate-300 list-decimal list-inside leading-relaxed">
                  <li>In the left menu, select <strong>Firestore Database</strong> &gt; <strong>Create database</strong>.</li>
                  <li>Select a database location close to your users (e.g., <code className="text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/80 px-1 py-0.5 rounded font-mono">europe-west2</code>, <code className="text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/80 px-1 py-0.5 rounded font-mono">us-central1</code>).</li>
                  <li>Choose <strong>Start in production mode</strong> (we apply our hardened security rules next).</li>
                </ol>
              </div>

              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4 shadow-xs">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <FolderCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  3. Enable Firebase Cloud Storage
                </h3>
                <ol className="space-y-2 text-xs text-slate-700 dark:text-slate-300 list-decimal list-inside leading-relaxed">
                  <li>In the left menu, click <strong>Storage</strong> &gt; <strong>Get Started</strong>.</li>
                  <li>Select default Cloud Storage security rules and confirm bucket location.</li>
                </ol>
              </div>

              <div className="rounded-2xl border border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/30 p-5 space-y-3 shadow-xs">
                <h3 className="text-sm font-bold text-blue-900 dark:text-blue-300 flex items-center gap-2">
                  <Key className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  4. Setting Up the First Admin User
                </h3>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  The application is configured so that the primary admin email <strong className="text-slate-900 dark:text-white">urgvard@gmail.com</strong> is automatically recognized as an administrator.
                </p>
                <div className="rounded-xl bg-white dark:bg-slate-900 p-3 border border-blue-200 dark:border-blue-800 text-xs font-mono text-slate-800 dark:text-slate-200 shadow-2xs">
                  // Document in /users/&#123;userId&#125;<br/>
                  &#123;<br/>
                  &nbsp;&nbsp;"uid": "USER_AUTH_UID",<br/>
                  &nbsp;&nbsp;"email": "urgvard@gmail.com",<br/>
                  &nbsp;&nbsp;"displayName": "Admin Eleanor",<br/>
                  &nbsp;&nbsp;"role": "admin",<br/>
                  &nbsp;&nbsp;"createdAt": "2026-09-02T08:00:00.000Z"<br/>
                  &#125;
                </div>
              </div>
            </div>
          )}

          {activeTab === 'section2' && (
            <div className="space-y-6">
              {/* Firestore Rules */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
                    <Database className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    Firestore Security Rules (firestore.rules)
                  </h3>
                  <button
                    onClick={() => handleCopy(firestoreRulesCode, 'firestore')}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 transition"
                  >
                    {copiedKey === 'firestore' ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'firestore' ? t('copiedBtn') : t('copyRulesBtn')}</span>
                  </button>
                </div>
                <pre className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-[11px] font-mono text-emerald-400 overflow-x-auto max-h-72 shadow-xs">
                  {firestoreRulesCode}
                </pre>
              </div>

              {/* Storage Rules */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
                    <FolderCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    Firebase Storage Security Rules (storage.rules)
                  </h3>
                  <button
                    onClick={() => handleCopy(storageRulesCode, 'storage')}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 transition"
                  >
                    {copiedKey === 'storage' ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'storage' ? t('copiedBtn') : t('copyRulesBtn')}</span>
                  </button>
                </div>
                <pre className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-[11px] font-mono text-sky-400 overflow-x-auto max-h-56 shadow-xs">
                  {storageRulesCode}
                </pre>
              </div>
            </div>
          )}

          {activeTab === 'section3' && (
            <div className="space-y-4 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
              <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2 shadow-xs">
                <h4 className="font-bold text-slate-900 dark:text-white text-sm">PWA Download & Mobile Platform Support</h4>
                <p>
                  The application is fully compliant with Progressive Web App (PWA) standards for <strong>Android</strong>, <strong>iOS</strong>, and Desktop:
                </p>
                <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-400">
                  <li><strong>Manifest (<code className="text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded font-mono">manifest.webmanifest</code>)</strong>: Includes standalone display mode, background & theme colors, 192x192 & 512x512 maskable/any icons.</li>
                  <li><strong>iOS Safari Meta</strong>: Includes <code className="text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded font-mono">apple-mobile-web-app-capable</code> and <code className="text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded font-mono">apple-touch-icon.png</code>.</li>
                  <li><strong>Service Worker & Offline Support</strong>: Precaches assets for instant startup and offline capability.</li>
                  <li><strong>In-App Install Action</strong>: Interactive <code className="text-blue-600 dark:text-blue-400 font-semibold">Install App</code> button with browser prompt integration and iOS manual installation guide.</li>
                </ul>
              </div>

              <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2 shadow-xs">
                <h4 className="font-bold text-slate-900 dark:text-white text-sm">Real-time Architecture & Attachments</h4>
                <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-400">
                  <li><strong>Real-Time Sync</strong>: Uses Firestore <code className="text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded font-mono">onSnapshot</code> for instant Notice Board updates and Direct Message feeds.</li>
                  <li><strong>Deterministic Conversation IDs</strong>: Uses <code className="text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded font-mono">[uid1, uid2].sort().join("_")</code> for predictable 1-on-1 thread mapping.</li>
                  <li><strong>Document Attachments</strong>: Validates 10MB size limit on both client file picker and Firebase Storage security rules.</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60 flex items-center justify-between">
          <span className="text-xs text-slate-500 dark:text-slate-400">Community Hub • Built with Firebase Web SDK v10+</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white text-xs font-semibold text-white dark:text-slate-900 shadow-xs transition"
          >
            {t('closeGuideBtn')}
          </button>
        </div>
      </div>
    </div>
  );
};

