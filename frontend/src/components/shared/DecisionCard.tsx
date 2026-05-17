'use client';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Clock, AlertTriangle, ChevronRight, Download } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { reportsAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import clsx from 'clsx';

interface DecisionCardProps {
  decision: any;
  index?: number;
  showCitizen?: boolean;
}

const STATUS_CONFIG: Record<string, { icon: any; color: string; bg: string; label: string }> = {
  approved:     { icon: CheckCircle,   color: 'text-green-400',  bg: 'bg-green-500/10',  label: 'Approved' },
  rejected:     { icon: XCircle,       color: 'text-red-400',    bg: 'bg-red-500/10',    label: 'Rejected' },
  pending:      { icon: Clock,         color: 'text-yellow-400', bg: 'bg-yellow-500/10', label: 'Pending' },
  under_review: { icon: AlertTriangle, color: 'text-blue-400',   bg: 'bg-blue-500/10',   label: 'Under Review' },
  appealed:     { icon: AlertTriangle, color: 'text-purple-400', bg: 'bg-purple-500/10', label: 'Appealed' },
};

const APP_TYPE_LABELS: Record<string, string> = {
  welfare: '🏠 Welfare', scholarship: '🎓 Scholarship',
  healthcare: '🏥 Healthcare', subsidy: '💰 Subsidy', grievance: '📋 Grievance',
};

export default function DecisionCard({ decision, index = 0, showCitizen = false }: DecisionCardProps) {
  const router = useRouter();
  const cfg    = STATUS_CONFIG[decision.status] || STATUS_CONFIG.pending;
  const Icon   = cfg.icon;

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await reportsAPI.downloadPDF(decision.id);
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url; a.download = `transparency_report_${decision.id}.pdf`;
      a.click(); URL.revokeObjectURL(url);
      toast.success('Report downloaded!');
    } catch { toast.error('Download failed'); }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}
      onClick={() => router.push(`/dashboard/citizen/applications/${decision.id}`)}
      className="glass rounded-xl p-5 border border-navy-800 card-hover cursor-pointer group">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-white">
              {APP_TYPE_LABELS[decision.application_type] || decision.application_type}
            </span>
            <span className="text-xs text-slate-500">#{decision.id}</span>
            {decision.bias_detected && (
              <span className="text-xs bg-orange-500/10 text-orange-400 px-1.5 py-0.5 rounded border border-orange-500/20">⚠ Bias</span>
            )}
            {decision.is_overridden && (
              <span className="text-xs bg-purple-500/10 text-purple-400 px-1.5 py-0.5 rounded border border-purple-500/20">Override</span>
            )}
          </div>
          {showCitizen && decision.citizen && (
            <p className="text-xs text-slate-500 mb-2">{decision.citizen.full_name} · {decision.citizen.citizen_id}</p>
          )}
          <div className="flex items-center gap-4 text-xs text-slate-400">
            {decision.confidence_score && (
              <span>Confidence: <strong className="text-white">{Math.round(decision.confidence_score * 100)}%</strong></span>
            )}
            {decision.fairness_score && (
              <span>Fairness: <strong className="text-white">{Math.round(decision.fairness_score * 100)}%</strong></span>
            )}
            <span>{new Date(decision.created_at).toLocaleDateString()}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <div className={clsx('flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium', cfg.bg, cfg.color)}>
            <Icon className="w-3.5 h-3.5" />
            {cfg.label}
          </div>
          <button onClick={handleDownload}
            className="w-7 h-7 rounded-lg bg-navy-800 hover:bg-navy-700 flex items-center justify-center text-slate-400 hover:text-white transition-all opacity-0 group-hover:opacity-100">
            <Download className="w-3.5 h-3.5" />
          </button>
          <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-teal-400 transition-colors" />
        </div>
      </div>

      {/* Progress bar for confidence */}
      {decision.confidence_score && (
        <div className="mt-3 h-1 bg-navy-800 rounded-full overflow-hidden">
          <motion.div
            className={clsx('h-full rounded-full', decision.confidence_score >= 0.8 ? 'bg-green-500' : decision.confidence_score >= 0.6 ? 'bg-yellow-500' : 'bg-red-500')}
            initial={{ width: 0 }} animate={{ width: `${decision.confidence_score * 100}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>
      )}
    </motion.div>
  );
}
