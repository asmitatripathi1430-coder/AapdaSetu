import React from 'react';
import { loadSpecificScenario, resetToDemo } from '../services/storage';

export default function ScenarioSelector({ currentScenario, onScenarioLoaded }) {
  function handleSelectScenario(scenarioId) {
    const updated = loadSpecificScenario(scenarioId);
    onScenarioLoaded && onScenarioLoaded(updated, scenarioId);
  }

  function handleReset() {
    if (!confirm('Reset all demo and scenario data to baseline? User-submitted reports will be cleared.')) return;
    const demos = resetToDemo();
    onScenarioLoaded && onScenarioLoaded(demos, 0);
  }

  return (
    <div className="scenario-selector-bar">
      <div className="scenario-bar-left">
        <span className="scenario-label">
          <span className="scenario-badge-pulse">●</span> Quick Demo Scenarios:
        </span>
        <div className="scenario-buttons">
          <button
            className={`btn-scenario ${currentScenario === 1 ? 'active' : ''}`}
            onClick={() => handleSelectScenario(1)}
            title="Load two flood reports in Pune with high similarity for SignalFusion deduplication"
          >
            🌊 Scenario 1: Related Flood Reports
          </button>
          <button
            className={`btn-scenario ${currentScenario === 2 ? 'active' : ''}`}
            onClick={() => handleSelectScenario(2)}
            title="Load two reports with conflicting casualty numbers (120 vs 8) to test conflict detection"
          >
            ⚠️ Scenario 2: Conflicting Evidence
          </button>
          <button
            className={`btn-scenario ${currentScenario === 3 ? 'active' : ''}`}
            onClick={() => handleSelectScenario(3)}
            title="Load multiple Critical incidents that contend for scarce Rescue Boats and Medical assets"
          >
            📦 Scenario 3: Resource Bottleneck
          </button>
          <button
            className={`btn-scenario ${currentScenario === 0 ? 'active' : ''}`}
            onClick={() => handleSelectScenario(0)}
            title="Reset to the 5 standard baseline incidents"
          >
            📋 Standard Baseline
          </button>
        </div>
      </div>

      <div className="scenario-bar-right">
        <button className="btn-reset-light" onClick={handleReset} title="Clear all local data and reload clean demo state">
          🔄 Factory Reset
        </button>
      </div>
    </div>
  );
}
