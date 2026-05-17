'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Brain, CheckCircle, TrendingUp, Cpu } from 'lucide-react';
import { analyticsAPI } from '@/lib/api';
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip } from 'recharts';

export default function AdminModelsPage() {
  const [models, setModels] = useState<any[]>([]);
  const [loading,setLoading]= useState(true);

  useEffect(() => {
    analyticsAPI.modelPerf().then(r => setModels(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Brain className="w-6 h-6 text-purple-400" /> AI Model Management
        </h1>
        <p className="text-slate-400 text-sm mt-1">Monitor, evaluate, and manage deployed XGBoost governance models</p>
      </div>

      {/* Model cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {models.map((m: any, i: number) => {
          const radarData = [
            { metric: 'Accuracy',  value: Math.round(m.accuracy  * 100) },
            { metric: 'Precision', value: Math.round(m.precision * 100) },
            { metric: 'Recall',    value: Math.round(m.recall    * 100) },
            { metric: 'F1',        value: Math.round(m.f1_score  * 100) },
            { metric: 'AUC-ROC',   value: Math.round(m.auc_roc  * 100) },
          ];

          const colorMap: Record<string, string> = {
            welfare: '#06B6D4', scholarship: '#10B981', healthcare: '#EF4444', subsidy: '#F59E0B'
          };
          const color = colorMap[m.application_type] || '#7C3AED';

          return (
            <motion.div key={m.application_type} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="glass rounded-2xl p-6 border border-navy-800 card-hover">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                    <h3 className="font-semibold text-white">{m.model_name}</h3>
                  </div>
                  <p className="text-xs text-slate-500 capitalize">Domain: {m.application_type} · v{m.version || '1.0.0'}</p>
                </div>
                <div className="flex items-center gap-1.5 text-xs bg-green-500/10 text-green-400 px-2 py-1 rounded-full">
                  <CheckCircle className="w-3 h-3" /> Active
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-5">
                {[
                  { label: 'Accuracy',   value: m.accuracy,  color: '#10B981' },
                  { label: 'Precision',  value: m.precision, color: '#06B6D4' },
                  { label: 'Recall',     value: m.recall,    color: '#F59E0B' },
                  { label: 'F1 Score',   value: m.f1_score,  color: '#7C3AED' },
                ].map(metric => (
                  <div key={metric.label} className="bg-navy-900/60 rounded-lg p-3">
                    <div className="text-xs text-slate-500 mb-1">{metric.label}</div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-navy-800 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${metric.value * 100}%`, backgroundColor: metric.color }} />
                      </div>
                      <span className="text-xs font-semibold text-white">{Math.round(metric.value * 100)}%</span>
                    </div>
                  </div>
                ))}
              </div>

              <ResponsiveContainer width="100%" height={160}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#1A3A6E" />
                  <PolarAngleAxis dataKey="metric" tick={{ fill: '#94A3B8', fontSize: 9 }} />
                  <Radar dataKey="value" stroke={color} fill={color} fillOpacity={0.15} />
                  <Tooltip contentStyle={{ background: '#0F2044', border: '1px solid #1A3A6E', borderRadius: 8, fontSize: 11 }} />
                </RadarChart>
              </ResponsiveContainer>

              <div className="flex items-center justify-between mt-3 pt-3 border-t border-navy-800">
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <Cpu className="w-3 h-3" /> XGBoost
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <TrendingUp className="w-3 h-3" />
                  {m.training_samples?.toLocaleString()} training samples
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Tech details */}
      <div className="glass rounded-xl p-6 border border-navy-800">
        <h2 className="font-semibold text-white mb-4">Explainability Stack</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { name: 'SHAP (TreeExplainer)', desc: 'SHapley Additive exPlanations — global and local feature attribution for each prediction', color: 'text-teal-400', bg: 'bg-teal-500/10' },
            { name: 'LIME',                 desc: 'Local Interpretable Model-agnostic Explanations — perturbation-based local approximations', color: 'text-purple-400', bg: 'bg-purple-500/10' },
            { name: 'Feature Importance',   desc: 'XGBoost built-in feature importance scores — global model-level attribution ranking',       color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
          ].map(t => (
            <div key={t.name} className={`${t.bg} rounded-xl p-4 border border-navy-800`}>
              <div className={`text-sm font-semibold ${t.color} mb-2`}>{t.name}</div>
              <div className="text-xs text-slate-400 leading-relaxed">{t.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
