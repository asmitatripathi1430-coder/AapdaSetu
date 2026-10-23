import React, { useState, useEffect } from 'react';
import { analyzeIncidentFusion, saveFusionDecision, loadFusionDecisions } from '../services/signalFusion';
import { PriorityBadge, StatusBadge } from './Shared';

export default function SignalFusionPanel({ incident, allIncidents, onSelectIncident }) {
  const [decisions, setDecisions] = useState(() => loadFusionDecisions());
  const [feedback, setFeedback] = useState({});

  useEffect(() => {
    setDecisions(loadFusionDecisions());
    setFeedback({});
  }, [incident?.id]);

  if (!incident) return null;

  const fusionData = analyzeIncidentFusion(incident, allIncidents, decisions);
  const { candidates, proposedClusterCount, hasConflicts, totalConflicts } = fusionData;

  function handleDecision(candidateId, decision) {
    const updated = saveFusionDecision(incident.id, candidateId, decision);
    setDecisions({ ...updated });

    let msg = '';
    if (decision === 'confirmed') msg = '✓ Confirmed as related cluster.';
    else if (decision === 'needs_review' || decision === 'pending') msg = '⏳ Flagged for field review & verification.';
    else if (decision === 'rejected') msg = '✗ Marked as separate independent incident.';

    setFeedback(prev => ({
      ...prev,
      [candidateId]: { message: msg, decision, timestamp: Date.now() }
    }));
  }

  return (
    <div className="signal-fusion-container">
      <div className="intelligence-header">
        <div className="intel-title-wrap">
          <span className="intel-icon">🔗</span>
          <div>
            <h4 className="intel-title">SignalFusion — Cross-Report Correlation</h4>
            <span className="intel-subtitle">Evidence-aware duplicate detection &amp; conflict discovery</span>
          </div>
        </div>
        <div className="cluster-badge">
          Cluster: <strong>{proposedClusterCount}</strong> {proposedClusterCount === 1 ? 'Report' : 'Reports'}
        </div>
      </div>

      {hasConflicts && (
        <div className="conflict-alert-box">
          <div className="conflict-alert-icon">⚠️</div>
          <div>
            <div className="conflict-alert-title">Conflicting Field Data Detected ({totalConflicts} divergence{totalConflicts > 1 ? 's' : ''})</div>
            <div className="conflict-alert-desc">
              Cross-referenced reports present conflicting factual information. Responder verification required before taking tactical action.
            </div>
          </div>
        </div>
      )}

      {candidates.length === 0 ? (
        <div className="intel-empty-state">
          <div className="empty-intel-icon">🔍</div>
          <div className="empty-intel-text">No related incident candidates or potential duplicate reports detected for this incident under current algorithmic thresholds.</div>
          <div className="empty-intel-hint">Tip: Reports with similar locations or overlapping emergency keywords will automatically surface here.</div>
        </div>
      ) : (
        <div className="candidates-list">
          {candidates.map((cand) => {
            const other = cand.targetIncident;
            const matchColor = cand.matchType === 'Possible Duplicate' ? '#ef4444' : cand.matchType === 'Related Incident' ? '#06b6d4' : '#94a3b8';
            const currentDecision = cand.responderDecision;
            const activeFeedback = feedback[cand.targetIncidentId];

            return (
              <div key={cand.targetIncidentId} className={`candidate-card ${cand.matchType === 'Possible Duplicate' ? 'possible-dup' : ''}`}>
                <div className="candidate-top">
                  <div className="candidate-headline">
                    <span className="match-pill" style={{ borderColor: matchColor, color: matchColor, background: `${matchColor}15` }}>
                      {cand.matchType === 'Possible Duplicate' ? '⚡ ' : '🔗 '}
                      {cand.matchType} ({cand.similarityScore}%)
                    </span>
                    <span
                      className="cand-incident-id"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectIncident && onSelectIncident(other);
                      }}
                      title="Inspect this candidate incident"
                    >
                      ID: {other.id.slice(0, 8).toUpperCase()} ↗
                    </span>
                  </div>

                  <div className="cand-status-row">
                    <PriorityBadge priority={other.triage?.priority} />
                    <StatusBadge status={other.status} />
                  </div>
                </div>

                <div className="candidate-location-row">
                  <strong>📍 Location:</strong> {other.location}
                </div>

                <div className="candidate-desc-snippet">
                  "{other.description.slice(0, 110)}{other.description.length > 110 ? '…' : ''}"
                </div>

                {/* Evidence Alignment */}
                {cand.matchedFields.length > 0 && (
                  <div className="field-group alignment-group">
                    <span className="field-group-title">✓ Corroborated Evidence:</span>
                    <div className="field-chips">
                      {cand.matchedFields.map((m, i) => (
                        <span key={i} className="chip chip-matched">
                          <strong>{m.field}:</strong> {m.value}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Conflicting Evidence Warnings */}
                {cand.conflictingFields.length > 0 && (
                  <div className="field-group conflict-group">
                    <span className="field-group-title">⚠ Conflicting Information:</span>
                    <div className="conflict-items">
                      {cand.conflictingFields.map((cf, i) => (
                        <div key={i} className="conflict-item">
                          <span className="conflict-badge">{cf.field}</span>
                          <span className="conflict-detail">
                            This report: <em>{cf.valA}</em> vs Candidate: <em>{cf.valB}</em>
                          </span>
                          <div className="conflict-reason-text">{cf.reason}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Evidence Warnings */}
                {cand.evidenceWarnings.length > 0 && (
                  <div className="uncertainty-warnings">
                    {cand.evidenceWarnings.map((w, i) => (
                      <div key={i} className="warning-note">
                        ℹ {w}
                      </div>
                    ))}
                  </div>
                )}

                {/* Interactive Feedback Message Banner */}
                {activeFeedback && (
                  <div className={`decision-feedback-banner feedback-${activeFeedback.decision} fade-in`}>
                    <span className="feedback-icon">
                      {activeFeedback.decision === 'confirmed' ? '✓' :
                       activeFeedback.decision === 'rejected' ? '✗' : '⏳'}
                    </span>
                    <span className="feedback-text">{activeFeedback.message}</span>
                  </div>
                )}

                {/* Responder Review Controls */}
                <div className="cand-action-footer">
                  <div className="decision-status">
                    <span className="decision-status-label">Review Status: </span>
                    <strong className={`decision-tag decision-${currentDecision}`}>
                      {currentDecision === 'confirmed' ? '✓ Confirmed Related' :
                       currentDecision === 'rejected' ? '✗ Marked Not Related' :
                       currentDecision === 'needs_review' || currentDecision === 'pending' ? '⏳ Flagged: Needs Review' :
                       '● Awaiting Review'}
                    </strong>
                  </div>
                  <div className="action-buttons-group">
                    <button
                      type="button"
                      className={`btn-action btn-confirm ${currentDecision === 'confirmed' ? 'active' : ''}`}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleDecision(cand.targetIncidentId, 'confirmed');
                      }}
                      title="Confirm that these two reports refer to the same incident or cluster"
                      id={`btn-fusion-confirm-${cand.targetIncidentId.slice(0, 8)}`}
                    >
                      {currentDecision === 'confirmed' ? '✓ Confirmed' : 'Confirm Related'}
                    </button>
                    <button
                      type="button"
                      className={`btn-action btn-review ${currentDecision === 'needs_review' || currentDecision === 'pending' ? 'active' : ''}`}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleDecision(cand.targetIncidentId, 'needs_review');
                      }}
                      title="Flag this report pair for on-the-ground field verification"
                      id={`btn-fusion-review-${cand.targetIncidentId.slice(0, 8)}`}
                    >
                      {currentDecision === 'needs_review' || currentDecision === 'pending' ? '⏳ Under Review' : 'Needs Review'}
                    </button>
                    <button
                      type="button"
                      className={`btn-action btn-reject ${currentDecision === 'rejected' ? 'active' : ''}`}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleDecision(cand.targetIncidentId, 'rejected');
                      }}
                      title="Mark as separate independent incident"
                      id={`btn-fusion-reject-${cand.targetIncidentId.slice(0, 8)}`}
                    >
                      {currentDecision === 'rejected' ? '✗ Not Related' : 'Not Related'}
                    </button>
                  </div>
                </div>

                <div className="cand-disclaimer">
                  {cand.disclaimer}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
