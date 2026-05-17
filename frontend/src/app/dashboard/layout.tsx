'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import Sidebar from '@/components/layout/Sidebar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loadFromCookie } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    loadFromCookie();
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      const timer = setTimeout(() => {
        if (!useAuthStore.getState().isAuthenticated) router.push('/auth/login');
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, router]);

  return (
    <div className="min-h-screen bg-navy-950">
      <Sidebar />
      <main className="ml-64 min-h-screen p-8">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
