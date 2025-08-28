"use client";
import { useAuth } from '@/contexts/AuthContext';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import AuthPage from '@/app/auth/page';

export default function AppRouter({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      // If user is authenticated and on auth page, redirect to appropriate dashboard
      if (user && pathname === '/auth') {
        if (user.userType === 'admin') {
          router.replace('/');
        } else {
          router.replace('/customer');
        }
      }
    }
  }, [user, isLoading, pathname, router]);

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // If user is not authenticated and not on auth page, show auth page
  if (!user && pathname !== '/auth') {
    return <AuthPage />;
  }

  // If user is authenticated and on auth page, show loading while redirecting
  if (user && pathname === '/auth') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  // Show the requested page
  return <>{children}</>;
}
