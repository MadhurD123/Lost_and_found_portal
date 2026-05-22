import React from 'react';
import { User } from '../types';
import { Compass, FileText, UserCheck, LogOut, LayoutDashboard, Shield, PlusCircle, AlertCircle, Eye } from 'lucide-react';

interface NavbarProps {
  user: User | null;
  currentPage: string;
  navigate: (page: string, params?: any) => void;
  onLogout: () => void;
}

export default function Navbar({ user, currentPage, navigate, onLogout }: NavbarProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Portal Branding Brand Logo */}
        <div 
          onClick={() => navigate('home')} 
          className="flex cursor-pointer items-center space-x-2 transition hover:opacity-90"
          id="navbar-branding-logo"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm">
            <Compass className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-slate-900 leading-none">Campus Lost & Found</h1>
            <span className="text-[10px] font-mono tracking-wider uppercase text-indigo-600 font-semibold block">University Portal</span>
          </div>
        </div>

        {/* Desktop Primary Navigation Links */}
        <nav className="hidden md:flex items-center space-x-1" id="navbar-nav-links">
          <button
            onClick={() => navigate('home')}
            id="nav-link-home"
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              currentPage === 'home' 
                ? 'bg-slate-100 text-indigo-700' 
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            Home
          </button>
          <button
            onClick={() => navigate('browse-lost')}
            id="nav-link-browse-lost"
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              currentPage === 'browse-lost' 
                ? 'bg-slate-100 text-indigo-700' 
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            Lost Items
          </button>
          <button
            onClick={() => navigate('browse-found')}
            id="nav-link-browse-found"
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              currentPage === 'browse-found' 
                ? 'bg-slate-100 text-indigo-700' 
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            Found Items
          </button>

          {user && (
            <>
              <button
                onClick={() => navigate('my-listings')}
                id="nav-link-my-listings"
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  currentPage === 'my-listings' 
                    ? 'bg-slate-100 text-indigo-700' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                My Listings
              </button>
              {user.isAdmin && (
                <button
                  onClick={() => navigate('admin')}
                  id="nav-link-admin"
                  className={`flex items-center space-x-1 px-3 py-2 rounded-lg text-sm font-medium tracking-tight border border-amber-200 bg-amber-50/70 text-amber-800 transition hover:bg-amber-100`}
                >
                  <Shield className="h-4 w-4" />
                  <span>Admin Panel</span>
                </button>
              )}
            </>
          )}
        </nav>

        {/* User Engagement Panel Account actions */}
        <div className="flex items-center space-x-3" id="navbar-account-panel">
          {user ? (
            <div className="flex items-center space-x-3">
              {/* Profile Card Summary */}
              <div className="hidden sm:flex flex-col items-end text-right">
                <span className="text-xs font-semibold text-slate-800">
                  @{user.username}
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  {user.studentId ? `ID: ${user.studentId}` : user.email}
                </span>
              </div>
              
              {/* Quick Report Add Trigger buttons */}
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => navigate('report-lost')}
                  id="nav-btn-report-lost"
                  className="hidden xs:flex items-center space-x-1 px-3 py-1.5 text-xs font-medium text-amber-900 hover:bg-amber-100 bg-amber-100/50 rounded-lg transition"
                >
                  <AlertCircle className="h-3.5 w-3.5" />
                  <span>Report Lost</span>
                </button>
                <button
                  onClick={() => navigate('report-found')}
                  id="nav-btn-report-found"
                  className="hidden xs:flex items-center space-x-1 px-3 py-1.5 text-xs font-medium text-emerald-900 hover:bg-emerald-100 bg-emerald-100/50 rounded-lg transition"
                >
                  <PlusCircle className="h-3.5 w-3.5" />
                  <span>Report Found</span>
                </button>
              </div>

              {/* Logout Button */}
              <button
                onClick={onLogout}
                id="btn-logout"
                title="Logout from system"
                className="flex items-center justify-center p-2 rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-600 transition"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => navigate('login')}
              id="btn-login-trigger"
              className="flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-sm font-semibold rounded-xl shadow-sm transition"
            >
              <UserCheck className="h-4 w-4" />
              <span>Student Sign In</span>
            </button>
          )}
        </div>

      </div>

      {/* Mobile Sticky Report Shortcut bar */}
      {user && (
        <div className="flex xs:hidden justify-around border-t border-slate-100 bg-slate-50 py-2 px-4 shadow-inner" id="mobile-quick-action-shortcuts">
          <button
            onClick={() => navigate('report-lost')}
            className="flex items-center space-x-1 text-xs font-semibold text-amber-800"
          >
            <AlertCircle className="h-3.5 w-3.5" />
            <span>Report Lost</span>
          </button>
          <button
            onClick={() => navigate('report-found')}
            className="flex items-center space-x-1 text-xs font-semibold text-emerald-800"
          >
            <PlusCircle className="h-3.5 w-3.5" />
            <span>Report Found</span>
          </button>
        </div>
      )}
    </header>
  );
}
