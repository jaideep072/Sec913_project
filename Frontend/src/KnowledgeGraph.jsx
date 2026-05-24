// KnowledgeGraph.jsx — interactive force-directed graph of the whole catalog.
//
// Every resource is a node, colored by its section. Edges connect resources
// that share at least one tag or theme. Pan with drag, zoom with scroll,
// click a node to focus + see its connections, or pin a node by double-click.
//
// Built on d3-force for the physics + d3-zoom for pan/zoom + d3-drag for node
// interaction, rendered as plain SVG — no virtual DOM thrash, looks great on
// hundreds of nodes.

import { useEffect, useMemo, useRef, useState } from 'react';

function useEscape(onClose) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);
}
import { forceSimulation, forceLink, forceManyBody, forceCenter, forceCollide } from 'd3-force';
import { select } from 'd3-selection';
import { drag } from 'd3-drag';
import { zoom as d3zoom } from 'd3-zoom';

const SECTION_COLORS = {
  literature: '#ef4444',
  history:    '#f59e0b',
  science:    '#10b981',
  governance: '#3b82f6',
};
const DEFAULT_COLOR = '#64748b';

/**
 * Turn the resource list into nodes/edges.
 * Two resources are linked if they share ≥1 tag, theme, or section.
 * Weight = number of overlaps (controls visual edge strength).
 */
function buildGraph(resources) {
  const nodes = resources.map(r => ({
    id: r.id,
    title: r.title,
    sectionId: r.sectionId,
    author: r.author,
    tags: new Set([
      ...(r.tags || []),
      ...(r.keyThemes || []),
      ...(r.similarTo || []),
      ...(r.similarTopics || []),
      ...(r.relatedTopics || []),
    ].map(s => s.toLowerCase())),
  }));

  const links = [];
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i], b = nodes[j];
      let overlap = 0;
      for (const t of a.tags) if (b.tags.has(t)) overlap++;
      // Same-section bonus link, so islands form by section even without tag overlap
      const sameSection = a.sectionId === b.sectionId;
      if (overlap > 0 || sameSection) {
        links.push({
          source: a.id,
          target: b.id,
          weight: overlap + (sameSection ? 0.5 : 0),
        });
      }
    }
  }
  return { nodes, links };
}

