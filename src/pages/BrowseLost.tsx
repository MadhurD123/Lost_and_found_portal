import React, { useState, useEffect } from 'react';
import { LostItem } from '../types';
import ItemCard from '../components/ItemCard';
import { Search, SlidersHorizontal, Grid3X3, RotateCcw, ArrowRight } from 'lucide-react';

interface BrowseLostProps {
  initialSearch?: string;
  navigate: (page: string, params?: any) => void;
  onContactAdmin: (item: any, type: 'Lost' | 'Found') => void;
}

const CATEGORIES = [
  'All',
  'Electronics',
  'Accessories',
  'Keys',
  'Books & Documents',
  'Clothing',
  'Others'
];

export default function BrowseLost({ initialSearch = '', navigate, onContactAdmin }: BrowseLostProps) {
  const [items, setItems] = useState<LostItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filtering criteria
  const [search, setSearch] = useState(initialSearch);
  const [category, setCategory] = useState('All');
  const [status, setStatus] = useState('All');

  // Trigger reloading on criteria updates
  const loadListings = async () => {
    setLoading(true);
    setError('');
    try {
      // Build query parameters
      const params = new URLSearchParams();
      if (category !== 'All') params.append('category', category);
      if (status !== 'All') params.append('status', status);
      if (search.trim() !== '') params.append('search', search.trim());

      const response = await fetch(`/api/lost?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Could not pull active lost reports.');
      }
      const data = await response.json();
      setItems(data);
    } catch (err: any) {
      setError(err.message || 'Error occurred.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadListings();
  }, [category, status]); // automatically fetch if click options

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadListings();
  };

  const handleResetFilters = () => {
    setSearch('');
    setCategory('All');
    setStatus('All');
    // will trigger reload due to state mutation
  };

  return (
    <div className="space-y-8 pb-16">
      
      {/* Page Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-950">Browse Lost Items Registry</h2>
          <p className="text-xs text-slate-500 mt-1">Search reports submitted by students seeking their misplaced campus gear.</p>
        </div>
        <button
          onClick={() => navigate('report-lost')}
          className="rounded-xl bg-orange-600 hover:bg-orange-700 font-semibold px-4 py-2.5 text-xs text-white shadow-sm flex items-center justify-center space-x-1.5 self-start"
        >
          <span>Report Your Lost Item</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* SEARCH AND COMPLEX FILTERS BAR */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs" id="browse-lost-filters-panel">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 gap-4 md:grid-cols-4">
          
          {/* Quick Search queries */}
          <div className="md:col-span-2 relative flex items-center rounded-xl bg-slate-50 border border-slate-200 focus-within:border-indigo-500 focus-within:bg-white transition-all">
            <Search className="h-4 w-4 text-slate-400 absolute left-3.5" />
            <input
              type="text"
              id="lost-search-field"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by keywords or poster username..."
              className="w-full bg-transparent py-2.5 pl-10 pr-4 text-xs text-slate-800 outline-none"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="text-[10px] uppercase font-mono font-bold text-slate-400 px-3 hover:text-slate-700"
              >
                Clear
              </button>
            )}
          </div>

          {/* Category SELECT filter */}
          <div className="relative flex items-center rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-3.5 select-none font-mono">Category</span>
            <select
              value={category}
              id="lost-filter-category"
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-transparent py-2.5 px-3 text-xs text-slate-700 outline-none font-sans"
            >
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Status SELECT filter */}
          <div className="relative flex items-center rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-3.5 select-none font-mono">Status</span>
            <select
              value={status}
              id="lost-filter-status"
              onChange={(e) => setStatus(e.target.value)}
              className="w-full bg-transparent py-2.5 px-3 text-xs text-slate-700 outline-none font-sans"
            >
              <option value="All">All Statuses</option>
              <option value="Searching">Searching</option>
              <option value="Matched">Matched</option>
              <option value="Returned">Returned</option>
            </select>
          </div>

        </form>

        {/* Clear/Search Actions toolbar */}
        <div className="flex items-center justify-between border-t border-slate-50 pt-3 mt-3 text-xs">
          <div className="flex items-center space-x-2 text-slate-400 font-mono text-[10px]">
            <SlidersHorizontal className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <span>Refining lost records database</span>
          </div>

          <div className="flex space-x-2">
            {(search || category !== 'All' || status !== 'All') && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center space-x-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 transition"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Reset Filters</span>
              </button>
            )}
            <button
              onClick={loadListings}
              className="inline-flex items-center space-x-1 rounded-lg bg-indigo-600 px-4 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 transition"
            >
              <span>Apply Filters</span>
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-xl bg-rose-50 border border-rose-200 p-4 text-xs text-rose-700">
          {error}
        </div>
      )}

      {/* LISTINGS RESULTS */}
      {loading ? (
        <div className="py-24 text-center text-slate-400 font-mono text-xs animate-pulse">
          Reviewing university central lost registry...
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-3xl border-2 border-dashed border-slate-200 p-16 text-center space-y-4">
          <Grid3X3 className="mx-auto h-12 w-12 text-slate-300" />
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-slate-900">No Matching Lost Items Found</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              We couldn't locate any active listings matching your current filter criteria on campus database registers.
            </p>
          </div>
          <button
            onClick={handleResetFilters}
            className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
          >
            Clear Active Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3" id="browse-lost-items-grid">
          {items.map(item => {
            const cardProps: any = {
              item,
              type: 'Lost',
              onViewDetails: (id: string) => navigate('item-details', { type: 'Lost', id }),
              onContactAdmin: (itm: any) => onContactAdmin(itm, 'Lost')
            };
            return (
              <ItemCard key={item._id} {...cardProps} />
            );
          })}
        </div>
      )}

    </div>
  );
}
