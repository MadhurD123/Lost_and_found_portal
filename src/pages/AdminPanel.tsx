import React, { useState, useEffect } from 'react';
import { LostItem, FoundItem, ClaimRequest, ChartStats } from '../types';
import { Shield, Sparkles, Check, X, Trash2, ArrowUpRight, Grid, FileText, AlertTriangle } from 'lucide-react';

interface AdminPanelProps {
  navigate: (page: string, params?: any) => void;
}

export default function AdminPanel({ navigate }: AdminPanelProps) {
  const [stats, setStats] = useState<ChartStats | null>(null);
  const [claims, setClaims] = useState<ClaimRequest[]>([]);
  const [lostItems, setLostItems] = useState<LostItem[]>([]);
  const [foundItems, setFoundItems] = useState<FoundItem[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeSegment, setActiveSegment] = useState<'claims' | 'lost' | 'found'>('claims');

  const loadAdminMetrics = async () => {
    setLoading(true);
    setError('');
    try {
      const headers = {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      };

      const [statsRes, claimsRes, lostRes, foundRes] = await Promise.all([
        fetch('/api/admin/stats', { headers }),
        fetch('/api/claims', { headers }),
        fetch('/api/lost'),
        fetch('/api/found')
      ]);

      if (!statsRes.ok) {
        if (statsRes.status === 403) {
          throw new Error('Access Denied. Admin credentials required.');
        }
        throw new Error('Could not pull metrics logs.');
      }

      const statsData = await statsRes.json();
      const claimsData = await claimsRes.json();
      const lostData = await lostRes.json();
      const foundData = await foundRes.json();

      setStats(statsData);
      setClaims(claimsData);
      setLostItems(lostData);
      setFoundItems(foundData);
    } catch (err: any) {
      setError(err.message || 'An error occurred during loading.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminMetrics();
  }, []);

  const handleUpdateClaim = async (claimId: string, status: 'Approved' | 'Rejected') => {
    try {
      const response = await fetch(`/api/claims/${claimId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ requestStatus: status })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update claim.');
      }

      // Success, refresh
      loadAdminMetrics();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeleteInappropriatePost = async (type: 'Lost' | 'Found', itemId: string) => {
    if (!window.confirm('Moderator warning: Are you sure you want to permanently delete this listing from Central student collections?')) return;
    try {
      const url = type === 'Lost' ? `/api/lost/${itemId}` : `/api/found/${itemId}`;
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete user report.');
      }

      loadAdminMetrics();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleUpdateItemStatus = async (type: 'Lost' | 'Found', itemId: string, newStatus: string) => {
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
        throw new Error('Status configuration error.');
      }

      loadAdminMetrics();
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center text-slate-400 font-mono text-xs animate-pulse">
        Retrieving administrative metrics console...
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-md py-16 text-center space-y-6" id="admin-denied-view">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 border border-amber-200">
          <Shield className="h-7 w-7" />
        </div>
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-slate-900">Moderator Access Forbidden</h3>
          <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
            {error || 'You require admin clearance to view the monitoring board. Log out and sign in with the admin profile.'}
          </p>
        </div>
        <button
          onClick={() => navigate('home')}
          className="rounded-xl border px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
        >
          Return Home
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16" id="admin-workspace-view">
      
      {/* Executive Header */}
      <div className="border-b border-slate-100 pb-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-1.5 text-[10px] text-indigo-600 font-bold uppercase tracking-wider font-mono">
            <Shield className="h-4 w-4" />
            <span>EXECUTIVE SYSTEMS WORKSPACE</span>
          </div>
          <h2 className="text-2xl font-black text-slate-950 tracking-tight mt-0.5">Moderator Admin Center</h2>
        </div>
        <div className="rounded-xl bg-orange-50 border px-3 py-1.5 text-xs text-orange-850 font-mono flex items-center space-x-1">
          <Sparkles className="h-3.5 w-3.5 text-orange-500 shrink-0" />
          <span>MongoDB and Fallback local files fully synchronized</span>
        </div>
      </div>

      {/* KPI METRICS SHEETS */}
      {stats && (
        <section className="grid grid-cols-2 gap-4 sm:grid-cols-4" id="admin-kpi-sheets">
          <div className="rounded-2xl border bg-slate-50 p-5 shadow-2xs">
            <span className="text-[10px] uppercase font-bold tracking-wider font-mono text-slate-400 block">Reported Lost</span>
            <div className="flex items-baseline space-x-2 mt-1">
              <span className="text-2xl font-black tracking-tight text-slate-900">{stats.counts.lost}</span>
              <span className="text-xs text-slate-400">{stats.lostStatus.Searching} Active</span>
            </div>
          </div>
          <div className="rounded-2xl border bg-slate-50 p-5 shadow-2xs">
            <span className="text-[10px] uppercase font-bold tracking-wider font-mono text-slate-400 block">Reported Found</span>
            <div className="flex items-baseline space-x-2 mt-1">
              <span className="text-2xl font-black tracking-tight text-slate-900">{stats.counts.found}</span>
              <span className="text-xs text-slate-400">{stats.foundStatus.Available} Free</span>
            </div>
          </div>
          <div className="rounded-2xl border bg-slate-50 p-5 shadow-2xs">
            <span className="text-[10px] uppercase font-bold tracking-wider font-mono text-slate-400 block">Claims Tickets</span>
            <div className="flex items-baseline space-x-2 mt-1">
              <span className="text-2xl font-black tracking-tight text-slate-900">{stats.counts.claims}</span>
              <span className="text-xs text-amber-600 font-bold">{stats.claimRequests.Pending} Pending</span>
            </div>
          </div>
          <div className="rounded-2xl border bg-slate-50 p-5 shadow-2xs">
            <span className="text-[10px] uppercase font-bold tracking-wider font-mono text-slate-400 block">Total Database Users</span>
            <div className="flex items-baseline space-x-2 mt-1">
              <span className="text-2xl font-black tracking-tight text-slate-900">{stats.counts.usersCount}</span>
              <span className="text-xs text-slate-400 font-mono">Registered</span>
            </div>
          </div>
        </section>
      )}

      {/* SEGMENT TOGGLES */}
      <div className="flex border-b border-slate-200" id="admin-segment-toggles">
        <button
          onClick={() => setActiveSegment('claims')}
          className={`px-6 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition ${
            activeSegment === 'claims'
              ? 'border-indigo-600 text-indigo-600 bg-indigo-50/5'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Claims Verification Tickets ({claims.length})
        </button>
        <button
          onClick={() => setActiveSegment('lost')}
          className={`px-6 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition ${
            activeSegment === 'lost'
              ? 'border-indigo-600 text-indigo-600 bg-indigo-50/5'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Manage Lost Listings ({lostItems.length})
        </button>
        <button
          onClick={() => setActiveSegment('found')}
          className={`px-6 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition ${
            activeSegment === 'found'
              ? 'border-indigo-600 text-indigo-600 bg-indigo-50/5'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Manage Found Listings ({foundItems.length})
        </button>
      </div>

      {/* CORE SEGMENT CONTENTS */}
      <div className="space-y-4">
        
        {/* A. CLAIMS MANAGEMENT SEGMENT */}
        {activeSegment === 'claims' && (
          <div className="space-y-4" id="admin-claims-moderator-container">
            {claims.length === 0 ? (
              <div className="rounded-2xl border border-dashed text-slate-400 p-12 text-center text-xs">
                No claim letters filed on campus records yet.
              </div>
            ) : (
              claims.map(claim => {
                const statusTheme: Record<string, string> = {
                  'Pending': 'bg-amber-100 text-amber-800',
                  'Approved': 'bg-emerald-100 text-emerald-800',
                  'Rejected': 'bg-rose-100 text-rose-800'
                };
                return (
                  <div key={claim._id} className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4 shadow-sm relative overflow-hidden">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-50 pb-2">
                      <div className="flex items-center space-x-2 text-xs">
                        <span className="font-extrabold text-slate-900">{claim.claimantUsername} (@{claim.claimantUsername})</span>
                        <span className="text-slate-300">•</span>
                        <span className="text-slate-400 font-mono text-[10.5px]">{claim.claimantEmail}</span>
                      </div>
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${statusTheme[claim.requestStatus] || 'bg-slate-100'}`}>
                        {claim.requestStatus}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans">
                      <div className="space-y-1">
                        <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider font-mono block">Item Claiming Target:</span>
                        <h4 className="font-extrabold text-slate-900 text-sm leading-tight">
                          {claim.itemName} <span className="text-xs text-slate-400 font-mono">({claim.itemType})</span>
                        </h4>
                        <span className="text-slate-400 block mt-0.5 text-[11px]">Reported posted by: @{claim.itemPoster}</span>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider font-mono block">Message letter details:</span>
                        <p className="rounded-xl border bg-slate-50 p-2.5 italic text-slate-700 leading-normal text-xs">
                          "{claim.message}"
                        </p>
                      </div>
                    </div>

                    {/* Operational Approvals */}
                    {claim.requestStatus === 'Pending' && (
                      <div className="flex justify-end gap-2 border-t border-slate-50 pt-3">
                        <button
                          onClick={() => handleUpdateClaim(claim._id, 'Rejected')}
                          className="rounded-lg border px-3 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50 transition inline-flex items-center space-x-1"
                        >
                          <X className="h-3.5 w-3.5" />
                          <span>Reject Claim</span>
                        </button>
                        <button
                          onClick={() => handleUpdateClaim(claim._id, 'Approved')}
                          className="rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 shadow-2xs transition inline-flex items-center space-x-1"
                        >
                          <Check className="h-3.5 w-3.5" />
                          <span>Approve & Cascade Resolve</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* B. LOST LISTINGS MANAGEMENT CENTRAL */}
        {activeSegment === 'lost' && (
          <div className="space-y-4" id="admin-lost-moderator-container">
            {lostItems.length === 0 ? (
              <div className="rounded-2xl border border-dashed text-slate-400 p-12 text-center text-xs">
                No active lost items entries inside central table catalog.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-205">
                <table className="min-w-full divide-y divide-slate-200 text-left text-xs bg-white">
                  <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    <tr>
                      <th className="p-4">Item Name</th>
                      <th className="p-4">Category</th>
                      <th className="p-4">Location</th>
                      <th className="p-4">Poster Tag</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Moderations</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {lostItems.map(item => (
                      <tr key={item._id} className="hover:bg-slate-50/50">
                        <td className="p-4 font-semibold text-slate-900 truncate max-w-xs">{item.itemName}</td>
                        <td className="p-4 font-mono text-indigo-600">{item.category}</td>
                        <td className="p-4 truncate max-w-xs">{item.locationLost}</td>
                        <td className="p-4">@{item.username}</td>
                        <td className="p-4">
                          <select
                            value={item.status}
                            onChange={(e) => handleUpdateItemStatus('Lost', item._id, e.target.value)}
                            className="rounded-lg border bg-slate-50 px-2 py-1 text-xs"
                          >
                            <option value="Searching">Searching</option>
                            <option value="Matched">Matched</option>
                            <option value="Returned">Returned</option>
                          </select>
                        </td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => handleDeleteInappropriatePost('Lost', item._id)}
                            className="rounded-lg border p-1.5 text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition"
                            title="Delete listing (Moderation)"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* C. FOUND LISTINGS MANAGEMENT CENTRAL */}
        {activeSegment === 'found' && (
          <div className="space-y-4" id="admin-found-moderator-container">
            {foundItems.length === 0 ? (
              <div className="rounded-2xl border border-dashed text-slate-400 p-12 text-center text-xs">
                No active discovered items entries inside central table catalog.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-205">
                <table className="min-w-full divide-y divide-slate-200 text-left text-xs bg-white">
                  <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    <tr>
                      <th className="p-4">Item Name</th>
                      <th className="p-4">Category</th>
                      <th className="p-4">Location</th>
                      <th className="p-4">Poster Tag</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Moderations</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {foundItems.map(item => (
                      <tr key={item._id} className="hover:bg-slate-50/50">
                        <td className="p-4 font-semibold text-slate-900 truncate max-w-xs">{item.itemName}</td>
                        <td className="p-4 font-mono text-indigo-600">{item.category}</td>
                        <td className="p-4 truncate max-w-xs">{item.locationFound}</td>
                        <td className="p-4">@{item.username}</td>
                        <td className="p-4">
                          <select
                            value={item.status}
                            onChange={(e) => handleUpdateItemStatus('Found', item._id, e.target.value)}
                            className="rounded-lg border bg-slate-50 px-2 py-1 text-xs"
                          >
                            <option value="Available">Available</option>
                            <option value="Claimed">Claimed</option>
                            <option value="Returned">Returned</option>
                          </select>
                        </td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => handleDeleteInappropriatePost('Found', item._id)}
                            className="rounded-lg border p-1.5 text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition"
                            title="Delete listing (Moderation)"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

      </div>

    </div>
  );
}
