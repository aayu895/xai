'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Brain, CheckCircle, AlertCircle, Send } from 'lucide-react';
import { decisionsAPI } from '@/lib/api';
import toast from 'react-hot-toast';

const APP_TYPES = [
  { value: 'welfare',     label: '🏠 Welfare Eligibility',      desc: 'Social welfare and poverty relief programs' },
  { value: 'scholarship', label: '🎓 Scholarship Application',   desc: 'Education grants and merit scholarships' },
  { value: 'healthcare',  label: '🏥 Healthcare Prioritization', desc: 'Medical treatment and hospital priority' },
  { value: 'subsidy',     label: '💰 Subsidy Distribution',      desc: 'Government subsidies for essential services' },
];

const FIELDS = [
  { key: 'income',            label: 'Annual Income (₹)',     type: 'number', min: 0,    max: 10000000, placeholder: '200000', help: 'Your total household annual income' },
  { key: 'family_size',       label: 'Family Size',           type: 'number', min: 1,    max: 20,       placeholder: '4',      help: 'Total number of family members' },
  { key: 'age',               label: 'Age',                   type: 'number', min: 18,   max: 100,      placeholder: '35',     help: 'Your current age' },
  { key: 'education_level',   label: 'Education Level (0-5)', type: 'number', min: 0,    max: 5,        placeholder: '3',      help: '0=None, 1=Primary, 2=Secondary, 3=HS, 4=Bachelor, 5=PostGrad' },
  { key: 'health_status',     label: 'Health Status (1-5)',   type: 'number', min: 1,    max: 5,        placeholder: '3',      help: '1=Critical, 2=Poor, 3=Fair, 4=Good, 5=Excellent' },
  { key: 'region_code',       label: 'Region Type (1-5)',     type: 'number', min: 1,    max: 5,        placeholder: '2',      help: '1=Rural, 2=Semi-Urban, 3=Urban, 4=Metro, 5=Capital' },
  { key: 'employment_status', label: 'Employment Status (0-3)',type: 'number', min: 0,   max: 3,        placeholder: '1',      help: '0=Unemployed, 1=Part-time, 2=Full-time, 3=Self-employed' },
  { key: 'disability_status', label: 'Disability Status',     type: 'number', min: 0,    max: 1,        placeholder: '0',      help: '0=No disability, 1=Has disability' },
];

export default function NewApplicationPage() {
  const router = useRouter();
  const [appType, setAppType] = useState('welfare');
  const [form, setForm]       = useState<Record<string, string>>({});
  const [notes, setNotes]     = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult]   = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload: any = { application_type: appType, application_notes: notes };
      FIELDS.forEach(f => { payload[f.key] = Number(form[f.key] || 0); });
      const res = await decisionsAPI.submit(payload);
      setResult(res.data);
      toast.success('Application submitted & AI analysis complete!');
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Submission failed');
    } finally { setLoading(false); }
  };

  if (result) {
    const approved = result.ai_decision;
    return (
      <div className="space-y-6">
        <button onClick={() => router.push('/dashboard/citizen')} className="flex items-center gap-2 text-slate-400 hover:text-white text-sm">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          className="glass rounded-2xl p-8 border border-navy-800 text-center max-w-2xl mx-auto">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${approved ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
            {approved ? <CheckCircle className="w-8 h-8 text-green-400" /> : <AlertCircle className="w-8 h-8 text-red-400" />}
          </div>
          <h2 className={`text-2xl font-bold mb-2 ${approved ? 'text-green-400' : 'text-red-400'}`}>
            AI Decision: {approved ? 'APPROVED' : 'REJECTED'}
          </h2>
          <p className="text-slate-400 mb-6">
            Your application has been analyzed. Confidence: <strong className="text-white">{Math.round(result.confidence_score * 100)}%</strong> | Fairness: <strong className="text-white">{Math.round(result.fairness_score * 100)}%</strong>
          </p>
          {result.explanation?.plain_english_explanation && (
            <div className="glass-light rounded-xl p-4 mb-6 text-left">
              <p className="text-sm text-slate-300 leading-relaxed">{result.explanation.plain_english_explanation}</p>
            </div>
          )}
          <div className="flex gap-3 justify-center">
            <button onClick={() => router.push(`/dashboard/citizen/applications/${result.id}`)}
              className="flex items-center gap-2 bg-teal-500 hover:bg-teal-400 text-navy-950 font-semibold px-6 py-2.5 rounded-xl text-sm">
              <Brain className="w-4 h-4" /> View Full Explanation
            </button>
            <button onClick={() => router.push('/dashboard/citizen')}
              className="px-6 py-2.5 glass border border-navy-700 rounded-xl text-sm hover:border-teal-500/30">
              Back to Dashboard
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-4">
        <button onClick={() => router.push('/dashboard/citizen')} className="flex items-center gap-2 text-slate-400 hover:text-white text-sm">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <div>
          <h1 className="text-xl font-bold text-white">New Application</h1>
          <p className="text-slate-400 text-sm">AI will analyze your eligibility and provide a full explanation</p>
        </div>
      </div>

      {/* App type selection */}
      <div className="glass rounded-xl p-5 border border-navy-800">
        <h2 className="font-medium text-white mb-3">Select Application Type</h2>
        <div className="grid grid-cols-2 gap-3">
          {APP_TYPES.map(t => (
            <button key={t.value} onClick={() => setAppType(t.value)}
              className={`text-left p-4 rounded-xl border transition-all ${appType === t.value ? 'border-teal-500/50 bg-teal-500/10' : 'border-navy-700 glass-light hover:border-navy-600'}`}>
              <div className="font-medium text-sm text-white mb-1">{t.label}</div>
              <div className="text-xs text-slate-500">{t.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="glass rounded-xl p-6 border border-navy-800 space-y-5">
        <h2 className="font-medium text-white mb-1">Applicant Information</h2>
        <div className="grid grid-cols-2 gap-4">
          {FIELDS.map(f => (
            <div key={f.key}>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">{f.label}</label>
              <input type={f.type} required min={f.min} max={f.max} placeholder={f.placeholder}
                value={form[f.key] || ''} onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                className="w-full bg-navy-900 border border-navy-700 focus:border-teal-500/50 rounded-lg px-3 py-2.5 text-white text-sm outline-none transition-colors"
              />
              <p className="text-xs text-slate-600 mt-1">{f.help}</p>
            </div>
          ))}
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">Additional Notes (optional)</label>
          <textarea rows={3} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any additional context for your application..."
            className="w-full bg-navy-900 border border-navy-700 focus:border-teal-500/50 rounded-lg px-3 py-2.5 text-white text-sm outline-none transition-colors resize-none"
          />
        </div>

        <div className="flex items-center gap-2 bg-teal-500/5 border border-teal-500/15 rounded-lg p-3">
          <Brain className="w-4 h-4 text-teal-400 flex-shrink-0" />
          <p className="text-xs text-slate-400">Our XGBoost AI model will analyze your application and provide SHAP + LIME explanations for full transparency.</p>
        </div>

        <button type="submit" disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-teal-500 hover:bg-teal-400 disabled:opacity-60 text-navy-950 font-semibold py-3 rounded-xl transition-all">
          {loading
            ? <><div className="w-4 h-4 border-2 border-navy-950 border-t-transparent rounded-full animate-spin" /> Analyzing with AI...</>
            : <><Send className="w-4 h-4" /> Submit Application</>}
        </button>
      </form>
    </div>
  );
}
