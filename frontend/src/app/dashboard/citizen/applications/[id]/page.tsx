'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Download, AlertTriangle, CheckCircle, XCircle, Clock, Brain, MessageSquare } from 'lucide-react';
import { decisionsAPI, reportsAPI } from '@/lib/api';
import ShapChart from '@/components/charts/ShapChart';
import ConfidenceMeter from '@/components/charts/ConfidenceMeter';
import toast from 'react-hot-toast';

const FEATURE_LABELS: Record<string, string> = {
  income: 'Annual Income (₹)', family_size: 'Family Size',
  education_level: 'Education Level', health_status: 'Health Status',
  region_code: 'Region Type', employment_status: 'Employment Status',
  age: 'Age', disability_status: 'Disability Status',
};

const EDU_LABELS   = ['None', 'Primary', 'Secondary', 'High School', "Bachelor's", 'Post Graduate'];
const HEALTH_LABELS = ['', 'Critical', 'Poor', 'Fair', 'Good', 'Excellent'];
const REGION_LABELS = ['', 'Rural', 'Semi-Urban', 'Urban', 'Metro', 'Capital'];
const EMP_LABELS   = ['Unemployed', 'Part-time', 'Full-time', 'Self-employed'];

export default function DecisionDetailPage() {
  const { id } = useParams();
  const router  = useRouter();
  const [decision, setDecision] = useState<any>(null);
  const [loading,  setLoading]  = useState(true);
  const [appeal,   setAppeal]   = useState({ show: false, reason: '', submitting: false });

  useEffect(() => {
    decisionsAPI.getById(Number(id)).then(r => setDecision(r.data)).finally(() => setLoading(false));
  }, [id]);

  const downloadPDF = async () => {
    try {
      const res = await reportsAPI.downloadPDF(Number(id));
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const a = document.createElement('a'); a.href = url; a.download = `report_${id}.pdf`; a.click();
      toast.success('Report downloaded!');
    } catch { toast.error('Download failed'); }
  };

  const submitAppeal = async () => {
    if (appeal.reason.length < 20) { toast.error('Please provide more detail (min 20 chars)'); return; }
    setAppeal(a => ({ ...a, submitting: true }));
    try {
      await decisionsAPI.appeal(Number(id), { reason: appeal.reason });
      toast.success('Appeal submitted!');
      setAppeal({ show: false, reason: '', submitting: false });
      decisionsAPI.getById(Number(id)).then(r => setDecision(r.data));
    } catch { toast.error('Appeal failed'); setAppeal(a => ({ ...a, submitting: false })); }
  };

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" /></div>;
  if (!decision) return <div className="text-center py-20 text-slate-400">Decision not found.</div>;

  const exp     = decision.explanation;
  const approved = decision.officer_decision !== null ? decision.officer_decision : decision.ai_decision;
  const StatusIcon = approved ? CheckCircle : decision.status === 'pending' ? Clock : XCircle;

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-slate-400 hover:text-white text-sm">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <div className="flex items-center gap-2">
          {decision.status !== 'appealed' && decision.status !== 'approved' && (
            <button onClick={() => setAppeal(a => ({ ...a, show: true }))}
              className="flex items-center gap-2 glass border border-navy-700 hover:border-orange-500/30 text-orange-400 text-sm px-4 py-2 rounded-lg">
              <MessageSquare className="w-4 h-4" /> Appeal
            </button>
          )}
          <button onClick={downloadPDF}
            className="flex items-center gap-2 bg-teal-500 hover:bg-teal-400 text-navy-950 font-semibold text-sm px-4 py-2 rounded-lg">
            <Download className="w-4 h-4" /> Download PDF
          </button>
        </div>
      </div>

      {/* Decision summary */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className={`glass rounded-2xl p-6 border ${approved ? 'border-green-500/20' : decision.status === 'pending' ? 'border-yellow-500/20' : 'border-red-500/20'}`}>
        <div className="flex items-start gap-6">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 ${approved ? 'bg-green-500/20' : decision.status === 'pending' ? 'bg-yellow-500/20' : 'bg-red-500/20'}`}>
            <StatusIcon className={`w-7 h-7 ${approved ? 'text-green-400' : decision.status === 'pending' ? 'text-yellow-400' : 'text-red-400'}`} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-xl font-bold text-white capitalize">{decision.application_type} Application #{decision.id}</h1>
              {decision.bias_detected && (
                <span className="flex items-center gap-1 text-xs bg-orange-500/10 text-orange-400 px-2 py-0.5 rounded-full border border-orange-500/20">
                  <AlertTriangle className="w-3 h-3" /> Bias Flagged
                </span>
              )}
              {decision.is_overridden && (
                <span className="text-xs bg-purple-500/10 text-purple-400 px-2 py-0.5 rounded-full border border-purple-500/20">Officer Override</span>
              )}
            </div>
            <p className="text-slate-400 text-sm mb-4">Submitted {new Date(decision.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div><p className="text-xs text-slate-500">AI Decision</p><p className={`font-semibold ${decision.ai_decision ? 'text-green-400' : 'text-red-400'}`}>{decision.ai_decision ? 'Approved' : 'Rejected'}</p></div>
              <div><p className="text-xs text-slate-500">Final Status</p><p className="font-semibold text-white capitalize">{decision.status}</p></div>
              <div><p className="text-xs text-slate-500">Confidence</p><p className="font-semibold text-teal-400">{Math.round((decision.confidence_score || 0) * 100)}%</p></div>
              <div><p className="text-xs text-slate-500">Fairness Score</p><p className="font-semibold text-blue-400">{Math.round((decision.fairness_score || 0) * 100)}%</p></div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Plain English explanation */}
      {exp?.plain_english_explanation && (
        <div className="glass rounded-xl p-5 border border-teal-500/20">
          <div className="flex items-center gap-2 mb-3">
            <Brain className="w-5 h-5 text-teal-400" />
            <h2 className="font-semibold text-white">AI Explanation (Plain English)</h2>
          </div>
          <p className="text-slate-300 leading-relaxed">{exp.plain_english_explanation}</p>
        </div>
      )}

      {/* Charts + factors */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {exp?.shap_values && <ShapChart shapValues={exp.shap_values} title="SHAP Feature Impact" />}
        </div>
        <div className="flex flex-col gap-4">
          <ConfidenceMeter value={decision.confidence_score || 0} label="AI Confidence" />
          <ConfidenceMeter value={decision.fairness_score || 0} label="Fairness Score" />
        </div>
      </div>

      {/* Top factors */}
      {exp && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="glass rounded-xl p-5 border border-green-500/20">
            <h3 className="font-medium text-green-400 mb-3">✅ Positive Factors</h3>
            {exp.top_positive_factors?.length ? exp.top_positive_factors.map((f: any, i: number) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-navy-800 last:border-0">
                <span className="text-sm text-slate-300">{f.feature}</span>
                <span className="text-sm font-medium text-green-400">+{f.impact.toFixed(3)}</span>
              </div>
            )) : <p className="text-slate-500 text-sm">No significant positive factors.</p>}
          </div>
          <div className="glass rounded-xl p-5 border border-red-500/20">
            <h3 className="font-medium text-red-400 mb-3">❌ Limiting Factors</h3>
            {exp.top_negative_factors?.length ? exp.top_negative_factors.map((f: any, i: number) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-navy-800 last:border-0">
                <span className="text-sm text-slate-300">{f.feature}</span>
                <span className="text-sm font-medium text-red-400">{f.impact.toFixed(3)}</span>
              </div>
            )) : <p className="text-slate-500 text-sm">No significant limiting factors.</p>}
          </div>
        </div>
      )}

      {/* Applicant data */}
      <div className="glass rounded-xl p-5 border border-navy-800">
        <h3 className="font-medium text-white mb-4">Application Data</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Income',      value: `₹${decision.income?.toLocaleString()}` },
            { label: 'Family Size', value: decision.family_size },
            { label: 'Education',   value: EDU_LABELS[decision.education_level || 0] },
            { label: 'Health',      value: HEALTH_LABELS[decision.health_status || 0] },
            { label: 'Region',      value: REGION_LABELS[decision.region_code || 0] },
            { label: 'Employment',  value: EMP_LABELS[decision.employment_status || 0] },
            { label: 'Age',         value: decision.age },
            { label: 'Disability',  value: decision.disability_status ? 'Yes' : 'No' },
          ].map(item => (
            <div key={item.label} className="bg-navy-900/50 rounded-lg p-3">
              <p className="text-xs text-slate-500 mb-1">{item.label}</p>
              <p className="text-sm font-medium text-white">{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Officer notes */}
      {decision.officer_notes && (
        <div className="glass rounded-xl p-5 border border-purple-500/20">
          <h3 className="font-medium text-purple-400 mb-2">Officer Notes</h3>
          <p className="text-slate-300 text-sm">{decision.officer_notes}</p>
          {decision.reviewed_at && <p className="text-xs text-slate-500 mt-2">Reviewed: {new Date(decision.reviewed_at).toLocaleString()}</p>}
        </div>
      )}

      {/* Appeal modal */}
      {appeal.show && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="glass rounded-2xl p-6 border border-navy-700 w-full max-w-lg">
            <h2 className="text-lg font-bold text-white mb-1">Submit Appeal</h2>
            <p className="text-slate-400 text-sm mb-4">Explain why you believe this decision should be reconsidered.</p>
            <textarea rows={5} value={appeal.reason} onChange={e => setAppeal(a => ({ ...a, reason: e.target.value }))}
              placeholder="Provide your reason for appeal (min 20 characters)..."
              className="w-full bg-navy-900 border border-navy-700 focus:border-teal-500/50 rounded-lg px-4 py-3 text-white text-sm outline-none resize-none mb-4"
            />
            <div className="flex gap-3">
              <button onClick={submitAppeal} disabled={appeal.submitting}
                className="flex-1 bg-orange-500 hover:bg-orange-400 disabled:opacity-60 text-white font-semibold py-2.5 rounded-xl text-sm">
                {appeal.submitting ? 'Submitting...' : 'Submit Appeal'}
              </button>
              <button onClick={() => setAppeal(a => ({ ...a, show: false }))}
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
