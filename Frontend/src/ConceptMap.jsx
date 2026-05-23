// ConceptMap.jsx — Mermaid mind-map of a resource's main ideas.
//
// Built deterministically from the resource's existing structured fields
// (keyThemes, keyFigures, keyFacts, similarTo, similarTopics, relatedTopics).
// No AI / API key needed — but the diagram still looks great because the
// underlying data is already rich.
//
// Toggleable: hidden until the user clicks "Show concept map" so the page
// stays snappy. Mermaid is initialized once.

import { useEffect, useId, useRef, useState } from 'react';

let mermaidLoader = null;
function loadMermaid() {
  if (!mermaidLoader) {
    mermaidLoader = import('mermaid').then(m => {
      const mermaid = m.default;
      mermaid.initialize({
        startOnLoad: false,
        theme: 'neutral',
        flowchart: { useMaxWidth: true, htmlLabels: true, curve: 'basis' },
      });
      return mermaid;
    });
  }
  return mermaidLoader;
}

/** Sanitize a label so it's safe inside Mermaid's bracket syntax. */
function clean(s) {
  if (!s) return '';
  return String(s)
    .replace(/[\[\]\|\{\}"']/g, ' ')   // strip mermaid-significant chars
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 60);
}

/** Convert a resource into a Mermaid `mindmap` definition. */
function buildMermaid(resource) {
  const root = clean(resource.title) || 'Resource';
  const lines = ['mindmap', `  root((${root}))`];

  const branch = (label, items) => {
    items = (items || []).filter(Boolean).map(clean).filter(Boolean);
    if (items.length === 0) return;
    lines.push(`    ${label}`);
    items.slice(0, 6).forEach(i => lines.push(`      ${i}`));
  };

  branch('Themes',         resource.keyThemes);
  branch('Key Figures',    resource.keyFigures);
  branch('Notable Facts',  resource.keyFacts);
  branch('Tags',           resource.tags);
  branch('Related Topics', resource.relatedTopics || resource.similarTopics || resource.similarTo);

  // Add a single-line "Why study this" leaf if present
  const why = resource.whyRead || resource.whyStudy;
  if (why) lines.push(`    Why It Matters\n      ${clean(why)}`);

  // Author/period metadata as a sibling branch (only if present)
  const meta = [resource.author, resource.year, resource.period, resource.origin].filter(Boolean);
  if (meta.length) branch('Context', meta);

  return lines.join('\n');
}

function ConceptMap({ resource }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  const containerRef = useRef(null);
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');

  useEffect(() => {
    if (!open || !resource || !containerRef.current) return;
    let cancelled = false;
    setError('');

    (async () => {
      try {
        const mermaid = await loadMermaid();
        const src = buildMermaid(resource);
        const { svg } = await mermaid.render(`concept-${id}`, src);
        if (!cancelled && containerRef.current) {
          containerRef.current.innerHTML = svg;
        }
      } catch (e) {
        if (!cancelled) setError(e.message || 'Failed to render concept map.');
      }
    })();

    return () => { cancelled = true; };
  }, [open, resource, id]);

  // Hide concept map when switching resources
  useEffect(() => { setOpen(false); }, [resource?.id]);

  if (!resource) return null;

  // If there's not enough structured data, skip the toggle entirely.
  const hasContent =
    (resource.keyThemes && resource.keyThemes.length) ||
    (resource.keyFigures && resource.keyFigures.length) ||
    (resource.keyFacts && resource.keyFacts.length) ||
    (resource.relatedTopics && resource.relatedTopics.length) ||
    (resource.similarTopics && resource.similarTopics.length) ||
    (resource.similarTo && resource.similarTo.length) ||
    (resource.tags && resource.tags.length);

  if (!hasContent) return null;

  return (
    <div style={box} role="region" aria-label="Concept map">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <strong>🗺️ Concept Map</strong>
        <button
          onClick={() => setOpen(o => !o)}
          style={btn}
          aria-expanded={open}
        >{open ? 'Hide' : 'Show'} concept map</button>
      </div>

      {open && (
        <div style={{ marginTop: 12 }}>
          {error ? (
            <p style={{ color: '#991b1b', fontSize: 13 }}>{error}</p>
          ) : (
            <div
              ref={containerRef}
              role="img"
              aria-label={`Concept map for ${resource.title}`}
              style={{
                width: '100%', overflow: 'auto',
                background: 'white', borderRadius: 8, padding: 12,
              }}
            >
              <p style={{ color: '#94a3b8', fontSize: 13 }}>Rendering…</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const box = { background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: 12, marginTop: 12 };
const btn = { padding: '6px 14px', borderRadius: 6, border: '1px solid #cbd5e1', background: 'white', cursor: 'pointer', fontSize: 13 };

export default ConceptMap;
