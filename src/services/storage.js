import { triageReport } from './triageEngine';
import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEY = 'aapda_incidents';
const USER_REPORTS_KEY = 'aapda_user_reports';

// Baseline demo incidents (realistic India locations)
export function createStandardDemoIncidents() {
  const now = Date.now();
  const demos = [
    {
      id: 'demo-pune-flood-01',
      isDemo: true,
      demoScenario: 'Standard',
      reporterName: 'Ramesh Gupta',
      disasterType: 'Flood',
      description: 'Severe flooding in low-lying areas. At least 3 families trapped on rooftops and drowning risk is high. Water level rising rapidly. SOS from Shivaji Nagar colony.',
      location: 'Shivaji Nagar, Pune, Maharashtra',
      affectedCount: 45,
      trappedInjured: 12,
      status: 'New',
      createdAt: now - 1000 * 60 * 180,
    },
    {
      id: 'demo-noida-eq-01',
      isDemo: true,
      demoScenario: 'Standard',
      reporterName: 'Priya Sharma',
      disasterType: 'Earthquake',
      description: 'Building collapsed after tremors. Multiple people buried under rubble. Injured persons visible, some unconscious. Urgent rescue needed immediately.',
      location: 'Sector 14, Noida, Uttar Pradesh',
      affectedCount: 120,
      trappedInjured: 25,
      status: 'Assigned',
      createdAt: now - 1000 * 60 * 300,
    },
    {
      id: 'demo-kerala-med-01',
      isDemo: true,
      demoScenario: 'Standard',
      reporterName: 'Dr. Anjali Menon',
      disasterType: 'Medical',
      description: 'Mass food poisoning outbreak at local school. Over 60 students showing symptoms — vomiting, fever, abdominal pain. Some unconscious. Hospital overwhelmed.',
      location: 'Government Higher Secondary School, Ernakulam, Kerala',
      affectedCount: 65,
      trappedInjured: 8,
      status: 'In Progress',
      createdAt: now - 1000 * 60 * 90,
    },
    {
      id: 'demo-bihar-flood-01',
      isDemo: true,
      demoScenario: 'Standard',
      reporterName: 'Manish Yadav',
      disasterType: 'Flood',
      description: 'Entire village stranded due to flash floods. Roads submerged. Families on rooftops. Food shortage beginning. No drinking water. Need urgent evacuation.',
      location: 'Deoria Village, Bihar',
      affectedCount: 300,
      trappedInjured: 0,
      status: 'New',
      createdAt: now - 1000 * 60 * 60,
    },
    {
      id: 'demo-jammu-road-01',
      isDemo: true,
      demoScenario: 'Standard',
      reporterName: 'Suresh Kumar',
      disasterType: 'Other',
      description: 'Minor road accident. Vehicle skidded on wet road. No serious injuries. Driver is safe and stable. Police already present. Need tow truck only.',
      location: 'NH-44, Srinagar Highway, Jammu',
      affectedCount: 2,
      trappedInjured: 0,
      status: 'Resolved',
      createdAt: now - 1000 * 60 * 420,
    },
  ];

  return demos.map(incident => {
    const triage = triageReport(incident);
    return { ...incident, triage };
  });
}

/**
 * Scenario 1: Related Flood Reports
 * Two flood reports describe the same/nearby location with different wording.
 * SignalFusion identifies the relationship and explains why without merging.
 */
export function getScenario1Incidents() {
  const now = Date.now();
  const list = [
    {
      id: 'demo-s1-pune-a',
      isDemo: true,
      demoScenario: 'Scenario 1: Related Flood Reports',
      reporterName: 'Ramesh Gupta',
      disasterType: 'Flood',
      description: 'Severe flooding in low-lying areas. At least 3 families trapped on rooftops and drowning risk is high. Water level rising rapidly. SOS from Shivaji Nagar colony near riverbed.',
      location: 'Shivaji Nagar, Pune, Maharashtra',
      affectedCount: 45,
      trappedInjured: 12,
      status: 'New',
      createdAt: now - 1000 * 60 * 75,
    },
    {
      id: 'demo-s1-pune-b',
      isDemo: true,
      demoScenario: 'Scenario 1: Related Flood Reports',
      reporterName: 'Sunita Patil (Local Resident)',
      disasterType: 'Flood',
      description: 'Water has entered ground floor homes near Mutha riverbank. People stranded on terrace shouting for help. Rapid water current. Please send rescue boats immediately!',
      location: 'Shivaji Nagar Mutha Riverbank, Pune, Maharashtra',
      affectedCount: 38,
      trappedInjured: 9,
      status: 'New',
      createdAt: now - 1000 * 60 * 35,
    },
    ...createStandardDemoIncidents().slice(1) // Keep the other standard incidents for context
  ];

  return list.map(inc => ({ ...inc, triage: triageReport(inc) }));
}

/**
 * Scenario 2: Conflicting Evidence
 * Two related reports contain divergent casualty counts and conflicting severity.
 * SignalFusion flags conflicting fields and requests responder verification.
 */
