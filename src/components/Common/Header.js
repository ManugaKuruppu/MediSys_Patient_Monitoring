import React, { useEffect, useState } from 'react';

const Header = () => {
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
  const saved = localStorage.getItem('theme') || 'dark';
    setTheme(saved);
    document.documentElement.setAttribute('data-theme', saved);
  }, []);

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    localStorage.setItem('theme', next);
    document.documentElement.setAttribute('data-theme', next);
  };

  return (
    <header className="topbar">
      <div className="topbar-inner">
        <div className="brand">
          <span className="brand-logo">🏥</span>
          <div className="brand-text">
            <strong>MediSys</strong>
            <span className="brand-sub">Patient Monitor</span>
          </div>
        </div>

        <div className="topbar-actions">
          <button
            className="icon-btn"
            title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
            aria-label="Toggle theme"
            onClick={toggleTheme}
          >
            {theme === 'light' ? (
              <i className="fa-regular fa-moon"></i>
            ) : (
              <i className="fa-regular fa-sun"></i>
            )}
          </button>
          <div className="avatar" title="Profile" aria-label="Profile">MS</div>
        </div>
      </div>
    </header>
  );
};

export default Header;