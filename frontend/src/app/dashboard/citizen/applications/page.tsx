'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, FileText } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { decisionsAPI } from '@/lib/api';
import DecisionCard from '@/components/shared/DecisionCard';

export default function ApplicationsPage() {
  const router = useRouter();
  const [decisions, setDecisions] = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');

  useEffect(() => {
    decisionsAPI.myDecisions(0, 50).then(r => setDecisions(r.data)).finally(() => setLoading(false));
  }, []);

  const filtered = decisions.filter(d =>
    d.application_type.includes(search.toLowerCase()) ||
    String(d.id).includes(search) || d.status.includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">My Applications</h1>
          <p className="text-slate-400 text-sm mt-1">{decisions.length} total applications</p>
        </div>
        <button onClick={() => router.push('/dashboard/citizen/applications/new')}
          className="flex items-center gap-2 bg-teal-500 hover:bg-teal-400 text-navy-950 font-semibold px-4 py-2.5 rounded-xl text-sm">
          <Plus className="w-4 h-4" /> New Application
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by type, status, ID..."
          className="w-full bg-navy-900 border border-navy-700 focus:border-teal-500/50 rounded-lg pl-9 pr-4 py-2.5 text-white text-sm outline-none transition-colors"
        />
      </div>

      {loading
        ? <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" /></div>
        : filtered.length === 0
          ? <div className="glass rounded-xl p-12 text-center border border-navy-800">
              <FileText className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">No applications found.</p>
            </div>
          : <div className="space-y-3">{filtered.map((d, i) => <DecisionCard key={d.id} decision={d} index={i} />)}</div>
      }
    </div>
  );
}
