'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, user, loadFromCookie } = useAuthStore();

  useEffect(() => {
    loadFromCookie();
  }, []);

  useEffect(() => {
    if (isAuthenticated && user) {
      const roleRoute: Record<string, string> = {
        citizen: '/dashboard/citizen',
        officer:  '/dashboard/officer',
        admin:    '/dashboard/admin',
      };
      router.push(roleRoute[user.role] || '/dashboard/citizen');
    } else {
      router.push('/landing');
    }
  }, [isAuthenticated, user, router]);

  return (
    <div className="min-h-screen bg-navy-950 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
