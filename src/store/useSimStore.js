import { create } from 'zustand';
import { LANE_TYPES, TIME_OF_DAY, DEFAULT_LANE_WIDTH, calculateMetrics } from '../model/trafficModel';

function lane(type, widthFt) {
  return { type, widthFt: widthFt ?? DEFAULT_LANE_WIDTH[type] ?? 11 };
}

const DEFAULT_LANES = [
  lane(LANE_TYPES.SOV),
  lane(LANE_TYPES.SOV),
];

export function extractScenario(s) {
  return {
    lanes:           s.lanes,
    totalWidthFt:    s.totalWidthFt,
    sidewalkWidthFt: s.sidewalkWidthFt,
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
  params.set(`${prefix}l`, serializeLanes(snap.lanes));
  params.set(`${prefix}w`, snap.totalWidthFt);
  params.set(`${prefix}sw`, snap.sidewalkWidthFt);
  params.set(`${prefix}t`, snap.timeOfDay);
  params.set(`${prefix}h`, snap.busHeadway);
  params.set(`${prefix}bc`, snap.busCapacity);
  params.set(`${prefix}ms`, snap.modeShift);
  if (snap.oneWay) params.set(`${prefix}ow`, '1');
}

function decodeSnap(params, prefix) {
  const lanesStr = params.get(`${prefix}l`);
  if (!lanesStr) return null;
  const lanes = deserializeLanes(lanesStr);
  if (!lanes.length) return null;
  return {
    lanes,
    totalWidthFt:    parseFloat(params.get(`${prefix}w`))  || 40,
    sidewalkWidthFt: parseFloat(params.get(`${prefix}sw`)) || 9,
    timeOfDay:   params.get(`${prefix}t`)  || TIME_OF_DAY.AM_PEAK,
    busHeadway:  parseInt(params.get(`${prefix}h`)  || '10', 10),
    busCapacity: params.get(`${prefix}bc`) || 'standard',
    modeShift:   parseInt(params.get(`${prefix}ms`) || '25', 10),
    oneWay:      params.get(`${prefix}ow`) === '1',
  };
}

function buildURLParams(s) {
  const params = new URLSearchParams({ tab: s.activeTab, mode: s.mode });
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
    const active = tab === 'proposed' ? pSnap : (sqSnap || DEFAULT_STATE);
    return {
      ...active,
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
    return {
      lanes,
      totalWidthFt:    parseFloat(params.get('width'))    || 40,
      sidewalkWidthFt: parseFloat(params.get('sidewalk')) || 9,
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
    return parsed;
  } catch { return null; }
}

const DEFAULT_STATE = {
  lanes:           DEFAULT_LANES,
  totalWidthFt:    40,
  sidewalkWidthFt: 9,
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

const useSimStore = create((set, get) => ({
  lanes:           initial.lanes,
  totalWidthFt:    initial.totalWidthFt,
  sidewalkWidthFt: initial.sidewalkWidthFt,
  timeOfDay:       initial.timeOfDay,
  busHeadway:      initial.busHeadway,
  busCapacity:     initial.busCapacity,
  modeShift:       initial.modeShift,
  oneWay:          initial.oneWay,
  mode:            initial.mode,
  activeTab:       initial.activeTab,
  scenarios:       initial.scenarios,

  switchTab: (tab) => {
    const s = get();
    if (tab === s.activeTab) return;
    const currentSnap = extractScenario(s);
    const targetSnap  = s.scenarios[tab] ?? currentSnap; // copy current if tab never visited
    set({
      activeTab: tab,
      ...targetSnap,
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

  setTotalWidth:    (v) => { set({ totalWidthFt: Math.max(30, Math.min(100, v)) }); get()._sync(); },
  setSidewalkWidth: (v) => { set({ sidewalkWidthFt: Math.max(4, Math.min(30, v)) }); get()._sync(); },
  setTimeOfDay:     (v) => { set({ timeOfDay: v });   get()._sync(); },
  setBusHeadway:    (v) => { set({ busHeadway: v });  get()._sync(); },
  setBusCapacity:   (v) => { set({ busCapacity: v }); get()._sync(); },
  setModeShift:     (v) => { set({ modeShift: v });   get()._sync(); },
  setMode:          (v) => { set({ mode: v });         get()._sync(); },
  setOneWay:        (v) => { set({ oneWay: v });       get()._sync(); },

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
        mode: s.mode,
        activeTab: s.activeTab,
        scenarios: { statusQuo: sqSnap, proposed: pSnap },
      }));
    } catch {}
  },
}));

export default useSimStore;
