'use client';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  Shield, Eye, BarChart3, Users, Lock, Brain,
  ChevronRight, ArrowRight, Zap, Globe, CheckCircle,
  FileText, AlertTriangle, TrendingUp
} from 'lucide-react';

const PARTICLES = Array.from({ length: 20 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 100,
  size: Math.random() * 4 + 2,
  delay: Math.random() * 5,
  duration: Math.random() * 4 + 4,
}));

const FEATURES = [
  { icon: Brain,      title: 'SHAP + LIME XAI',      desc: 'Every AI decision comes with full SHAP and LIME explanations — visualized for any citizen to understand.',        color: 'text-teal-400',   bg: 'bg-teal-500/10',   border: 'border-teal-500/20' },
  { icon: Shield,     title: 'Bias Detection',        desc: 'Real-time fairness metrics detect and flag potential bias across demographics, regions, and socioeconomic groups.',  color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
  { icon: Eye,        title: 'Full Audit Trail',      desc: 'Immutable, timestamped logs track every decision, review, and override — creating an accountable governance trail.', color: 'text-gold-400',   bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' },
  { icon: Users,      title: '3-Role Access',         desc: 'Separate portals for Citizens, Government Officers, and Administrators with role-based access control.',            color: 'text-green-400',  bg: 'bg-green-500/10',  border: 'border-green-500/20' },
  { icon: BarChart3,  title: 'Real-Time Analytics',  desc: 'Live dashboards show approval rates, confidence distributions, fairness heatmaps, and trend analysis.',           color: 'text-blue-400',   bg: 'bg-blue-500/10',   border: 'border-blue-500/20' },
  { icon: FileText,   title: 'PDF Reports',           desc: 'Citizens can download a full Transparency Report for every AI decision — readable and legally documented.',       color: 'text-red-400',    bg: 'bg-red-500/10',    border: 'border-red-500/20' },
];

const STATS = [
  { value: '92%',  label: 'Model Accuracy',       icon: TrendingUp },
  { value: '100%', label: 'Decisions Explained',  icon: Eye },
  { value: '<2s',  label: 'AI Response Time',     icon: Zap },
  { value: '5+',   label: 'Gov Domains Covered',  icon: Globe },
];

const USE_CASES = [
  { title: 'Welfare Eligibility',      desc: 'Income, family size, employment — AI explains each factor in plain language.',      tag: 'LIVE' },
  { title: 'Scholarship Approvals',    desc: 'Merit and need-based scoring with full SHAP factor breakdown for students.',         tag: 'LIVE' },
  { title: 'Healthcare Prioritization',desc: 'Age, disability, health status weighted fairly with bias detection built-in.',       tag: 'LIVE' },
  { title: 'Subsidy Distribution',     desc: 'Region and income-based targeting with transparent allocation explanations.',        tag: 'LIVE' },
  { title: 'Citizen Grievances',       desc: 'Intelligent routing and priority scoring with explainable decision rationale.',      tag: 'BETA' },
  { title: 'Public Service Recs',     desc: 'Personalized service recommendations based on citizen profile and eligibility.',     tag: 'BETA' },
];

export default function LandingPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-navy-950 overflow-hidden">
      {/* Background grid */}
      <div className="fixed inset-0 bg-grid pointer-events-none" />

      {/* Particles */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {PARTICLES.map((p) => (
          <motion.div
            key={p.id}
            className="absolute rounded-full bg-teal-500/20"
            style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size }}
            animate={{ y: [0, -20, 0], opacity: [0.2, 0.5, 0.2] }}
            transition={{ duration: p.duration, delay: p.delay, repeat: Infinity }}
          />
        ))}
      </div>

      {/* Navbar */}
      <nav className="fixed top-0 inset-x-0 z-50 glass border-b border-navy-800">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-teal-500/20 border border-teal-500/30 flex items-center justify-center">
              <Shield className="w-4 h-4 text-teal-400" />
            </div>
            <span className="font-bold text-lg tracking-tight">XAI<span className="text-teal-400">-Gov</span></span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-slate-400">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#usecases" className="hover:text-white transition-colors">Use Cases</a>
            <a href="#how"      className="hover:text-white transition-colors">How It Works</a>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/auth/login')}
              className="text-sm text-slate-300 hover:text-white transition-colors px-4 py-2">
              Login
            </button>
            <button onClick={() => router.push('/auth/register')}
              className="text-sm bg-teal-500 hover:bg-teal-400 text-navy-950 font-semibold px-4 py-2 rounded-lg transition-colors">
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            {/* Badge */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="inline-flex items-center gap-2 glass border border-teal-500/20 rounded-full px-4 py-2 mb-8">
              <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
              <span className="text-sm text-teal-300 font-medium">AI Governance Platform — Now Live</span>
            </motion.div>

            {/* Headline */}
            <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="text-5xl md:text-7xl font-extrabold tracking-tight leading-tight mb-6">
              Government AI That's
              <br />
              <span className="gradient-text">Actually Explainable</span>
            </motion.h1>

            <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className="text-lg md:text-xl text-slate-400 max-w-3xl mx-auto mb-10 leading-relaxed">
              XAI-Gov makes every AI decision in welfare, healthcare, and public services{' '}
              <strong className="text-white">transparent, explainable, and auditable</strong> — so citizens
              understand why, officers can review, and government stays accountable.
            </motion.p>

            {/* CTAs */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              <button onClick={() => router.push('/auth/register')}
                className="flex items-center gap-2 bg-teal-500 hover:bg-teal-400 text-navy-950 font-bold px-8 py-4 rounded-xl transition-all glow-teal text-base">
                Start for Free <ArrowRight className="w-4 h-4" />
              </button>
              <button onClick={() => router.push('/auth/login')}
                className="flex items-center gap-2 glass border border-navy-700 hover:border-teal-500/30 text-white px-8 py-4 rounded-xl transition-all text-base">
                View Demo <ChevronRight className="w-4 h-4" />
              </button>
            </motion.div>

            {/* Stats bar */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
              {STATS.map((stat) => (
                <div key={stat.label} className="glass rounded-xl p-4 text-center card-hover">
                  <stat.icon className="w-5 h-5 text-teal-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-white">{stat.value}</div>
                  <div className="text-xs text-slate-400 mt-1">{stat.label}</div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>

        {/* Radial glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
              className="text-teal-400 text-sm font-semibold tracking-widest uppercase mb-3">Platform Features</motion.div>
            <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              className="text-4xl font-bold text-white mb-4">Everything Governance AI Needs</motion.h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              Built for transparency by design — every feature exists to make AI accountable to the people it serves.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f, i) => (
              <motion.div key={f.title}
                initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }} viewport={{ once: true }}
                className={`glass rounded-2xl p-6 border ${f.border} card-hover`}>
                <div className={`w-10 h-10 ${f.bg} rounded-xl flex items-center justify-center mb-4`}>
                  <f.icon className={`w-5 h-5 ${f.color}`} />
                </div>
                <h3 className="font-semibold text-white mb-2">{f.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section id="usecases" className="py-20 px-6 bg-navy-900/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <div className="text-yellow-400 text-sm font-semibold tracking-widest uppercase mb-3">Government Domains</div>
            <h2 className="text-4xl font-bold text-white mb-4">Built for Real Gov Use Cases</h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              From welfare to healthcare — XAI-Gov brings transparency to every citizen-facing AI decision.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {USE_CASES.map((uc, i) => (
              <motion.div key={uc.title}
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }} viewport={{ once: true }}
                className="glass rounded-xl p-5 border border-navy-800 card-hover group">
                <div className="flex items-start justify-between mb-3">
                  <CheckCircle className="w-5 h-5 text-teal-400 mt-0.5" />
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${uc.tag === 'LIVE' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                    {uc.tag}
                  </span>
                </div>
                <h3 className="font-semibold text-white mb-2 group-hover:text-teal-400 transition-colors">{uc.title}</h3>
                <p className="text-sm text-slate-400">{uc.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how" className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <div className="text-purple-400 text-sm font-semibold tracking-widest uppercase mb-3">The Pipeline</div>
            <h2 className="text-4xl font-bold text-white mb-4">How XAI-Gov Works</h2>
          </div>
          <div className="flex flex-col gap-0">
            {[
              { step: '01', title: 'Citizen Submits Application',   desc: 'Citizen fills out an application form with relevant details — income, health, employment, family size.', color: 'bg-teal-500' },
              { step: '02', title: 'AI Engine Processes & Explains', desc: 'XGBoost model predicts outcome. SHAP + LIME generate full feature-level explanations in real time.',     color: 'bg-purple-500' },
              { step: '03', title: 'Officer Reviews Decision',       desc: 'Government officer reviews the AI output, explanation report, and can override with documented reason.',    color: 'bg-yellow-500' },
              { step: '04', title: 'Citizen Gets Full Transparency', desc: 'Citizen sees the decision, explanation, confidence score, and can download a PDF Transparency Report.',    color: 'bg-green-500' },
            ].map((s, i) => (
              <div key={s.step} className="flex gap-6 relative">
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 ${s.color} rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 z-10`}>
                    {s.step}
                  </div>
                  {i < 3 && <div className="w-0.5 h-12 bg-navy-700 mt-1" />}
                </div>
                <div className="pb-8 pt-1">
                  <h3 className="font-semibold text-white mb-1">{s.title}</h3>
                  <p className="text-sm text-slate-400">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="glass rounded-3xl p-12 border border-teal-500/20 relative overflow-hidden">
            <div className="absolute inset-0 bg-teal-500/5 rounded-3xl" />
            <div className="relative">
              <h2 className="text-4xl font-bold text-white mb-4">
                Ready to Make AI <span className="gradient-text">Accountable</span>?
              </h2>
              <p className="text-slate-400 mb-8 text-lg">
                Join the mission to bring transparency to government AI — one explainable decision at a time.
              </p>
              <button onClick={() => router.push('/auth/register')}
                className="inline-flex items-center gap-2 bg-teal-500 hover:bg-teal-400 text-navy-950 font-bold px-10 py-4 rounded-xl text-lg transition-all glow-teal">
                Get Started Free <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-navy-800 py-8 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-teal-400" />
            <span className="font-bold text-sm">XAI<span className="text-teal-400">-Gov</span></span>
            <span className="text-slate-500 text-sm">© 2024</span>
          </div>
          <p className="text-slate-500 text-sm">Transparent AI for Accountable Governance — REVA University SCIT</p>
        </div>
      </footer>
    </div>
  );
}
