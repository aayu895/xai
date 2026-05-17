'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Bell, CheckCheck } from 'lucide-react';
import { analyticsAPI } from '@/lib/api';
import toast from 'react-hot-toast';

export default function NotificationsPage() {
  const [notifs,  setNotifs]  = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    analyticsAPI.notifications().then(r => setNotifs(r.data)).finally(() => setLoading(false));
  }, []);

  const markRead = async (id: number) => {
    await analyticsAPI.markRead(id);
    setNotifs(n => n.map(x => x.id === id ? { ...x, is_read: true } : x));
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Notifications</h1>
          <p className="text-slate-400 text-sm mt-1">{notifs.filter(n => !n.is_read).length} unread</p>
        </div>
      </div>

      {loading
        ? <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" /></div>
        : notifs.length === 0
          ? <div className="glass rounded-xl p-12 text-center border border-navy-800">
              <Bell className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">No notifications yet.</p>
            </div>
          : <div className="space-y-3">
              {notifs.map((n, i) => (
                <motion.div key={n.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                  className={`glass rounded-xl p-4 border transition-all ${n.is_read ? 'border-navy-800 opacity-60' : 'border-teal-500/20'}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${n.is_read ? 'bg-slate-600' : 'bg-teal-400'}`} />
                      <div>
                        <p className="text-sm font-medium text-white">{n.title}</p>
                        <p className="text-sm text-slate-400 mt-0.5">{n.message}</p>
                        <p className="text-xs text-slate-600 mt-1">{new Date(n.created_at).toLocaleString()}</p>
                      </div>
                    </div>
                    {!n.is_read && (
                      <button onClick={() => markRead(n.id)}
                        className="flex-shrink-0 p-1.5 hover:bg-navy-700 rounded text-slate-400 hover:text-teal-400" title="Mark read">
                        <CheckCheck className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
      }
    </div>
  );
}
