/**
 * AapdaSetu Resource Matcher
 * Recommends resources based on incident type, urgency, and availability.
 * Resources are NEVER auto-dispatched — responder approval is required.
 */

export const INITIAL_INVENTORY = [
  { id: 'RB-01', type: 'Rescue Boat', name: 'Rescue Boat Alpha', quantity: 3, available: 2, unit: 'boats', location: 'Mumbai Port', categories: ['Flood'], minUrgency: 30 },
  { id: 'RB-02', type: 'Rescue Boat', name: 'Rescue Boat Beta', quantity: 2, available: 2, unit: 'boats', location: 'Kolkata Dock', categories: ['Flood'], minUrgency: 30 },
  { id: 'MT-01', type: 'Medical Team', name: 'Medical Response Team A', quantity: 1, available: 1, unit: 'team', location: 'AIIMS Delhi', categories: ['Medical', 'Earthquake', 'Fire'], minUrgency: 40 },
  { id: 'MT-02', type: 'Medical Team', name: 'Medical Response Team B', quantity: 1, available: 1, unit: 'team', location: 'Pune Civil Hospital', categories: ['Medical', 'Earthquake', 'Fire'], minUrgency: 40 },
  { id: 'AM-01', type: 'Ambulance', name: 'Ambulance Fleet (North)', quantity: 5, available: 4, unit: 'vehicles', location: 'Delhi NCR', categories: ['Medical', 'Earthquake', 'Fire', 'Flood'], minUrgency: 25 },
  { id: 'AM-02', type: 'Ambulance', name: 'Ambulance Fleet (South)', quantity: 4, available: 3, unit: 'vehicles', location: 'Chennai Hub', categories: ['Medical', 'Earthquake', 'Fire', 'Flood'], minUrgency: 25 },
  { id: 'FK-01', type: 'Food Kit', name: 'Emergency Food Kits (500 units)', quantity: 500, available: 480, unit: 'kits', location: 'Central Warehouse, Nagpur', categories: ['Flood', 'Earthquake', 'Other'], minUrgency: 10 },
  { id: 'DW-01', type: 'Drinking Water', name: 'Drinking Water Tankers', quantity: 8, available: 7, unit: 'tankers (10,000L)', location: 'Regional Depot, Hyderabad', categories: ['Flood', 'Earthquake', 'Other'], minUrgency: 10 },
  { id: 'BL-01', type: 'Blankets', name: 'Relief Blankets', quantity: 1000, available: 950, unit: 'blankets', location: 'Disaster Relief Store, Bhopal', categories: ['Flood', 'Earthquake', 'Other'], minUrgency: 10 },
  { id: 'RP-01', type: 'Rescue Personnel', name: 'NDRF Team Alpha', quantity: 20, available: 18, unit: 'personnel', location: 'NDRF Battalion, Patna', categories: ['Flood', 'Earthquake', 'Fire'], minUrgency: 50 },
  { id: 'RP-02', type: 'Rescue Personnel', name: 'NDRF Team Beta', quantity: 15, available: 15, unit: 'personnel', location: 'NDRF Battalion, Pune', categories: ['Flood', 'Earthquake', 'Fire', 'Other'], minUrgency: 50 },
  { id: 'FT-01', type: 'Fire Truck', name: 'Fire Brigade Unit', quantity: 3, available: 3, unit: 'trucks', location: 'Municipal Fire Station', categories: ['Fire'], minUrgency: 20 },
];

/**
 * Get resource recommendations for a given triage result and report.
 * @param {object} report - the incident report
 * @param {object} triageResult - result from triageEngine
 * @param {Array} currentInventory - current state of inventory
 * @returns {Array} recommended resources with reasons
 */
export function getResourceRecommendations(report, triageResult, currentInventory) {
  const { disasterType } = report;
  const { urgencyScore, priority } = triageResult;
  const recommendations = [];

  for (const resource of currentInventory) {
    if (resource.available <= 0) continue;
    if (!resource.categories.includes(disasterType) && !resource.categories.includes('Other')) continue;
    if (urgencyScore < resource.minUrgency) continue;

    // Additional logic: only recommend medical for medical emergencies or high urgency
    if ((resource.type === 'Medical Team' || resource.type === 'Ambulance') && disasterType !== 'Medical' && urgencyScore < 60) continue;

    // Rescue boats only for flood
    if (resource.type === 'Rescue Boat' && disasterType !== 'Flood') continue;

    // Fire trucks only for fire
    if (resource.type === 'Fire Truck' && disasterType !== 'Fire') continue;

    const reason = buildReason(resource, disasterType, urgencyScore, priority, report);
    recommendations.push({ ...resource, reason, pendingApproval: false, dispatched: false });
  }

  // Sort by priority: Rescue Personnel & Medical Teams first for critical
  recommendations.sort((a, b) => {
    const order = ['Medical Team', 'Rescue Personnel', 'Ambulance', 'Rescue Boat', 'Fire Truck', 'Food Kit', 'Drinking Water', 'Blankets'];
    return order.indexOf(a.type) - order.indexOf(b.type);
  });

  return recommendations;
}

function buildReason(resource, disasterType, urgencyScore, priority, report) {
  const reasons = [];
  if (resource.categories.includes(disasterType)) {
    reasons.push(`Matched to ${disasterType} incident`);
  }
  if (urgencyScore >= 75 && ['Medical Team', 'Rescue Personnel'].includes(resource.type)) {
    reasons.push('Critical priority demands immediate specialist response');
  }
  if (disasterType === 'Flood' && resource.type === 'Rescue Boat') {
    reasons.push('Flood rescue requires water-capable vessels');
  }
  if (disasterType === 'Medical' && resource.type === 'Ambulance') {
    reasons.push('Medical emergency requires rapid transport');
  }
  if (['Food Kit', 'Drinking Water', 'Blankets'].includes(resource.type)) {
    reasons.push(`${report.affectedCount || 'Unknown'} people may need relief supplies`);
  }
  if (resource.type === 'Fire Truck') {
    reasons.push('Active fire requires fire suppression equipment');
  }
  reasons.push(`${resource.available} ${resource.unit} available at ${resource.location}`);
  return reasons.join('. ');
}

export function loadInventory() {
  try {
    const saved = localStorage.getItem('aapda_inventory');
    return saved ? JSON.parse(saved) : [...INITIAL_INVENTORY];
  } catch {
    return [...INITIAL_INVENTORY];
  }
}

export function saveInventory(inventory) {
  localStorage.setItem('aapda_inventory', JSON.stringify(inventory));
}