function KnowledgeGraph({ resources, sections, onSelect, onClose }) {
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const [hover, setHover] = useState(null);
  const [focused, setFocused] = useState(null);

  useEscape(onClose);

  // Build graph data only when resources change
  const data = useMemo(() => buildGraph(resources || []), [resources]);

  useEffect(() => {
    if (!svgRef.current || data.nodes.length === 0) return;

    const svg = select(svgRef.current);
    const width  = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;
    svg.selectAll('*').remove();

    // Group inside which everything pans/zooms
    const g = svg.append('g');

    // Pan + zoom on the SVG, applied to the inner group
    const zoomBehavior = d3zoom()
      .scaleExtent([0.2, 4])
      .on('zoom', (event) => g.attr('transform', event.transform));
    svg.call(zoomBehavior);

    // Force simulation
    const linkForce = forceLink(data.links).id(d => d.id).distance(80).strength(d => 0.05 + d.weight * 0.05);
    const sim = forceSimulation(data.nodes)
      .force('link', linkForce)
      .force('charge', forceManyBody().strength(-220))
      .force('center', forceCenter(width / 2, height / 2))
      .force('collide', forceCollide(22));

    // Draw links
    const link = g.append('g')
      .attr('stroke', '#cbd5e1')
      .attr('stroke-opacity', 0.4)
      .selectAll('line')
      .data(data.links)
      .join('line')
      .attr('stroke-width', d => Math.min(3, 0.5 + d.weight * 0.5));

    // Draw nodes
    const node = g.append('g')
      .selectAll('g')
      .data(data.nodes)
      .join('g')
      .style('cursor', 'pointer');

    node.append('circle')
      .attr('r', 12)
      .attr('fill', d => SECTION_COLORS[d.sectionId] || DEFAULT_COLOR)
      .attr('stroke', 'white')
      .attr('stroke-width', 2);

    node.append('text')
      .text(d => d.title)
      .attr('x', 16)
      .attr('y', 5)
      .attr('font-size', 12)
      .attr('font-family', 'system-ui, sans-serif')
      .attr('fill', '#0f172a')
      .style('user-select', 'none')
      .style('pointer-events', 'none');

    // Drag behavior
    node.call(drag()
      .on('start', (event, d) => {
        if (!event.active) sim.alphaTarget(0.3).restart();
        d.fx = d.x; d.fy = d.y;
      })
      .on('drag', (event, d) => { d.fx = event.x; d.fy = event.y; })
      .on('end', (event, d) => {
        if (!event.active) sim.alphaTarget(0);
        // double-click un-pins, single-click leaves it pinned for clarity
        // Keep pinned until user double-clicks (handled below)
      }));

    node
      .on('mouseenter', (event, d) => setHover(d))
      .on('mouseleave', () => setHover(null))
      .on('click', (event, d) => {
        event.stopPropagation();
        setFocused(d);
        if (onSelect) onSelect(d.id);
      })
      .on('dblclick', (event, d) => {
        d.fx = null; d.fy = null;            // unpin
        sim.alphaTarget(0.3).restart();
      });

    sim.on('tick', () => {
      link
        .attr('x1', d => d.source.x).attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x).attr('y2', d => d.target.y);
      node.attr('transform', d => `translate(${d.x},${d.y})`);
    });

    // Cool down after a couple seconds so the graph stops jittering
    setTimeout(() => sim.alphaTarget(0).restart(), 2000);

    return () => sim.stop();
  }, [data, onSelect]);

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'white', zIndex: 900,
      display: 'flex', flexDirection: 'column',
    }}>
      <header style={{
        padding: '14px 24px', borderBottom: '1px solid #e2e8f0',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22 }}>🌐 Knowledge Graph</h1>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 13 }}>
            {data.nodes.length} resources · {data.links.length} connections ·
            scroll to zoom · drag to pan · click a node to open · double-click to release a dragged node
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Legend sections={sections} />
          <button onClick={onClose} style={{
            padding: '8px 16px', border: '1px solid #cbd5e1',
            background: 'white', borderRadius: 8, cursor: 'pointer', fontSize: 14,
          }}>Close</button>
        </div>
      </header>

      <div ref={containerRef} style={{ flex: 1, position: 'relative', background: '#f8fafc' }}>
        <svg ref={svgRef} width="100%" height="100%" />

        {hover && (
          <div style={{
            position: 'absolute', bottom: 16, left: 16,
            background: 'white', padding: '10px 14px',
            borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            maxWidth: 320, fontSize: 13,
          }}>
            <strong>{hover.title}</strong>
            {hover.author && <div style={{ color: '#64748b' }}>by {hover.author}</div>}
            <div style={{ marginTop: 4 }}>
              <span style={{
                display: 'inline-block', width: 10, height: 10, borderRadius: 5,
                background: SECTION_COLORS[hover.sectionId] || DEFAULT_COLOR,
                marginRight: 6, verticalAlign: 'middle',
              }} />
              {hover.sectionId}
            </div>
          </div>
        )}

        {focused && (
          <div style={{
            position: 'absolute', top: 16, right: 16,
            background: 'white', padding: '14px 18px',
            borderRadius: 10, boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            maxWidth: 280,
          }}>
            <strong>{focused.title}</strong>
            {focused.author && <div style={{ color: '#64748b', fontSize: 13 }}>by {focused.author}</div>}
            <button
              onClick={() => { if (onSelect) onSelect(focused.id); onClose(); }}
              style={{
                marginTop: 10, padding: '6px 12px',
                background: '#0f172a', color: 'white', border: 'none',
                borderRadius: 6, cursor: 'pointer', fontSize: 13,
              }}
            >Open in catalog →</button>
          </div>
        )}
      </div>
    </div>
  );
}

function Legend({ sections }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 12 }}>
      {(sections || []).map(s => (
        <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{
            display: 'inline-block', width: 12, height: 12, borderRadius: 6,
            background: SECTION_COLORS[s.id] || DEFAULT_COLOR,
          }} />
          {s.name}
        </div>
      ))}
    </div>
  );
}

export default KnowledgeGraph;
