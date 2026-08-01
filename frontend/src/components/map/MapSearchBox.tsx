'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { MagnifyingGlassIcon, MapPinIcon, DocumentTextIcon, BuildingOfficeIcon, XMarkIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import api from '@/lib/api';
import { categoryEmoji, categoryLabel } from '@/lib/map-data';

interface GeocodeResult {
  lat: number;
  lng: number;
  displayName: string;
  type: string;
  city?: string;
  pincode?: string;
}

interface IssueResult {
  id: string;
  title: string;
  address: string;
  category: string;
  status: string;
  priority: string;
  location: { lat: number; lng: number } | null;
}

interface DeptResult {
  id: string;
  name: string;
  code: string;
}

export interface SearchSelection {
  kind: 'place' | 'issue' | 'department';
  lat?: number;
  lng?: number;
  issueId?: string;
  name?: string;
}

interface MapSearchBoxProps {
  onSelect: (sel: SearchSelection) => void;
  onLoadingChange?: (loading: boolean) => void;
}

export default function MapSearchBox({ onSelect, onLoadingChange }: MapSearchBoxProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ geocoded: GeocodeResult[]; issues: IssueResult[]; departments: DeptResult[] } | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  const search = useCallback(
    async (q: string) => {
      if (q.trim().length < 3) {
        setResults(null);
        setError(null);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const { data } = await api.get('/gis/search', { params: { q: q.trim() } });
        const payload = data?.data || data;
        setResults({
          geocoded: payload?.geocoded || [],
          issues: payload?.issues || [],
          departments: payload?.departments || [],
        });
      } catch (e: any) {
        setError(e?.response?.data?.message || 'Search failed');
        setResults(null);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(query), 400);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, search]);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  useEffect(() => { onLoadingChange?.(loading); }, [loading, onLoadingChange]);

  const totalResults = results ? results.geocoded.length + results.issues.length + results.departments.length : 0;

  return (
    <div ref={boxRef} className="relative w-full">
      <div className="flex items-center gap-2 bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl rounded-xl shadow-lg px-3 py-2 border border-slate-200 dark:border-slate-700">
        {loading ? (
          <ArrowPathIcon className="w-4 h-4 text-slate-400 animate-spin" />
        ) : (
          <MagnifyingGlassIcon className="w-4 h-4 text-slate-400" />
        )}
        <input
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder="Search address, landmark, ward, PIN code, department..."
          className="flex-1 bg-transparent text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 outline-none"
        />
        {query && (
          <button onClick={() => { setQuery(''); setResults(null); setOpen(false); }} className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700">
            <XMarkIcon className="w-3.5 h-3.5 text-slate-400" />
          </button>
        )}
      </div>

      {open && query.trim().length >= 3 && (
        <div className="absolute top-full left-0 right-0 mt-2 z-[1200] bg-white/98 dark:bg-slate-800/98 backdrop-blur-xl rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 max-h-[50vh] overflow-y-auto">
          {error ? (
            <p className="text-xs text-red-500 px-4 py-3">{error}</p>
          ) : loading && totalResults === 0 ? (
            <p className="text-xs text-slate-400 px-4 py-3 flex items-center gap-2">
              <ArrowPathIcon className="w-3 h-3 animate-spin" /> Searching...
            </p>
          ) : totalResults === 0 ? (
            <p className="text-xs text-slate-400 px-4 py-3">No results found</p>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-700">
              {results?.geocoded.length ? (
                <>
                  <p className="px-4 pt-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">Places &amp; Landmarks</p>
                  {results.geocoded.map((g, i) => (
                    <button
                      key={`g-${i}`}
                      onClick={() => {
                        onSelect({ kind: 'place', lat: g.lat, lng: g.lng, name: g.displayName });
                        setOpen(false);
                      }}
                      className="w-full text-left px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-700/60 flex items-start gap-2"
                    >
                      <MapPinIcon className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                      <span className="min-w-0">
                        <span className="block text-xs font-medium text-slate-800 dark:text-slate-100 truncate">{g.displayName}</span>
                        <span className="block text-[10px] text-slate-400">
                          {g.type} · {g.pincode || g.city || 'No PIN'}
                        </span>
                      </span>
                    </button>
                  ))}
                </>
              ) : null}

              {results?.issues.length ? (
                <>
                  <p className="px-4 pt-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">Issues</p>
                  {results.issues.map((iss) => (
                    <button
                      key={`i-${iss.id}`}
                      onClick={() => {
                        onSelect({ kind: 'issue', issueId: iss.id, name: iss.title });
                        setOpen(false);
                      }}
                      className="w-full text-left px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-700/60 flex items-start gap-2"
                    >
                      <span className="text-sm leading-none mt-0.5">{categoryEmoji(iss.category)}</span>
                      <span className="min-w-0">
                        <span className="block text-xs font-medium text-slate-800 dark:text-slate-100 truncate">{iss.title}</span>
                        <span className="block text-[10px] text-slate-400 truncate">
                          {categoryLabel(iss.category)} · {iss.address || 'No address'} · {iss.status}
                        </span>
                      </span>
                    </button>
                  ))}
                </>
              ) : null}

              {results?.departments.length ? (
                <>
                  <p className="px-4 pt-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">Departments</p>
                  {results.departments.map((d) => (
                    <button
                      key={`d-${d.id}`}
                      onClick={() => {
                        onSelect({ kind: 'department', name: d.name });
                        setOpen(false);
                      }}
                      className="w-full text-left px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-700/60 flex items-start gap-2"
                    >
                      <BuildingOfficeIcon className="w-4 h-4 text-slate-500 mt-0.5 flex-shrink-0" />
                      <span className="min-w-0">
                        <span className="block text-xs font-medium text-slate-800 dark:text-slate-100 truncate">{d.name}</span>
                        <span className="block text-[10px] text-slate-400 uppercase">{d.code}</span>
                      </span>
                    </button>
                  ))}
                </>
              ) : null}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
