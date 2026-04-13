// Macroscopic traffic flow model
// Sources: HCM 6th Ed., NACTO Urban Street Design Guide, NACTO Transit Street Design Guide,
// TCRP Report 165, FTA Transit Capacity Manual 3rd Ed., NHTS 2017, NACTO Cycling Streets 2019

export const LANE_TYPES = {
  SOV:     'sov',
  BUS:     'bus',
  BIKE:    'bike',
  PARKING: 'parking',
};

export const TIME_OF_DAY = {
  AM_PEAK: 'am-peak',
  MIDDAY:  'midday',
  PM_PEAK: 'pm-peak',
  EVENING: 'evening',
};

// Default lane widths (feet) — NACTO / NYC DOT standards
export const DEFAULT_LANE_WIDTH = {
  [LANE_TYPES.SOV]:     11,
  [LANE_TYPES.BUS]:     11,
  [LANE_TYPES.BIKE]:     6,
  [LANE_TYPES.PARKING]:  8,
};

// Normalize: accept string lane ('sov') or object lane ({ type, widthFt })
export function normalizeLane(l) {
  if (typeof l === 'string') return { type: l, widthFt: DEFAULT_LANE_WIDTH[l] || 11 };
  return { type: l.type, widthFt: l.widthFt ?? DEFAULT_LANE_WIDTH[l.type] ?? 11 };
}

// Demand factors by time of day (HCM / NACTO)
const DEMAND_FACTORS = {
  [TIME_OF_DAY.AM_PEAK]:  1.0,
  [TIME_OF_DAY.MIDDAY]:   0.65,
  [TIME_OF_DAY.PM_PEAK]:  0.95,
  [TIME_OF_DAY.EVENING]:  0.35,
};

// SOV parameters — HCM 6th Ed. §16
const SOV_SATURATION_FLOW = 1800;
const SOV_ARTERIAL_FACTOR = 0.80;
const SOV_GREEN_RATIO     = 0.50;
const SOV_OCCUPANCY       = 1.1;

const CORRIDOR_BASE_VC = 0.65;

const EFFECTIVE_CAP_PER_LANE = SOV_SATURATION_FLOW * SOV_ARTERIAL_FACTOR * SOV_GREEN_RATIO;
// = 720 veh/hr/lane

// Traffic evaporation: when car lanes are replaced by bus/bike lanes, research shows
// 30–40% of car trips disappear rather than simply transferring to remaining car lanes —
// drivers shift modes, consolidate trips, or change routes. This constant sets the floor:
// if every lane were converted away from cars, 60% of baseline vehicle demand would still
// seek the corridor (freight, emergency, essential trips). The remaining 40% evaporates.
// Sources: London Embankment (Cairns et al. 1998), Seoul Cheonggyecheon (Ha et al. 2007),
// VTPI TDM Encyclopedia "traffic evaporation."
const INDUCED_DEMAND_FLOOR = 0.6;

// Bus parameters
const BUS_LOAD_FACTOR = 0.85;
const BUS_SPEED_MPH   = 12;

// Bike parameters
const BIKE_LANE_CAPACITY = 1750;
const BIKE_SPEED_MPH     = 11;

// HCM lane width adjustment factor (Table 16-11 simplified)
// Narrower lanes reduce throughput due to side friction and reduced speeds
function laneWidthFactor(widthFt) {
  if (widthFt >= 12) return 1.00;
  if (widthFt >= 11) return 0.97;
  if (widthFt >= 10) return 0.88;
  if (widthFt >=  9) return 0.77;
  return 0.65;
}

export function getCapacityByBusType(busCapacity) {
  return busCapacity === 'articulated' ? 100 : 60;
}

export function speedLabel(speedMph) {
  if (speedMph >= 24) return 'free flow';
  if (speedMph >= 18) return 'moving';
  if (speedMph >= 12) return 'slow';
  if (speedMph >=  8) return 'congested';
  return 'gridlock';
}

