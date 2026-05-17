'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Shield, Eye, EyeOff, LogIn, AlertCircle } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';

const DEMO_ACCOUNTS = [
  { label: '👤 Citizen',  email: 'ravi.kumar@example.com',  pw: 'Citizen@123',  role: 'citizen' },
  { label: '🏛️ Officer',  email: 'officer.sharma@gov.in',   pw: 'Officer@123',  role: 'officer' },
  { label: '⚙️ Admin',    email: 'admin@xaigov.in',          pw: 'Admin@123',    role: 'admin' },
];

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading } = useAuthStore();
  const [email, setEmail]     = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]   = useState(false);
  const [error, setError]     = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
      const user = JSON.parse(document.cookie.match(/user=([^;]+)/)?.[1] || '{}');
      const routes: Record<string, string> = { citizen: '/dashboard/citizen', officer: '/dashboard/officer', admin: '/dashboard/admin' };
      toast.success(`Welcome back!`);
      router.push(routes[user?.role] || '/dashboard/citizen');
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Invalid email or password');
    }
  };

  const fillDemo = (acc: typeof DEMO_ACCOUNTS[0]) => {
    setEmail(acc.email);
    setPassword(acc.pw);
    setError('');
  };

  return (
    <div className="min-h-screen bg-navy-950 bg-grid flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-gradient-radial from-teal-500/5 via-transparent to-transparent pointer-events-none" />

      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md glass rounded-2xl p-8 border border-navy-800">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-teal-500/20 border border-teal-500/30 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Shield className="w-6 h-6 text-teal-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">XAI<span className="text-teal-400">-Gov</span></h1>
          <p className="text-slate-400 text-sm mt-1">Sign in to your account</p>
        </div>

        {/* Demo buttons */}
        <div className="mb-6">
          <p className="text-xs text-slate-500 text-center mb-3">Quick demo access</p>
          <div className="grid grid-cols-3 gap-2">
            {DEMO_ACCOUNTS.map((acc) => (
              <button key={acc.role} onClick={() => fillDemo(acc)}
                className="glass-light text-xs py-2 px-3 rounded-lg border border-navy-700 hover:border-teal-500/30 text-slate-300 hover:text-white transition-all text-center">
                {acc.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-px bg-navy-800" />
          <span className="text-xs text-slate-500">or sign in manually</span>
          <div className="flex-1 h-px bg-navy-800" />
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 mb-5 text-red-400 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Email address</label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)} required
              className="w-full bg-navy-900 border border-navy-700 focus:border-teal-500/50 rounded-lg px-4 py-3 text-white text-sm outline-none transition-colors placeholder:text-slate-600"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Password</label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'} value={password}
                onChange={e => setPassword(e.target.value)} required
                className="w-full bg-navy-900 border border-navy-700 focus:border-teal-500/50 rounded-lg px-4 py-3 pr-11 text-white text-sm outline-none transition-colors placeholder:text-slate-600"
                placeholder="••••••••"
              />
              <button type="button" onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 bg-teal-500 hover:bg-teal-400 disabled:opacity-60 text-navy-950 font-semibold py-3 rounded-lg transition-all mt-2">
            {isLoading ? <div className="w-4 h-4 border-2 border-navy-950 border-t-transparent rounded-full animate-spin" />
              : <><LogIn className="w-4 h-4" /> Sign In</>}
          </button>
        </form>

        <p className="text-center text-sm text-slate-500 mt-6">
          Don't have an account?{' '}
          <button onClick={() => router.push('/auth/register')} className="text-teal-400 hover:text-teal-300">
            Register
          </button>
        </p>
        <p className="text-center text-xs text-slate-600 mt-4">
          <button onClick={() => router.push('/landing')} className="hover:text-slate-400 transition-colors">
            ← Back to Home
          </button>
        </p>
      </motion.div>
    </div>
  );
}
