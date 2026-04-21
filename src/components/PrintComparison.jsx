import useSimStore from '../store/useSimStore';
import { calculateMetrics, speedLabel, speedColor } from '../model/trafficModel';

const TYPE_COLOR  = { sov: '#616875', bus: '#6b3535', bike: '#2d5a3d', parking: '#374151', buffer: '#a89340', tree: '#3a6b3a' };
const TYPE_LABEL  = { sov: 'Car lane', bus: 'Bus lane', bike: 'Bike lane', parking: 'Parking', buffer: 'Buffer', tree: 'Tree strip' };

function LaneBars({ lanes }) {
  return (
    <div className="print-lane-bar">
      {lanes.map((l, i) => (
        <div
          key={i}
          className="print-lane-seg"
          style={{ flex: l.widthFt, background: TYPE_COLOR[l.type] || '#555' }}
        >
          <span className="print-lane-label">{TYPE_LABEL[l.type]}<br />{l.widthFt}′</span>
        </div>
      ))}
    </div>
  );
}

function ScenarioCard({ title, snap, metrics }) {
  if (!snap) return null;
  const { totalPeople, sov, bus, bike, sovLanes, busLanes, bikeLanes, speedMph } = metrics;
  return (
    <div className="print-card">
      <h2 className="print-card-title">{title}</h2>
      <LaneBars lanes={snap.lanes} />
      <div className="print-card-meta">
        {snap.totalWidthFt}ft street · {snap.sidewalkWidthFt}ft sidewalks · {snap.oneWay ? 'One-way' : 'Two-way'}
      </div>
      <div className="print-stat-grid">
        <div className="print-stat">
          <span className="print-stat-val">{totalPeople.toLocaleString()}</span>
          <span className="print-stat-lbl">people/hour</span>
        </div>
        <div className="print-stat">
          <span className="print-stat-val" style={{ color: speedColor(speedMph) }}>{speedMph} mph</span>
          <span className="print-stat-lbl">car speed · {speedLabel(speedMph)}</span>
        </div>
        {sovLanes > 0 && (
          <div className="print-stat">
            <span className="print-stat-val">{sov.peoplePerHour.toLocaleString()}</span>
            <span className="print-stat-lbl">car passengers/hr</span>
          </div>
        )}
        {busLanes > 0 && (
          <div className="print-stat">
            <span className="print-stat-val">{bus.peoplePerHour.toLocaleString()}</span>
            <span className="print-stat-lbl">bus riders/hr</span>
          </div>
        )}
        {bikeLanes > 0 && (
          <div className="print-stat">
            <span className="print-stat-val">{bike.peoplePerHour.toLocaleString()}</span>
            <span className="print-stat-lbl">cyclists/hr</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PrintComparison() {
  const activeTab       = useSimStore(s => s.activeTab);
  const scenarios       = useSimStore(s => s.scenarios);
  const lanes           = useSimStore(s => s.lanes);
  const totalWidthFt    = useSimStore(s => s.totalWidthFt);
  const sidewalkWidthFt = useSimStore(s => s.sidewalkWidthFt);
  const timeOfDay       = useSimStore(s => s.timeOfDay);
  const busHeadway      = useSimStore(s => s.busHeadway);
  const busCapacity     = useSimStore(s => s.busCapacity);
  const modeShift       = useSimStore(s => s.modeShift);
  const oneWay          = useSimStore(s => s.oneWay);

  const currentSnap = { lanes, totalWidthFt, sidewalkWidthFt, timeOfDay, busHeadway, busCapacity, modeShift, oneWay };
  const sqSnap = activeTab === 'statusQuo' ? currentSnap : scenarios.statusQuo;
  const pSnap  = activeTab === 'proposed'  ? currentSnap : scenarios.proposed;

  const sqM = sqSnap ? calculateMetrics(sqSnap) : null;
  const pM  = pSnap  ? calculateMetrics(pSnap)  : null;

  const peopleDelta = sqM && pM ? pM.totalPeople - sqM.totalPeople : null;
  const pct = sqM && peopleDelta !== null && sqM.totalPeople > 0
    ? Math.round((peopleDelta / sqM.totalPeople) * 100) : null;

  return (
    <div className="print-comparison">
      <div className="print-masthead">
        <div className="print-title">Street Simulator — Analysis</div>
        <div className="print-url">{typeof window !== 'undefined' ? window.location.href : ''}</div>
      </div>

      <div className="print-columns">
        <ScenarioCard title="Status Quo" snap={sqSnap} metrics={sqM} />
        {pSnap && sqSnap && (
          <div className="print-divider-col">
            <div className={`print-impact ${peopleDelta >= 0 ? 'print-impact--pos' : 'print-impact--neg'}`}>
              <div className="print-impact-val">
                {peopleDelta >= 0 ? '+' : ''}{peopleDelta?.toLocaleString()} ppl/hr
              </div>
              <div className="print-impact-pct">({pct >= 0 ? '+' : ''}{pct}%)</div>
              <div className="print-impact-lbl">change in people moved per hour</div>
              <div className="print-impact-speed">
                car speed: {sqM?.speedMph} → {pM?.speedMph} mph
              </div>
            </div>
          </div>
        )}
        <ScenarioCard title="Proposed Design" snap={pSnap} metrics={pM} />
      </div>

      <div className="print-footer">
        Analysis by Street Simulator · streetsimulator.app · Model sources: HCM 6th Ed., NACTO Urban Street Design Guide
      </div>
    </div>
  );
}
