"use client";
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/auth');
  };

  // Only show admin navigation for admin users
  if (user?.userType === 'customer') {
    return <>{children}</>;
  }

  return (
    <>
      <nav className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-6 text-sm">
            <Link href="/" className="font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Fleet Dashboard
            </Link>
            <Link href="/health" className="hover:text-blue-600 transition-colors">Health</Link>
            <Link href="/usage" className="hover:text-green-600 transition-colors">Usage</Link>
            <Link href="/forecast" className="hover:text-purple-600 transition-colors">Forecast</Link>
            <Link href="/customers" className="hover:text-orange-600 transition-colors">Customers</Link>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-muted-foreground">
              Role: {user?.userType === 'admin' ? 'Admin' : 'FleetManager'}
            </span>
            {user && (
              <button
                onClick={handleLogout}
                className="flex items-center gap-1 text-muted-foreground hover:text-red-600 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            )}
          </div>
        </div>
      </nav>
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>
    </>
  );
}
