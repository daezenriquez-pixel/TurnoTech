import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ThemeToggle } from '../components/ThemeToggle';
import { MonitorSmartphone, Mail, Lock, AlertCircle, Loader2 } from 'lucide-react';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    const result = await login(email, password);
    setSubmitting(false);

    if (result.success) {
      if (result.role === 'super_admin') navigate('/super-admin');
      else if (result.role === 'room_admin') navigate('/admin');
      else navigate('/teacher');
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-institucional-700 to-institucional-900
                    dark:from-institucional-950 dark:to-black flex items-center justify-center p-4 relative">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-turquesa-400/20 blur-3xl" />
      <div className="absolute -bottom-24 -right-16 w-72 h-72 rounded-full bg-institucional-400/20 blur-3xl" />

      <div className="relative max-w-md w-full bg-white dark:bg-institucional-800 rounded-3xl shadow-soft-lg p-8
                      animate-fade-up border border-white/10">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-turquesa-400 to-institucional-500
                          flex items-center justify-center shadow-soft mb-3">
            <MonitorSmartphone className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-xl font-display font-bold text-slate-800 dark:text-white">TurnoTech</h1>
          <p className="text-sm text-slate-500 dark:text-institucional-300 mt-1">
            Reserva de Salas de Cómputo
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2 bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-300
                          p-3 rounded-xl mb-4 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-institucional-100 mb-1.5">
              Correo electrónico
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/10
                          bg-white dark:bg-institucional-900 text-slate-800 dark:text-white
                          focus-visible:ring-2 focus-visible:ring-turquesa-400 transition-shadow"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-institucional-100 mb-1.5">
              Contraseña
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/10
                          bg-white dark:bg-institucional-900 text-slate-800 dark:text-white
                          focus-visible:ring-2 focus-visible:ring-turquesa-400 transition-shadow"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 bg-institucional-600 hover:bg-institucional-700
                      disabled:opacity-60 text-white font-semibold py-2.5 rounded-xl
                      transition-all duration-200 hover:scale-[1.02]"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            Ingresar
          </button>
        </form>
      </div>
    </div>
  );
};
