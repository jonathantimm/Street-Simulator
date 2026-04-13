import useSimStore from '../store/useSimStore';
import { TIME_OF_DAY } from '../model/trafficModel';
import CrossSection from './CrossSection';

const TIME_LABELS = {
  [TIME_OF_DAY.AM_PEAK]: 'AM Peak',
  [TIME_OF_DAY.MIDDAY]:  'Midday',
  [TIME_OF_DAY.PM_PEAK]: 'PM Peak',
  [TIME_OF_DAY.EVENING]: 'Evening',
};

export default function LaneControls() {
  const timeOfDay   = useSimStore(s => s.timeOfDay);
  const busHeadway  = useSimStore(s => s.busHeadway);
  const busCapacity = useSimStore(s => s.busCapacity);
  const modeShift   = useSimStore(s => s.modeShift);
  const mode        = useSimStore(s => s.mode);
  const lanes       = useSimStore(s => s.lanes);

  const setTimeOfDay   = useSimStore(s => s.setTimeOfDay);
  const setBusHeadway  = useSimStore(s => s.setBusHeadway);
  const setBusCapacity = useSimStore(s => s.setBusCapacity);
  const setModeShift   = useSimStore(s => s.setModeShift);

  const hasBusLane = lanes.some(l => (l.type || l) === 'bus');

  return (
    <div className="lane-controls">
      <CrossSection />

      <div className="lane-controls-divider" />

      <div className="control-group" id="onboarding-lane">
        <label className="control-label">Time of Day</label>
        <div className="segmented-toggle" role="group">
          {Object.entries(TIME_LABELS).map(([val, label]) => (
            <button
              key={val}
              className={`seg-btn ${timeOfDay === val ? 'active' : ''}`}
              onClick={() => setTimeOfDay(val)}
              aria-pressed={timeOfDay === val}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {mode === 'expert' && (
        <div className="expert-controls">
          <div className="control-group">
            <label className="control-label">Bus Headway: <strong>{busHeadway} min</strong></label>
            <input
              type="range" min={2} max={30} step={1} value={busHeadway}
              onChange={e => setBusHeadway(Number(e.target.value))}
              disabled={!hasBusLane} className="slider"
            />
            <div className="slider-labels"><span>2 min</span><span>30 min</span></div>
          </div>

          <div className="control-group">
            <label className="control-label">Bus Capacity</label>
            <select className="select" value={busCapacity}
              onChange={e => setBusCapacity(e.target.value)} disabled={!hasBusLane}>
              <option value="standard">Standard (60 riders)</option>
              <option value="articulated">Articulated (100 riders)</option>
            </select>
          </div>

          <div className="control-group">
            <label className="control-label">Mode Shift (Bike): <strong>{modeShift}%</strong></label>
            <input
              type="range" min={0} max={30} step={1} value={modeShift}
              onChange={e => setModeShift(Number(e.target.value))} className="slider"
            />
            <div className="slider-labels"><span>0%</span><span>30%</span></div>
            <p className="control-note">% of displaced car trips that shift to cycling</p>
          </div>
        </div>
      )}
    </div>
  );
}
