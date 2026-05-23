// librarian.jsx — sections, resources, request inbox, Open Library import
import { useEffect, useState } from 'react';
import './librarian.css';
import { sectionsApi, resourcesApi, requestsApi, externalApi } from './api.js';

function Librarian({ user, onLogout, sections, resources, reload }) {
  // ── Section form ──
  const [sectionForm, setSectionForm] = useState({ name: '', description: '' });
  const [editingSectionId, setEditingSectionId] = useState(null);

  // ── Resource form ──
  const [resourceForm, setResourceForm] = useState({
    title: '', author: '', summary: '', sectionId: sections[0]?.id || 'literature', tags: '',
  });
  const [editingResourceId, setEditingResourceId] = useState(null);

  const [activeTab, setActiveTab] = useState('sections');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  // Request inbox state
  const [pendingRequests, setPendingRequests] = useState([]);
  const [requestStatusFilter, setRequestStatusFilter] = useState('pending');

  // Open Library import state
  const [importQuery, setImportQuery] = useState('');
  const [importResults, setImportResults] = useState([]);
  const [importTargetSection, setImportTargetSection] = useState(sections[0]?.id || 'literature');
  const [importingKey, setImportingKey] = useState(null);

  const loadRequests = async (status = requestStatusFilter) => {
    try { setPendingRequests(await requestsApi.list(status)); }
    catch (e) { setError(e.message); }
  };

  useEffect(() => {
    if (activeTab === 'requests') loadRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, requestStatusFilter]);

  // Decide on a request (approve or reject)
  const decide = async (id, action) => {
    const notes = window.prompt(`Optional note for ${action}:`) || '';
    try {
      if (action === 'approve') await requestsApi.approve(id, notes);
      else                       await requestsApi.reject(id, notes);
      loadRequests();
    } catch (e) { setError(e.message); }
  };

  // ── Open Library search ──
  const runOLSearch = async (e) => {
    e?.preventDefault();
    if (!importQuery.trim()) return;
    setError('');
    setBusy(true);
    try { setImportResults(await externalApi.olSearch(importQuery.trim(), 12)); }
    catch (e2) { setError(e2.message); setImportResults([]); }
    finally { setBusy(false); }
  };

  const importBook = async (book) => {
    if (!importTargetSection) { setError('Pick a section to import into.'); return; }
    setImportingKey(book.openLibraryKey || book.title);
    try {
      await externalApi.olImport({
        sectionId: importTargetSection,
        title: book.title,
        author: book.author,
        year: book.year,
        subjects: book.subjects,
        coverUrl: book.coverUrl,
      });
      await reload();
      setError('');
    } catch (e) { setError(e.message); }
    finally { setImportingKey(null); }
  };

  // ── arXiv search ──
  const [arxivQuery, setArxivQuery] = useState('');
  const [arxivResults, setArxivResults] = useState([]);
  const [arxivTargetSection, setArxivTargetSection] = useState(sections[0]?.id || 'physics');
  const [arxivImportingId, setArxivImportingId] = useState(null);

  const runArxivSearch = async (e) => {
    e?.preventDefault();
    if (!arxivQuery.trim()) return;
    setError('');
    setBusy(true);
    try { setArxivResults(await externalApi.arxivSearch(arxivQuery.trim(), 15)); }
    catch (e2) { setError(e2.message); setArxivResults([]); }
    finally { setBusy(false); }
  };

  const importPaper = async (paper) => {
    if (!arxivTargetSection) { setError('Pick a section to import into.'); return; }
    setArxivImportingId(paper.arxivId || paper.title);
    try {
      await externalApi.arxivImport({
        sectionId: arxivTargetSection,
        title: paper.title,
        summary: paper.summary,
        author: paper.author,
        year: paper.year,
        categories: paper.categories,
        arxivId: paper.arxivId,
      });
      await reload();
      setError('');
    } catch (e) { setError(e.message); }
    finally { setArxivImportingId(null); }
  };

  const runWithRefresh = async (work) => {
    setBusy(true);
    setError('');
    try {
      await work();
      await reload();
    } catch (e) {
      setError(e.message || 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  };

  // ── Section handlers ──
  const startEditSection = (sec) => {
    setEditingSectionId(sec.id);
    setSectionForm({ name: sec.name, description: sec.description || '' });
    setActiveTab('sections');
  };
  const cancelEditSection = () => {
    setEditingSectionId(null);
    setSectionForm({ name: '', description: '' });
  };

  const handleSaveSection = (e) => {
    e.preventDefault();
    const name = sectionForm.name.trim();
    const description = sectionForm.description.trim();
    if (!name) return;

    runWithRefresh(async () => {
      if (editingSectionId) {
        await sectionsApi.update(editingSectionId, { name, description });
      } else {
        await sectionsApi.create({ name, description });
      }
      cancelEditSection();
    });
  };

  const handleDeleteSection = (sec) => {
    if (sec.core) {
      setError('Core sections cannot be deleted.');
      return;
    }
    if (!window.confirm('Delete this section and all its resources?')) return;
    runWithRefresh(() => sectionsApi.remove(sec.id));
  };

  // ── Resource handlers ──
  const startEditResource = (res) => {
    setEditingResourceId(res.id);
    setResourceForm({
      title: res.title,
      author: res.author || '',
      summary: res.summary || '',
      sectionId: res.sectionId,
      tags: (res.tags || []).join(', '),
    });
    setActiveTab('resources');
  };
  const cancelEditResource = () => {
    setEditingResourceId(null);
    setResourceForm({
      title: '', author: '', summary: '',
      sectionId: sections[0]?.id || 'literature', tags: '',
    });
  };

  const handleSaveResource = (e) => {
    e.preventDefault();
    const title = resourceForm.title.trim();
    const summary = resourceForm.summary.trim();
    const author = resourceForm.author.trim();
    const sectionId = resourceForm.sectionId;
    if (!title || !sectionId) return;

    const tags = resourceForm.tags.split(',').map(t => t.trim()).filter(Boolean);

    const payload = {
      sectionId,
      title,
      summary,
      body: summary,            // body mirrors summary in the simple form
      author: author || null,
      tags: tags.length ? tags : ['librarian-add'],
    };

    runWithRefresh(async () => {
      if (editingResourceId) {
        await resourcesApi.update(editingResourceId, payload);
      } else {
        await resourcesApi.create(payload);
      }
      cancelEditResource();
    });
  };

  const handleDeleteResource = (id) => {
    if (!window.confirm('Delete this resource?')) return;
    runWithRefresh(async () => {
      await resourcesApi.remove(id);
      if (editingResourceId === id) cancelEditResource();
    });
  };

  const isEditingSection = editingSectionId !== null;
  const isEditingResource = editingResourceId !== null;

  return (
    <div className="librarian-dashboard">
      <header className="librarian-header">
        <div>
          <h1>STEM Catalog Manager</h1>
          <p>Manage sections and import papers for the STEM Knowledge Portal.</p>
        </div>
        <div className="user-info">
          <div className="user-pill">
            <div className="user-avatar">{user?.name?.[0]?.toUpperCase() || 'L'}</div>
            <div>
              <div className="user-name">{user?.name || 'Librarian'}</div>
              <div className="user-role">{user?.role || 'Librarian'}</div>
            </div>
          </div>
          <button type="button" className="logout-btn" onClick={onLogout}>Log out</button>
        </div>
      </header>

      <div className="lib-tabs">
        <button
          type="button"
          className={`lib-tab ${activeTab === 'sections' ? 'lib-tab--active' : ''}`}
          onClick={() => { setActiveTab('sections'); cancelEditSection(); }}
        >
          📂 Sections <span className="lib-tab-count">{sections.length}</span>
        </button>
        <button
          type="button"
          className={`lib-tab ${activeTab === 'resources' ? 'lib-tab--active' : ''}`}
          onClick={() => { setActiveTab('resources'); cancelEditResource(); }}
        >
          📄 Resources <span className="lib-tab-count">{resources.length}</span>
        </button>
        <button
          type="button"
          className={`lib-tab ${activeTab === 'requests' ? 'lib-tab--active' : ''}`}
          onClick={() => setActiveTab('requests')}
        >
          📨 Requests
        </button>
        <button
          type="button"
          className={`lib-tab ${activeTab === 'import' ? 'lib-tab--active' : ''}`}
          onClick={() => setActiveTab('import')}
        >
          📚 Open Library
        </button>
        <button
          type="button"
          className={`lib-tab ${activeTab === 'arxiv' ? 'lib-tab--active' : ''}`}
          onClick={() => setActiveTab('arxiv')}
        >
          📄 arXiv Papers
        </button>
      </div>

      {error && <p className="auth-error" style={{ margin: '0 24px 12px' }}>{error}</p>}
      {busy && <p className="muted" style={{ margin: '0 24px 12px' }}>Saving…</p>}

      <main className="librarian-main">

        {activeTab === 'sections' && (
          <>
            <section className="add-book-section">
              <h2>{isEditingSection ? '✏️ Edit Section' : '➕ Add New Section'}</h2>
              <p className="section-desc">
                {isEditingSection
                  ? `Editing "${sections.find(s => s.id === editingSectionId)?.name}". Core sections can be renamed but not deleted.`
                  : 'Core sections (Literature, History, etc.) are locked from deletion but you can edit their descriptions.'}
              </p>
              <form className="book-form" onSubmit={handleSaveSection}>
                <div className="form-row">
                  <div className="input-group">
                    <label htmlFor="section-name">Section name</label>
                    <input
                      id="section-name" type="text"
                      value={sectionForm.name}
                      onChange={e => setSectionForm(s => ({ ...s, name: e.target.value }))}
                      placeholder="e.g. Philosophy"
                      required
                    />
                  </div>
                  <div className="input-group">
                    <label htmlFor="section-desc">Description</label>
                    <input
                      id="section-desc" type="text"
                      value={sectionForm.description}
                      onChange={e => setSectionForm(s => ({ ...s, description: e.target.value }))}
                      placeholder="Shown to students on the portal"
                    />
                  </div>
                </div>
                <div className="lib-form-actions">
                  <button type="submit" className="add-book-btn" disabled={busy}>
                    {isEditingSection ? '💾 Save Changes' : '➕ Add Section'}
                  </button>
                  {isEditingSection && (
                    <button type="button" className="lib-cancel-btn" onClick={cancelEditSection}>
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </section>

            <section className="books-list">
              <h2>All Sections</h2>
              <p className="section-desc">
                {sections.length} section(s) total. Click ✏️ Edit to rename or change description.
              </p>
              <div className="books-grid">
                {sections.map(sec => (
                  <article
                    key={sec.id}
                    className={`book-card ${editingSectionId === sec.id ? 'book-card--editing' : ''}`}
                  >
                    <div className="book-card-top">
                      <h3>{sec.name}</h3>
                      <span className="section-badge">
                        {sec.core ? '🔒 Core' : '✨ Custom'}
                      </span>
                    </div>
                    <p>{sec.description}</p>
                    <p className="book-card-meta">
                      {resources.filter(r => r.sectionId === sec.id).length} resource(s)
                    </p>
                    <div className="book-card-actions">
                      <button type="button" className="lib-edit-btn" onClick={() => startEditSection(sec)}>
                        ✏️ Edit
                      </button>
                      {!sec.core && (
                        <button type="button" className="logout-btn" onClick={() => handleDeleteSection(sec)}>
                          🗑 Delete
                        </button>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </>
        )}

        {activeTab === 'requests' && (
          <section className="add-book-section">
            <h2>Borrow Requests</h2>
            <p className="section-desc">
              Students request books or papers here. <strong>Approve</strong> to accept
              the request — the Borrow record is created immediately. <strong>Reject</strong>
              to send a note back to the student. (No admin second step needed.)
            </p>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              {['pending', 'approved', 'rejected', 'cancelled', 'all'].map(s => (
                <button key={s}
                  className={s === requestStatusFilter ? 'add-book-btn' : 'lib-cancel-btn'}
                  onClick={() => setRequestStatusFilter(s)}
                  style={{ padding: '4px 12px', fontSize: 13 }}
                >{s.charAt(0).toUpperCase() + s.slice(1)}</button>
              ))}
            </div>
            {pendingRequests.length === 0 ? (
              <p className="books-empty">No {requestStatusFilter} requests.</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                <thead><tr style={{ background: '#f1f5f9' }}>
                  <th style={{ padding: 10, textAlign: 'left' }}>Created</th>
                  <th style={{ padding: 10, textAlign: 'left' }}>Book</th>
                  <th style={{ padding: 10, textAlign: 'left' }}>Student</th>
                  <th style={{ padding: 10, textAlign: 'left' }}>Notes</th>
                  <th style={{ padding: 10, textAlign: 'left' }}>Status</th>
                  <th style={{ padding: 10, textAlign: 'left' }}>Actions</th>
                </tr></thead>
                <tbody>
                  {pendingRequests.map(r => (
                    <tr key={r.id} style={{ borderTop: '1px solid #e2e8f0' }}>
                      <td style={{ padding: 10 }}>{new Date(r.createdAt).toLocaleDateString()}</td>
                      <td style={{ padding: 10 }}><strong>{r.resourceTitle}</strong></td>
                      <td style={{ padding: 10 }}>
                        {r.studentName}<br/>
                        <span style={{ color: '#64748b', fontSize: 12 }}>{r.studentEmail}</span>
                      </td>
                      <td style={{ padding: 10, color: '#64748b' }}>{r.notes || '—'}</td>
                      <td style={{ padding: 10, fontWeight: 600 }}>{r.status}</td>
                      <td style={{ padding: 10 }}>
                        {r.status === 'PENDING' ? (
                          <>
                            <button onClick={() => decide(r.id, 'approve')}
                              style={{ marginRight: 6, padding: '4px 10px', fontSize: 12, border: 'none', background: '#16a34a', color: 'white', borderRadius: 6, cursor: 'pointer' }}
                            >Approve</button>
                            <button onClick={() => decide(r.id, 'reject')}
                              style={{ padding: '4px 10px', fontSize: 12, border: 'none', background: '#dc2626', color: 'white', borderRadius: 6, cursor: 'pointer' }}
                            >Reject</button>
                          </>
                        ) : (
                          <span style={{ color: '#64748b', fontSize: 12 }}>
                            {r.decisionBy ? `by ${r.decisionBy}` : '—'}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        )}

        {activeTab === 'import' && (
          <section className="add-book-section">
            <h2>📚 Import books from Open Library</h2>
            <p className="section-desc">
              Search the free Open Library catalog and click any result to add it as
              a new resource in your local catalog.
            </p>

            <form onSubmit={runOLSearch} className="book-form">
              <div className="form-row">
                <div className="input-group">
                  <label htmlFor="ol-q">Search</label>
                  <input id="ol-q" type="text" value={importQuery}
                    onChange={e => setImportQuery(e.target.value)}
                    placeholder='e.g. "Sapiens", "Quantum physics", "Machine learning"' />
                </div>
                <div className="input-group">
                  <label htmlFor="ol-section">Import into section</label>
                  <select id="ol-section" value={importTargetSection}
                    onChange={e => setImportTargetSection(e.target.value)}>
                    {sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              </div>
              <button type="submit" className="add-book-btn" disabled={busy || !importQuery.trim()}>
                {busy ? 'Searching…' : '🔍 Search Open Library'}
              </button>
            </form>

            {importResults.length > 0 && (
              <div style={{ marginTop: 24 }}>
                <h3 style={{ marginBottom: 12 }}>{importResults.length} results</h3>
                <div className="books-grid">
                  {importResults.map(b => {
                    const key = b.openLibraryKey || b.title;
                    return (
                      <article key={key} className="book-card">
                        {b.coverUrl && (
                          <img src={b.coverUrl} alt="" style={{
                            width: '100%', maxHeight: 200, objectFit: 'cover',
                            borderRadius: 8, marginBottom: 10,
                          }} />
                        )}
                        <div className="book-card-top">
                          <h3 style={{ fontSize: 16 }}>{b.title}</h3>
                        </div>
                        <p className="book-card-meta">
                          {b.author || 'Unknown author'}
                          {b.year ? ` · ${b.year}` : ''}
                        </p>
                        <div className="lib-tags-row">
                          {(b.subjects || []).slice(0, 3).map(s => (
                            <span key={s} className="lib-mini-tag">#{s}</span>
                          ))}
                        </div>
                        <div className="book-card-actions">
                          <button className="add-book-btn"
                            disabled={importingKey === key}
                            onClick={() => importBook(b)}
                            style={{ width: '100%' }}>
                            {importingKey === key ? 'Adding…' : '➕ Add to Catalog'}
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>
            )}
          </section>
        )}

        {activeTab === 'arxiv' && (
          <section className="add-book-section">
            <h2>📄 Import papers from arXiv</h2>
            <p className="section-desc">
              Search the open-access arXiv repository for papers in <strong>physics, mathematics,
              computer science, biology, finance,</strong> and more. Click any result to import it
              as a new resource with its abstract, authors, and categories.
            </p>

            <form onSubmit={runArxivSearch} className="book-form">
              <div className="form-row">
                <div className="input-group">
                  <label htmlFor="arxiv-q">Search arXiv</label>
                  <input id="arxiv-q" type="text" value={arxivQuery}
                    onChange={e => setArxivQuery(e.target.value)}
                    placeholder='e.g. "quantum computing", "transformer", "CRISPR", "Black-Scholes"' />
                </div>
                <div className="input-group">
                  <label htmlFor="arxiv-section">Import into section</label>
                  <select id="arxiv-section" value={arxivTargetSection}
                    onChange={e => setArxivTargetSection(e.target.value)}>
                    {sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              </div>
              <button type="submit" className="add-book-btn" disabled={busy || !arxivQuery.trim()}>
                {busy ? 'Searching…' : '🔍 Search arXiv'}
              </button>
            </form>

            {arxivResults.length > 0 && (
              <div style={{ marginTop: 24 }}>
                <h3 style={{ marginBottom: 12 }}>{arxivResults.length} papers found</h3>
                <div className="books-grid">
                  {arxivResults.map(p => {
                    const key = p.arxivId || p.title;
                    return (
                      <article key={key} className="book-card">
                        <div className="book-card-top">
                          <h3 style={{ fontSize: 16 }}>{p.title}</h3>
                          <span className="section-badge">📄 Paper</span>
                        </div>
                        <p className="book-card-meta">
                          {p.author || 'Unknown author'}
                          {p.year ? ` · ${p.year}` : ''}
                        </p>
                        <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.5, margin: '8px 0' }}>
                          {(p.summary || '').length > 250
                            ? (p.summary || '').substring(0, 250) + '…'
                            : p.summary || 'No abstract available.'}
                        </p>
                        <div className="lib-tags-row">
                          {(p.categories || []).slice(0, 4).map(c => (
                            <span key={c} className="lib-mini-tag">{c}</span>
                          ))}
                        </div>
                        <div className="book-card-actions">
                          <button className="add-book-btn"
                            disabled={arxivImportingId === key}
                            onClick={() => importPaper(p)}
                            style={{ width: '100%' }}>
                            {arxivImportingId === key ? 'Importing…' : '➕ Import Paper'}
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>
            )}
          </section>
        )}

        {activeTab === 'resources' && (
          <>
            <section className="add-book-section">
              <h2>{isEditingResource ? '✏️ Edit Resource' : '➕ Add New Resource'}</h2>
              <p className="section-desc">
                {isEditingResource
                  ? 'Update fields below. Students will see changes after reload.'
                  : 'New resources appear in the student portal after the page reloads its catalog.'}
              </p>
              <form className="book-form" onSubmit={handleSaveResource}>
                <div className="form-row">
                  <div className="input-group">
                    <label htmlFor="res-title">Title</label>
                    <input
                      id="res-title" type="text"
                      value={resourceForm.title}
                      onChange={e => setResourceForm(r => ({ ...r, title: e.target.value }))}
                      required placeholder="e.g. The Great Gatsby"
                    />
                  </div>
                  <div className="input-group">
                    <label htmlFor="res-author">Author</label>
                    <input
                      id="res-author" type="text"
                      value={resourceForm.author}
                      onChange={e => setResourceForm(r => ({ ...r, author: e.target.value }))}
                      placeholder="Optional"
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="input-group">
                    <label htmlFor="res-section">Section</label>
                    <select
                      id="res-section"
                      value={resourceForm.sectionId}
                      onChange={e => setResourceForm(r => ({ ...r, sectionId: e.target.value }))}
                    >
                      {sections.map(sec => (
                        <option key={sec.id} value={sec.id}>{sec.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="input-group">
                    <label htmlFor="res-tags">Tags (comma-separated)</label>
                    <input
                      id="res-tags" type="text"
                      value={resourceForm.tags}
                      onChange={e => setResourceForm(r => ({ ...r, tags: e.target.value }))}
                      placeholder="theme, topic, grade"
                    />
                  </div>
                </div>
                <div className="input-group">
                  <label htmlFor="res-summary">Summary</label>
                  <textarea
                    id="res-summary" rows="3"
                    value={resourceForm.summary}
                    onChange={e => setResourceForm(r => ({ ...r, summary: e.target.value }))}
                    placeholder="Short explanation students will see"
                  />
                </div>
                <div className="lib-form-actions">
                  <button type="submit" className="add-book-btn" disabled={busy}>
                    {isEditingResource ? '💾 Save Changes' : '➕ Add Resource'}
                  </button>
                  {isEditingResource && (
                    <button type="button" className="lib-cancel-btn" onClick={cancelEditResource}>
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </section>

            <section className="books-list">
              <h2>All Resources</h2>
              <p className="section-desc">
                {resources.length} resource(s) across all sections.
              </p>
              <div className="books-grid">
                {resources.length === 0 ? (
                  <p className="books-empty">No resources yet.</p>
                ) : (
                  resources.map(res => {
                    const section = sections.find(s => s.id === res.sectionId);
                    return (
                      <article
                        key={res.id}
                        className={`book-card ${editingResourceId === res.id ? 'book-card--editing' : ''}`}
                      >
                        <div className="book-card-top">
                          <h3>{res.title}</h3>
                          <span className="section-badge">{section?.name || res.sectionId}</span>
                        </div>
                        <p>{res.summary}</p>
                        <p className="book-card-meta">{res.author || 'Unknown author'}</p>
                        <div className="lib-tags-row">
                          {(res.tags || []).slice(0, 4).map(t => (
                            <span key={t} className="lib-mini-tag">#{t}</span>
                          ))}
                        </div>
                        <div className="book-card-actions">
                          <button type="button" className="lib-edit-btn" onClick={() => startEditResource(res)}>
                            ✏️ Edit
                          </button>
                          <button type="button" className="logout-btn" onClick={() => handleDeleteResource(res.id)}>
                            🗑 Delete
                          </button>
                        </div>
                      </article>
                    );
                  })
                )}
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}

export default Librarian;
