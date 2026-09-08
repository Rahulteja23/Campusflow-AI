import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Cpu, Eye, EyeOff, Loader2, ArrowRight, Brain } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const DEMO_ACCOUNTS = [
  { label: 'Demo Student', email: 'student@campusflow.demo', password: 'demo123', role: 'student', color: 'teal' },
  { label: 'Demo Officer', email: 'officer@campusflow.demo', password: 'demo123', role: 'officer', color: 'blue' },
  { label: 'Demo Admin', email: 'admin@campusflow.demo', password: 'demo123', role: 'admin', color: 'violet' },
];

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e?: React.FormEvent, demoEmail?: string, demoPass?: string) => {
    e?.preventDefault();
    const loginEmail = demoEmail || email;
    const loginPass = demoPass || password;

    if (!loginEmail || !loginPass) {
      setError('Please enter your credentials');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const user = await login(loginEmail, loginPass);
      if (user.role === 'student') navigate('/student/dashboard');
      else if (user.role === 'officer') navigate('/officer/dashboard');
      else if (user.role === 'admin') navigate('/admin/dashboard');
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loginAsDemo = async (acc: typeof DEMO_ACCOUNTS[0]) => {
    setEmail(acc.email);
    setPassword(acc.password);
    await handleLogin(undefined, acc.email, acc.password);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left: Branding */}
      <div className="hidden lg:flex flex-col w-[480px] flex-shrink-0 gradient-navy p-12 relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/10 rounded-full translate-y-1/2 -translate-x-1/2" />

        {/* Logo */}
        <div className="flex items-center gap-3 relative z-10">
          <div className="w-10 h-10 rounded-xl bg-teal-500 flex items-center justify-center">
            <Cpu className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-white font-bold text-lg leading-none">CampusFlow AI</h1>
            <p className="text-teal-400 text-xs mt-0.5">Intelligent Student Service Orchestration</p>
          </div>
        </div>

        {/* Hero text */}
        <div className="mt-16 relative z-10">
          <h2 className="text-3xl font-bold text-white leading-tight">
            From Student Request<br />to Resolution —<br />
            <span className="text-teal-400">Intelligently.</span>
          </h2>
          <p className="text-slate-400 mt-4 text-sm leading-relaxed">
            One intelligent service layer for transparent, automated and auditable university operations.
          </p>
        </div>

        {/* Workflow steps */}
        <div className="mt-12 space-y-3 relative z-10">
          {[
            { step: '01', label: 'Natural Language Request', desc: 'Students describe their need in plain English' },
            { step: '02', label: 'AI Understanding', desc: 'Gemini AI classifies intent, priority, urgency' },
            { step: '03', label: 'Automatic Routing', desc: 'Smart department assignment, no manual work' },
            { step: '04', label: 'SLA Monitoring', desc: 'Real-time countdown, auto-escalation' },
            { step: '05', label: 'Resolution & Analytics', desc: 'Full audit trail, admin insights' },
          ].map(({ step, label, desc }) => (
            <div key={step} className="flex items-start gap-3">
              <span className="text-teal-400 font-mono text-xs font-bold mt-0.5 flex-shrink-0">{step}</span>
              <div>
                <p className="text-white text-xs font-semibold">{label}</p>
                <p className="text-slate-400 text-[11px]">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* AI badge */}
        <div className="mt-auto relative z-10">
          <div className="flex items-center gap-2 glass rounded-lg px-3 py-2 w-fit">
            <Brain className="w-4 h-4 text-teal-400" />
            <span className="text-xs text-slate-300">Powered by Gemini AI + NewgenONE Workflow</span>
          </div>
        </div>
      </div>

      {/* Right: Login form */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-50">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center">
              <Cpu className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-slate-800">CampusFlow AI</span>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900">Welcome back</h2>
            <p className="text-slate-500 mt-1 text-sm">Sign in to your CampusFlow account</p>
          </div>

          {/* Demo buttons */}
          <div className="grid grid-cols-3 gap-2 mb-6">
            {DEMO_ACCOUNTS.map((acc) => (
              <button
                key={acc.email}
                onClick={() => loginAsDemo(acc)}
                disabled={loading}
                className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-all disabled:opacity-50
                  ${acc.color === 'teal' ? 'border-teal-200 bg-teal-50 text-teal-700 hover:bg-teal-100' :
                    acc.color === 'blue' ? 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100' :
                    'border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100'}`}
              >
                {acc.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-xs text-slate-400">or sign in manually</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Student / Employee ID or Email
              </label>
              <input
                id="login-email"
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="cf-input"
                placeholder="student@campusflow.demo"
                autoComplete="username"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="cf-input pr-10"
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              id="login-submit"
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-xs text-slate-400 mt-6">
            Demo credentials: <span className="font-mono">demo123</span> for all accounts
          </p>
        </div>
      </div>
    </div>
  );
}
