import React, { createContext, useContext, useState, useEffect } from 'react';

export type ThemeMode = 'light' | 'dark';
export type Language = 'en' | 'sv';

export interface Translations {
  // Common & Navigation
  appTitle: string;
  appSubtitleLive: string;
  appSubtitleLocal: string;
  navNoticeBoard: string;
  navNoticeBoardDesc: string;
  navDirectMessages: string;
  navDirectMessagesDesc: string;
  navDirectory: string;
  navAdminDirectory: string;
  navDirectoryDesc: string;
  navGuide: string;
  navGuideDesc: string;
  themeToggle: string;
  languageToggle: string;
  lightMode: string;
  darkMode: string;
  english: string;
  swedish: string;
  roleAdmin: string;
  roleMember: string;
  roleGuest: string;
  you: string;
  signOut: string;
  signInOrRegister: string;
  switchRole: string;
  firebaseConfig: string;
  rulesAndDocs: string;
  installApp: string;
  installIOS: string;
  mobilePWAReady: string;

  // Header
  topDocsBtn: string;

  // Notice Board
  noticeBoardTitle: string;
  noticeBoardSubtitle: string;
  newNoticeBtn: string;
  searchNoticesPlaceholder: string;
  adminBadge: string;
  pinned: string;
  downloadAttachment: string;
  editNotice: string;
  deleteNotice: string;
  confirmDeleteNotice: string;
  noNoticesFound: string;
  noNoticesFoundDesc: string;
  createNoticeTitle: string;
  editNoticeTitle: string;
  noticeTitleLabel: string;
  noticeTitlePlaceholder: string;
  noticeContentLabel: string;
  noticeContentPlaceholder: string;
  noticeAttachmentLabel: string;
  chooseFileBtn: string;
  changeFileBtn: string;
  removeFileBtn: string;
  uploadingAttachment: string;
  cancelBtn: string;
  saveNoticeBtn: string;
  publishNoticeBtn: string;
  savingNoticeBtn: string;
  noticeUpdatedSuccess: string;
  noticeCreatedSuccess: string;
  noticeDeletedSuccess: string;
  provideTitleAndContentError: string;
  fileTooLargeError: string;

  // Direct Messages
  directMessagesTitle: string;
  conversationsHeader: string;
  searchConversationsPlaceholder: string;
  selectConversationPrompt: string;
  selectConversationSubtitle: string;
  directMessageWith: string;
  typeMessagePlaceholder: string;
  sendBtn: string;
  sendingBtn: string;
  attachFileTooltip: string;
  membersCanOnlyDMAdminInfo: string;
  noConversationsYet: string;
  noConversationsYetDesc: string;
  noMessagesInThread: string;
  noMessagesInThreadDesc: string;
  startChatWithUser: string;
  youLabel: string;
  adminLabel: string;
  memberLabel: string;

  // User Directory
  directoryTitle: string;
  directorySubtitle: string;
  adminsCount: string;
  membersCount: string;
  searchDirectoryPlaceholder: string;
  allRolesTab: string;
  adminsTab: string;
  membersTab: string;
  noMembersFound: string;
  noMembersFoundDesc: string;
  memberSince: string;
  directMessageBtn: string;

  // Auth Modal
  signInTitle: string;
  registerTitle: string;
  signInSubtitle: string;
  registerSubtitle: string;
  displayNameLabel: string;
  emailLabel: string;
  passwordLabel: string;
  requestedRoleLabel: string;
  roleMemberOption: string;
  roleAdminOption: string;
  quickDemoSection: string;
  adminDemoBtn: string;
  memberDemoBtn: string;
  authenticatingBtn: string;

  // Firebase Config Modal
  firebaseConfigTitle: string;
  firebaseConfigSubtitle: string;
  firebaseConfigBanner: string;
  resetDefaultsBtn: string;
  saveAndConnectBtn: string;
  savedConfirmation: string;

