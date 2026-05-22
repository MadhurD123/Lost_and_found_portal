import React, { useState, useEffect } from 'react';
import { LostItem, FoundItem, MatchSuggestion, User } from '../types';
import { Compass, Sparkles, MapPin, Calendar, Mail, UserCheck, Shield, ChevronLeft, ArrowRight, ShieldAlert } from 'lucide-react';

interface ItemDetailsProps {
  type: 'Lost' | 'Found';
  id: string;
  user: User | null;
  navigate: (page: string, params?: any) => void;
  onContactAdmin: (item: any, type: 'Lost' | 'Found') => void;
}

export default function ItemDetails({ type, id, user, navigate, onContactAdmin }: ItemDetailsProps) {
  const [item, setItem] = useState<LostItem | FoundItem | null>(null);
  const [matches, setMatches] = useState<MatchSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [matchingLoading, setMatchingLoading] = useState(false);
  const [error, setError] = useState('');

  const isLost = type === 'Lost';

  useEffect(() => {
    async function loadItemAndMatches() {
      setLoading(true);
      setError('');
      try {
        const itemUrl = isLost ? `/api/lost/${id}` : `/api/found/${id}`;
        const itemRes = await fetch(itemUrl);
        
        if (!itemRes.ok) {
          throw new Error('This listing could not be recovered from central database.');
        }

        const itemData = await itemRes.json();
        setItem(itemData);

        // Fetch similarities counterpart suggest
        setMatchingLoading(true);
        const matchRes = await fetch(`/api/match/${type.toLowerCase()}/${id}`);
        if (matchRes.ok) {
          const matchData = await matchRes.json();
          setMatches(matchData.matches || []);
        }
      } catch (err: any) {
        setError(err.message || 'Error occurred while fetching details.');
      } finally {
        setLoading(false);
        setMatchingLoading(false);
      }
    }
    loadItemAndMatches();
  }, [type, id]);

  const handleBackToFeed = () => {
    navigate(isLost ? 'browse-lost' : 'browse-found');
  };

  if (loading) {
    return (
      <div className="py-24 text-center text-slate-400 font-mono text-xs animate-pulse">
        Fetching secure listing details...
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="mx-auto max-w-md py-16 text-center space-y-6">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 border border-rose-200">
          <ShieldAlert className="h-7 w-7" />
        </div>
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-slate-900">Listing Unavailable</h3>
          <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
            {error || 'This item could not be retrieved. It may have been resolved or deleted by moderator.'}
          </p>
        </div>
        <button
          onClick={handleBackToFeed}
          className="rounded-xl border px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
        >
          Return to Registry
        </button>
      </div>
    );
  }

  const statusBgColors: Record<string, string> = {
    'Searching': 'bg-rose-50 border-rose-200 text-rose-700',
    'Matched': 'bg-amber-50 border-amber-200 text-amber-700',
    'Returned': 'bg-indigo-50 border-indigo-205 text-indigo-700',
    'Available': 'bg-emerald-50 border-emerald-200 text-emerald-700',
    'Claimed': 'bg-amber-50 border-amber-205 text-amber-700',
  };

  return (
    <div className="space-y-8 pb-16" id="item-details-view-container">
      
      {/* 1. BACK HEADER */}
      <button
        onClick={handleBackToFeed}
        className="inline-flex items-center space-x-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition"
      >
        <ChevronLeft className="h-4 w-4" />
        <span>Back to {isLost ? 'Lost Items' : 'Found Items'} Registry</span>
      </button>

      {/* 2. MAIN LAYOUT GRID */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
        
        {/* LEFT COLUMN: PRODUCT SPECIFICATION SHEETS (3 cols) */}
        <div className="md:col-span-3 space-y-6">
          
          <div className="rounded-3xl border border-slate-200 bg-white overflow-hidden shadow-sm">
            {/* Image banner */}
            <div className="relative h-64 sm:h-80 w-full overflow-hidden bg-slate-100">
              <img 
                src={item.image || `https://images.unsplash.com/photo-1501504905252-473c47e087f8?auto=format&fit=crop&q=80&w=1200`} 
                referrerPolicy="no-referrer"
                alt={item.itemName} 
                className="h-full w-full object-cover"
              />
              <span className={`absolute top-4 left-4 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider text-white ${isLost ? 'bg-rose-600' : 'bg-emerald-600'}`}>
                {type}
              </span>
              <span className={`absolute top-4 right-4 rounded-full border px-3 py-1 text-xs font-bold shadow-md ${statusBgColors[item.status] || 'bg-slate-100 border-slate-200 text-slate-700'}`}>
                {item.status}
              </span>
            </div>

            {/* Spec Sheet Context */}
            <div className="p-6 sm:p-8 space-y-4">
              <div>
                <span className="text-[10px] font-mono font-bold tracking-widest text-slate-400 block uppercase">
                  Category: {item.category}
                </span>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight mt-1 leading-snug">
                  {item.itemName}
                </h3>
              </div>

              <div className="text-xs text-slate-650 leading-relaxed space-y-2 border-t border-b border-slate-100 py-4 font-sans text-slate-700">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider font-sans">Report Details:</h4>
                <p className="whitespace-pre-line italic">"{item.description}"</p>
              </div>

              {/* Specs metadata lists */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="flex items-center space-x-2.5 rounded-xl bg-slate-50 p-3 shadow-2xs border border-slate-100">
                  <MapPin className="h-4.5 w-4.5 text-indigo-500" />
                  <div>
                    <span className="text-[9px] uppercase font-mono text-slate-400 block font-bold">Location</span>
                    <strong className="text-slate-800">{isLost ? (item as LostItem).locationLost : (item as FoundItem).locationFound}</strong>
                  </div>
                </div>

                <div className="flex items-center space-x-2.5 rounded-xl bg-slate-50 p-3 shadow-2xs border border-slate-100">
                  <Calendar className="h-4.5 w-4.5 text-indigo-500" />
                  <div>
                    <span className="text-[9px] uppercase font-mono text-slate-400 block font-bold">{isLost ? 'Date Misplaced' : 'Date Found'}</span>
                    <strong className="text-slate-800">{isLost ? (item as LostItem).dateLost : (item as FoundItem).dateFound}</strong>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* CONTACT OR OWNER DIRECT INTERACTION SHEETS */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h4 className="text-sm font-bold text-slate-900 border-b border-slate-50 pb-2 mb-3">Item Contact details</h4>
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1 text-xs">
                <div className="flex items-center space-x-1.5 text-slate-600">
                  <Mail className="h-4 w-4 text-slate-400" />
                  <span className="font-mono">{item.contactEmail}</span>
                </div>
                <div className="flex items-center space-x-1.5 text-slate-600">
                  <UserCheck className="h-4 w-4 text-slate-400" />
                  <span>Reported by: @{item.username}</span>
                </div>
              </div>

              {item.status !== 'Returned' && item.status !== 'Claimed' ? (
                <button
                  onClick={() => onContactAdmin(item, type)}
                  className="rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-bold text-white transition hover:bg-slate-800 shadow-sm"
                >
                  Contact Admin / Claim Box
                </button>
              ) : (
                <div className="rounded-xl bg-slate-100 border px-4 py-2.5 text-xs text-slate-500 font-bold">
                  Status Resolved
                </div>
              )}
            </div>
          </div>

        </div>


        {/* RIGHT COLUMN: AI MATCH RECOMMENDATION CO-PILOT (2 cols) */}
        <div className="md:col-span-2 space-y-6">
          
          <div className="rounded-3xl border border-indigo-100 bg-indigo-50/10 p-6 shadow-sm space-y-4">
            
            <div className="flex items-center justify-between border-b border-indigo-50 pb-3 shrink-0">
              <div className="flex items-center space-x-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-sm">
                  <Sparkles className="h-4.5 w-4.5 animate-pulse" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 leading-tight">AI Match Matchmaker</h4>
                  <p className="text-[9px] font-mono uppercase tracking-wider text-indigo-600 font-bold">Similarity engine</p>
                </div>
              </div>
            </div>

            {matchingLoading ? (
              <div className="py-12 text-center text-xs text-slate-400 font-mono animate-pulse">
                Analyzing counterpart catalogs...
              </div>
            ) : matches.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-indigo-100 bg-white/70 p-6 text-center text-slate-400 text-xs">
                No obvious matching listings detected in active counterparts.
              </div>
            ) : (
              <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1" id="ai-matches-list-container">
                {matches.map((match) => (
                  <div 
                    key={match.matchId}
                    onClick={() => navigate('item-details', { type: isLost ? 'Found' : 'Lost', id: match.matchId })}
                    className="group rounded-2xl border border-indigo-150 bg-white p-4 shadow-2xs hover:border-indigo-500 hover:shadow-xs transition duration-300 cursor-pointer text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-[9px] font-bold text-indigo-700">
                        {match.category}
                      </span>
                      <div className="flex items-center space-x-1 font-bold text-indigo-700 font-mono text-xs">
                        <Sparkles className="h-3 w-3 text-indigo-500 shrink-0" />
                        <span>{match.similarityScore}% Match</span>
                      </div>
                    </div>

                    <h5 className="font-extrabold text-slate-800 text-sm mt-2 line-clamp-1 group-hover:text-indigo-600 transition-colors">
                      {match.itemName}
                    </h5>

                    <p className="text-[10.5px] text-indigo-850 leading-relaxed mt-1 block font-serif italic text-indigo-900 bg-indigo-50/30 rounded-lg p-2 border border-indigo-100/40">
                      "{match.reason}"
                    </p>

                    <div className="mt-3 flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-50 pt-2 font-mono">
                      <span>Ref Loc: {match.location}</span>
                      <span>{match.date}</span>
                    </div>

                  </div>
                ))}
              </div>
            )}

            <div className="rounded-xl bg-slate-900 p-4 text-white hover:bg-slate-800 transition shadow-inner">
              <span className="text-[9px] font-bold uppercase tracking-wider text-rose-400 font-mono flex items-center space-x-1">
                <Shield className="h-3.5 w-3.5" />
                <span>Verification Advisory</span>
              </span>
              <p className="text-[10.5px] text-slate-300 mt-1 leading-relaxed leading-tight">
                To guarantee safety, please do not post device passwords or highly unique matching serial numbers directly. Verify during admin-guided pickup reviews!
              </p>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
