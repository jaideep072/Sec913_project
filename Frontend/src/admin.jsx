// admin.jsx — full admin dashboard (users, audit, requests, borrows, resources)
import { useEffect, useMemo, useState } from 'react';
import {
  adminApi, requestsApi, borrowsApi, resourcesApi, sectionsApi,
} from './api.js';

const ROLES = ['Student', 'Librarian', 'Staff', 'Admin'];

function pill(text, color) {
  const styles = {
    green:  { background: '#dcfce7', color: '#166534' },
    red:    { background: '#fee2e2', color: '#991b1b' },
    amber:  { background: '#fef3c7', color: '#92400e' },
    blue:   { background: '#dbeafe', color: '#1e40af' },
    gray:   { background: '#f1f5f9', color: '#475569' },
  };
  return (
    <span style={{
      ...styles[color] || styles.gray,
      padding: '2px 10px', borderRadius: 12,
      fontSize: 12, fontWeight: 600,
    }}>{text}</span>
  );
}

const roleColor = (r) => ({
  Admin: 'red', Librarian: 'blue', Staff: 'amber', Student: 'gray',
}[r] || 'gray');

const decisionColor = (d) => ({
  APPROVED: 'green', REJECTED: 'red', PENDING: 'amber',
  CANCELLED: 'gray',
}[d] || 'gray');

function fmt(d) {
  if (!d) return '—';
  try { return new Date(d).toLocaleString('en-IN'); } catch { return String(d); }
}