export function getScenario2Incidents() {
  const now = Date.now();
  const list = [
    {
      id: 'demo-s2-noida-heavy',
      isDemo: true,
      demoScenario: 'Scenario 2: Conflicting Evidence',
      reporterName: 'Field Scout Unit Alpha',
      disasterType: 'Earthquake',
      description: 'Major building collapsed after tremors at commercial complex. At least 120 people feared inside. 25 people trapped under concrete slabs, severe crushing injuries visible.',
      location: 'Sector 14 Commercial Plaza, Noida, Uttar Pradesh',
      affectedCount: 120,
      trappedInjured: 25,
      status: 'New',
      createdAt: now - 1000 * 60 * 50,
    },
    {
      id: 'demo-s2-noida-light',
      isDemo: true,
      demoScenario: 'Scenario 2: Conflicting Evidence',
      reporterName: 'Local Security Guard (Call-in)',
      disasterType: 'Earthquake',
      description: 'Tremor felt here at Sector 14. Minor plaster fallen from wall exterior. Only 8 people panicked outside in parking area. Nobody is trapped or injured. Situation mostly calm.',
      location: 'Sector 14 Commercial Complex, Noida, Uttar Pradesh',
      affectedCount: 8,
      trappedInjured: 0,
      status: 'New',
      createdAt: now - 1000 * 60 * 30,
    },
    ...createStandardDemoIncidents().filter(i => i.disasterType !== 'Earthquake')
  ];

  return list.map(inc => ({ ...inc, triage: triageReport(inc) }));
}

/**
 * Scenario 3: Resource Bottleneck
 * Two Critical incidents heavily compete for the limited Rescue Boats & Medical Teams.
 * Resource Bottleneck Detector highlights deficit and trade-off options.
 */
export function getScenario3Incidents() {
  const now = Date.now();
  const list = [
    {
      id: 'demo-s3-pune-critical',
      isDemo: true,
      demoScenario: 'Scenario 3: Resource Bottleneck',
      reporterName: 'Pune Emergency Control',
      disasterType: 'Flood',
      description: 'Flash flood inundation. Over 15 people trapped on rooftops, rising river currents. Multiple elderly persons requiring emergency extraction. Critical need for Rescue Boats & NDRF divers.',
      location: 'Shivaji Nagar Lowlands, Pune, Maharashtra',
      affectedCount: 80,
      trappedInjured: 16,
      status: 'New',
      createdAt: now - 1000 * 60 * 45,
    },
    {
      id: 'demo-s3-bihar-critical',
      isDemo: true,
      demoScenario: 'Scenario 3: Resource Bottleneck',
      reporterName: 'Deoria District Collectorate',
      disasterType: 'Flood',
      description: 'Embankment breached. Entire eastern hamlet submerged under 6 feet of water. 200 villagers cut off on high mound with rising waters. Urgent request for Rescue Boats and evacuation teams.',
      location: 'Deoria River Basin, Bihar',
      affectedCount: 220,
      trappedInjured: 14,
      status: 'New',
      createdAt: now - 1000 * 60 * 30,
    },
    {
      id: 'demo-s3-noida-trauma',
      isDemo: true,
      demoScenario: 'Scenario 3: Resource Bottleneck',
      reporterName: 'Disaster Relief Squad',
      disasterType: 'Earthquake',
      description: 'Multi-story collapse. Trapped casualties needing immediate on-site physician stabilization and critical medical response teams.',
      location: 'Sector 14, Noida, Uttar Pradesh',
      affectedCount: 95,
      trappedInjured: 18,
      status: 'Assigned',
      createdAt: now - 1000 * 60 * 120,
    },
    ...createStandardDemoIncidents().filter(i => i.disasterType === 'Other' || i.disasterType === 'Medical')
  ];

  return list.map(inc => ({ ...inc, triage: triageReport(inc) }));
}

export function loadIncidents() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  const demos = createStandardDemoIncidents();
  saveIncidents(demos);
  return demos;
}

export function saveIncidents(incidents) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(incidents));
}

export function addIncident(formData) {
  const incidents = loadIncidents();
  const triage = triageReport(formData);
  const newIncident = {
    id: uuidv4(),
    isDemo: false,
    ...formData,
    status: 'New',
    createdAt: Date.now(),
    triage,
  };
  const updated = [newIncident, ...incidents];
  saveIncidents(updated);

  // Also save to user reports list so resetting scenarios doesn't wipe them
  try {
    const userReports = JSON.parse(localStorage.getItem(USER_REPORTS_KEY) || '[]');
    userReports.unshift(newIncident);
    localStorage.setItem(USER_REPORTS_KEY, JSON.stringify(userReports));
  } catch {}

  return newIncident;
}

export function updateIncidentStatus(id, status) {
  const incidents = loadIncidents();
  const updated = incidents.map(inc => inc.id === id ? { ...inc, status } : inc);
  saveIncidents(updated);
  return updated;
}

export function loadSpecificScenario(scenarioId) {
  // Retrieve any user created reports so we never silently overwrite user-submitted reports
  let userReports = [];
  try {
    userReports = JSON.parse(localStorage.getItem(USER_REPORTS_KEY) || '[]');
  } catch {}

  let demoList = [];
  if (scenarioId === 1) demoList = getScenario1Incidents();
  else if (scenarioId === 2) demoList = getScenario2Incidents();
  else if (scenarioId === 3) demoList = getScenario3Incidents();
  else demoList = createStandardDemoIncidents();

  // Combine user custom reports + chosen scenario demo incidents
  const combined = [...userReports, ...demoList];
  saveIncidents(combined);
  return combined;
}

export function resetToDemo() {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem('aapda_inventory');
  localStorage.removeItem('aapda_fusion_decisions');
  localStorage.removeItem('aapda_ripplerisk_decisions');
  localStorage.removeItem(USER_REPORTS_KEY);
  const demos = createStandardDemoIncidents();
  saveIncidents(demos);
  return demos;
}
