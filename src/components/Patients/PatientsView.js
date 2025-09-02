import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import PatientForm from './PatientForm';
import { createPatient, updatePatient, deletePatient } from '../../services/api';

const PatientsView = ({ patients }) => {
  const { loading, refreshData } = useAppContext();
  const [showForm, setShowForm] = useState(false);
  const [editingPatient, setEditingPatient] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  // UI state (purely client-side, does not change backend behavior)
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all | Online | Offline
  const [genderFilter, setGenderFilter] = useState('all'); // all | Male | Female | Other
  const [dense, setDense] = useState(() => (localStorage.getItem('patients_density') ?? 'compact') === 'compact');
  const [sort, setSort] = useState({ key: 'patient_id', dir: 'asc' });
  const [showColsMenu, setShowColsMenu] = useState(false);
  const defaultCols = {
    patient_id: true,
    name: true,
    age: true,
    gender: true,
    medical_conditions: true,
    heart_rate: true,
    oxygen_level: true,
    last_reading: true,
    status: true,
    actions: true,
  };
  const [cols, setCols] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('patients_columns') || 'null');
      return saved ? { ...defaultCols, ...saved } : defaultCols;
    } catch { return defaultCols; }
  });
  const [toasts, setToasts] = useState([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(() => parseInt(localStorage.getItem('patients_page_size') || '10', 10));
  const colsMenuRef = useRef(null);

  const addToast = (type, text) => {
    const id = Date.now() + Math.random();
    setToasts(t => [...t, { id, type, text }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3200);
  };

  const toggleCol = (key) => {
    setCols(prev => {
      const next = { ...prev, [key]: !prev[key] };
      localStorage.setItem('patients_columns', JSON.stringify(next));
      return next;
    });
  };

  const getInitials = (name = '') => {
    const parts = name.trim().split(/\s+/).slice(0,2);
    return parts.map(p => p[0] || '').join('').toUpperCase() || 'PT';
  };

  const handleAddPatient = () => {
    setEditingPatient(null);
    setShowForm(true);
  };

  const handleEditPatient = (patient) => {
    setEditingPatient(patient);
    setShowForm(true);
  };

  const handleDeletePatient = (patient) => {
    setDeleteConfirm(patient);
  };

  const confirmDelete = async () => {
    try {
      await deletePatient(deleteConfirm.patient_id);
      setDeleteConfirm(null);
      refreshData();
  addToast('success', 'Patient deleted');
    } catch (error) {
      console.error('Delete error:', error);
  addToast('error', `Error deleting patient: ${error.message}`);
  alert(`Error deleting patient: ${error.message}`);
    }
  };

  const handleSavePatient = async (patientData) => {
    try {
      if (editingPatient) {
        await updatePatient(editingPatient.patient_id, patientData);
      } else {
        await createPatient(patientData);
      }
      setShowForm(false);
      setEditingPatient(null);
      refreshData();
  addToast('success', editingPatient ? 'Patient updated' : 'Patient added');
    } catch (error) {
      throw error;
    }
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingPatient(null);
  };

  useEffect(() => {
    localStorage.setItem('patients_density', dense ? 'compact' : 'comfortable');
  }, [dense]);

  const onSort = (key) => {
    setSort((prev) => ({
      key,
      dir: prev.key === key ? (prev.dir === 'asc' ? 'desc' : 'asc') : 'asc',
    }));
  };

  const displayedPatients = useMemo(() => {
    let list = Array.isArray(patients) ? [...patients] : [];

    // Filters
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(p =>
        (p.name || '').toLowerCase().includes(q) ||
        (p.patient_id || '').toLowerCase().includes(q)
      );
    }
    if (statusFilter !== 'all') {
      list = list.filter(p => (p.connection_status || '') === statusFilter);
    }
    if (genderFilter !== 'all') {
      list = list.filter(p => (p.gender || '') === genderFilter);
    }

    // Sorting
    const getKeyVal = (p, key) => {
      if (key === 'patient_id') {
        const n = String(p.patient_id || '').replace(/\D+/g, '');
        return n ? parseInt(n, 10) : 0;
      }
      return p[key];
    };

    list.sort((a, b) => {
      const av = getKeyVal(a, sort.key);
      const bv = getKeyVal(b, sort.key);
      if (typeof av === 'number' && typeof bv === 'number') {
        return sort.dir === 'asc' ? av - bv : bv - av;
      }
      return sort.dir === 'asc'
        ? String(av || '').localeCompare(String(bv || ''))
        : String(bv || '').localeCompare(String(av || ''));
    });

    return list;
  }, [patients, search, statusFilter, genderFilter, sort]);

  // Derive current page slice
  const { pageItems, total, from, to, totalPages } = useMemo(() => {
    const total = displayedPatients.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const safePage = Math.min(page, totalPages);
    const start = (safePage - 1) * pageSize;
    const end = start + pageSize;
    const pageItems = displayedPatients.slice(start, end);
    return { pageItems, total, from: total ? start + 1 : 0, to: Math.min(end, total), totalPages };
  }, [displayedPatients, page, pageSize]);

  // Reset page when filters/sort/search change
  useEffect(() => { setPage(1); }, [search, statusFilter, genderFilter, sort]);

  // Persist page size
  useEffect(() => { localStorage.setItem('patients_page_size', String(pageSize)); }, [pageSize]);

  // Close columns menu on outside click
  useEffect(() => {
    if (!showColsMenu) return;
    const onClick = (e) => {
      if (colsMenuRef.current && !colsMenuRef.current.contains(e.target)) {
        setShowColsMenu(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [showColsMenu]);

  const exportCSV = () => {
    const visibleCols = Object.keys(cols).filter(k => cols[k]);
    const headerMap = {
      patient_id:'Patient ID', name:'Name', age:'Age', gender:'Gender',
      medical_conditions:'Medical Conditions', heart_rate:'Heart Rate',
      oxygen_level:'Oxygen Level', last_reading:'Last Reading', status:'Status', actions:'Actions'
    };
    const headers = visibleCols.filter(c => c !== 'actions').map(c => headerMap[c]);
    const rows = displayedPatients.map(p => visibleCols.filter(c => c !== 'actions').map(c => {
      switch (c) {
        case 'status': return p.connection_status || '';
        case 'last_reading': return p.last_reading ? new Date(p.last_reading).toLocaleString() : '';
        default: return (p[c] ?? '').toString();
      }
    }));
    const csv = [headers, ...rows].map(r => r.map(field => {
      const v = String(field ?? '');
      if (/[,"\n]/.test(v)) return '"' + v.replace(/"/g, '""') + '"';
      return v;
    }).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'patients.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="patients-view">
        <div className="patients-header">
          <h2>Patients</h2>
          <div className="patients-actions">
            <button disabled className="add-patient-btn">
              <i className="fa-solid fa-user-plus"></i> Add Patient
            </button>
          </div>
        </div>
        <div className="patients-content">
          <div className="table-responsive">
            <table className="patients-table skeleton-table">
              <thead>
                <tr>
                  <th>Patient ID</th>
                  <th>Name</th>
                  <th>Age</th>
                  <th>Gender</th>
                  <th>Medical Conditions</th>
                  <th>Heart Rate</th>
                  <th>Oxygen Level</th>
                  <th>Last Reading</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 10 }).map((__, j) => (
                      <td key={j}><div className="skeleton skeleton-text"></div></td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="patients-view">
      <div className="patients-header">
        <h2>Patients ({patients?.length || 0})</h2>
        <div className="patients-actions">
          <button onClick={handleAddPatient} className="add-patient-btn">
            <i className="fa-solid fa-user-plus"></i> Add Patient
          </button>
        </div>
      </div>

      <div className="patients-toolbar sticky">
        <div className="search-input input-with-icon">
          <i className="fa-solid fa-magnifying-glass input-icon" aria-hidden="true"></i>
          <input
            type="text"
            placeholder="Search by ID or name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search patients"
            className="form-control"
          />
          {search && (
            <button className="input-clear" aria-label="Clear search" onClick={() => setSearch('')}>
              <i className="fa-solid fa-xmark"></i>
            </button>
          )}
        </div>

        <div className="filters">
          <div className="chip-group" role="group" aria-label="Filter by status">
            {['all','Online','Offline'].map(val => (
              <button
                key={val}
                type="button"
                className={`chip ${statusFilter===val ? 'active' : ''}`}
                onClick={() => setStatusFilter(val)}
              >{val === 'all' ? 'All' : val}</button>
            ))}
          </div>

          <select
            className="form-control"
            value={genderFilter}
            onChange={(e) => setGenderFilter(e.target.value)}
            aria-label="Filter by gender"
          >
            <option value="all">All Genders</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>

          <div className="columns">
            <button
              type="button"
              className="refresh-btn"
              onClick={() => setShowColsMenu(s => !s)}
              aria-expanded={showColsMenu}
              aria-controls="columns-menu"
            >
              <i className="fa-solid fa-table-columns"></i> Columns
            </button>
            {showColsMenu && (
              <div id="columns-menu" className="columns-menu" role="menu" ref={colsMenuRef}>
                {Object.keys(cols).map(key => (
                  <label key={key} className={`col-item ${['patient_id','name','status','actions'].includes(key) ? 'disabled' : ''}`}>
                    <input
                      type="checkbox"
                      disabled={['patient_id','name','status','actions'].includes(key)}
                      checked={!!cols[key]}
                      onChange={() => toggleCol(key)}
                    />
                    <span>{
                      {
                        patient_id:'Patient ID', name:'Name', age:'Age', gender:'Gender',
                        medical_conditions:'Medical Conditions', heart_rate:'Heart Rate', oxygen_level:'Oxygen Level',
                        last_reading:'Last Reading', status:'Status', actions:'Actions'
                      }[key]
                    }</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          <button
            className="density-toggle refresh-btn"
            onClick={() => setDense(d => !d)}
            aria-pressed={dense}
            title={dense ? 'Switch to comfortable density' : 'Switch to compact density'}
          >
            <i className={`fa-solid ${dense ? 'fa-minimize' : 'fa-maximize'}`}></i>
            {dense ? ' Comfortable' : ' Compact'}
          </button>

          <button type="button" className="refresh-btn ghost" onClick={() => { setSearch(''); setStatusFilter('all'); setGenderFilter('all'); }}>
            <i className="fa-solid fa-rotate"></i> Reset
          </button>

          <button type="button" className="refresh-btn outline" onClick={exportCSV}>
            <i className="fa-solid fa-file-arrow-down"></i> Export
          </button>
        </div>
      </div>
      
      <div className="patients-content">
        {!patients || patients.length === 0 ? (
          <div className="no-patients">
            <p>No patients found.</p>
            <button onClick={handleAddPatient} className="add-first-patient-btn">Add Your First Patient</button>
          </div>
        ) : (
          <>
            <div className={`table-responsive ${dense ? 'dense' : ''}`}>
              <table className="patients-table">
                <thead>
                  <tr>
                    {cols.patient_id && (<th>
                      <button className="th-btn" onClick={() => onSort('patient_id')} aria-sort={sort.key==='patient_id'?sort.dir:'none'}>
                        Patient ID {sort.key==='patient_id' && (<i className={`fa-solid ${sort.dir==='asc'?'fa-sort-up':'fa-sort-down'}`}></i>)}
                      </button>
                    </th>)}
                    {cols.name && (<th>
                      <button className="th-btn" onClick={() => onSort('name')} aria-sort={sort.key==='name'?sort.dir:'none'}>
                        Name {sort.key==='name' && (<i className={`fa-solid ${sort.dir==='asc'?'fa-sort-up':'fa-sort-down'}`}></i>)}
                      </button>
                    </th>)}
                    {cols.age && (<th>
                      <button className="th-btn" onClick={() => onSort('age')} aria-sort={sort.key==='age'?sort.dir:'none'}>
                        Age {sort.key==='age' && (<i className={`fa-solid ${sort.dir==='asc'?'fa-sort-up':'fa-sort-down'}`}></i>)}
                      </button>
                    </th>)}
                    {cols.gender && (<th>Gender</th>)}
                    {cols.medical_conditions && (<th>Medical Conditions</th>)}
                    {cols.heart_rate && (<th>
                      <button className="th-btn" onClick={() => onSort('heart_rate')} aria-sort={sort.key==='heart_rate'?sort.dir:'none'}>
                        Heart Rate {sort.key==='heart_rate' && (<i className={`fa-solid ${sort.dir==='asc'?'fa-sort-up':'fa-sort-down'}`}></i>)}
                      </button>
                    </th>)}
                    {cols.oxygen_level && (<th>
                      <button className="th-btn" onClick={() => onSort('oxygen_level')} aria-sort={sort.key==='oxygen_level'?sort.dir:'none'}>
                        Oxygen Level {sort.key==='oxygen_level' && (<i className={`fa-solid ${sort.dir==='asc'?'fa-sort-up':'fa-sort-down'}`}></i>)}
                      </button>
                    </th>)}
                    {cols.last_reading && (<th>Last Reading</th>)}
                    {cols.status && (<th>Status</th>)}
                    {cols.actions && (<th>Actions</th>)}
                  </tr>
                </thead>
                <tbody>
                  {pageItems.map(patient => (
                    <tr
                      key={patient.patient_id}
                      className={`row-clickable ${patient.connection_status === 'Offline' ? 'patient-offline' : ''}`}
                      onClick={() => handleEditPatient(patient)}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleEditPatient(patient); }}
                      role="button"
                      tabIndex={0}
                    >
                      {cols.patient_id && (<td>{patient.patient_id}</td>)}
                      {cols.name && (
                        <td title={patient.name}>
                          <div className="name-cell">
                            <span className="avatar-sm" aria-hidden="true">{getInitials(patient.name)}</span>
                            <span className="truncate">{patient.name}</span>
                          </div>
                        </td>
                      )}
                      {cols.age && (<td>{patient.age}</td>)}
                      {cols.gender && (<td>{patient.gender}</td>)}
                      {cols.medical_conditions && (
                        <td className="truncate" title={patient.medical_conditions}>{patient.medical_conditions}</td>
                      )}
                      {cols.heart_rate && (
                        <td className={patient.heart_rate > 100 ? 'critical' : patient.heart_rate < 60 ? 'warning' : 'normal'}>
                          {patient.heart_rate || '--'} {patient.heart_rate ? 'bpm' : ''}
                        </td>
                      )}
                      {cols.oxygen_level && (
                        <td className={patient.oxygen_level < 90 ? 'critical' : patient.oxygen_level < 95 ? 'warning' : 'normal'}>
                          {patient.oxygen_level || '--'}{patient.oxygen_level ? '%' : ''}
                        </td>
                      )}
                      {cols.last_reading && (<td>{patient.last_reading ? new Date(patient.last_reading).toLocaleString() : 'No data'}</td>)}
                      {cols.status && (
                        <td>
                          <span className={`status-badge ${patient.connection_status.toLowerCase()}`}>
                            {patient.connection_status}
                          </span>
                        </td>
                      )}
                      {cols.actions && (
                        <td>
                          <div className="action-buttons" onClick={(e) => e.stopPropagation()}>
                            <button 
                              onClick={() => handleEditPatient(patient)}
                              className="edit-btn"
                              title="Edit Patient"
                              aria-label="Edit Patient"
                            >
                              <i className="fa-regular fa-pen-to-square" aria-hidden="true"></i>
                            </button>
                            <button 
                              onClick={() => handleDeletePatient(patient)}
                              className="delete-btn"
                              title="Delete Patient"
                              aria-label="Delete Patient"
                            >
                              <i className="fa-regular fa-trash-can" aria-hidden="true"></i>
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
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

      {/* Patient Form Modal */}
      {showForm && (
        <PatientForm
          patient={editingPatient}
          onSave={handleSavePatient}
          onCancel={handleCancelForm}
          isEditing={!!editingPatient}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="delete-confirm-overlay">
          <div className="delete-confirm-modal">
            <h3>Confirm Delete</h3>
            <p>
              Are you sure you want to delete patient <strong>{deleteConfirm.name}</strong> ({deleteConfirm.patient_id})?
            </p>
            <p className="warning-text">
              This will also delete all associated telemetry data and alerts.
            </p>
            <div className="confirm-actions">
              <button onClick={() => setDeleteConfirm(null)} className="cancel-btn">
                Cancel
              </button>
              <button onClick={confirmDelete} className="confirm-delete-btn">
                Delete Patient
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toasts */}
      <div className="toast-container" role="status" aria-live="polite" aria-atomic="true">
        {toasts.map(t => (
          <div key={t.id} className={`toast ${t.type}`}>
            {t.type === 'success' ? '✓' : '⚠'} {t.text}
          </div>
        ))}
      </div>
    </div>
  );
};

export default PatientsView;