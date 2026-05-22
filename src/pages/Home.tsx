import React, { useState, useEffect } from 'react';
import { LostItem, FoundItem, User } from '../types';
import { Compass, Search, PlusCircle, AlertCircle, Sparkles, MapPin, CheckCircle, Clock } from 'lucide-react';

interface HomeProps {
  user: User | null;
  navigate: (page: string, params?: any) => void;
}

export default function Home({ user, navigate }: HomeProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState({ lost: 0, found: 0, resolved: 0 });
  const [recentLost, setRecentLost] = useState<LostItem[]>([]);
  const [recentFound, setRecentFound] = useState<FoundItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadHomeContent() {
      try {
        const [lostRes, foundRes] = await Promise.all([
          fetch('/api/lost'),
          fetch('/api/found')
        ]);
        
        if (lostRes.ok && foundRes.ok) {
          const losts = await lostRes.json();
          const founds = await foundRes.json();

          // Compute basic stats
          const resolvedLost = losts.filter((i: any) => i.status === 'Returned').length;
          const resolvedFound = founds.filter((i: any) => i.status === 'Returned' || i.status === 'Claimed').length;

          setStats({
            lost: losts.filter((i: any) => i.status === 'Searching').length,
            found: founds.filter((i: any) => i.status === 'Available').length,
            resolved: resolvedLost + resolvedFound
          });

          // Feed slider
          setRecentLost(losts.slice(0, 3));
          setRecentFound(founds.slice(0, 3));
        }
      } catch (err) {
        console.error('Error feeding home page context metrics:', err);
      } finally {
        setLoading(false);
      }
    }
    loadHomeContent();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    // Route to browse lost with pre-filled state
    navigate('browse-lost', { search: searchQuery.trim() });
  };

  return (
    <div className="space-y-12 pb-16">
      
      {/* 1. HERO SEARCH HEADER SEGMENT */}
      <section 
        className="relative overflow-hidden rounded-3xl bg-slate-900 px-6 py-16 sm:px-12 sm:py-20 text-center shadow-lg"
        id="home-hero-banner"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-indigo-500/20 via-slate-900 to-slate-900" />
        
        {/* Content Wrapper */}
        <div className="relative mx-auto max-w-2xl space-y-6">
          <div className="mx-auto flex h-10 w-44 items-center justify-center space-x-1.5 rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-400 border border-indigo-400/20">
            <Sparkles className="h-4 w-4 text-indigo-400" />
            <span>Digital Co-pilot Active</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white font-sans sm:leading-tight">
            Lost Something on Campus? <br/>
            Let's Help You Recover It.
          </h2>

          <p className="text-sm text-slate-300 max-w-lg mx-auto leading-relaxed">
            The unified University Lost & Found system, matching lost study electronics, keys, and accessories using precision semantic models.
          </p>

          {/* Core Search bar */}
          <form onSubmit={handleSearchSubmit} className="relative mx-auto max-w-xl" id="home-search-engine">
            <div className="flex items-center rounded-2xl bg-white p-1.5 shadow-xl border border-slate-200">
              <Search className="h-5 w-5 ml-3 shrink-0 text-slate-400" />
              <input 
                type="text" 
                value={searchQuery}
                id="search-input-box"
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="What did you lose? (e.g. apple ipad pencil, black car keys, hydroflask)"
                className="w-full bg-transparent px-3 py-2 text-sm text-slate-800 outline-none placeholder-slate-400"
              />
              <button 
                type="submit"
                id="btn-trigger-search"
                className="rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white transition hover:bg-indigo-700 active:scale-95 shadow-sm"
              >
                Scan Central DB
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* 2. LIVE STATISTICS DIGESTS */}
      <section className="grid grid-cols-1 gap-5 sm:grid-cols-3" id="home-stats-digest">
        <div className="flex items-center space-x-4 rounded-2xl border border-rose-100 bg-rose-50/40 p-6 shadow-sm">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-600">
            <AlertCircle className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-rose-400 block font-mono">Active Searches</span>
            <h4 className="text-2xl font-black text-rose-950 font-sans mt-0.5">{loading ? '...' : stats.lost} Items Lost</h4>
          </div>
        </div>

        <div className="flex items-center space-x-4 rounded-2xl border border-emerald-100 bg-emerald-50/40 p-6 shadow-sm">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
            <CheckCircle className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-500 block font-mono">Discovered Items</span>
            <h4 className="text-2xl font-black text-emerald-950 font-sans mt-0.5">{loading ? '...' : stats.found} Available</h4>
          </div>
        </div>

        <div className="flex items-center space-x-4 rounded-2xl border border-indigo-100 bg-indigo-50/40 p-6 shadow-sm">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-500 block font-mono">Returned to Students</span>
            <h4 className="text-2xl font-black text-indigo-950 font-sans mt-0.5">{loading ? '...' : stats.resolved} Reunited</h4>
          </div>
        </div>
      </section>

      {/* 3. REPORT TRIGGER BLOCKS (REPORT LOST / DRAG FOUND) */}
      <section className="grid grid-cols-1 gap-6 md:grid-cols-2" id="home-action-guides">
        <div className="flex flex-col justify-between rounded-3xl border border-slate-200/80 bg-white p-8 shadow-sm hover:border-slate-300 transition duration-300">
          <div className="space-y-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 border border-amber-200/60">
              <AlertCircle className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Did you lose a possession?</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Post specifications of your item instantly to our registry. The portal will scan all found listings reported by security and students, suggesting immediate matching items.
            </p>
          </div>
          <button 
            onClick={() => navigate('report-lost')}
            className="mt-6 inline-flex w-full items-center justify-center space-x-2 rounded-xl bg-amber-600 py-3 text-xs font-bold text-white transition hover:bg-amber-700"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Create Lost Item Report</span>
          </button>
        </div>

        <div className="flex flex-col justify-between rounded-3xl border border-slate-200/80 bg-white p-8 shadow-sm hover:border-slate-300 transition duration-300">
          <div className="space-y-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200/60">
              <Compass className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Found an item on campus?</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Help reunite owners with their lost belongings! Report found items in a safe location, upload detailed summaries, and handle student claim validation letters online.
            </p>
          </div>
          <button 
            onClick={() => navigate('report-found')}
            className="mt-6 inline-flex w-full items-center justify-center space-x-2 rounded-xl bg-emerald-600 py-3 text-xs font-bold text-white transition hover:bg-emerald-700"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Report Discovered Item</span>
          </button>
        </div>
      </section>

      {/* 4. RECENT HIGH-FIDELITY LISTINGS FEED slider */}
      <section className="space-y-6" id="home-listings-preview">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Recently Reported on Campus</h3>
            <p className="text-xs text-slate-500">Live feed of active search and found databases</p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => navigate('browse-lost')}
              className="text-xs font-semibold text-indigo-600 hover:underline"
            >
              Browse All Lost
            </button>
            <span className="text-slate-300">•</span>
            <button
              onClick={() => navigate('browse-found')}
              className="text-xs font-semibold text-indigo-600 hover:underline"
            >
              Browse All Found
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {recentLost.length === 0 && recentFound.length === 0 ? (
            <div className="col-span-full rounded-2xl border border-dashed border-slate-200 p-12 text-center text-slate-400">
              <span>No items reported in the past few days.</span>
            </div>
          ) : (
            <>
              {/* Lost Previews */}
              {recentLost.map((item: any) => (
                <div 
                  key={item._id}
                  onClick={() => navigate('item-details', { type: 'Lost', id: item._id })}
                  className="flex flex-col rounded-xl border border-slate-150 bg-white p-4 cursor-pointer hover:border-indigo-400 transition-colors shadow-sm relative group"
                >
                  <div className="flex items-center justify-between">
                    <span className="rounded-md bg-rose-50 border border-rose-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-rose-600">LOST</span>
                    <span className="text-[10px] text-slate-400 font-mono">{item.dateLost}</span>
                  </div>
                  <h4 className="font-bold text-slate-800 text-sm mt-3 line-clamp-1 group-hover:text-indigo-600 transition-colors">{item.itemName}</h4>
                  <p className="text-xs text-slate-500 line-clamp-2 mt-1 flex-1">{item.description}</p>
                  <div className="mt-4 flex items-center text-slate-400 text-xs space-x-1 border-t border-slate-50 pt-2 shrink-0">
                    <MapPin className="h-3 w-3 shrink-0" />
                    <span className="truncate">{item.locationLost}</span>
                  </div>
                </div>
              ))}

              {/* Found Previews */}
              {recentFound.map((item: any) => (
                <div 
                  key={item._id}
                  onClick={() => navigate('item-details', { type: 'Found', id: item._id })}
                  className="flex flex-col rounded-xl border border-slate-150 bg-white p-4 cursor-pointer hover:border-indigo-400 transition-colors shadow-sm relative group"
                >
                  <div className="flex items-center justify-between">
                    <span className="rounded-md bg-emerald-50 border border-emerald-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-600">FOUND</span>
                    <span className="text-[10px] text-slate-400 font-mono">{item.dateFound}</span>
                  </div>
                  <h4 className="font-bold text-slate-800 text-sm mt-3 line-clamp-1 group-hover:text-indigo-600 transition-colors">{item.itemName}</h4>
                  <p className="text-xs text-slate-500 line-clamp-2 mt-1 flex-1">{item.description}</p>
                  <div className="mt-4 flex items-center text-slate-400 text-xs space-x-1 border-t border-slate-50 pt-2 shrink-0">
                    <MapPin className="h-3 w-3 shrink-0" />
                    <span className="truncate">{item.locationFound}</span>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </section>



    </div>
  );
}
