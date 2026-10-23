/**
 * AapdaSetu AI — Resource Bottleneck Detector Service
 * 
 * Core Innovation:
 * - Scans all active high-priority incidents (Critical & High) and models their concurrent resource demands.
 * - Cross-references live inventory from `loadInventory()`.
 * - Flags severe deficits (Demand > Stock) and capacity saturation (Demand == Stock with 0 contingency).
 * - Identifies specific competing incidents, available units, root cause reasons, trade-offs, and viable alternatives.
 * - Enforces zero automated allocation — human commander approval required.
 */

import { loadInventory } from './resourceMatcher';

export function detectResourceBottlenecks(allIncidents, customInventory = null) {
  const inventory = customInventory || loadInventory();
  if (!allIncidents || allIncidents.length === 0) {
    return { bottlenecks: [], hasBottlenecks: false, summary: 'No active incidents to analyze for resource competition.' };
  }

  // Filter to active high-priority incidents needing immediate operational resources
  const activeUrgentIncidents = allIncidents.filter(inc => 
    inc.status !== 'Resolved' &&
    (inc.triage?.priority === 'Critical' || inc.triage?.priority === 'High' || inc.triage?.urgencyScore >= 50)
  );

  if (activeUrgentIncidents.length === 0) {
    return {
      bottlenecks: [],
      hasBottlenecks: false,
      summary: 'No active Critical or High priority incidents competing for critical assets.'
    };
  }

  // Map demand by resource type across active urgent incidents
  // e.g. Rescue Boat needed by Flood incidents with high score
  const demandMap = {};

  activeUrgentIncidents.forEach(inc => {
    const { disasterType, triage, affectedCount, trappedInjured } = inc;
    const score = triage?.urgencyScore || 0;

    // Determine what resource types this incident requires
    const neededTypes = [];

    if (disasterType === 'Flood') {
      neededTypes.push({ type: 'Rescue Boat', unitsNeeded: trappedInjured > 10 ? 2 : 1, priority: triage?.priority });
      neededTypes.push({ type: 'Rescue Personnel', unitsNeeded: 1, priority: triage?.priority });
      if (affectedCount > 50) {
        neededTypes.push({ type: 'Food Kit', unitsNeeded: 50, priority: triage?.priority });
        neededTypes.push({ type: 'Drinking Water', unitsNeeded: 2, priority: triage?.priority });
      }
    } else if (disasterType === 'Earthquake') {
      neededTypes.push({ type: 'Rescue Personnel', unitsNeeded: 2, priority: triage?.priority });
      neededTypes.push({ type: 'Medical Team', unitsNeeded: 1, priority: triage?.priority });
      neededTypes.push({ type: 'Ambulance', unitsNeeded: 2, priority: triage?.priority });
    } else if (disasterType === 'Medical') {
      neededTypes.push({ type: 'Medical Team', unitsNeeded: 1, priority: triage?.priority });
      neededTypes.push({ type: 'Ambulance', unitsNeeded: affectedCount > 40 ? 3 : 2, priority: triage?.priority });
    } else if (disasterType === 'Fire') {
      neededTypes.push({ type: 'Fire Truck', unitsNeeded: 2, priority: triage?.priority });
      neededTypes.push({ type: 'Medical Team', unitsNeeded: 1, priority: triage?.priority });
    }

    neededTypes.forEach(req => {
      if (!demandMap[req.type]) {
        demandMap[req.type] = {
          resourceType: req.type,
          competingIncidents: [],
          totalDemanded: 0,
        };
      }
      demandMap[req.type].competingIncidents.push({
        id: inc.id,
        location: inc.location,
        disasterType: inc.disasterType,
        priority: inc.triage?.priority,
        urgencyScore: score,
        demandedUnits: req.unitsNeeded,
        trappedInjured: inc.trappedInjured || 0
      });
      demandMap[req.type].totalDemanded += req.unitsNeeded;
    });
  });

  const bottlenecks = [];

  // Cross-reference demand with actual inventory availability
  Object.keys(demandMap).forEach(resType => {
    const demand = demandMap[resType];
    // Find all inventory items matching this type
    const matchingItems = inventory.filter(item => item.type === resType);
    const totalAvailable = matchingItems.reduce((sum, item) => sum + (item.available || 0), 0);
    const totalCapacity = matchingItems.reduce((sum, item) => sum + (item.quantity || 0), 0);

    // Conflict triggered when:
    // 1. Multiple incidents compete for the same resource AND
    // 2. Total demanded >= available OR total available is critically low (<= 1)
    const isMultipleIncidents = demand.competingIncidents.length >= 2;
    const isDeficit = demand.totalDemanded > totalAvailable;
    const isStrained = demand.totalDemanded === totalAvailable || totalAvailable <= 1;

    if (isMultipleIncidents && (isDeficit || isStrained)) {
      const deficitCount = Math.max(0, demand.totalDemanded - totalAvailable);
      const severity = isDeficit ? 'Critical Deficit' : 'Capacity Saturated';

      // Build trade-off and alternative advice
      let tradeOffAnalysis = '';
      let alternativeSuggestions = [];

      if (resType === 'Rescue Boat') {
        tradeOffAnalysis = `Multiple waterborne rescues competing for ${totalAvailable} available vessel(s). Allocating to one sector leaves the other unserved.`;
        alternativeSuggestions = [
          'Prioritize sectors with confirmed roof entrapments (e.g., immediate drowning risk)',
          'Mobilize NDRF inflatable motorized Zodiac rafts from regional battalion depot',
          'Deploy local fishing cooperative trawlers as auxiliary shallow-draft transport'
        ];
      } else if (resType === 'Medical Team') {
        tradeOffAnalysis = `Mass casualty/trauma incidents in separate jurisdictions both request dedicated on-site physician teams (Available: ${totalAvailable}).`;
        alternativeSuggestions = [
          'Deploy advanced paramedical ambulance triage teams to stabilize field patients while physician team handles highest-urgency site',
          'Coordinate tele-medicine triage link with Civil Hospital trauma board',
          'Activate Indian Red Cross Society local volunteer medical wing'
        ];
      } else if (resType === 'Rescue Personnel') {
        tradeOffAnalysis = `NDRF specialized personnel demanded across multiple collapsed/flooded zones (Available: ${totalAvailable} personnel).`;
        alternativeSuggestions = [
          'Split squad into two rapid extrication reconnaissance teams',
          'Request Home Guard and Civil Defence volunteer augmentation for crowd and perimeter control'
        ];
      } else if (resType === 'Ambulance') {
        tradeOffAnalysis = `High concurrent transit demand for hospital transfers (${demand.totalDemanded} vehicles needed, ${totalAvailable} on duty).`;
        alternativeSuggestions = [
          'Implement rapid-turnaround transfer protocol at designated receiving hospital',
          'Requisition public transport minibuses for walking-wounded / non-ambulatory triage staging'
        ];
      } else {
        tradeOffAnalysis = `Concurrent demand (${demand.totalDemanded}) exceeds or exhausts ready reserve (${totalAvailable}).`;
        alternativeSuggestions = ['Request emergency replenishment dispatch from State Central Relief Store'];
      }

      bottlenecks.push({
        id: `BN-${resType.replace(/\s+/g, '-').toUpperCase()}`,
        resourceType: resType,
        severity,
        totalAvailable,
        totalCapacity,
        totalDemanded: demand.totalDemanded,
        deficitCount,
        competingIncidents: demand.competingIncidents,
        depots: matchingItems.map(m => `${m.name} (${m.available}/${m.quantity} at ${m.location})`),
        reason: `${demand.competingIncidents.length} active emergency incidents are simultaneously contending for ${resType}. Total demand is ${demand.totalDemanded} units, but only ${totalAvailable} unit(s) are currently available in the regional inventory.`,
        tradeOffAnalysis,
        alternativeSuggestions,
        disclaimer: 'Advisory alert based on active incident parameters and recorded inventory. Requires explicit responder approval; no resources are withheld or dispatched automatically.'
      });
    }
  });

  return {
    bottlenecks,
    hasBottlenecks: bottlenecks.length > 0,
    totalCriticalDeficits: bottlenecks.filter(b => b.severity === 'Critical Deficit').length,
    summary: bottlenecks.length > 0
      ? `Detected ${bottlenecks.length} resource bottleneck${bottlenecks.length > 1 ? 's' : ''} across concurrent active incidents.`
      : 'All operational resource demands currently fall within available inventory capacity.'
  };
}
