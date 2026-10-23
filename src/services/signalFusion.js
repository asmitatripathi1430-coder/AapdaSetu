/**
 * AapdaSetu AI — SignalFusion Service
 * 
 * Core Innovation:
 * 1. Related / Possible Duplicate Incident Detection
 *    - Normalized location, incident type, keyword similarity, and temporal proximity.
 *    - Transparent, deterministic similarity scoring (0 - 100%).
 *    - Explainable classifications: Possible Duplicate (>=70%), Related Incident (>=40%), or No Strong Match (<40%).
 *    - Cluster proposal count.
 *    - NEVER automatically merges, deletes, or suppresses incidents.
 * 2. Evidence and Uncertainty Analysis:
 *    - Field-by-field agreement vs. conflict detection (differing locations, conflicting casualty counts, trapped counts).
 *    - Flags missing timestamps, stale reports, and unverified reports.
 *    - Distinguishes reported information from responder-confirmed information.
 *    - Clearly explains why warnings are generated without fabricating certainty.
 * 3. Human Review & Persistence:
 *    - Confirm Related, Not Related, Needs Review actions saved to localStorage.
 */

const FUSION_DECISIONS_KEY = 'aapda_fusion_decisions';

// Common stop words to strip during keyword normalization
const STOP_WORDS = new Set([
  'the', 'is', 'at', 'which', 'on', 'a', 'an', 'and', 'or', 'in', 'near', 'to', 'for', 'of', 'with', 'from',
  'by', 'about', 'as', 'into', 'like', 'through', 'after', 'over', 'between', 'out', 'against', 'during',
  'before', 'under', 'around', 'among', 'some', 'please', 'need', 'urgent', 'help', 'area', 'due'
]);

/**
 * Normalize text by trimming, lowercasing, and stripping non-alphanumeric chars
 */
