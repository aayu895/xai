'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Search, UserCheck, UserX, Shield } from 'lucide-react';
import { analyticsAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import clsx from 'clsx';

const ROLE_CONFIG: Record<string, { color: string; bg: string }> = {
  citizen: { color: 'text-teal-400',   bg: 'bg-teal-500/10' },
  officer: { color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
  admin:   { color: 'text-purple-400', bg: 'bg-purple-500/10' },
};

export default function AdminUsersPage() {
  const [users,   setUsers]   = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');

  useEffect(() => {
    analyticsAPI.users().then(r => setUsers(r.data)).finally(() => setLoading(false));
  }, []);

  const toggleActive = async (id: number) => {
    try {
      const res = await analyticsAPI.toggleUser(id);
      setUsers(prev => prev.map(u => u.id === id ? { ...u, is_active: res.data.is_active } : u));
      toast.success(`User ${res.data.is_active ? 'activated' : 'deactivated'}`);
    } catch { toast.error('Action failed'); }
  };

  const filtered = users.filter(u =>
    u.full_name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.role.includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-teal-400" /> User Management
          </h1>
          <p className="text-slate-400 text-sm mt-1">{users.length} registered users across all roles</p>
        </div>
      </div>

      {/* Role summary */}
      <div className="grid grid-cols-3 gap-4">
        {['citizen', 'officer', 'admin'].map(role => {
          const count = users.filter(u => u.role === role).length;
          const rc = ROLE_CONFIG[role];
          return (
            <div key={role} className={`glass rounded-xl p-4 border border-navy-800 flex items-center gap-3`}>
              <div className={`w-10 h-10 ${rc.bg} rounded-lg flex items-center justify-center`}>
                <Shield className={`w-5 h-5 ${rc.color}`} />
              </div>
              <div>
                <div className="text-xl font-bold text-white">{count}</div>
                <div className={`text-xs capitalize ${rc.color}`}>{role}s</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search users..."
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
                  <th>User</th><th>Email</th><th>Role</th><th>Citizen ID</th>
                  <th>Verified</th><th>Status</th><th>Joined</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((user, i) => {
                  const rc = ROLE_CONFIG[user.role];
                  return (
                    <motion.tr key={user.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                            {user.full_name[0]}
                          </div>
                          <span className="text-sm font-medium text-white">{user.full_name}</span>
                        </div>
                      </td>
                      <td className="text-sm text-slate-400">{user.email}</td>
                      <td>
                        <span className={clsx('text-xs px-2 py-0.5 rounded-full font-medium capitalize', rc.bg, rc.color)}>
                          {user.role}
                        </span>
                      </td>
                      <td className="font-mono text-xs text-teal-400">{user.citizen_id || '—'}</td>
                      <td>
                        <span className={user.is_verified ? 'text-green-400 text-xs' : 'text-slate-500 text-xs'}>
                          {user.is_verified ? '✓ Yes' : '✗ No'}
                        </span>
                      </td>
                      <td>
                        <span className={clsx('text-xs px-2 py-0.5 rounded-full',
                          user.is_active ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400')}>
                          {user.is_active ? 'Active' : 'Disabled'}
                        </span>
                      </td>
                      <td className="text-xs text-slate-500">{new Date(user.created_at).toLocaleDateString()}</td>
                      <td>
                        <button onClick={() => toggleActive(user.id)}
                          className={clsx('w-7 h-7 rounded-lg flex items-center justify-center transition-all',
                            user.is_active ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400' : 'bg-green-500/10 hover:bg-green-500/20 text-green-400')}>
                          {user.is_active ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                        </button>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )
      }
    </div>
  );
}
