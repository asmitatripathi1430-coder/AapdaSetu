import React, { useState } from 'react';
import { analyzeRippleRisks, saveRippleDecision } from '../services/rippleRisk';

export default function RippleRiskPanel({ incident, allIncidents }) {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  if (!incident) return null;

  const risks = analyzeRippleRisks(incident, allIncidents);

  function handleDecision(ruleId, decision) {
    saveRippleDecision(incident.id, ruleId, decision);
    setRefreshTrigger(t => t + 1);
  }

  return (
    <div className="ripple-risk-container">
      <div className="intelligence-header">
        <div className="intel-title-wrap">
          <span className="intel-icon">🌊</span>
          <div>
            <h4 className="intel-title">RippleRisk — Secondary Hazard Analysis</h4>
            <span className="intel-subtitle">Transparent rule-based cascading threat suggestions</span>
          </div>
        </div>
        <div className="risk-count-badge">
          {risks.length} {risks.length === 1 ? 'Threat Identified' : 'Threats Identified'}
        </div>
      </div>

      <div className="heuristic-notice-bar">
        <span className="notice-icon">🛡️</span>
        <div className="notice-text">
          <strong>Heuristic Suggestion — Verify Before Action:</strong> Generated using deterministic situational rules. Does not alter base triage severity; intended for command anticipation only.
        </div>
      </div>

      {risks.length === 0 ? (
        <div className="intel-empty-state">
          <div className="empty-intel-icon">✅</div>
          <div className="empty-intel-text">No secondary cascading risks identified based on current incident parameters.</div>
          <div className="empty-intel-hint">Secondary threats trigger when specific environmental or situational indicators (e.g. rising water, collapse voids, mass sickness) are present.</div>
        </div>
      ) : (
        <div className="risks-list">
          {risks.map((risk) => {
            const isDismissed = risk.status === 'Dismissed';
            const isAccepted = risk.status === 'Accepted';

            return (
              <div key={risk.ruleId} className={`risk-card ${isDismissed ? 'risk-dismissed' : ''} ${isAccepted ? 'risk-accepted' : ''}`}>
                <div className="risk-card-top">
                  <div>
                    <div className="risk-rule-meta">
                      <span className="rule-code">{risk.ruleId}</span>
                      <span className="rule-category">{risk.category}</span>
                    </div>
                    <h5 className="risk-title">{risk.ruleName}</h5>
                  </div>
                  <div className={`risk-status-pill status-${risk.status.toLowerCase()}`}>
                    {risk.status === 'Accepted' ? '✓ Accepted' :
                     risk.status === 'Dismissed' ? '✗ Dismissed' :
                     risk.status === 'Reviewed' ? '👁 Reviewed' : '● Unreviewed'}
                  </div>
                </div>

                {/* Evidence trigger */}
                <div className="risk-evidence-box">
                  <strong>Triggering Evidence:</strong> {risk.evidence}
                </div>

                {/* Risk statement */}
                <div className="risk-statement-box">
                  <strong>Potential Cascade:</strong> {risk.riskStatement}
                </div>

                {/* Action checklist */}
                <div className="action-checklist">
                  <span className="checklist-heading">Recommended Command Checklist:</span>
                  <ul>
                    {risk.actionChecklist.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>

                {/* Responder controls */}
                <div className="risk-footer-actions">
                  <div className="risk-controls">
                    <button
                      className={`btn-risk btn-accept ${isAccepted ? 'active' : ''}`}
                      onClick={() => handleDecision(risk.ruleId, 'Accepted')}
                      title="Accept this secondary threat into the active command log"
                    >
                      {isAccepted ? '✓ Plan Accepted' : 'Accept Checklist'}
                    </button>
                    <button
                      className={`btn-risk btn-review ${risk.status === 'Reviewed' ? 'active' : ''}`}
                      onClick={() => handleDecision(risk.ruleId, 'Reviewed')}
                      title="Acknowledge reading this alert"
                    >
                      Mark Reviewed
                    </button>
                    <button
                      className={`btn-risk btn-dismiss ${isDismissed ? 'active' : ''}`}
                      onClick={() => handleDecision(risk.ruleId, 'Dismissed')}
                      title="Dismiss this advisory if not applicable on the ground"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>

                <div className="risk-disclaimer">
                  {risk.disclaimer}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
