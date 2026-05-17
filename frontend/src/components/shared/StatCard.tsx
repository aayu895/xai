'use client';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import clsx from 'clsx';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  change?: string;
  changeType?: 'up' | 'down' | 'neutral';
  color?: 'teal' | 'yellow' | 'green' | 'red' | 'purple' | 'blue';
  index?: number;
}

const COLOR_MAP = {
  teal:   { icon: 'text-teal-400',   bg: 'bg-teal-500/10',   border: 'border-teal-500/20',   glow: 'hover:shadow-teal-500/10' },
  yellow: { icon: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', glow: 'hover:shadow-yellow-500/10' },
  green:  { icon: 'text-green-400',  bg: 'bg-green-500/10',  border: 'border-green-500/20',  glow: 'hover:shadow-green-500/10' },
  red:    { icon: 'text-red-400',    bg: 'bg-red-500/10',    border: 'border-red-500/20',    glow: 'hover:shadow-red-500/10' },
  purple: { icon: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20', glow: 'hover:shadow-purple-500/10' },
  blue:   { icon: 'text-blue-400',   bg: 'bg-blue-500/10',   border: 'border-blue-500/20',   glow: 'hover:shadow-blue-500/10' },
};

export function StatCard({ title, value, icon: Icon, change, changeType = 'neutral', color = 'teal', index = 0 }: StatCardProps) {
  const c = COLOR_MAP[color];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07 }}
      className={clsx('glass rounded-xl p-5 border card-hover transition-all hover:shadow-lg', c.border, c.glow)}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={clsx('w-10 h-10 rounded-lg flex items-center justify-center', c.bg)}>
          <Icon className={clsx('w-5 h-5', c.icon)} />
        </div>
        {change && (
          <span className={clsx('text-xs font-medium px-2 py-0.5 rounded-full', {
            'bg-green-500/10 text-green-400': changeType === 'up',
            'bg-red-500/10 text-red-400':     changeType === 'down',
            'bg-slate-500/10 text-slate-400': changeType === 'neutral',
          })}>
            {change}
          </span>
        )}
      </div>
      <div className="text-2xl font-bold text-white mb-1">{value}</div>
      <div className="text-sm text-slate-400">{title}</div>
    </motion.div>
  );
}