  // Setup Guide Modal
  guideTitle: string;
  guideSubtitle: string;
  tabConsole: string;
  tabSecurity: string;
  tabPwa: string;
  copyRulesBtn: string;
  copiedBtn: string;
  closeGuideBtn: string;

  // Offline banner
  offlineTitle: string;
  offlineDesc: string;

  // PWA Modal
  pwaModalTitle: string;
  pwaModalSubtitle: string;
  iosSafariHeader: string;
  iosStep1: string;
  iosStep2: string;
  iosStep3: string;
  androidDesktopHeader: string;
  androidStep1: string;
  gotItBtn: string;
}

const translations: Record<Language, Translations> = {
  en: {
    appTitle: 'Community Hub',
    appSubtitleLive: 'Firebase Live',
    appSubtitleLocal: 'Community Portal',
    navNoticeBoard: 'Notice Board',
    navNoticeBoardDesc: 'Public announcements',
    navDirectMessages: 'Direct Messages',
    navDirectMessagesDesc: '1-on-1 chats & files',
    navDirectory: 'Member Directory',
    navAdminDirectory: 'Admin & Directory',
    navDirectoryDesc: 'Community members',
    navGuide: 'Setup & Security Rules',
    navGuideDesc: 'Firebase documentation',
    themeToggle: 'Toggle Theme',
    languageToggle: 'Toggle Language',
    lightMode: 'Light Mode',
    darkMode: 'Dark Mode',
    english: 'English',
    swedish: 'Svenska',
    roleAdmin: 'Administrator',
    roleMember: 'Member',
    roleGuest: 'Guest',
    you: 'You',
    signOut: 'Sign Out',
    signInOrRegister: 'Sign In / Register',
    switchRole: 'Switch Role:',
    firebaseConfig: 'Firebase Config',
    rulesAndDocs: 'Rules & Docs',
    installApp: 'Install App',
    installIOS: 'Install on iOS',
    mobilePWAReady: 'Mobile PWA Ready',

    topDocsBtn: 'Firebase Docs',

    noticeBoardTitle: 'Notice Board',
    noticeBoardSubtitle: 'Official community broadcasts, documents, and updates',
    newNoticeBtn: 'New Notice',
    searchNoticesPlaceholder: 'Search notices by title, content or author...',
    adminBadge: 'Admin Broadcast',
    pinned: 'Official',
    downloadAttachment: 'Download Attachment',
    editNotice: 'Edit Notice',
    deleteNotice: 'Delete',
    confirmDeleteNotice: 'Are you sure you want to permanently delete this notice?',
    noNoticesFound: 'No notices found',
    noNoticesFoundDesc: 'There are currently no announcements matching your search query.',
    createNoticeTitle: 'Create Notice',
    editNoticeTitle: 'Edit Notice',
    noticeTitleLabel: 'Notice Title',
    noticeTitlePlaceholder: 'e.g. Annual Community Meeting & Guidelines',
    noticeContentLabel: 'Announcement Details',
    noticeContentPlaceholder: 'Write the complete announcement text, agenda, or guidelines...',
    noticeAttachmentLabel: 'Attachment (PDF, Document or Image, up to 10MB)',
    chooseFileBtn: 'Choose File',
    changeFileBtn: 'Change File',
    removeFileBtn: 'Remove',
    uploadingAttachment: 'Uploading attachment...',
    cancelBtn: 'Cancel',
    saveNoticeBtn: 'Save Changes',
    publishNoticeBtn: 'Publish Notice',
    savingNoticeBtn: 'Publishing...',
    noticeUpdatedSuccess: 'Notice updated successfully!',
    noticeCreatedSuccess: 'Notice published to community board!',
    noticeDeletedSuccess: 'Notice deleted.',
    provideTitleAndContentError: 'Please provide both a title and notice content.',
    fileTooLargeError: 'Selected file exceeds the maximum allowed size of 10MB.',

    directMessagesTitle: 'Direct Messages',
    conversationsHeader: 'Conversations',
    searchConversationsPlaceholder: 'Search conversations...',
    selectConversationPrompt: 'Select a conversation to begin chatting',
    selectConversationSubtitle: 'Choose an active chat from the sidebar or start a direct message with a member or administrator.',
    directMessageWith: 'Direct Message with',
    typeMessagePlaceholder: 'Type your message...',
    sendBtn: 'Send',
    sendingBtn: 'Sending...',
    attachFileTooltip: 'Attach file (up to 10MB)',
    membersCanOnlyDMAdminInfo: 'Community members can directly message administrators for support or inquiries.',
    noConversationsYet: 'No active conversations',
    noConversationsYetDesc: 'Select an administrator or member from the directory to start a chat.',
    noMessagesInThread: 'No messages in this conversation yet.',
    noMessagesInThreadDesc: 'Send the first message or file attachment below.',
    startChatWithUser: 'Start Conversation',
    youLabel: 'You',
    adminLabel: 'Admin',
    memberLabel: 'Member',

    directoryTitle: 'Community Directory',
    directorySubtitle: 'Registered members, administrators, and contact directory',
    adminsCount: 'Admins',
    membersCount: 'Members',
    searchDirectoryPlaceholder: 'Search directory by name or email...',
    allRolesTab: 'All Roles',
    adminsTab: 'Admins',
    membersTab: 'Members',
    noMembersFound: 'No members found',
    noMembersFoundDesc: 'Try adjusting your search query or role filter.',
    memberSince: 'Member since',
    directMessageBtn: 'Direct Message',

    signInTitle: 'Sign In to Community Hub',
    registerTitle: 'Create Community Account',
    signInSubtitle: 'Access notice boards, discussions, and direct messages',
    registerSubtitle: 'Join the community portal as a verified member',
    displayNameLabel: 'Display Name',
    emailLabel: 'Email Address',
    passwordLabel: 'Password',
    requestedRoleLabel: 'Requested Role',
    roleMemberOption: 'Community Member (Read Notice Board, DM Admin)',
    roleAdminOption: 'Administrator (Manage Notice Board, Full DMs)',
    quickDemoSection: 'Instant Role Exploration',
    adminDemoBtn: 'Admin Demo',
    memberDemoBtn: 'Member Demo',
    authenticatingBtn: 'Authenticating...',

    firebaseConfigTitle: 'Firebase Project Configuration',
    firebaseConfigSubtitle: 'Modular Web SDK v10+ credentials',
    firebaseConfigBanner: 'Paste your Firebase project credentials from Firebase Console > Project Settings > General > Your apps > SDK setup and configuration.',
    resetDefaultsBtn: 'Reset Defaults',
    saveAndConnectBtn: 'Save & Connect',
    savedConfirmation: 'Saved & Connected!',

    guideTitle: 'Firebase Console & Security Documentation',
    guideSubtitle: 'Step-by-step console guide & production rules',
    tabConsole: 'Console Setup Steps',
    tabSecurity: 'Hardened Security Rules',
    tabPwa: 'PWA & Real-time Specs',
    copyRulesBtn: 'Copy Rules',
    copiedBtn: 'Copied!',
    closeGuideBtn: 'Close Guide',

    offlineTitle: 'Offline Mode Active',
    offlineDesc: 'You are currently disconnected. Content is served from local cache.',

    pwaModalTitle: 'Install Community Hub',
    pwaModalSubtitle: 'iOS, Android & Desktop Download',
    iosSafariHeader: 'On Apple iOS (Safari):',
    iosStep1: 'Tap the Share button in Safari\'s bottom toolbar.',
    iosStep2: 'Scroll down and select "Add to Home Screen".',
    iosStep3: 'Tap "Add" in the top-right corner to launch fullscreen.',
    androidDesktopHeader: 'On Android (Chrome) & Desktop:',
    androidStep1: 'Tap the browser menu (⋮) and choose "Install app" or "Add to Home screen".',
    gotItBtn: 'Got it'
  },
  sv: {
    appTitle: 'Gemenskapsportal',
    appSubtitleLive: 'Live Firebase',
    appSubtitleLocal: 'Gemenskapsportal',
    navNoticeBoard: 'Anslagstavla',
    navNoticeBoardDesc: 'Offentliga meddelanden',
    navDirectMessages: 'Direktmeddelanden',
    navDirectMessagesDesc: 'Privata chattar & filer',
    navDirectory: 'Medlemsregister',
    navAdminDirectory: 'Admin & Register',
    navDirectoryDesc: 'Gemenskapsmedlemmar',
    navGuide: 'Konfiguration & Säkerhet',
    navGuideDesc: 'Firebase-dokumentation',
    themeToggle: 'Växla tema',
    languageToggle: 'Växla språk',
    lightMode: 'Ljust läge',
    darkMode: 'Mörkt läge',
    english: 'English',
    swedish: 'Svenska',
    roleAdmin: 'Administratör',
    roleMember: 'Medlem',
    roleGuest: 'Gäst',
    you: 'Du',
    signOut: 'Logga ut',
    signInOrRegister: 'Logga in / Registrera',
    switchRole: 'Växla roll:',
    firebaseConfig: 'Firebase-konfiguration',
    rulesAndDocs: 'Regler & dokument',
    installApp: 'Installera app',
    installIOS: 'Installera på iOS',
    mobilePWAReady: 'Mobil PWA redo',

    topDocsBtn: 'Firebase Dokumentation',

    noticeBoardTitle: 'Anslagstavla',
    noticeBoardSubtitle: 'Officiella meddelanden, dokument och uppdateringar',
    newNoticeBtn: 'Nytt anslag',
    searchNoticesPlaceholder: 'Sök anslag efter titel, innehåll eller författare...',
    adminBadge: 'Administratörsmeddelande',
    pinned: 'Officiellt',
    downloadAttachment: 'Ladda ner bilaga',
    editNotice: 'Redigera anslag',
    deleteNotice: 'Ta bort',
    confirmDeleteNotice: 'Är du säker på att du vill ta bort detta anslag permanent?',
    noNoticesFound: 'Inga anslag hittades',
    noNoticesFoundDesc: 'Det finns inga meddelanden som matchar din sökning.',
    createNoticeTitle: 'Skapa anslag',
    editNoticeTitle: 'Redigera anslag',
    noticeTitleLabel: 'Titel på anslag',
    noticeTitlePlaceholder: 't.ex. Årsmöte & Gemensamma riktlinjer',
    noticeContentLabel: 'Meddelandeinnehåll',
    noticeContentPlaceholder: 'Skriv fullständigt meddelande, agenda eller riktlinjer...',
    noticeAttachmentLabel: 'Bilaga (PDF, dokument eller bild, max 10 MB)',
    chooseFileBtn: 'Välj fil',
    changeFileBtn: 'Byt fil',
    removeFileBtn: 'Ta bort',
    uploadingAttachment: 'Laddar upp bilaga...',
    cancelBtn: 'Avbryt',
    saveNoticeBtn: 'Spara ändringar',
    publishNoticeBtn: 'Publicera anslag',
    savingNoticeBtn: 'Publicerar...',
    noticeUpdatedSuccess: 'Anslaget har uppdaterats!',
    noticeCreatedSuccess: 'Anslaget har publicerats på anslagstavlan!',
    noticeDeletedSuccess: 'Anslaget har raderats.',
    provideTitleAndContentError: 'Vänligen ange både en titel och anslagstext.',
    fileTooLargeError: 'Vald fil överskrider maximal tillåten storlek på 10 MB.',

    directMessagesTitle: 'Direktmeddelanden',
    conversationsHeader: 'Konversationer',
    searchConversationsPlaceholder: 'Sök konversationer...',
    selectConversationPrompt: 'Välj en konversation för att börja chatta',
    selectConversationSubtitle: 'Välj en aktiv konversation i sidomenyn eller starta ett nytt direktmeddelande med en medlem eller administratör.',
    directMessageWith: 'Direktmeddelande med',
    typeMessagePlaceholder: 'Skriv ditt meddelande...',
    sendBtn: 'Skicka',
    sendingBtn: 'Skickar...',
    attachFileTooltip: 'Bifoga fil (max 10 MB)',
    membersCanOnlyDMAdminInfo: 'Medlemmar kan skicka direktmeddelanden till administratörer för support eller frågor.',
    noConversationsYet: 'Inga aktiva konversationer',
    noConversationsYetDesc: 'Välj en administratör eller medlem från registret för att starta en chatt.',
    noMessagesInThread: 'Inga meddelanden i denna konversation än.',
    noMessagesInThreadDesc: 'Skicka det första meddelandet eller en filbilaga nedan.',
    startChatWithUser: 'Starta konversation',
    youLabel: 'Du',
    adminLabel: 'Admin',
    memberLabel: 'Medlem',

    directoryTitle: 'Medlemsregister',
    directorySubtitle: 'Registrerade medlemmar, administratörer och kontaktkatalog',
    adminsCount: 'Administratörer',
    membersCount: 'Medlemmar',
    searchDirectoryPlaceholder: 'Sök i registret efter namn eller e-post...',
    allRolesTab: 'Alla roller',
    adminsTab: 'Administratörer',
    membersTab: 'Medlemmar',
    noMembersFound: 'Inga medlemmar hittades',
    noMembersFoundDesc: 'Prova att justera din sökning eller rollfilter.',
    memberSince: 'Medlem sedan',
    directMessageBtn: 'Direktmeddelande',

    signInTitle: 'Logga in på Gemenskapsportalen',
    registerTitle: 'Skapa gemenskapskonto',
    signInSubtitle: 'Få tillgång till anslagstavla, chattar och filer',
    registerSubtitle: 'Gå med i gemenskapen som verifierad medlem',
    displayNameLabel: 'Visningsnamn',
    emailLabel: 'E-postadress',
    passwordLabel: 'Lösenord',
    requestedRoleLabel: 'Önskad roll',
    roleMemberOption: 'Medlem (Läs anslagstavla, meddelande till admin)',
    roleAdminOption: 'Administratör (Hantera anslagstavla, alla meddelanden)',
    quickDemoSection: 'Snabbdemo & Rollbyte',
    adminDemoBtn: 'Admin Demo',
    memberDemoBtn: 'Medlem Demo',
    authenticatingBtn: 'Verifierar...',

    firebaseConfigTitle: 'Firebase Projektkonfiguration',
    firebaseConfigSubtitle: 'Modulära Web SDK v10+ inloggningsuppgifter',
    firebaseConfigBanner: 'Klistra in dina Firebase-uppgifter från Firebase Console > Project Settings > General > Your apps > SDK setup and configuration.',
    resetDefaultsBtn: 'Återställ standard',
    saveAndConnectBtn: 'Spara & anslut',
    savedConfirmation: 'Sparat & anslutet!',

    guideTitle: 'Firebase-konsol & Säkerhetsdokumentation',
    guideSubtitle: 'Steg-för-steg-guide för konsol & säkerhetsregler',
    tabConsole: 'Konsolinställningar',
    tabSecurity: 'Härdade säkerhetsregler',
    tabPwa: 'PWA & Realtidsspecifikationer',
    copyRulesBtn: 'Kopiera regler',
    copiedBtn: 'Kopierat!',
    closeGuideBtn: 'Stäng guide',

    offlineTitle: 'Offlineläge aktivt',
    offlineDesc: 'Du är för närvarande offline. Innehåll visas från lokal cache.',

    pwaModalTitle: 'Installera Gemenskapsportal',
    pwaModalSubtitle: 'iOS, Android & Skrivbordsnedladdning',
    iosSafariHeader: 'På Apple iOS (Safari):',
    iosStep1: 'Tryck på Dela-knappen i Safaris nedre verktygsfält.',
    iosStep2: 'Scrolla ner och välj "Lägg till på hemskärmen".',
    iosStep3: 'Tryck på "Lägg till" i övre högra hörnet för att starta i helskärm.',
    androidDesktopHeader: 'På Android (Chrome) & Skrivbord:',
    androidStep1: 'Tryck på webbläsarmenyn (⋮) och välj "Installera app" eller "Lägg till på startskärmen".',
    gotItBtn: 'Förstått'
  }
};

