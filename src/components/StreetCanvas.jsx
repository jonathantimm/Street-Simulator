import { useEffect, useRef } from 'react';
import useSimStore from '../store/useSimStore';
import { LANE_TYPES, calculateMetrics } from '../model/trafficModel';

const CANVAS_H = 460;

const LANE_BG = {
  [LANE_TYPES.SOV]:     '#616875',
  [LANE_TYPES.BUS]:     '#6b3535',
  [LANE_TYPES.BIKE]:    '#2d5a3d',
  [LANE_TYPES.PARKING]: '#374151',
};

const EMOJI = {
  [LANE_TYPES.SOV]:  '🚗',
  [LANE_TYPES.BUS]:  '🚌',
  [LANE_TYPES.BIKE]: '🚲',
};

const SPEED = {
  sov_free:      2.8,
  sov_congested: 0.5,
  bus:           1.8,
  bike:          1.4,
};

// Build layout from lane objects — widths proportional to widthFt
// Assigns direction: -1 = moves upward (toward top), +1 = moves downward (toward bottom)
// Two-way: left half of SOV go up (-1), right half go down (+1)
// One-way: all SOV go up (-1)
function getLaneLayout(lanes, canvasW, sidewalkWidthFt, totalWidthFt, oneWay = false) {
  const sidewalkFraction = sidewalkWidthFt / totalWidthFt;
  const sidewalkPx = canvasW * sidewalkFraction;
  const travelPx = canvasW - sidewalkPx * 2;
  const totalFt = lanes.reduce((s, l) => s + l.widthFt, 0) || 1;

  const layout = [];
  layout.push({ type: 'sidewalk', x: 0, width: sidewalkPx });

  let x = sidewalkPx;
  lanes.forEach(lane => {
    const w = travelPx * (lane.widthFt / totalFt);
    layout.push({ type: lane.type, x, width: w, widthFt: lane.widthFt });
    x += w;
  });

  layout.push({ type: 'sidewalk', x, width: sidewalkPx });

  // Assign travel directions
  const sovIndices = layout.reduce((arr, l, i) => l.type === LANE_TYPES.SOV ? [...arr, i] : arr, []);
  if (oneWay) {
    sovIndices.forEach(idx => { layout[idx].dir = -1; });
  } else {
    const splitAt = Math.ceil(sovIndices.length / 2);
    sovIndices.forEach((idx, i) => { layout[idx].dir = i < splitAt ? -1 : 1; });
  }

  // Bus and bike lanes: single direction (upward)
  layout.forEach(l => {
    if (l.type === LANE_TYPES.BUS || l.type === LANE_TYPES.BIKE) l.dir = -1;
  });

  return layout;
}

function spawnVehicles(layout, metrics) {
  const vehicles = [];
  layout.forEach(lane => {
    if (lane.type === 'sidewalk' || lane.type === LANE_TYPES.PARKING) return;
    const cx = lane.x + lane.width / 2;
    const emojiSize = Math.min(lane.width * 0.52, 40);
    const dir = lane.dir ?? -1;

    if (lane.type === LANE_TYPES.SOV) {
      const count = metrics.sov.isCongested ? 4 : 3;
      const spacing = Math.max(CANVAS_H / (count + 1), emojiSize * 2.2);
      for (let i = 0; i < count; i++) {
        // Stagger starting positions per direction so they don't all arrive at once
        const baseY = dir === -1
          ? (i + 1) * spacing
          : CANVAS_H - (i + 1) * spacing;
        vehicles.push({ type: LANE_TYPES.SOV, x: cx, y: baseY, emojiSize, dir });
      }
    } else if (lane.type === LANE_TYPES.BUS) {
      vehicles.push({ type: LANE_TYPES.BUS, x: cx, y: CANVAS_H * 0.38, emojiSize, dir });
    } else if (lane.type === LANE_TYPES.BIKE) {
      const spacing = Math.max(CANVAS_H / 3, emojiSize * 2.2);
      for (let i = 0; i < 2; i++) {
        vehicles.push({
          type: LANE_TYPES.BIKE, x: cx, y: (i + 1) * spacing, emojiSize, dir,
          speed: SPEED.bike + (Math.random() - 0.5) * 0.4,
        });
      }
    }
  });
  return vehicles;
}

