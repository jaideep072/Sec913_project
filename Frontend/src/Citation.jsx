// Citation.jsx — generate APA / MLA / Chicago / BibTeX citations from a resource.
//
// Pure client-side. Uses fields already on the Resource model
// (title, author, year, sectionId). No backend, no library.
// Accessed from a small "Cite" button on the resource detail panel.

import { useEffect, useMemo, useRef, useState } from 'react';
import useFocusTrap from './useFocusTrap.js';

const FORMATS = ['APA', 'MLA', 'Chicago', 'BibTeX'];

/** "Lee, Harper" → "Lee, H." */
function apaAuthor(full) {
  if (!full) return '';
  const parts = full.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  const last = parts.pop();
  const initials = parts.map(p => p[0].toUpperCase() + '.').join(' ');
  return `${last}, ${initials}`;
}

/** "Harper Lee" → "Lee, Harper" */
function mlaAuthor(full) {
  if (!full) return '';
  const parts = full.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  const last = parts.pop();
  return `${last}, ${parts.join(' ')}`;
}

/** "Harper Lee" / "Lee, Harper" → harperlee (cite-key for BibTeX) */
function citeKey(name, year) {
  const slug = (name || 'unknown').toLowerCase().replace(/[^a-z]/g, '');
  return `${slug || 'unknown'}${year || ''}`;
}

function formatAPA(r) {
  const author = r.author ? apaAuthor(r.author) : '';
  const year   = r.year ? `(${r.year})` : '(n.d.)';
  return [
    author && `${author}.`,
    year + '.',
    `*${r.title}*.`,
    'Knowledge Portal.',
  ].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
}

function formatMLA(r) {
  const author = r.author ? mlaAuthor(r.author) : '';
  return [
    author && `${author}.`,
    `*${r.title}*.`,
    r.year ? `${r.year}.` : '',
    'Knowledge Portal.',
  ].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
}

function formatChicago(r) {
  const author = r.author || '';
  return [
    author && `${author}.`,
    `*${r.title}*.`,
    'Knowledge Portal,',
    r.year ? `${r.year}.` : '',
  ].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
}

function formatBibTeX(r) {
  const key = citeKey(r.author || r.title, r.year);
  const lines = ['@book{' + key + ','];
  if (r.title)  lines.push(`  title   = {${r.title}},`);
  if (r.author) lines.push(`  author  = {${r.author}},`);
  if (r.year)   lines.push(`  year    = {${r.year}},`);
  if (r.sectionId) lines.push(`  keywords = {${r.sectionId}},`);
  lines.push(`  publisher = {Knowledge Portal}`);
  lines.push('}');
  return lines.join('\n');
}

const FORMATTERS = { APA: formatAPA, MLA: formatMLA, Chicago: formatChicago, BibTeX: formatBibTeX };

function Citation({ resource }) {
  const [open, setOpen] = useState(false);
  const [fmt, setFmt] = useState('APA');
  const [copied, setCopied] = useState(false);
  const dialogRef = useRef(null);

  useFocusTrap(dialogRef, open);

  // Close on Escape key
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, setOpen]);

  const text = useMemo(
    () => (resource ? FORMATTERS[fmt](resource) : ''),
    [resource, fmt]
  );

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* clipboard refused */ }
  };

  if (!resource) return null;

  return (
    <>
      <button onClick={() => setOpen(true)} style={btnSm} aria-label="Cite this resource">
        📝 Cite
      </button>

      {open && (
        <div onClick={() => setOpen(false)} style={overlay}>
          <div ref={dialogRef} onClick={e => e.stopPropagation()} style={modal} role="dialog" aria-labelledby="cite-h">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 id="cite-h" style={{ margin: 0, fontSize: 20 }}>📝 Cite this resource</h2>
              <button onClick={() => setOpen(false)} style={closeBtn} aria-label="Close">✕</button>
            </div>

            <p style={{ color: '#64748b', fontSize: 13, margin: '6px 0 16px' }}>
              Generated from this resource's metadata. Adjust manually if your style guide demands different punctuation.
            </p>

            <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
              {FORMATS.map(f => (
                <button
                  key={f}
                  onClick={() => setFmt(f)}
                  style={f === fmt ? tabActive : tab}
                  aria-pressed={f === fmt}
                >{f}</button>
              ))}
            </div>

            <pre style={{
              background: '#0f172a', color: '#f8fafc',
              padding: 14, borderRadius: 8,
              fontSize: 13, lineHeight: 1.5,
              whiteSpace: 'pre-wrap', wordBreak: 'break-word',
              margin: 0, fontFamily: '"SF Mono", "Cascadia Code", Consolas, monospace',
            }}>{text}</pre>

            <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
              <button onClick={copy} style={btnPrimary} aria-label="Copy citation">
                {copied ? '✓ Copied' : '📋 Copy to clipboard'}
              </button>
              <button onClick={() => setOpen(false)} style={btn}>Close</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const overlay = {
  position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100,
};
const modal = {
  background: 'white', borderRadius: 14, padding: 24,
  width: '90%', maxWidth: 600,
  boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
};
const btn        = { padding: '8px 14px', border: '1px solid #cbd5e1', background: 'white', borderRadius: 8, cursor: 'pointer', fontSize: 14 };
const btnPrimary = { ...btn, background: '#0f172a', color: 'white', border: '1px solid #0f172a', fontWeight: 600 };
const btnSm      = { padding: '4px 10px', borderRadius: 6, border: '1px solid #cbd5e1', background: 'white', cursor: 'pointer', fontSize: 13 };
const closeBtn   = { border: 'none', background: 'none', fontSize: 22, cursor: 'pointer', color: '#64748b' };
const tab        = { padding: '6px 14px', border: '1px solid #cbd5e1', background: 'white', borderRadius: 6, cursor: 'pointer', fontSize: 13 };
const tabActive  = { ...tab, background: '#0f172a', color: 'white', border: '1px solid #0f172a', fontWeight: 600 };

export default Citation;
