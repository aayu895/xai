'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Brain, BarChart3, Shield, TrendingUp, AlertTriangle, CheckCircle, Activity } from 'lucide-react';
import { analyticsAPI } from '@/lib/api';
import { StatCard } from '@/components/shared/StatCard';
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';

export default function AdminDashboard() {
  const [stats,  setStats]  = useState<any>(null);
  const [models, setModels] = useState<any[]>([]);
  const [trend,  setTrend]  = useState<any[]>([]);
  const [loading,setLoading]= useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [s, m, t] = await Promise.all([
          analyticsAPI.stats(),
          analyticsAPI.modelPerf(),
          analyticsAPI.trendData(7),
        ]);
        setStats(s.data);
        setModels(m.data);
        setTrend(t.data);
      } catch {}
      finally { setLoading(false); }
    })();
  }, []);

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Shield className="w-6 h-6 text-purple-400" /> Admin Panel
        </h1>
        <p className="text-slate-400 text-sm mt-1">Full system oversight — users, models, analytics, and audit control</p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Decisions"  value={stats?.total_decisions    ?? 0} icon={BarChart3}     color="teal"   index={0} />
        <StatCard title="Bias Flags"       value={stats?.bias_detected_count?? 0} icon={AlertTriangle} color="red"    index={1} />
        <StatCard title="Overrides"        value={stats?.overridden_count   ?? 0} icon={Activity}      color="yellow" index={2} />
        <StatCard title="Open Appeals"     value={stats?.appeal_count       ?? 0} icon={Users}         color="purple" index={3} />
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 7-day trend */}
        <div className="lg:col-span-2 glass rounded-xl p-5 border border-navy-800">
          <h2 className="font-semibold text-white mb-4">7-Day Activity</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={trend} margin={{ left: -15, right: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1A3A6E" />
              <XAxis dataKey="date" tick={{ fill: '#94A3B8', fontSize: 10 }} tickLine={false} />
              <YAxis tick={{ fill: '#94A3B8', fontSize: 10 }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ background: '#0F2044', border: '1px solid #1A3A6E', borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="total"    fill="#1A3A6E" radius={[4, 4, 0, 0]} name="Total" />
              <Bar dataKey="approved" fill="#10B981" radius={[4, 4, 0, 0]} name="Approved" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Quick links */}
        <div className="space-y-3">
          {[
            { label: 'Manage Users',    href: '/dashboard/admin/users',     icon: Users,    color: 'text-teal-400',   bg: 'bg-teal-500/10' },
            { label: 'AI Model Health', href: '/dashboard/admin/models',    icon: Brain,    color: 'text-purple-400', bg: 'bg-purple-500/10' },
            { label: 'View Analytics',  href: '/dashboard/officer/analytics', icon: BarChart3, color: 'text-blue-400', bg: 'bg-blue-500/10' },
            { label: 'Audit Trail',     href: '/dashboard/admin/audit',     icon: Shield,   color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
          ].map(link => (
            <a key={link.href} href={link.href}
              className="flex items-center gap-3 glass rounded-xl p-4 border border-navy-800 hover:border-teal-500/20 transition-all group card-hover">
              <div className={`w-9 h-9 ${link.bg} rounded-lg flex items-center justify-center`}>
                <link.icon className={`w-4 h-4 ${link.color}`} />
              </div>
              <span className="text-sm text-white group-hover:text-teal-400 transition-colors">{link.label}</span>
              <span className="ml-auto text-slate-600 group-hover:text-teal-400 text-sm">→</span>
            </a>
          ))}
        </div>
      </div>

      {/* Model performance table */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">AI Model Performance</h2>
        <div className="glass rounded-xl border border-navy-800 overflow-hidden">
          <table className="w-full gov-table">
            <thead>
              <tr>
                <th>Model</th><th>Domain</th><th>Accuracy</th>
                <th>Precision</th><th>Recall</th><th>F1</th><th>AUC-ROC</th><th>Samples</th><th>Status</th>
              </tr>
            </thead>
            <tbody>
              {models.map((m: any, i: number) => (
                <motion.tr key={m.application_type} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}>
                  <td className="font-medium text-white text-sm">{m.model_name}</td>
                  <td className="text-sm capitalize text-slate-300">{m.application_type}</td>
                  {['accuracy', 'precision', 'recall', 'f1_score', 'auc_roc'].map(k => (
                    <td key={k}>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-semibold ${m[k] >= 0.9 ? 'text-green-400' : m[k] >= 0.8 ? 'text-yellow-400' : 'text-red-400'}`}>
                          {Math.round(m[k] * 100)}%
                        </span>
                      </div>
                    </td>
                  ))}
                  <td className="text-sm text-slate-400">{m.training_samples?.toLocaleString()}</td>
                  <td>
                    <span className="text-xs bg-green-500/10 text-green-400 px-2 py-0.5 rounded-full flex items-center gap-1 w-fit">
                      <CheckCircle className="w-3 h-3" /> Active
                    </span>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
