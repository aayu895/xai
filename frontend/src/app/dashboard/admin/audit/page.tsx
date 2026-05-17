'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Search } from 'lucide-react';
import { analyticsAPI } from '@/lib/api';

export default function AdminAuditPage() {
  const [logs,    setLogs]    = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');

  useEffect(() => {
    analyticsAPI.auditLogs().then(r => setLogs(r.data)).finally(() => setLoading(false));
  }, []);

  const filtered = logs.filter(l =>
    !search ||
    l.action?.toLowerCase().includes(search.toLowerCase()) ||
    l.entity_type?.toLowerCase().includes(search.toLowerCase()) ||
    String(l.user_id || '').includes(search)
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">System Audit Log</h1>
        <p className="text-slate-400 text-sm mt-1">Complete immutable history of all system actions</p>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search action, entity, user..."
            className="bg-navy-900 border border-navy-700 rounded-lg pl-9 pr-4 py-2.5 text-white text-sm outline-none focus:border-teal-500/50 w-72"
          />
        </div>
        <span className="text-sm text-slate-500">{filtered.length} entries</span>
      </div>

      {loading
        ? <div className="flex justify-center py-16"><div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" /></div>
        : <div className="glass rounded-xl border border-navy-800 overflow-hidden">
            <table className="w-full gov-table">
              <thead>
                <tr>
                  <th>ID</th><th>Action</th><th>Entity</th><th>Entity ID</th>
                  <th>User ID</th><th>IP Address</th><th>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((log, i) => (
                  <motion.tr key={log.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}>
                    <td className="text-teal-400 font-mono text-xs">#{log.id}</td>
                    <td>
                      <span className="text-xs font-mono bg-navy-800 px-2 py-0.5 rounded text-slate-300">
                        {log.action}
                      </span>
                    </td>
                    <td className="text-sm capitalize text-slate-300">{log.entity_type}</td>
                    <td className="font-mono text-xs text-teal-400">{log.entity_id ? `#${log.entity_id}` : '—'}</td>
                    <td className="font-mono text-xs text-slate-400">{log.user_id ? `#${log.user_id}` : 'system'}</td>
                    <td className="text-xs text-slate-500 font-mono">{log.ip_address || '—'}</td>
                    <td className="text-xs text-slate-400">
                      {new Date(log.created_at).toLocaleDateString()}{' '}
                      <span className="text-slate-600">{new Date(log.created_at).toLocaleTimeString()}</span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
      }
    </div>
  );
}