function drawScene(ctx, layout, W, H) {
  ctx.fillStyle = '#c4b89a';
  ctx.fillRect(0, 0, W, H);

  layout.forEach((lane, i) => {
    if (lane.type === 'sidewalk') {
      ctx.fillStyle = '#c4b89a';
      ctx.fillRect(lane.x, 0, lane.width, H);
      ctx.strokeStyle = 'rgba(0,0,0,0.06)';
      ctx.lineWidth = 1;
      ctx.setLineDash([]);
      for (let y = 0; y < H; y += 40) {
        ctx.beginPath(); ctx.moveTo(lane.x, y); ctx.lineTo(lane.x + lane.width, y); ctx.stroke();
      }
      return;
    }

    ctx.fillStyle = LANE_BG[lane.type] || '#555';
    ctx.fillRect(lane.x, 0, lane.width, H);

    if (lane.type === LANE_TYPES.PARKING) {
      ctx.strokeStyle = 'rgba(255,255,255,0.25)';
      ctx.lineWidth = 1;
      ctx.setLineDash([]);
      const bayH = 60;
      for (let y = bayH; y < H; y += bayH) {
        ctx.beginPath(); ctx.moveTo(lane.x, y); ctx.lineTo(lane.x + lane.width, y); ctx.stroke();
      }
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      ctx.font = `bold ${Math.round(lane.width * 0.5)}px system-ui`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('P', lane.x + lane.width / 2, H / 2);
    } else if (lane.type === LANE_TYPES.BIKE) {
      ctx.strokeStyle = 'rgba(74,222,128,0.45)';
      ctx.lineWidth = 3;
      ctx.setLineDash([]);
      ctx.beginPath(); ctx.moveTo(lane.x + 1.5, 0); ctx.lineTo(lane.x + 1.5, H); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(lane.x + lane.width - 1.5, 0); ctx.lineTo(lane.x + lane.width - 1.5, H); ctx.stroke();
    } else if (lane.type === LANE_TYPES.BUS) {
      ctx.strokeStyle = 'rgba(248,113,113,0.40)';
      ctx.lineWidth = 3;
      ctx.setLineDash([]);
      ctx.beginPath(); ctx.moveTo(lane.x + 1.5, 0); ctx.lineTo(lane.x + 1.5, H); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(lane.x + lane.width - 1.5, 0); ctx.lineTo(lane.x + lane.width - 1.5, H); ctx.stroke();
    } else if (lane.type === LANE_TYPES.SOV) {
      const prev = layout[i - 1];
      // Dashed center line between opposing SOV lanes
      if (prev && prev.type === LANE_TYPES.SOV && prev.dir !== lane.dir) {
        ctx.strokeStyle = 'rgba(255,220,0,0.55)';
        ctx.lineWidth = 2;
        ctx.setLineDash([12, 10]);
        ctx.beginPath(); ctx.moveTo(lane.x, 0); ctx.lineTo(lane.x, H); ctx.stroke();
        ctx.setLineDash([]);
      } else if (prev && prev.type === LANE_TYPES.SOV) {
        ctx.strokeStyle = 'rgba(255,255,255,0.25)';
        ctx.lineWidth = 2;
        ctx.setLineDash([22, 16]);
        ctx.beginPath(); ctx.moveTo(lane.x, 0); ctx.lineTo(lane.x, H); ctx.stroke();
        ctx.setLineDash([]);
      }
    }
  });

  // Crosswalk
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  for (let sx = 0; sx < W; sx += 23) {
    ctx.fillRect(sx, H - 18, 14, 18);
  }
}

