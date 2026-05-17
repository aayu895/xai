'use client';
import { useRouter, usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Shield, LayoutDashboard, FileText, Bell, LogOut,
  Users, BarChart3, Settings, ClipboardList, AlertTriangle,
  Brain, ChevronRight
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import clsx from 'clsx';

const NAV_ITEMS = {
  citizen: [
    { icon: LayoutDashboard, label: 'Dashboard',     href: '/dashboard/citizen' },
    { icon: FileText,        label: 'My Applications', href: '/dashboard/citizen/applications' },
    { icon: Brain,           label: 'AI Explanations', href: '/dashboard/citizen/explanations' },
    { icon: Bell,            label: 'Notifications',  href: '/dashboard/citizen/notifications' },
  ],
  officer: [
    { icon: LayoutDashboard, label: 'Dashboard',     href: '/dashboard/officer' },
    { icon: ClipboardList,   label: 'Review Cases',  href: '/dashboard/officer/cases' },
    { icon: AlertTriangle,   label: 'Risk Alerts',   href: '/dashboard/officer/alerts' },
    { icon: BarChart3,       label: 'Analytics',     href: '/dashboard/officer/analytics' },
    { icon: FileText,        label: 'Audit Logs',    href: '/dashboard/officer/audit' },
  ],
  admin: [
    { icon: LayoutDashboard, label: 'Dashboard',     href: '/dashboard/admin' },
    { icon: Users,           label: 'User Management', href: '/dashboard/admin/users' },
    { icon: Brain,           label: 'AI Models',     href: '/dashboard/admin/models' },
    { icon: BarChart3,       label: 'Analytics',     href: '/dashboard/admin/analytics' },
    { icon: FileText,        label: 'Audit Logs',    href: '/dashboard/admin/audit' },
    { icon: Settings,        label: 'Settings',      href: '/dashboard/admin/settings' },
  ],
};

const ROLE_LABELS: Record<string, string> = {
  citizen: 'Citizen Portal',
  officer: 'Officer Portal',
  admin:   'Admin Panel',
};

const ROLE_COLORS: Record<string, string> = {
  citizen: 'text-teal-400',
  officer: 'text-yellow-400',
  admin:   'text-purple-400',
};

export default function Sidebar() {
  const router   = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const role     = user?.role || 'citizen';
  const items    = NAV_ITEMS[role as keyof typeof NAV_ITEMS] || NAV_ITEMS.citizen;

  return (
    <div className="h-screen w-64 flex flex-col glass border-r border-navy-800 fixed left-0 top-0 z-40">
      {/* Logo */}
      <div className="p-6 border-b border-navy-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-teal-500/20 border border-teal-500/30 rounded-lg flex items-center justify-center">
            <Shield className="w-5 h-5 text-teal-400" />
          </div>
          <div>
            <div className="font-bold text-white text-sm">XAI<span className="text-teal-400">-Gov</span></div>
            <div className={`text-xs ${ROLE_COLORS[role]}`}>{ROLE_LABELS[role]}</div>
          </div>
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <motion.button key={item.href} onClick={() => router.push(item.href)}
              whileHover={{ x: 2 }} whileTap={{ scale: 0.98 }}
              className={clsx(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all',
                active ? 'nav-active font-medium' : 'text-slate-400 hover:text-white hover:bg-navy-800/50'
              )}>
              <item.icon className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1 text-left">{item.label}</span>
              {active && <ChevronRight className="w-3 h-3 text-teal-400" />}
            </motion.button>
          );
        })}
      </nav>

      {/* User section */}
      <div className="p-4 border-t border-navy-800">
        <div className="flex items-center gap-3 mb-3 p-2">
          <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
            {user?.full_name?.[0] || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-white truncate">{user?.full_name}</div>
            <div className="text-xs text-slate-500 truncate">{user?.email}</div>
          </div>
        </div>
        <button onClick={logout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all">
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </div>
    </div>
  );
}
