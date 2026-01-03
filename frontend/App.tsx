import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import GraphCanvas, { GraphCanvasRef } from './components/GraphCanvas';
import SearchBar from './components/SearchBar';
import SidePanel from './components/SidePanel';
import ShootingStars from './components/ShootingStars';
import StarField from './components/StarField';
import { Node, Link, GraphInteractionEvent, GraphData } from './types';
import { Info, AlertCircle, Sun, Moon, Loader2 } from 'lucide-react';

const App: React.FC = () => {
  // --- Data Loading State ---
  const [masterData, setMasterData] = useState<GraphData>({ nodes: [], links: [] });
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], links: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- UI State ---
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [selectedLink, setSelectedLink] = useState<Link | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [panelOpen, setPanelOpen] = useState(false);
  const [panelData, setPanelData] = useState<{ type: 'node' | 'link', data: Node | Link } | null>(null);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [notification, setNotification] = useState<string | null>(null);
  
  const searchInputRef = useRef<HTMLInputElement>(null);
  const graphRef = useRef<GraphCanvasRef>(null);
  const cursorRef = useRef<HTMLDivElement>(null);

  // --- Fetch Data ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL;
        const response = await fetch(apiUrl);
        if (!response.ok) {
          throw new Error(`Failed to load data: ${response.statusText}`);
        }
        const data: GraphData = await response.json();
        setMasterData(data);
        setGraphData(data);
        setIsLoading(false);
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // --- Computed ---
  // Now depends on masterData, not constants
  const allTitles = useMemo(() => masterData.nodes.map(n => n.title), [masterData]);

  // --- Handlers ---

  const handleGraphInteraction = useCallback((event: GraphInteractionEvent) => {
    if (event.type === 'background') {
      setSelectedId(null);
      setSelectedLink(null);
      setPanelOpen(false);
      return;
    }

    if (event.type === 'node' && event.data) {
      const node = event.data as Node;
      setSelectedId(node.id);
      setSelectedLink(null);
      setPanelData({ type: 'node', data: node });
      setPanelOpen(true);
    }

    if (event.type === 'link' && event.data) {
      const link = event.data as Link;
      setSelectedId(null);
      setSelectedLink(link);
      setPanelData({ type: 'link', data: link });
      setPanelOpen(true);
    }
  }, []);

  const handleReset = useCallback(() => {
    setGraphData(masterData);
    setSearchQuery('');
    setSelectedId(null);
    setSelectedLink(null);
    setPanelOpen(false);
    setNotification(null);
    // Reset camera focus to default
    if (graphRef.current) {
        graphRef.current.resetZoom();
    }
  }, [masterData]); // Dependency added

  const handleNodeSelectFromPanel = useCallback((node: Node) => {
     // Trigger selection as if clicked on graph
     setSelectedId(node.id);
     setSelectedLink(null);
     setPanelData({ type: 'node', data: node });
     setPanelOpen(true);
  }, []);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement !== searchInputRef.current) {
        e.preventDefault();
        handleReset();
        searchInputRef.current?.focus();
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        handleReset();
        searchInputRef.current?.blur();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleReset]);

  // Mouse Spotlight
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
      }
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Search Logic
  const handleSearchTrigger = (depth: number) => {
    const query = searchQuery.trim().toLowerCase();
    
    if (!query) {
        handleReset();
        return;
    }

    const rootNode = masterData.nodes.find(n => n.title.toLowerCase() === query);

    if (!rootNode) {
        setNotification(`No book found with title matching "${searchQuery}"`);
        setTimeout(() => setNotification(null), 3000);
        return;
    }

    setNotification(null);
    setSelectedId(rootNode.id);
    setSelectedLink(null);

    const maxDepth = depth === -1 ? Infinity : depth;
    const visitedIds = new Set<number>();
    const queue: { id: number; depth: number }[] = [{ id: rootNode.id, depth: 0 }];
    visitedIds.add(rootNode.id);

    let head = 0;
    while(head < queue.length) {
        const { id, depth: currentDepth } = queue[head++];

        if (currentDepth >= maxDepth) continue;

        // Use masterData.links
        const connectedLinks = masterData.links.filter(l => 
            (l.source as number) === id || (l.target as number) === id
        );

        for (const link of connectedLinks) {
            const neighborId = (link.source as number) === id ? (link.target as number) : (link.source as number);
            
            if (!visitedIds.has(neighborId)) {
                visitedIds.add(neighborId);
                queue.push({ id: neighborId, depth: currentDepth + 1 });
            }
        }
    }

    // Filter from masterData
    const filteredNodes = masterData.nodes.filter(n => visitedIds.has(n.id));
    const filteredLinks = masterData.links.filter(l => 
        visitedIds.has(l.source as number) && visitedIds.has(l.target as number)
    );

    setGraphData({
        nodes: filteredNodes,
        links: filteredLinks
    });

    const connectionCount = masterData.links.filter(l => 
        (l.source as number) === rootNode.id || (l.target as number) === rootNode.id
    ).length;

    setPanelData({ type: 'node', data: { ...rootNode, connectionCount } });
    setPanelOpen(true);
  };

  const isDark = theme === 'dark';

  // --- Loading Screen ---
  if (isLoading) {
    return (
      <div className={`w-screen h-screen flex flex-col items-center justify-center ${isDark ? 'bg-[#02040a] text-slate-200' : 'bg-slate-50 text-slate-900'}`}>
        <Loader2 className="w-10 h-10 animate-spin mb-4 text-violet-400" />
        <h2 className="text-xl font-serif">Loading Constellation...</h2>
      </div>
    );
  }

  // --- Error Screen ---
  if (error) {
    return (
        <div className="w-screen h-screen flex items-center justify-center bg-red-50 text-red-800">
            <div className="text-center">
                <AlertCircle className="w-12 h-12 mx-auto mb-4" />
                <h2 className="text-2xl font-bold">Error Loading Data</h2>
                <p>{error}</p>
            </div>
        </div>
    );
  }

  return (
    <div className={`w-screen h-screen relative flex flex-col overflow-hidden transition-colors duration-500 ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
      
      {/* --- Background Layers --- */}
      {isDark ? (
        <>
            <div className="absolute inset-0 bg-[#02040a]" />
            <StarField />
            <div className="absolute top-[-10%] left-[-10%] w-[45vw] h-[45vw] bg-cyan-900/20 rounded-full mix-blend-screen opacity-40 blur-[80px] animate-blob-1" />
            <div className="absolute top-[-10%] right-[-10%] w-[45vw] h-[45vw] bg-violet-900/20 rounded-full mix-blend-screen opacity-40 blur-[80px] animate-blob-2" />
            <div className="absolute bottom-[-10%] left-[20%] w-[50vw] h-[50vw] bg-indigo-900/20 rounded-full mix-blend-screen opacity-30 blur-[80px] animate-blob-3" />
            
            <div 
                ref={cursorRef}
                className="fixed top-0 left-0 w-[800px] h-[800px] -translate-x-1/2 -translate-y-1/2 pointer-events-none z-0"
                style={{
                    background: 'radial-gradient(circle, rgba(255, 255, 255, 0.03) 0%, transparent 60%)',
                    mixBlendMode: 'screen',
                    willChange: 'transform'
                }}
            />

            <ShootingStars />
        </>
      ) : (
        <div className="absolute inset-0 bg-slate-50 transition-colors duration-500 overflow-hidden">
             <div className="ray h-[120vh] -left-[10%] top-[-20%] animate-ray-1" />
             <div className="ray h-[120vh] left-[20%] top-[-30%] animate-ray-2" />
             <div className="ray h-[120vh] left-[50%] top-[-20%] animate-ray-3" />
        </div>
      )}

      {/* --- Header Elements --- */}
      <div className="absolute left-4 top-4 z-30 pointer-events-auto">
          <button 
              onClick={handleReset}
              className="flex items-center gap-3 select-none group cursor-pointer focus:outline-none"
              aria-label="Reset to Home"
          >
              <div className={`w-10 h-10 rounded-xl shadow-xl flex items-center justify-center group-hover:scale-105 transition-transform duration-200 border ${isDark ? 'bg-slate-800/50 backdrop-blur-md border-white/10 group-hover:border-violet-400/30' : 'bg-white border-slate-200 group-hover:border-slate-300'}`}>
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 16 L10 8 L19 10" className={isDark ? "text-slate-400" : "text-slate-400"} strokeLinecap="round" strokeLinejoin="round"/>
                      <circle cx="5" cy="16" r="2.5" className={`${isDark ? 'fill-violet-400 text-violet-400' : 'fill-violet-400 text-violet-400'} stroke-none`}/>
                      <circle cx="10" cy="8" r="2.5" className={`${isDark ? 'fill-fuchsia-300 text-fuchsia-300' : 'fill-indigo-400 text-indigo-400'} stroke-none`}/>
                      <circle cx="19" cy="10" r="2.5" className={`${isDark ? 'fill-indigo-300 text-indigo-300' : 'fill-sky-400 text-sky-400'} stroke-none`}/>
                  </svg>
              </div>
              <h1 className={`text-xl md:text-2xl font-serif font-bold tracking-tight transition-colors drop-shadow-sm ${isDark ? 'text-slate-100 group-hover:text-violet-300' : 'text-slate-800 group-hover:text-cyan-600'} hidden md:block`}>Asterism</h1>
          </button>
      </div>

      <div className="absolute top-0 left-0 w-full z-[100] flex items-start justify-center p-4 pointer-events-none">
          <div className="pointer-events-auto w-full max-w-lg px-14 md:px-0">
              <SearchBar 
              ref={searchInputRef}
              value={searchQuery} 
              onChange={setSearchQuery} 
              onSearch={handleSearchTrigger}
              onClear={handleReset}
              options={allTitles}
              theme={theme}
              />
          </div>
      </div>

      <div className="absolute right-4 top-4 z-30 pointer-events-auto">
          <button 
              onClick={() => setTheme(isDark ? 'light' : 'dark')}
              className={`p-2.5 rounded-full transition-all duration-300 shadow-lg ${isDark ? 'bg-slate-800/50 hover:bg-slate-700 text-violet-400' : 'bg-white hover:bg-slate-100 text-slate-600'}`}
              aria-label="Toggle Theme"
          >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
      </div>

      {notification && (
        <div className="absolute top-20 md:top-24 left-1/2 transform -translate-x-1/2 z-[110] animate-in fade-in slide-in-from-top-4 duration-300 w-max max-w-[90vw]">
            <div className={`px-6 py-3 rounded-full shadow-2xl backdrop-blur-md flex items-center gap-2 border ${isDark ? 'bg-red-500/90 text-white border-red-400/50' : 'bg-red-100 text-red-700 border-red-200'}`}>
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span className="font-medium text-sm md:text-base truncate">{notification}</span>
            </div>
        </div>
      )}

      <div className="absolute inset-0 z-0">
        <GraphCanvas 
            ref={graphRef}
            data={graphData} 
            onSelect={handleGraphInteraction}
            selectedId={selectedId}
            selectedLink={selectedLink}
            searchQuery={searchQuery}
            theme={theme}
        />
      </div>

      <div className="absolute bottom-6 left-6 z-10 hidden md:block">
        <div className={`backdrop-blur-lg p-4 rounded-xl shadow-xl border max-w-xs transition-colors ${isDark ? 'bg-slate-900/60 border-white/5' : 'bg-white/80 border-slate-200'}`}>
            <div className={`flex items-center gap-2 mb-2 font-semibold ${isDark ? 'text-violet-400' : 'text-cyan-600'}`}>
                <Info className="w-4 h-4" />
                <span>Navigating Asterism</span>
            </div>
            <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Press <strong>/</strong> to search, <strong>Esc</strong> to reset.<br/>
            </p>
        </div>
      </div>

      <SidePanel 
        isOpen={panelOpen} 
        onClose={() => setPanelOpen(false)} 
        data={panelData?.data || null} 
        type={panelData?.type || null}
        theme={theme}
        onNodeSelect={handleNodeSelectFromPanel}
      />
    </div>
  );
};

export default App;