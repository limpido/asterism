import React, { useEffect, useRef, useImperativeHandle, forwardRef, useState } from 'react';
import * as d3 from 'd3';
import { Node, Link, GraphData, GraphInteractionEvent } from '../types';

interface GraphCanvasProps {
  data: GraphData;
  onSelect: (event: GraphInteractionEvent) => void;
  selectedId: number | null;
  selectedLink: Link | null;
  searchQuery: string;
  theme: 'light' | 'dark';
}

export interface GraphCanvasRef {
  resetZoom: () => void;
}

const GraphCanvas = forwardRef<GraphCanvasRef, GraphCanvasProps>(({ data, onSelect, selectedId, selectedLink, searchQuery, theme }, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  
  // Hover state
  const [hoveredLink, setHoveredLink] = useState<Link | null>(null);

  // Refs to keep track of simulation objects across renders without triggering re-renders
  const simulationRef = useRef<d3.Simulation<Node, Link> | null>(null);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const nodesRef = useRef<Node[]>([]);
  const linksRef = useRef<Link[]>([]);
  const gRef = useRef<d3.Selection<SVGGElement, unknown, null, undefined> | null>(null);
  
  // Track previous state to conditionally trigger camera focus
  const prevRef = useRef<{ id: number | null; link: Link | null; data: GraphData }>({ id: null, link: null, data });

  // Expose resetZoom to parent
  useImperativeHandle(ref, () => ({
    resetZoom: () => {
      if (svgRef.current && zoomRef.current && containerRef.current && nodesRef.current.length > 0) {
        const svg = d3.select(svgRef.current);
        const width = containerRef.current.clientWidth;
        const height = containerRef.current.clientHeight;
        const padding = 60; // Increased padding

        // Calculate bounding box of all nodes
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        
        nodesRef.current.forEach(node => {
            if (typeof node.x !== 'number' || typeof node.y !== 'number') return;
            const r = 6 + (node.connectionCount || 0) * 2; // Approximate radius
            if (node.x - r < minX) minX = node.x - r;
            if (node.x + r > maxX) maxX = node.x + r;
            if (node.y - r < minY) minY = node.y - r;
            if (node.y + r > maxY) maxY = node.y + r;
        });

        // Fallback if no valid positions
        if (minX === Infinity) {
             svg.transition()
            .duration(750)
            .call(zoomRef.current.transform, d3.zoomIdentity);
            return;
        }

        const graphWidth = maxX - minX;
        const graphHeight = maxY - minY;
        const midX = (minX + maxX) / 2;
        const midY = (minY + maxY) / 2;

        // Calculate scale to fit
        const scale = Math.min(
            1.2, 
            Math.min(
                (width - padding * 2) / graphWidth,
                (height - padding * 2) / graphHeight
            )
        );

        const tx = width / 2 - midX * scale;
        const ty = height / 2 - midY * scale;
        
        const transform = d3.zoomIdentity.translate(tx, ty).scale(scale);

        svg.transition()
          .duration(750)
          .ease(d3.easeCubicOut)
          .call(zoomRef.current.transform, transform);
      } else if (svgRef.current && zoomRef.current) {
          // Fallback
          d3.select(svgRef.current)
            .transition()
            .duration(750)
            .call(zoomRef.current.transform, d3.zoomIdentity);
      }
    }
  }));

  // Colors based on theme
  const isDark = theme === 'dark';
  const colors = {
    node: isDark ? '#f8fafc' : '#1e293b',
    // nodeSelected: Amber -> Violet-400 (#a78bfa) for dark mode
    nodeSelected: isDark ? '#a78bfa' : '#0ea5e9',
    link: isDark ? '#64748b' : '#94a3b8',
    linkHover: isDark ? '#e2e8f0' : '#475569',
    text: isDark ? '#94a3b8' : '#64748b',
    textSelected: isDark ? '#e2e8f0' : '#0f172a',
    // searchMatch: Amber -> Purple-400 (#c084fc) for dark mode
    searchMatch: isDark ? '#c084fc' : '#4f46e5',
    linkSentiment: {
        // recommended: Amber -> Violet-400 (#a78bfa)
        recommended: isDark ? '#a78bfa' : '#0284c7',
        critiqued: isDark ? '#f87171' : '#ef4444',
        neutral: isDark ? '#64748b' : '#94a3b8'
    }
  };

  // Initialize graph (simulation & DOM creation) - Only runs when DATA changes
  useEffect(() => {
    if (!containerRef.current || !svgRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    // Clone data
    nodesRef.current = data.nodes.map(n => ({ ...n }));
    linksRef.current = data.links.map(l => ({ ...l }));

    // Calculate connection counts
    const nodeCounts: Record<number, number> = {};
    linksRef.current.forEach(l => {
        const sourceId = typeof l.source === 'object' ? l.source.id : l.source;
        const targetId = typeof l.target === 'object' ? l.target.id : l.target;
        nodeCounts[sourceId as number] = (nodeCounts[sourceId as number] || 0) + 1;
        nodeCounts[targetId as number] = (nodeCounts[targetId as number] || 0) + 1;
    });

    nodesRef.current.forEach(n => {
      n.connectionCount = nodeCounts[n.id] || 0;
    });

    // Clear previous
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    // Create container group for zoom
    const g = svg.append("g");
    gRef.current = g;

    // Zoom setup
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });
    
    svg.call(zoom).on("dblclick.zoom", null);
    zoomRef.current = zoom;

    const getNodeRadius = (d: Node) => 6 + (d.connectionCount || 0) * 2;
    const getFontSize = (d: Node) => Math.min(20, Math.max(12, 11 + (d.connectionCount || 0)));

    // Simulation setup
    const simulation = d3.forceSimulation<Node, Link>(nodesRef.current)
      .force("link", d3.forceLink<Node, Link>(linksRef.current)
        .id(d => d.id)
        .distance(200)) // Increased distance to give links more room
      .force("charge", d3.forceManyBody().strength(-1000)) // Stronger repulsion to clear space around nodes
      // Add central gravity to keep disconnected components closer together
      .force("x", d3.forceX(width / 2).strength(0.06)) // Adjusted strength
      .force("y", d3.forceY(height / 2).strength(0.06)) // Adjusted strength
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collide", d3.forceCollide<Node>().radius(d => getNodeRadius(d) + 25).strength(1).iterations(2)); // Stricter collision

    // Pre-calculate layout to ensure coordinates are ready immediately
    simulation.tick(300);

    simulationRef.current = simulation;

    // --- Drawing Elements (Static creation) ---

    // Define Arrow markers
    const defs = svg.append("defs");
    ['recommended', 'neutral', 'critiqued', 'default'].forEach(type => {
      defs.append("marker")
        .attr("id", `arrow-${type}`)
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", 22) 
        .attr("refY", 0)
        .attr("markerWidth", 5)
        .attr("markerHeight", 5)
        .attr("orient", "auto")
        .append("path")
        .attr("d", "M0,-5L10,0L0,5");
    });

    // Links
    const link = g.append("g")
      .attr("class", "links")
      .selectAll("line")
      .data(linksRef.current)
      .enter().append("line")
      .attr("stroke-width", 1.5)
      .attr("cursor", "pointer")
      .on("click", (event, d) => {
        event.stopPropagation();
        onSelect({ type: 'link', data: d });
      })
      .on("mouseover", (event, d) => {
        setHoveredLink(d);
      })
      .on("mouseout", () => {
        setHoveredLink(null);
      });

    // Nodes
    const node = g.append("g")
      .attr("class", "nodes")
      .selectAll("g")
      .data(nodesRef.current)
      .enter().append("g")
      .attr("cursor", "pointer")
      .call(d3.drag<SVGGElement, Node>()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended)
      )
      .on("click", (event, d) => {
        event.stopPropagation();
        onSelect({ type: 'node', data: d });
      });

    node.append("circle")
      .attr("r", d => getNodeRadius(d))
      .attr("stroke", "none");

    node.append("text")
      .text(d => d.title)
      .attr("x", d => getNodeRadius(d) + 8)
      .attr("y", d => getFontSize(d) * 0.35) // Center vertically approx
      .attr("font-size", d => `${getFontSize(d)}px`)
      .style("user-select", "none"); 

    // Initialize positions
    link
        .attr("x1", d => (d.source as Node).x!)
        .attr("y1", d => (d.source as Node).y!)
        .attr("x2", d => (d.target as Node).x!)
        .attr("y2", d => (d.target as Node).y!);

    node.attr("transform", d => `translate(${d.x},${d.y})`);

    // Tick function
    simulation.on("tick", () => {
      link
        .attr("x1", d => (d.source as Node).x!)
        .attr("y1", d => (d.source as Node).y!)
        .attr("x2", d => (d.target as Node).x!)
        .attr("y2", d => (d.target as Node).y!);

      node.attr("transform", d => `translate(${d.x},${d.y})`);
    });

    // Initial Fit to Screen logic
    const padding = 60; // Increased padding
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    nodesRef.current.forEach(node => {
        if (typeof node.x !== 'number' || typeof node.y !== 'number') return;
        const r = getNodeRadius(node);
        if (node.x - r < minX) minX = node.x - r;
        if (node.x + r > maxX) maxX = node.x + r;
        if (node.y - r < minY) minY = node.y - r;
        if (node.y + r > maxY) maxY = node.y + r;
    });

    if (minX !== Infinity) {
        const graphWidth = maxX - minX;
        const graphHeight = maxY - minY;
        const midX = (minX + maxX) / 2;
        const midY = (minY + maxY) / 2;
        const scale = Math.min(
            1.2, 
            Math.min(
                (width - padding * 2) / graphWidth,
                (height - padding * 2) / graphHeight
            )
        );
        const tx = width / 2 - midX * scale;
        const ty = height / 2 - midY * scale;
        
        // Apply transform immediately (no transition) for initial load
        svg.call(zoom.transform, d3.zoomIdentity.translate(tx, ty).scale(scale));
    }

    // Background Click
    svg.on("click", () => {
      onSelect({ type: 'background' });
    });

    function dragstarted(event: any, d: Node) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }
    function dragged(event: any, d: Node) {
      d.fx = event.x;
      d.fy = event.y;
    }
    function dragended(event: any, d: Node) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    return () => {
      simulation.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  // Handle Visual Updates & Camera Logic (Runs on Theme/Selection/Data/Hover change)
  useEffect(() => {
    if (!gRef.current || !svgRef.current || !simulationRef.current) return;

    const nodes = gRef.current.selectAll<SVGGElement, Node>(".nodes g");
    const links = gRef.current.selectAll<SVGLineElement, Link>(".links line");
    const texts = gRef.current.selectAll<SVGTextElement, Node>(".nodes text");
    const circles = gRef.current.selectAll<SVGCircleElement, Node>(".nodes circle");

    // 1. Update Theme-dependent Colors (Markers & Lines)
    const defs = d3.select(svgRef.current).select("defs");
    ['recommended', 'neutral', 'critiqued', 'default'].forEach(type => {
      let color = colors.linkSentiment.neutral;
      // if (type === 'recommended') color = colors.linkSentiment.recommended;
      // if (type === 'critiqued') color = colors.linkSentiment.critiqued;
      defs.select(`#arrow-${type} path`).attr("fill", color);
    });

    // 2. Selection States
    const anythingSelected = !!selectedId || !!selectedLink;
    
    const isNodeActive = (d: Node) => {
        if (selectedId && d.id === selectedId) return true;
        if (selectedLink) {
             const sId = (selectedLink.source as Node).id;
             const tId = (selectedLink.target as Node).id;
             return d.id === sId || d.id === tId;
        }
        return false;
    };

    circles
      .transition().duration(300)
      .attr("fill", d => isNodeActive(d) ? colors.nodeSelected : colors.node)
      .style("filter", d => {
          // Changed glow color from Amber to Violet in dark mode
          if (isNodeActive(d)) return isDark ? "drop-shadow(0 0 8px rgba(167, 139, 250, 0.9))" : "drop-shadow(0 0 4px rgba(14, 165, 233, 0.5))";
          return isDark ? "drop-shadow(0 0 4px rgba(255, 255, 255, 0.3))" : "drop-shadow(0 1px 3px rgba(0,0,0,0.2))";
      })
      .attr("opacity", d => {
          if (!anythingSelected) return 0.9;
          if (selectedId) {
             if (isNodeActive(d)) return 1;
             const isNeighbor = linksRef.current.some(l => 
                ((l.source as Node).id === selectedId && (l.target as Node).id === d.id) ||
                ((l.target as Node).id === selectedId && (l.source as Node).id === d.id)
             );
             return isNeighbor ? 0.8 : 0.1;
          }
          if (selectedLink) return isNodeActive(d) ? 1 : 0.1;
          return 0.1;
      });

    texts
        .transition().duration(300)
        .attr("fill", d => isNodeActive(d) ? colors.textSelected : colors.text)
        .attr("font-weight", d => isNodeActive(d) ? "700" : "500")
        .style("text-shadow", isDark ? "0 2px 4px rgba(0,0,0,0.9)" : "0 1px 2px rgba(255,255,255,0.8)")
        .attr("opacity", d => {
             if (searchQuery) {
                const query = searchQuery.toLowerCase();
                if (d.title.toLowerCase().includes(query) || d.author.toLowerCase().includes(query)) return 1;
                return 0.1;
             }
             if (!anythingSelected) return 1;
             if (selectedId) {
                 if (isNodeActive(d)) return 1;
                 const isNeighbor = linksRef.current.some(l => 
                    ((l.source as Node).id === selectedId && (l.target as Node).id === d.id) ||
                    ((l.target as Node).id === selectedId && (l.source as Node).id === d.id)
                 );
                 return isNeighbor ? 0.8 : 0.1;
             }
             if (selectedLink) return isNodeActive(d) ? 1 : 0.1;
             return 0.1;
        });

    links
        .transition().duration(300)
        .attr("stroke", d => {
            // if (d.sentiment === 'recommended') return colors.linkSentiment.recommended;
            // if (d.sentiment === 'critiqued') return colors.linkSentiment.critiqued;
            // return colors.linkSentiment.neutral;
            return colors.linkSentiment.recommended;
        })
        .style("filter", isDark ? "drop-shadow(0 0 2px rgba(148, 163, 184, 0.5))" : null) // Add glow to links
        .attr("opacity", d => {
            if (hoveredLink && d === hoveredLink) return 1;

            if (!anythingSelected) return isDark ? 0.4 : 0.6;
            if (selectedId) {
                const sId = (d.source as Node).id;
                const tId = (d.target as Node).id;
                return (sId === selectedId || tId === selectedId) ? 0.8 : 0.05;
            }
            if (selectedLink) {
                const sId = (selectedLink.source as Node).id;
                const tId = (selectedLink.target as Node).id;
                const dSId = (d.source as Node).id;
                const dTId = (d.target as Node).id;
                return (sId === dSId && tId === dTId) ? 1 : 0.05;
            }
            return 0.05;
        })
        .attr("stroke-width", d => {
            if (hoveredLink && d === hoveredLink) return 3;

            if (selectedLink) {
                const sId = (selectedLink.source as Node).id;
                const tId = (selectedLink.target as Node).id;
                const dSId = (d.source as Node).id;
                const dTId = (d.target as Node).id;
                return (sId === dSId && tId === dTId) ? 3 : 1;
            }
            if (selectedId) {
                const sId = (d.source as Node).id;
                const tId = (d.target as Node).id;
                return (sId === selectedId || tId === selectedId) ? 2 : 1;
            }
            return 1.5;
        });

    // 3. Handle Search Highlighting
    if (searchQuery) {
        const query = searchQuery.toLowerCase();
        circles.attr("fill", d => {
            if (isNodeActive(d)) return colors.nodeSelected; 
            if (d.title.toLowerCase().includes(query) || d.author.toLowerCase().includes(query)) return colors.searchMatch; 
            return isDark ? "#334155" : "#cbd5e1"; 
        });
    }

    // 4. Smart Camera Focus
    const prev = prevRef.current;
    const selectionChanged = prev.id !== selectedId || prev.link !== selectedLink;
    const dataChanged = prev.data !== data;

    if ((selectionChanged || dataChanged) && (selectedId || selectedLink) && svgRef.current && zoomRef.current) {
        // Use a small timeout to ensure the render cycle is complete and refs are up to date
        setTimeout(() => {
            let targetX = 0;
            let targetY = 0;
            let shouldFocus = false;
            
            if (selectedId) {
                const selectedNode = nodesRef.current.find(n => n.id === selectedId);
                if (selectedNode && selectedNode.x !== undefined && selectedNode.y !== undefined) {
                    targetX = selectedNode.x;
                    targetY = selectedNode.y;
                    shouldFocus = true;
                }
            } else if (selectedLink) {
                const s = selectedLink.source as Node;
                const t = selectedLink.target as Node;
                const sNode = nodesRef.current.find(n => n.id === s.id);
                const tNode = nodesRef.current.find(n => n.id === t.id);
                
                if (sNode && tNode && sNode.x !== undefined && sNode.y !== undefined && tNode.x !== undefined && tNode.y !== undefined) {
                    targetX = (sNode.x + tNode.x) / 2;
                    targetY = (sNode.y + tNode.y) / 2;
                    shouldFocus = true;
                }
            }

            if (shouldFocus && containerRef.current && svgRef.current) {
                const width = containerRef.current.clientWidth || 0;
                const height = containerRef.current.clientHeight || 0;
                const scale = 2; 
                
                const x = -targetX * scale + width / 2;
                const y = -targetY * scale + height / 2;
                
                d3.select(svgRef.current)
                    .transition()
                    .duration(750)
                    .ease(d3.easeCubicOut)
                    .call(zoomRef.current!.transform, d3.zoomIdentity.translate(x, y).scale(scale));
            }
        }, 10);
    }

    // Update previous state
    prevRef.current = { id: selectedId, link: selectedLink, data };

  }, [selectedId, selectedLink, searchQuery, data, theme, colors, hoveredLink]); 

  return (
    <div ref={containerRef} className="w-full h-full relative overflow-hidden">
        <svg ref={svgRef} className="w-full h-full block" />
    </div>
  );
});

export default GraphCanvas;