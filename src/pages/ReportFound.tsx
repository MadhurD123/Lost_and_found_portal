import React, { useState } from 'react';
import { User } from '../types';
import { AlertCircle, Upload, Mail, Calendar, MapPin, Compass } from 'lucide-react';

interface ReportFoundProps {
  user: User | null;
  navigate: (page: string) => void;
}

const CATEGORIES = [
  'Electronics',
  'Accessories',
  'Keys',
  'Books & Documents',
  'Clothing',
  'Others'
];

export default function ReportFound({ user, navigate }: ReportFoundProps) {
  const [itemName, setItemName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Electronics');
  const [locationFound, setLocationFound] = useState('');
  const [dateFound, setDateFound] = useState(new Date().toISOString().split('T')[0]);
  const [image, setImage] = useState('');
  const [contactEmail, setContactEmail] = useState(user?.email || '');

  const [uploading, setUploading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (file: File) => {
    if (file.size > 2 * 1024 * 1024) {
      setError('File size too large. Please select an image smaller than 2MB.');
      return;
    }

    setUploading(true);
    const reader = new FileReader();
    reader.onload = () => {
      setImage(reader.result as string);
      setUploading(false);
    };
    reader.onerror = () => {
      setError('Could not process selected image file.');
      setUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError('Please log in to register a found item.');
      return;
    }

    if (!itemName || !description || !category || !locationFound || !dateFound || !contactEmail) {
      setError('Please fill in all requested fields marked with asterisks (*).');
      return;
    }

    setSubmitLoading(true);
    setError('');

    try {
      const response = await fetch('/api/found', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          itemName,
          description,
          category,
          locationFound,
          dateFound,
          image,
          contactEmail
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to submit report.');
      }

      // Success, view feed
      navigate('browse-found');
    } catch (err: any) {
      setError(err.message || 'An error occurred during submission.');
    } finally {
      setSubmitLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="mx-auto max-w-md py-16 text-center space-y-6">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
          <AlertCircle className="h-7 w-7" />
        </div>
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-slate-900 font-sans">Authentication Required</h3>
          <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
            You must be logged in with a registered student profile to create active found listings on the database.
          </p>
        </div>
        <button
          onClick={() => navigate('login')}
          className="rounded-xl bg-indigo-600 px-6 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 transition"
        >
          Student Sign In
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      
      {/* Page Header */}
      <div className="border-b border-slate-100 pb-5 mb-8">
        <h2 className="text-2xl font-extrabold tracking-tight text-slate-950">Report a Discovered (Found) Item</h2>
        <p className="text-xs text-slate-500 mt-1">Found something on campus campus bounds? Help identify and return it to its owner.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6" id="report-found-form">
        
        {error && (
          <div className="rounded-xl bg-rose-50 border border-rose-200 p-4 text-xs text-rose-700">
            {error}
          </div>
        )}

        {/* 1. Item Name & Category */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="sm:col-span-2 space-y-1">
            <label className="text-xs font-bold text-slate-700 block">Item Name / Title *</label>
            <input
              type="text"
              id="found-itemname"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              placeholder="e.g. Leather jacket size L"
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs text-slate-800 outline-none focus:bg-white focus:border-indigo-500 transition-all font-sans"
              required
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 block">Category *</label>
            <select
              id="found-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs text-slate-800 outline-none focus:bg-white focus:border-indigo-500 transition-all"
            >
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>

        {/* 2. Location & Date */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 block flex items-center space-x-1">
              <MapPin className="h-3.5 w-3.5 text-slate-400" />
              <span>Where Did You Find It? *</span>
            </label>
            <input
              type="text"
              id="found-location"
              value={locationFound}
              onChange={(e) => setLocationFound(e.target.value)}
              placeholder="e.g. Bench outside central science building"
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs text-slate-800 outline-none focus:bg-white focus:border-indigo-500 transition-all"
              required
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 block flex items-center space-x-1">
              <Calendar className="h-3.5 w-3.5 text-slate-400" />
              <span>Date Discovered *</span>
            </label>
            <input
              type="date"
              id="found-datefound"
              value={dateFound}
              onChange={(e) => setDateFound(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs text-slate-800 outline-none focus:bg-white focus:border-indigo-500 transition-all"
              required
            />
          </div>
        </div>

        {/* 3. Description details */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-700 block">Detailed Specifications *</label>
            <span className="text-[10px] text-slate-400 font-mono">Do not reveal extremely specific identifiers (avoids false claims)</span>
          </div>
          <textarea
            id="found-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the item general appearance. (e.g. 'Found a black leather coat with a metallic zipper. Left on the lawn benches outside athletic block. Safe to keep at security desk if student can identify brand details.')"
            rows={4}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-3 text-xs text-slate-800 outline-none focus:bg-white focus:border-indigo-500 transition-all leading-relaxed font-sans"
            required
          />
        </div>

        {/* 4. Drag & Drop Image Uploader */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 block">Item Photo (Optional)</label>
          <div 
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            className={`flex flex-col items-center justify-center rounded-2xl border border-dashed p-6 text-center transition-colors cursor-pointer ${
              dragActive 
                ? 'border-indigo-500 bg-indigo-50/20' 
                : image 
                  ? 'border-indigo-200 bg-indigo-50/10' 
                  : 'border-slate-300 bg-slate-50/30'
            }`}
          >
            {image ? (
              <div className="space-y-4">
                <img 
                  src={image} 
                  referrerPolicy="no-referrer"
                  alt="Item Preload" 
                  className="mx-auto max-h-40 rounded-xl object-contain border border-slate-200"
                />
                <div className="flex justify-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setImage('')}
                    className="rounded-lg bg-rose-50 border border-rose-200 px-3 py-1 font-mono text-[10px] font-bold text-rose-700 transition hover:bg-rose-100"
                  >
                    Remove Image
                  </button>
                  <label className="rounded-lg bg-slate-100 border border-slate-200 px-3 py-1 font-mono text-[10px] font-bold text-slate-700 transition hover:bg-slate-200 cursor-pointer">
                    Change Image
                    <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                  </label>
                </div>
              </div>
            ) : (
              <label className="flex flex-col items-center cursor-pointer space-y-2">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100/80 text-slate-500 border border-slate-200/50">
                  <Upload className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-800">
                    {uploading ? 'Parsing Image...' : 'Click or Drop Image Here'}
                  </p>
                  <p className="text-[10px] text-slate-400 font-mono">PNG, JPG, JPEG up to 2MB</p>
                </div>
                <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
              </label>
            )}
          </div>
        </div>

        {/* 5. Contact Information */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-700 block flex items-center space-x-1">
            <Mail className="h-3.5 w-3.5 text-slate-400" />
            <span>Best Student Contact Email *</span>
          </label>
          <input
            type="email"
            id="found-contactemail"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs text-slate-800 outline-none focus:bg-white focus:border-indigo-500 transition-all font-mono"
            required
          />
        </div>

        {/* 6. Action buttons */}
        <div className="flex gap-4 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={() => navigate('home')}
            className="flex-1 rounded-xl border border-slate-200 py-3 text-xs font-bold text-slate-700 transition hover:bg-slate-50 active:scale-95"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitLoading || uploading}
            id="btn-found-submit"
            className="flex-1 inline-flex items-center justify-center space-x-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 py-3 text-xs font-extrabold text-white transition active:scale-95 shadow-md"
          >
            <span>{submitLoading ? 'Registering Item...' : 'Publish Found Report'}</span>
          </button>
        </div>

      </form>
    </div>
  );
}
