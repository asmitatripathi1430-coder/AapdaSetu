import React, { useState } from 'react';
import { detectResourceBottlenecks } from '../services/resourceBottleneck';

export default function BottleneckPanel({ incidents, onSelectIncident }) {
  const [acknowledged, setAcknowledged] = useState({});
  const bottleneckData = detectResourceBottlenecks(incidents);
  const { bottlenecks, hasBottlenecks, totalCriticalDeficits } = bottleneckData;

  function toggleAcknowledge(id) {
    setAcknowledged(prev => ({ ...prev, [id]: !prev[id] }));
  }

  return (
    <div className="bottleneck-panel-container">
      <div className="intelligence-header">
        <div className="intel-title-wrap">
          <span className="intel-icon">📦</span>
          <div>
            <h4 className="intel-title">Resource Bottleneck Detection</h4>
            <span className="intel-subtitle">Multi-incident asset competition &amp; deficit analysis</span>
          </div>
        </div>
        {hasBottlenecks && (
          <div className="bottleneck-alert-count">
            🚨 <strong>{totalCriticalDeficits}</strong> Critical Deficit{totalCriticalDeficits !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      <div className="bottleneck-disclaimer-bar">
        <span>🛡️</span>
        <span>
          <strong>Advisory Warning — Zero Auto-Dispatch:</strong> Highlights concurrent demand strains on regional inventory. Resource re-allocations require explicit responder command approval.
        </span>
      </div>

      {!hasBottlenecks ? (
        <div className="intel-empty-state">
          <div className="empty-intel-icon">✅</div>
          <div className="empty-intel-text">No resource bottlenecks detected across active operations.</div>
          <div className="empty-intel-hint">
            Current inventory levels are sufficient to service active high-priority demands without immediate regional fleet exhaustion.
          </div>
        </div>
      ) : (
        <div className="bottlenecks-list">
          {bottlenecks.map((bn) => {
            const isAck = acknowledged[bn.id];
            const isCritical = bn.severity === 'Critical Deficit';

            return (
              <div key={bn.id} className={`bottleneck-card ${isCritical ? 'critical-deficit' : 'strained-capacity'} ${isAck ? 'acknowledged' : ''}`}>
                <div className="bn-top-row">
                  <div>
                    <div className="bn-badge-row">
                      <span className={`bn-severity-tag ${isCritical ? 'sev-crit' : 'sev-strain'}`}>
                        {bn.severity}
                      </span>
                      <span className="bn-resource-tag">{bn.resourceType}</span>
                    </div>
                    <h5 className="bn-title">Concurrent Contention for {bn.resourceType}</h5>
                  </div>

                  <div className="bn-stock-pill">
                    Stock: <strong>{bn.totalAvailable}</strong> / {bn.totalCapacity} Available (Demand: {bn.totalDemanded})
                  </div>
                </div>

                <div className="bn-reason-box">
                  <strong>Trigger:</strong> {bn.reason}
                </div>

                {/* Competing Incidents */}
                <div className="competing-incidents-section">
                  <span className="competing-heading">Contending High-Priority Incidents:</span>
                  <div className="competing-list">
                    {bn.competingIncidents.map((inc) => (
                      <div key={inc.id} className="competing-item" onClick={() => onSelectIncident && onSelectIncident({ id: inc.id })}>
                        <div className="comp-left">
                          <span className="comp-id">🆔 {inc.id.slice(0, 8).toUpperCase()}</span>
                          <span className="comp-loc">📍 {inc.location}</span>
                        </div>
                        <div className="comp-right">
                          <span className="comp-prio">{inc.priority} ({inc.urgencyScore} pts)</span>
                          <span className="comp-units">Requires: <strong>{inc.demandedUnits}</strong></span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Trade-off Analysis */}
                <div className="bn-tradeoff-box">
                  <strong>Strategic Trade-off:</strong> {bn.tradeOffAnalysis}
                </div>

                {/* Suggested Alternatives */}
                <div className="bn-alternatives-box">
                  <span className="alt-heading">Viable Tactical Alternatives:</span>
                  <ul>
                    {bn.alternativeSuggestions.map((alt, i) => (
                      <li key={i}>{alt}</li>
                    ))}
                  </ul>
                </div>

                {/* Depots */}
                <div className="bn-depots-row">
                  <span className="depot-label">Inventory Locations:</span>
                  <span className="depot-list">{bn.depots.join(' · ')}</span>
                </div>

                <div className="bn-footer-row">
                  <button
                    className={`btn-ack ${isAck ? 'is-ack' : ''}`}
                    onClick={() => toggleAcknowledge(bn.id)}
                  >
                    {isAck ? '✓ Conflict Acknowledged in Log' : 'Acknowledge Resource Conflict'}
                  </button>
                  <span className="bn-note">{bn.disclaimer}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
