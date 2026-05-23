import React, { useEffect, useMemo, useState, useCallback } from 'react';

import Librarian from './librarian.jsx';
import Staff from './staff.jsx';
import Admin from './admin.jsx';
import Landing from './Landing.jsx';
import ReadAloud from './ReadAloud.jsx';
import ConceptMap from './ConceptMap.jsx';
import Citation from './Citation.jsx';
import KnowledgeGraph from './KnowledgeGraph.jsx';
import {
  sectionsApi, resourcesApi, clearToken, getStoredToken, fetchUserInfo,
  requestsApi, externalApi,
} from './api.js';

/* ── ResourceDetailPanel (unchanged — pure presentation) ───── */

function ResourceDetailPanel({ resource, allSections, onRequest, requestState, viewerRole }) {
  if (!resource) return (
    <aside className="detail-panel detail-panel--empty">
      <div className="detail-empty">
        <span className="detail-empty-icon">📖</span>
        <h3>Select a resource</h3>
        <p>Choose any item from the list to explore in depth.</p>
      </div>
    </aside>
  );

  // A "locked" resource from the backend is missing all the rich fields —
  // only title/section/(cover) are populated. We surface a clear gate.
  const isLocked = viewerRole === 'Student' &&
    !resource.summary && !resource.body && !resource.author &&
    !(resource.keyThemes && resource.keyThemes.length);

  // Try to pull a cover URL out of the body line `Cover: ...` (set by OpenLibrary import).
  const coverUrl = (() => {
    if (!resource.body) return null;
    const m = resource.body.match(/Cover:\s*(https?:\/\/\S+)/);
    return m ? m[1] : null;
  })();

  if (isLocked) {
    return (
      <aside className="detail-panel" aria-label="Locked resource">
        <div className="detail-header" style={{ textAlign: 'center' }}>
          <div className="detail-badge">
            {(allSections || []).find(s => s.id === resource.sectionId)?.name || resource.sectionId}
          </div>
          {coverUrl && (
            <img src={coverUrl} alt=""
                 style={{ maxWidth: 180, margin: '16px auto', display: 'block', borderRadius: 8 }} />
          )}
          <h2 className="detail-title">{resource.title}</h2>
        </div>
        <div className="detail-body" style={{ textAlign: 'center' }}>
          <div style={{
            background: '#fef3c7', border: '1px solid #fde68a',
            padding: 20, borderRadius: 12, marginTop: 12,
          }}>
            <div style={{ fontSize: 38, marginBottom: 8 }}>🔒</div>
            <h3 style={{ margin: '0 0 8px', color: '#92400e' }}>Borrow to unlock</h3>
            <p style={{ margin: '0 0 16px', color: '#78350f', fontSize: 14 }}>
              Full summary, themes, key facts, and quotes appear here after a librarian
              approves your borrow request.
            </p>
            {onRequest && (
              <button
                type="button"
                onClick={() => onRequest(resource)}
                disabled={requestState === 'sending' || requestState === 'done'}
                style={{
                  background: requestState === 'done' ? '#16a34a' : '#0f172a',
                  color: 'white', border: 'none',
                  padding: '10px 20px', borderRadius: 8, cursor: 'pointer',
                  fontWeight: 600, fontSize: 14,
                }}
              >
                {requestState === 'sending' ? 'Sending request…' :
                 requestState === 'done'    ? '✓ Request sent — awaiting librarian' :
                                              '📨 Request to Borrow'}
              </button>
            )}
          </div>
        </div>
      </aside>
    );
  }

  return (
    <aside className="detail-panel">
      <div className="detail-header">
        <div className="detail-badge">
          {(allSections || []).find(s => s.id === resource.sectionId)?.name}
        </div>
        <h2 className="detail-title">{resource.title}</h2>
        {onRequest && (
          <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => onRequest(resource)}
              disabled={requestState === 'sending' || requestState === 'done'}
              style={{
                background: requestState === 'done' ? '#16a34a' : '#0f172a',
                color: 'white', border: 'none',
                padding: '8px 16px', borderRadius: 8, cursor: 'pointer',
                fontWeight: 600, fontSize: 14,
              }}
            >
              {requestState === 'sending' ? 'Sending request…' :
               requestState === 'done'    ? '✓ Request sent to librarian' :
                                            '📨 Request to Borrow'}
            </button>
            <Citation resource={resource} />
          </div>
        )}

        <ReadAloud resource={resource} />
        <ConceptMap resource={resource} />

        {(resource.author || resource.period || resource.difficulty) && (
          <div className="detail-meta-row">
            {resource.author && <span className="detail-chip">{resource.author}</span>}
            {resource.year && <span className="detail-chip">{resource.year}</span>}
            {resource.pages && <span className="detail-chip">{resource.pages} pages</span>}
            {resource.period && <span className="detail-chip">{resource.period}</span>}
            {resource.origin && <span className="detail-chip">{resource.origin}</span>}
            {resource.difficulty && (
              <span className={`detail-chip detail-chip--${resource.difficulty.toLowerCase()}`}>
                {resource.difficulty}
              </span>
            )}
          </div>
        )}

        <p className="detail-summary">{resource.summary}</p>
      </div>

      <div className="detail-body">
        <p className="detail-description">{resource.body}</p>

        {resource.keyQuote && (
          <blockquote className="detail-quote">
            <p>{resource.keyQuote}</p>
          </blockquote>
        )}

        {resource.keyThemes && resource.keyThemes.length > 0 && (
          <div className="detail-section">
            <h4 className="detail-section-title">Key Themes</h4>
            <div className="detail-tags">
              {resource.keyThemes.map(t => <span key={t} className="detail-tag">{t}</span>)}
            </div>
          </div>
        )}

        {resource.keyFigures && resource.keyFigures.length > 0 && (
          <div className="detail-section">
            <h4 className="detail-section-title">Key Figures</h4>
            <div className="detail-tags">
              {resource.keyFigures.map(f => <span key={f} className="detail-tag detail-tag--person">{f}</span>)}
            </div>
          </div>
        )}

        {resource.keyFacts && resource.keyFacts.length > 0 && (
          <div className="detail-section">
            <h4 className="detail-section-title">Fascinating Facts</h4>
            <ul className="detail-facts">
              {resource.keyFacts.map((f, i) => <li key={i}>{f}</li>)}
            </ul>
          </div>
        )}

        {resource.keyFact && (
          <div className="detail-section">
            <h4 className="detail-section-title">Key Fact</h4>
            <div className="detail-highlight">{resource.keyFact}</div>
          </div>
        )}

        {resource.impact && (
          <div className="detail-section">
            <h4 className="detail-section-title">Historical Impact</h4>
            <p className="detail-impact">{resource.impact}</p>
          </div>
        )}

        {resource.whyRead && (
          <div className="detail-section">
            <h4 className="detail-section-title">Why Read This?</h4>
            <p className="detail-impact">{resource.whyRead}</p>
          </div>
        )}

        {resource.whyStudy && (
          <div className="detail-section">
            <h4 className="detail-section-title">Why Study This?</h4>
            <p className="detail-impact">{resource.whyStudy}</p>
          </div>
        )}

        {((resource.similarTo && resource.similarTo.length) ||
          (resource.similarTopics && resource.similarTopics.length) ||
          (resource.relatedTopics && resource.relatedTopics.length)) ? (
          <div className="detail-section">
            <h4 className="detail-section-title">Explore Next</h4>
            <div className="detail-tags">
              {[...(resource.similarTo || []), ...(resource.similarTopics || []), ...(resource.relatedTopics || [])]
                .map(t => <span key={t} className="detail-tag detail-tag--link">{t}</span>)}
            </div>
          </div>
        ) : null}

        <div className="detail-tags-footer">
          {(resource.tags || []).map(t => <span key={t} className="detail-raw-tag">#{t}</span>)}
        </div>
      </div>
    </aside>
  );
}

/* ── Student / Staff Knowledge Portal ─────────────────────── */

function StudentPortal({ user, onLogout, allResources, sections }) {
  // ── Local catalog state ──
  const [searchText, setSearchText] = useState('');
  const [selectedResourceId, setSelectedResourceId] = useState(null);
  const [requestStateByResource, setRequestStateByResource] = useState({}); // id → 'sending' | 'done' | 'error'
  const [requestError, setRequestError] = useState('');
  const [searchResults, setSearchResults] = useState(null); // null = no search active
  const [showMyRequests, setShowMyRequests] = useState(false);
  const [myRequests, setMyRequests] = useState([]);
  const [showGraph, setShowGraph] = useState(false);
  const [selectedResourceDetail, setSelectedResourceDetail] = useState(null);

  // ── External browse state ──
  const [browseMode, setBrowseMode] = useState('catalog'); // 'catalog' | 'openlibrary' | 'arxiv'
  const [extQuery, setExtQuery] = useState('');
  const [extResults, setExtResults] = useState([]);
  const [extBusy, setExtBusy] = useState(false);
  const [extRequestState, setExtRequestState] = useState({}); // key → 'sending' | 'done'

  // No more section filtering — students see the whole catalog and use search/scroll.
  const sectionResources = useMemo(
    () => searchResults !== null ? searchResults : (allResources || []),
    [allResources, searchResults]
  );

  // Debounced full-text search against the backend whenever the user types.
  useEffect(() => {
    const q = searchText.trim();
    if (!q) { setSearchResults(null); return; }
    const handle = setTimeout(async () => {
      try {
        const rows = await resourcesApi.search(q);
        setSearchResults(rows);
      } catch { /* fall back to client filter — keep showing section list */ }
    }, 250);
    return () => clearTimeout(handle);
  }, [searchText]);

  const handleRequest = async (resource) => {
    setRequestError('');
    setRequestStateByResource(s => ({ ...s, [resource.id]: 'sending' }));
    try {
      await requestsApi.create(resource.id, '');
      setRequestStateByResource(s => ({ ...s, [resource.id]: 'done' }));
    } catch (e) {
      setRequestError(e.message || 'Failed to send request.');
      setRequestStateByResource(s => ({ ...s, [resource.id]: 'error' }));
    }
  };

  const openMyRequests = async () => {
    setShowMyRequests(true);
    try { setMyRequests(await requestsApi.list()); }
    catch { setMyRequests([]); }
  };
  const cancelRequest = async (id) => {
    if (!window.confirm('Cancel this pending request?')) return;
    try {
      await requestsApi.cancel(id);
      setMyRequests(await requestsApi.list());
    } catch (e) { setRequestError(e.message); }
  };

  // ── External browse handlers ──
  const runExtSearch = async (e) => {
    e?.preventDefault();
    const q = extQuery.trim();
    if (!q) return;
    setExtBusy(true);
    setExtResults([]);
    try {
      const rows = browseMode === 'openlibrary'
        ? await externalApi.olSearch(q, 15)
        : await externalApi.arxivSearch(q, 15);
      setExtResults(rows);
    } catch (e2) {
      setRequestError(e2.message || 'Search failed.');
    } finally {
      setExtBusy(false);
    }
  };

  const handleExtRequest = async (item) => {
    const key = item.arxivId || item.openLibraryKey || item.title;
    setExtRequestState(s => ({ ...s, [key]: 'sending' }));
    try {
      if (browseMode === 'openlibrary') {
        await externalApi.olRequest({
          title: item.title,
          author: item.author,
          year: item.year,
          subjects: item.subjects,
          coverUrl: item.coverUrl,
          notes: '',
        });
      } else {
        await externalApi.arxivRequest({
          title: item.title,
          summary: item.summary,
          author: item.author,
          year: item.year,
          categories: item.categories,
          arxivId: item.arxivId,
          absUrl: item.absUrl,
          pdfUrl: item.pdfUrl,
          notes: '',
        });
      }
      setExtRequestState(s => ({ ...s, [key]: 'done' }));
    } catch (e2) {
      setRequestError(e2.message || 'Request failed.');
      setExtRequestState(s => ({ ...s, [key]: 'error' }));
    }
  };

  // When the catalog loads, pre-select the first resource.
  useEffect(() => {
    setSelectedResourceId(sectionResources[0]?.id ?? null);
  }, [allResources]); // eslint-disable-line react-hooks/exhaustive-deps

  const filteredResources = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    if (!query) return sectionResources;
    return sectionResources.filter(item => {
      const text = `${item.title} ${item.summary || ''} ${(item.tags || []).join(' ')}`;
      return text.toLowerCase().includes(query);
    });
  }, [sectionResources, searchText]);

  // Always fetch the detail fresh from the backend — that way, the moment Admin
  // confirms a borrow, the next click on this resource shows the full content.
  useEffect(() => {
    if (!selectedResourceId) { setSelectedResourceDetail(null); return; }
    let cancelled = false;
    (async () => {
      try {
        const fresh = await resourcesApi.get(selectedResourceId);
        if (!cancelled) setSelectedResourceDetail(fresh);
      } catch {
        if (!cancelled) {
          // Fall back to the (possibly redacted) item from the list if fetch fails
          setSelectedResourceDetail(
            filteredResources.find(item => item.id === selectedResourceId) || null
          );
        }
      }
    })();
    return () => { cancelled = true; };
  }, [selectedResourceId]); // eslint-disable-line react-hooks/exhaustive-deps

  const selectedResource =
    selectedResourceDetail ||
    filteredResources.find(item => item.id === selectedResourceId) ||
    filteredResources[0] ||
    null;

  return (
    <div className="app-shell">
      <header className="header">
        <div className="header-top">
          <div>
            <h1 className="site-title">STEM Knowledge Portal</h1>
            <p className="muted">Explore physics, math, CS, biology &amp; finance papers.</p>
          </div>
          <div className="header-auth">
            <span className="header-user"><strong>{user.name}</strong> · {user.role}</span>
            <button type="button" className="btn-ghost" onClick={() => setShowGraph(true)}>🌐 Knowledge Graph</button>
            <button type="button" className="btn-ghost" onClick={openMyRequests}>📨 My Requests</button>
            <button type="button" className="btn-ghost" onClick={onLogout}>Log out</button>
          </div>
        </div>
      </header>

      <main className="section-layout">
        {/* ── LEFT SIDEBAR: vertical tabs + resource list ── */}
        <aside className="sidebar-panel">
          {/* Vertical browse tabs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginBottom: 16 }}>
            {[
              ['catalog',     '📚 Catalog'],
              ['openlibrary', '📖 Open Library'],
              ['arxiv',       '📄 arXiv Papers'],
            ].map(([mode, label]) => (
              <button key={mode} type="button"
                onClick={() => { setBrowseMode(mode); setExtResults([]); setExtQuery(''); }}
                style={{
                  padding: '8px 12px', fontSize: 13, fontWeight: 600,
                  border: 'none', borderRadius: 8, cursor: 'pointer', textAlign: 'left',
                  background: browseMode === mode ? '#0f172a' : 'transparent',
                  color: browseMode === mode ? 'white' : '#334155',
                }}
              >{label}</button>
            ))}
          </div>

          {browseMode === 'catalog' ? (
            /* ── Local catalog list ── */
            <>
              <div className="search-wrapper" style={{ marginBottom: 8 }}>
                <input id="search" className="search-input" type="search"
                  value={searchText}
                  onChange={e => setSearchText(e.target.value)}
                  placeholder="Search resources…" />
              </div>

              <div className="loading-status" role="status" aria-live="polite">
                <span className="loading-text">{filteredResources.length} resource(s)</span>
              </div>

              {filteredResources.length === 0 && <p className="muted">No matching resources found.</p>}

              {filteredResources.length > 0 && (
                <ul className="list" style={{ marginTop: 6 }}>
                  {filteredResources.map(item => {
                    const locked = user?.role === 'Student' && !item.summary && !item.author;
                    return (
                      <li key={item.id} className="list-item">
                        <button type="button"
                          className={`resource-btn sidebar-btn ${selectedResourceId === item.id ? 'resource-btn--active' : ''}`}
                          onClick={() => setSelectedResourceId(item.id)}>
                          <h3 className="list-title" style={{ fontSize: 13 }}>
                            {locked && <span aria-label="locked" title="Borrow to unlock">🔒 </span>}
                            {item.title}
                          </h3>
                          {item.summary && <p className="list-summary" style={{ fontSize: 12 }}>{item.summary}</p>}
                          {locked && (
                            <p className="list-summary" style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: 12 }}>
                              Click to request access
                            </p>
                          )}
                          <div className="list-tags">
                            {(item.tags || []).map(t => <span key={t} className="mini-tag">#{t}</span>)}
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </>
          ) : (
            /* ── External browse (Open Library / arXiv) ── */
            <>
              <form onSubmit={runExtSearch} className="search-wrapper" style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                <input className="search-input" type="search"
                  value={extQuery}
                  onChange={e => setExtQuery(e.target.value)}
                  placeholder={browseMode === 'openlibrary'
                    ? 'Search books…' : 'Search papers…'}
                  style={{ flex: 1, fontSize: 13 }} />
                <button type="submit" className="add-book-btn" disabled={extBusy || !extQuery.trim()}
                  style={{ padding: '6px 12px', fontSize: 12, whiteSpace: 'nowrap' }}>
                  {extBusy ? '…' : '🔍'}
                </button>
              </form>

              {extResults.length === 0 && !extBusy && (
                <p className="muted" style={{ marginTop: 8, fontSize: 12 }}>
                  {extQuery ? 'No results.' : 'Search above to find ' + (browseMode === 'openlibrary' ? 'books' : 'papers') + '.'}
                </p>
              )}

              {extResults.length > 0 && (
                <>
                  <div className="loading-status" role="status" aria-live="polite">
                    <span className="loading-text">{extResults.length} result(s)</span>
                  </div>
                  <ul className="list" style={{ marginTop: 6 }}>
                    {extResults.map((item, i) => {
                      const key = item.arxivId || item.openLibraryKey || item.title || i;
                      const reqState = extRequestState[key];

                      return (
                        <li key={key} className="list-item">
                          <div className="resource-btn" style={{ textAlign: 'left', cursor: 'default', padding: '8px 10px' }}>
                            <h3 className="list-title" style={{ fontSize: 13 }}>{item.title}</h3>
                            <p style={{ fontSize: 11, color: '#64748b', margin: '2px 0 4px' }}>
                              {item.author || 'Unknown'}
                              {item.year ? ` · ${item.year}` : ''}
                            </p>
                            {browseMode === 'arxiv' && item.categories && (
                              <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', marginBottom: 6 }}>
                                {(item.categories || []).slice(0, 3).map(c => (
                                  <span key={c} className="mini-tag">{c}</span>
                                ))}
                              </div>
                            )}
                            <button type="button"
                              onClick={() => handleExtRequest(item)}
                              disabled={reqState === 'sending' || reqState === 'done'}
                              style={{
                                padding: '4px 10px', fontSize: 11, fontWeight: 600,
                                border: 'none', borderRadius: 5, cursor: reqState === 'done' ? 'default' : 'pointer',
                                background: reqState === 'done' ? '#16a34a' : '#0f172a',
                                color: 'white', width: '100%',
                              }}>
                              {reqState === 'sending' ? 'Sending…' :
                               reqState === 'done'   ? '✓ Sent' :
                                                       '📨 Request'}
                            </button>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </>
              )}
            </>
          )}
        </aside>

        {/* ── RIGHT: Detail panel (wider area) ── */}
        {browseMode === 'catalog' && (
          <ResourceDetailPanel
            resource={selectedResource}
            allSections={sections}
            onRequest={handleRequest}
            requestState={selectedResource ? requestStateByResource[selectedResource.id] : null}
            viewerRole={user?.role}
          />
        )}
        {browseMode !== 'catalog' && (
          <aside className="detail-panel detail-panel--empty">
            <div className="detail-empty">
              <span className="detail-empty-icon">
                {browseMode === 'openlibrary' ? '📖' : '📄'}
              </span>
              <h3>{browseMode === 'openlibrary' ? 'Open Library' : 'arXiv Papers'}</h3>
              <p>Search for resources above, then request a borrow.</p>
            </div>
          </aside>
        )}
      </main>

      {requestError && (
        <div style={{
          position: 'fixed', bottom: 20, right: 20,
          background: '#fee2e2', color: '#991b1b',
          padding: '10px 16px', borderRadius: 8, zIndex: 100,
        }}>{requestError}</div>
      )}

      {showGraph && (
        <KnowledgeGraph
          resources={allResources}
          sections={sections}
          onClose={() => setShowGraph(false)}
          onSelect={(id) => setSelectedResourceId(id)}
        />
      )}

      <footer style={{
        textAlign: 'center', padding: '24px 0 8px',
        fontSize: 13, color: '#94a3b8', borderTop: '1px solid #e2e8f0',
        marginTop: 32,
      }}>
        2500032630 @Sec913
      </footer>

      {showMyRequests && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
        }} onClick={() => setShowMyRequests(false)}>
          <div onClick={e => e.stopPropagation()} style={{
            background: 'white', borderRadius: 12, padding: 24,
            maxWidth: 800, width: '90%', maxHeight: '80vh', overflowY: 'auto',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ margin: 0 }}>My Borrow Requests</h2>
              <button onClick={() => setShowMyRequests(false)} style={{ border: 'none', background: 'none', fontSize: 24, cursor: 'pointer' }}>✕</button>
            </div>
            {myRequests.length === 0 ? (
              <p style={{ color: '#64748b' }}>You haven't requested any books yet.</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                <thead><tr style={{ background: '#f1f5f9' }}>
                  <th style={{ padding: 10, textAlign: 'left' }}>Book</th>
                  <th style={{ padding: 10, textAlign: 'left' }}>Status</th>
                  <th style={{ padding: 10, textAlign: 'left' }}>Requested</th>
                  <th style={{ padding: 10, textAlign: 'left' }}>Decision</th>
                  <th style={{ padding: 10, textAlign: 'left' }}>Action</th>
                </tr></thead>
                <tbody>
                    {myRequests.map(r => {
                    const color = {
                      PENDING: '#f59e0b', APPROVED: '#16a34a',
                      REJECTED: '#dc2626', CANCELLED: '#64748b'
                    }[r.status] || '#64748b';
                    const navigateToResource = () => {
                      if (r.resourceId) {
                        setSelectedResourceId(r.resourceId);
                        setShowMyRequests(false);
                      }
                    };
                    return (
                      <tr key={r.id} style={{ borderTop: '1px solid #e2e8f0' }}>
                        <td style={{ padding: 10 }}>
                          {r.resourceId ? (
                            <a href="#" onClick={e => { e.preventDefault(); navigateToResource(); }}
                               style={{ color: '#1e40af', textDecoration: 'underline', cursor: 'pointer', fontWeight: 600 }}>
                              {r.resourceTitle}
                            </a>
                          ) : (
                            <strong>{r.resourceTitle}</strong>
                          )}
                        </td>
                        <td style={{ padding: 10 }}>
                          <span style={{ color, fontWeight: 600 }}>{r.status}</span>
                        </td>
                        <td style={{ padding: 10 }}>{new Date(r.createdAt).toLocaleDateString()}</td>
                        <td style={{ padding: 10, color: '#64748b' }}>{r.decisionNotes || '—'}</td>
                        <td style={{ padding: 10 }}>
                          {r.status === 'PENDING' && (
                            <button onClick={() => cancelRequest(r.id)} style={{
                              padding: '4px 10px', fontSize: 12,
                              border: '1px solid #fca5a5', background: 'white',
                              color: '#991b1b', borderRadius: 6, cursor: 'pointer',
                            }}>Cancel</button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Root App — auth, routing, and shared data loading ───── */

function App() {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('kp_user');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });

  // Shared data loaded from the backend after login.
  const [sections, setSections] = useState([]);
  const [resources, setResources] = useState([]);
  const [loadingData, setLoadingData] = useState(false);
  const [loadError, setLoadError] = useState('');

  // Pulls a fresh copy of sections + resources from the gateway.
  // Exposed so child portals can call it after creating/editing data.
  const reloadCatalog = useCallback(async () => {
    setLoadingData(true);
    setLoadError('');
    try {
      const [secs, ress] = await Promise.all([
        sectionsApi.list(),
        resourcesApi.list(),
      ]);
      setSections(Array.isArray(secs) ? secs : []);
      setResources(Array.isArray(ress) ? ress : []);
    } catch (err) {
      setLoadError(err.message || 'Failed to load catalog data.');
    } finally {
      setLoadingData(false);
    }
  }, []);

  // On (re)mount with a logged-in user: load the catalog.
  // Also validates the stored JWT — if the token is stale, kick back to Landing.
  useEffect(() => {
    if (!user) return;
    const token = getStoredToken();
    if (!token) {
      handleLogout();
      return;
    }
    (async () => {
      try {
        await fetchUserInfo(); // 401 here if token is invalid
        await reloadCatalog();
      } catch {
        handleLogout();
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.email]);

  const handleAuthSuccess = (u) => {
    setUser(u);
    localStorage.setItem('kp_user', JSON.stringify(u));
  };

  const handleLogout = () => {
    setUser(null);
    setSections([]);
    setResources([]);
    localStorage.removeItem('kp_user');
    clearToken();
  };

  if (!user) {
    return <Landing onAuthSuccess={handleAuthSuccess} />;
  }

  if (loadingData) {
    return (
      <div className="app-shell" style={{ padding: 40 }}>
        <p className="muted">Loading your catalog…</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="app-shell" style={{ padding: 40 }}>
        <p className="auth-error">Couldn't reach the backend: {loadError}</p>
        <p className="muted">Make sure the Spring service (:8001) and the gateway (:8000) are running.</p>
        <button className="btn-ghost" onClick={reloadCatalog}>Retry</button>
        <button className="btn-ghost" onClick={handleLogout} style={{ marginLeft: 8 }}>Log out</button>
      </div>
    );
  }

  if (user.role === 'Admin') {
    return <Admin user={user} onLogout={handleLogout} />;
  }

  if (user.role === 'Librarian') {
    return (
      <Librarian
        user={user}
        onLogout={handleLogout}
        sections={sections}
        resources={resources}
        reload={reloadCatalog}
      />
    );
  }

  if (user.role === 'Staff') {
    return (
      <Staff
        user={user}
        onLogout={handleLogout}
        resources={resources}
      />
    );
  }

  return (
    <StudentPortal
      user={user}
      onLogout={handleLogout}
      allResources={resources}
      sections={sections}
    />
  );
}

export default App;
