import { useState, useEffect } from 'react';
import useSimStore from '../store/useSimStore';
import { calculateMetrics, speedColor } from '../model/trafficModel';

function laneSummary(lanes) {
  const counts = { sov: 0, bus: 0, bike: 0 };
  lanes.forEach(l => { const t = l.type || l; if (counts[t] !== undefined) counts[t]++; });
  const parts = [];
  if (counts.sov > 0) parts.push(`${counts.sov} car`);
  if (counts.bus > 0) parts.push(`${counts.bus} bus`);
  if (counts.bike > 0) parts.push(`${counts.bike} bike`);
  return parts.join(' · ');
}

export default function StickyCounter() {
  const [show, setShow] = useState(false);

  const lanes       = useSimStore(s => s.lanes);
  const timeOfDay   = useSimStore(s => s.timeOfDay);
  const busHeadway  = useSimStore(s => s.busHeadway);
  const busCapacity = useSimStore(s => s.busCapacity);
  const modeShift   = useSimStore(s => s.modeShift);
  const metrics     = calculateMetrics({ lanes, timeOfDay, busHeadway, busCapacity, modeShift });

  useEffect(() => {
    const target = document.getElementById('dashboard');
    if (!target) return;

    const observer = new IntersectionObserver(
      ([entry]) => setShow(!entry.isIntersecting),
      { threshold: 0, rootMargin: '0px' }
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  if (!show) return null;

  const { totalPeople, sov, sovLanes } = metrics;
  const color = sovLanes > 0 ? speedColor(sov.speedMph) : '#16a34a';
  const summary = laneSummary(lanes);

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <button
      className="sticky-counter"
      aria-live="polite"
      aria-label="Scroll to top to adjust lanes"
      onClick={scrollToTop}
    >
      <div className="sticky-counter-inner">
        <div className="sticky-lane-summary">{summary}</div>
        <div className="sticky-divider" />
        <div className="sticky-people">
          <span className="sticky-number">{totalPeople.toLocaleString()}</span>
          <span className="sticky-label">people/hr</span>
        </div>
        {sovLanes > 0 && (
          <div className="sticky-speed" style={{ color }}>
            {sov.speedMph} mph
          </div>
        )}
        <div className="sticky-cta">↑ adjust lanes</div>
      </div>
    </button>
  );
}
