"use client";
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Bell, Home, LogOut, Menu, X, BellDot } from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Notification } from '@/lib/types';

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user || user.userType !== 'customer') {
      router.push('/auth');
      return;
    }
    
    fetchNotifications();
    
    // Fetch notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [user, router]);

  const fetchNotifications = async () => {
    if (!user || user.userType !== 'customer') return;
    
    try {
      const notificationsData = await api.getNotifications(Number(user.id));
      setNotifications(notificationsData);
      setUnreadCount(notificationsData.filter(n => !n.is_read).length);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/auth');
  };

  if (!user || user.userType !== 'customer') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Navigation Header */}
      <nav className="bg-gray-900 border-b border-gray-700 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Link href="/customer" className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Home className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold text-white">Smart Rental</span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-6">
              <Link 
                href="/customer" 
                className="text-gray-300 hover:text-white transition-colors"
              >
                Dashboard
              </Link>
              
              <Link 
                href="/customer/notifications" 
                className="relative text-gray-300 hover:text-white transition-colors"
              >
                {unreadCount > 0 ? <BellDot className="h-6 w-6" /> : <Bell className="h-6 w-6" />}
                {unreadCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>

              {/* User Menu */}
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <div className="text-sm font-medium text-white">{user.username}</div>
                  <div className="text-xs text-gray-400">Customer Portal</div>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                  title="Logout"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="text-gray-300 hover:text-white"
              >
                {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {isMobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-gray-700">
              <div className="space-y-3">
                <Link 
                  href="/customer" 
                  className="block text-gray-300 hover:text-white transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Dashboard
                </Link>
                
                <Link 
                  href="/customer/notifications" 
                  className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {unreadCount > 0 ? <BellDot className="h-5 w-5" /> : <Bell className="h-5 w-5" />}
                  <span>Notifications</span>
                  {unreadCount > 0 && (
                    <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1">
                      {unreadCount}
                    </span>
                  )}
                </Link>

                <div className="pt-3 border-t border-gray-700">
                  <div className="text-sm text-white mb-2">{user.username}</div>
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors"
                  >
                    <LogOut className="h-5 w-5" />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <main>
        {children}
      </main>
    </div>
  );
}
