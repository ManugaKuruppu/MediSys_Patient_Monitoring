import React from 'react';

const Navigation = ({ activeTab, setActiveTab }) => {
  const items = [
    { key: 'dashboard', label: 'Dashboard', icon: 'fa-solid fa-gauge' },
    { key: 'patients', label: 'Patients', icon: 'fa-solid fa-user-injured' },
    { key: 'alerts', label: 'Alerts', icon: 'fa-solid fa-triangle-exclamation' },
  { key: 'test', label: 'Diagnostics', icon: 'fa-solid fa-vial' },
  ];

  return (
    <nav className="dock" role="navigation" aria-label="Primary">
      <div className="dock-inner">
        {items.map(item => (
          <button
            key={item.key}
            type="button"
            title={item.label}
            className={`dock-btn ${activeTab === item.key ? 'active' : ''}`}
            aria-pressed={activeTab === item.key}
            onClick={() => setActiveTab(item.key)}
          >
            <i className={item.icon} aria-hidden="true"></i>
            <span className="dock-label">{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
};

export default Navigation;