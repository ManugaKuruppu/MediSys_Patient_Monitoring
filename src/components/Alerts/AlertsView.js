import React, { useEffect, useMemo, useState } from 'react';
import { useAppContext } from '../../context/AppContext';

const AlertsView = ({ alerts }) => {
  const { loading, refreshData } = useAppContext();
  // UI state (client-side only)
  const [search, setSearch] = useState('');
  const [severity, setSeverity] = useState('all'); // all | high | medium | low
  const [resolved, setResolved] = useState('all'); // all | resolved | unresolved
  const [sort, setSort] = useState('newest'); // newest | oldest
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(() => parseInt(localStorage.getItem('alerts_page_size') || '10', 10));
  const [showFilters, setShowFilters] = useState(true);

  const filteredAlerts = useMemo(() => {
    let list = Array.isArray(alerts) ? [...alerts] : [];
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(a =>
        String(a.patient_id || '').toLowerCase().includes(q) ||
        String(a.patient_name || '').toLowerCase().includes(q) ||
        String(a.issue_detected || '').toLowerCase().includes(q) ||
        String(a.message || '').toLowerCase().includes(q)
      );
    }
    if (severity !== 'all') {
      list = list.filter(a => (a.severity_level || '').toLowerCase() === severity);
    }
    if (resolved !== 'all') {
      list = list.filter(a => resolved === 'resolved' ? !!a.resolved : !a.resolved);
    }
    list.sort((a, b) => {
      const at = new Date(a.datetime).getTime() || 0;
      const bt = new Date(b.datetime).getTime() || 0;
      return sort === 'newest' ? bt - at : at - bt;
    });
    return list;
  }, [alerts, search, severity, resolved, sort]);

  const { items, total, from, to, totalPages } = useMemo(() => {
    const total = filteredAlerts.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const safePage = Math.min(page, totalPages);
    const start = (safePage - 1) * pageSize;
    const end = start + pageSize;
    const items = filteredAlerts.slice(start, end);
    return { items, total, from: total ? start + 1 : 0, to: Math.min(end, total), totalPages };
  }, [filteredAlerts, page, pageSize]);

  useEffect(() => { setPage(1); }, [search, severity, resolved, sort]);
  useEffect(() => { localStorage.setItem('alerts_page_size', String(pageSize)); }, [pageSize]);

  const activeFilters = useMemo(() => {
    const pills = [];
    if (search.trim()) pills.push({ key: 'search', label: `Search: "${search.trim()}"`, onClear: () => setSearch('') });
    if (severity !== 'all') pills.push({ key: 'severity', label: `Severity: ${severity}`, onClear: () => setSeverity('all') });
    if (resolved !== 'all') pills.push({ key: 'status', label: `Status: ${resolved}`, onClear: () => setResolved('all') });
    return pills;
  }, [search, severity, resolved]);

  const exportCSV = () => {
    const headers = ['Alert ID', 'Patient ID', 'Patient Name', 'Severity', 'Issue', 'Message', 'Resolved', 'Datetime'];
    const rows = filteredAlerts.map(a => [
      a.alert_id,
      a.patient_id,
      a.patient_name,
      a.severity_level,
      a.issue_detected,
      a.message || '',
      a.resolved ? 'Yes' : 'No',
      a.datetime ? new Date(a.datetime).toLocaleString() : ''
    ]);
    const csv = [headers, ...rows].map(r => r.map(field => {
      const v = String(field ?? '');
      return /[,"\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
    }).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'alerts.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getInitials = (name = '') => {
    const parts = String(name).trim().split(/\s+/).slice(0,2);
    return parts.map(p => p[0] || '').join('').toUpperCase() || 'PT';
  };

  const dateLabel = (d) => {
    if (!(d instanceof Date) || isNaN(d)) return '';
    const today = new Date();
    const isSameDay = (a,b) => a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate();
    const y = new Date(); y.setDate(today.getDate()-1);
    if (isSameDay(d, today)) return 'Today';
    if (isSameDay(d, y)) return 'Yesterday';
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const grouped = useMemo(() => {
    const map = new Map();
    items.forEach(a => {
      const label = dateLabel(new Date(a.datetime));
      if (!map.has(label)) map.set(label, []);
      map.get(label).push(a);
    });
    return Array.from(map.entries()).map(([label, list]) => ({ label, list }));
  }, [items]);

  if (loading) {
    return (
      <div className="alerts-view">
        <div className="alerts-header">
          <h2>Alerts</h2>
          <button disabled className="refresh-btn">Refresh</button>
        </div>
        <div className="alerts-toolbar sticky">
          <div className="search-input input-with-icon">
            <i className="fa-solid fa-magnifying-glass input-icon" aria-hidden="true"></i>
            <input className="form-control" placeholder="Search alerts..." disabled />
          </div>
        </div>
        <div className="alerts-content">
          <div className="alerts-list">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="alert-item skeleton-card">
                <div className="skeleton skeleton-text" style={{width:'40%'}}></div>
                <div className="skeleton skeleton-text" style={{width:'80%', marginTop: '8px'}}></div>
                <div className="skeleton skeleton-text" style={{width:'60%', marginTop: '8px'}}></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const criticalAlerts = alerts?.filter(alert => alert.severity_level === 'high') || [];
  const unresolvedAlerts = alerts?.filter(alert => !alert.resolved) || [];

  return (
  <div className="alerts-view">
      <div className="alerts-header">
        <h2>Alerts ({alerts?.length || 0})</h2>
        <div className="alerts-actions">
          <button onClick={refreshData} className="refresh-btn">
            <i className="fa-solid fa-rotate"></i> Refresh
          </button>
        </div>
      </div>

      <div className="alerts-toolbar sticky modern">
        <div className="toolbar-head">
          <button type="button" className="filters-toggle refresh-btn outline" aria-expanded={showFilters} onClick={() => setShowFilters(v => !v)}>
            <i className="fa-solid fa-sliders"></i> Filters
          </button>
          <div className="head-actions">
            <button type="button" className="refresh-btn ghost" title="Reset filters" onClick={() => { setSearch(''); setSeverity('all'); setResolved('all'); setSort('newest'); }}>
              <i className="fa-solid fa-rotate"></i> Reset
            </button>
            <button type="button" className="refresh-btn outline" title="Export filtered alerts" onClick={exportCSV}>
              <i className="fa-solid fa-file-arrow-down"></i> Export
            </button>
          </div>
        </div>
        {showFilters && (
        <div className="toolbar-grid">
          <div className="toolbar-col search-col">
            <div className="search-input input-with-icon">
              <i className="fa-solid fa-magnifying-glass input-icon" aria-hidden="true"></i>
              <input
                type="text"
                placeholder="Search by patient, issue, or message..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Search alerts"
                className="form-control"
              />
              {search && (
                <button className="input-clear" aria-label="Clear search" onClick={() => setSearch('')}>
                  <i className="fa-solid fa-xmark"></i>
                </button>
              )}
            </div>
          </div>

          <div className="toolbar-col filters-col">
            <div className="filter-group" aria-label="Filter by severity">
              <div className="group-label">Severity</div>
              <div className="segmented" role="group">
                {['all','high','medium','low'].map(val => (
                  <button
                    key={val}
                    type="button"
                    className={`seg sev-${val} ${severity===val ? 'active' : ''}`}
                    onClick={() => setSeverity(val)}
                  >
                    {val === 'all' ? (
                      <>All</>
                    ) : (
                      <>
                        <i className={`fa-solid ${val==='high'?'fa-triangle-exclamation': val==='medium'?'fa-circle-exclamation':'fa-circle-info'}`}></i>
                        {val.charAt(0).toUpperCase()+val.slice(1)}
                      </>
                    )}
                  </button>
                ))}
              </div>
            </div>
            <div className="filter-group" aria-label="Filter by status">
              <div className="group-label">Status</div>
              <div className="segmented" role="group">
                {['all','unresolved','resolved'].map(val => (
                  <button
                    key={val}
                    type="button"
                    className={`seg st-${val} ${resolved===val ? 'active' : ''}`}
                    onClick={() => setResolved(val)}
                  >
                    {val==='all' ? 'All' : (
                      <>
                        <i className={`fa-solid ${val==='resolved'?'fa-circle-check':'fa-clock'}`}></i>
                        {val.charAt(0).toUpperCase()+val.slice(1)}
                      </>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="toolbar-col actions-col">
            <div className="actions-row">
              <label htmlFor="sortSelect" className="sort-label">Sort</label>
              <select id="sortSelect" className="form-control slim" value={sort} onChange={e=>setSort(e.target.value)} aria-label="Sort by time">
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
              </select>
            </div>
          </div>
        </div>
        )}
      </div>

      <div className="filters-summary" aria-live="polite">
        <div className="summary-left">
          <strong>{total}</strong> results
        </div>
        <div className="summary-right">
          {activeFilters.map(p => (
            <span key={p.key} className="pill">
              {p.label}
              <button aria-label={`Clear ${p.key}`} className="pill-x" onClick={p.onClear}><i className="fa-solid fa-xmark"></i></button>
            </span>
          ))}
          {activeFilters.length > 0 && (
            <button className="clear-all" onClick={() => { setSearch(''); setSeverity('all'); setResolved('all'); setSort('newest'); }}>Clear all</button>
          )}
        </div>
      </div>
      
      <div className="alerts-summary">
        <div className="alert-stat">
          <span className="stat-label">Critical:</span>
          <span className="stat-value critical">{criticalAlerts.length}</span>
        </div>
        <div className="alert-stat">
          <span className="stat-label">Unresolved:</span>
          <span className="stat-value warning">{unresolvedAlerts.length}</span>
        </div>
        <div className="alert-stat">
          <span className="stat-label">Total Today:</span>
          <span className="stat-value">{alerts?.length || 0}</span>
        </div>
      </div>

      <div className="alerts-content">
        {!alerts || alerts.length === 0 ? (
          <div className="no-alerts">
            <p>No alerts at this time.</p>
          </div>
        ) : (
          <>
            <div className="alerts-list">
              {grouped.map(group => (
                <div key={group.label} className="alerts-section">
                  <div className="section-header">
                    <h3 className="section-title">{group.label}</h3>
                    <span className="section-count">{group.list.length}</span>
                  </div>
                  <div className="section-list">
                    {group.list.map(alert => (
                      <div
                        key={alert.alert_id}
                        className={`alert-card ${alert.severity_level}`}
                      >
                        <div className="card-left">
                          <div className={`icon-wrap ${alert.severity_level}`} aria-hidden="true">
                            <i className={`fa-solid ${alert.severity_level==='high'?'fa-triangle-exclamation': alert.severity_level==='medium'?'fa-circle-exclamation':'fa-circle-info'}`}></i>
                          </div>
                        </div>
                        <div className="card-main">
                          <div className="card-top">
                            <div className="patient">
                              <span className="avatar-sm">{getInitials(alert.patient_name)}</span>
                              <span className="patient-name">{alert.patient_name}</span>
                              <span className="patient-id">{alert.patient_id}</span>
                            </div>
                            <div className="meta">
                              <span className={`status-pill ${alert.resolved ? 'resolved' : 'unresolved'}`}>
                                {alert.resolved ? 'Resolved' : 'Unresolved'}
                              </span>
                              <span className="alert-time">{new Date(alert.datetime).toLocaleString()}</span>
                            </div>
                          </div>
                          <div className="card-body">
                            <div className="issue">{alert.issue_detected}</div>
                            {alert.message && (
                              <div className="message truncate" title={alert.message}>{alert.message}</div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="pagination-bar">
              <div className="pagination-info">Showing {from}-{to} of {total}</div>
              <div className="pagination-controls">
                <button className="page-btn" disabled={page <= 1} onClick={() => setPage(1)} title="First">
                  <i className="fa-solid fa-angles-left"></i>
                </button>
                <button className="page-btn" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))} title="Previous">
                  <i className="fa-solid fa-angle-left"></i>
                </button>
                <span className="page-state">Page {page} of {totalPages}</span>
                <button className="page-btn" disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))} title="Next">
                  <i className="fa-solid fa-angle-right"></i>
                </button>
                <button className="page-btn" disabled={page >= totalPages} onClick={() => setPage(totalPages)} title="Last">
                  <i className="fa-solid fa-angles-right"></i>
                </button>
                <select className="form-control page-size" value={pageSize} onChange={e => setPageSize(parseInt(e.target.value, 10))} aria-label="Rows per page">
                  {[10,25,50].map(n => <option key={n} value={n}>{n}/page</option>)}
                </select>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AlertsView;