import React, { useState, useEffect, useRef, forwardRef } from 'react';
import { Search, Share2, ArrowRight, ChevronDown, Check, X } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (val: string) => void;
  onSearch: (depth: number) => void;
  onClear?: () => void;
  options?: string[];
  theme: 'light' | 'dark';
}

const SearchBar = forwardRef<HTMLInputElement, SearchBarProps>(({ value, onChange, onSearch, onClear, options = [], theme }, ref) => {
  // depth: -1 represents "All" (Infinite)
  const [depth, setDepth] = useState<number>(-1);
  const [isFocused, setIsFocused] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  // Custom Dropdown State
  const [isDepthOpen, setIsDepthOpen] = useState(false);
  const depthRef = useRef<HTMLDivElement>(null);

  const depthOptions = [
    { value: 1, label: "Depth: 1" },
    { value: 2, label: "Depth: 2" },
    { value: 3, label: "Depth: 3" },
    { value: -1, label: "Depth: All" }
  ];

  // Theme-based styles
  const isDark = theme === 'dark';
  const containerBg = isDark ? 'bg-slate-900/60 border-white/10 focus-within:bg-slate-900/80 focus-within:ring-slate-700' : 'bg-white/80 border-slate-200 focus-within:bg-white focus-within:ring-slate-300';
  const textColor = isDark ? 'text-slate-100' : 'text-slate-800';
  const placeholderColor = isDark ? 'placeholder-slate-500' : 'placeholder-slate-400';
  // Violet icon in dark mode
  const iconColor = isDark ? 'text-slate-400' : 'text-slate-500'; 
  const dropdownBg = isDark ? 'bg-slate-900/95 border-slate-700/50' : 'bg-white/95 border-slate-200';
  const suggestionHover = isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-100';
  // Violet selection in dark mode
  const suggestionSelected = isDark ? 'bg-slate-800 text-violet-400' : 'bg-slate-100 text-cyan-600';
  
  // Filter suggestions based on input
  const suggestions = value.length > 0 
    ? options.filter(opt => opt.toLowerCase().includes(value.toLowerCase()) && opt.toLowerCase() !== value.toLowerCase()).slice(0, 5) 
    : [];

  // Reset selection when input changes
  useEffect(() => {
    setSelectedIndex(-1);
  }, [value]);

  // Close depth dropdown when clicking outside - USE CAPTURE PHASE
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (depthRef.current && !depthRef.current.contains(event.target as Node)) {
        setIsDepthOpen(false);
      }
    };
    // Use capture=true to catch events before they are stopped by other components (like D3)
    document.addEventListener('mousedown', handleClickOutside, true);
    return () => document.removeEventListener('mousedown', handleClickOutside, true);
  }, []);

  const handleSuggestionClick = (suggestion: string) => {
    onChange(suggestion);
    // Keep focus logic: usually we want to close suggestions but keep input operational
    setIsFocused(false); 
    setSelectedIndex(-1);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
    // Always show suggestions when typing
    setIsFocused(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (suggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : 0));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : suggestions.length - 1));
        return;
      }
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
        handleSuggestionClick(suggestions[selectedIndex]);
      } else {
        onSearch(depth);
        setIsFocused(false);
      }
    } else if (e.key === 'Escape') {
      setIsFocused(false);
    }
  };

  return (
    <div className="w-full relative z-50">
      <div className="relative group">
        
        {/* Main Bar */}
        <div className={`flex items-center backdrop-blur-xl rounded-full shadow-2xl transition-all duration-300 focus-within:ring-1 border relative z-20 ${containerBg}`}>
            {/* Icon */}
            <div className="pl-4 flex items-center pointer-events-none">
            <Search className={`h-5 w-5 transition-colors ${iconColor} ${isDark ? 'group-focus-within:text-violet-400' : 'group-focus-within:text-cyan-500'}`} />
            </div>

            {/* Input */}
            <input
            ref={ref}
            type="text"
            value={value}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setTimeout(() => setIsFocused(false), 200)} // Delay to allow click to register
            className={`flex-1 min-w-0 pl-3 pr-2 py-3 border-0 bg-transparent focus:outline-none focus:ring-0 leading-5 ${textColor} ${placeholderColor}`}
            placeholder="Search..."
            />

            {/* Clear Button */}
            {value && (
                <button
                    onClick={() => {
                        onChange('');
                        if (onClear) onClear();
                        setIsFocused(true); // Keep focused to show suggestions if any
                    }}
                    className={`p-1 mr-1 rounded-full transition-colors ${isDark ? 'text-slate-500 hover:text-white hover:bg-slate-800' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'}`}
                    aria-label="Clear search"
                >
                    <X className="h-4 w-4" />
                </button>
            )}

            {/* Divider */}
            <div className={`h-6 w-px mx-2 ${isDark ? 'bg-slate-700' : 'bg-slate-300'}`}></div>

            {/* Depth Selector (Custom) */}
            <div className="relative mr-1" ref={depthRef}>
                <button
                    onClick={() => setIsDepthOpen(!isDepthOpen)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium transition-all duration-200 outline-none ${
                        isDepthOpen 
                            ? (isDark ? 'bg-slate-800 text-violet-400' : 'bg-slate-100 text-cyan-600') 
                            : (isDark ? 'text-slate-400 hover:bg-slate-800 hover:text-slate-200' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800')
                    }`}
                >
                    <Share2 className="w-4 h-4" />
                    <span className="hidden sm:block min-w-[4rem] text-left">{depthOptions.find(o => o.value === depth)?.label}</span>
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isDepthOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Custom Dropdown */}
                {isDepthOpen && (
                    <div className={`absolute top-full right-0 mt-3 w-full backdrop-blur-xl rounded-xl shadow-[0_0_40px_-10px_rgba(0,0,0,0.5)] border overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200 ${dropdownBg}`}>
                        {depthOptions.map((opt) => (
                            <button
                                key={opt.value}
                                onClick={() => {
                                    setDepth(opt.value);
                                    setIsDepthOpen(false);
                                }}
                                className={`w-full text-left px-4 py-2.5 text-sm flex items-center justify-between transition-colors outline-none ${
                                    depth === opt.value 
                                        ? (isDark ? 'bg-violet-950/30 text-violet-400 font-medium' : 'bg-cyan-50 text-cyan-600 font-medium')
                                        : (isDark ? 'text-slate-400 hover:bg-slate-800 hover:text-slate-100' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900')
                                }`}
                            >
                                <span className="whitespace-nowrap">{opt.label}</span>
                                {depth === opt.value && <Check className="w-3.5 h-3.5 flex-shrink-0" />}
                            </button>
                        ))}
                    </div>
                )}
            </div>
            
            {/* Search Button */}
            <button 
                onClick={() => onSearch(depth)}
                className={`mr-1.5 p-2 rounded-full transition-colors shadow-none border ${isDark ? 'bg-violet-500/10 text-violet-400 hover:bg-violet-500/20 hover:text-violet-300 border-violet-500/20' : 'bg-cyan-50 text-cyan-600 hover:bg-cyan-100 hover:text-cyan-700 border-cyan-200'}`}
                aria-label="Filter Graph"
            >
                <ArrowRight className="w-4 h-4" />
            </button>
        </div>

        {/* Suggestions Dropdown */}
        {isFocused && suggestions.length > 0 && (
            <div className={`absolute top-full left-0 right-0 mt-2 backdrop-blur-xl rounded-2xl shadow-2xl border overflow-hidden z-50 py-2 animate-in fade-in slide-in-from-top-2 duration-200 ${dropdownBg}`}>
                {suggestions.map((item, index) => (
                    <div 
                        key={index}
                        onMouseDown={() => handleSuggestionClick(item)} // onMouseDown fires before onBlur
                        onMouseEnter={() => setSelectedIndex(index)}
                        className={`px-6 py-2.5 cursor-pointer text-sm flex items-center gap-3 transition-colors ${
                            index === selectedIndex 
                                ? suggestionSelected 
                                : `${isDark ? 'text-slate-300' : 'text-slate-700'} ${suggestionHover}`
                        }`}
                    >
                        <Search className={`w-3 h-3 ${index === selectedIndex ? (isDark ? 'text-violet-400' : 'text-cyan-600') : (isDark ? 'text-slate-500' : 'text-slate-400')}`} />
                        <span>{item}</span>
                    </div>
                ))}
            </div>
        )}

      </div>
    </div>
  );
});

export default SearchBar;