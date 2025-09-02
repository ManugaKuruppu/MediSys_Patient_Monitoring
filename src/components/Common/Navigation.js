import React from 'react';

const Navigation = ({ activeTab, setActiveTab }) => {
  const handleTabClick = (e, tabName) => {
    e.preventDefault();
    setActiveTab(tabName);
  };

  const items = [
    { key: 'dashboard', label: 'Dashboard', icon: 'fa-solid fa-gauge' },
    { key: 'patients', label: 'Patients', icon: 'fa-solid fa-user-injured' },
    { key: 'alerts', label: 'Alerts', icon: 'fa-solid fa-triangle-exclamation' },
    { key: 'test', label: 'Test Center', icon: 'fa-solid fa-vial' },
  ];

  return (
    <aside className="sidebar" aria-label="Primary">
      <nav className="sidebar-nav">
        {items.map(item => (
          <a
            key={item.key}
            href="#"
            className={`side-link ${activeTab === item.key ? 'active' : ''}`}
            onClick={(e) => handleTabClick(e, item.key)}
          >
            <i className={`${item.icon} side-icon`} aria-hidden="true"></i>
            <span className="side-text">{item.label}</span>
          </a>
        ))}
      </nav>
      <div className="sidebar-footer">
        <div className="status-dot online" aria-hidden="true"></div>
        <span>System Online</span>
      </div>
    </aside>
  );
};

export default Navigation;