import React from 'react';
import DOMPurify from 'dompurify';
import { X, BookOpen, Quote, User, Tag, Calendar, ExternalLink, MoveVertical, MoveDown, Waypoints } from 'lucide-react';
import { Node, Link } from '../types';

interface SidePanelProps {
    isOpen: boolean;
    onClose: () => void;
    data: Node | Link | null;
    type: 'node' | 'link' | null;
    theme: 'light' | 'dark';
    onNodeSelect?: (node: Node) => void;
}

const SidePanel: React.FC<SidePanelProps> = ({ isOpen, onClose, data, type, theme, onNodeSelect }) => {
    const isDark = theme === 'dark';
    const translateClass = isOpen ? 'translate-x-0' : 'translate-x-full';

    // Theme classes
    const panelBg = isDark ? 'bg-slate-900/95 border-white/10' : 'bg-white/95 border-slate-200';
    const textPrimary = isDark ? 'text-slate-100' : 'text-slate-900';
    const textSecondary = isDark ? 'text-slate-400' : 'text-slate-500';
    const borderSubtle = isDark ? 'border-white/5' : 'border-slate-200';

    // Updated cardBg for Light mode to match Cyan theme (bg-cyan-50/50 with cyan border)
    const cardBg = isDark ? 'bg-white/5 border-white/5' : 'bg-slate-50/50 border-slate-100';

    // Updated to Violet for dark mode
    const statBg = isDark ? 'bg-violet-950/30 border-violet-900/30' : 'bg-cyan-50 border-cyan-100';

    if (!data) return null;

    return (
        <div
            className={`absolute top-0 right-0 h-full w-full md:w-96 backdrop-blur-xl shadow-[0_0_50px_rgba(0,0,0,0.2)] transform transition-transform duration-300 ease-in-out z-40 flex flex-col border-l ${panelBg} ${translateClass}`}
        >
            {/* Header */}
            <div className={`flex items-center justify-between p-6 border-b ${borderSubtle}`}>
                <h2 className={`text-lg font-semibold flex items-center gap-2 ${textPrimary}`}>
                    {type === 'node' ? (
                        <>
                            {/* Violet icon in dark mode */}
                            <BookOpen className={`w-5 h-5 ${isDark ? 'text-violet-400' : 'text-cyan-600'}`} />
                            <span>Book Details</span>
                        </>
                    ) : (
                        <>
                            <Waypoints className={`w-5 h-5 ${isDark ? 'text-violet-400' : 'text-cyan-600'}`} />
                            <span>Connection</span>
                        </>
                    )}
                </h2>
                <button
                    onClick={onClose}
                    className={`p-2 rounded-full transition-colors ${isDark ? 'hover:bg-white/5 text-slate-400 hover:text-slate-200' : 'hover:bg-slate-100 text-slate-400 hover:text-slate-700'}`}
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                {type === 'node' ? (
                    <NodeContent node={data as Node} theme={theme} classes={{ textPrimary, textSecondary, cardBg, statBg, borderSubtle }} />
                ) : (
                    <LinkContent
                        link={data as Link}
                        theme={theme}
                        classes={{ textPrimary, textSecondary, cardBg, borderSubtle }}
                        onNodeSelect={onNodeSelect}
                    />
                )}
            </div>

            {/* Footer - Only for Book Nodes */}
            {type === 'node' && (
                <div className={`p-6 border-t ${borderSubtle} ${isDark ? 'bg-black/20' : 'bg-slate-50/50'}`}>
                    <button className={`w-full py-2.5 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${isDark ? 'bg-slate-100 text-slate-900 hover:bg-violet-300 hover:text-slate-950 shadow-lg shadow-violet-900/20' : 'bg-slate-900 text-white hover:bg-cyan-600 shadow-md'}`}>
                        <span>Find on Goodreads</span>
                        <ExternalLink className="w-4 h-4" />
                    </button>
                </div>
            )}
        </div>
    );
};

