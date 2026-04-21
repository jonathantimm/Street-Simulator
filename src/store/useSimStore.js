import { create } from 'zustand';
import { LANE_TYPES, TIME_OF_DAY, DEFAULT_LANE_WIDTH, calculateMetrics } from '../model/trafficModel';

function lane(type, widthFt) {
  return { type, widthFt: widthFt ?? DEFAULT_LANE_WIDTH[type] ?? 11 };
}

const DEFAULT_LANES = [
  lane(LANE_TYPES.SOV),
  lane(LANE_TYPES.SOV),
];

// Scenario snapshot: only per-design fields. totalWidthFt is global (same street).
export function extractScenario(s) {
  return {
    lanes:           s.lanes,
    sidewalkLeftFt:  s.sidewalkLeftFt,
    sidewalkRightFt: s.sidewalkRightFt,
    timeOfDay:       s.timeOfDay,
    busHeadway:      s.busHeadway,
    busCapacity:     s.busCapacity,
    modeShift:       s.modeShift,
    oneWay:          s.oneWay ?? false,
  };
}

// URL serialization
function serializeLanes(lanes) {
  return lanes.map(l => `${l.type}:${l.widthFt}`).join(',');
}

function deserializeLanes(str) {
  const valid = Object.values(LANE_TYPES);
  return str.split(',').map(s => {
    const [type, w] = s.split(':');
    if (!valid.includes(type)) return null;
    return { type, widthFt: parseFloat(w) || DEFAULT_LANE_WIDTH[type] || 11 };
  }).filter(Boolean);
}

function encodeSnap(params, prefix, snap) {
  params.set(`${prefix}l`,  serializeLanes(snap.lanes));
  params.set(`${prefix}sl`, snap.sidewalkLeftFt);
  params.set(`${prefix}sr`, snap.sidewalkRightFt);
  params.set(`${prefix}t`,  snap.timeOfDay);
  params.set(`${prefix}h`,  snap.busHeadway);
  params.set(`${prefix}bc`, snap.busCapacity);
  params.set(`${prefix}ms`, snap.modeShift);
  if (snap.oneWay) params.set(`${prefix}ow`, '1');
}

function decodeSnap(params, prefix) {
  const lanesStr = params.get(`${prefix}l`);
  if (!lanesStr) return null;
  const lanes = deserializeLanes(lanesStr);
  if (!lanes.length) return null;
  const legacySw = parseFloat(params.get(`${prefix}sw`)) || 9;
  return {
    lanes,
    sidewalkLeftFt:  parseFloat(params.get(`${prefix}sl`)) || legacySw,
    sidewalkRightFt: parseFloat(params.get(`${prefix}sr`)) || legacySw,
    timeOfDay:   params.get(`${prefix}t`)  || TIME_OF_DAY.AM_PEAK,
    busHeadway:  parseInt(params.get(`${prefix}h`)  || '10', 10),
    busCapacity: params.get(`${prefix}bc`) || 'standard',
    modeShift:   parseInt(params.get(`${prefix}ms`) || '25', 10),
    oneWay:      params.get(`${prefix}ow`) === '1',
  };
}

function buildURLParams(s) {
  // totalWidthFt is global — encoded once, not per-scenario
  const params = new URLSearchParams({ tab: s.activeTab, mode: s.mode, w: s.totalWidthFt });
  const sqSnap = s.activeTab === 'statusQuo' ? extractScenario(s) : s.scenarios.statusQuo;
  const pSnap  = s.activeTab === 'proposed'  ? extractScenario(s) : s.scenarios.proposed;
  if (sqSnap) encodeSnap(params, 'sq', sqSnap);
  if (pSnap)  encodeSnap(params, 'p', pSnap);
  return params.toString();
}

function parseURLState() {
  const params = new URLSearchParams(window.location.search);

  // New multi-scenario format
  if (params.has('sql') || params.has('tab')) {
    const sqSnap = decodeSnap(params, 'sq');
    const pSnap  = decodeSnap(params, 'p');
    if (!sqSnap && !pSnap) return null;
    const tab  = (params.get('tab') === 'proposed' && pSnap) ? 'proposed' : 'statusQuo';
    const mode = params.get('mode') || 'simple';
    // Global width: prefer top-level 'w', fall back to per-scenario for old URLs
    const totalWidthFt = parseFloat(params.get('w')) || parseFloat(params.get('sqw')) || 40;
    const active = tab === 'proposed' ? pSnap : (sqSnap || DEFAULT_STATE);
    return {
      ...active,
      totalWidthFt,
      activeTab: tab,
      mode,
      scenarios: {
        statusQuo: tab === 'statusQuo' ? null : sqSnap,
        proposed:  tab === 'proposed'  ? null : pSnap,
      },
    };
  }

  // Old format (backward compat — existing shared links)
  if (params.has('lanes')) {
    const lanes = deserializeLanes(params.get('lanes'));
    if (!lanes.length) return null;
    const sw = parseFloat(params.get('sidewalk')) || 9;
    return {
      lanes,
      totalWidthFt:    parseFloat(params.get('width')) || 40,
      sidewalkLeftFt:  sw,
      sidewalkRightFt: sw,
      timeOfDay:   params.get('time')        || TIME_OF_DAY.AM_PEAK,
      busHeadway:  parseInt(params.get('headway') || '10', 10),
      busCapacity: params.get('busCapacity') || 'standard',
      modeShift:   parseInt(params.get('modeShift') || '25', 10),
      oneWay:      false,
      mode:        params.get('mode') || 'simple',
      activeTab:   'statusQuo',
      scenarios:   { statusQuo: null, proposed: null },
    };
  }

  return null;
}

