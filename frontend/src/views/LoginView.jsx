import React, { useState } from 'react';
import { 
  Landmark, 
  ShieldCheck, 
  Building2, 
  Scale, 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  ArrowRight,
  CheckCircle2,
  KeyRound
} from 'lucide-react';
import { loginUser, DEMO_CREDENTIALS } from '../services/api';

export default function LoginView({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  async function handleSubmit(e) {
    if (e) e.preventDefault();
    if (!email || !password) {
      setErrorMessage('Please enter both email and password.');
      return;
    }
    setLoading(true);
    setErrorMessage('');
    try {
      const data = await loginUser(email, password);
      if (onLoginSuccess) {
        onLoginSuccess(data.token, data.user);
      }
    } catch (err) {
      setErrorMessage(err.message || 'Login failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  }

  function handleQuickFill(cred) {
    setEmail(cred.email);
    setPassword(cred.password);
    setErrorMessage('');
  }

  return (
    <div className="min-h-screen bg-[#F3F6FA] flex flex-col justify-between font-sans">
      
      {/* Top Tricolor Bar */}
      <div className="h-1.5 w-full flex">
        <div style={{ width: '33.3333%', backgroundColor: '#FF9933' }}></div>
        <div style={{ width: '33.3333%', backgroundColor: '#FFFFFF' }}></div>
        <div style={{ width: '33.3333%', backgroundColor: '#138808' }}></div>
      </div>

      {/* Main Container */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 gap-6 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          
          {/* Left Column: Brand & Welcome info */}
          <div className="lg:col-span-5 bg-[#17365D] text-white p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden">
            {/* Background subtle decoration */}
            <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-blue-500/10 pointer-events-none"></div>
            <div className="absolute -bottom-12 -left-12 w-48 h-48 rounded-full bg-sky-500/10 pointer-events-none"></div>

            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-blue-600/90 border border-blue-400/40 flex items-center justify-center p-2.5 shadow-lg">
                  <Landmark className="w-7 h-7 text-white" />
                </div>
                <div>
                  <div className="text-[10px] font-bold tracking-widest uppercase text-sky-200">
                    Govt. of India • AICTE
                  </div>
                  <h1 className="text-xl font-extrabold tracking-tight text-white">
                    AICTE SecureDeposit
                  </h1>
                </div>
              </div>

              <div className="space-y-4 text-xs text-slate-200 leading-relaxed">
                <div className="bg-white/10 p-3 rounded-lg border border-white/15">
                  <span className="text-[11px] font-bold text-sky-300 block mb-1">
                    Smart India Hackathon 2026
                  </span>
                  Centralized portal for technical institutions to register, verify, and maintain Security Deposit Fixed Deposit Receipts (FDRs) under statutory lien.
                </div>

                <div className="space-y-2 text-slate-300">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Role-based access for Colleges, AICTE Officers & Approvers</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Automated Discrepancy Scrutiny & Bank CBS Verification</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Tamper-evident audit logging and token authorization</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative z-10 pt-6 border-t border-white/10 mt-6 text-[11px] text-slate-300">
              <div className="flex items-center gap-1.5 font-medium text-emerald-300">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Protected by AICTE Security Architecture</span>
              </div>
              <div className="text-slate-400 text-[10px] mt-1">
                Notice: All access attempts are logged for statutory compliance.
              </div>
            </div>
          </div>

          {/* Right Column: Login Form & Quick Demo Pickers */}
          <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between">
            <div>
              <div className="mb-6">
                <h2 className="text-xl font-bold text-slate-900">
                  Account Sign In
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Enter your official credentials or choose a pre-configured demo account below.
                </p>
              </div>

              {errorMessage && (
                <div className="mb-5 p-3 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2.5 text-xs text-red-700 animate-fadeIn">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <div className="font-medium">{errorMessage}</div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Official Email ID
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. officer@demo.aicte.local"
                      required
                      className="w-full pl-9 pr-3 py-2.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#17365D] focus:border-transparent text-slate-900 placeholder-slate-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter account password"
                      required
                      className="w-full pl-9 pr-10 py-2.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#17365D] focus:border-transparent text-slate-900 placeholder-slate-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 bg-[#17365D] hover:bg-[#122b4a] text-white font-semibold text-xs rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
                >
                  {loading ? (
                    <span>Authenticating Server Credentials...</span>
                  ) : (
                    <>
                      <span>Sign In to Secure Portal</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Quick-fill Demo Evaluator Selector */}
              <div className="mt-6 pt-5 border-t border-slate-200">
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-[#3D7199]" />
                    Quick Demo Logins (SIH Evaluator Accounts)
                  </span>
                  <span className="text-[10px] text-slate-400">Click to autofill</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {DEMO_CREDENTIALS.map((cred) => {
                    const isSelected = email.toLowerCase() === cred.email.toLowerCase();
                    const iconColor = cred.role === 'INSTITUTION' ? 'text-blue-600' : (cred.role === 'AICTE_OFFICER' ? 'text-teal-700' : 'text-amber-600');
                    const badgeBg = cred.role === 'INSTITUTION' ? 'bg-blue-50 text-blue-700 border-blue-200' : (cred.role === 'AICTE_OFFICER' ? 'bg-teal-50 text-teal-800 border-teal-200' : 'bg-amber-50 text-amber-800 border-amber-200');

                    return (
                      <button
                        key={cred.role}
                        type="button"
                        onClick={() => handleQuickFill(cred)}
                        className={`text-left p-2.5 rounded-lg border text-xs transition-all ${
                          isSelected 
                            ? 'border-[#17365D] bg-slate-50 shadow-sm' 
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${badgeBg}`}>
                            {cred.role === 'INSTITUTION' ? 'Institution' : (cred.role === 'AICTE_OFFICER' ? 'Officer' : 'Approver')}
                          </span>
                        </div>
                        <div className="font-semibold text-slate-800 text-[11px] truncate">
                          {cred.name}
                        </div>
                        <div className="text-[10px] text-slate-500 truncate font-mono mt-0.5">
                          {cred.email}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate mt-1">
                          Pass: <code className="bg-slate-100 px-1 py-0.2 rounded text-slate-700">{cred.password}</code>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>

            <div className="mt-5 text-[11px] text-slate-400 text-center">
              AICTE Smart India Hackathon 2026 • Security Deposit & FDR Lifecycle System
            </div>
          </div>

        </div>
      </div>

      {/* Footer bar */}
      <footer className="bg-white border-t border-slate-200 py-3 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px]">
          <span>अखिल भारतीय तकनीकी शिक्षा परिषद (AICTE) • Nelson Mandela Marg, Vasant Kunj, New Delhi</span>
          <span>Official Technical Prototype • Government-Tech Design</span>
        </div>
      </footer>

    </div>
  );
}
