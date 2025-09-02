import React, { useState, useMemo } from 'react';
import { sendTelemetryData } from '../../services/api';
import { useAppContext } from '../../context/AppContext';
import { getVitalStatusText } from '../../utils/helpers';

const TelemetryForm = () => {
  const [formData, setFormData] = useState({
    patient_id: '',
    heart_rate: '',
    oxygen_level: '',
    status: 'active'
  });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const { refreshData, patients } = useAppContext();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);

    try {
      console.log('Sending telemetry data:', {
        patient_id: formData.patient_id,
        heart_rate: parseInt(formData.heart_rate),
        oxygen_level: parseInt(formData.oxygen_level)
      });

      const response = await sendTelemetryData({
        patient_id: formData.patient_id,
        heart_rate: parseInt(formData.heart_rate),
        oxygen_level: parseInt(formData.oxygen_level)
      });

      console.log('Telemetry response:', response);

      setMessage({
        type: 'success',
        text: response.alert_triggered 
          ? `Data sent successfully! Alert triggered: ${response.issue}`
          : 'Telemetry data sent successfully!'
      });
      
      // Reset form
      setFormData({
        patient_id: '',
        heart_rate: '',
        oxygen_level: '',
        status: 'active'
      });

      // Refresh dashboard data
      setTimeout(() => {
        refreshData();
      }, 1000);

    } catch (error) {
      console.error('Telemetry error:', error);
      setMessage({
        type: 'error',
        text: `Error: ${error.message}`
      });
    } finally {
      setSubmitting(false);
    }
  };

  const setPreset = (type) => {
    if (type === 'normal') {
      setFormData(d => ({ ...d, heart_rate: 75, oxygen_level: 98 }));
    } else if (type === 'warning') {
      setFormData(d => ({ ...d, heart_rate: 105, oxygen_level: 92 }));
    } else if (type === 'critical') {
      setFormData(d => ({ ...d, heart_rate: 45, oxygen_level: 85 }));
    }
  };

  const hrStatus = useMemo(() => getVitalStatusText('heart_rate', parseInt(formData.heart_rate)), [formData.heart_rate]);
  const o2Status = useMemo(() => getVitalStatusText('oxygen', parseInt(formData.oxygen_level)), [formData.oxygen_level]);

  return (
    <div className="telemetry-form-container">
      <div className="form-header-row">
        <div>
          <h3>Send Live Telemetry Data</h3>
          <p className="form-description">Simulate device data. Critical values will trigger alerts.</p>
        </div>
        <div className="presets" aria-label="Quick presets">
          <button type="button" className="refresh-btn outline" onClick={() => setPreset('normal')} title="Set normal values">
            <i className="fa-solid fa-gauge"></i> Normal
          </button>
          <button type="button" className="refresh-btn outline" onClick={() => setPreset('warning')} title="Set warning values">
            <i className="fa-solid fa-circle-exclamation"></i> Warning
          </button>
          <button type="button" className="refresh-btn outline" onClick={() => setPreset('critical')} title="Set critical values">
            <i className="fa-solid fa-triangle-exclamation"></i> Critical
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="telemetry-form">
        <div className="form-group field">
          <label htmlFor="patient_id" className="label-required">Patient ID</label>
          <select
            id="patient_id"
            name="patient_id"
            value={formData.patient_id}
            onChange={handleChange}
            required
            className="form-control"
          >
            <option value="">Select Patient</option>
            {patients && patients.length > 0 ? (
              patients.map(patient => (
                <option key={patient.patient_id} value={patient.patient_id}>
                  {patient.patient_id} - {patient.name}
                </option>
              ))
            ) : (
              <option disabled>No patients available</option>
            )}
          </select>
        </div>

        <div className="form-row">
          <div className="form-group field input-with-icon">
            <label htmlFor="heart_rate" className="label-required">Heart Rate (bpm)</label>
            <i className="fa-regular fa-heart input-icon" aria-hidden="true"></i>
            <input
              type="number"
              id="heart_rate"
              name="heart_rate"
              value={formData.heart_rate}
              onChange={handleChange}
              min="30"
              max="200"
              required
              className="form-control"
              placeholder="e.g., 75"
            />
            <small className="form-text">Normal: 60-100 bpm</small>
          </div>

          <div className="form-group field input-with-icon">
            <label htmlFor="oxygen_level" className="label-required">Oxygen Level (%)</label>
            <i className="fa-regular fa-circle input-icon" aria-hidden="true"></i>
            <input
              type="number"
              id="oxygen_level"
              name="oxygen_level"
              value={formData.oxygen_level}
              onChange={handleChange}
              min="70"
              max="100"
              required
              className="form-control"
              placeholder="e.g., 98"
            />
            <small className="form-text">Normal: 95-100%</small>
          </div>
        </div>

        <div className="form-group field">
          <label className="">Device Status</label>
          <div className="segmented" role="group" aria-label="Device status">
            {[
              { val: 'active', label: 'Active', icon: 'fa-bolt' },
              { val: 'inactive', label: 'Inactive', icon: 'fa-power-off' },
              { val: 'maintenance', label: 'Maintenance', icon: 'fa-screwdriver-wrench' }
            ].map(opt => (
              <button
                key={opt.val}
                type="button"
                className={`seg ${formData.status===opt.val ? 'active' : ''}`}
                onClick={() => setFormData(d => ({ ...d, status: opt.val }))}
              >
                <i className={`fa-solid ${opt.icon}`}></i> {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="metric-preview" aria-live="polite">
          <div className={`metric ${hrStatus?.toLowerCase().includes('critical') ? 'crit' : hrStatus==='Low' || hrStatus==='High' ? 'warn' : 'ok'}`}>
            <span className="label">HR</span>
            <span className="value">{formData.heart_rate || '--'} bpm</span>
            <span className="status">{hrStatus || 'No Data'}</span>
          </div>
          <div className={`metric ${o2Status?.toLowerCase().includes('critical') ? 'crit' : o2Status==='Low' ? 'warn' : 'ok'}`}>
            <span className="label">O2</span>
            <span className="value">{formData.oxygen_level || '--'}%</span>
            <span className="status">{o2Status || 'No Data'}</span>
          </div>
        </div>

        {message && (
          <div className={`form-message ${message.type}`}>
            {message.text}
          </div>
        )}

        <button 
          type="submit" 
          className="submit-btn"
          disabled={submitting}
        >
          {submitting ? 'Sending...' : 'Send Telemetry Data'}
        </button>
      </form>
    </div>
  );
};

export default TelemetryForm;