import useSimStore from '../store/useSimStore';
import { LANE_TYPES, DEFAULT_LANE_WIDTH } from '../model/trafficModel';

export const MAX_STREET_WIDTH = 100; // ft — Eastern Pkwy / Ocean Pkwy style boulevard
export const MIN_STREET_WIDTH = 30;  // ft

const TYPE_CYCLE = [LANE_TYPES.SOV, LANE_TYPES.BUS, LANE_TYPES.BIKE, LANE_TYPES.PARKING];
const TYPE_LABEL = { sov: 'Car', bus: 'Bus', bike: 'Bike', parking: 'Parking' };
const TYPE_EMOJI = { sov: '🚗', bus: '🚌', bike: '🚲', parking: '🅿️' };
const TYPE_COLOR = { sov: '#616875', bus: '#6b3535', bike: '#2d5a3d', parking: '#374151' };

// NYC reference points for total street width
function streetWidthNote(ft) {
  if (ft <= 30) return 'Narrow one-way street — e.g. Wooster St, SoHo (~30 ft)';
  if (ft <= 40) return 'Typical residential side street — e.g. most Brooklyn blocks (~35–40 ft)';
  if (ft <= 50) return 'Standard local two-way street — e.g. Bedford Ave, Williamsburg';
  if (ft <= 60) return 'Mid-size avenue — e.g. 2nd Ave, Manhattan (~60 ft)';
  if (ft <= 70) return 'Wider avenue — e.g. 9th Ave / Atlantic Ave (~70 ft)';
  if (ft <= 80) return 'Major arterial — e.g. Flatbush Ave, Brooklyn (~80 ft)';
  if (ft <= 90) return 'Wide arterial — approaching boulevard scale';
  return 'Grand boulevard — e.g. Eastern Pkwy, Ocean Pkwy (~100 ft)';
}

// NYC reference points for sidewalk width
function sidewalkNote(ft) {
  if (ft <= 5) return 'Very narrow — minimum clearance only';
  if (ft <= 7) return 'Tight — typical on narrow outer-borough side streets';
  if (ft <= 10) return 'Standard residential sidewalk — most NYC side streets';
  if (ft <= 13) return 'Comfortable commercial sidewalk — e.g. Court St, Brooklyn';
  if (ft <= 17) return 'Wide sidewalk — e.g. Broadway in SoHo, Smith St';
  if (ft <= 22) return 'Generous — e.g. 5th Ave, Midtown (~20 ft)';
  return 'Pedestrian plaza scale — rare in NYC';
}

// Dynamic width hint per lane type and current value
function laneWidthNote(type, ft) {
  if (type === LANE_TYPES.SOV) {
    if (ft <= 9)  return 'Tight — significant capacity penalty (HCM)';
    if (ft <= 10) return 'Substandard — some capacity loss';
    if (ft === 11) return 'NYC standard car lane width';
    if (ft === 12) return 'Comfortable — typical arterial / highway';
    return 'Wide — consider narrowing to reclaim space';
  }
  if (type === LANE_TYPES.BUS) {
    if (ft <= 10) return 'Tight for buses — not recommended';
    if (ft <= 12) return 'Standard NYC Select Bus Service lane';
    return 'Wide bus lane — room to spare';
  }
  if (type === LANE_TYPES.BIKE) {
    if (ft <= 5)  return 'Minimum — uncomfortable, NYC DOT standard is 6 ft';
    if (ft <= 6)  return 'NYC DOT standard protected bike lane';
    if (ft <= 8)  return 'Comfortable — allows passing and two-way use';
    return 'Wide facility — consider two-way configuration';
  }
  if (type === LANE_TYPES.PARKING) {
    if (ft <= 7)  return 'Tight parallel parking — doors difficult';
    if (ft === 8) return 'Standard NYC parallel parking width';
    return 'Wide parking — room to spare';
  }
  return '';
}

function nextType(type) {
  const i = TYPE_CYCLE.indexOf(type);
  return TYPE_CYCLE[(i + 1) % TYPE_CYCLE.length];
}

function WidthStepper({ label, value, onDec, onInc, min, max, note }) {
  return (
    <div className="cs-stepper">
      <span className="cs-stepper-label">{label}</span>
      <div className="cs-stepper-ctrl">
        <button className="cs-w-btn" onClick={onDec} disabled={value <= min}>−</button>
        <span className="cs-w-val">{value} ft</span>
        <button className="cs-w-btn" onClick={onInc} disabled={value >= max}>+</button>
      </div>
      {note && <span className="cs-stepper-note">{note}</span>}
    </div>
  );
}