interface PreferencesContextType {
  theme: ThemeMode;
  toggleTheme: () => void;
  setTheme: (theme: ThemeMode) => void;
  language: Language;
  toggleLanguage: () => void;
  setLanguage: (lang: Language) => void;
  t: (key: keyof Translations) => string;
  formatLocalizedDate: (timestamp: any) => string;
  formatLocalizedTime: (timestamp: any) => string;
}

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

export const PreferencesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Theme state
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('community_hub_theme');
    if (saved === 'dark' || saved === 'light') return saved;
    // Check system preference if available
    if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  });

  // Language state
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('community_hub_lang');
    if (saved === 'sv' || saved === 'en') return saved;
    // Check browser language
    if (typeof navigator !== 'undefined' && navigator.language && navigator.language.startsWith('sv')) {
      return 'sv';
    }
    return 'en';
  });

  useEffect(() => {
    localStorage.setItem('community_hub_theme', theme);
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('community_hub_lang', language);
  }, [language]);

  const toggleTheme = () => {
    setThemeState((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
  };

  const toggleLanguage = () => {
    setLanguageState((prev) => (prev === 'en' ? 'sv' : 'en'));
  };

  const setLanguage = (newLang: Language) => {
    setLanguageState(newLang);
  };

  const t = (key: keyof Translations): string => {
    return translations[language][key] || translations['en'][key] || key;
  };

  const formatLocalizedDate = (timestamp: any): string => {
    if (!timestamp) return '';
    let date: Date;
    if (timestamp instanceof Date) {
      date = timestamp;
    } else if (typeof timestamp === 'object' && 'seconds' in timestamp) {
      date = new Date(timestamp.seconds * 1000);
    } else {
      date = new Date(timestamp);
    }

    if (isNaN(date.getTime())) return '';

    const locale = language === 'sv' ? 'sv-SE' : 'en-US';
    return date.toLocaleDateString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatLocalizedTime = (timestamp: any): string => {
    if (!timestamp) return '';
    let date: Date;
    if (timestamp instanceof Date) {
      date = timestamp;
    } else if (typeof timestamp === 'object' && 'seconds' in timestamp) {
      date = new Date(timestamp.seconds * 1000);
    } else {
      date = new Date(timestamp);
    }

    if (isNaN(date.getTime())) return '';

    const locale = language === 'sv' ? 'sv-SE' : 'en-US';
    return date.toLocaleTimeString(locale, {
      hour: '2-digit',
      minute: '2-digit',
      hour12: language === 'en'
    });
  };

  return (
    <PreferencesContext.Provider
      value={{
        theme,
        toggleTheme,
        setTheme,
        language,
        toggleLanguage,
        setLanguage,
        t,
        formatLocalizedDate,
        formatLocalizedTime
      }}
    >
      {children}
    </PreferencesContext.Provider>
  );
};

export const usePreferences = () => {
  const context = useContext(PreferencesContext);
  if (!context) {
    throw new Error('usePreferences must be used within a PreferencesProvider');
  }
  return context;
};
