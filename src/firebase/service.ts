import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  where,
  serverTimestamp,
  getDocs,
  getDoc,
  Firestore
} from 'firebase/firestore';
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  FirebaseStorage
} from 'firebase/storage';
import {
  UserProfile,
  NoticeItem,
  ConversationItem,
  MessageItem,
  UserRole
} from '../types';
import {
  initFirebase,
  handleFirestoreError,
  OperationType
} from './config';

// Initial mock data to ensure seamless instant experience
const MOCK_ADMIN: UserProfile = {
  uid: 'admin_primary',
  email: 'urgvard@gmail.com',
  displayName: 'Admin Eleanor (Community Manager)',
  role: 'admin',
  createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  avatarColor: 'bg-emerald-600'
};

const MOCK_MEMBERS: UserProfile[] = [
  {
    uid: 'member_marcus',
    email: 'marcus.chen@example.com',
    displayName: 'Marcus Chen',
    role: 'member',
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    avatarColor: 'bg-blue-600'
  },
  {
    uid: 'member_sarah',
    email: 'sarah.jenkins@example.com',
    displayName: 'Sarah Jenkins',
    role: 'member',
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    avatarColor: 'bg-purple-600'
  },
  {
    uid: 'member_liam',
    email: 'liam.walker@example.com',
    displayName: 'Liam Walker',
    role: 'member',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    avatarColor: 'bg-amber-600'
  }
];

const INITIAL_NOTICES: NoticeItem[] = [
  {
    id: 'notice_welcome_2026',
    title: '📢 Welcome to the Community Hub Portal',
    content: 'Welcome everyone to our updated community platform! Please review the updated community guidelines and bylaws attached below. Admins are available for direct questions via the Messages tab.',
    fileUrl: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=800&auto=format&fit=crop&q=80',
    fileName: 'Community_Guidelines_2026.pdf',
    createdBy: 'admin_primary',
    authorName: 'Admin Eleanor',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'notice_annual_meeting',
    title: '🗓️ Annual General Gathering & Workshop Schedule',
    content: 'Our spring symposium will be held next Friday at 6:00 PM UTC. Agenda topics include quarterly budget reports, new feature proposals, and open Q&A sessions. Download the itinerary below.',
    fileUrl: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&auto=format&fit=crop&q=80',
    fileName: 'Symposium_Schedule_Q3.pdf',
    createdBy: 'admin_primary',
    authorName: 'Admin Eleanor',
    createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString()
  }
];

// Local state storage for simulated / preview execution
class LocalDataStore {
  users: UserProfile[] = [MOCK_ADMIN, ...MOCK_MEMBERS];
  notices: NoticeItem[] = [...INITIAL_NOTICES];
  conversations: Record<string, ConversationItem> = {
    'admin_primary_member_marcus': {
      id: 'admin_primary_member_marcus',
      participants: ['admin_primary', 'member_marcus'],
      lastMessage: 'Here is the revised project summary document.',
      updatedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString()
    },
    'admin_primary_member_sarah': {
      id: 'admin_primary_member_sarah',
      participants: ['admin_primary', 'member_sarah'],
      lastMessage: 'Thanks for clarifying the guideline policy!',
      updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
    }
  };
  messages: Record<string, MessageItem[]> = {
    'admin_primary_member_marcus': [
      {
        id: 'msg_1',
        senderId: 'member_marcus',
        senderName: 'Marcus Chen',
        text: 'Hi Eleanor, could you review the neighborhood event proposal when you have a moment?',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'msg_2',
        senderId: 'admin_primary',
        senderName: 'Admin Eleanor',
        text: 'Hello Marcus! Yes, absolutely. Please send over the latest draft.',
        timestamp: new Date(Date.now() - 90 * 60 * 1000).toISOString()
      },
      {
        id: 'msg_3',
        senderId: 'member_marcus',
        senderName: 'Marcus Chen',
        text: 'Here is the revised project summary document.',
        fileUrl: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=800&auto=format&fit=crop&q=80',
        fileName: 'Neighborhood_Proposal_v2.pdf',
        timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString()
      }
    ],
    'admin_primary_member_sarah': [
      {
        id: 'msg_s1',
        senderId: 'member_sarah',
        senderName: 'Sarah Jenkins',
        text: 'Hello Eleanor, quick question regarding the parking rule change mentioned in the notice.',
        timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'msg_s2',
        senderId: 'admin_primary',
        senderName: 'Admin Eleanor',
        text: 'Hi Sarah, guest parking is valid for 72 hours with registration via the portal.',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
      }
    ]
  };

  noticeListeners: Set<(notices: NoticeItem[]) => void> = new Set();
  conversationListeners: Set<(convs: ConversationItem[]) => void> = new Set();
  messageListeners: Record<string, Set<(msgs: MessageItem[]) => void>> = {};
  userListeners: Set<(users: UserProfile[]) => void> = new Set();

  notifyNotices() {
    const list = [...this.notices].sort((a, b) => new Date(b.createdAt as string).getTime() - new Date(a.createdAt as string).getTime());
    this.noticeListeners.forEach(fn => fn(list));
  }