// Draw an emoji rotated to face the direction of travel
// dir=-1 → moving up → rotate -90° (car faces upward)
// dir=+1 → moving down → rotate +90° (car faces downward)
function drawVehicle(ctx, v) {
  const angle = v.dir === 1 ? Math.PI / 2 : -Math.PI / 2;
  ctx.save();
  ctx.translate(v.x, v.y);
  ctx.rotate(angle);
  ctx.font = `${Math.round(v.emojiSize)}px serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(EMOJI[v.type], 0, 0);
  ctx.restore();
}

export default function StreetCanvas() {
  const canvasRef   = useRef(null);
  const rafRef      = useRef(null);
  const stateRef    = useRef(null);
  const vehiclesRef = useRef([]);
  const layoutRef   = useRef([]);

  const lanes           = useSimStore(s => s.lanes);
  const totalWidthFt    = useSimStore(s => s.totalWidthFt);
  const sidewalkWidthFt = useSimStore(s => s.sidewalkWidthFt);
  const timeOfDay       = useSimStore(s => s.timeOfDay);
  const busHeadway      = useSimStore(s => s.busHeadway);
  const busCapacity     = useSimStore(s => s.busCapacity);
  const modeShift       = useSimStore(s => s.modeShift);
  const oneWay          = useSimStore(s => s.oneWay);
  const metrics = calculateMetrics({ lanes, timeOfDay, busHeadway, busCapacity, modeShift, oneWay });

  stateRef.current = { lanes, totalWidthFt, sidewalkWidthFt, metrics, oneWay };

  function rebuild() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const { lanes: ls, totalWidthFt: tw, sidewalkWidthFt: sw, metrics: m, oneWay: ow } = stateRef.current;
    canvas.width  = canvas.parentElement?.clientWidth || 400;
    canvas.height = CANVAS_H;
    const layout  = getLaneLayout(ls, canvas.width, sw, tw, ow);
    layoutRef.current   = layout;
    vehiclesRef.current = spawnVehicles(layout, m);
  }

  const laneKey = lanes.map(l => `${l.type}:${l.widthFt}`).join(',');
  useEffect(() => { rebuild(); }, [laneKey, totalWidthFt, sidewalkWidthFt, metrics.sov.isCongested, oneWay]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx    = canvas.getContext('2d');
    let lastTime = null;

    canvas.width  = canvas.parentElement?.clientWidth || 400;
    canvas.height = CANVAS_H;

    const ro = new ResizeObserver(() => {
      canvas.width  = canvas.parentElement?.clientWidth || 400;
      canvas.height = CANVAS_H;
      if (stateRef.current) {
        const { lanes: ls, totalWidthFt: tw, sidewalkWidthFt: sw, oneWay: ow } = stateRef.current;
        layoutRef.current   = getLaneLayout(ls, canvas.width, sw, tw, ow);
        vehiclesRef.current = spawnVehicles(layoutRef.current, stateRef.current.metrics);
      }
    });
    ro.observe(canvas.parentElement);

    function loop(ts) {
      if (!lastTime) lastTime = ts;
      const dt = Math.min((ts - lastTime) / 16.67, 3);
      lastTime = ts;

      const state = stateRef.current;
      if (!state || !layoutRef.current.length) {
        rafRef.current = requestAnimationFrame(loop);
        return;
      }

      const W = canvas.width;
      const H = canvas.height;
      const isCongested = state.metrics?.sov?.isCongested;

      ctx.clearRect(0, 0, W, H);
      drawScene(ctx, layoutRef.current, W, H);

      vehiclesRef.current.forEach(v => {
        let spd = v.speed ?? SPEED.bike;
        if (v.type === LANE_TYPES.SOV) spd = isCongested ? SPEED.sov_congested : SPEED.sov_free;
        else if (v.type === LANE_TYPES.BUS) spd = SPEED.bus;

        const dir = v.dir ?? -1;
        v.y += dir * spd * dt; // dir=-1 moves up, dir=+1 moves down

        // Wrap around: if going up and exits top, re-enter at bottom; vice versa
        if (dir === -1 && v.y < -60)  v.y = H + 60;
        if (dir ===  1 && v.y > H + 60) v.y = -60;

        drawVehicle(ctx, v);
      });

      rafRef.current = requestAnimationFrame(loop);
    }

    rafRef.current = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(rafRef.current); ro.disconnect(); };
  }, []);

  return (
    <div className="street-canvas-wrapper">
      <canvas ref={canvasRef} className="street-canvas" />
    </div>
  );
}
