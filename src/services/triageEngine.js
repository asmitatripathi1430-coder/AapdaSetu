/**
 * AapdaSetu Triage Engine
 * A deterministic rule-based keyword and field analysis system.
 * This is NOT a trained ML model — it uses transparent keyword matching and scoring rules.
 */

const KEYWORD_WEIGHTS = {
  // Critical urgency keywords (+points)
  trapped: 25,
  drowning: 25,
  collapsed: 20,
  buried: 20,
  unconscious: 20,
  'not breathing': 25,
  cardiac: 25,
  'heart attack': 25,
  stroke: 20,
  critical: 15,
  fatal: 20,
  death: 20,
  died: 20,
  dying: 20,
  fire: 15,
  burning: 15,
  explosion: 20,

  // High urgency keywords
  injured: 12,
  bleeding: 12,
  fracture: 10,
  broken: 8,
  stranded: 10,
  missing: 8,
  urgent: 10,
  immediately: 10,
  sos: 20,
  help: 5,
  rescue: 8,
  emergency: 10,

  // Medium urgency keywords
  shelter: 5,
  food: 5,
  water: 5,
  'food shortage': 8,
  displaced: 6,
  flooded: 6,
  evacuate: 7,
  evacuation: 7,

  // Low / reducing keywords
  safe: -15,
  stable: -10,
  minor: -8,
  managed: -5,
  resolved: -10,
  'no injuries': -10,
};

const DISASTER_TYPE_BASE_SCORES = {
  Earthquake: 30,
  Flood: 25,
  Fire: 28,
  Medical: 35,
  Other: 10,
};

/**
 * Detect which keywords are present in the description text.
 */
function detectKeywords(text) {
  const lower = (text || '').toLowerCase();
  const found = [];
  for (const keyword of Object.keys(KEYWORD_WEIGHTS)) {
    if (lower.includes(keyword)) {
      found.push({ keyword, weight: KEYWORD_WEIGHTS[keyword] });
    }
  }
  return found;
}

/**
 * Determine missing information flags.
 */
function detectMissingInfo(report) {
  const flags = [];
  if (!report.location || report.location.trim().length < 3) {
    flags.push({ field: 'location', message: 'Location is missing or too vague. Dispatch may be delayed.' });
  }
  if (!report.affectedCount || isNaN(report.affectedCount) || Number(report.affectedCount) === 0) {
    flags.push({ field: 'affectedCount', message: 'Number of people affected is unknown or zero.' });
  }
  if (report.disasterType === 'Medical' && !report.description?.toLowerCase().match(/symptom|injury|condition|bleed|fracture|pain|unconscious|breathing|cardiac|stroke/)) {
    flags.push({ field: 'medicalDetail', message: 'Medical emergency reported but no clinical details provided.' });
  }
  if (!report.reporterName || report.reporterName.trim() === '') {
    flags.push({ field: 'reporterName', message: 'Reporter is anonymous — follow-up may be difficult.' });
  }
  return flags;
}

/**
 * Assign priority label from urgency score.
 */
function scoreToPriority(score) {
  if (score >= 75) return 'Critical';
  if (score >= 50) return 'High';
  if (score >= 25) return 'Medium';
  return 'Low';
}

/**
 * Main triage function.
 * @param {object} report - raw report object
 * @returns {object} triageResult
 */
export function triageReport(report) {
  const detectedKeywords = detectKeywords(report.description);
  const missingInfo = detectMissingInfo(report);

  // Base score from disaster type
  const baseScore = DISASTER_TYPE_BASE_SCORES[report.disasterType] || 10;

  // Keyword score
  const keywordScore = detectedKeywords.reduce((sum, k) => sum + k.weight, 0);

  // Affected count bonus
  const affected = Number(report.affectedCount) || 0;
  let affectedBonus = 0;
  if (affected >= 100) affectedBonus = 20;
  else if (affected >= 50) affectedBonus = 15;
  else if (affected >= 20) affectedBonus = 10;
  else if (affected >= 5) affectedBonus = 5;
  else if (affected >= 1) affectedBonus = 2;

  // Trapped/injured count bonus
  const trappedInjured = Number(report.trappedInjured) || 0;
  let trappedBonus = 0;
  if (trappedInjured >= 20) trappedBonus = 20;
  else if (trappedInjured >= 10) trappedBonus = 15;
  else if (trappedInjured >= 5) trappedBonus = 10;
  else if (trappedInjured >= 1) trappedBonus = 8;

  // Missing info penalty
  const missingPenalty = missingInfo.filter(f => f.field !== 'reporterName').length * 3;

  // Compute raw score
  let rawScore = baseScore + keywordScore + affectedBonus + trappedBonus - missingPenalty;

  // Clamp to 0–100
  const urgencyScore = Math.max(0, Math.min(100, rawScore));

  const priority = scoreToPriority(urgencyScore);

  // Build explanation
  const explanationParts = [];
  explanationParts.push(`Base score for ${report.disasterType}: ${baseScore}`);
  if (detectedKeywords.length > 0) {
    const posKeywords = detectedKeywords.filter(k => k.weight > 0).map(k => `"${k.keyword}" (+${k.weight})`);
    const negKeywords = detectedKeywords.filter(k => k.weight < 0).map(k => `"${k.keyword}" (${k.weight})`);
    if (posKeywords.length > 0) explanationParts.push(`Urgency keywords detected: ${posKeywords.join(', ')}`);
    if (negKeywords.length > 0) explanationParts.push(`Mitigating keywords: ${negKeywords.join(', ')}`);
  } else {
    explanationParts.push('No urgency keywords detected in description.');
  }
  if (affectedBonus > 0) explanationParts.push(`${affected} people affected (+${affectedBonus})`);
  if (trappedBonus > 0) explanationParts.push(`${trappedInjured} people trapped/injured (+${trappedBonus})`);
  if (missingPenalty > 0) explanationParts.push(`Missing info penalty: -${missingPenalty}`);

  return {
    urgencyScore,
    priority,
    detectedKeywords: detectedKeywords.map(k => k.keyword),
    missingInfo,
    explanation: explanationParts.join(' | '),
    scoreBreakdown: { baseScore, keywordScore, affectedBonus, trappedBonus, missingPenalty },
  };
}
