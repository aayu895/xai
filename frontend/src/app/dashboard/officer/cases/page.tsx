'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Search, Filter, CheckCircle, XCircle, Brain, Download, Eye } from 'lucide-react';
import { decisionsAPI, reportsAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import clsx from 'clsx';

const STATUS_TABS = ['all', 'pending', 'approved', 'rejected', 'appealed'];

const APP_ICONS: Record<string, string> = {
  welfare: '🏠', scholarship: '🎓', healthcare: '🏥', subsidy: '💰', grievance: '📋',
};

export default function OfficerCasesPage() {
  const router = useRouter();
  const [decisions, setDecisions]   = useState<any[]>([]);
  const [loading,   setLoading]     = useState(true);
  const [tab,       setTab]         = useState('pending');
  const [search,    setSearch]      = useState('');
  const [reviewing, setReviewing]   = useState<number | null>(null);
  const [reviewForm, setReviewForm] = useState({ decision: true, notes: '' });

  const fetchDecisions = async (status?: string) => {
    setLoading(true);
    try {
      const res = await decisionsAPI.allDecisions(0, 100, status === 'all' ? undefined : status);
      setDecisions(res.data);
    } catch { toast.error('Failed to load cases'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchDecisions(tab); }, [tab]);

  const handleReview = async (decisionId: number) => {
    try {
      await decisionsAPI.review(decisionId, reviewForm);
      toast.success(`Decision ${reviewForm.decision ? 'approved' : 'rejected'} successfully`);
      setReviewing(null);
      fetchDecisions(tab);
    } catch { toast.error('Review failed'); }
  };

  const downloadReport = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await reportsAPI.downloadPDF(id);
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const a = document.createElement('a'); a.href = url; a.download = `report_${id}.pdf`; a.click();
      toast.success('Report downloaded');
    } catch { toast.error('Download failed'); }
  };

  const filtered = decisions.filter(d =>
    d.citizen?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    d.application_type.includes(search.toLowerCase()) ||
    String(d.id).includes(search)
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Review Cases</h1>
        <p className="text-slate-400 text-sm mt-1">Inspect AI decisions, view explanations, and approve or override</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {STATUS_TABS.map(s => (
          <button key={s} onClick={() => setTab(s)}
            className={clsx('px-4 py-2 rounded-lg text-sm capitalize transition-all',
              tab === s ? 'bg-teal-500 text-navy-950 font-semibold' : 'glass border border-navy-700 text-slate-400 hover:text-white')}>
            {s}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by citizen, type, ID..."
          className="w-full bg-navy-900 border border-navy-700 focus:border-teal-500/50 rounded-lg pl-9 pr-4 py-2.5 text-white text-sm outline-none"
        />
      </div>

      {/* Table */}
      {loading
        ? <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" /></div>
        : (
          <div className="glass rounded-xl border border-navy-800 overflow-hidden">
            <table className="w-full gov-table">
              <thead>
                <tr>
                  <th>ID</th><th>Citizen</th><th>Type</th><th>AI Decision</th>
                  <th>Confidence</th><th>Fairness</th><th>Bias</th><th>Status</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0
                  ? <tr><td colSpan={9} className="text-center py-10 text-slate-500">No cases found</td></tr>
                  : filtered.map((d, i) => (
                    <motion.tr key={d.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}>
                      <td className="font-mono text-teal-400">#{d.id}</td>
                      <td>
                        <div className="font-medium text-white text-sm">{d.citizen?.full_name}</div>
                        <div className="text-xs text-slate-500">{d.citizen?.citizen_id}</div>
                      </td>
                      <td><span className="text-sm">{APP_ICONS[d.application_type]} {d.application_type}</span></td>
                      <td>
                        <span className={clsx('text-xs font-semibold px-2 py-1 rounded-full',
                          d.ai_decision ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400')}>
                          {d.ai_decision ? 'Approve' : 'Reject'}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-navy-800 rounded-full overflow-hidden">
                            <div className={clsx('h-full rounded-full', (d.confidence_score || 0) >= 0.8 ? 'bg-green-500' : 'bg-yellow-500')}
                              style={{ width: `${(d.confidence_score || 0) * 100}%` }} />
                          </div>
                          <span className="text-xs text-slate-300">{Math.round((d.confidence_score || 0) * 100)}%</span>
                        </div>
                      </td>
                      <td className="text-sm text-blue-400">{Math.round((d.fairness_score || 0) * 100)}%</td>
                      <td>
                        {d.bias_detected
                          ? <span className="text-xs bg-orange-500/10 text-orange-400 px-1.5 py-0.5 rounded">⚠ Yes</span>
                          : <span className="text-xs text-slate-500">—</span>}
                      </td>
                      <td>
                        <span className={clsx('text-xs px-2 py-1 rounded-full font-medium capitalize', {
                          'bg-yellow-500/10 text-yellow-400': d.status === 'pending',
                          'bg-green-500/10 text-green-400':  d.status === 'approved',
                          'bg-red-500/10 text-red-400':      d.status === 'rejected',
                          'bg-purple-500/10 text-purple-400': d.status === 'appealed',
                        })}>
                          {d.status}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-1">
                          <button onClick={() => router.push(`/dashboard/citizen/applications/${d.id}`)}
                            className="w-7 h-7 rounded-lg bg-navy-800 hover:bg-navy-700 flex items-center justify-center text-slate-400 hover:text-teal-400 transition-all" title="View details">
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={(e) => downloadReport(d.id, e)}
                            className="w-7 h-7 rounded-lg bg-navy-800 hover:bg-navy-700 flex items-center justify-center text-slate-400 hover:text-blue-400 transition-all" title="Download report">
                            <Download className="w-3.5 h-3.5" />
                          </button>
                          {d.status === 'pending' && (
                            <button onClick={() => { setReviewing(d.id); setReviewForm({ decision: d.ai_decision, notes: '' }); }}
                              className="w-7 h-7 rounded-lg bg-teal-500/20 hover:bg-teal-500/30 flex items-center justify-center text-teal-400 transition-all" title="Review">
                              <Brain className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))
                }
              </tbody>
            </table>
          </div>
        )
      }

      {/* Review modal */}
      {reviewing !== null && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="glass rounded-2xl p-6 border border-navy-700 w-full max-w-md">
            <h2 className="text-lg font-bold text-white mb-1">Review Decision #{reviewing}</h2>
            <p className="text-slate-400 text-sm mb-5">As the reviewing officer, your decision is final and will be logged.</p>

            <div className="flex gap-3 mb-4">
              <button onClick={() => setReviewForm(f => ({ ...f, decision: true }))}
                className={clsx('flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all border',
                  reviewForm.decision ? 'bg-green-500/20 border-green-500/40 text-green-400' : 'border-navy-700 text-slate-400 hover:text-white')}>
                <CheckCircle className="w-4 h-4" /> Approve
              </button>
              <button onClick={() => setReviewForm(f => ({ ...f, decision: false }))}
                className={clsx('flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all border',
                  !reviewForm.decision ? 'bg-red-500/20 border-red-500/40 text-red-400' : 'border-navy-700 text-slate-400 hover:text-white')}>
                <XCircle className="w-4 h-4" /> Reject
              </button>
            </div>

            <textarea rows={4} value={reviewForm.notes} onChange={e => setReviewForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="Officer notes (optional but recommended for overrides)..."
              className="w-full bg-navy-900 border border-navy-700 focus:border-teal-500/50 rounded-lg px-4 py-3 text-white text-sm outline-none resize-none mb-4"
            />

            <div className="flex gap-3">
              <button onClick={() => handleReview(reviewing)}
                className="flex-1 bg-teal-500 hover:bg-teal-400 text-navy-950 font-semibold py-2.5 rounded-xl text-sm">
                Confirm Review
              </button>
              <button onClick={() => setReviewing(null)}
                className="px-4 glass border border-navy-700 rounded-xl text-sm text-slate-400">
                Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
