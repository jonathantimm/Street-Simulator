import { useState } from 'react';
import useSimStore from '../store/useSimStore';
import { calculateMetrics, speedLabel, speedColor } from '../model/trafficModel';

const TOOLTIPS = {
  total: 'The total number of people moving through this block each hour, across all modes. Combines cars, buses, and cyclists.',
  baseline: 'What this street would move if every lane were a car lane — the all-SOV baseline for comparison.',
  vsBaseline: 'How this configuration compares to an all-car baseline. A positive number means more people are moving through the same street width.',
  sovSpeed: 'Estimated average speed of cars in SOV lanes, based on volume-to-capacity ratio. Congestion (v/c > 0.85) causes visible slowdown.',
  vcRatio: 'Volume-to-capacity ratio for SOV lanes. Above 0.85 = congested (HCM LOS D/E threshold).',
  sqFt: 'Square feet of road space used per person moved per hour. Lower = more efficient use of limited street width.',
};

function Tooltip({ text, children }) {
  const [show, setShow] = useState(false);
  return (
    <span
      className="tooltip-wrap"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      onFocus={() => setShow(true)}
      onBlur={() => setShow(false)}
      onClick={() => setShow(s => !s)}
      tabIndex={0}
      role="button"
      aria-label="More info"
    >
      {children}
      <span className="tooltip-icon">?</span>
      {show && <span className="tooltip-box" role="tooltip">{text}</span>}
    </span>
  );
}

function SpeedGauge({ speedMph, laneCount }) {
  if (laneCount === 0) return null;
  const color = speedColor(speedMph);
  const label = speedLabel(speedMph);
  return (
    <div className="speed-gauge">
      <div className="speed-gauge-label">car speed</div>
      <div className="speed-gauge-number" style={{ color }}>
        {speedMph} <span className="speed-unit">mph</span>
      </div>
      <div className="speed-gauge-status" style={{ color }}>{label}</div>
    </div>
  );
}

export default function Dashboard() {
  const mode = useSimStore(s => s.mode);
  const lanes = useSimStore(s => s.lanes);
  const timeOfDay = useSimStore(s => s.timeOfDay);
  const busHeadway = useSimStore(s => s.busHeadway);
  const busCapacity = useSimStore(s => s.busCapacity);
  const modeShift = useSimStore(s => s.modeShift);
  const oneWay = useSimStore(s => s.oneWay);

  const metrics = calculateMetrics({ lanes, timeOfDay, busHeadway, busCapacity, modeShift, oneWay });
  const { totalPeople, baselinePeople, vsBaseline, sov, bus, bike, sovLanes, busLanes, bikeLanes, sqFtPerPerson } = metrics;

  const totalForBar = Math.max(totalPeople, 1);
  const sovPct = Math.round((sov.peoplePerHour / totalForBar) * 100);
  const busPct = Math.round((bus.peoplePerHour / totalForBar) * 100);
  const bikePct = Math.round((bike.peoplePerHour / totalForBar) * 100);

  return (
    <div id="dashboard" className="dashboard">
      <div className="dashboard-headline">
        <Tooltip text={TOOLTIPS.total}>
          <span className="people-count" id="onboarding-counter">{totalPeople.toLocaleString()}</span>
        </Tooltip>
        <span className="people-label">people / hour</span>

        {vsBaseline !== 0 && (
          <span className={`vs-baseline ${vsBaseline > 0 ? 'positive' : 'negative'}`}>
            <Tooltip text={TOOLTIPS.vsBaseline}>
              {vsBaseline > 0 ? '+' : ''}{vsBaseline}% vs. all-car
            </Tooltip>
          </span>
        )}
      </div>

      <SpeedGauge speedMph={sov.speedMph || 28} laneCount={sovLanes} />

      <div id="onboarding-breakdown" className="mode-breakdown">
        <div className="breakdown-bar">
          {sov.peoplePerHour > 0 && (
            <div className="bar-segment sov" style={{ width: `${sovPct}%` }} title={`Cars: ${sov.peoplePerHour.toLocaleString()} people/hr`} />
          )}
          {bus.peoplePerHour > 0 && (
            <div className="bar-segment bus" style={{ width: `${busPct}%` }} title={`Bus: ${bus.peoplePerHour.toLocaleString()} people/hr`} />
          )}
          {bike.peoplePerHour > 0 && (
            <div className="bar-segment bike" style={{ width: `${bikePct}%` }} title={`Bike: ${bike.peoplePerHour.toLocaleString()} people/hr`} />
          )}
        </div>

        <div className="breakdown-labels">
          {sovLanes > 0 && (
            <span className="label-sov">
              <span className="dot sov" />
              Cars: {sov.peoplePerHour.toLocaleString()}
            </span>
          )}
          {busLanes > 0 && (
            <span className="label-bus">
              <span className="dot bus" />
              Bus: {bus.peoplePerHour.toLocaleString()}
            </span>
          )}
          {bikeLanes > 0 && (
            <span className="label-bike">
              <span className="dot bike" />
              Bike: {bike.peoplePerHour.toLocaleString()}
            </span>
          )}
        </div>
      </div>

      <div className="quick-stats">
        <div className="stat">
          <Tooltip text={TOOLTIPS.baseline}>
            <span className="stat-value">{baselinePeople.toLocaleString()}</span>
            <span className="stat-label">all-car baseline</span>
          </Tooltip>
        </div>
        <div className="stat">
          <Tooltip text={TOOLTIPS.vcRatio}>
            <span className={`stat-value ${sov.isCongested ? 'congested' : ''}`}>
              {sov.vcRatio.toFixed(2)}
            </span>
            <span className="stat-label">v/c ratio</span>
          </Tooltip>
        </div>
      </div>

      {mode === 'expert' && (
        <div className="expert-stats">
          <h4>Extended Metrics</h4>
          <div className="stat-grid">
            <div className="stat-row">
              <Tooltip text={TOOLTIPS.sqFt}>
                <span>sq ft / person</span>
              </Tooltip>
              <span>{sqFtPerPerson.toLocaleString()}</span>
            </div>
            <div className="stat-row">
              <span>SOV vehicles/hr</span>
              <span>{sov.vehiclesPerHour?.toLocaleString() || 0}</span>
            </div>
            {busLanes > 0 && (
              <div className="stat-row">
                <span>Buses/hr</span>
                <span>{bus.busesPerHour}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
