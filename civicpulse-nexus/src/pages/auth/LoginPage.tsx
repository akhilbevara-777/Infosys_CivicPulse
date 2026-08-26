import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, Mail, Lock, Building2, Zap } from 'lucide-react';
import toast from 'react-hot-toast';
import { authService } from '../../services/authService';
import { useAuthStore } from '../../store/authStore';
import { Input } from '../../components/ui/Input';
import { clsx } from 'clsx';

interface FormData {
  email: string;
  password: string;
}

const QUICK_LOGINS = [
  { label: 'Citizen',       email: 'citizen@civicpulse.gov',      password: 'citizen123',  color: 'teal' },
  { label: 'Admin',         email: 'admin@civicpulse.gov',        password: 'admin123',    color: 'violet' },
  { label: 'Commissioner',  email: 'commissioner@civicpulse.gov', password: 'comm123',     color: 'amber' },
  { label: 'Officer',       email: 'officer@civicpulse.gov',      password: 'officer123',  color: 'blue' },
];

export default function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormData>();

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const user = await authService.login(data);
      login(user);
      toast.success(`Welcome back, ${user.name.split(' ')[0]}!`);
      navigate(user.role === 'citizen' ? '/citizen/dashboard' : '/admin/dashboard');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = (email: string, password: string) => {
    setValue('email', email);
    setValue('password', password);
  };

  return (
    <div className="min-h-screen flex bg-slate-950 overflow-hidden">
      {/* Left panel */}
      <div className="hidden lg:flex w-1/2 relative flex-col justify-between p-12 overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-teal-900/40 via-slate-900 to-violet-900/40" />
        <div className="absolute top-20 left-20 w-72 h-72 bg-teal-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl" />

        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: 'linear-gradient(rgba(20,184,166,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(20,184,166,0.5) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />

        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-teal-500/20 rounded-xl ring-1 ring-teal-500/30">
              <Building2 className="w-7 h-7 text-teal-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">CivicPulse Nexus</h1>
              <p className="text-xs text-slate-400">Smart Governance Platform</p>
            </div>
          </div>
        </div>

        <div className="relative z-10 space-y-6">
          <div>
            <h2 className="text-4xl font-bold text-white leading-tight">
              Empowering citizens.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-violet-400">
                Modernizing governance.
              </span>
            </h2>
            <p className="mt-4 text-slate-400 text-base leading-relaxed">
              A unified platform connecting 2.4M citizens with municipal services,
              grievance redressal, and transparent governance.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { label: '2.4M', sub: 'Citizens Served' },
              { label: '94%',  sub: 'Resolution Rate' },
              { label: '847K', sub: 'Certs Issued/yr' },
              { label: '4.7★', sub: 'Citizen Rating' },
            ].map((s) => (
              <div key={s.label} className="glass rounded-xl p-3 text-center">
                <div className="text-2xl font-bold text-teal-400">{s.label}</div>
                <div className="text-xs text-slate-400 mt-0.5">{s.sub}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 text-xs text-slate-500">
          © 2026 CivicPulse Nexus · Government Digital Initiative
        </div>
      </div>

      {/* Right panel – login form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6">
        <div className="w-full max-w-md space-y-6 animate-fade-in">
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-2 justify-center mb-2">
            <Building2 className="w-6 h-6 text-teal-400" />
            <span className="text-lg font-bold text-white">CivicPulse Nexus</span>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-white">Sign in</h2>
            <p className="text-slate-400 text-sm mt-1">Enter your credentials to access the platform</p>
          </div>

          {/* Quick login chips */}
          <div>
            <p className="text-xs text-slate-500 mb-2 flex items-center gap-1.5">
              <Zap className="w-3 h-3" /> Quick demo access
            </p>
            <div className="flex flex-wrap gap-2">
              {QUICK_LOGINS.map((q) => (
                <button
                  key={q.label}
                  onClick={() => quickLogin(q.email, q.password)}
                  className={clsx(
                    'text-xs px-3 py-1.5 rounded-lg border transition-all',
                    q.color === 'teal'   && 'border-teal-500/30 text-teal-400 hover:bg-teal-500/10',
                    q.color === 'violet' && 'border-violet-500/30 text-violet-400 hover:bg-violet-500/10',
                    q.color === 'amber'  && 'border-amber-500/30 text-amber-400 hover:bg-amber-500/10',
                    q.color === 'blue'   && 'border-blue-500/30 text-blue-400 hover:bg-blue-500/10',
                  )}
                >
                  {q.label}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              icon={Mail}
              placeholder="your@email.gov"
              error={errors.email?.message}
              {...register('email', {
                required: 'Email is required',
                pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Invalid email' },
              })}
            />

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-300">
                Password <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type={showPwd ? 'text' : 'password'}
                  placeholder="••••••••"
                  className={clsx(
                    'w-full bg-slate-800/60 border rounded-xl pl-9 pr-10 py-2.5 text-sm text-white placeholder-slate-500',
                    'focus:outline-none focus:ring-2 transition-all duration-200',
                    errors.password
                      ? 'border-red-500/50 focus:ring-red-500/30'
                      : 'border-white/10 focus:ring-teal-500/30 focus:border-teal-500/50'
                  )}
                  {...register('password', { required: 'Password is required', minLength: { value: 6, message: 'Min 6 characters' } })}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                >
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-400">{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-teal-500/20 hover:shadow-teal-500/30 hover:-translate-y-0.5"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Signing in…
                </span>
              ) : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-sm text-slate-400">
            New citizen?{' '}
            <Link to="/signup" className="text-teal-400 hover:text-teal-300 font-medium transition-colors">
              Create an account
            </Link>
          </p>

          <div className="glass rounded-xl p-3 text-xs text-slate-500 text-center">
            🔒 Secured by Keycloak IAM · All data encrypted in transit
          </div>
        </div>
      </div>
    </div>
  );
}
