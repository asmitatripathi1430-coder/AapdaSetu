import React from 'react';

const PRIORITY_ICONS = { Critical: '🔴', High: '🟠', Medium: '🟡', Low: '🟢' };
const STATUS_ICONS = { New: '🔵', Assigned: '🟣', 'In Progress': '🟠', Resolved: '✅' };

export function PriorityBadge({ priority }) {
  return (
    <span className={`priority-badge ${priority}`}>
      {PRIORITY_ICONS[priority]} {priority}
    </span>
  );
}

export function StatusBadge({ status }) {
  const cls = status.replace(' ', '-');
  return (
    <span className={`status-badge ${cls}`}>
      {STATUS_ICONS[status]} {status}
    </span>
  );
}

export function ScoreBar({ score, priority }) {
  const colors = { Critical: '#ef4444', High: '#f97316', Medium: '#eab308', Low: '#22c55e' };
  const color = colors[priority] || '#3b82f6';
  return (
    <div className="score-bar-wrap">
      <div className="score-bar-track">
        <div className="score-bar-fill" style={{ width: `${score}%`, background: color }} />
      </div>
      <span className="score-value" style={{ color }}>{score}</span>
    </div>
  );
}

export function UrgencyDisplay({ triage }) {
  if (!triage) return null;
  const colors = { Critical: '#ef4444', High: '#f97316', Medium: '#eab308', Low: '#22c55e' };
  const color = colors[triage.priority] || '#3b82f6';

  return (
    <div className="urgency-display">
      <div className="urgency-header">
        <span className="urgency-label">Urgency Score</span>
        <span className="urgency-score-number" style={{ color }}>{triage.urgencyScore}/100</span>
      </div>
      <div className="urgency-track">
        <div className="urgency-fill" style={{ width: `${triage.urgencyScore}%`, background: `linear-gradient(90deg, ${color}99, ${color})` }} />
      </div>
      <div className="urgency-explanation">
        <strong>Analysis: </strong>
        {triage.explanation.split(' | ').map((part, i) => (
          <span key={i}>{part}{i < triage.explanation.split(' | ').length - 1 ? ' · ' : ''}</span>
        ))}
      </div>
      {triage.detectedKeywords.length > 0 && (
        <div className="keywords-row">
          {triage.detectedKeywords.map(kw => (
            <span key={kw} className="keyword-chip">⚠ {kw}</span>
          ))}
        </div>
      )}
    </div>
  );
}

export function MissingInfoList({ missingInfo }) {
  if (!missingInfo || missingInfo.length === 0) return null;
  return (
    <div>
      <div className="section-heading">⚠ Missing Information</div>
      <div className="missing-info-list">
        {missingInfo.map((item) => (
          <div key={item.field} className="missing-item">
            <span className="missing-icon">⚠️</span>
            <span>{item.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function formatDate(ts) {
  if (!ts) return '—';
  const d = new Date(ts);
  return d.toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' });
}

export function timeAgo(ts) {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}
