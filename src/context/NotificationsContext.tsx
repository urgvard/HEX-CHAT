import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useAuth } from './AuthContext';
import { usePreferences } from './PreferencesContext';
import { subscribeNoticeBoard, subscribeUserConversations } from '../firebase/service';

type NotificationPermissionState = NotificationPermission | 'unsupported';

interface NotificationsContextType {
  noticesUnread: number;
  messagesUnread: number;
  permission: NotificationPermissionState;
  requestPermission: () => void;
  markNoticesRead: () => void;
  markMessagesRead: () => void;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

function toMillis(timestamp: any): number {
  if (!timestamp) return 0;
  if (typeof timestamp === 'object' && 'seconds' in timestamp) {
    return timestamp.seconds * 1000;
  }
  const date = new Date(timestamp);
  return isNaN(date.getTime()) ? 0 : date.getTime();
}

export const NotificationsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { db, currentUser, isApproved } = useAuth();
  const { t } = usePreferences();
  const [noticesUnread, setNoticesUnread] = useState(0);
  const [messagesUnread, setMessagesUnread] = useState(0);
  const [permission, setPermission] = useState<NotificationPermissionState>(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'unsupported'
  );

  const seenNoticeIds = useRef<Set<string>>(new Set());
  const noticesInitialized = useRef(false);
  const prevConvUpdatedAt = useRef<Map<string, number>>(new Map());
  const convsInitialized = useRef(false);

  const fireNotification = (title: string, body: string) => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;
    try {
      new Notification(title, { body, icon: '/pwa-192x192.png' });
    } catch (e) {
      console.warn('Could not display notification', e);
    }
  };

  const requestPermission = () => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    Notification.requestPermission().then((result) => setPermission(result));
  };

  // Real-time watch for new community notices (skips the initial snapshot so
  // existing notices don't count as "new" on load). Skipped entirely while
  // pending approval, since Firestore rules deny these reads until an admin
  // approves the account.
  useEffect(() => {
    if (!isApproved) return;

    seenNoticeIds.current = new Set();
    noticesInitialized.current = false;

    const unsubscribe = subscribeNoticeBoard(db, (notices) => {
      if (!noticesInitialized.current) {
        notices.forEach((n) => seenNoticeIds.current.add(n.id));
        noticesInitialized.current = true;
        return;
      }

      const newOnes = notices.filter((n) => !seenNoticeIds.current.has(n.id));
      notices.forEach((n) => seenNoticeIds.current.add(n.id));

      if (newOnes.length > 0) {
        setNoticesUnread((prev) => prev + newOnes.length);
        newOnes.forEach((n) => fireNotification(t('newNoticeNotifTitle'), n.title));
      }
    });

    return () => unsubscribe();
  }, [db, t, isApproved]);

  // Real-time watch for incoming DMs across all of the user's conversations
  // (identified via lastMessageSenderId, so the sender's own outgoing
  // messages never self-notify). Skipped while pending approval, same reason
  // as the notices watch above.
  useEffect(() => {
    if (!currentUser || !isApproved) {
      prevConvUpdatedAt.current = new Map();
      convsInitialized.current = false;
      return;
    }

    prevConvUpdatedAt.current = new Map();
    convsInitialized.current = false;

    const unsubscribe = subscribeUserConversations(db, currentUser.uid, currentUser.role, (convs) => {
      if (!convsInitialized.current) {
        convs.forEach((c) => prevConvUpdatedAt.current.set(c.id, toMillis(c.updatedAt)));
        convsInitialized.current = true;
        return;
      }

      let incoming = 0;
      convs.forEach((c) => {
        const prevTime = prevConvUpdatedAt.current.get(c.id);
        const curTime = toMillis(c.updatedAt);
        const isNewActivity = prevTime === undefined || curTime > prevTime;
        const isIncoming = !!c.lastMessageSenderId && c.lastMessageSenderId !== currentUser.uid;

        if (isNewActivity && isIncoming) {
          incoming++;
          fireNotification(t('newMessageNotifTitle'), c.lastMessage);
        }
        prevConvUpdatedAt.current.set(c.id, curTime);
      });

      if (incoming > 0) {
        setMessagesUnread((prev) => prev + incoming);
      }
    });

    return () => unsubscribe();
  }, [db, currentUser?.uid, currentUser?.role, t, isApproved]);

  const markNoticesRead = () => setNoticesUnread(0);
  const markMessagesRead = () => setMessagesUnread(0);

  return (
    <NotificationsContext.Provider
      value={{
        noticesUnread,
        messagesUnread,
        permission,
        requestPermission,
        markNoticesRead,
        markMessagesRead
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationsProvider');
  }
  return context;
};
