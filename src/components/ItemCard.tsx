import React from 'react';
import { LostItem, FoundItem } from '../types';
import { MapPin, Calendar, User, Eye, Sparkles, Tag, CheckCircle2 } from 'lucide-react';

interface ItemCardProps {
  item: LostItem | FoundItem;
  type: 'Lost' | 'Found';
  onViewDetails: (id: string) => void;
  onContactAdmin: (item: any) => void;
}

export default function ItemCard({ item, type, onViewDetails, onContactAdmin }: ItemCardProps) {
  const isLost = type === 'Lost';
  const statusColors: Record<string, string> = {
    'Searching': 'bg-rose-50 text-rose-700 border-rose-200',
    'Matched': 'bg-amber-50 text-amber-700 border-amber-200',
    'Returned': 'bg-indigo-50 text-indigo-700 border-indigo-200',
    'Available': 'bg-emerald-50 text-emerald-700 border-emerald-200',
    'Claimed': 'bg-orange-50 text-orange-700 border-orange-200',
  };

  const statusBg = statusColors[item.status] || 'bg-slate-50 text-slate-700 border-slate-200';

  // Base64 or standard default placeholder SVG
  const displayImage = item.image || `https://images.unsplash.com/photo-1501504905252-473c47e087f8?auto=format&fit=crop&q=80&w=600`;

  return (
    <div 
      id={`item-card-${item._id}`}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
    >
      {/* Visual Header Image Section */}
      <div className="relative h-48 w-full overflow-hidden bg-slate-100">
        <img 
          src={displayImage} 
          referrerPolicy="no-referrer"
          alt={item.itemName} 
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        
        {/* Type Badge top left */}
        <span className={`absolute top-3 left-3 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider shadow-sm border ${
          isLost 
            ? 'bg-rose-600 border-rose-600 text-white' 
            : 'bg-emerald-600 border-emerald-600 text-white'
        }`}>
          {type}
        </span>

        {/* Status Badge top right */}
        <span className={`absolute top-3 right-3 rounded-full border px-2.5 py-1 text-xs font-semibold shadow-sm ${statusBg}`}>
          {item.status}
        </span>

        {/* Shimmer overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        
        {/* Quick View Button on Image */}
        <button
          onClick={() => onViewDetails(item._id)}
          className="absolute bottom-3 right-3 flex items-center space-x-1.5 rounded-lg bg-white/90 backdrop-blur-sm px-2.5 py-1.5 text-xs font-bold text-slate-800 shadow-sm opacity-0 transform translate-y-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0 hover:bg-white"
        >
          <Eye className="h-3.5 w-3.5" />
          <span>Quick Inspect</span>
        </button>
      </div>

      {/* Content Info Section */}
      <div className="flex flex-1 flex-col p-5">
        
        {/* Category tag */}
        <span className="flex items-center space-x-1 text-xs font-mono font-medium text-slate-500 uppercase tracking-widest mb-1.5">
          <Tag className="h-3 w-3" />
          <span>{item.category}</span>
        </span>

        {/* Title */}
        <h3 className="line-clamp-1 text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
          {item.itemName}
        </h3>

        {/* Description */}
        <p className="mt-1 flex-1 line-clamp-2 text-xs text-slate-600 leading-relaxed">
          {item.description}
        </p>

        {/* Specifications metadata container */}
        <div className="mt-4 space-y-2 border-t border-slate-100 pt-3 text-xs text-slate-500">
          <div className="flex items-center space-x-2">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
            <span className="truncate">
              <strong>Loc:</strong> {isLost ? (item as LostItem).locationLost : (item as FoundItem).locationFound}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <Calendar className="h-3.5 w-3.5 shrink-0 text-slate-400" />
            <span>
              <strong>Date:</strong> {isLost ? (item as LostItem).dateLost : (item as FoundItem).dateFound}
            </span>
          </div>

          <div className="flex items-center justify-between border-t border-slate-50 pt-2 text-[11px]">
            <div className="flex items-center space-x-1 text-slate-400">
              <User className="h-3 w-3 shrink-0" />
              <span className="truncate">@{item.username}</span>
            </div>
            <span className="text-slate-400 font-mono text-[10px]">
              {new Date(item.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Interactive action buttons */}
        <div className="mt-4 flex items-center space-x-2">
          <button
            onClick={() => onViewDetails(item._id)}
            className="flex-1 rounded-xl border border-slate-200 bg-white py-2 text-center text-xs font-bold text-slate-700 transition hover:bg-slate-50 hover:text-slate-900 active:scale-95"
          >
            Details
          </button>
          
          {item.status !== 'Returned' && item.status !== 'Claimed' ? (
            <button
              onClick={() => onContactAdmin(item)}
              className="rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-bold text-white transition hover:bg-slate-800 hover:shadow-sm active:scale-95"
            >
              Contact Admin
            </button>
          ) : (
            <div className="flex items-center justify-center space-x-1 rounded-xl bg-slate-100 px-3.5 py-2 text-xs font-bold text-slate-500 border border-slate-200">
              <CheckCircle2 className="h-3.5 w-3.5 text-slate-400" />
              <span>Resolved</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
