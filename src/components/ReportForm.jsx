import React, { useState } from 'react';
import { addIncident } from '../services/storage';
import { PriorityBadge, ScoreBar } from './Shared';

const DISASTER_TYPES = ['Flood', 'Earthquake', 'Medical', 'Fire', 'Other'];

const INITIAL_FORM = {
  reporterName: '',
  description: '',
  disasterType: 'Flood',
  location: '',
  affectedCount: '',
  trappedInjured: '',
};

export default function ReportForm({ onSubmitted }) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(null);

  function validate() {
    const errs = {};
    if (!form.description.trim()) errs.description = 'Emergency description is required.';
    if (!form.location.trim()) errs.location = 'Location is required.';
    return errs;
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
    if (errors[name]) setErrors(e => ({ ...e, [name]: undefined }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    const incident = addIncident({
      ...form,
      affectedCount: Number(form.affectedCount) || 0,
      trappedInjured: Number(form.trappedInjured) || 0,
    });

    setSubmitted(incident);
    setForm(INITIAL_FORM);
    setErrors({});
    onSubmitted && onSubmitted(incident);
  }

  return (
    <div className="form-page">
      <div className="form-header">
        <h2>🚨 Submit Emergency Report</h2>
        <p>Complete this form to submit an emergency incident. Triage scoring will be performed automatically.</p>
      </div>

      {submitted && (
        <div className="success-banner fade-in">
          <div className="success-icon">✅</div>
          <div>
            <div className="success-title">Report Submitted Successfully</div>
            <div className="success-body">
              Incident ID: <code style={{background:'rgba(99,161,255,0.1)',padding:'2px 6px',borderRadius:4,fontSize:12}}>{submitted.id.slice(0,8).toUpperCase()}</code>
              &nbsp;·&nbsp; Location: {submitted.location}
            </div>
            <div className="success-triage">
              <PriorityBadge priority={submitted.triage.priority} />
              <ScoreBar score={submitted.triage.urgencyScore} priority={submitted.triage.priority} />
              <span style={{fontSize:12,color:'var(--color-text-muted)'}}>
                {submitted.triage.detectedKeywords.length > 0
                  ? `Keywords: ${submitted.triage.detectedKeywords.join(', ')}`
                  : 'No urgency keywords detected'}
              </span>
            </div>
          </div>
        </div>
      )}

      <form className="form-panel" onSubmit={handleSubmit}>
        <div className="form-grid">
          {/* Reporter Name */}
          <div className="form-group">
            <label className="form-label">Reporter Name <span style={{color:'var(--color-text-dim)',fontWeight:400}}>(optional)</span></label>
            <input
              id="reporterName"
              name="reporterName"
              type="text"
              className="form-input"
              placeholder="Your name (anonymous if left blank)"
              value={form.reporterName}
              onChange={handleChange}
            />
          </div>

          {/* Disaster Type */}
          <div className="form-group">
            <label className="form-label">Disaster Type <span className="required">*</span></label>
            <select
              id="disasterType"
              name="disasterType"
              className="form-select"
              value={form.disasterType}
              onChange={handleChange}
            >
              {DISASTER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          {/* Location */}
          <div className="form-group full">
            <label className="form-label">Location <span className="required">*</span></label>
            <input
              id="location"
              name="location"
              type="text"
              className={`form-input ${errors.location ? 'error' : ''}`}
              placeholder="e.g. Shivaji Nagar, Pune, Maharashtra"
              value={form.location}
              onChange={handleChange}
              style={errors.location ? {borderColor:'var(--color-critical)'} : {}}
            />
            {errors.location && <span style={{fontSize:12,color:'var(--color-critical)'}}>{errors.location}</span>}
          </div>

          {/* Description */}
          <div className="form-group full">
            <label className="form-label">Emergency Description <span className="required">*</span></label>
            <textarea
              id="description"
              name="description"
              className="form-textarea"
              placeholder="Describe the emergency. Include details like injuries, trapped persons, ongoing threats, conditions..."
              value={form.description}
              onChange={handleChange}
              style={errors.description ? {borderColor:'var(--color-critical)'} : {}}
              rows={4}
            />
            {errors.description && <span style={{fontSize:12,color:'var(--color-critical)'}}>{errors.description}</span>}
          </div>

          {/* Affected Count */}
          <div className="form-group">
            <label className="form-label">People Affected</label>
            <input
              id="affectedCount"
              name="affectedCount"
              type="number"
              min="0"
              className="form-input"
              placeholder="Estimated number"
              value={form.affectedCount}
              onChange={handleChange}
            />
          </div>

          {/* Trapped/Injured */}
          <div className="form-group">
            <label className="form-label">People Trapped / Injured</label>
            <input
              id="trappedInjured"
              name="trappedInjured"
              type="number"
              min="0"
              className="form-input"
              placeholder="Number trapped or injured"
              value={form.trappedInjured}
              onChange={handleChange}
            />
          </div>
        </div>

        <button type="submit" className="submit-btn" style={{marginTop:24}}>
          🚨 Submit Emergency Report
        </button>
      </form>
    </div>
  );
}
