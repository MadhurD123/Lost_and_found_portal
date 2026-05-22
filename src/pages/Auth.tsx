import React, { useState } from 'react';
import { User } from '../types';
import { Shield, Sparkles, UserPlus, Lock, GraduationCap, Mail, UserCheck } from 'lucide-react';

interface AuthProps {
  onLoginSuccess: (user: User, token: string) => void;
  navigate: (page: string) => void;
}

export default function Auth({ onLoginSuccess, navigate }: AuthProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  
  // Login State
  const [loginUser, setLoginUser] = useState('');
  const [loginPass, setLoginPass] = useState('');
  
  // Signup State
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [department, setDepartment] = useState('');
  const [studentId, setStudentId] = useState('');

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginUser || !loginPass) {
      setError('Please supply both username and password.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: loginUser, password: loginPass })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Login credentials failed verification.');
      }

      onLoginSuccess(data.user, data.token);
      navigate('home');
    } catch (err: any) {
      setError(err.message || 'Network lookup error.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !email || !password) {
      setError('Username, email address, and secure password are required.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          email,
          password,
          department,
          studentId
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Registry signup failed.');
      }

      setSuccess('Account created successfully on campus database!');
      setTimeout(() => {
        onLoginSuccess(data.user, data.token);
        navigate('home');
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'Db registration anomaly.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-8">
      <div 
        id="auth-container-card"
        className="w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl transition-all"
      >
        {/* Banner header slide */}
        <div className="bg-indigo-600 px-6 py-8 text-center text-white relative">
          <div className="absolute inset-0 bg-gradient-to-tr from-indigo-700 to-indigo-500 opacity-90" />
          <div className="relative space-y-2">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white border border-white/10">
              <Shield className="h-5 w-5" />
            </div>
            <h2 className="text-xl font-bold tracking-tight">University Portal</h2>
            <p className="text-xs text-indigo-150">Enter credentials to authenticate student status</p>
          </div>
        </div>

        {/* Sliding Tabs */}
        <div className="flex border-b border-slate-100" id="auth-sliding-tabs">
          <button
            onClick={() => {
              setIsSignUp(false);
              setError('');
            }}
            id="auth-tab-login"
            className={`flex-1 py-4 text-center text-xs font-bold uppercase tracking-wider transition-colors border-b-2 ${
              !isSignUp 
                ? 'border-indigo-600 text-indigo-600 bg-indigo-50/10' 
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Sign In (Login)
          </button>
          <button
            onClick={() => {
              setIsSignUp(true);
              setError('');
            }}
            id="auth-tab-signup"
            className={`flex-1 py-4 text-center text-xs font-bold uppercase tracking-wider transition-colors border-b-2 ${
              isSignUp 
                ? 'border-indigo-600 text-indigo-600 bg-indigo-50/10' 
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Form Body Context */}
        <div className="p-6 sm:p-8">
          
          {error && (
            <div className="mb-4 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-700">
              {success}
            </div>
          )}

          {!isSignUp ? (
            /* 1. SIGN IN FORM */
            <form onSubmit={handleLogin} className="space-y-4" id="login-form-submit">
              
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">Student Username</label>
                <div className="relative flex items-center rounded-xl bg-slate-50 border border-slate-200 focus-within:border-indigo-500 focus-within:bg-white transition-all">
                  <UserCheck className="h-4 w-4 text-slate-400 absolute left-3" />
                  <input
                    id="login-username"
                    type="text"
                    value={loginUser}
                    onChange={(e) => setLoginUser(e.target.value)}
                    placeholder="e.g. samantha_jones"
                    className="w-full bg-transparent py-2.5 pl-10 pr-4 text-xs text-slate-800 outline-none"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">Password</label>
                <div className="relative flex items-center rounded-xl bg-slate-50 border border-slate-200 focus-within:border-indigo-500 focus-within:bg-white transition-all">
                  <Lock className="h-4 w-4 text-slate-400 absolute left-3" />
                  <input
                    id="login-password"
                    type="password"
                    value={loginPass}
                    onChange={(e) => setLoginPass(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-transparent py-2.5 pl-10 pr-4 text-xs text-slate-800 outline-none"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                id="btn-login-submit"
                className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-55 py-3 text-center text-xs font-extrabold text-white transition active:scale-95 shadow-md flex items-center justify-center space-x-2"
              >
                <span>{loading ? 'Verifying Student ID...' : 'Sign In'}</span>
              </button>

              <p className="text-[11px] text-center text-slate-500">
                Tip: Standard mock admin accounts is: <strong className="text-slate-700">admin</strong> / password: <strong className="text-slate-700">admin123</strong>
              </p>

            </form>
          ) : (
            /* 2. SIGN UP FORM */
            <form onSubmit={handleSignUp} className="space-y-4" id="signup-form-submit">
              
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">Student Username *</label>
                <div className="relative flex items-center rounded-xl bg-slate-50 border border-slate-200 focus-within:border-indigo-500 focus-within:bg-white transition-all">
                  <UserPlus className="h-4 w-4 text-slate-400 absolute left-3" />
                  <input
                    type="text"
                    id="signup-username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. michael_chen"
                    className="w-full bg-transparent py-2.5 pl-10 pr-4 text-xs text-slate-800 outline-none"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">University Email *</label>
                <div className="relative flex items-center rounded-xl bg-slate-50 border border-slate-200 focus-within:border-indigo-500 focus-within:bg-white transition-all">
                  <Mail className="h-4 w-4 text-slate-400 absolute left-3" />
                  <input
                    type="email"
                    id="signup-email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. m.chen@university.edu"
                    className="w-full bg-transparent py-2.5 pl-10 pr-4 text-xs text-slate-800 outline-none"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">Secure Password *</label>
                <div className="relative flex items-center rounded-xl bg-slate-50 border border-slate-200 focus-within:border-indigo-500 focus-within:bg-white transition-all">
                  <Lock className="h-4 w-4 text-slate-400 absolute left-3" />
                  <input
                    type="password"
                    id="signup-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    className="w-full bg-transparent py-2.5 pl-10 pr-4 text-xs text-slate-800 outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">Academic Dept (Opt)</label>
                  <input
                    type="text"
                    id="signup-dept"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="e.g. Computer Sci"
                    className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3.5 py-2.5 text-xs text-slate-800 outline-none focus:bg-white focus:border-indigo-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">Student ID (Opt)</label>
                  <input
                    type="text"
                    id="signup-studentid"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    placeholder="e.g. CS-2026-030"
                    className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3.5 py-2.5 text-xs text-slate-800 outline-none focus:bg-white focus:border-indigo-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                id="btn-signup-submit"
                className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-55 py-3 text-center text-xs font-extrabold text-white transition active:scale-95 shadow-md flex items-center justify-center space-x-2 mt-4"
              >
                <span>{loading ? 'Creating Student File...' : 'Create Account'}</span>
              </button>

            </form>
          )}

        </div>
      </div>
    </div>
  );
}
