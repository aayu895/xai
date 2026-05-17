'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Shield, AlertCircle, UserPlus } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const router = useRouter();
  const { register, isLoading } = useAuthStore();
  const [form, setForm] = useState({ email: '', full_name: '', password: '', phone: '', role: 'citizen' });
  const [error, setError] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await register(form);
      toast.success('Account created! Please log in.');
      router.push('/auth/login');
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Registration failed. Please try again.');
    }
  };

  const set = (key: string, val: string) => setForm(f => ({ ...f, [key]: val }));

  return (
    <div className="min-h-screen bg-navy-950 bg-grid flex items-center justify-center px-4 py-12">
      <div className="absolute inset-0 bg-gradient-radial from-purple-500/5 via-transparent to-transparent pointer-events-none" />

      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md glass rounded-2xl p-8 border border-navy-800">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-teal-500/20 border border-teal-500/30 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Shield className="w-6 h-6 text-teal-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">Create Account</h1>
          <p className="text-slate-400 text-sm mt-1">Join XAI-Gov — Transparent AI for All</p>
        </div>

        {error && (
          <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 mb-5 text-red-400 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          {[
            { key: 'full_name', label: 'Full Name',  type: 'text',  placeholder: 'Ravi Kumar' },
            { key: 'email',     label: 'Email',       type: 'email', placeholder: 'you@example.com' },
            { key: 'phone',     label: 'Phone',       type: 'tel',   placeholder: '+91-9876543210' },
            { key: 'password',  label: 'Password',    type: 'password', placeholder: 'Min 8 characters' },
          ].map(f => (
            <div key={f.key}>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">{f.label}</label>
              <input type={f.type} required={f.key !== 'phone'} placeholder={f.placeholder}
                value={(form as any)[f.key]} onChange={e => set(f.key, e.target.value)}
                className="w-full bg-navy-900 border border-navy-700 focus:border-teal-500/50 rounded-lg px-4 py-3 text-white text-sm outline-none transition-colors placeholder:text-slate-600"
              />
            </div>
          ))}

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Account Type</label>
            <select value={form.role} onChange={e => set('role', e.target.value)}
              className="w-full bg-navy-900 border border-navy-700 focus:border-teal-500/50 rounded-lg px-4 py-3 text-white text-sm outline-none transition-colors">
              <option value="citizen">👤 Citizen</option>
              <option value="officer">🏛️ Government Officer</option>
            </select>
          </div>

          <button type="submit" disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 bg-teal-500 hover:bg-teal-400 disabled:opacity-60 text-navy-950 font-semibold py-3 rounded-lg transition-all mt-2">
            {isLoading
              ? <div className="w-4 h-4 border-2 border-navy-950 border-t-transparent rounded-full animate-spin" />
              : <><UserPlus className="w-4 h-4" /> Create Account</>}
          </button>
        </form>

        <p className="text-center text-sm text-slate-500 mt-6">
          Already have an account?{' '}
          <button onClick={() => router.push('/auth/login')} className="text-teal-400 hover:text-teal-300">Sign in</button>
        </p>
      </motion.div>
    </div>
  );
}
