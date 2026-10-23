import React, { useState, useMemo } from 'react';
import { PriorityBadge, StatusBadge, ScoreBar, timeAgo } from './Shared';

const DISASTER_ICONS = {
  Flood: '🌊', Earthquake: '🏚', Medical: '🏥', Fire: '🔥', Other: '📌'
};

const PRIORITY_ORDER = { Critical: 0, High: 1, Medium: 2, Low: 3 };

export default function IncidentTable({ incidents, selectedId, onSelect }) {
  const [search, setSearch] = useState('');
  const [filterPriority, setFilterPriority] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterType, setFilterType] = useState('All');
  const [sortField, setSortField] = useState('urgency');
  const [sortAsc, setSortAsc] = useState(false);

  function handleSort(field) {
    if (sortField === field) setSortAsc(a => !a);
    else { setSortField(field); setSortAsc(false); }
  }

  const filtered = useMemo(() => {
    let list = [...incidents];

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(i =>
        i.location?.toLowerCase().includes(q) ||
        i.description?.toLowerCase().includes(q) ||
        i.reporterName?.toLowerCase().includes(q) ||
        i.disasterType?.toLowerCase().includes(q)
      );
    }

    if (filterPriority !== 'All') list = list.filter(i => i.triage?.priority === filterPriority);
    if (filterStatus !== 'All') list = list.filter(i => i.status === filterStatus);
    if (filterType !== 'All') list = list.filter(i => i.disasterType === filterType);

    list.sort((a, b) => {
      let cmp = 0;
      if (sortField === 'urgency') cmp = (b.triage?.urgencyScore || 0) - (a.triage?.urgencyScore || 0);
      else if (sortField === 'priority') cmp = PRIORITY_ORDER[a.triage?.priority] - PRIORITY_ORDER[b.triage?.priority];
      else if (sortField === 'time') cmp = b.createdAt - a.createdAt;
      else if (sortField === 'affected') cmp = (b.affectedCount || 0) - (a.affectedCount || 0);
      return sortAsc ? -cmp : cmp;
    });

    return list;
  }, [incidents, search, filterPriority, filterStatus, filterType, sortField, sortAsc]);

  function SortIcon({ field }) {
    if (sortField !== field) return <span style={{ color: 'var(--color-text-dim)' }}> ↕</span>;
    return <span style={{ color: 'var(--color-primary-light)' }}>{sortAsc ? ' ↑' : ' ↓'}</span>;
  }

  return (
    <div className="panel">
      <div className="panel-header">
        <span className="panel-title"><span className="icon">📊</span> Incident Feed</span>
        <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{filtered.length} / {incidents.length} incidents</span>
      </div>

      {/* Filters */}
      <div className="filters-row">
        <input
          id="incident-search"
          className="search-input"
          placeholder="🔍 Search by location, description, type..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select className="filter-select" value={filterPriority} onChange={e => setFilterPriority(e.target.value)} id="filter-priority">
          <option value="All">All Priorities</option>
          <option value="Critical">Critical</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>
        <select className="filter-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)} id="filter-status">
          <option value="All">All Statuses</option>
          <option value="New">New</option>
          <option value="Assigned">Assigned</option>
          <option value="In Progress">In Progress</option>
          <option value="Resolved">Resolved</option>
        </select>
        <select className="filter-select" value={filterType} onChange={e => setFilterType(e.target.value)} id="filter-type">
          <option value="All">All Types</option>
          <option value="Flood">Flood</option>
          <option value="Earthquake">Earthquake</option>
          <option value="Medical">Medical</option>
          <option value="Fire">Fire</option>
          <option value="Other">Other</option>
        </select>
      </div>

      <div className="incident-table-wrap">
        {filtered.length === 0 ? (
          <div className="empty-state">No incidents match your filters.</div>
        ) : (
          <table className="incident-table">
            <thead>
              <tr>
                <th onClick={() => handleSort('time')}>Time<SortIcon field="time" /></th>
                <th>Type</th>
                <th>Location & Description</th>
                <th onClick={() => handleSort('urgency')}>Score<SortIcon field="urgency" /></th>
                <th onClick={() => handleSort('priority')}>Priority<SortIcon field="priority" /></th>
                <th onClick={() => handleSort('affected')}>Affected<SortIcon field="affected" /></th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(incident => (
                <tr
                  key={incident.id}
                  className={`incident-row ${incident.isDemo ? 'demo-row' : ''} ${selectedId === incident.id ? 'selected' : ''}`}
                  onClick={() => onSelect(incident)}
                >
                  <td style={{ whiteSpace: 'nowrap', fontSize: 12, color: 'var(--color-text-muted)' }}>
                    {timeAgo(incident.createdAt)}
                  </td>
                  <td style={{ whiteSpace: 'nowrap', fontSize: 15 }}>
                    <span title={incident.disasterType}>{DISASTER_ICONS[incident.disasterType]}</span>
                    {incident.isDemo && <span className="demo-tag">DEMO</span>}
                  </td>
                  <td>
                    <div style={{ fontWeight: 500, fontSize: 13, color: 'var(--color-text)', marginBottom: 2 }}>
                      📍 {incident.location}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 260 }}>
                      {incident.description.slice(0, 80)}{incident.description.length > 80 ? '…' : ''}
                    </div>
                  </td>
                  <td>
                    <ScoreBar score={incident.triage?.urgencyScore || 0} priority={incident.triage?.priority} />
                  </td>
                  <td>
                    <PriorityBadge priority={incident.triage?.priority || 'Low'} />
                  </td>
                  <td style={{ fontSize: 13, fontWeight: 500, color: incident.affectedCount >= 50 ? 'var(--color-critical)' : 'var(--color-text)' }}>
                    {incident.affectedCount > 0 ? incident.affectedCount.toLocaleString() : '—'}
                    {incident.trappedInjured > 0 && (
                      <div style={{ fontSize: 11, color: 'var(--color-high)' }}>⚠ {incident.trappedInjured} trapped</div>
                    )}
                  </td>
                  <td>
                    <StatusBadge status={incident.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
