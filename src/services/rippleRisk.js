/**
 * AapdaSetu AI — RippleRisk Service
 * 
 * Core Innovation:
 * - Transparent, rule-based secondary-risk suggestions.
 * - Triggers ONLY when structured incident fields or description text substantiate the rule.
 * - Shows the exact textual evidence and deterministic rule behind each alert.
 * - Clearly labeled: "Heuristic Suggestion — Verify Before Action".
 * - Never claims to be an ML model or guaranteed predictive forecast.
 * - Does NOT alter the incident's primary triage severity score.
 * - Responder review workflow: Reviewed, Accepted, Dismissed (persisted in localStorage).
 */

const RIPPLERISK_DECISIONS_KEY = 'aapda_ripplerisk_decisions';

export const RIPPLERISK_RULES = [
  {
    id: 'RR-FLD-01',
    name: 'Inundation Ingress & Evacuation Cutoff',
    category: 'Evacuation & Access',
    appliesTo: (incident) => {
      if (incident.disasterType !== 'Flood') return null;
      const text = (incident.description || '').toLowerCase();
      const triggers = ['low-lying', 'rising', 'submerged', 'water level', 'flash flood', 'overflow'];
      const matched = triggers.filter(w => text.includes(w));
      if (matched.length > 0) {
        return {
          evidence: `Incident description indicates water ingress factors: [${matched.join(', ')}] in ${incident.location}.`,
          triggers: matched,
        };
      }
      return null;
    },
    riskStatement: 'Rapid inundation of arterial roads may isolate neighborhoods within 2-4 hours, stranding vehicles and severing ground ambulance routes.',
    actionChecklist: [
      'Identify and designate high-ground egress corridors before water reaches critical depth',
      'Request State Electricity Board de-energize low-lying transformer sub-stations to prevent electrocution hazards',
      'Pre-stage shallow-draft rescue rafts at periphery of inundation perimeter'
    ]
  },
  {
    id: 'RR-FLD-02',
    name: 'Stranded Isolation & Dehydration Cascade',
    category: 'Relief & Life Support',
    appliesTo: (incident) => {
      if (incident.disasterType !== 'Flood') return null;
      const text = (incident.description || '').toLowerCase();
      const triggers = ['rooftop', 'terrace', 'stranded', 'trapped', 'food shortage', 'drinking water'];
      const matched = triggers.filter(w => text.includes(w));
      const hasTrapped = (Number(incident.trappedInjured) > 0);
      if (matched.length > 0 || hasTrapped) {
        return {
          evidence: `Report specifies stranded civilians (${incident.trappedInjured || 'multiple'} trapped) with markers: [${matched.join(', ')}].`,
          triggers: matched,
        };
      }
      return null;
    },
    riskStatement: 'Stranded populations on rooftops or upper floors face acute waterborne illness risk, sunstroke/exposure, and lack of potable water within 12 hours.',
    actionChecklist: [
      'Prioritize potable drinking water jerry-can air-drops or boat delivery',
      'Package water purification halogen tablets with emergency rations',
      'Establish visual signal protocol with rooftop survivors awaiting boat evacuation'
    ]
  },
  {
    id: 'RR-COL-01',
    name: 'Secondary Structural Collapse & Crush Syndrome',
    category: 'Search, Rescue & Trauma',
    appliesTo: (incident) => {
      if (incident.disasterType !== 'Earthquake') return null;
      const text = (incident.description || '').toLowerCase();
      const triggers = ['collapsed', 'rubble', 'buried', 'tremor', 'unconscious', 'aftershock'];
      const matched = triggers.filter(w => text.includes(w));
      const hasTrapped = (Number(incident.trappedInjured) > 0);
      if (matched.length > 0 || hasTrapped) {
        return {
          evidence: `Earthquake impact with ${incident.trappedInjured || 'multiple'} victims trapped/buried and keywords: [${matched.join(', ')}].`,
          triggers: matched,
        };
      }
      return null;
    },
    riskStatement: 'Structural stability is compromised. Aftershocks risk secondary progressive collapse. Buried victims subject to prolonged entrapment face fatal crush syndrome upon sudden decompression.',
    actionChecklist: [
      'Deploy shoring timbers and structural stabilization acoustic sensors prior to deep void entry',
      'Mandate intravenous normal saline infusion pre-extrication by field paramedics for crush-injury victims',
      'Coordinate with Gas Authority to isolate municipal gas valves within 150m radius'
    ]
  },
  {
    id: 'RR-MED-01',
    name: 'Primary Healthcare Saturation & Surge Contagion',
    category: 'Healthcare Capacity',
    appliesTo: (incident) => {
      if (incident.disasterType !== 'Medical') return null;
      const affected = Number(incident.affectedCount) || 0;
      const text = (incident.description || '').toLowerCase();
      const triggers = ['outbreak', 'poisoning', 'vomiting', 'fever', 'overwhelmed', 'symptom'];
      const matched = triggers.filter(w => text.includes(w));
      if (affected >= 20 || matched.length > 0) {
        return {
          evidence: `Mass medical event with ${affected} affected individuals and clinical descriptors: [${matched.join(', ')}].`,
          triggers: matched,
        };
      }
      return null;
    },
    riskStatement: 'Rapid patient influx threatens to saturate local secondary clinic bed capacity and exhaust IV rehydration fluids, creating an ambulance transport bottleneck.',
    actionChecklist: [
      'Erect emergency triage cohort canopy at facility entrance to stream mild vs severe cases',
      'Requisition 100+ units of Ringer Lactate / IV electrolytes from district medical store',
      'Alert tertiary referral hospital for pediatric / critical ICU bed reservations'
    ]
  },
  {
    id: 'RR-FIR-01',
    name: 'Toxic Pyrolysis Plume & Adjacent Structure Flashover',
    category: 'Hazardous Materials & Containment',
    appliesTo: (incident) => {
      if (incident.disasterType !== 'Fire') return null;
      const text = (incident.description || '').toLowerCase();
      const triggers = ['burning', 'smoke', 'explosion', 'flames', 'blaze', 'chemical'];
      const matched = triggers.filter(w => text.includes(w));
      return {
        evidence: `Active fire incident reported with descriptors: [${matched.length ? matched.join(', ') : 'thermal threat'}] in ${incident.location}.`,
        triggers: matched,
      };
    },
    riskStatement: 'Downwind dispersion of carbon monoxide and hydrogen cyanide smoke creates severe respiratory inhalation risk for residents within a 300m envelope.',
    actionChecklist: [
      'Establish immediate downwind exclusion and evacuation cordon of minimum 250 meters',
      'Request water utility increase line pressure to district hydrants; stage municipal water tankers',
      'Alert nearest burn unit for emergency intake preparation'
    ]
  },
  {
    id: 'RR-REG-01',
    name: 'Regional Multi-Incident Resource Depletion',
    category: 'Jurisdictional Strain',
    appliesTo: (incident, allIncidents) => {
      if (!allIncidents || allIncidents.length < 2) return null;
      const loc = (incident.location || '').toLowerCase();
      const tokens = loc.split(/[,\s]+/).filter(t => t.length > 3);
      if (tokens.length === 0) return null;

      const sameRegion = allIncidents.filter(other => {
        if (other.id === incident.id) return false;
        const otherLoc = (other.location || '').toLowerCase();
        return tokens.some(t => otherLoc.includes(t));
      });

      if (sameRegion.length >= 1) {
        return {
          evidence: `Concurrent active incidents detected in same administrative district (${tokens[0]}): ${sameRegion.length + 1} incidents overlapping.`,
          triggers: tokens,
        };
      }
      return null;
    },
    riskStatement: 'Local emergency services in this administrative district are handling multiple concurrent calls, elevating mutual aid response lag.',
    actionChecklist: [
      'Notify State Disaster Management Authority (SDMA) for inter-district resource readiness',
      'Consolidate radio dispatch channels to prevent frequency congestion'
    ]
  }
];