function Admin({ user, onLogout }) {
  const [tab, setTab] = useState('overview');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  // Lazy-loaded per-tab data
  const [audit, setAudit] = useState(null);
  const [users, setUsers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [borrows, setBorrows] = useState([]);
  const [resources, setResources] = useState([]);
  const [sections, setSections] = useState([]);

  const run = async (work) => {
    setBusy(true); setError('');
    try { await work(); }
    catch (e) { setError(e.message || 'Something went wrong.'); }
    finally { setBusy(false); }
  };

  const loadOverview  = () => run(async () => setAudit(await adminApi.audit()));
  const loadUsers     = () => run(async () => setUsers(await adminApi.listUsers()));
  const loadRequests  = () => run(async () => setRequests(await requestsApi.list('all')));
  const loadBorrows   = () => run(async () => setBorrows(await borrowsApi.list()));
  const loadCatalog   = () => run(async () => {
    const [r, s] = await Promise.all([resourcesApi.list(), sectionsApi.list()]);
    setResources(r); setSections(s);
  });

  useEffect(() => {
    if (tab === 'overview') loadOverview();
    if (tab === 'users')    loadUsers();
    if (tab === 'requests') loadRequests();
    if (tab === 'borrows')  loadBorrows();
    if (tab === 'catalog')  loadCatalog();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  // ── catalog publish toggle ──
  const togglePublished = (r) => {
    const next = !r.published;
    run(async () => { await resourcesApi.setPublished(r.id, next); loadCatalog(); });
  };

  // ── user actions ──
  const changeRole = (u, role) => {
    if (!role || role === u.role) return;
    if (!window.confirm(`Change ${u.email} from ${u.role} to ${role}?`)) return;
    run(async () => { await adminApi.setRole(u.id, role); loadUsers(); });
  };
  const toggleStatus = (u) => {
    const next = u.status === 1 ? 0 : 1;
    const verb = next === 0 ? 'suspend' : 'reactivate';
    if (!window.confirm(`${verb} ${u.email}?`)) return;
    run(async () => { await adminApi.setStatus(u.id, next); loadUsers(); });
  };
  const deleteUser = (u) => {
    if (!window.confirm(`Permanently delete ${u.email}? This can't be undone.`)) return;
    run(async () => { await adminApi.deleteUser(u.id); loadUsers(); });
  };

  // ── catalog actions ──
  const deleteResource = (r) => {
    if (!window.confirm(`Delete resource "${r.title}"?`)) return;
    run(async () => { await resourcesApi.remove(r.id); loadCatalog(); });
  };
  const deleteSection = (s) => {
    if (s.core) return setError('Core sections cannot be deleted.');
    if (!window.confirm(`Delete section "${s.name}" and all its resources?`)) return;
    run(async () => { await sectionsApi.remove(s.id); loadCatalog(); });
  };

  // ── render helpers ──
  const tabs = [
    ['overview', '📊 Overview'],
    ['users',    '👥 Users'],
    ['requests', '📨 All Requests'],
    ['borrows',  '📚 Borrows'],
    ['catalog',  '🗂️ Catalog'],
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <header style={{
        background: '#0f172a', color: 'white', padding: '16px 32px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22 }}>STEM Admin Console</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, opacity: 0.7 }}>
            Full system visibility — users, requests, borrows, STEM catalog, audit.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span>{user?.name} · <strong>Admin</strong></span>
          <button onClick={onLogout} style={btnGhost}>Log out</button>
        </div>
      </header>

      <nav style={{
        display: 'flex', gap: 4, padding: '0 32px', background: '#e2e8f0',
        borderBottom: '1px solid #cbd5e1',
      }}>
        {tabs.map(([k, label]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            style={{
              border: 'none', padding: '12px 18px',
              background: tab === k ? '#f8fafc' : 'transparent',
              borderTop: tab === k ? '2px solid #0f172a' : '2px solid transparent',
              cursor: 'pointer', fontWeight: tab === k ? 600 : 400,
            }}
          >{label}</button>
        ))}
      </nav>

      <main style={{ padding: '24px 32px', maxWidth: 1400, margin: '0 auto' }}>
        {error && (
          <div style={{
            background: '#fee2e2', color: '#991b1b', padding: '10px 14px',
            borderRadius: 8, marginBottom: 16,
          }}>{error}</div>
        )}
        {busy && <p style={{ color: '#64748b' }}>Loading…</p>}

        {tab === 'overview' && <Overview audit={audit} />}
        {tab === 'users'    && <UsersTab    rows={users}    onRole={changeRole} onToggle={toggleStatus} onDelete={deleteUser} meEmail={user?.email} />}
        {tab === 'requests' && <RequestsTab rows={requests} />}
        {tab === 'borrows'  && <BorrowsTab  rows={borrows} />}
        {tab === 'catalog'  && <CatalogTab  resources={resources} sections={sections} onDelRes={deleteResource} onDelSec={deleteSection} onTogglePub={togglePublished} />}
      </main>
    </div>
  );
}

// ── Overview tab ──
function Overview({ audit }) {
  if (!audit) return <p style={{ color: '#64748b' }}>Loading audit data…</p>;
  const stats = audit.stats || {};
  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 24 }}>
        <Stat label="Total Users"          value={stats.users} />
        <Stat label="Total Requests"       value={stats.requests} />
        <Stat label="Pending Requests"     value={stats.pendingRequests} color="#ea580c" />
        <Stat label="Total Borrows"        value={stats.borrows} />
        <Stat label="Active Borrows"       value={(audit.activeBorrows || []).length} />
      </div>

      <h3 style={hdr}>Decision audit log — who approved/rejected what</h3>
      <div style={tableWrap}>
        <table style={table}>
          <thead><tr>
            <th style={th}>When</th>
            <th style={th}>Librarian</th>
            <th style={th}>Decision</th>
            <th style={th}>Book</th>
            <th style={th}>Student</th>
            <th style={th}>Notes</th>
          </tr></thead>
          <tbody>
            {(audit.decisions || []).length === 0 && <tr><td colSpan={6} style={empty}>No decisions recorded yet.</td></tr>}
            {(audit.decisions || []).map((d, i) => (
              <tr key={i}>
                <td style={td}>{fmt(d.at)}</td>
                <td style={td}>{d.librarianEmail || '—'}</td>
                <td style={td}>{pill(d.decision, decisionColor(d.decision))}</td>
                <td style={td}><strong>{d.bookTitle}</strong></td>
                <td style={td}>{d.studentName} <span style={dim}>({d.studentEmail})</span></td>
                <td style={td}>{d.notes || <span style={dim}>—</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3 style={hdr}>Currently out (active borrows)</h3>
      <div style={tableWrap}>
        <table style={table}>
          <thead><tr>
            <th style={th}>Book</th>
            <th style={th}>Borrower</th>
            <th style={th}>Borrowed</th>
            <th style={th}>Due</th>
          </tr></thead>
          <tbody>
            {(audit.activeBorrows || []).length === 0 && <tr><td colSpan={4} style={empty}>No active borrows.</td></tr>}
            {(audit.activeBorrows || []).map(b => (
              <tr key={b.id}>
                <td style={td}><strong>{b.bookTitle}</strong></td>
                <td style={td}>{b.borrowerName} <span style={dim}>({b.borrowerEmail})</span></td>
                <td style={td}>{b.borrowedOn}</td>
                <td style={td}>{b.dueDate}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

// ── Users tab ──
function UsersTab({ rows, onRole, onToggle, onDelete, meEmail }) {
  return (
    <div style={tableWrap}>
      <table style={table}>
        <thead><tr>
          <th style={th}>Name</th>
          <th style={th}>Email</th>
          <th style={th}>Phone</th>
          <th style={th}>Role</th>
          <th style={th}>Status</th>
          <th style={th}>Created</th>
          <th style={th}>Actions</th>
        </tr></thead>
        <tbody>
          {rows.length === 0 && <tr><td colSpan={7} style={empty}>No users yet.</td></tr>}
          {rows.map(u => (
            <tr key={u.id}>
              <td style={td}><strong>{u.fullname}</strong>{u.email === meEmail && <span style={{ marginLeft: 6, ...dim }}>(you)</span>}</td>
              <td style={td}>{u.email}</td>
              <td style={td}>{u.phone || <span style={dim}>—</span>}</td>
              <td style={td}>{pill(u.role, roleColor(u.role))}</td>
              <td style={td}>{u.status === 1 ? pill('Active', 'green') : pill('Suspended', 'red')}</td>
              <td style={td}>{fmt(u.createdAt)}</td>
              <td style={td}>
                <select defaultValue={u.role} onChange={e => onRole(u, e.target.value)} style={select}>
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>{' '}
                <button onClick={() => onToggle(u)} style={btnSm}>
                  {u.status === 1 ? 'Suspend' : 'Reactivate'}
                </button>{' '}
                <button onClick={() => onDelete(u)} style={btnSmDanger}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Requests tab ──
function RequestsTab({ rows }) {
  return (
    <div style={tableWrap}>
      <table style={table}>
        <thead><tr>
          <th style={th}>Created</th>
          <th style={th}>Status</th>
          <th style={th}>Book</th>
          <th style={th}>Student</th>
          <th style={th}>Notes</th>
          <th style={th}>Decision by</th>
          <th style={th}>Decision at</th>
        </tr></thead>
        <tbody>
          {rows.length === 0 && <tr><td colSpan={7} style={empty}>No requests yet.</td></tr>}
          {rows.map(r => (
            <tr key={r.id}>
              <td style={td}>{fmt(r.createdAt)}</td>
              <td style={td}>{pill(r.status, decisionColor(r.status))}</td>
              <td style={td}><strong>{r.resourceTitle}</strong></td>
              <td style={td}>{r.studentName} <span style={dim}>({r.studentEmail})</span></td>
              <td style={td}>{r.notes || <span style={dim}>—</span>}</td>
              <td style={td}>{r.decisionBy || <span style={dim}>—</span>}</td>
              <td style={td}>{fmt(r.decisionAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Borrows tab ──
function BorrowsTab({ rows }) {
  const stats = useMemo(() => {
    const today = new Date(); today.setHours(0,0,0,0);
    let active = 0, overdue = 0, returned = 0;
    for (const b of rows) {
      if (b.status === 'returned') returned++;
      else if (b.status === 'overdue') overdue++;
      else active++;
    }
    return { active, overdue, returned };
  }, [rows]);
  return (
    <>
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        {pill(`Active: ${stats.active}`, 'blue')}
        {pill(`Overdue: ${stats.overdue}`, 'red')}
        {pill(`Returned: ${stats.returned}`, 'green')}
      </div>
      <div style={tableWrap}>
        <table style={table}>
          <thead><tr>
            <th style={th}>Book</th>
            <th style={th}>Borrower</th>
            <th style={th}>Borrowed</th>
            <th style={th}>Due</th>
            <th style={th}>Returned</th>
            <th style={th}>Status</th>
          </tr></thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan={6} style={empty}>No borrow records yet.</td></tr>}
            {rows.map(b => (
              <tr key={b.id}>
                <td style={td}><strong>{b.bookTitle}</strong></td>
                <td style={td}>{b.borrowerName} <span style={dim}>({b.borrowerEmail})</span></td>
                <td style={td}>{b.borrowedOn}</td>
                <td style={td}>{b.dueDate}</td>
                <td style={td}>{b.returnedOn || <span style={dim}>—</span>}</td>
                <td style={td}>{pill(b.status, b.status === 'overdue' ? 'red' : b.status === 'returned' ? 'green' : 'blue')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

// ── Confirmations tab — one-click admin sign-off ──
function ConfirmationsTab({ rows, onConfirm, onReject }) {
  return (
    <>
      <p style={{ marginTop: 0, color: '#475569' }}>
        These requests have been approved by a librarian and are waiting for your one-click confirmation.
        Confirming creates the actual Borrow record so Staff can hand the book over.
      </p>
      <div style={tableWrap}>
        <table style={table}>
          <thead><tr>
            <th style={th}>Requested</th>
            <th style={th}>Book</th>
            <th style={th}>Student</th>
            <th style={th}>Forwarded by</th>
            <th style={th}>Librarian's note</th>
            <th style={th}>Action</th>
          </tr></thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={6} style={empty}>
                Nothing waiting — librarians haven't forwarded anything new.
              </td></tr>
            )}
            {rows.map(r => (
              <tr key={r.id}>
                <td style={td}>{fmt(r.createdAt)}</td>
                <td style={td}><strong>{r.resourceTitle}</strong></td>
                <td style={td}>{r.studentName}<br/><span style={dim}>{r.studentEmail}</span></td>
                <td style={td}>{r.decisionBy || <span style={dim}>—</span>}</td>
                <td style={td}>{r.decisionNotes || <span style={dim}>—</span>}</td>
                <td style={td}>
                  <button
                    onClick={() => onConfirm(r.id)}
                    style={{
                      marginRight: 6, padding: '6px 14px', fontSize: 13,
                      border: 'none', background: '#16a34a', color: 'white',
                      borderRadius: 6, cursor: 'pointer', fontWeight: 600,
                    }}
                  >✓ Confirm</button>
                  <button
                    onClick={() => onReject(r.id)}
                    style={{
                      padding: '6px 14px', fontSize: 13,
                      border: '1px solid #fca5a5', background: 'white',
                      color: '#991b1b', borderRadius: 6, cursor: 'pointer',
                    }}
                  >Reject</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

// ── Catalog tab ──
function CatalogTab({ resources, sections, onDelRes, onDelSec, onTogglePub }) {
  return (
    <>
      <h3 style={hdr}>Sections ({sections.length})</h3>
      <div style={tableWrap}>
        <table style={table}>
          <thead><tr>
            <th style={th}>ID</th>
            <th style={th}>Name</th>
            <th style={th}>Description</th>
            <th style={th}>Core?</th>
            <th style={th}>Resources</th>
            <th style={th}>Actions</th>
          </tr></thead>
          <tbody>
            {sections.map(s => (
              <tr key={s.id}>
                <td style={td}><code>{s.id}</code></td>
                <td style={td}><strong>{s.name}</strong></td>
                <td style={td}>{s.description}</td>
                <td style={td}>{s.core ? pill('Core', 'amber') : pill('Custom', 'gray')}</td>
                <td style={td}>{resources.filter(r => r.sectionId === s.id).length}</td>
                <td style={td}>
                  <button onClick={() => onDelSec(s)} style={btnSmDanger} disabled={s.core}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3 style={hdr}>Resources ({resources.length})</h3>
      <p style={{ color: '#475569', fontSize: 13, marginTop: -8, marginBottom: 12 }}>
        Toggle <strong>Published</strong> to make a resource visible to students. Unpublished resources
        are completely hidden from the Student portal — students don't even see the title.
      </p>
      <div style={tableWrap}>
        <table style={table}>
          <thead><tr>
            <th style={th}>Title</th>
            <th style={th}>Author</th>
            <th style={th}>Section</th>
            <th style={th}>Published</th>
            <th style={th}>Tags</th>
            <th style={th}>Actions</th>
          </tr></thead>
          <tbody>
            {resources.map(r => (
              <tr key={r.id} style={r.published ? null : { background: '#fef9c3' }}>
                <td style={td}><strong>{r.title}</strong></td>
                <td style={td}>{r.author || <span style={dim}>—</span>}</td>
                <td style={td}>{r.sectionId}</td>
                <td style={td}>
                  <button
                    onClick={() => onTogglePub(r)}
                    style={{
                      padding: '4px 12px', fontSize: 12, fontWeight: 600,
                      border: 'none', borderRadius: 6, cursor: 'pointer',
                      background: r.published ? '#16a34a' : '#94a3b8',
                      color: 'white',
                    }}
                    aria-label={r.published ? 'Click to unpublish' : 'Click to publish'}
                  >{r.published ? '✓ Published' : 'Unpublished'}</button>
                </td>
                <td style={td}>{(r.tags || []).slice(0,3).join(', ') || <span style={dim}>—</span>}</td>
                <td style={td}>
                  <button onClick={() => onDelRes(r)} style={btnSmDanger}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

// ── Tiny presentational helpers ──
function Stat({ label, value, color }) {
  return (
    <div style={{
      background: 'white', padding: '14px 18px', borderRadius: 10,
      boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
    }}>
      <div style={{ fontSize: 28, fontWeight: 700, color: color || '#0f172a' }}>{value ?? '—'}</div>
      <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>{label}</div>
    </div>
  );
}

// styles
const hdr        = { margin: '24px 0 12px', fontSize: 16, color: '#0f172a' };
const tableWrap  = { background: 'white', borderRadius: 10, overflow: 'hidden', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' };
const table      = { width: '100%', borderCollapse: 'collapse', fontSize: 14 };
const th         = { textAlign: 'left', padding: '12px 14px', background: '#f1f5f9', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b', borderBottom: '1px solid #e2e8f0' };
const td         = { padding: '12px 14px', borderBottom: '1px solid #f1f5f9', verticalAlign: 'top' };
const empty      = { padding: 24, textAlign: 'center', color: '#94a3b8' };
const dim        = { color: '#94a3b8' };
const btnGhost   = { background: 'transparent', color: 'white', border: '1px solid rgba(255,255,255,0.3)', padding: '6px 14px', borderRadius: 6, cursor: 'pointer' };
const btnSm      = { padding: '4px 10px', fontSize: 12, border: '1px solid #cbd5e1', background: 'white', borderRadius: 6, cursor: 'pointer' };
const btnSmDanger = { ...btnSm, color: '#991b1b', borderColor: '#fca5a5' };
const select     = { padding: '4px 8px', fontSize: 12, border: '1px solid #cbd5e1', borderRadius: 6 };

export default Admin;
