'use client';
import { motion } from 'framer-motion';
import { Settings, Shield, Bell, Database, Key } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-white">System Settings</h1>
        <p className="text-slate-400 text-sm mt-1">Configure platform-wide settings and security</p>
      </div>
      {[
        { icon: Shield,   title: 'Security',      desc: 'JWT expiry, password policy, rate limits',   tag: 'Configured' },
        { icon: Bell,     title: 'Notifications', desc: 'Email alerts, in-app notifications',          tag: 'Active' },
        { icon: Database, title: 'Database',      desc: 'Connection pool, backup schedule',             tag: 'Healthy' },
        { icon: Key,      title: 'API Keys',      desc: 'Manage service API keys and integrations',    tag: 'Secure' },
      ].map((s, i) => (
        <motion.div key={s.title} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
          className="glass rounded-xl p-5 border border-navy-800 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-teal-500/10 rounded-xl flex items-center justify-center">
              <s.icon className="w-5 h-5 text-teal-400" />
            </div>
            <div>
              <div className="font-medium text-white">{s.title}</div>
              <div className="text-sm text-slate-400">{s.desc}</div>
            </div>
          </div>
          <span className="text-xs bg-green-500/10 text-green-400 px-2 py-1 rounded-full border border-green-500/20">{s.tag}</span>
        </motion.div>
      ))}
    </div>
  );
}
