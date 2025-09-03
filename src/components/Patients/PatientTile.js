import React from 'react';

const getInitials = (name = '') => {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map(p => p[0] || '').join('').toUpperCase() || 'PT';
};

const PatientTile = ({ patient, onEdit, onDelete }) => {
  const hrClass = patient.heart_rate > 100 ? 'critical' : patient.heart_rate < 60 ? 'warning' : 'normal';
  const oxClass = patient.oxygen_level < 90 ? 'critical' : patient.oxygen_level < 95 ? 'warning' : 'normal';
  const isOffline = patient.connection_status === 'Offline';

  return (
    <div className={`patient-tile ${isOffline ? 'offline' : ''}`} role="group" aria-label={`Patient ${patient.name}`}>
      <div className="tile-head">
        <div className="tile-id">{patient.patient_id}</div>
        <div className={`tile-status ${patient.connection_status.toLowerCase()}`}>{patient.connection_status}</div>
      </div>

      <div className="tile-body">
        <div className="tile-person">
          <span className="avatar-sm" aria-hidden="true">{getInitials(patient.name)}</span>
          <div className="person-meta">
            <div className="person-name">{patient.name}</div>
            <div className="person-sub">{patient.gender} • {patient.age} yrs</div>
          </div>
        </div>

        {patient.medical_conditions && (
          <div className="tile-conditions" title={patient.medical_conditions}>
            {patient.medical_conditions}
          </div>
        )}

        <div className="vitals-row">
          <div className="vital-chip">
            <span className="chip-label">HR</span>
            <span className={`chip-value ${hrClass}`}>{patient.heart_rate ? `${patient.heart_rate} bpm` : '--'}</span>
          </div>
          <div className="vital-chip">
            <span className="chip-label">SpO2</span>
            <span className={`chip-value ${oxClass}`}>{patient.oxygen_level ? `${patient.oxygen_level}%` : '--'}</span>
          </div>
          <div className="vital-chip">
            <span className="chip-label">Last</span>
            <span className="chip-value">{patient.last_reading ? new Date(patient.last_reading).toLocaleString() : 'No data'}</span>
          </div>
        </div>
      </div>

      <div className="tile-actions">
        <button className="edit-btn" title="Edit" aria-label="Edit" onClick={() => onEdit(patient)}>
          <i className="fa-regular fa-pen-to-square" aria-hidden="true" />
        </button>
        <button className="delete-btn" title="Delete" aria-label="Delete" onClick={() => onDelete(patient)}>
          <i className="fa-regular fa-trash-can" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
};

export default PatientTile;
