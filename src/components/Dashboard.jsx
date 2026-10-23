import React, { useState } from 'react';
import { loadIncidents } from '../services/storage';
import IncidentTable from './IncidentTable';
import IncidentDetail from './IncidentDetail';
import BottleneckPanel from './BottleneckPanel';
import ScenarioSelector from './ScenarioSelector';
import { detectResourceBottlenecks } from '../services/resourceBottleneck';

function computeStats(incidents) {
  const total = incidents.length;
  const critical = incidents.filter(i => i.triage?.priority === 'Critical').length;
  const high = incidents.filter(i => i.triage?.priority === 'High').length;
  const resolved = incidents.filter(i => i.status === 'Resolved').length;
  const totalAffected = incidents.reduce((sum, i) => sum + (Number(i.affectedCount) || 0), 0);
  return { total, critical, high, resolved, totalAffected };
}

export default function Dashboard({ initialScenario = 0 }) {
  const [incidents, setIncidents] = useState(() => loadIncidents());
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [currentScenario, setCurrentScenario] = useState(initialScenario);
  const [showBottlenecks, setShowBottlenecks] = useState(true);

  const stats = computeStats(incidents);
  const bottleneckData = detectResourceBottlenecks(incidents);

  function handleStatusChange(updatedList) {
    setIncidents(updatedList);
    if (selectedIncident) {
      const updated = updatedList.find(i => i.id === selectedIncident.id);
      if (updated) setSelectedIncident(updated);
    }
  }

  function handleSelectIncident(incidentOrRef) {
    if (!incidentOrRef) {
      setSelectedIncident(null);
      return;
    }
    const target = incidents.find(i => i.id === incidentOrRef.id) || incidentOrRef;
    setSelectedIncident(prev => prev?.id === target.id ? null : target);
  }

  function handleScenarioLoaded(updatedIncidents, scenarioId) {
    setIncidents(updatedIncidents);
    setCurrentScenario(scenarioId);
    // If the scenario has specific focal incidents, select the first one to highlight it
    if (updatedIncidents.length > 0) {
      setSelectedIncident(updatedIncidents[0]);
    }
  }

  return (
    <div className="dashboard-container">
      {/* 1-Click Interactive Demo Scenario Bar */}
      <ScenarioSelector
        currentScenario={currentScenario}
        onScenarioLoaded={handleScenarioLoaded}
      />

      {/* Top Operational Stats */}
      <div className="stats-grid">
        <div className="stat-card total">
          <div className="stat-icon">📊</div>
          <div className="stat-info">
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">Active Incidents</div>
          </div>
        </div>
        <div className="stat-card critical">
          <div className="stat-icon">🔴</div>
          <div className="stat-info">
            <div className="stat-value">{stats.critical}</div>
            <div className="stat-label">Critical Priority</div>
          </div>
        </div>
        <div className="stat-card high">
          <div className="stat-icon">🟠</div>
          <div className="stat-info">
            <div className="stat-value">{stats.high}</div>
            <div className="stat-label">High Priority</div>
          </div>
        </div>
        <div className="stat-card resolved">
          <div className="stat-icon">✅</div>
          <div className="stat-info">
            <div className="stat-value">{stats.resolved}</div>
            <div className="stat-label">Resolved Incidents</div>
          </div>
        </div>
        <div className="stat-card affected">
          <div className="stat-icon">👥</div>
          <div className="stat-info">
            <div className="stat-value">{stats.totalAffected.toLocaleString()}</div>
            <div className="stat-label">Reported Casualties</div>
          </div>
        </div>
      </div>

      {/* Resource Bottleneck Alert Section */}
      <div className="bottleneck-collapsible-wrapper">
        <div className="bottleneck-toggle-header" onClick={() => setShowBottlenecks(!showBottlenecks)}>
          <div className="b-toggle-left">
            <span className="b-icon">📦</span>
            <span className="b-title">Resource Bottleneck Radar</span>
            {bottleneckData.hasBottlenecks ? (
              <span className="b-badge-alert">
                ⚠️ {bottleneckData.bottlenecks.length} Active Asset Competition Warning{bottleneckData.bottlenecks.length > 1 ? 's' : ''}
              </span>
            ) : (
              <span className="b-badge-ok">✓ Fleet Equilibrium</span>
            )}
          </div>
          <span className="b-toggle-arrow">{showBottlenecks ? '▲ Collapse' : '▼ Expand'}</span>
        </div>

        {showBottlenecks && (
          <div className="bottleneck-body-content fade-in">
            <BottleneckPanel
              incidents={incidents}
              onSelectIncident={handleSelectIncident}
            />
          </div>
        )}
      </div>

      {/* Main Operations Grid: Incident Feed on Left, Intelligence & Detail on Right */}
      <div className="dashboard-grid">
        <div className="dashboard-left-col">
          <IncidentTable
            incidents={incidents}
            selectedId={selectedIncident?.id}
            onSelect={handleSelectIncident}
          />
        </div>

        <div className="dashboard-right-col">
          <IncidentDetail
            incident={selectedIncident}
            allIncidents={incidents}
            onStatusChange={handleStatusChange}
            onSelectIncident={handleSelectIncident}
          />
        </div>
      </div>
    </div>
  );
}
