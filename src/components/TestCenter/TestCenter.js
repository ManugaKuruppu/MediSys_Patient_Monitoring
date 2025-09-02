import React from 'react';
import TelemetryForm from './TelemetryForm';

const TestCenter = ({ patients }) => {
  return (
    <div className="test-center">
      <div className="test-header">
        <div>
          <h2>Test Center</h2>
          <p className="muted">Simulate telemetry and preview how alerts are triggered.</p>
        </div>
        <div className="test-actions">
          <button className="refresh-btn outline" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <i className="fa-solid fa-arrow-up"></i> Top
          </button>
        </div>
      </div>
      <div className="test-center-content grid">
        <div className="col main">
          <TelemetryForm />
        </div>
        <aside className="col side">
          <div className="side-card">
            <h4 className="side-title"><i className="fa-solid fa-bell"></i> Alert Triggers</h4>
            <ul className="side-list">
              <li><strong>High:</strong> HR &lt; 50 or &gt; 120 bpm</li>
              <li><strong>High:</strong> O2 &lt; 90%</li>
              <li><strong>Medium:</strong> O2 90–94%</li>
            </ul>
          </div>
          <div className="side-card">
            <h4 className="side-title"><i className="fa-solid fa-lightbulb"></i> Tips</h4>
            <ul className="side-list">
              <li>Use presets to quickly test normal, warning, and critical scenarios.</li>
              <li>Pick a patient with “Online” status for realistic flows.</li>
              <li>Check Alerts to see triggered items grouped by time.</li>
            </ul>
          </div>
        </aside>
      </div>

      <div className="current-patients">
        <h3>Current Patients</h3>
        <div className="patients-grid">
            {patients && patients.length > 0 ? (
              patients.map(patient => (
                <div key={patient.patient_id} className="patient-card">
                  <div className="patient-header">
                    <span className="patient-id">{patient.patient_id}</span>
                    <span className={`status-indicator ${patient.connection_status.toLowerCase()}`}>
                      {patient.connection_status}
                    </span>
                  </div>
                  <div className="patient-name">{patient.name}</div>
                  <div className="patient-vitals">
                    <div className="vital">
                      <span className="vital-label">HR:</span>
                      <span className={`vital-value ${
                        patient.heart_rate > 100 ? 'critical' : 
                        patient.heart_rate < 60 ? 'warning' : 'normal'
                      }`}>
                        {patient.heart_rate || '--'} bpm
                      </span>
                    </div>
                    <div className="vital">
                      <span className="vital-label">O2:</span>
                      <span className={`vital-value ${
                        patient.oxygen_level < 90 ? 'critical' : 
                        patient.oxygen_level < 95 ? 'warning' : 'normal'
                      }`}>
                        {patient.oxygen_level || '--'}%
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p>No patients available.</p>
            )}
          </div>
        </div>
      </div>
  );
};

export default TestCenter;