export function speedColor(speedMph) {
  if (speedMph >= 24) return '#16a34a';
  if (speedMph >= 18) return '#ca8a04';
  if (speedMph >= 12) return '#ea580c';
  if (speedMph >=  8) return '#dc2626';
  return '#7f1d1d';
}

function vcToSpeed(vc) {
  if (vc <= 0)    return 28;
  if (vc <= 0.60) return 28;
  if (vc <= 0.85) return Math.round(28 - ((vc - 0.60) / 0.25) * 10);
  if (vc <= 1.00) return Math.round(18 - ((vc - 0.85) / 0.15) * 10);
  return Math.max(4, Math.round(8 - (vc - 1.00) * 20));
}

export function calculateBusThroughput(laneCount, headwayMinutes, busCapacity, timeOfDay) {
  const demandFactor   = DEMAND_FACTORS[timeOfDay];
  const capacityPerBus = getCapacityByBusType(busCapacity);
  const busesPerHour   = 60 / headwayMinutes;
  const ridersPerHour  = busesPerHour * capacityPerBus * BUS_LOAD_FACTOR * demandFactor;

  return {
    busesPerHour:         Math.round(busesPerHour),
    peoplePerHour:        Math.round(ridersPerHour * laneCount),
    peoplePerHourPerLane: Math.round(ridersPerHour),
    speedMph: BUS_SPEED_MPH,
  };
}

