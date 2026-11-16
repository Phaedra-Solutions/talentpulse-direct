'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, Plus, Sparkles } from 'lucide-react';
import { Technology } from '@/types/roles-tech';
import { canonicalTechKey, findBestMatchingTechnology } from '@/lib/tech-normalization';

interface TechAutocompleteProps {
  roleSlugOrId: string;
  selectedTechs: string[];
  onSelectTech: (techName: string, isCustom?: boolean) => void;
  availableRoleTechs?: Technology[];
}

export function TechAutocomplete({
  roleSlugOrId: _roleSlugOrId,
  selectedTechs,
  onSelectTech,
  availableRoleTechs = [],
}: TechAutocompleteProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [remoteTechs, setRemoteTechs] = useState<Technology[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Debounced server-side query (replaces stale mount limit=50 fetch)
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      return;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const params = new URLSearchParams({
          status: 'approved',
          query: trimmed,
          limit: '15',
          page: '1',
        });
        const res = await fetch(`/api/technologies?${params.toString()}`);
        const data = await res.json();
        if (!cancelled && data.success && Array.isArray(data.technologies)) {
          setRemoteTechs(data.technologies);
        }
      } catch {
        // Silent fallback to local availableRoleTechs pool
      } finally {
        if (!cancelled) setIsSearching(false);
      }
    }, 200);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  // Combined pool of role techs + remote search hits
  const combinedPool = useMemo(() => {
    const activeRemote = query.trim().length >= 2 ? remoteTechs : [];
    const pool = [...availableRoleTechs, ...activeRemote];
    return Array.from(new Map(pool.map((item) => [item.id, item])).values());
  }, [availableRoleTechs, remoteTechs, query]);

  // Filter & rank suggestions (includes canonical alias matching so typing "NextJS" suggests "Next.js")
  const suggestions = useMemo(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) return [];

    const lowerQuery = trimmed.toLowerCase();
    const queryCanon = canonicalTechKey(trimmed);
    const selectedCanonKeys = new Set(
      selectedTechs.map((t) => canonicalTechKey(t) || t.toLowerCase().trim())
    );

    const matched = combinedPool.filter((tech) => {
      const techCanon = canonicalTechKey(tech.name) || tech.name.toLowerCase().trim();
      if (selectedCanonKeys.has(techCanon)) return false;

      const lowerName = tech.name.toLowerCase();
      return (
        lowerName.includes(lowerQuery) ||
        (queryCanon.length >= 2 && techCanon.includes(queryCanon))
      );
    });

    matched.sort((a, b) => {
      const aCanonExact = canonicalTechKey(a.name) === queryCanon;
      const bCanonExact = canonicalTechKey(b.name) === queryCanon;
      if (aCanonExact && !bCanonExact) return -1;
      if (!aCanonExact && bCanonExact) return 1;

      const aStarts = a.name.toLowerCase().startsWith(lowerQuery);
      const bStarts = b.name.toLowerCase().startsWith(lowerQuery);
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;
      return a.name.localeCompare(b.name);
    });

    return matched.slice(0, 10);
  }, [query, selectedTechs, combinedPool]);

  // Detect if typed input maps canonically to an existing system skill before submitting custom
  const canonicalDuplicateMatch = useMemo(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) return null;
    return findBestMatchingTechnology(trimmed, combinedPool, { allowFuzzy: true });
  }, [query, combinedPool]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isAlreadySelected = (name: string) => {
    const candidateCanon = canonicalTechKey(name) || name.toLowerCase().trim();
    return selectedTechs.some(
      (t) => (canonicalTechKey(t) || t.toLowerCase().trim()) === candidateCanon
    );
  };

  const handleSelectSuggestion = (techName: string) => {
    if (!isAlreadySelected(techName)) {
      onSelectTech(techName, false);
    }
    setQuery('');
    setIsOpen(false);
  };

  const handleAddCustom = () => {
    const trimmed = query.trim();
    if (trimmed.length < 2) return;

    if (isAlreadySelected(trimmed)) {
      setQuery('');
      setIsOpen(false);
      return;
    }

    if (canonicalDuplicateMatch) {
      const matchedName = canonicalDuplicateMatch.match.name;
      if (!isAlreadySelected(matchedName)) {
        onSelectTech(matchedName, false);
      }
    } else {
      onSelectTech(trimmed, true);
    }

    setQuery('');
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (canonicalDuplicateMatch) {
        handleSelectSuggestion(canonicalDuplicateMatch.match.name);
      } else if (suggestions.length > 0) {
        handleSelectSuggestion(suggestions[0].name);
      } else {
        handleAddCustom();
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const trimmedQuery = query.trim();
  const hasCanonicalMatch = Boolean(canonicalDuplicateMatch);

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-3 text-[#111113]/40" />
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(e.target.value.trim().length >= 2);
            }}
            onFocus={() => {
              if (query.trim().length >= 2) setIsOpen(true);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type at least 2 characters to search technologies (e.g. Py, K8, Re)..."
            className="w-full font-mono text-xs pl-9 pr-3.5 py-2.5 border-2 border-[#111113] bg-white text-[#111113] placeholder:text-[#111113]/40 focus:outline-hidden focus:border-[#FF4D00]"
          />
        </div>

        <button
          type="button"
          onClick={handleAddCustom}
          disabled={trimmedQuery.length < 2 || isAlreadySelected(trimmedQuery)}
          className={`px-4 py-2 border-2 border-[#111113] font-mono text-xs font-bold uppercase transition flex items-center gap-1.5 shrink-0 ${
            trimmedQuery.length >= 2 && !isAlreadySelected(trimmedQuery)
              ? 'bg-[#111113] text-white hover:bg-[#FF4D00] shadow-[2px_2px_0px_0px_#111113]'
              : 'bg-zinc-200 text-zinc-400 border-zinc-300 cursor-not-allowed'
          }`}
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{hasCanonicalMatch ? 'Select Match' : 'Add Custom'}</span>
        </button>
      </div>

      {/* Autocomplete Suggestions Dropdown */}
      {isOpen && trimmedQuery.length >= 2 && (
        <div className="absolute left-0 right-0 top-full mt-1 z-30 bg-white border-2 border-[#111113] shadow-[4px_4px_0px_0px_#111113] max-h-64 overflow-y-auto">
          <div className="p-2 bg-[#F8F7F4] border-b border-[#111113]/20 flex items-center justify-between font-mono text-[10px] text-[#111113]/60 uppercase">
            <span>System Suggestions (Press Enter to select)</span>
            <span>{isSearching ? 'Searching...' : `${suggestions.length} found`}</span>
          </div>

          {suggestions.length > 0 ? (
            <div className="divide-y divide-[#111113]/10">
              {suggestions.map((tech) => (
                <button
                  key={tech.id}
                  type="button"
                  onClick={() => handleSelectSuggestion(tech.name)}
                  className="w-full text-left px-3.5 py-2 text-xs font-mono flex items-center justify-between hover:bg-[#FF4D00]/10 transition-colors group"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#111113] group-hover:text-[#FF4D00]">
                      {tech.name}
                    </span>
                    {tech.is_featured && (
                      <span className="text-[9px] uppercase px-1.5 py-0.2 bg-[#FF4D00]/10 text-[#FF4D00] font-bold">
                        Featured
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-[#111113]/50 uppercase flex items-center gap-1">
                    <Plus className="w-3 h-3 text-[#FF4D00]" />
                    <span>Select</span>
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div className="p-3 text-center font-mono text-xs text-[#111113]/60">
              {isSearching ? 'Searching approved library...' : 'No matching existing technologies found.'}
            </div>
          )}

          {/* Prompt to add genuinely custom if no exact or canonical alias match exists */}
          {!hasCanonicalMatch && trimmedQuery.length >= 2 && (
            <div className="p-2 bg-[#F8F7F4] border-t border-[#111113]/20">
              <button
                type="button"
                onClick={handleAddCustom}
                disabled={isAlreadySelected(trimmedQuery)}
                className="w-full text-left p-2 border border-dashed border-[#111113] bg-white hover:bg-[#FF4D00] hover:text-white transition-colors flex items-center justify-between font-mono text-xs"
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-[#FF4D00]" />
                  <span>
                    Add <strong className="font-bold">&ldquo;{trimmedQuery}&rdquo;</strong> as custom technology
                  </span>
                </div>
                <span className="text-[10px] uppercase font-bold opacity-75">
                  Queued for review
                </span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
