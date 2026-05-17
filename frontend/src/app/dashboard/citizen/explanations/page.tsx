'use client';
import { useEffect, useState } from 'react';
import { Brain } from 'lucide-react';
import { decisionsAPI } from '@/lib/api';
import DecisionCard from '@/components/shared/DecisionCard';

export default function ExplanationsPage() {
  const [decisions, setDecisions] = useState<any[]>([]);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    decisionsAPI.myDecisions(0, 50).then(r => setDecisions(r.data.filter((d: any) => d.explanation))).finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">AI Explanations</h1>
        <p className="text-slate-400 text-sm mt-1">View and understand every AI decision made on your applications</p>
      </div>
      <div className="glass rounded-xl p-4 border border-teal-500/20 flex items-start gap-3">
        <Brain className="w-5 h-5 text-teal-400 mt-0.5 flex-shrink-0" />
        <p className="text-sm text-slate-300">Every application below includes a SHAP + LIME explanation showing <strong className="text-white">why</strong> the AI made its decision, which factors helped or hurt, and how confident the model was.</p>
      </div>
      {loading
        ? <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" /></div>
        : decisions.length === 0
          ? <div className="glass rounded-xl p-12 text-center border border-navy-800">
              <Brain className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">No explained decisions yet. Submit an application to see AI explanations.</p>
            </div>
          : <div className="space-y-3">{decisions.map((d, i) => <DecisionCard key={d.id} decision={d} index={i} />)}</div>
      }
    </div>
  );
}
