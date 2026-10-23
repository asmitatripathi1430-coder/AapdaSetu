import React, { useState } from 'react';
import LandingPage from './components/LandingPage';
import Dashboard from './components/Dashboard';
import ReportForm from './components/ReportForm';

export default function App() {
  const [activeTab, setActiveTab] = useState('home'); // 'home' | 'dashboard' | 'report'
  const [activeScenario, setActiveScenario] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  function handleNavigate(tab, scenarioId = 0) {
    setActiveTab(tab);
    if (scenarioId !== undefined) {
      setActiveScenario(scenarioId);
    }
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleReportSubmitted() {
    setRefreshKey(k => k + 1);
    // Switch to dashboard after short delay so user sees success
    setTimeout(() => {
      setActiveTab('dashboard');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 1800);
  }

  function handleScrollToSection(sectionClass) {
    if (activeTab !== 'home') {
      setActiveTab('home');
      setTimeout(() => {
        const el = document.querySelector(`.${sectionClass}`);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      const el = document.querySelector(`.${sectionClass}`);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
    setMobileMenuOpen(false);
  }

  return (
    <div className="app-layout">
      {/* ===== GLOBAL NAVIGATION BAR ===== */}
      <nav className={`navbar ${activeTab === 'home' ? 'navbar-landing' : ''}`}>
        <div className="navbar-brand" onClick={() => handleNavigate('home')} style={{ cursor: 'pointer' }}>
          <div className="brand-icon">🛡️</div>
          <div className="brand-text">
            <h1>AapdaSetu AI</h1>
            <span>Disaster Response &amp; Relief Coordination Platform</span>
          </div>
        </div>

        {/* Desktop Nav Links */}
        <div className="navbar-nav desktop-only">
          <button
            className={`nav-btn ${activeTab === 'home' ? 'active' : ''}`}
            onClick={() => handleNavigate('home')}
            id="nav-home"
          >
            Home
          </button>
          <button
            className={`nav-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => handleNavigate('dashboard')}
            id="nav-dashboard"
          >
            Operations Center
          </button>
          <button
            className="nav-btn"
            onClick={() => handleScrollToSection('intelligence-showcase-section')}
            id="nav-features"
          >
            Intelligence Engines
          </button>
          <button
            className="nav-btn"
            onClick={() => handleScrollToSection('how-it-works-section')}
            id="nav-howitworks"
          >
            How It Works
          </button>
        </div>

        {/* Action CTAs & Indicators */}
        <div className="navbar-actions">
          <div className="live-badge desktop-only">
            <div className="live-dot" />
            <span>RADAR ACTIVE</span>
          </div>

          <button
            className={`nav-action-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => handleNavigate('dashboard')}
            id="btn-open-dashboard"
          >
            📊 Open Dashboard
          </button>

          <button
            className={`nav-action-btn emergency-btn ${activeTab === 'report' ? 'active' : ''}`}
            onClick={() => handleNavigate('report')}
            id="btn-report-emergency"
          >
            🚨 Report Emergency
          </button>

          {/* Mobile Menu Hamburger */}
          <button
            className="mobile-menu-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle Navigation"
          >
            {mobileMenuOpen ? '✕' : '☰'}
          </button>
        </div>
      </nav>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="mobile-drawer fade-in">
          <button className={`m-nav-link ${activeTab === 'home' ? 'active' : ''}`} onClick={() => handleNavigate('home')}>
            🏠 Home
          </button>
          <button className={`m-nav-link ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => handleNavigate('dashboard')}>
            📊 Operations Dashboard
          </button>
          <button className={`m-nav-link ${activeTab === 'report' ? 'active' : ''}`} onClick={() => handleNavigate('report')}>
            🚨 Report Incident
          </button>
          <button className="m-nav-link" onClick={() => handleScrollToSection('demo-scenarios-section')}>
            🧪 Test Scenarios
          </button>
          <button className="m-nav-link" onClick={() => handleScrollToSection('how-it-works-section')}>
            ℹ️ How It Works
          </button>
        </div>
      )}

      {/* ===== MAIN CONTENT ROUTER ===== */}
      <main className="main-content-wrap">
        {activeTab === 'home' && (
          <LandingPage
            onNavigate={handleNavigate}
            onLaunchScenario={(sId) => handleNavigate('dashboard', sId)}
          />
        )}

        {activeTab === 'dashboard' && (
          <div className="dashboard-page-wrap">
            <Dashboard
              key={refreshKey}
              initialScenario={activeScenario}
            />
          </div>
        )}

        {activeTab === 'report' && (
          <div className="report-page-wrap">
            <ReportForm onSubmitted={handleReportSubmitted} />
          </div>
        )}
      </main>
    </div>
  );
}
