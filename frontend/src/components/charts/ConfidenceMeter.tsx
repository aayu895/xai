'use client';
import { motion } from 'framer-motion';
import { Activity } from 'lucide-react';

interface ConfidenceMeterProps {
  value: number; // 0-1
  label?: string;
  size?: 'sm' | 'md' | 'lg';
}

function getColor(v: number): { stroke: string; text: string; bg: string } {
  if (v >= 0.8) return { stroke: '#10B981', text: 'text-green-400',  bg: 'bg-green-500/10' };
  if (v >= 0.6) return { stroke: '#F59E0B', text: 'text-yellow-400', bg: 'bg-yellow-500/10' };
  return               { stroke: '#EF4444', text: 'text-red-400',    bg: 'bg-red-500/10' };
}

export default function ConfidenceMeter({ value, label = 'AI Confidence', size = 'md' }: ConfidenceMeterProps) {
  const pct = Math.round(value * 100);
  const { stroke, text, bg } = getColor(value);
  const r = 52, cx = 60, cy = 60;
  const circumference = 2 * Math.PI * r;
  const dashOffset = circumference * (1 - value);
  const dim = size === 'sm' ? 100 : size === 'lg' ? 160 : 120;

  return (
    <div className={`flex flex-col items-center gap-2 ${bg} rounded-xl p-4 border border-navy-800`}>
      <div className="relative" style={{ width: dim, height: dim }}>
        <svg viewBox="0 0 120 120" width={dim} height={dim} className="-rotate-90">
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="#1A3A6E" strokeWidth="10" />
          <motion.circle
            cx={cx} cy={cy} r={r} fill="none"
            stroke={stroke} strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: dashOffset }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            className={`font-bold ${text} ${size === 'lg' ? 'text-3xl' : 'text-2xl'}`}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
            {pct}%
          </motion.span>
        </div>
      </div>
      <div className="flex items-center gap-1.5 text-sm text-slate-400">
        <Activity className="w-3.5 h-3.5" />
        <span>{label}</span>
      </div>
    </div>
  );
}
