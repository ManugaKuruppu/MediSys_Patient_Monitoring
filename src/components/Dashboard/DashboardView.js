import React from 'react';
import { Doughnut, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
} from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

const DashboardView = ({ stats, alerts, onNavigate, patients }) => {
  // Calculate stats from patients data as fallback
  const totalPatients = patients?.length || 0;
  const activePatients = patients?.filter(p => p.connection_status === 'Online').length || 0;
  const criticalAlertsToday = patients?.filter(p => 
    p.heart_rate < 50 || p.heart_rate > 120 || p.oxygen_level < 90
  ).length || 0;
  const unresolvedAlerts = alerts?.filter(alert => !alert.resolved).length || 0;
  
  const avgHeartRate = patients?.length > 0 
    ? Math.round(patients.reduce((sum, p) => sum + (p.heart_rate || 0), 0) / patients.length)
    : 0;
  const avgOxygenLevel = patients?.length > 0
    ? Math.round(patients.reduce((sum, p) => sum + (p.oxygen_level || 0), 0) / patients.length)
    : 0;

  // Charts data (purely derived client-side)
  const offlinePatients = Math.max(totalPatients - activePatients, 0);
  const resolvedAlerts = Math.max((alerts?.length || 0) - unresolvedAlerts, 0);

  const activeVsOfflineData = {
    labels: ['Active', 'Offline'],
    datasets: [
      {
        data: [activePatients, offlinePatients],
        backgroundColor: ['#22c55e', '#ef4444'],
        borderWidth: 0,
      },
    ],
  };

  const alertStatusData = {
    labels: ['Unresolved', 'Resolved'],
    datasets: [
      {
        data: [unresolvedAlerts, resolvedAlerts],
        backgroundColor: ['#f59e0b', '#6366f1'],
        borderWidth: 0,
      },
    ],
  };

  // HR / O2 category distribution for a tiny bar chart
  const hrCritical = patients?.filter(p => p.heart_rate < 50 || p.heart_rate > 120).length || 0;
  const hrWarning = patients?.filter(p => p.heart_rate >= 50 && p.heart_rate < 60).length || 0;
  const hrNormal = Math.max(totalPatients - hrCritical - hrWarning, 0);
  const o2Critical = patients?.filter(p => p.oxygen_level < 90).length || 0;
  const o2Warning = patients?.filter(p => p.oxygen_level >= 90 && p.oxygen_level < 95).length || 0;
  const o2Normal = Math.max(totalPatients - o2Critical - o2Warning, 0);

  const vitalsBarData = {
    labels: ['HR Critical', 'HR Warn', 'HR Normal', 'O2 Critical', 'O2 Warn', 'O2 Normal'],
    datasets: [
      {
        label: 'Patients',
        data: [hrCritical, hrWarning, hrNormal, o2Critical, o2Warning, o2Normal],
        backgroundColor: ['#ef4444', '#f59e0b', '#22c55e', '#ef4444', '#f59e0b', '#22c55e'],
        borderWidth: 0,
      },
    ],
  };

  const chartOptions = {
    plugins: { legend: { display: false } },
    responsive: true,
    maintainAspectRatio: false,
    scales: { x: { grid: { display: false } }, y: { grid: { display: false }, ticks: { precision: 0 } } },
  };

  return (
    <div className="dashboard-view">
      <div className="dashboard-header">
        <h2 className="mt-3">Dashboard</h2>
        <div className="quick-actions">
          <button className="refresh-btn" onClick={() => onNavigate && onNavigate('patients')}>
            <i className="fa-solid fa-user-plus"></i> Add Patient
          </button>
          <button className="refresh-btn" onClick={() => onNavigate && onNavigate('alerts')}>
            <i className="fa-solid fa-bell"></i> View Alerts
          </button>
          <button className="refresh-btn" onClick={() => onNavigate && onNavigate('test')}>
            <i className="fa-solid fa-vial"></i> Test Center
          </button>
        </div>
      </div>
      <div className="dashboard-content">
        <div className="stats-grid">
          <div className="stat-card" onClick={() => onNavigate && onNavigate('patients')}>
            <div className="stat-top">
              <div className="stat-icon bg-primary-soft"><i className="fa-solid fa-users"></i></div>
              <span className="stat-label">Total Patients</span>
            </div>
            <div className="stat-value-lg">{stats?.total_patients || totalPatients}</div>
          </div>
          <div className="stat-card">
            <div className="stat-top">
              <div className="stat-icon bg-success-soft"><i className="fa-solid fa-heart-pulse"></i></div>
              <span className="stat-label">Active Patients</span>
            </div>
            <div className="stat-value-lg">{stats?.active_patients || activePatients}</div>
          </div>
          <div className="stat-card" onClick={() => onNavigate && onNavigate('alerts')}>
            <div className="stat-top">
              <div className="stat-icon bg-danger-soft"><i className="fa-solid fa-triangle-exclamation"></i></div>
              <span className="stat-label">Critical Alerts Today</span>
            </div>
            <div className="stat-value-lg">{stats?.critical_alerts_today || criticalAlertsToday}</div>
          </div>
          <div className="stat-card">
            <div className="stat-top">
              <div className="stat-icon bg-warning-soft"><i className="fa-solid fa-bell-exclamation"></i></div>
              <span className="stat-label">Unresolved Alerts</span>
            </div>
            <div className="stat-value-lg">{stats?.unresolved_alerts || unresolvedAlerts}</div>
          </div>
        </div>
        
        <div className="charts-grid">
          <div className="chart-card">
            <h4 className="chart-title">Active vs Offline</h4>
            <div className="chart-wrap">
              <Doughnut data={activeVsOfflineData} options={{ plugins: { legend: { display: true, position: 'bottom' } }, cutout: '65%' }} />
            </div>
          </div>
          <div className="chart-card">
            <h4 className="chart-title">Alerts Status</h4>
            <div className="chart-wrap">
              <Doughnut data={alertStatusData} options={{ plugins: { legend: { display: true, position: 'bottom' } }, cutout: '65%' }} />
            </div>
          </div>
          <div className="chart-card">
            <h4 className="chart-title">Vitals Distribution</h4>
            <div className="chart-wrap tall">
              <Bar data={vitalsBarData} options={chartOptions} />
            </div>
          </div>
        </div>
        
        {stats?.critical_alerts_today > 0 && (
          <div className="critical-alerts-section">
            <h3>⚠️ Critical Alerts Today</h3>
            <div className="alert-summary">
              <p>{stats.critical_alerts_today} critical alert(s) detected today</p>
              <button 
                className="view-alerts-btn"
                onClick={() => onNavigate && onNavigate('alerts')}
              >
                View All Alerts
              </button>
            </div>
          </div>
        )}

        {/* Recent critical alerts */}
        {alerts && alerts.length > 0 && (
          <div className="recent-alerts">
            <div className="recent-header">
              <h4>Recent Critical Alerts</h4>
              <button className="refresh-btn" onClick={() => onNavigate && onNavigate('alerts')}>
                View Alerts
              </button>
            </div>
            <ul className="recent-list">
              {[...alerts]
                .filter(a => a.severity_level === 'high')
                .sort((a, b) => new Date(b.datetime) - new Date(a.datetime))
                .slice(0, 5)
                .map(alert => (
                  <li key={alert.alert_id} className="recent-item">
                    <span className="recent-badge">HIGH</span>
                    <span className="recent-patient">{alert.patient_name || alert.patient_id}</span>
                    <span className="recent-issue">{alert.issue_detected}</span>
                    <span className="recent-time">{new Date(alert.datetime).toLocaleString()}</span>
                  </li>
                ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardView;