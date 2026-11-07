import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '../../services/notificationService';
import { AppNotification } from '../../types';
import { timeAgo } from '../../utils/formatters';
import {
  Bell,
  CheckCircle2,
  Heart,
  Landmark,
  Flame,
  AlertTriangle,
  CheckCheck,
  Loader2,
} from 'lucide-react';

export function NotificationsPage() {
  const { fbUser } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  const loadNotifications = async () => {
    if (!fbUser) return;
    setLoading(true);
    try {
      const list = await getUserNotifications(fbUser.uid);
      setNotifications(list);
    } catch (err) {
      console.error('Error loading notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, [fbUser]);

  const handleMarkAsRead = async (id: string) => {
    await markNotificationAsRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  const handleMarkAllRead = async () => {
    if (!fbUser) return;
    await markAllNotificationsAsRead(fbUser.uid);
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'contribution_received':
        return <Heart className="w-4 h-4 text-rose-500" />;
      case 'payout_processed':
        return <Landmark className="w-4 h-4 text-emerald-600" />;
      case 'goal_reached':
        return <Flame className="w-4 h-4 text-amber-500" />;
      default:
        return <Bell className="w-4 h-4 text-[#F22550]" />;
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
            <Bell className="w-6 h-6 text-[#F22550]" />
            <span>Activity & Notifications</span>
          </h1>
          <p className="text-xs text-gray-500">
            Real-time updates regarding contributions, payouts, and campaigns.
          </p>
        </div>

        {notifications.some((n) => !n.isRead) && (
          <button
            onClick={handleMarkAllRead}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl transition-colors"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            <span>Mark all as read</span>
          </button>
        )}
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-xs">
        {loading ? (
          <div className="py-16 flex justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-[#F22550]" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-gray-50 text-gray-400 flex items-center justify-center mx-auto">
              <Bell className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-sm text-gray-800">All caught up</h4>
            <p className="text-xs text-gray-400">
              You will receive alerts here when supporters send contributions or payouts clear.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => !n.isRead && handleMarkAsRead(n.id)}
                className={`p-4 sm:p-5 flex items-start gap-4 transition-colors cursor-pointer ${
                  n.isRead ? 'bg-white hover:bg-gray-50/50' : 'bg-[#FFE6EA]/30 hover:bg-[#FFE6EA]/50'
                }`}
              >
                <div className="p-2.5 rounded-2xl bg-white border border-gray-100 shadow-xs flex-shrink-0">
                  {getIcon(n.type)}
                </div>

                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-xs text-gray-900">{n.title}</h4>
                    <span className="text-[10px] text-gray-400">{timeAgo(n.createdAt)}</span>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed">{n.message}</p>
                </div>

                {!n.isRead && (
                  <div className="w-2 h-2 rounded-full bg-[#F22550] flex-shrink-0 mt-2" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
