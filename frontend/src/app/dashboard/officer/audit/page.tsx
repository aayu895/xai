'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Search, Filter } from 'lucide-react';
import { analyticsAPI } from '@/lib/api';

const ACTION_COLORS: Record<string, string> = {
  user_registered:  'text-teal-400 bg-teal-500/10',
  user_login:       'text-blue-400 bg-blue-500/10',
  decision_created: 'text-green-400 bg-green-500/10',
  officer_review:   'text-yellow-400 bg-yellow-500/10',
  appeal_submitted: 'text-orange-400 bg-orange-500/10',
};

export default function AuditLogsPage() {
  const [logs,    setLogs]    = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');

  useEffect(() => {
    analyticsAPI.auditLogs().then(r => setLogs(r.data)).finally(() => setLoading(false));
  }, []);

  const filtered = logs.filter(l =>
    l.action.includes(search.toLowerCase()) ||
    l.entity_type.includes(search.toLowerCase()) ||
    String(l.id).includes(search)
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Shield className="w-6 h-6 text-teal-400" /> Audit Logs
        </h1>
        <p className="text-slate-400 text-sm mt-1">Immutable record of all system actions — tamper-proof governance trail</p>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Filter by action, entity..."
          className="w-full bg-navy-900 border border-navy-700 focus:border-teal-500/50 rounded-lg pl-9 pr-4 py-2.5 text-white text-sm outline-none"
        />
      </div>

      {loading
        ? <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" /></div>
        : (
          <div className="glass rounded-xl border border-navy-800 overflow-hidden">
            <table className="w-full gov-table">
              <thead>
                <tr>
                  <th>Log ID</th><th>Action</th><th>Entity</th><th>Entity ID</th>
                  <th>User ID</th><th>IP Address</th><th>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0
                  ? <tr><td colSpan={7} className="text-center py-10 text-slate-500">No logs found</td></tr>
                  : filtered.map((log, i) => {
                    const colorClass = ACTION_COLORS[log.action] || 'text-slate-400 bg-slate-500/10';
                    return (
                      <motion.tr key={log.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}>
                        <td className="font-mono text-xs text-slate-500">#{log.id}</td>
                        <td>
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${colorClass}`}>
                            {log.action.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="text-sm capitalize">{log.entity_type}</td>
                        <td className="font-mono text-xs text-teal-400">{log.entity_id ? `#${log.entity_id}` : '—'}</td>
                        <td className="font-mono text-xs text-slate-400">{log.user_id ? `#${log.user_id}` : 'system'}</td>
                        <td className="text-xs text-slate-500 font-mono">{log.ip_address || '—'}</td>
                        <td className="text-xs text-slate-400">
                          {new Date(log.created_at).toLocaleDateString()}{' '}
                          <span className="text-slate-600">{new Date(log.created_at).toLocaleTimeString()}</span>
                        </td>
                      </motion.tr>
                    );
                  })
                }
              </tbody>
            </table>
          </div>
        )
      }
    </div>
  );
}
