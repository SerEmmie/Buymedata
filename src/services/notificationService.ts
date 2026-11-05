import {
  collection,
  doc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
  limit,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { handleFirestoreError, OperationType } from '../firebase/errors';
import { AppNotification, NotificationType } from '../types';

export async function createNotification(data: {
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  relatedResourceId?: string;
}): Promise<AppNotification> {
  const id = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const notif: AppNotification = {
    id,
    userId: data.userId,
    title: data.title,
    message: data.message,
    type: data.type,
    relatedResourceId: data.relatedResourceId,
    isRead: false,
    createdAt: new Date().toISOString(),
  };

  try {
    await setDoc(doc(db, 'notifications', id), notif);
    return notif;
  } catch (err) {
    console.warn('Could not save notification:', err);
    return notif;
  }
}

export async function getUserNotifications(userId: string): Promise<AppNotification[]> {
  try {
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      limit(50)
    );
    const snap = await getDocs(q);
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as AppNotification));
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (err) {
    console.error('Error fetching notifications:', err);
    return [];
  }
}

export async function markNotificationAsRead(notificationId: string): Promise<void> {
  try {
    await updateDoc(doc(db, 'notifications', notificationId), {
      isRead: true,
    });
  } catch (err) {
    console.error('Error marking notification as read:', err);
  }
}

export async function markAllNotificationsAsRead(userId: string): Promise<void> {
  try {
    const list = await getUserNotifications(userId);
    const unread = list.filter((n) => !n.isRead);
    await Promise.all(unread.map((n) => updateDoc(doc(db, 'notifications', n.id), { isRead: true })));
  } catch (err) {
    console.error('Error marking all notifications as read:', err);
  }
}
