import React, { useState } from 'react';
import { LostItem, FoundItem, User } from '../types';
import { Shield, Sparkles, Send, X, AlertTriangle } from 'lucide-react';

interface ClaimModalProps {
  item: LostItem | FoundItem | null;
  itemType: 'Lost' | 'Found' | null;
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  navigate: (page: string) => void;
}

export default function ClaimModal({ item, itemType, isOpen, onClose, user, navigate }: ClaimModalProps) {
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !item || !itemType) return null;

  const handleLoginRedirect = () => {
    onClose();
    navigate('login');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!message.trim()) {
      setError('Please provide a descriptive message explaining your claim or ownership of this item.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/claims', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          itemId: item._id,
          itemType,
          message: message.trim()
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to submit claim.');
      }

      setSuccess(true);
      setMessage('');
    } catch (err: any) {
      setError(err.message || 'An error occurred while filing the claim.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl transition-all">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-6 py-4">
          <div className="flex items-center space-x-2">
            <Shield className="h-5 w-5 text-indigo-600 animate-pulse" />
            <h3 className="text-base font-bold text-slate-900">Claim & Contact Admin</h3>
          </div>
          <button 
            onClick={onClose} 
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-150 hover:text-slate-700 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal content body */}
        <div className="p-6">
          {!user ? (
            /* Unauthenticated Prompt */
            <div className="text-center space-y-4 py-4">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
                <Shield className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-900">Login Authentication Required</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                  You must be registered and signed in to send custom verification letters to the campus administrator.
                </p>
              </div>
              <button
                onClick={handleLoginRedirect}
                className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white transition hover:bg-indigo-700 hover:shadow-sm"
              >
                Sign In to Account
              </button>
            </div>
          ) : success ? (
            /* Submission Success State */
            <div className="text-center space-y-4 py-4">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                <Send className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-900">Submit Verification Successful!</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                  Your claim request has been placed in pending admin reviews. You will receive an update from your campus officer shortly. Track status inside "My Listings".
                </p>
              </div>
              <button
                onClick={() => {
                  onClose();
                  setSuccess(false);
                }}
                className="w-full rounded-xl bg-slate-900 py-2.5 text-xs font-bold text-white transition hover:bg-slate-800"
              >
                Close Ticket
              </button>
            </div>
          ) : (
            /* Standard Claims Form */
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Item Info Box */}
              <div className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-4">
                <span className="text-[10px] uppercase font-mono tracking-wider font-bold text-indigo-600">
                  Target Product Details ({itemType})
                </span>
                <h4 className="text-sm font-extrabold text-slate-900 leading-tight mt-0.5">
                  {item.itemName}
                </h4>
                <p className="text-xs text-slate-500 line-clamp-1 mt-1 font-mono">
                  Reported by: @{item.username} • {new Date(item.createdAt).toLocaleDateString()}
                </p>
              </div>

              {item.userId === user.userId && (
                <div className="flex items-start space-x-2 rounded-xl bg-rose-50 border border-rose-200 p-3 text-rose-800 text-xs leading-normal">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-rose-500 mt-0.5" />
                  <span>
                    <strong>Caution:</strong> This is a listing reported by you. You cannot assert claim requests on your own entries.
                  </span>
                </div>
              )}

              {/* Input Message field */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">
                  Custom Verification / Claim Message to Administrator
                </label>
                <textarea
                  id="claim-text-message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Explain why this item belongs to you, or where the administrator can find you. (i.e. 'Hello, I think this iPad is mine. I left it on table 4 in blocked floor 2 of library around 3 PM on Tuesday. The device password is...')"
                  rows={4}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-xs outline-none focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-500 font-sans"
                />
              </div>

              {error && (
                <div className="text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-xl px-4 py-2.5 font-sans">
                  {error}
                </div>
              )}

              {/* Action buttons */}
              <div className="flex items-center space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 rounded-xl border border-slate-200 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || item.userId === user.userId}
                  className="flex-1 inline-flex items-center justify-center space-x-1.5 rounded-xl bg-indigo-600 py-2.5 text-xs font-bold text-white transition hover:bg-indigo-700 disabled:opacity-55 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Filing Claim...' : (
                    <>
                      <Send className="h-3.5 w-3.5" />
                      <span>Submit Claim Request</span>
                    </>
                  )}
                </button>
              </div>

            </form>
          )}
        </div>

      </div>
    </div>
  );
}
