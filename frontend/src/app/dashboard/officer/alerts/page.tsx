'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Shield } from 'lucide-react';
import { decisionsAPI } from '@/lib/api';
import DecisionCard from '@/components/shared/DecisionCard';

export default function RiskAlertsPage() {
  const [flagged, setFlagged] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    decisionsAPI.allDecisions(0, 100).then(r => {
      setFlagged(r.data.filter((d: any) => d.bias_detected || d.confidence_score < 0.6));
    }).finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Risk Alerts</h1>
        <p className="text-slate-400 text-sm mt-1">Decisions flagged for bias detection or low confidence</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
        <div className="glass rounded-xl p-4 border border-orange-500/20 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-orange-400" />
          <div><p className="text-sm font-medium text-white">Bias Detected</p><p className="text-xs text-slate-400">Region or demographic impact &gt; threshold</p></div>
        </div>
        <div className="glass rounded-xl p-4 border border-yellow-500/20 flex items-center gap-3">
          <Shield className="w-5 h-5 text-yellow-400" />
          <div><p className="text-sm font-medium text-white">Low Confidence</p><p className="text-xs text-slate-400">AI confidence below 60% — requires review</p></div>
        </div>
      </div>
      <p className="text-sm text-slate-400">{flagged.length} flagged decision{flagged.length !== 1 ? 's' : ''} require attention</p>
      {loading
        ? <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" /></div>
        : flagged.length === 0
          ? <div className="glass rounded-xl p-12 text-center border border-navy-800">
              <Shield className="w-10 h-10 text-green-400/40 mx-auto mb-3" />
              <p className="text-slate-400">No risk alerts. All decisions look clean!</p>
            </div>
          : <div className="space-y-3">{flagged.map((d, i) => <DecisionCard key={d.id} decision={d} index={i} showCitizen />)}</div>
      }
    </div>
  );
}
