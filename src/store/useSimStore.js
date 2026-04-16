import { create } from 'zustand';
import { LANE_TYPES, TIME_OF_DAY, DEFAULT_LANE_WIDTH, calculateMetrics } from '../model/trafficModel';

function lane(type, widthFt) {
  return { type, widthFt: widthFt ?? DEFAULT_LANE_WIDTH[type] ?? 11 };
}

const DEFAULT_LANES = [
  lane(LANE_TYPES.SOV),
  lane(LANE_TYPES.SOV),
];

// URL serialization: "sov:11,bus:12,bike:6,parking:8"
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

function parseURLState() {
  const params = new URLSearchParams(window.location.search);
  if (!params.has('lanes')) return null;
  const lanes = deserializeLanes(params.get('lanes'));
  if (!lanes.length) return null;
  return {
    lanes,
    totalWidthFt:    parseFloat(params.get('width'))    || 70,
    sidewalkWidthFt: parseFloat(params.get('sidewalk')) || 12,
    timeOfDay:   params.get('time')        || TIME_OF_DAY.AM_PEAK,
    busHeadway:  parseInt(params.get('headway') || '10', 10),
    busCapacity: params.get('busCapacity') || 'standard',
    modeShift:   parseInt(params.get('modeShift') || '25', 10),
    mode:        params.get('mode')        || 'simple',
  };
}

function buildURLParams(s) {
  return new URLSearchParams({
    lanes:      serializeLanes(s.lanes),
    width:      s.totalWidthFt,
    sidewalk:   s.sidewalkWidthFt,
    time:       s.timeOfDay,
    headway:    s.busHeadway,
    busCapacity: s.busCapacity,
    modeShift:  s.modeShift,
    mode:       s.mode,
  }).toString();
}

const initial = parseURLState() || {
  lanes:           DEFAULT_LANES,
  totalWidthFt:    40,
  sidewalkWidthFt: 9,
  timeOfDay:       TIME_OF_DAY.AM_PEAK,
  busHeadway:      10,
  busCapacity:     'standard',
  modeShift:       25,
  mode:            'simple',
};

const useSimStore = create((set, get) => ({
  lanes:           initial.lanes,
  totalWidthFt:    initial.totalWidthFt,
  sidewalkWidthFt: initial.sidewalkWidthFt,
  timeOfDay:       initial.timeOfDay,
  busHeadway:      initial.busHeadway,
  busCapacity:     initial.busCapacity,
  modeShift:       initial.modeShift,
  mode:            initial.mode,

  setLane: (index, type) => {
    const lanes = [...get().lanes];
    lanes[index] = { type, widthFt: DEFAULT_LANE_WIDTH[type] || 11 };
    set({ lanes });
    get()._syncURL();
  },

  setLaneWidth: (index, widthFt) => {
    const lanes = get().lanes.map((l, i) =>
      i === index ? { ...l, widthFt: Math.max(5, Math.min(20, widthFt)) } : l
    );
    set({ lanes });
    get()._syncURL();
  },

  addLane: () => {
    const { lanes } = get();
    if (lanes.length >= 8) return;
    set({ lanes: [...lanes, lane(LANE_TYPES.SOV)] });
    get()._syncURL();
  },

  removeLane: () => {
    const { lanes } = get();
    if (lanes.length <= 1) return;
    set({ lanes: lanes.slice(0, -1) });
    get()._syncURL();
  },

  removeLaneAt: (i) => {
    const lanes = get().lanes.filter((_, j) => j !== i);
    if (lanes.length < 1) return;
    set({ lanes });
    get()._syncURL();
  },

  setTotalWidth: (v) => {
    set({ totalWidthFt: Math.max(30, Math.min(100, v)) });
    get()._syncURL();
  },

  setSidewalkWidth: (v) => {
    set({ sidewalkWidthFt: Math.max(4, Math.min(30, v)) });
    get()._syncURL();
  },

  setTimeOfDay:   (v) => { set({ timeOfDay: v });   get()._syncURL(); },
  setBusHeadway:  (v) => { set({ busHeadway: v });  get()._syncURL(); },
  setBusCapacity: (v) => { set({ busCapacity: v }); get()._syncURL(); },
  setModeShift:   (v) => { set({ modeShift: v });   get()._syncURL(); },
  setMode:        (v) => { set({ mode: v });         get()._syncURL(); },

  getShareURL: () => {
    const s = get();
    return `${window.location.origin}${window.location.pathname}?${buildURLParams(s)}`;
  },

  _syncURL: () => {
    window.history.replaceState(null, '', `?${buildURLParams(get())}`);
  },
}));

export default useSimStore;