const STORAGE_KEY = 'street-sim-v2';

function loadStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed.lanes) return null;
    // Backward compat: old storage used sidewalkWidthFt
    if (parsed.sidewalkWidthFt && !parsed.sidewalkLeftFt) {
      parsed.sidewalkLeftFt  = parsed.sidewalkWidthFt;
      parsed.sidewalkRightFt = parsed.sidewalkWidthFt;
    }
    // Always start fresh — don't restore comparison state from previous session
    parsed.scenarios = { statusQuo: null, proposed: null };
    parsed.activeTab = 'statusQuo';
    return parsed;
  } catch { return null; }
}

const DEFAULT_STATE = {
  lanes:           DEFAULT_LANES,
  totalWidthFt:    40,
  sidewalkLeftFt:  9,
  sidewalkRightFt: 9,
  timeOfDay:       TIME_OF_DAY.AM_PEAK,
  busHeadway:      10,
  busCapacity:     'standard',
  modeShift:       25,
  oneWay:          false,
  mode:            'simple',
  activeTab:       'statusQuo',
  scenarios:       { statusQuo: null, proposed: null },
};

const initial = parseURLState() || loadStorage() || DEFAULT_STATE;
if (!initial.scenarios) initial.scenarios = { statusQuo: null, proposed: null };
if (initial.oneWay === undefined) initial.oneWay = false;
if (!initial.activeTab) initial.activeTab = 'statusQuo';
if (!initial.sidewalkLeftFt) {
  initial.sidewalkLeftFt  = initial.sidewalkWidthFt || 9;
  initial.sidewalkRightFt = initial.sidewalkWidthFt || 9;
}

const useSimStore = create((set, get) => ({
  // Global (shared across both scenarios)
  totalWidthFt:    initial.totalWidthFt,
  mode:            initial.mode,
  activeTab:       initial.activeTab,
  scenarios:       initial.scenarios,

  // Active scenario
  lanes:           initial.lanes,
  sidewalkLeftFt:  initial.sidewalkLeftFt,
  sidewalkRightFt: initial.sidewalkRightFt,
  timeOfDay:       initial.timeOfDay,
  busHeadway:      initial.busHeadway,
  busCapacity:     initial.busCapacity,
  modeShift:       initial.modeShift,
  oneWay:          initial.oneWay,

  switchTab: (tab) => {
    const s = get();
    if (tab === s.activeTab) return;
    const currentSnap = extractScenario(s);
    const targetSnap  = s.scenarios[tab] ?? currentSnap;
    set({
      activeTab: tab,
      ...targetSnap,
      // totalWidthFt intentionally not touched — it's global
      scenarios: { ...s.scenarios, [s.activeTab]: currentSnap },
    });
    get()._sync();
  },

  setLane: (index, type) => {
    const lanes = [...get().lanes];
    lanes[index] = { type, widthFt: DEFAULT_LANE_WIDTH[type] || 11 };
    set({ lanes }); get()._sync();
  },

  setLaneWidth: (index, widthFt) => {
    const lanes = get().lanes.map((l, i) =>
      i === index ? { ...l, widthFt: Math.max(5, Math.min(20, widthFt)) } : l
    );
    set({ lanes }); get()._sync();
  },

  addLane: () => {
    const { lanes } = get();
    if (lanes.length >= 8) return;
    set({ lanes: [...lanes, lane(LANE_TYPES.SOV)] }); get()._sync();
  },

  removeLane: () => {
    const { lanes } = get();
    if (lanes.length <= 1) return;
    set({ lanes: lanes.slice(0, -1) }); get()._sync();
  },

  removeLaneAt: (i) => {
    const lanes = get().lanes.filter((_, j) => j !== i);
    if (lanes.length < 1) return;
    set({ lanes }); get()._sync();
  },

  setTotalWidth:     (v) => { set({ totalWidthFt: Math.max(30, Math.min(100, v)) }); get()._sync(); },
  setSidewalkLeft:   (v) => { set({ sidewalkLeftFt:  Math.max(4, Math.min(30, v)) }); get()._sync(); },
  setSidewalkRight:  (v) => { set({ sidewalkRightFt: Math.max(4, Math.min(30, v)) }); get()._sync(); },
  setTimeOfDay:      (v) => { set({ timeOfDay: v });   get()._sync(); },
  setBusHeadway:     (v) => { set({ busHeadway: v });  get()._sync(); },
  setBusCapacity:    (v) => { set({ busCapacity: v }); get()._sync(); },
  setModeShift:      (v) => { set({ modeShift: v });   get()._sync(); },
  setMode:           (v) => { set({ mode: v });         get()._sync(); },
  setOneWay:         (v) => { set({ oneWay: v });       get()._sync(); },

  getShareURL: () => {
    return `${window.location.origin}${window.location.pathname}?${buildURLParams(get())}`;
  },

  _sync: () => {
    const s = get();
    window.history.replaceState(null, '', `?${buildURLParams(s)}`);
    try {
      const sqSnap = s.activeTab === 'statusQuo' ? extractScenario(s) : s.scenarios.statusQuo;
      const pSnap  = s.activeTab === 'proposed'  ? extractScenario(s) : s.scenarios.proposed;
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        ...extractScenario(s),
        totalWidthFt: s.totalWidthFt,
        mode: s.mode,
        activeTab: s.activeTab,
        scenarios: { statusQuo: sqSnap, proposed: pSnap },
      }));
    } catch {}
  },
}));

export default useSimStore;
