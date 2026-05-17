'use client';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';

interface ShapChartProps {
  shapValues: Record<string, number>;
  title?: string;
}

const FEATURE_LABELS: Record<string, string> = {
  income:            'Annual Income',
  family_size:       'Family Size',
  education_level:   'Education',
  health_status:     'Health Status',
  region_code:       'Region Type',
  employment_status: 'Employment',
  age:               'Age',
  disability_status: 'Disability',
};

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const v = payload[0].value;
  return (
    <div className="glass border border-navy-700 rounded-lg px-3 py-2 text-sm">
      <div className="text-white font-medium">{payload[0].payload.feature}</div>
      <div className={`font-bold ${v >= 0 ? 'text-green-400' : 'text-red-400'}`}>
        Impact: {v >= 0 ? '+' : ''}{v.toFixed(4)}
      </div>
      <div className="text-slate-400 text-xs">{v >= 0 ? 'Favours approval' : 'Against approval'}</div>
    </div>
  );
};

export default function ShapChart({ shapValues, title = 'SHAP Feature Impact' }: ShapChartProps) {
  const data = Object.entries(shapValues)
    .map(([key, value]) => ({ key, feature: FEATURE_LABELS[key] || key, value }))
    .sort((a, b) => Math.abs(b.value) - Math.abs(a.value));

  return (
    <div className="glass rounded-xl p-5 border border-navy-800">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-white">{title}</h3>
        <div className="flex items-center gap-4 text-xs">
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-green-500 inline-block" /> Positive impact</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-red-500 inline-block" /> Negative impact</span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} layout="vertical" margin={{ left: 20, right: 40, top: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1A3A6E" horizontal={false} />
          <XAxis type="number" domain={['auto', 'auto']} tick={{ fill: '#94A3B8', fontSize: 11 }} tickLine={false} axisLine={false} />
          <YAxis type="category" dataKey="feature" tick={{ fill: '#94A3B8', fontSize: 11 }} tickLine={false} axisLine={false} width={100} />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine x={0} stroke="#1A3A6E" strokeWidth={2} />
          <Bar dataKey="value" radius={[0, 4, 4, 0]}>
            {data.map((entry) => (
              <Cell key={entry.key} fill={entry.value >= 0 ? '#10B981' : '#EF4444'} fillOpacity={0.8} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
