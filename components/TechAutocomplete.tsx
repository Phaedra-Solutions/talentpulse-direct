'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, Plus, Check, Sparkles, AlertCircle } from 'lucide-react';
import { Technology } from '@/types/roles-tech';

interface TechAutocompleteProps {
  roleSlugOrId: string;
  selectedTechs: string[];
  onSelectTech: (techName: string, isCustom?: boolean) => void;
  availableRoleTechs?: Technology[];
}

export function TechAutocomplete({
  roleSlugOrId,
  selectedTechs,
  onSelectTech,
  availableRoleTechs = [],
}: TechAutocompleteProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [allSystemTechs, setAllSystemTechs] = useState<Technology[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load system technologies once for instant client-side matching
  useEffect(() => {
    let isMounted = true;
    async function loadAllTechs() {
      try {
        const res = await fetch('/api/technologies?status=approved');
        const data = await res.json();
        if (isMounted && data.success && Array.isArray(data.technologies)) {
          setAllSystemTechs(data.technologies);
        }
      } catch {
        // fallback
      }
    }
    loadAllTechs();
    return () => {
      isMounted = false;
    };
  }, []);

  // Filter suggestions when query changes (only after writing at least 2 characters)
  const suggestions = useMemo(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) return [];

    const lowerQuery = trimmed.toLowerCase();
    const normalizedSelected = selectedTechs.map(t => t.toLowerCase().trim());

    // Pool of candidates: prioritize availableRoleTechs first, then allSystemTechs
    const pool = [...availableRoleTechs, ...allSystemTechs];
    const uniquePool = Array.from(new Map(pool.map(item => [item.id, item])).values());

    const matched = uniquePool.filter(tech => {
      // Must not already be selected
      if (normalizedSelected.includes(tech.name.toLowerCase().trim())) {
        return false;
      }
      return tech.name.toLowerCase().includes(lowerQuery);
    });

    // Sort: exact startsWith first, then alphabetical
    matched.sort((a, b) => {
      const aStarts = a.name.toLowerCase().startsWith(lowerQuery);
      const bStarts = b.name.toLowerCase().startsWith(lowerQuery);
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;
      return a.name.localeCompare(b.name);
    });

    return matched.slice(0, 8);
  }, [query, selectedTechs, availableRoleTechs, allSystemTechs]);

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

  const handleSelectSuggestion = (techName: string) => {
    onSelectTech(techName, false);
    setQuery('');
    setIsOpen(false);
  };

  const handleAddCustom = () => {
    const trimmed = query.trim();
    if (trimmed.length < 2) return;

    // Check if already selected (case-insensitive deduplication)
    const alreadySelected = selectedTechs.some(
      t => t.toLowerCase().trim() === trimmed.toLowerCase()
    );
    if (alreadySelected) {
      setQuery('');
      setIsOpen(false);
      return;
    }

    // Check if it matches an existing system tech exactly
    const exactMatch = allSystemTechs.find(
      t => t.name.toLowerCase().trim() === trimmed.toLowerCase()
    );

    if (exactMatch) {
      onSelectTech(exactMatch.name, false);
    } else {
      onSelectTech(trimmed, true);
    }

    setQuery('');
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (suggestions.length > 0) {
        handleSelectSuggestion(suggestions[0].name);
      } else {
        handleAddCustom();
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const isAlreadySelected = (name: string) =>
    selectedTechs.some(t => t.toLowerCase().trim() === name.toLowerCase().trim());

  const trimmedQuery = query.trim();
  const hasExactMatch = suggestions.some(
    s => s.name.toLowerCase().trim() === trimmedQuery.toLowerCase()
  );

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
          <span>Add Custom</span>
        </button>
      </div>

      {/* Autocomplete Suggestions Dropdown */}
      {isOpen && trimmedQuery.length >= 2 && (
        <div className="absolute left-0 right-0 top-full mt-1 z-30 bg-white border-2 border-[#111113] shadow-[4px_4px_0px_0px_#111113] max-h-64 overflow-y-auto">
          <div className="p-2 bg-[#F8F7F4] border-b border-[#111113]/20 flex items-center justify-between font-mono text-[10px] text-[#111113]/60 uppercase">
            <span>System Suggestions (Press Enter to select)</span>
            <span>{suggestions.length} found</span>
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
              No matching existing technologies found.
            </div>
          )}

          {/* Prompt to add genuinely custom if not exact match */}
          {!hasExactMatch && trimmedQuery.length >= 2 && (
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
