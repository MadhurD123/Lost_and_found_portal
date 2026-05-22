import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Auth from './pages/Auth';
import ReportLost from './pages/ReportLost';
import ReportFound from './pages/ReportFound';
import MyListings from './pages/MyListings';
import BrowseLost from './pages/BrowseLost';
import BrowseFound from './pages/BrowseFound';
import ItemDetails from './pages/ItemDetails';
import AdminPanel from './pages/AdminPanel';
import ClaimModal from './components/ClaimModal';
import { User, LostItem, FoundItem } from './types';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldAlert, RefreshCw, HelpCircle, GraduationCap } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  
  // Custom simple react router state
  const [currentPage, setCurrentPage] = useState<string>('home');
  const [routeParams, setRouteParams] = useState<any>(null);
  
  // Shared claimant state variables
  const [activeClaimItem, setActiveClaimItem] = useState<any>(null);
  const [activeClaimType, setActiveClaimType] = useState<'Lost' | 'Found' | null>(null);
  const [claimModalOpen, setClaimModalOpen] = useState(false);

  const [initializing, setInitializing] = useState(true);

  // Nav helper function supporting pass configurations
  const navigate = (page: string, params: any = null) => {
    setCurrentPage(page);
    setRouteParams(params);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Validate student token on startup cache load
  useEffect(() => {
    async function validateStudentProfile() {
      if (!token) {
        setInitializing(false);
        return;
      }
      try {
        const response = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await response.json();
        if (response.ok) {
          setUser(data.user);
        } else {
          // Token expired or invalid, scrub cache safely
          localStorage.removeItem('token');
          setToken(null);
          setUser(null);
        }
      } catch (err) {
        console.error('Error synchronizing student token profile:', err);
      } finally {
        setInitializing(false);
      }
    }
    validateStudentProfile();
  }, [token]);

  const handleLoginSuccess = (signedUser: User, sessionToken: string) => {
    localStorage.setItem('token', sessionToken);
    setToken(sessionToken);
    setUser(signedUser);
    navigate('home');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    navigate('home');
  };

  const handleClaimTrigger = (item: any, type: 'Lost' | 'Found') => {
    setActiveClaimItem(item);
    setActiveClaimType(type);
    setClaimModalOpen(true);
  };

  // -------------------------------------------------------------
  // RENDERING COMPONENT ACCORDING TO STATE PAGES
  // -------------------------------------------------------------
  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'home':
        return <Home user={user} navigate={navigate} />;
      case 'login':
        return <Auth onLoginSuccess={handleLoginSuccess} navigate={navigate} />;
      case 'report-lost':
        return <ReportLost user={user} navigate={navigate} />;
      case 'report-found':
        return <ReportFound user={user} navigate={navigate} />;
      case 'my-listings':
        return <MyListings user={user} navigate={navigate} />;
      case 'browse-lost':
        return (
          <BrowseLost 
            initialSearch={routeParams?.search || ''} 
            navigate={navigate} 
            onContactAdmin={(itm) => handleClaimTrigger(itm, 'Lost')} 
          />
        );
      case 'browse-found':
        return (
          <BrowseFound 
            initialSearch={routeParams?.search || ''} 
            navigate={navigate} 
            onContactAdmin={(itm) => handleClaimTrigger(itm, 'Found')} 
          />
        );
      case 'item-details':
        return (
          <ItemDetails 
            type={routeParams?.type || 'Lost'} 
            id={routeParams?.id} 
            user={user} 
            navigate={navigate} 
            onContactAdmin={(itm, typ) => handleClaimTrigger(itm, typ)} 
          />
        );
      case 'admin':
        return <AdminPanel navigate={navigate} />;
      default:
        return <Home user={user} navigate={navigate} />;
    }
  };

  if (initializing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center space-y-4">
          <RefreshCw className="mx-auto h-8 w-8 text-indigo-600 animate-spin" />
          <p className="text-xs font-mono font-bold uppercase tracking-widest text-slate-400">
            Initialising Campus Databases...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div id="app-root-layout" className="flex min-h-screen flex-col bg-slate-50 text-slate-800 antialiased font-sans">
      
      {/* Sticky Header Navbar */}
      <Navbar 
        user={user} 
        currentPage={currentPage} 
        navigate={navigate} 
        onLogout={handleLogout} 
      />

      {/* Primary Layout Sandbox Body */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        
        {/* Animated Slide Layout Transitions */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPage}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="w-full"
          >
            {renderCurrentPage()}
          </motion.div>
        </AnimatePresence>

      </main>

      {/* Universal Claim Modal */}
      <ClaimModal 
        item={activeClaimItem}
        itemType={activeClaimType}
        isOpen={claimModalOpen}
        onClose={() => setClaimModalOpen(false)}
        user={user}
        navigate={navigate}
      />

      {/* Portal Branding Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 mt-auto">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400 font-mono">
          <div className="flex items-center space-x-2">
            <GraduationCap className="h-5 w-5 text-slate-350 shrink-0" />
            <span>Campus Lost & Found Platform © 2026. Connecting our community with care.</span>
          </div>
          <div className="flex gap-4">
            <span className="hover:text-slate-700 cursor-pointer">Help Desk</span>
            <span>•</span>
            <span className="hover:text-slate-700 cursor-pointer">Privacy Policy</span>
            <span>•</span>
            <span className="hover:text-slate-700 cursor-pointer">Terms of Service</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
