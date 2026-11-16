import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { AppNotification, NotificationType } from '../types';

function mapDbNotification(row: Record<string, any>): AppNotification {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    message: row.message,
    type: row.type as NotificationType,
    relatedResourceId: row.related_resource_id || undefined,
    isRead: Boolean(row.is_read),
    createdAt: row.created_at || new Date().toISOString(),
  };
}

export async function createNotification(data: {
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  relatedResourceId?: string;
}): Promise<AppNotification> {
  const id = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const now = new Date().toISOString();
  const notif: AppNotification = {
    id,
    userId: data.userId,
    title: data.title,
    message: data.message,
    type: data.type,
    relatedResourceId: data.relatedResourceId,
    isRead: false,
    createdAt: now,
  };

  if (!isSupabaseConfigured()) return notif;

  try {
    const { error } = await supabase.from('notifications').insert({
      id,
      user_id: data.userId,
      title: data.title,
      message: data.message,
      type: data.type,
      related_resource_id: data.relatedResourceId || null,
      is_read: false,
      created_at: now,
    });
    if (error) {
      console.warn('Could not save notification:', error.message);
    }
    return notif;
  } catch (err) {
    console.warn('Could not save notification:', err);
    return notif;
  }
}

export async function getUserNotifications(userId: string): Promise<AppNotification[]> {
  if (!userId || !isSupabaseConfigured()) return [];

  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching notifications:', error.message);
      return [];
    }

    return (data || []).map(mapDbNotification);
  } catch (err) {
    console.error('Error fetching notifications:', err);
    return [];
  }
}

export async function markNotificationAsRead(notificationId: string): Promise<void> {
  if (!notificationId || !isSupabaseConfigured()) return;

  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);

    if (error) {
      console.error('Error marking notification as read:', error.message);
    }
  } catch (err) {
    console.error('Error marking notification as read:', err);
  }
}

export async function markAllNotificationsAsRead(userId: string): Promise<void> {
  if (!userId || !isSupabaseConfigured()) return;

  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) {
      console.error('Error marking all notifications as read:', error.message);
    }
  } catch (err) {
    console.error('Error marking all notifications as read:', err);
  }
}
