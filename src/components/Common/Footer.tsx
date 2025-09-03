import * as React from 'react';

const Footer = () => {
  const year = new Date().getFullYear();
  return (
    <footer className="footer" role="contentinfo">
      <div className="footer-content">
        <h6>
          <img src={`${process.env.PUBLIC_URL}/favicon.ico`} alt="MediSys" className="footer-logo-img" />
          MediSys Diagnostics Ltd.
        </h6>
        <p>
          Real-time Patient Monitoring Dashboard System
          <span> • </span>
          <span className="system-status" aria-live="polite">
            <span className="status-dot" aria-hidden="true"></span>
            System Online
          </span>
          <span> • © {year}</span>
        </p>
      </div>
    </footer>
  );
};

export default Footer;