/**
 * Generate RippleRisk heuristic suggestions for an incident
 */
export function analyzeRippleRisks(incident, allIncidents = []) {
  if (!incident) return [];

  const decisions = loadRippleDecisions();
  const results = [];

  for (const rule of RIPPLERISK_RULES) {
    const match = rule.appliesTo(incident, allIncidents);
    if (match) {
      const decisionKey = `${incident.id}___${rule.id}`;
      const status = decisions[decisionKey] || 'Unreviewed'; // 'Unreviewed' | 'Reviewed' | 'Accepted' | 'Dismissed'

      results.push({
        ruleId: rule.id,
        ruleName: rule.name,
        category: rule.category,
        evidence: match.evidence,
        riskStatement: rule.riskStatement,
        actionChecklist: rule.actionChecklist,
        status,
        label: 'Heuristic Suggestion — Verify Before Action',
        disclaimer: 'Deterministic rule-based inference derived from reported incident parameters. Not a guaranteed forecast. Field assessment required.'
      });
    }
  }

  return results;
}

/**
 * Persistence for RippleRisk responder decisions
 */
export function loadRippleDecisions() {
  try {
    const raw = localStorage.getItem(RIPPLERISK_DECISIONS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveRippleDecision(incidentId, ruleId, status) {
  try {
    const current = loadRippleDecisions();
    const key = `${incidentId}___${ruleId}`;
    current[key] = status; // 'Reviewed' | 'Accepted' | 'Dismissed'
    localStorage.setItem(RIPPLERISK_DECISIONS_KEY, JSON.stringify(current));
    return current;
  } catch {
    return {};
  }
}
