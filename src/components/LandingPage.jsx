import React from 'react';
import { loadIncidents } from '../services/storage';
import { PriorityBadge, ScoreBar, StatusBadge, timeAgo } from './Shared';

export default function LandingPage({ onNavigate, onLaunchScenario }) {
  const incidents = loadIncidents();
  const criticalCount = incidents.filter(i => i.triage?.priority === 'Critical').length;
  const highCount = incidents.filter(i => i.triage?.priority === 'High').length;
  const totalCasualties = incidents.reduce((sum, i) => sum + (Number(i.affectedCount) || 0), 0);

  // Take top 4 incidents for the live interactive preview frame
  const previewIncidents = incidents.slice(0, 4);

  return (
    <div className="landing-page-wrap">
      {/* ===== HERO SECTION ===== */}
      <section className="hero-section">
        {/* Cinematic Atmospheric Background Elements */}
        <div className="hero-bg-glow glow-top-center" />
        <div className="hero-bg-glow glow-mid-left" />
        <div className="hero-bg-glow glow-mid-right" />
        <div className="hero-grid-pattern" />

        {/* Ambient SVG Tech Grid & Topo Wave Lines */}
        <svg className="hero-topo-svg" viewBox="0 0 1440 600" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M-100 280C200 180 400 360 720 250C1040 140 1200 320 1540 220" stroke="rgba(59, 130, 246, 0.18)" strokeWidth="1.5" strokeDasharray="6 6" />
          <path d="M-100 340C220 240 440 420 760 310C1080 200 1260 380 1540 300" stroke="rgba(6, 182, 212, 0.14)" strokeWidth="1.2" />
          <path d="M-100 400C260 300 480 480 800 370C1120 260 1300 420 1540 360" stroke="rgba(99, 161, 255, 0.1)" strokeWidth="1" />
          <circle cx="720" cy="250" r="4" fill="#06b6d4" className="pulse-node" />
          <circle cx="1040" cy="140" r="3.5" fill="#3b82f6" className="pulse-node" />
          <circle cx="440" cy="420" r="3" fill="#60a5fa" className="pulse-node" />
        </svg>

        <div className="hero-content">
          {/* Top Pill Badge */}
          <div className="hero-badge">
            <span className="hero-badge-dot" />
            <span className="hero-badge-text">AapdaSetu AI — Disaster Response &amp; Relief Coordination</span>
          </div>

          {/* Main Headline */}
          <h1 className="hero-title">
            When Every Second Matters,<br />
            <span className="hero-gradient-text">Intelligence Saves Lives.</span>
          </h1>

          {/* Subtitle */}
          <p className="hero-subtitle">
            Transform emergency reports into prioritized incidents, connected intelligence, and coordinated relief recommendations — all in one unified response platform.
          </p>

          {/* CTA Buttons */}
          <div className="hero-cta-group">
            <button className="cta-btn primary-glow-btn" onClick={() => onNavigate('dashboard')} id="cta-explore-dashboard">
              <span className="cta-icon">🛡️</span>
              <span>Explore Response Platform</span>
              <span className="cta-arrow">→</span>
            </button>
            <button className="cta-btn secondary-glass-btn" onClick={() => onNavigate('report')} id="cta-report-emergency">
              <span className="cta-emergency-pulse" />
              <span>Report an Emergency</span>
            </button>
          </div>

          {/* Compact Capability Indicators */}
          <div className="capability-pills-row">
            <div className="cap-pill" onClick={() => onNavigate('dashboard')}>
              <span className="cap-icon">⚡</span>
              <span className="cap-title">Intelligent Incident Triage</span>
              <span className="cap-desc">Deterministic 0–100 urgency scoring</span>
            </div>
            <div className="cap-pill" onClick={() => onNavigate('dashboard')}>
              <span className="cap-icon">🔗</span>
              <span className="cap-title">Evidence-Aware Intelligence</span>
              <span className="cap-desc">SignalFusion cross-report deduplication</span>
            </div>
            <div className="cap-pill" onClick={() => onNavigate('dashboard')}>
              <span className="cap-icon">📦</span>
              <span className="cap-title">Resource Coordination</span>
              <span className="cap-desc">Bottleneck-aware asset dispatching</span>
            </div>
          </div>
        </div>

        {/* Cinematic Dashboard Live Frame Preview */}
        <div className="hero-dashboard-frame-wrap">
          <div className="dashboard-frame-glass">
            {/* Window Top Bar */}
            <div className="frame-window-bar">
              <div className="window-dots">
                <span className="w-dot red" />
                <span className="w-dot yellow" />
                <span className="w-dot green" />
              </div>
              <div className="frame-window-title">
                <span className="hud-indicator">● LIVE RADAR</span>
                <span>AapdaSetu Tactical Operations Center — Real-Time Incident Stream</span>
              </div>
              <button className="frame-expand-btn" onClick={() => onNavigate('dashboard')}>
                Open Full Console ↗
              </button>
            </div>

            {/* Embedded Live Metric HUD */}
            <div className="frame-metrics-strip">
              <div className="f-metric">
                <span className="f-metric-val">{incidents.length}</span>
                <span className="f-metric-lbl">Total Incidents</span>
              </div>
              <div className="f-metric crit">
                <span className="f-metric-val">{criticalCount}</span>
                <span className="f-metric-lbl">Critical Situations</span>
              </div>
              <div className="f-metric high">
                <span className="f-metric-val">{highCount}</span>
                <span className="f-metric-lbl">High Urgency</span>
              </div>
              <div className="f-metric">
                <span className="f-metric-val">{totalCasualties.toLocaleString()}</span>
                <span className="f-metric-lbl">Estimated Affected</span>
              </div>
            </div>

            {/* Live Incidents Preview Table */}
            <div className="frame-feed-body">
              <table className="frame-table">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Type</th>
                    <th>Location &amp; Emergency</th>
                    <th>Urgency</th>
                    <th>Priority</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {previewIncidents.map(inc => (
                    <tr key={inc.id} className="frame-row" onClick={() => onNavigate('dashboard')}>
                      <td style={{ color: 'var(--color-text-dim)', fontSize: 11 }}>{timeAgo(inc.createdAt)}</td>
                      <td>
                        <span className="frame-type-tag">{inc.disasterType}</span>
                      </td>
                      <td>
                        <div className="frame-loc">📍 {inc.location}</div>
                        <div className="frame-desc">{inc.description.slice(0, 65)}…</div>
                      </td>
                      <td>
                        <ScoreBar score={inc.triage?.urgencyScore || 0} priority={inc.triage?.priority} />
                      </td>
                      <td>
                        <PriorityBadge priority={inc.triage?.priority || 'Low'} />
                      </td>
                      <td>
                        <StatusBadge status={inc.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="frame-footer-callout" onClick={() => onNavigate('dashboard')}>
                <span>⚡ Interactive Command Grid Active · Click to launch full incident inspection and resource dispatching</span>
                <span className="callout-action">Launch Command Center →</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== 1-CLICK DEMO SCENARIOS SECTION ===== */}
      <section className="landing-section demo-scenarios-section">
        <div className="section-container">
          <div className="section-header-centered">
            <span className="section-eyebrow">REPRODUCIBLE EVALUATION</span>
            <h2 className="section-heading-lg">Live Test Scenarios</h2>
            <p className="section-subtext">
              Test core algorithmic innovations with pre-configured situational test cases. Click any scenario to launch the dashboard with that scenario loaded.
            </p>
          </div>

          <div className="scenarios-grid">
            <div className="scenario-card" onClick={() => onLaunchScenario(1)}>
              <div className="sc-header">
                <span className="sc-badge">SCENARIO 1</span>
                <span className="sc-engine-tag">SignalFusion</span>
              </div>
              <h3 className="sc-title">Related Flood Reports</h3>
              <p className="sc-desc">
                Two independent citizen flood reports from Shivaji Nagar, Pune with different wording. SignalFusion correlates shared locality tokens, urgency keywords, and clusters them without auto-merging.
              </p>
              <div className="sc-footer">
                <span className="sc-action-link">Launch Scenario 1 →</span>
              </div>
            </div>

            <div className="scenario-card" onClick={() => onLaunchScenario(2)}>
              <div className="sc-header">
                <span className="sc-badge">SCENARIO 2</span>
                <span className="sc-engine-tag">Evidence &amp; Uncertainty</span>
              </div>
              <h3 className="sc-title">Conflicting Evidence</h3>
              <p className="sc-desc">
                Two reports for the Sector 14 Noida tremor describe wildly divergent casualties (120 vs 8 affected). SignalFusion flags the disparity and prompts responder field verification.
              </p>
              <div className="sc-footer">
                <span className="sc-action-link">Launch Scenario 2 →</span>
              </div>
            </div>

            <div className="scenario-card" onClick={() => onLaunchScenario(3)}>
              <div className="sc-header">
                <span className="sc-badge">SCENARIO 3</span>
                <span className="sc-engine-tag">Bottleneck Detector</span>
              </div>
              <h3 className="sc-title">Resource Bottleneck</h3>
              <p className="sc-desc">
                Multiple concurrent Critical flood incidents in Pune and Bihar both require Rescue Boats and NDRF personnel, exceeding ready regional inventory. Bottleneck detector surfaces the deficit and alternative tactics.
              </p>
              <div className="sc-footer">
                <span className="sc-action-link">Launch Scenario 3 →</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== RESPONSE INTELLIGENCE DEEP-DIVE ===== */}
      <section className="landing-section intelligence-showcase-section">
        <div className="section-container">
          <div className="section-header-centered">
            <span className="section-eyebrow">DISASTER RESPONSE INTELLIGENCE</span>
            <h2 className="section-heading-lg">Core Architectural Innovations</h2>
            <p className="section-subtext">
              Built on deterministic, explainable rules. Zero black-box hallucinations. Every score, recommendation, and alert provides an auditable trail for emergency commanders.
            </p>
          </div>

          <div className="intel-trio-grid">
            {/* Card 1: SignalFusion */}
            <div className="intel-trio-card">
              <div className="trio-icon-box">🔗</div>
              <div className="trio-tag">SignalFusion Engine</div>
              <h3 className="trio-title">Cross-Report Correlation &amp; Duplicate Analysis</h3>
              <p className="trio-body">
                Normalized location token matching, incident category clustering, and Jaccard description overlap identify duplicate citizen submissions and cluster related events without silent data loss.
              </p>
              <div className="trio-list">
                <div className="trio-item">✓ Identifies potential duplicates and related situational reports</div>
                <div className="trio-item">✓ Flags conflicting casualty numbers and contradictory location details</div>
                <div className="trio-item">✓ Retains full human responder control: Confirm, Review, or Reject</div>
              </div>
            </div>

            {/* Card 2: RippleRisk */}
            <div className="intel-trio-card">
              <div className="trio-icon-box">🌊</div>
              <div className="trio-tag">RippleRisk Engine</div>
              <h3 className="trio-title">Cascading Secondary Hazard Suggestions</h3>
              <p className="trio-body">
                Deterministic heuristics analyze reported environmental and infrastructure conditions to anticipate downstream secondary crises before they compound into mass casualties.
              </p>
              <div className="trio-list">
                <div className="trio-item">✓ Rapid road inundation and electrical substation hazard warnings</div>
                <div className="trio-item">✓ Rooftop dehydration &amp; potable water supply timeline alerts</div>
                <div className="trio-item">✓ Crush syndrome &amp; structural aftershock protocols for collapse sites</div>
              </div>
            </div>

            {/* Card 3: Bottleneck Detector */}
            <div className="intel-trio-card">
              <div className="trio-icon-box">📦</div>
              <div className="trio-tag">Resource Bottleneck Detector</div>
              <h3 className="trio-title">Multi-Incident Fleet Competition Radar</h3>
              <p className="trio-body">
                Models concurrent asset demands across all active high-priority emergencies against regional depot stocks, highlighting impending fleet exhaustion and viable alternative assets.
              </p>
              <div className="trio-list">
                <div className="trio-item">✓ Real-time inventory tracking across Rescue Boats, NDRF squads, Ambulances</div>
                <div className="trio-item">✓ Highlights strategic trade-offs when critical demand exceeds supply</div>
                <div className="trio-item">✓ Strict human dispatch authorization — zero automated resource locking</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== PLATFORM FEATURES GRID ===== */}
      <section className="landing-section features-matrix-section">
        <div className="section-container">
          <div className="section-header-centered">
            <span className="section-eyebrow">UNIFIED EMERGENCY OPERATING SYSTEM</span>
            <h2 className="section-heading-lg">Engineered for Rapid Tactical Clarity</h2>
            <p className="section-subtext">
              An integrated toolchain covering the full incident lifecycle from initial citizen call-in to coordinated relief deployment.
            </p>
          </div>

          <div className="features-grid-6">
            <div className="feat-box">
              <div className="feat-icon">⚡</div>
              <h4>Intelligent Triage</h4>
              <p>Deterministic 0–100 urgency scoring with transparent keyword weighting, casualty multiplier, and explainable score breakdown.</p>
            </div>

            <div className="feat-box">
              <div className="feat-icon">📊</div>
              <h4>Unified Incident Feed</h4>
              <p>High-density tactical incident table with real-time text search, priority sorting, lifecycle filtering, and quick selection.</p>
            </div>

            <div className="feat-box">
              <div className="feat-icon">🚑</div>
              <h4>Smart Resource Matching</h4>
              <p>Category-aware matching of rescue personnel, medical units, food supplies, and water tankers with transparent dispatch reasoning.</p>
            </div>

            <div className="feat-box">
              <div className="feat-icon">⚠️</div>
              <h4>Missing Evidence Flags</h4>
              <p>Proactively warns responders when crucial data (exact street location, casualty counts, clinical details) is missing.</p>
            </div>

            <div className="feat-box">
              <div className="feat-icon">💾</div>
              <h4>Local-First Persistence</h4>
              <p>All incident reports, triage logs, status progressions, and resource dispatch logs are preserved reliably in browser storage.</p>
            </div>

            <div className="feat-box">
              <div className="feat-icon">🛡️</div>
              <h4>Auditable Command Log</h4>
              <p>Every priority calculation and risk heuristic provides an open reasoning trail suitable for post-disaster operational review.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS SECTION ===== */}
      <section className="landing-section how-it-works-section">
        <div className="section-container">
          <div className="section-header-centered">
            <span className="section-eyebrow">OPERATIONAL LIFECYCLE</span>
            <h2 className="section-heading-lg">How AapdaSetu Coordinates Response</h2>
            <p className="section-subtext">From raw emergency intake to commander-authorized relief deployment</p>
          </div>

          <div className="workflow-steps">
            <div className="step-card">
              <div className="step-num">01</div>
              <h4>Report Emergency</h4>
              <p>Citizen or first-responder files an incident report specifying disaster type, location, casualties, and situation details.</p>
            </div>

            <div className="step-arrow">→</div>

            <div className="step-card">
              <div className="step-num">02</div>
              <h4>Rule-Based Triage</h4>
              <p>Deterministic engine evaluates urgency keywords, casualty volume, and entrapment indicators to assign priority (Critical, High, Medium, Low).</p>
            </div>

            <div className="step-arrow">→</div>

            <div className="step-card">
              <div className="step-num">03</div>
              <h4>Evidence-Aware Analysis</h4>
              <p>SignalFusion checks for duplicates and conflicting casualties; RippleRisk scans for secondary cascading threats.</p>
            </div>

            <div className="step-arrow">→</div>

            <div className="step-card">
              <div className="step-num">04</div>
              <h4>Resource Recommendations</h4>
              <p>Regional inventory matches suitable assets (boats, medical teams, food kits) while bottleneck radar flags capacity deficits.</p>
            </div>

            <div className="step-arrow">→</div>

            <div className="step-card">
              <div className="step-num">05</div>
              <h4>Human Command Review</h4>
              <p>Emergency responders review all evidence, confirm/reject linkages, and approve asset dispatch with complete authority.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== PROTOTYPE IMPACT STATS ===== */}
      <section className="landing-section impact-metrics-section">
        <div className="section-container">
          <div className="impact-grid">
            <div className="impact-item">
              <div className="impact-num">{incidents.length}</div>
              <div className="impact-label">Active Incidents Monitored</div>
            </div>
            <div className="impact-item">
              <div className="impact-num">{totalCasualties.toLocaleString()}</div>
              <div className="impact-label">Estimated Lives Impacted</div>
            </div>
            <div className="impact-item">
              <div className="impact-num">100%</div>
              <div className="impact-label">Deterministic Rule Transparency</div>
            </div>
            <div className="impact-item">
              <div className="impact-num">0</div>
              <div className="impact-label">Black-Box AI Hallucinations</div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== BOTTOM CTA CALLOUT ===== */}
      <section className="landing-section bottom-cta-section">
        <div className="section-container">
          <div className="bottom-cta-box">
            <h2>Ready to Test the AapdaSetu Intelligence Platform?</h2>
            <p>Access the live tactical operations dashboard or submit a simulated field report now.</p>
            <div className="hero-cta-group" style={{ marginTop: 24, justifyContent: 'center' }}>
              <button className="cta-btn primary-glow-btn" onClick={() => onNavigate('dashboard')}>
                <span>Open Incident Dashboard</span>
                <span>→</span>
              </button>
              <button className="cta-btn secondary-glass-btn" onClick={() => onNavigate('report')}>
                <span>Submit Emergency Report</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="landing-footer">
        <div className="footer-container">
          <div className="footer-top">
            <div className="footer-brand">
              <div className="brand-icon">🛡️</div>
              <div>
                <div className="footer-brand-title">AapdaSetu AI</div>
                <div className="footer-brand-sub">Disaster Response &amp; Relief Coordination Platform</div>
              </div>
            </div>

            <div className="footer-links-row">
              <button className="footer-link-btn" onClick={() => onNavigate('home')}>Home</button>
              <button className="footer-link-btn" onClick={() => onNavigate('dashboard')}>Operations Dashboard</button>
              <button className="footer-link-btn" onClick={() => onNavigate('report')}>Report Emergency</button>
            </div>
          </div>

          <div className="footer-bottom">
            <div className="prototype-declaration">
              <strong>Prototype Notice:</strong> AapdaSetu AI is an experimental hackathon disaster coordination prototype. All triage scores, SignalFusion correlation, RippleRisk secondary hazard suggestions, and Resource Bottleneck alerts are generated using <strong>deterministic rule-based algorithms</strong>. This application does not claim official government endorsement, live sensor telemetry, or direct integration with municipal emergency dispatch systems.
            </div>
            <div className="footer-copy">
              © {new Date().getFullYear()} AapdaSetu AI Prototype. Built for humanitarian emergency response hackathon demonstration.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
