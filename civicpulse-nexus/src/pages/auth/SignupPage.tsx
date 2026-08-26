import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, Mail, Lock, User, Phone, MapPin, CreditCard, Building2, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { authService, type SignupData } from '../../services/authService';
import { useAuthStore } from '../../store/authStore';
import { Input, Select } from '../../components/ui/Input';
import { clsx } from 'clsx';

const WARD_OPTIONS = [
  { value: '', label: 'Select Ward' },
  ...Array.from({ length: 20 }, (_, i) => ({ value: `Ward ${i + 1}`, label: `Ward ${i + 1}` })),
];

const STEPS = ['Personal Info', 'Contact & Address', 'Verification'];

export default function SignupPage() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const [step, setStep] = useState(0);
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    register, handleSubmit, watch, trigger, formState: { errors },
  } = useForm<SignupData & { confirmPassword: string }>();

  const pwd = watch('password');

  const nextStep = async () => {
    const fields: (keyof (SignupData & { confirmPassword: string }))[][] = [
      ['name', 'email', 'password', 'confirmPassword'],
      ['phone', 'ward', 'address'],
      ['aadhaar'],
    ];
    const valid = await trigger(fields[step]);
    if (valid) setStep((s) => Math.min(s + 1, 2));
  };

  const onSubmit = async (data: SignupData & { confirmPassword: string }) => {
    setLoading(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { confirmPassword: _, ...signupData } = data;
      const user = await authService.signup(signupData);
      login(user);
      toast.success('Account created! Welcome to CivicPulse.');
      navigate('/citizen/dashboard');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-950 overflow-hidden">
      {/* Left panel */}
      <div className="hidden lg:flex w-2/5 relative flex-col justify-between p-12 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-900/40 via-slate-900 to-teal-900/40" />
        <div className="absolute top-10 right-10 w-80 h-80 bg-violet-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-10 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl" />
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: 'linear-gradient(rgba(139,92,246,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.5) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />

        <div className="relative z-10 flex items-center gap-3">
          <div className="p-2.5 bg-violet-500/20 rounded-xl ring-1 ring-violet-500/30">
            <Building2 className="w-7 h-7 text-violet-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">CivicPulse Nexus</h1>
            <p className="text-xs text-slate-400">Citizen Portal</p>
          </div>
        </div>

        <div className="relative z-10 space-y-6">
          <h2 className="text-3xl font-bold text-white leading-tight">
            Your government,
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-teal-400">
              at your fingertips.
            </span>
          </h2>

          <div className="space-y-3">
            {[
              { icon: '🏛️', title: 'Apply for Certificates', desc: 'Birth, Income, Residence & more' },
              { icon: '📋', title: 'File Grievances', desc: 'Track complaints in real time' },
              { icon: '🎫', title: 'Get Permits & Licenses', desc: 'Trade, Building, Events & more' },
              { icon: '📊', title: 'Track Applications', desc: 'Live status & notifications' },
            ].map((item) => (
              <div key={item.title} className="flex items-start gap-3 glass rounded-xl p-3">
                <span className="text-xl">{item.icon}</span>
                <div>
                  <p className="text-sm font-medium text-white">{item.title}</p>
                  <p className="text-xs text-slate-400">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-xs text-slate-500">
          © 2026 CivicPulse Nexus · Government Digital Initiative
        </p>
      </div>

      {/* Right panel – signup form */}
      <div className="w-full lg:w-3/5 flex items-center justify-center p-6">
        <div className="w-full max-w-lg animate-fade-in">
          {/* Progress */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              {STEPS.map((s, i) => (
                <div key={s} className="flex items-center gap-2">
                  <div className={clsx(
                    'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all',
                    i < step  ? 'bg-teal-500 text-white' :
                    i === step ? 'bg-violet-500 text-white ring-2 ring-violet-500/30' :
                                 'bg-slate-800 text-slate-400 border border-white/10'
                  )}>
                    {i < step ? <CheckCircle className="w-4 h-4" /> : i + 1}
                  </div>
                  <span className={clsx(
                    'text-xs font-medium hidden sm:block',
                    i === step ? 'text-white' : 'text-slate-500'
                  )}>{s}</span>
                  {i < STEPS.length - 1 && (
                    <div className={clsx('flex-1 h-0.5 w-8 mx-1', i < step ? 'bg-teal-500' : 'bg-slate-700')} />
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="glass rounded-2xl p-6 space-y-5">
            <div>
              <h2 className="text-xl font-bold text-white">
                {step === 0 ? 'Create your account' : step === 1 ? 'Contact details' : 'Identity verification'}
              </h2>
              <p className="text-slate-400 text-sm mt-0.5">Step {step + 1} of {STEPS.length}</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)}>
              {step === 0 && (
                <div className="space-y-4">
                  <Input
                    label="Full Name"
                    icon={User}
                    placeholder="As per Aadhaar card"
                    error={errors.name?.message}
                    required
                    {...register('name', { required: 'Full name is required', minLength: { value: 2, message: 'Too short' } })}
                  />
                  <Input
                    label="Email Address"
                    type="email"
                    icon={Mail}
                    placeholder="your@email.com"
                    error={errors.email?.message}
                    required
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
                        placeholder="Min 8 characters"
                        className={clsx(
                          'w-full bg-slate-800/60 border rounded-xl pl-9 pr-10 py-2.5 text-sm text-white placeholder-slate-500',
                          'focus:outline-none focus:ring-2 transition-all',
                          errors.password ? 'border-red-500/50 focus:ring-red-500/30' : 'border-white/10 focus:ring-teal-500/30 focus:border-teal-500/50'
                        )}
                        {...register('password', { required: 'Password is required', minLength: { value: 8, message: 'Min 8 characters' } })}
                      />
                      <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200">
                        {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {errors.password && <p className="text-xs text-red-400">{errors.password.message}</p>}
                  </div>
                  <Input
                    label="Confirm Password"
                    type={showPwd ? 'text' : 'password'}
                    icon={Lock}
                    placeholder="Re-enter password"
                    error={errors.confirmPassword?.message}
                    required
                    {...register('confirmPassword', {
                      required: 'Please confirm password',
                      validate: (v) => v === pwd || 'Passwords do not match',
                    })}
                  />
                </div>
              )}

              {step === 1 && (
                <div className="space-y-4">
                  <Input
                    label="Phone Number"
                    type="tel"
                    icon={Phone}
                    placeholder="10-digit mobile number"
                    error={errors.phone?.message}
                    required
                    {...register('phone', {
                      required: 'Phone is required',
                      pattern: { value: /^[6-9]\d{9}$/, message: 'Invalid mobile number' },
                    })}
                  />
                  <Select
                    label="Ward"
                    options={WARD_OPTIONS}
                    error={errors.ward?.message}
                    required
                    {...register('ward', { required: 'Ward selection is required' })}
                  />
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-slate-300">
                      Address <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
                      <textarea
                        rows={3}
                        placeholder="Full residential address"
                        className={clsx(
                          'w-full bg-slate-800/60 border rounded-xl pl-9 pr-3 py-2.5 text-sm text-white placeholder-slate-500 resize-none',
                          'focus:outline-none focus:ring-2 transition-all',
                          errors.address ? 'border-red-500/50 focus:ring-red-500/30' : 'border-white/10 focus:ring-teal-500/30 focus:border-teal-500/50'
                        )}
                        {...register('address', { required: 'Address is required', minLength: { value: 10, message: 'Please enter full address' } })}
                      />
                    </div>
                    {errors.address && <p className="text-xs text-red-400">{errors.address.message}</p>}
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <div className="glass rounded-xl p-4 border border-amber-500/20">
                    <p className="text-sm text-amber-300 font-medium flex items-center gap-2">
                      🔐 Identity Verification
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Your Aadhaar is encrypted and stored securely. Required for KYC compliance.
                    </p>
                  </div>
                  <Input
                    label="Aadhaar Number"
                    icon={CreditCard}
                    placeholder="XXXX-XXXX-XXXX"
                    hint="12-digit Aadhaar number (will be masked)"
                    error={errors.aadhaar?.message}
                    required
                    {...register('aadhaar', {
                      required: 'Aadhaar number is required',
                      pattern: { value: /^\d{4}-?\d{4}-?\d{4}$/, message: 'Invalid Aadhaar format (XXXX-XXXX-XXXX)' },
                    })}
                  />
                  <div className="glass rounded-xl p-3 space-y-2">
                    <p className="text-xs text-slate-400 font-medium">By creating an account, you agree to:</p>
                    {['Terms of Service & Privacy Policy', 'Electronic document verification', 'Government data sharing as required by law'].map((t) => (
                      <div key={t} className="flex items-center gap-2 text-xs text-slate-400">
                        <CheckCircle className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                        {t}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3 mt-6">
                {step > 0 && (
                  <button
                    type="button"
                    onClick={() => setStep((s) => s - 1)}
                    className="flex-1 py-2.5 border border-white/10 text-slate-300 rounded-xl hover:bg-white/5 transition-all text-sm font-medium"
                  >
                    Back
                  </button>
                )}
                {step < 2 ? (
                  <button
                    type="button"
                    onClick={nextStep}
                    className="flex-1 py-2.5 bg-gradient-to-r from-violet-600 to-violet-500 hover:from-violet-500 hover:to-violet-400 text-white rounded-xl transition-all text-sm font-semibold shadow-lg shadow-violet-500/20"
                  >
                    Continue
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-2.5 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 disabled:opacity-50 text-white rounded-xl transition-all text-sm font-semibold shadow-lg shadow-teal-500/20"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Creating account…
                      </span>
                    ) : 'Create Account'}
                  </button>
                )}
              </div>
            </form>

            <p className="text-center text-sm text-slate-400">
              Already registered?{' '}
              <Link to="/login" className="text-teal-400 hover:text-teal-300 font-medium transition-colors">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