export function normalizeText(str) {
  if (!str) return '';
  return str
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Extract meaningful keyword tokens from text
 */
export function extractTokens(str) {
  const normalized = normalizeText(str);
  if (!normalized) return [];
  return normalized
    .split(' ')
    .filter(token => token.length > 2 && !STOP_WORDS.has(token));
}

/**
 * Compute Jaccard token overlap between two strings
 */
export function computeTokenOverlap(strA, strB) {
  const tokensA = new Set(extractTokens(strA));
  const tokensB = new Set(extractTokens(strB));
  if (tokensA.size === 0 || tokensB.size === 0) return { overlapRatio: 0, sharedTokens: [] };

  const intersection = [];
  tokensA.forEach(t => {
    if (tokensB.has(t)) intersection.push(t);
  });

  const unionSize = new Set([...tokensA, ...tokensB]).size;
  const overlapRatio = unionSize > 0 ? intersection.length / unionSize : 0;
  return { overlapRatio, sharedTokens: intersection };
}

/**
 * Normalize and compare locations
 * Detects whether locations share city/state or specific sub-localities (e.g. "Shivaji Nagar", "Pune")
 */
export function compareLocations(locA, locB) {
  const normA = normalizeText(locA);
  const normB = normalizeText(locB);

  if (!normA || !normB) {
    return { match: false, confidence: 0, reason: 'One or both locations missing' };
  }

  if (normA === normB) {
    return { match: true, exact: true, confidence: 1.0, reason: `Exact location match: "${locA}"` };
  }

  // Token matching for location parts (e.g. "Shivaji Nagar, Pune" vs "Shivaji Nagar Colony, Pune")
  const tokensA = extractTokens(locA);
  const tokensB = extractTokens(locB);
  const common = tokensA.filter(t => tokensB.includes(t));

  if (common.length >= 2) {
    return {
      match: true,
      exact: false,
      confidence: 0.85,
      sharedTokens: common,
      reason: `High location overlap in tokens [${common.join(', ')}]`
    };
  }

  if (common.length === 1 && (normA.includes(normB) || normB.includes(normA))) {
    return {
      match: true,
      exact: false,
      confidence: 0.65,
      sharedTokens: common,
      reason: `Shared regional locality: "${common[0]}"`
    };
  }

  return { match: false, confidence: 0, sharedTokens: common, reason: 'Distinct locations' };
}

/**
 * Compare two incidents and calculate similarity, evidence alignment, and conflict warnings
 */
export function compareIncidents(incidentA, incidentB) {
  if (!incidentA || !incidentB || incidentA.id === incidentB.id) return null;

  const reasons = [];
  const matchedFields = [];
  const conflictingFields = [];
  const evidenceWarnings = [];

  // 1. Disaster Type Comparison
  let typeScore = 0;
  if (incidentA.disasterType === incidentB.disasterType) {
    typeScore = 30; // 30 points max
    matchedFields.push({ field: 'Disaster Type', value: incidentA.disasterType, match: true });
    reasons.push(`Identical disaster category (${incidentA.disasterType})`);
  } else {
    conflictingFields.push({
      field: 'Disaster Type',
      valA: incidentA.disasterType,
      valB: incidentB.disasterType,
      severity: 'medium',
      reason: `Different reported incident types (${incidentA.disasterType} vs ${incidentB.disasterType})`
    });
  }

  // 2. Location Comparison
  const locComparison = compareLocations(incidentA.location, incidentB.location);
  let locScore = 0;
  if (locComparison.match) {
    locScore = locComparison.exact ? 40 : Math.round(locComparison.confidence * 35);
    matchedFields.push({
      field: 'Location',
      value: locComparison.exact ? incidentA.location : `Shared [${(locComparison.sharedTokens || []).join(', ')}]`,
      match: true
    });
    reasons.push(locComparison.reason);
  } else {
    conflictingFields.push({
      field: 'Location',
      valA: incidentA.location || 'Unknown',
      valB: incidentB.location || 'Unknown',
      severity: 'high',
      reason: `Geographic divergence: "${incidentA.location || 'None'}" vs "${incidentB.location || 'None'}"`
    });
  }

  // 3. Description & Keyword Overlap
  const descComparison = computeTokenOverlap(incidentA.description, incidentB.description);
  let descScore = Math.min(25, Math.round(descComparison.overlapRatio * 60));
  if (descComparison.sharedTokens.length > 0) {
    reasons.push(`Shared urgency terms: [${descComparison.sharedTokens.slice(0, 5).join(', ')}]`);
    matchedFields.push({
      field: 'Shared Keywords',
      value: descComparison.sharedTokens.slice(0, 5).join(', '),
      match: true
    });
  }

  // 4. Temporal Proximity
  let timeScore = 0;
  if (incidentA.createdAt && incidentB.createdAt) {
    const timeDiffMinutes = Math.abs(incidentA.createdAt - incidentB.createdAt) / (1000 * 60);
    if (timeDiffMinutes <= 60) {
      timeScore = 10;
      reasons.push(`Filed within ${Math.round(timeDiffMinutes)} minutes of each other`);
    } else if (timeDiffMinutes <= 360) {
      timeScore = 5;
      reasons.push(`Filed within ${Math.round(timeDiffMinutes / 60)} hours`);
    } else if (timeDiffMinutes > 1440) {
      evidenceWarnings.push(`Significant time gap (${Math.round(timeDiffMinutes / 1440)} days) between reports; situation may have evolved`);
    }
  } else {
    evidenceWarnings.push('Missing timestamp metadata on one or both records; temporal correlation cannot be established');
  }

  // 5. Conflicting Data Points Analysis (Evidence & Uncertainty)
  const countA = Number(incidentA.affectedCount) || 0;
  const countB = Number(incidentB.affectedCount) || 0;
  if (countA > 0 && countB > 0) {
    const diff = Math.abs(countA - countB);
    const maxVal = Math.max(countA, countB);
    if (diff > 10 && (diff / maxVal) > 0.4) {
      conflictingFields.push({
        field: 'Casualty / Affected Count',
        valA: `${countA} affected`,
        valB: `${countB} affected`,
        severity: 'high',
        reason: `Significant divergence in reported affected casualties (${countA} vs ${countB}). Requires field verification.`
      });
    } else {
      matchedFields.push({ field: 'Affected Scale', value: `Comparable numbers (~${Math.round((countA + countB)/2)})`, match: true });
    }
  } else if ((countA === 0 && countB > 20) || (countB === 0 && countA > 20)) {
    conflictingFields.push({
      field: 'Casualty / Affected Count',
      valA: countA > 0 ? `${countA} affected` : 'Not reported',
      valB: countB > 0 ? `${countB} affected` : 'Not reported',
      severity: 'medium',
      reason: 'One report indicates mass casualties while the other reports none or left it blank.'
    });
  }

  const trappedA = Number(incidentA.trappedInjured) || 0;
  const trappedB = Number(incidentB.trappedInjured) || 0;
  if ((trappedA > 0 && trappedB === 0) || (trappedB > 0 && trappedA === 0)) {
    conflictingFields.push({
      field: 'Trapped / Injured Persons',
      valA: `${trappedA} trapped`,
      valB: `${trappedB} trapped`,
      severity: 'high',
      reason: `Trapped persons reported in one source (${Math.max(trappedA, trappedB)}) but absent in the other.`
    });
  } else if (trappedA > 0 && trappedB > 0) {
    matchedFields.push({ field: 'Trapped/Injured Confirmation', value: `Both report trapped victims (${trappedA} & ${trappedB})`, match: true });
  }

  // Reporter Credibility & Verification Status
  if (!incidentA.reporterName || incidentA.reporterName.trim() === '') {
    evidenceWarnings.push(`Incident ${incidentA.id.slice(0, 8)} is an unverified anonymous report.`);
  }
  if (!incidentB.reporterName || incidentB.reporterName.trim() === '') {
    evidenceWarnings.push(`Incident ${incidentB.id.slice(0, 8)} is an unverified anonymous report.`);
  }

  // Calculate total composite similarity score (0 - 100)
  const totalScore = Math.min(100, typeScore + locScore + descScore + timeScore);

  let matchType = 'No Strong Match';
  if (totalScore >= 70 && locComparison.match && incidentA.disasterType === incidentB.disasterType) {
    matchType = 'Possible Duplicate';
  } else if (totalScore >= 40 || (locComparison.match && typeScore > 0)) {
    matchType = 'Related Incident';
  }

  return {
    targetIncidentId: incidentB.id,
    targetIncident: incidentB,
    similarityScore: totalScore,
    matchType,
    reasons,
    matchedFields,
    conflictingFields,
    evidenceWarnings,
    disclaimer: 'Algorithmic heuristic match. Does NOT constitute verified proof of duplicate identity. Manual responder confirmation required.'
  };
}

/**
 * Scan all other incidents in the system against a focal incident
 * Returns ranked matches with similarity, cluster suggestions, and conflict warnings
 */
export function analyzeIncidentFusion(focalIncident, allIncidents, customDecisions = null) {
  if (!focalIncident || !allIncidents || allIncidents.length <= 1) {
    return {
      candidates: [],
      proposedClusterCount: 1,
      hasConflicts: false,
      summary: 'No other incidents available for cross-correlation.'
    };
  }

  const decisions = customDecisions || loadFusionDecisions();
  const candidates = [];

  for (const other of allIncidents) {
    if (other.id === focalIncident.id) continue;
    const comparison = compareIncidents(focalIncident, other);
    if (!comparison) continue;

    // Attach existing human decision if any, default to 'unreviewed'
    const decisionKey = getDecisionKey(focalIncident.id, other.id);
    comparison.responderDecision = decisions[decisionKey] || 'unreviewed';

    // Filter to only meaningful relationships or strong matches
    if (comparison.similarityScore >= 35 || comparison.matchType !== 'No Strong Match') {
      candidates.push(comparison);
    }
  }

  // Sort by similarity score descending
  candidates.sort((a, b) => b.similarityScore - a.similarityScore);

  // Calculate proposed cluster count:
  // Focal incident (1) + candidates confirmed or (unreviewed/needs_review with significant similarity >= 50%)
  // Candidates explicitly marked 'rejected' are excluded from the proposed cluster
  const relatedCount = candidates.filter(c => {
    if (c.responderDecision === 'confirmed') return true;
    if (c.responderDecision === 'rejected') return false;
    return c.similarityScore >= 50;
  }).length;
  const proposedClusterCount = 1 + relatedCount;

  const totalConflicts = candidates.reduce((sum, c) => sum + c.conflictingFields.length, 0);

  return {
    focalIncidentId: focalIncident.id,
    candidates,
    proposedClusterCount,
    hasConflicts: totalConflicts > 0,
    totalConflicts,
    summary: candidates.length > 0
      ? `Detected ${candidates.length} candidate report${candidates.length > 1 ? 's' : ''} with shared geospatial or situational parameters.`
      : 'No related incidents or potential duplicates detected under current thresholds.'
  };
}

/**
 * Storage helpers for human review decisions
 */
function getDecisionKey(idA, idB) {
  return [idA, idB].sort().join('___');
}

export function loadFusionDecisions() {
  try {
    const raw = localStorage.getItem(FUSION_DECISIONS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveFusionDecision(idA, idB, decision) {
  try {
    const current = loadFusionDecisions();
    const key = getDecisionKey(idA, idB);
    current[key] = decision; // 'confirmed' | 'rejected' | 'pending'
    localStorage.setItem(FUSION_DECISIONS_KEY, JSON.stringify(current));
    return current;
  } catch {
    return {};
  }
}