export default function CrossSection() {
  const lanes           = useSimStore(s => s.lanes);
  const totalWidthFt    = useSimStore(s => s.totalWidthFt);
  const sidewalkWidthFt = useSimStore(s => s.sidewalkWidthFt);

  const setLane          = useSimStore(s => s.setLane);
  const setLaneWidth     = useSimStore(s => s.setLaneWidth);
  const removeLaneAt     = useSimStore(s => s.removeLaneAt);
  const addLane          = useSimStore(s => s.addLane);
  const removeLane       = useSimStore(s => s.removeLane);
  const setTotalWidth    = useSimStore(s => s.setTotalWidth);
  const setSidewalkWidth = useSimStore(s => s.setSidewalkWidth);

  const lanesFt     = lanes.reduce((s, l) => s + l.widthFt, 0);
  const sidewalksFt = sidewalkWidthFt * 2;
  const usedFt      = lanesFt + sidewalksFt;
  const availableFt = totalWidthFt - sidewalksFt;
  const overBudget  = lanesFt > availableFt + 0.5;
  const remainingFt = Math.round(availableFt - lanesFt);

  // Can we fit even a minimum-width new lane?
  const MIN_LANE = 5;
  const atMaxCount   = lanes.length >= 8;
  const noRoomToAdd  = availableFt - lanesFt < MIN_LANE;
  const canAdd       = !atMaxCount && !noRoomToAdd;

  return (
    <div className="cross-section">

      {/* Street width controls */}
      <div className="cs-width-controls">
        <WidthStepper
          label="Total street width"
          value={totalWidthFt}
          onDec={() => setTotalWidth(totalWidthFt - 5)}
          onInc={() => setTotalWidth(totalWidthFt + 5)}
          min={MIN_STREET_WIDTH}
          max={MAX_STREET_WIDTH}
          note={streetWidthNote(totalWidthFt)}
        />
        <WidthStepper
          label="Sidewalk (each side)"
          value={sidewalkWidthFt}
          onDec={() => setSidewalkWidth(sidewalkWidthFt - 1)}
          onInc={() => setSidewalkWidth(sidewalkWidthFt + 1)}
          min={4}
          max={30}
          note={sidewalkNote(sidewalkWidthFt)}
        />
      </div>

      {/* Budget bar */}
      <div className={`cs-budget ${overBudget ? 'cs-budget--over' : ''}`}>
        <div className="cs-budget-fill" style={{ width: `${Math.min(100, (usedFt / totalWidthFt) * 100)}%` }} />
        <span className="cs-budget-label">
          {usedFt} ft used of {totalWidthFt} ft
          {overBudget
            ? ` — over by ${Math.round(lanesFt - availableFt)} ft`
            : ` · ${remainingFt} ft available`}
        </span>
      </div>

      {/* Visual cross-section */}
      <div className="cs-bar-row" title={`Total: ${totalWidthFt} ft`}>
        <div
          className="cs-sidewalk"
          style={{ flex: sidewalkWidthFt }}
          title={`Sidewalk: ${sidewalkWidthFt} ft`}
        >
          <span className="cs-sidewalk-label">SIDEWALK<br />{sidewalkWidthFt}′</span>
        </div>

        {lanes.map((lane, i) => (
          <div
            key={i}
            className={`cs-lane ${overBudget ? 'cs-lane--over' : ''}`}
            style={{ flex: lane.widthFt, background: TYPE_COLOR[lane.type] || '#555', minWidth: 28 }}
            title={`Lane ${i + 1}: ${TYPE_LABEL[lane.type]}, ${lane.widthFt} ft`}
          >
            <span className="cs-lane-emoji">{TYPE_EMOJI[lane.type]}</span>
            <span className="cs-lane-ft">{lane.widthFt}′</span>
          </div>
        ))}

        <div
          className="cs-sidewalk"
          style={{ flex: sidewalkWidthFt }}
          title={`Sidewalk: ${sidewalkWidthFt} ft`}
        >
          <span className="cs-sidewalk-label">SIDEWALK<br />{sidewalkWidthFt}′</span>
        </div>
      </div>

      {/* Per-lane cards */}
      <div
        className="cs-lanes-grid"
        style={{ gridTemplateColumns: `repeat(${Math.min(lanes.length, 4)}, 1fr)` }}
      >
        {lanes.map((lane, i) => (
          <div key={i} className={`cs-lane-card cs-lane-card--${lane.type}`}>
            <div className="cs-lane-card-top">
              <span className="cs-lane-num">Lane {i + 1}</span>
              <button
                className="cs-remove-btn"
                onClick={() => removeLaneAt(i)}
                disabled={lanes.length <= 1}
                title="Remove this lane"
              >×</button>
            </div>

            <button
              className="cs-type-btn"
              onClick={() => setLane(i, nextType(lane.type))}
              title="Click to change lane type"
            >
              <span className="cs-type-emoji">{TYPE_EMOJI[lane.type]}</span>
              <span className="cs-type-label">{TYPE_LABEL[lane.type]}</span>
              <span className="cs-type-hint">tap to change</span>
            </button>

            <div className="cs-width-ctrl">
              <button className="cs-w-btn" onClick={() => setLaneWidth(i, lane.widthFt - 1)} disabled={lane.widthFt <= 5}>−</button>
              <span className="cs-w-val">{lane.widthFt} ft</span>
              <button className="cs-w-btn" onClick={() => setLaneWidth(i, lane.widthFt + 1)} disabled={lane.widthFt >= 20}>+</button>
            </div>

            <div className="cs-width-hint">{laneWidthNote(lane.type, lane.widthFt)}</div>
          </div>
        ))}
      </div>

      {/* Add / remove */}
      <div className="cs-lane-count-row">
        <button className="cs-count-btn" onClick={removeLane} disabled={lanes.length <= 1}>− Lane</button>
        <span className="cs-count-label">{lanes.length} lane{lanes.length !== 1 ? 's' : ''}</span>
        <button
          className="cs-count-btn"
          onClick={addLane}
          disabled={!canAdd}
          title={noRoomToAdd ? 'Not enough street width — widen the street or remove a lane' : atMaxCount ? 'Maximum 8 lanes' : ''}
        >+ Lane</button>
      </div>
      {noRoomToAdd && !atMaxCount && (
        <p className="cs-no-room-msg">
          No room for another lane — widen the street or narrow the sidewalks to free up space.
        </p>
      )}

    </div>
  );
}
