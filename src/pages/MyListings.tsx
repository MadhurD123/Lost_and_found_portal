import React, { useState, useEffect } from 'react';
import { LostItem, FoundItem, ClaimRequest, User } from '../types';
import { AlertCircle, Tag, CheckCircle2, Clock, MapPin, Eye, Trash2, ArrowRight } from 'lucide-react';

interface MyListingsProps {
  user: User | null;
  navigate: (page: string, params?: any) => void;
}

export default function MyListings({ user, navigate }: MyListingsProps) {
  const [lostItems, setLostItems] = useState<LostItem[]>([]);
  const [foundItems, setFoundItems] = useState<FoundItem[]>([]);
  const [claims, setClaims] = useState<ClaimRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'lost' | 'found' | 'claims'>('lost');

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    setError('');

    try {
      const headers = {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      };

      const [lostRes, foundRes, claimsRes] = await Promise.all([
        fetch('/api/lost'),
        fetch('/api/found'),
        fetch('/api/claims', { headers })
      ]);

      if (lostRes.ok && foundRes.ok && claimsRes.ok) {
        const losts: LostItem[] = await lostRes.json();
        const founds: FoundItem[] = await foundRes.json();
        const claimsList: ClaimRequest[] = await claimsRes.json();

        // Filter items matching current student
        setLostItems(losts.filter(i => i.userId === user.userId));
        setFoundItems(founds.filter(i => i.userId === user.userId));
        setClaims(claimsList);
      } else {
        throw new Error('Failed to load personalized metrics.');
      }
    } catch (err: any) {
      setError(err.message || 'Error pulling listings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleUpdateStatus = async (type: 'Lost' | 'Found', itemId: string, newStatus: string) => {
    try {
      const url = type === 'Lost' ? `/api/lost/${itemId}` : `/api/found/${itemId}`;
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) {
        throw new Error('Could not update item status.');
      }

      loadData();
    } catch (err: any) {
      setError(err.message || 'Error occurred.');
    }
  };

  const handleDeleteListing = async (type: 'Lost' | 'Found', itemId: string) => {
    if (!window.confirm('Are you sure you want to permanently delete this listing from campus databases?')) return;
    try {
      const url = type === 'Lost' ? `/api/lost/${itemId}` : `/api/found/${itemId}`;
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to remove listing.');
      }

      loadData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleCancelClaim = async (claimId: string) => {
    if (!window.confirm('Do you wish to cancel this claim request ticket?')) return;
    try {
      const response = await fetch(`/api/claims/${claimId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to cancel claim ticket.');
      }

      loadData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (!user) {
    return (
      <div className="mx-auto max-w-md py-16 text-center space-y-6">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
          <AlertCircle className="h-7 w-7" />
        </div>
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-slate-900">Access Restricted</h3>
          <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
            Please register and authenticate your student profile to review reports and open verification claims.
          </p>
        </div>
        <button
          onClick={() => navigate('login')}
          className="rounded-xl bg-indigo-600 px-6 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 transition"
        >
          Sign In
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16">
      
      {/* Header */}
      <div className="border-b border-slate-100 pb-5">
        <h2 className="text-2xl font-extrabold tracking-tight text-slate-950">Student Dashboard</h2>
        <p className="text-xs text-slate-500 mt-1">Track status, edit or resolve your posts, and review filed claim verification tickets.</p>
      </div>

      {error && (
        <div className="rounded-xl bg-rose-50 border border-rose-200 p-4 text-xs text-rose-700">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-200" id="my-listings-tabs">
        <button
          onClick={() => setActiveTab('lost')}
          className={`px-6 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition ${
            activeTab === 'lost'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          My Lost Items ({lostItems.length})
        </button>
        <button
          onClick={() => setActiveTab('found')}
          className={`px-6 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition ${
            activeTab === 'found'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          My Found Items ({foundItems.length})
        </button>
        <button
          onClick={() => setActiveTab('claims')}
          className={`px-6 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition ${
            activeTab === 'claims'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Claims Filed ({claims.length})
        </button>
      </div>

      {loading ? (
        <div className="py-12 text-center text-slate-400 text-xs">
          Loading student summaries...
        </div>
      ) : (
        <div className="space-y-6">
          
          {/* A. LOST ITEMS LISTINGS */}
          {activeTab === 'lost' && (
            <div className="grid grid-cols-1 gap-4" id="mylistings-lost-panel">
              {lostItems.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 p-12 text-center text-slate-400">
                  <p className="text-sm">You haven't reported any lost items yet.</p>
                  <button 
                    onClick={() => navigate('report-lost')}
                    className="mt-3 text-xs font-bold text-indigo-600 hover:underline inline-flex items-center space-x-1"
                  >
                    <span>Report Lost Item Now</span>
                    <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                lostItems.map(item => (
                  <div key={item._id} className="rounded-2xl border border-slate-200 bg-white p-5 flex flex-col md:flex-row gap-5 items-start justify-between shadow-xs">
                    <div className="flex gap-4 items-start flex-1">
                      {item.image && (
                        <img src={item.image} referrerPolicy="no-referrer" className="h-20 w-20 rounded-xl object-cover border shrink-0 bg-slate-50" alt="" />
                      )}
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-[10px] uppercase font-mono bg-rose-50 text-rose-700 px-2 py-0.5 rounded-md font-bold">Lost</span>
                          <span className="text-xs text-slate-400 font-mono">{item.dateLost}</span>
                        </div>
                        <h4 className="font-extrabold text-slate-900 text-sm leading-snug">{item.itemName}</h4>
                        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{item.description}</p>
                        <div className="flex items-center space-x-3 text-xs text-slate-400 pt-1">
                          <span className="flex items-center space-x-1">
                            <MapPin className="h-3.5 w-3.5" />
                            <span>{item.locationLost}</span>
                          </span>
                          <span>•</span>
                          <span className="text-indigo-600 font-semibold font-mono">Category: {item.category}</span>
                        </div>
                      </div>
                    </div>

                    {/* Operational Controls panel */}
                    <div className="w-full md:w-auto shrink-0 pt-4 md:pt-0 border-t md:border-t-0 border-slate-100 flex flex-wrap items-center gap-3">
                      
                      {/* Status select dropdown */}
                      <div className="space-y-1">
                        <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Status Controller</span>
                        <select
                          value={item.status}
                          onChange={(e) => handleUpdateStatus('Lost', item._id, e.target.value)}
                          className="rounded-lg border border-slate-200 bg-slate-50/50 px-2.5 py-1.5 text-xs text-slate-700"
                        >
                          <option value="Searching">Searching</option>
                          <option value="Matched">Matched</option>
                          <option value="Returned">Returned (Resolved)</option>
                        </select>
                      </div>

                      {/* Inspect details */}
                      <button
                        onClick={() => navigate('item-details', { type: 'Lost', id: item._id })}
                        className="rounded-lg border p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition"
                        title="Display Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => handleDeleteListing('Lost', item._id)}
                        className="rounded-lg border border-rose-200 p-2 text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition"
                        title="Delete listing"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* B. FOUND ITEMS LISTINGS */}
          {activeTab === 'found' && (
            <div className="grid grid-cols-1 gap-4" id="mylistings-found-panel">
              {foundItems.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 p-12 text-center text-slate-400">
                  <p className="text-sm">You haven't reported any discovered items yet.</p>
                  <button 
                    onClick={() => navigate('report-found')}
                    className="mt-3 text-xs font-bold text-indigo-600 hover:underline inline-flex items-center space-x-1"
                  >
                    <span>Report Discovered Possession Now</span>
                    <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                foundItems.map(item => (
                  <div key={item._id} className="rounded-2xl border border-slate-200 bg-white p-5 flex flex-col md:flex-row gap-5 items-start justify-between shadow-xs">
                    <div className="flex gap-4 items-start flex-1">
                      {item.image && (
                        <img src={item.image} referrerPolicy="no-referrer" className="h-20 w-20 rounded-xl object-cover border shrink-0 bg-slate-50" alt="" />
                      )}
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-[10px] uppercase font-mono bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md font-bold">Found</span>
                          <span className="text-xs text-slate-400 font-mono">{item.dateFound}</span>
                        </div>
                        <h4 className="font-extrabold text-slate-900 text-sm leading-snug">{item.itemName}</h4>
                        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{item.description}</p>
                        <div className="flex items-center space-x-3 text-xs text-slate-400 pt-1">
                          <span className="flex items-center space-x-1">
                            <MapPin className="h-3.5 w-3.5" />
                            <span>{item.locationFound}</span>
                          </span>
                          <span>•</span>
                          <span className="text-indigo-600 font-semibold font-mono">Category: {item.category}</span>
                        </div>
                      </div>
                    </div>

                    {/* Operational Controls panel */}
                    <div className="w-full md:w-auto shrink-0 pt-4 md:pt-0 border-t md:border-t-0 border-slate-100 flex flex-wrap items-center gap-3">
                      
                      {/* Status select dropdown */}
                      <div className="space-y-1">
                        <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Status Controller</span>
                        <select
                          value={item.status}
                          onChange={(e) => handleUpdateStatus('Found', item._id, e.target.value)}
                          className="rounded-lg border border-slate-200 bg-slate-50/50 px-2.5 py-1.5 text-xs text-slate-700"
                        >
                          <option value="Available">Available</option>
                          <option value="Claimed">Claimed</option>
                          <option value="Returned">Returned (Resolved)</option>
                        </select>
                      </div>

                      {/* Inspect details */}
                      <button
                        onClick={() => navigate('item-details', { type: 'Found', id: item._id })}
                        className="rounded-lg border p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition"
                        title="Display Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => handleDeleteListing('Found', item._id)}
                        className="rounded-lg border border-rose-200 p-2 text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition"
                        title="Delete listing"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* C. STUDENT CLAIMS TICKET LOGS */}
          {activeTab === 'claims' && (
            <div className="grid grid-cols-1 gap-4" id="mylistings-claims-panel">
              {claims.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 p-12 text-center text-slate-400">
                  <p className="text-sm">You haven't submitted any claim request letters yet.</p>
                  <p className="text-xs text-slate-400 mt-1">To claim an item, view its detailed specification page and click "Contact Admin".</p>
                </div>
              ) : (
                claims.map(claim => {
                  const statusColors: Record<string, string> = {
                    'Pending': 'bg-amber-100 text-amber-800 border-amber-200',
                    'Approved': 'bg-emerald-100 text-emerald-800 border-emerald-200',
                    'Rejected': 'bg-rose-100 text-rose-800 border-rose-200',
                  };
                  return (
                    <div key={claim._id} className="rounded-2xl border border-slate-200 bg-white p-5 flex flex-col md:flex-row gap-5 items-start justify-between shadow-xs">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-[10px] font-bold tracking-wider font-mono uppercase bg-indigo-50 text-indigo-700 border border-indigo-100 px-2 py-0.5 rounded-md">
                            Claim Message
                          </span>
                          <span className={`text-[10px] font-bold tracking-tight rounded-full px-2.5 py-0.5 border ${statusColors[claim.requestStatus] || 'bg-slate-100 border-slate-200'}`}>
                            {claim.requestStatus}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">Submitted: {new Date(claim.createdAt).toLocaleDateString()}</span>
                        </div>

                        <div>
                          <span className="text-[11px] text-slate-400 font-mono block">Target Item:</span>
                          <h4 className="font-extrabold text-slate-900 text-sm leading-tight">
                            {claim.itemName} <span className="font-mono text-xs text-slate-400">({claim.itemType})</span>
                          </h4>
                        </div>

                        <div>
                          <span className="text-[11px] text-slate-400 font-mono block">Your Letter Content:</span>
                          <p className="rounded-xl bg-slate-50 border p-3 text-xs text-slate-650 italic leading-relaxed">
                            "{claim.message}"
                          </p>
                        </div>
                      </div>

                      {/* Controls */}
                      <div className="w-full md:w-auto shrink-0 flex items-center md:flex-col gap-2 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100 justify-end">
                        <button
                          onClick={() => navigate('item-details', { type: claim.itemType, id: claim.itemId })}
                          className="flex-1 md:w-full inline-flex items-center justify-center space-x-1 rounded-lg border px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>View Item</span>
                        </button>
                        
                        {claim.requestStatus === 'Pending' && (
                          <button
                            onClick={() => handleCancelClaim(claim._id)}
                            className="flex-1 md:w-full inline-flex items-center justify-center space-x-1 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 px-3 py-2 text-xs font-semibold transition"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span>Cancel Request</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

        </div>
      )}

    </div>
  );
}