export function calculateMetrics(config) {
  const { lanes: rawLanes, timeOfDay, busHeadway, busCapacity, modeShift } = config;

  // Normalize lanes to objects
  const lanes = rawLanes.map(normalizeLane);

  const demandFactor = DEMAND_FACTORS[timeOfDay] ?? 1.0;
  const totalLanes   = lanes.length;

  const sovLaneObjs  = lanes.filter(l => l.type === LANE_TYPES.SOV);
  const busLaneObjs  = lanes.filter(l => l.type === LANE_TYPES.BUS);
  const bikeLaneObjs = lanes.filter(l => l.type === LANE_TYPES.BIKE);

  const sovLanes  = sovLaneObjs.length;
  const busLanes  = busLaneObjs.length;
  const bikeLanes = bikeLaneObjs.length;

  // SOV people/hr — adjusted per lane width
  const sovPeopleTotal = Math.round(
    sovLaneObjs.reduce((sum, l) => {
      const cap = EFFECTIVE_CAP_PER_LANE * laneWidthFactor(l.widthFt) * demandFactor;
      return sum + cap * SOV_OCCUPANCY;
    }, 0)
  );

  // Average SOV capacity per lane (for corridor model)
  const avgSovWidthFactor = sovLanes > 0
    ? sovLaneObjs.reduce((s, l) => s + laneWidthFactor(l.widthFt), 0) / sovLanes
    : 1;
  const avgSovCap = EFFECTIVE_CAP_PER_LANE * avgSovWidthFactor;

  // Baseline (all SOV)
  const avgAllWidthFactor = lanes.reduce((s, l) => s + laneWidthFactor(l.widthFt), 0) / totalLanes;
  const baselinePeople = Math.round(
    EFFECTIVE_CAP_PER_LANE * avgAllWidthFactor * demandFactor * SOV_OCCUPANCY * totalLanes
  );

  // Bus
  const busData = busLanes > 0
    ? calculateBusThroughput(busLanes, busHeadway, busCapacity, timeOfDay)
    : { busesPerHour: 0, peoplePerHour: 0, peoplePerHourPerLane: 0, speedMph: BUS_SPEED_MPH };

  // Bike — base capacity scaled by lane width, plus mode-shifted trips
  const displacedCarPeople = (totalLanes - sovLanes) *
    EFFECTIVE_CAP_PER_LANE * avgAllWidthFactor * demandFactor * SOV_OCCUPANCY;
  // Mode shift toward bike throughput: only when bike lanes present
  const shiftedToBike = bikeLanes > 0 ? displacedCarPeople * (modeShift / 100) : 0;

  const bikeBasePeople = bikeLaneObjs.reduce((sum, l) => {
    // Wider bike lanes carry more cyclists (NACTO: 5ft→1200/hr, 7ft→2000/hr, interpolated)
    const widthScale = Math.min(1.15, Math.max(0.70, l.widthFt / 6));
    return sum + BIKE_LANE_CAPACITY * widthScale * demandFactor;
  }, 0);

  const bikePeopleTotal = Math.round(
    Math.min(bikeBasePeople + shiftedToBike, BIKE_LANE_CAPACITY * 1.15 * Math.max(bikeLanes, 1))
  );

  const totalPeople = sovPeopleTotal + busData.peoplePerHour + bikePeopleTotal;
  const vsBaseline  = baselinePeople > 0
    ? Math.round(((totalPeople - baselinePeople) / baselinePeople) * 100)
    : 0;

  // Corridor v/c for car speed — three-step demand reduction model:
  //
  // Step 1 — Induced demand (traffic evaporation):
  //   Replacing car lanes with bus/bike lanes reduces total vehicle demand, not just
  //   capacity. Multiplier = INDUCED_DEMAND_FLOOR + (1 − floor) × (car lanes / total lanes).
  //   All-car street → multiplier 1.0. Fully non-car → multiplier 0.6 (40% evaporation).
  const carLaneFraction         = totalLanes > 0 ? sovLanes / totalLanes : 0;
  const inducedDemandMultiplier = INDUCED_DEMAND_FLOOR + (1 - INDUCED_DEMAND_FLOOR) * carLaneFraction;
  const corridorVehDemand       = totalLanes * EFFECTIVE_CAP_PER_LANE * avgAllWidthFactor
                                  * CORRIDOR_BASE_VC * demandFactor * inducedDemandMultiplier;

  // Step 2 — Bus ridership removes vehicles directly:
  const busVehRemoved = busData.peoplePerHour / SOV_OCCUPANCY;

  // Step 3 — Additional mode shift (slider) removes further vehicles:
  const modeShiftVehRemoved = (busLanes + bikeLanes) > 0
    ? displacedCarPeople * (modeShift / 100) / SOV_OCCUPANCY
    : 0;

  const remainingCarVeh = Math.max(0, corridorVehDemand - busVehRemoved - modeShiftVehRemoved);
  const sovLaneCap      = sovLanes * avgSovCap;
  const vcRatio         = sovLaneCap > 0 ? remainingCarVeh / sovLaneCap : 0;
  const speedMph        = vcToSpeed(vcRatio);

  const totalWidthFt = lanes.reduce((s, l) => s + l.widthFt, 0);
  const sqFtPerPerson = totalPeople > 0
    ? Math.round((totalWidthFt * 5280) / totalPeople)
    : 0;

  return {
    totalPeople,
    baselinePeople,
    vsBaseline,
    sov: {
      peoplePerHour:        sovPeopleTotal,
      vehiclesPerHour:      Math.round(sovLanes * EFFECTIVE_CAP_PER_LANE * avgSovWidthFactor * demandFactor),
      peoplePerHourPerLane: sovLanes > 0 ? Math.round(sovPeopleTotal / sovLanes) : 0,
      vcRatio,
      isCongested: vcRatio > 0.85,
      speedMph,
    },
    bus:  busData,
    bike: {
      peoplePerHour:        bikePeopleTotal,
      peoplePerHourPerLane: bikeLanes > 0 ? Math.round(bikePeopleTotal / bikeLanes) : 0,
      speedMph: BIKE_SPEED_MPH,
    },
    sovLanes,
    busLanes,
    bikeLanes,
    sqFtPerPerson,
    demandFactor,
    vcRatio,
    speedMph,
  };
}
