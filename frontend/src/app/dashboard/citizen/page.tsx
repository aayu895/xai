'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, CheckCircle, Clock, TrendingUp, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { analyticsAPI, decisionsAPI } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { StatCard } from '@/components/shared/StatCard';
import DecisionCard from '@/components/shared/DecisionCard';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const PIE_COLORS = ['#10B981', '#EF4444', '#F59E0B', '#7C3AED'];

export default function CitizenDashboard() {
  const { user } = useAuthStore();
  const router   = useRouter();
  const [stats,     setStats]     = useState<any>(null);
  const [decisions, setDecisions] = useState<any[]>([]);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [statsRes, decRes] = await Promise.all([
          analyticsAPI.citizenStats(),
          decisionsAPI.myDecisions(0, 5),
        ]);
        setStats(statsRes.data);
        setDecisions(decRes.data);
      } catch {}
      finally { setLoading(false); }
    })();
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const pieData = stats ? [
    { name: 'Approved', value: stats.approved || 0 },
    { name: 'Pending',  value: stats.pending  || 0 },
    { name: 'Other',    value: Math.max(0, (stats.total_applications || 0) - (stats.approved || 0) - (stats.pending || 0)) },
  ].filter(d => d.value > 0) : [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <h1 className="text-2xl font-bold text-white">Welcome back, {user?.full_name?.split(' ')[0]} 👋</h1>
          <p className="text-slate-400 text-sm mt-1">Citizen ID: <span className="text-teal-400">{user?.citizen_id}</span></p>
        </motion.div>
        <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          onClick={() => router.push('/dashboard/citizen/applications/new')}
          className="flex items-center gap-2 bg-teal-500 hover:bg-teal-400 text-navy-950 font-semibold px-4 py-2.5 rounded-xl text-sm transition-all">
          <Plus className="w-4 h-4" /> New Application
        </motion.button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Applications"  value={stats?.total_applications  || 0} icon={FileText}    color="teal"   index={0} />
        <StatCard title="Approved"            value={stats?.approved            || 0} icon={CheckCircle} color="green"  index={1} />
        <StatCard title="Pending Review"      value={stats?.pending             || 0} icon={Clock}       color="yellow" index={2} />
        <StatCard title="Avg. AI Confidence"  value={`${Math.round((stats?.average_confidence || 0) * 100)}%`} icon={TrendingUp} color="purple" index={3} />
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent decisions */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Recent Applications</h2>
            <button onClick={() => router.push('/dashboard/citizen/applications')}
              className="text-sm text-teal-400 hover:text-teal-300">View all →</button>
          </div>
          {decisions.length === 0
            ? <div className="glass rounded-xl p-12 text-center border border-navy-800">
                <FileText className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400">No applications yet. Start your first one!</p>
                <button onClick={() => router.push('/dashboard/citizen/applications/new')}
                  className="mt-4 text-sm bg-teal-500 text-navy-950 font-semibold px-4 py-2 rounded-lg">
                  Apply Now
                </button>
              </div>
            : decisions.map((d, i) => <DecisionCard key={d.id} decision={d} index={i} />)
          }
        </div>

        {/* Pie chart + info */}
        <div className="space-y-4">
          {pieData.length > 0 && (
            <div className="glass rounded-xl p-5 border border-navy-800">
              <h3 className="font-medium text-white mb-3">Application Status</h3>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                    {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#0F2044', border: '1px solid #1A3A6E', borderRadius: 8 }} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '12px', color: '#94A3B8' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="glass rounded-xl p-5 border border-navy-800">
            <h3 className="font-medium text-white mb-3">Your Rights</h3>
            <div className="space-y-2.5">
              {[
                { icon: '🔍', text: 'See why every AI decision was made' },
                { icon: '📄', text: 'Download full PDF transparency reports' },
                { icon: '⚖️', text: 'Appeal any decision you disagree with' },
                { icon: '🛡️', text: 'Bias detection on all your applications' },
              ].map(r => (
                <div key={r.text} className="flex items-start gap-2 text-sm text-slate-400">
                  <span>{r.icon}</span><span>{r.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