// Helper components for content rendering
const NodeContent: React.FC<{ node: Node, theme: 'light' | 'dark', classes: any }> = ({ node, theme, classes }) => {
    const isDark = theme === 'dark';
    return (
        <div className="space-y-6">
            <div>
                <h1 className={`text-3xl font-serif leading-tight mb-2 ${classes.textPrimary}`}>{node.title}</h1>
                <div className={`flex items-center gap-2 ${classes.textSecondary}`}>
                    <User className="w-4 h-4" />
                    <span className={`font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{node.author}</span>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className={`p-3 rounded-lg border ${classes.cardBg}`}>
                    <div className={`flex items-center gap-2 text-xs uppercase tracking-wider mb-1 ${classes.textSecondary}`}>
                        <Tag className="w-3 h-3" />
                        Genre
                    </div>
                    <div className={`text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{node.genre}</div>
                </div>
                <div className={`p-3 rounded-lg border ${classes.cardBg}`}>
                    <div className={`flex items-center gap-2 text-xs uppercase tracking-wider mb-1 ${classes.textSecondary}`}>
                        <Calendar className="w-3 h-3" />
                        Year
                    </div>
                    <div className={`text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{node.year}</div>
                </div>
            </div>

            <div className={`p-4 rounded-lg border ${classes.statBg}`}>
                <h4 className={`${isDark ? 'text-violet-400' : 'text-cyan-700'} font-medium mb-1 text-sm`}>Asterism Stat</h4>
                <p className={`${isDark ? 'text-violet-200/80' : 'text-cyan-800/80'} text-sm`}>
                    This star connects to <span className={`font-bold ${isDark ? 'text-violet-200' : 'text-cyan-800'}`}>{node.connectionCount}</span> others.
                </p>
            </div>

            <div className={`prose prose-sm ${isDark ? 'prose-invert' : ''}`}>
            </div>
        </div>
    );
};

const LinkContent: React.FC<{ link: Link, theme: 'light' | 'dark', classes: any, onNodeSelect?: (node: Node) => void }> = ({ link, theme, classes, onNodeSelect }) => {
    const isDark = theme === 'dark';
    // Helper to get sentiment styling
    const getSentimentStyle = (s: string) => {
        if (link.isSameAuthor) {
            return isDark
                ? 'bg-violet-950/50 text-violet-300 border-violet-800/50'
                : 'bg-cyan-50 text-cyan-700 border-cyan-200';
        }
        if (isDark) {
            switch (s) {
                // Violet for recommended in dark mode
                case 'recommended': return 'bg-violet-950/50 text-violet-300 border-violet-800/50';
                case 'critiqued': return 'bg-red-950/50 text-red-300 border-red-800/50';
                default: return 'bg-slate-800/50 text-slate-300 border-slate-700/50';
            }
        } else {
            switch (s) {
                case 'recommended': return 'bg-cyan-50 text-cyan-700 border-cyan-200';
                case 'critiqued': return 'bg-red-50 text-red-700 border-red-200';
                default: return 'bg-slate-100 text-slate-700 border-slate-200';
            }
        }
    };

    const source = link.source as Node;
    const target = link.target as Node;

    const handleNodeClick = (node: Node) => {
        if (onNodeSelect) onNodeSelect(node);
    };

    return (
        <div className="space-y-6">
            {/* Source -> Arrow -> Target Visual */}
            <div className={`flex flex-col items-center p-5 rounded-2xl border gap-4 shadow-inner ${classes.cardBg}`}>
                <div className="w-full text-center">
                    <div className={`text-[10px] font-bold tracking-widest uppercase mb-1 ${classes.textSecondary}`}>Source</div>
                    <button
                        onClick={() => handleNodeClick(source)}
                        className={`font-semibold text-lg leading-tight ${classes.textPrimary} cursor-pointer focus:outline-none transition-opacity hover:opacity-80`}
                    >
                        {source.title}
                    </button>
                </div>

                <div className="relative flex items-center justify-center w-full py-2">
                    {/* Left divider line */}
                    <div className={`h-px flex-1 ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`}></div>

                    {/* Arrow Wrapper: Matches card background (slate-50) in light mode to cleanly mask the line */}
                    {link.isSameAuthor && (
                        <MoveVertical className={`w-5 h-5 ${classes.textSecondary}`} />
                    )}
                    {!link.isSameAuthor && (
                        <MoveDown className={`w-5 h-5 ${classes.textSecondary}`} />
                    )}

                    {/* Right divider line */}
                    <div className={`h-px flex-1 ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`}></div>
                </div>

                <div className="w-full text-center">
                    <div className={`text-[10px] font-bold tracking-widest uppercase mb-1 ${classes.textSecondary}`}>Mentions</div>
                    <button
                        onClick={() => handleNodeClick(target)}
                        className={`font-semibold text-lg leading-tight ${classes.textPrimary} cursor-pointer focus:outline-none transition-opacity hover:opacity-80`}
                    >
                        {target.title}
                    </button>
                </div>
            </div>

            {link.isSameAuthor && (
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getSentimentStyle(link.sentiment)}`}>
                    Same Author
                </div>
            )}

            {link.quote && (
                <div className="relative !mt-12">
                    <Quote className={`absolute -top-3 -left-2 w-8 h-8 -z-10 ${isDark ? 'text-slate-800' : 'text-slate-200'}`} />
                    <blockquote className={`text-lg italic font-serif leading-relaxed pl-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}
                        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(link.quote) }}
                    />
                </div>
            )}

            {/* <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getSentimentStyle(link.sentiment)}`}>
                {link.sentiment.charAt(0).toUpperCase() + link.sentiment.slice(1)}
            </div> */}
        </div>
    );
};

export default SidePanel;