import React, { useState } from 'react';
import { getResourceRecommendations, loadInventory, saveInventory } from '../services/resourceMatcher';
import { updateIncidentStatus } from '../services/storage';
import { PriorityBadge, StatusBadge, UrgencyDisplay, MissingInfoList, formatDate, timeAgo } from './Shared';
import SignalFusionPanel from './SignalFusionPanel';
import RippleRiskPanel from './RippleRiskPanel';

const STATUSES = ['New', 'Assigned', 'In Progress', 'Resolved'];

export default function IncidentDetail({ incident, allIncidents = [], onStatusChange, onSelectIncident }) {
  const [activeTab, setActiveTab] = useState('triage'); // 'triage' | 'fusion' | 'ripple' | 'resources'
  const [inventory, setInventory] = useState(loadInventory);
  const [dispatching, setDispatching] = useState({});

  if (!incident) {
    return (
      <div className="panel detail-panel" style={{ minHeight: 460 }}>
        <div className="panel-header">
          <span className="panel-title"><span className="icon">📋</span> Incident Details &amp; Intelligence</span>
        </div>
        <div className="detail-empty">
          <div className="empty-icon">📋</div>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>No Incident Selected</div>
          <div>Select any emergency incident from the feed to view full triage analysis, cross-report correlation, secondary risks, and resource matching.</div>
        </div>
      </div>
    );
  }

  const { triage } = incident;
  const recommendations = getResourceRecommendations(incident, triage, inventory);

  function handleStatusChange(e) {
    const newStatus = e.target.value;
    const updated = updateIncidentStatus(incident.id, newStatus);
    onStatusChange && onStatusChange(updated);
  }

  function handleDispatch(resourceId) {
    setDispatching(d => ({ ...d, [resourceId]: true }));
    const newInventory = inventory.map(r => {
      if (r.id === resourceId && r.available > 0) {
        return { ...r, available: r.available - 1 };
      }
      return r;
    });
    setInventory(newInventory);
    saveInventory(newInventory);
  }

  return (
    <div className="panel detail-panel slide-in">
      <div className="panel-header detail-header-wrap">
        <div className="detail-header-left">
          <span className="panel-title">
            <span className="icon">🛡️</span> {incident.location}
          </span>
          <span className="incident-id-tag">ID: {incident.id.slice(0, 8).toUpperCase()}</span>
        </div>
        <PriorityBadge priority={triage?.priority} />
      </div>

      {/* Incident Sub-navigation Tabs */}
      <div className="detail-tabs-bar">
        <button
          className={`detail-tab-btn ${activeTab === 'triage' ? 'active' : ''}`}
          onClick={() => setActiveTab('triage')}
        >
          ⚡ Triage &amp; Status
        </button>
        <button
          className={`detail-tab-btn ${activeTab === 'fusion' ? 'active' : ''}`}
          onClick={() => setActiveTab('fusion')}
        >
          🔗 SignalFusion
        </button>
        <button
          className={`detail-tab-btn ${activeTab === 'ripple' ? 'active' : ''}`}
          onClick={() => setActiveTab('ripple')}
        >
          🌊 RippleRisk
        </button>
        <button
          className={`detail-tab-btn ${activeTab === 'resources' ? 'active' : ''}`}
          onClick={() => setActiveTab('resources')}
        >
          📦 Resources ({recommendations.length})
        </button>
      </div>

      <div className="detail-content">
        {/* TAB 1: TRIAGE & OVERVIEW */}
        {activeTab === 'triage' && (
          <div className="tab-pane fade-in">
            {/* Top overview section */}
            <div className="detail-top">
              <div>
                <div className="detail-meta">
                  <span>📍 {incident.location}</span>
                  <span>⏱ Filed {timeAgo(incident.createdAt)}</span>
                  {incident.isDemo && <span className="demo-tag">DEMO INCIDENT</span>}
                </div>
                <div className="detail-meta" style={{ marginTop: 6 }}>
                  <span>👥 <strong>{incident.affectedCount || 0}</strong> people affected</span>
                  {incident.trappedInjured > 0 && (
                    <span style={{ color: 'var(--color-critical)', fontWeight: 600 }}>
                      ⚠️ {incident.trappedInjured} trapped/injured
                    </span>
                  )}
                  <span>📂 Type: <strong>{incident.disasterType}</strong></span>
                </div>
              </div>
            </div>

            {/* Description */}
            <div style={{ marginTop: 14 }}>
              <div className="section-heading">Emergency Description</div>
              <p className="incident-desc-full">{incident.description}</p>
            </div>

            {/* Status change bar */}
            <div style={{ marginTop: 16 }}>
              <div className="section-heading">Response Status</div>
              <div className="status-select-row">
                <span className="status-select-label">Lifecycle:</span>
                <select
                  className="status-select"
                  value={incident.status}
                  onChange={handleStatusChange}
                  id={`status-${incident.id}`}
                >
                  {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <StatusBadge status={incident.status} />
              </div>
            </div>

            {/* Triage */}
            {triage && (
              <div style={{ marginTop: 18 }}>
                <div className="section-heading">Deterministic Triage Analysis</div>
                <UrgencyDisplay triage={triage} />
              </div>
            )}

            {/* Missing Info */}
            {triage?.missingInfo?.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <MissingInfoList missingInfo={triage.missingInfo} />
              </div>
            )}

            {/* Reporter Meta */}
            <div className="reporter-meta-foot">
              <span>Reported by: <strong>{incident.reporterName || 'Anonymous / Unverified'}</strong></span>
              <span>Timestamp: {formatDate(incident.createdAt)}</span>
            </div>
          </div>
        )}

        {/* TAB 2: SIGNALFUSION */}
        {activeTab === 'fusion' && (
          <div className="tab-pane fade-in">
            <SignalFusionPanel
              incident={incident}
              allIncidents={allIncidents}
              onSelectIncident={onSelectIncident}
            />
          </div>
        )}

        {/* TAB 3: RIPPLERISK */}
        {activeTab === 'ripple' && (
          <div className="tab-pane fade-in">
            <RippleRiskPanel
              incident={incident}
              allIncidents={allIncidents}
            />
          </div>
        )}

        {/* TAB 4: RESOURCES */}
        {activeTab === 'resources' && (
          <div className="tab-pane fade-in">
            <div className="section-heading">Verified Resource Recommendations</div>
            <div className="resource-disclaimer-note">
              <span>🛡️</span>
              <span><strong>Human Commander Approval Required:</strong> Recommendations are calculated based on incident severity and location proximity. Assets will not be dispatched until approved below.</span>
            </div>

            {recommendations.length === 0 ? (
              <div className="empty-state">No specific resources currently matched for this incident classification.</div>
            ) : (
              <div className="resource-list" style={{ marginTop: 12 }}>
                {recommendations.map(res => {
                  const isDispatched = dispatching[res.id];
                  return (
                    <div key={res.id} className={`resource-card ${isDispatched ? 'dispatched' : ''}`}>
                      <div className="resource-header">
                        <span className="resource-name">{res.name}</span>
                        <span className="resource-type-badge">{res.type}</span>
                      </div>
                      <div className="resource-reason">💡 {res.reason}</div>
                      <div className="resource-avail">
                        Available: <strong>{isDispatched ? res.available - 1 : res.available} {res.unit}</strong>
                        &nbsp;· Location: {res.location}
                      </div>
                      <button
                        className={`dispatch-btn ${isDispatched ? 'dispatched' : ''}`}
                        disabled={isDispatched || res.available === 0}
                        onClick={() => handleDispatch(res.id)}
                        id={`dispatch-${res.id}-${incident.id.slice(0, 8)}`}
                      >
                        {isDispatched ? '✓ Asset Dispatched' : 'Approve & Dispatch Resource'}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
