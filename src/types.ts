export type UserRole = 'admin' | 'member';
export type UserStatus = 'pending' | 'approved';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  status?: UserStatus; // absent == 'approved', for accounts created before this field existed
  createdAt: string | number | { seconds: number; nanoseconds: number };
  avatarColor?: string;
}

export interface NoticeItem {
  id: string;
  title: string;
  content: string;
  fileUrl?: string;
  fileName?: string;
  createdBy: string;
  createdAt: string | number | { seconds: number; nanoseconds: number };
  authorName?: string;
}

export interface ConversationItem {
  id: string; // [uid1, uid2].sort().join("_")
  participants: string[];
  lastMessage: string;
  lastMessageSenderId?: string;
  updatedAt: string | number | { seconds: number; nanoseconds: number };
  otherUser?: UserProfile;
}

export interface MessageItem {
  id: string;
  senderId: string;
  text: string;
  fileUrl?: string;
  fileName?: string;
  timestamp: string | number | { seconds: number; nanoseconds: number };
  senderName?: string;
}

export interface FirebaseCustomConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

export type ActiveTab = 'notices' | 'messages' | 'directory' | 'guide';
