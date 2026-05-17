'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ClipboardList, CheckCircle, AlertTriangle } from 'lucide-react';
import { analyticsAPI, decisionsAPI } from '@/lib/api';
import { StatCard } from '@/components/shared/StatCard';
import DecisionCard from '@/components/shared/DecisionCard';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function OfficerDashboard() {
  const [stats,     setStats]     = useState<any>(null);
  const [decisions, setDecisions] = useState<any[]>([]);
  const [trend,     setTrend]     = useState<any[]>([]);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    Promise.all([
      analyticsAPI.stats(),
      decisionsAPI.allDecisions(0, 10, 'pending'),
      analyticsAPI.trendData(14),
    ]).then(([s, d, t]) => {
      setStats(s.data);
      setDecisions(d.data);
      setTrend(t.data);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
        <h1 className="text-2xl font-bold text-white">Officer Dashboard</h1>
        <p className="text-slate-400 text-sm mt-1">Review AI decisions and manage citizen applications</p>
      </motion.div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Decisions"  value={stats?.total_decisions     || 0} icon={ClipboardList} color="teal"   index={0} />
        <StatCard title="Approved"         value={stats?.approved_count      || 0} icon={CheckCircle}   color="green"  index={1} />
        <StatCard title="Pending Review"   value={stats?.pending_count       || 0} icon={AlertTriangle} color="yellow" index={2} />
        <StatCard title="Bias Flags"       value={stats?.bias_detected_count || 0} icon={AlertTriangle} color="red"    index={3} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass rounded-xl p-5 border border-navy-800">
          <h2 className="font-semibold text-white mb-4">Decision Trend (Last 14 Days)</h2>
          {trend.length === 0
            ? <div className="h-48 flex items-center justify-center text-slate-500 text-sm">No trend data yet</div>
            : <ResponsiveContainer width="100%" height={220}>
                <LineChart data={trend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1A3A6E" />
                  <XAxis dataKey="date" tick={{ fill: '#94A3B8', fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fill: '#94A3B8', fontSize: 11 }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ background: '#0F2044', border: '1px solid #1A3A6E', borderRadius: 8, fontSize: 12 }} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, color: '#94A3B8' }} />
                  <Line type="monotone" dataKey="approved" stroke="#10B981" strokeWidth={2} dot={false} name="Approved" />
                  <Line type="monotone" dataKey="rejected" stroke="#EF4444" strokeWidth={2} dot={false} name="Rejected" />
                  <Line type="monotone" dataKey="total"    stroke="#06b6d4" strokeWidth={2} dot={false} name="Total" strokeDasharray="4 2" />
                </LineChart>
              </ResponsiveContainer>
          }
        </div>

        <div className="space-y-4">
          {[
            { label: 'Approval Rate',     value: `${Math.round((stats?.approval_rate || 0) * 100)}%`,       color: 'text-green-400'  },
            { label: 'Avg. Confidence',   value: `${Math.round((stats?.average_confidence || 0) * 100)}%`,  color: 'text-teal-400'   },
            { label: 'Avg. Fairness',     value: `${Math.round((stats?.average_fairness || 0) * 100)}%`,    color: 'text-blue-400'   },
            { label: 'Officer Overrides', value: stats?.overridden_count || 0,                              color: 'text-purple-400' },
            { label: 'Total Appeals',     value: stats?.appeal_count     || 0,                              color: 'text-orange-400' },
          ].map((item) => (
            <div key={item.label} className="glass rounded-xl p-4 border border-navy-800 flex items-center justify-between">
              <span className="text-sm text-slate-400">{item.label}</span>
              <span className={`text-xl font-bold ${item.color}`}>{item.value}</span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Pending Cases</h2>
          <a href="/dashboard/officer/cases" className="text-sm text-teal-400 hover:text-teal-300">View all →</a>
        </div>
        {decisions.length === 0
          ? <div className="glass rounded-xl p-10 text-center border border-navy-800 text-slate-400">
              <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
              <p>No pending cases. All caught up!</p>
            </div>
          : <div className="space-y-3">{decisions.map((d, i) => <DecisionCard key={d.id} decision={d} index={i} showCitizen />)}</div>
        }
      </div>
    </div>
  );
}
