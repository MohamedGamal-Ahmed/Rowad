import React, { useState, useEffect, useRef } from 'react';
import { Search, ChevronDown, Check, X } from 'lucide-react';

interface AutocompleteOption {
  id: string;
  code: string;
  name: string;
  subtitle?: string;
}

interface SearchableAutocompleteProps {
  options: AutocompleteOption[];
  selectedValue: string;
  onSelect: (value: string) => void;
  placeholder?: string;
  label?: string;
  disabled?: boolean;
}

export function SearchableAutocomplete({
  options,
  selectedValue,
  onSelect,
  placeholder = 'Search...',
  label,
  disabled = false
}: SearchableAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find(opt => opt.id === selectedValue);

  // Filter options based on query (covers code & name, completely case-insensitive)
  const filteredOptions = options.filter(opt =>
    opt.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    opt.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (opt.subtitle && opt.subtitle.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  useEffect(() => {
    // Reset active index when filtered options change
    setActiveIndex(-1);
  }, [searchQuery]);

  // Click outside handler to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true);
        e.preventDefault();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        setActiveIndex(prev => (prev + 1) % Math.max(filteredOptions.length, 1));
        e.preventDefault();
        break;
      case 'ArrowUp':
        setActiveIndex(prev => (prev - 1 + filteredOptions.length) % Math.max(filteredOptions.length, 1));
        e.preventDefault();
        break;
      case 'Enter':
        if (activeIndex >= 0 && activeIndex < filteredOptions.length) {
          onSelect(filteredOptions[activeIndex].id);
          setIsOpen(false);
          setSearchQuery('');
        }
        e.preventDefault();
        break;
      case 'Escape':
        setIsOpen(false);
        e.preventDefault();
        break;
      case 'Tab':
        setIsOpen(false);
        break;
      default:
        break;
    }
  };

  const handleOptionClick = (id: string) => {
    onSelect(id);
    setIsOpen(false);
    setSearchQuery('');
  };

  return (
    <div ref={containerRef} className="relative w-full text-left">
      {label && (
        <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
          {label}
        </label>
      )}
      
      <div 
        onClick={() => {
          if (!disabled) {
            setIsOpen(!isOpen);
            setTimeout(() => inputRef.current?.focus(), 100);
          }
        }}
        className={`flex items-center justify-between border rounded-xl p-3 bg-white dark:bg-slate-950 transition-all cursor-pointer ${
          disabled ? 'opacity-50 cursor-not-allowed bg-slate-50' : ''
        } ${
          isOpen ? 'border-brand-red ring-1 ring-brand-red/10' : 'border-slate-200 dark:border-slate-800'
        }`}
      >
        <span className="text-sm font-semibold truncate text-slate-800 dark:text-slate-100">
          {selectedOption ? (
            <span className="flex items-center gap-2">
              <span className="bg-slate-100 dark:bg-slate-850 px-2 py-0.5 rounded text-[10px] font-bold font-mono text-slate-500 shrink-0">
                {selectedOption.code}
              </span>
              <span className="truncate">{selectedOption.name}</span>
            </span>
          ) : (
            <span className="text-slate-400">{placeholder}</span>
          )}
        </span>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {isOpen && (
        <div className="absolute left-0 right-0 mt-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl z-50 overflow-hidden flex flex-col max-h-80 animate-in fade-in duration-200">
          <div className="flex items-center gap-2 px-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type to filter..."
              className="w-full text-xs bg-transparent py-3 text-slate-800 dark:text-slate-100 focus:outline-none"
            />
            {searchQuery && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setSearchQuery('');
                }}
                className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full"
              >
                <X className="w-3 h-3 text-slate-400" />
              </button>
            )}
          </div>

          <div className="overflow-y-auto no-scrollbar flex-1 py-1 max-h-60">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt, index) => {
                const isSelected = opt.id === selectedValue;
                const isHovered = index === activeIndex;
                return (
                  <div
                    key={opt.id}
                    onClick={() => handleOptionClick(opt.id)}
                    className={`flex items-center justify-between px-3.5 py-2.5 text-xs transition-colors cursor-pointer ${
                      isSelected ? 'bg-brand-red/5 font-bold text-brand-red' : 'text-slate-700 dark:text-slate-300'
                    } ${
                      isHovered ? 'bg-slate-100 dark:bg-slate-800 text-slate-900' : ''
                    }`}
                  >
                    <div className="min-w-0 flex-1 flex items-center gap-2">
                      <span className="bg-slate-100 dark:bg-slate-850 px-2 py-0.5 rounded text-[10px] font-bold font-mono text-slate-500 shrink-0">
                        {opt.code}
                      </span>
                      <div className="truncate">
                        <p className="font-bold truncate">{opt.name}</p>
                        {opt.subtitle && <p className="text-[10px] text-slate-400 truncate mt-0.5">{opt.subtitle}</p>}
                      </div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-brand-red shrink-0" />}
                  </div>
                );
              })
            ) : (
              <div className="px-4 py-6 text-center text-xs text-slate-400">
                No matching records found.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