  notifyConversations() {
    const list = Object.values(this.conversations).sort((a, b) => new Date(b.updatedAt as string).getTime() - new Date(a.updatedAt as string).getTime());
    this.conversationListeners.forEach(fn => fn(list));
  }

  notifyMessages(convId: string) {
    const msgs = this.messages[convId] || [];
    const list = [...msgs].sort((a, b) => new Date(a.timestamp as string).getTime() - new Date(b.timestamp as string).getTime());
    const listeners = this.messageListeners[convId];
    if (listeners) {
      listeners.forEach(fn => fn(list));
    }
  }

  notifyUsers() {
    this.userListeners.forEach(fn => fn([...this.users]));
  }
}

export const localStore = new LocalDataStore();

/**
 * Helper to compute predictable Conversation ID: [uid1, uid2].sort().join("_")
 */
export function getConversationId(uid1: string, uid2: string): string {
  return [uid1, uid2].sort().join('_');
}

/**
 * Notice Board Operations
 */
export function subscribeNoticeBoard(
  db: Firestore | null,
  callback: (notices: NoticeItem[]) => void
): () => void {
  if (!db) {
    localStore.noticeListeners.add(callback);
    localStore.notifyNotices();
    return () => {
      localStore.noticeListeners.delete(callback);
    };
  }

  const path = 'notice_board';
  const q = query(collection(db, path), orderBy('createdAt', 'desc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const items: NoticeItem[] = snapshot.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<NoticeItem, 'id'>)
      }));
      callback(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function addNotice(
  db: Firestore | null,
  notice: Omit<NoticeItem, 'id' | 'createdAt'>
): Promise<string> {
  if (!db) {
    const newNotice: NoticeItem = {
      id: 'notice_' + Date.now(),
      ...notice,
      createdAt: new Date().toISOString()
    };
    localStore.notices.unshift(newNotice);
    localStore.notifyNotices();
    return newNotice.id;
  }

  const path = 'notice_board';
  try {
    const docRef = await addDoc(collection(db, path), {
      ...notice,
      createdAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateNotice(
  db: Firestore | null,
  noticeId: string,
  data: Partial<NoticeItem>
): Promise<void> {
  if (!db) {
    const idx = localStore.notices.findIndex((n) => n.id === noticeId);
    if (idx !== -1) {
      localStore.notices[idx] = { ...localStore.notices[idx], ...data };
      localStore.notifyNotices();
    }
    return;
  }

  const path = `notice_board/${noticeId}`;
  try {
    const docRef = doc(db, 'notice_board', noticeId);
    await updateDoc(docRef, data);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteNotice(
  db: Firestore | null,
  noticeId: string
): Promise<void> {
  if (!db) {
    localStore.notices = localStore.notices.filter((n) => n.id !== noticeId);
    localStore.notifyNotices();
    return;
  }

  const path = `notice_board/${noticeId}`;
  try {
    const docRef = doc(db, 'notice_board', noticeId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Conversations & Direct Messaging Operations
 */
export function subscribeUserConversations(
  db: Firestore | null,
  userId: string,
  userRole: UserRole,
  callback: (convs: ConversationItem[]) => void
): () => void {
  if (!db) {
    const updateHandler = () => {
      let filtered = Object.values(localStore.conversations);
      if (userRole !== 'admin') {
        filtered = filtered.filter((c) => c.participants.includes(userId));
      }
      callback(
        filtered.sort(
          (a, b) =>
            new Date(b.updatedAt as string).getTime() -
            new Date(a.updatedAt as string).getTime()
        )
      );
    };
    localStore.conversationListeners.add(updateHandler);
    updateHandler();
    return () => {
      localStore.conversationListeners.delete(updateHandler);
    };
  }

  const path = 'conversations';
  // If member, filter by array-contains userId
  const q =
    userRole === 'admin'
      ? query(collection(db, path), orderBy('updatedAt', 'desc'))
      : query(
          collection(db, path),
          where('participants', 'array-contains', userId),
          orderBy('updatedAt', 'desc')
        );

  return onSnapshot(
    q,
    (snapshot) => {
      const convs: ConversationItem[] = snapshot.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<ConversationItem, 'id'>)
      }));
      callback(convs);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export function subscribeConversationMessages(
  db: Firestore | null,
  conversationId: string,
  callback: (messages: MessageItem[]) => void
): () => void {
  if (!db) {
    if (!localStore.messageListeners[conversationId]) {
      localStore.messageListeners[conversationId] = new Set();
    }
    const updateHandler = (msgs: MessageItem[]) => callback(msgs);
    localStore.messageListeners[conversationId].add(updateHandler);
    localStore.notifyMessages(conversationId);
    return () => {
      localStore.messageListeners[conversationId]?.delete(updateHandler);
    };
  }

  const path = `conversations/${conversationId}/messages`;
  const q = query(collection(db, path), orderBy('timestamp', 'asc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const msgs: MessageItem[] = snapshot.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<MessageItem, 'id'>)
      }));
      callback(msgs);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function sendDirectMessage(
  db: Firestore | null,
  params: {
    senderId: string;
    senderName: string;
    recipientId: string;
    text: string;
    fileUrl?: string;
    fileName?: string;
  }
): Promise<void> {
  const { senderId, senderName, recipientId, text, fileUrl, fileName } = params;
  const convId = getConversationId(senderId, recipientId);
  const participants = [senderId, recipientId].sort();
  const summaryText = text || (fileName ? `Attachment: ${fileName}` : 'File sent');

  if (!db) {
    const newMsg: MessageItem = {
      id: 'msg_' + Date.now(),
      senderId,
      senderName,
      text,
      fileUrl,
      fileName,
      timestamp: new Date().toISOString()
    };

    if (!localStore.messages[convId]) {
      localStore.messages[convId] = [];
    }
    localStore.messages[convId].push(newMsg);

    localStore.conversations[convId] = {
      id: convId,
      participants,
      lastMessage: summaryText,
      lastMessageSenderId: senderId,
      updatedAt: new Date().toISOString()
    };

    localStore.notifyMessages(convId);
    localStore.notifyConversations();
    return;
  }

  const convDocRef = doc(db, 'conversations', convId);
  const messagesColRef = collection(db, `conversations/${convId}/messages`);

  try {
    // 1. Update or create conversation header
    await setDoc(
      convDocRef,
      {
        participants,
        lastMessage: summaryText,
        lastMessageSenderId: senderId,
        updatedAt: serverTimestamp()
      },
      { merge: true }
    );

    // 2. Add message to subcollection
    await addDoc(messagesColRef, {
      senderId,
      text: text || '',
      ...(fileUrl ? { fileUrl } : {}),
      ...(fileName ? { fileName } : {}),
      timestamp: serverTimestamp()
    });
  } catch (error) {
    handleFirestoreError(
      error,
      OperationType.WRITE,
      `conversations/${convId}/messages`
    );
  }
}

/**
 * Users & Directory Operations
 */
export function subscribeUsersDirectory(
  db: Firestore | null,
  callback: (users: UserProfile[]) => void
): () => void {
  if (!db) {
    localStore.userListeners.add(callback);
    localStore.notifyUsers();
    return () => {
      localStore.userListeners.delete(callback);
    };
  }

  const path = 'users';
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const users: UserProfile[] = snapshot.docs.map((d) => ({
        uid: d.id,
        ...(d.data() as Omit<UserProfile, 'uid'>)
      }));
      callback(users);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function saveUserProfile(
  db: Firestore | null,
  profile: UserProfile
): Promise<void> {
  if (!db) {
    const existingIdx = localStore.users.findIndex((u) => u.uid === profile.uid);
    if (existingIdx !== -1) {
      localStore.users[existingIdx] = { ...localStore.users[existingIdx], ...profile };
    } else {
      localStore.users.push(profile);
    }
    localStore.notifyUsers();
    return;
  }

  const path = `users/${profile.uid}`;
  try {
    // Firestore rules require createdAt to be a `timestamp` type, so it must be set
    // server-side rather than passed through as the client's ISO string (which the
    // rules would reject) — both call sites only ever create a fresh profile.
    await setDoc(doc(db, 'users', profile.uid), {
      uid: profile.uid,
      email: profile.email,
      displayName: profile.displayName,
      role: profile.role,
      createdAt: serverTimestamp()
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Cloud Storage File Upload (Strict 10MB Guard)
 */
export async function uploadAttachmentFile(
  storage: FirebaseStorage | null,
  folder: 'notice_attachments' | 'conversation_attachments',
  targetId: string,
  file: File,
  onProgress?: (percent: number) => void
): Promise<{ fileUrl: string; fileName: string }> {
  // Enforce 10MB limit in client
  const MAX_BYTES = 10 * 1024 * 1024;
  if (file.size > MAX_BYTES) {
    throw new Error('File size exceeds the 10MB limit allowed by community storage policies.');
  }

  const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const uniqueName = `${Date.now()}_${sanitizedName}`;

  if (!storage) {
    // Simulated upload for offline / demo mode
    return new Promise((resolve) => {
      let currentProgress = 0;
      const interval = setInterval(() => {
        currentProgress += 25;
        if (onProgress) onProgress(Math.min(currentProgress, 100));
        if (currentProgress >= 100) {
          clearInterval(interval);
          // Create local object URL for preview
          const previewUrl = URL.createObjectURL(file);
          resolve({
            fileUrl: previewUrl,
            fileName: file.name
          });
        }
      }, 100);
    });
  }

  const storageRef = ref(storage, `${folder}/${targetId}/${uniqueName}`);
  const uploadTask = uploadBytesResumable(storageRef, file, {
    customMetadata: {
      originalName: file.name
    }
  });

  return new Promise((resolve, reject) => {
    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        if (onProgress) onProgress(Math.round(progress));
      },
      (error) => {
        console.error('Storage Upload Error:', error);
        reject(new Error(`Storage upload failed: ${error.message}`));
      },
      async () => {
        const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
        resolve({
          fileUrl: downloadUrl,
          fileName: file.name
        });
      }
    );
  });
}
