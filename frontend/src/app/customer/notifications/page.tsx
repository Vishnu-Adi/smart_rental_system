"use client";
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { 
  Bell, 
  CheckCircle, 
  AlertTriangle, 
  CreditCard, 
  FileText, 
  Settings,
  Clock,
  MoreVertical,
  X,
  MarkdownIcon
} from 'lucide-react';
import { Notification } from '@/lib/types';

export default function NotificationsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: () => user ? api.getNotifications(Number(user.id)) : [],
    enabled: !!user,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const markAsReadMutation = useMutation({
    mutationFn: (notificationId: number) => api.markNotificationRead(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'payment_due': return CreditCard;
      case 'contract_renewal': return FileText;
      case 'maintenance_alert': return Settings;
      case 'checkout_reminder': return AlertTriangle;
      default: return Bell;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'payment_due': return 'text-red-400 bg-red-900/30 border-red-700';
      case 'contract_renewal': return 'text-blue-400 bg-blue-900/30 border-blue-700';
      case 'maintenance_alert': return 'text-orange-400 bg-orange-900/30 border-orange-700';
      case 'checkout_reminder': return 'text-yellow-400 bg-yellow-900/30 border-yellow-700';
      default: return 'text-gray-400 bg-gray-900/30 border-gray-700';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'unread') return !notification.is_read;
    if (filter === 'read') return notification.is_read;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const handleMarkAsRead = (notificationId: number) => {
    markAsReadMutation.mutate(notificationId);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading notifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-900 to-black border-b border-gray-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center">
                <Bell className="h-8 w-8 mr-3 text-blue-400" />
                Notifications
              </h1>
              <p className="text-gray-400 mt-2">
                Stay updated with your equipment rentals and account activity
              </p>
            </div>
            {unreadCount > 0 && (
              <div className="text-right">
                <div className="text-sm text-gray-400">Unread</div>
                <div className="text-2xl font-bold text-blue-400">{unreadCount}</div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filter Tabs */}
        <div className="flex space-x-1 mb-6 bg-gray-900 p-1 rounded-lg">
          {[
            { key: 'all', label: 'All', count: notifications.length },
            { key: 'unread', label: 'Unread', count: unreadCount },
            { key: 'read', label: 'Read', count: notifications.length - unreadCount }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key as any)}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                filter === tab.key
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className="ml-2 px-2 py-1 bg-gray-700 text-xs rounded-full">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Notifications List */}
        <div className="space-y-4">
          {filteredNotifications.length > 0 ? (
            filteredNotifications.map((notification) => {
              const IconComponent = getNotificationIcon(notification.notification_type);
              const colorClasses = getNotificationColor(notification.notification_type);
              
              return (
                <div
                  key={notification.id}
                  className={`bg-gray-900 rounded-xl border p-6 transition-all hover:shadow-lg ${
                    notification.is_read 
                      ? 'border-gray-700 opacity-75' 
                      : 'border-blue-600 shadow-blue-600/20'
                  }`}
                >
                  <div className="flex items-start space-x-4">
                    {/* Icon */}
                    <div className={`p-3 rounded-lg ${colorClasses}`}>
                      <IconComponent className="h-6 w-6" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-white capitalize">
                            {notification.notification_type.replace('_', ' ')}
                          </h3>
                          <p className="text-gray-300 mt-1 leading-relaxed">
                            {notification.message}
                          </p>
                          
                          <div className="flex items-center mt-3 space-x-4">
                            <span className="flex items-center text-sm text-gray-400">
                              <Clock className="h-4 w-4 mr-1" />
                              {formatTimeAgo(notification.sent_at)}
                            </span>
                            
                            {notification.contract_id && (
                              <span className="text-sm text-gray-400">
                                Contract #{notification.contract_id}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center space-x-2 ml-4">
                          {!notification.is_read && (
                            <button
                              onClick={() => handleMarkAsRead(notification.id)}
                              className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                              title="Mark as read"
                            >
                              <CheckCircle className="h-5 w-5" />
                            </button>
                          )}
                          
                          {notification.is_read && (
                            <div className="flex items-center text-green-400">
                              <CheckCircle className="h-4 w-4 mr-1" />
                              <span className="text-xs">Read</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-16">
              <Bell className="h-16 w-16 text-gray-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-400 mb-2">
                {filter === 'unread' ? 'No unread notifications' : 
                 filter === 'read' ? 'No read notifications' : 'No notifications'}
              </h3>
              <p className="text-gray-500">
                {filter === 'all' 
                  ? "You're all caught up! New notifications will appear here."
                  : `Switch to "${filter === 'unread' ? 'all' : 'unread'}" to see more notifications.`
                }
              </p>
            </div>
          )}
        </div>

        {/* Auto-refresh indicator */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
            Auto-refreshing every 30 seconds
          </p>
        </div>
      </div>
    </div>
  );
}
