import useSimStore from '../store/useSimStore';
import { calculateMetrics, speedLabel, speedColor } from '../model/trafficModel';

const TYPE_COLOR = { sov: '#616875', bus: '#6b3535', bike: '#2d5a3d', parking: '#374151' };

function LaneBar({ lanes }) {
  const total = lanes.reduce((s, l) => s + l.widthFt, 0) || 1;
  return (
    <div className="cmp-lane-bar">
      {lanes.map((l, i) => (
        <div
          key={i}
          className="cmp-lane-seg"
          style={{ flex: l.widthFt, background: TYPE_COLOR[l.type] || '#555' }}
          title={`${l.type} ${l.widthFt}ft`}
        />
      ))}
    </div>
  );
}

export default function ComparisonBar() {
  const activeTab      = useSimStore(s => s.activeTab);
  const scenarios      = useSimStore(s => s.scenarios);
  const lanes          = useSimStore(s => s.lanes);
  const totalWidthFt   = useSimStore(s => s.totalWidthFt);
  const sidewalkWidthFt= useSimStore(s => s.sidewalkWidthFt);
  const timeOfDay      = useSimStore(s => s.timeOfDay);
  const busHeadway     = useSimStore(s => s.busHeadway);
  const busCapacity    = useSimStore(s => s.busCapacity);
  const modeShift      = useSimStore(s => s.modeShift);
  const oneWay         = useSimStore(s => s.oneWay);

  const currentSnap = { lanes, totalWidthFt, sidewalkWidthFt, timeOfDay, busHeadway, busCapacity, modeShift, oneWay };
  const sqSnap = activeTab === 'statusQuo' ? currentSnap : scenarios.statusQuo;
  const pSnap  = activeTab === 'proposed'  ? currentSnap : scenarios.proposed;

  if (!sqSnap || !pSnap) return null;

  const sqM = calculateMetrics(sqSnap);
  const pM  = calculateMetrics(pSnap);

  const peopleDelta = pM.totalPeople - sqM.totalPeople;
  const pct = sqM.totalPeople > 0 ? Math.round((peopleDelta / sqM.totalPeople) * 100) : 0;
  const speedDelta = pM.speedMph - sqM.speedMph;
  const improved = peopleDelta >= 0;

  return (
    <div className="comparison-bar">
      <div className="cmp-scenario">
        <div className="cmp-scenario-label">Status Quo</div>
        <LaneBar lanes={sqSnap.lanes} />
        <div className="cmp-people">{sqM.totalPeople.toLocaleString()} <span>ppl/hr</span></div>
        <div className="cmp-speed" style={{ color: speedColor(sqM.speedMph) }}>
          {sqM.speedMph} mph · {speedLabel(sqM.speedMph)}
        </div>
      </div>

      <div className={`cmp-delta ${improved ? 'cmp-delta--pos' : 'cmp-delta--neg'}`}>
        <div className="cmp-delta-label">Impact</div>
        <div className="cmp-delta-people">
          {peopleDelta >= 0 ? '+' : ''}{peopleDelta.toLocaleString()} ppl/hr
        </div>
        <div className="cmp-delta-pct">
          ({pct >= 0 ? '+' : ''}{pct}%)
        </div>
        <div className="cmp-delta-speed">
          car: {sqM.speedMph} → {pM.speedMph} mph
        </div>
      </div>

      <div className="cmp-scenario cmp-scenario--right">
        <div className="cmp-scenario-label">Proposed</div>
        <LaneBar lanes={pSnap.lanes} />
        <div className="cmp-people">{pM.totalPeople.toLocaleString()} <span>ppl/hr</span></div>
        <div className="cmp-speed" style={{ color: speedColor(pM.speedMph) }}>
          {pM.speedMph} mph · {speedLabel(pM.speedMph)}
        </div>
      </div>
    </div>
  );
}
