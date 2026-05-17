'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar
} from 'recharts';

import { analyticsAPI } from '@/lib/api';

const COLORS = ['#10B981', '#EF4444', '#F59E0B', '#7C3AED', '#06B6D4'];

export default function OfficerAnalyticsPage() {
  const [stats,  setStats]  = useState<any>(null);
  const [trend,  setTrend]  = useState<any[]>([]);
  const [models, setModels] = useState<any[]>([]);
  const [loading,setLoading]= useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [s, t, m] = await Promise.all([
          analyticsAPI.stats(),
          analyticsAPI.trendData(30),
          analyticsAPI.modelPerf(),
        ]);
        setStats(s.data);
        setTrend(t.data);
        setModels(m.data);
      } catch {}
      finally { setLoading(false); }
    })();
  }, []);

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" /></div>;

  const pieData = stats ? [
    { name: 'Approved', value: stats.approved_count },
    { name: 'Rejected', value: stats.rejected_count },
    { name: 'Pending',  value: stats.pending_count },
  ] : [];

  const radarData = models.map((m: any) => ({
    subject: m.application_type,
    Accuracy:  Math.round(m.accuracy  * 100),
    Precision: Math.round(m.precision * 100),
    Recall:    Math.round(m.recall    * 100),
    F1:        Math.round(m.f1_score  * 100),
  }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Analytics Dashboard</h1>
        <p className="text-slate-400 text-sm mt-1">System-wide AI governance metrics and performance insights</p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Approval Rate',  value: `${Math.round((stats?.approval_rate ?? 0) * 100)}%`,  color: 'text-green-400' },
          { label: 'Avg Confidence', value: `${Math.round((stats?.average_confidence ?? 0) * 100)}%`, color: 'text-teal-400' },
          { label: 'Avg Fairness',   value: `${Math.round((stats?.average_fairness ?? 0) * 100)}%`, color: 'text-blue-400' },
          { label: 'Override Rate',  value: `${stats?.total_decisions ? Math.round((stats.overridden_count / stats.total_decisions) * 100) : 0}%`, color: 'text-yellow-400' },
        ].map((k, i) => (
          <motion.div key={k.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
            className="glass rounded-xl p-5 border border-navy-800 text-center">
            <div className={`text-3xl font-bold mb-1 ${k.color}`}>{k.value}</div>
            <div className="text-sm text-slate-400">{k.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Trend + Pie */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass rounded-xl p-5 border border-navy-800">
          <h2 className="font-semibold text-white mb-4">30-Day Decision Trend</h2>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={trend} margin={{ left: -15, right: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1A3A6E" />
              <XAxis dataKey="date" tick={{ fill: '#94A3B8', fontSize: 10 }} tickLine={false} />
              <YAxis tick={{ fill: '#94A3B8', fontSize: 10 }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ background: '#0F2044', border: '1px solid #1A3A6E', borderRadius: 8, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 12, color: '#94A3B8' }} />
              <Line type="monotone" dataKey="approved" stroke="#10B981" strokeWidth={2} dot={false} name="Approved" />
              <Line type="monotone" dataKey="rejected" stroke="#EF4444" strokeWidth={2} dot={false} name="Rejected" />
              <Line type="monotone" dataKey="total"    stroke="#06B6D4" strokeWidth={2} dot={false} name="Total" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="glass rounded-xl p-5 border border-navy-800">
          <h2 className="font-semibold text-white mb-4">Decision Distribution</h2>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={3} dataKey="value">
                {pieData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: '#0F2044', border: '1px solid #1A3A6E', borderRadius: 8, fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-col gap-2 mt-2">
            {pieData.map((d, i) => (
              <div key={d.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                  <span className="text-slate-400">{d.name}</span>
                </div>
                <span className="font-medium text-white">{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Model performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass rounded-xl p-5 border border-navy-800">
          <h2 className="font-semibold text-white mb-4">Model Performance Radar</h2>
          <ResponsiveContainer width="100%" height={280}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#1A3A6E" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: '#94A3B8', fontSize: 11 }} />
              <Radar name="Accuracy"  dataKey="Accuracy"  stroke="#10B981" fill="#10B981" fillOpacity={0.15} />
              <Radar name="F1 Score"  dataKey="F1"        stroke="#06B6D4" fill="#06B6D4" fillOpacity={0.15} />
              <Legend wrapperStyle={{ fontSize: 11, color: '#94A3B8' }} />
              <Tooltip contentStyle={{ background: '#0F2044', border: '1px solid #1A3A6E', borderRadius: 8, fontSize: 12 }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        <div className="glass rounded-xl p-5 border border-navy-800">
          <h2 className="font-semibold text-white mb-4">Model Accuracy by Domain</h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={models} layout="vertical" margin={{ left: 10, right: 30 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1A3A6E" horizontal={false} />
              <XAxis type="number" domain={[0.8, 1]} tick={{ fill: '#94A3B8', fontSize: 10 }} tickLine={false} tickFormatter={v => `${Math.round(v*100)}%`} />
              <YAxis type="category" dataKey="application_type" tick={{ fill: '#94A3B8', fontSize: 10 }} tickLine={false} axisLine={false} width={80} />
              <Tooltip contentStyle={{ background: '#0F2044', border: '1px solid #1A3A6E', borderRadius: 8, fontSize: 12 }}
                formatter={(v: any) => [`${Math.round(v * 100)}%`]} />
              <Bar dataKey="accuracy" fill="#06B6D4" radius={[0, 4, 4, 0]} name="Accuracy" />
              <Bar dataKey="f1_score" fill="#10B981" radius={[0, 4, 4, 0]} name="F1 Score" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
