import { useState, useEffect, useCallback, useRef } from 'react';

const STEPS = [
  {
    id: 'canvas',
    targetId: 'onboarding-canvas',
    title: 'This is your street.',
    body: 'Every person moving through this block — by car, bus, or bike — is represented here. Watch what happens when you change the lanes.',
    preferBelow: true,
  },
  {
    id: 'counter',
    targetId: 'onboarding-counter',
    title: 'This is the number that matters.',
    body: 'It counts every person moving through this block each hour. Your goal: see how high you can get it.',
    preferBelow: true,
  },
  {
    id: 'lane',
    targetId: 'onboarding-lane',
    title: 'Try changing a lane.',
    body: 'Tap the bus or bike icon to convert a lane. Watch the counter — and the street — react.',
    preferBelow: false,
  },
  {
    id: 'breakdown',
    targetId: 'onboarding-breakdown',
    title: 'See who\'s moving.',
    body: 'The colored bars show how many people are in cars, buses, and bikes. The totals may surprise you.',
    preferBelow: false,
  },
  {
    id: 'mode',
    targetId: 'onboarding-mode-toggle',
    title: 'Want to go deeper?',
    body: 'Switch to Expert Mode to adjust bus frequency, time of day, and more. Or just keep experimenting here.',
    preferBelow: true,
  },
];

const STORAGE_KEY = 'street-sim-onboarding-done';
const PAD = 10; // padding around highlighted element
const TOOLTIP_W = 320;
const MARGIN = 12; // min gap from viewport edge

export default function Onboarding({ onComplete }) {
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(false);
  const [highlight, setHighlight] = useState(null); // {top,left,width,height}
  const [tooltipPos, setTooltipPos] = useState(null); // {top,left}
  const tooltipRef = useRef(null);

  const positionForStep = useCallback((stepIndex) => {
    const s = STEPS[stepIndex];
    const el = document.getElementById(s.targetId);
    if (!el) return;

    const rect = el.getBoundingClientRect();
    // Skip if the element is hidden (e.g. desktop-only elements on mobile)
    if (rect.width === 0 && rect.height === 0) return;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    const hl = {
      top: rect.top - PAD,
      left: rect.left - PAD,
      width: rect.width + PAD * 2,
      height: rect.height + PAD * 2,
    };
    setHighlight(hl);

    // Use actual tooltip height if we have a rendered ref, else a generous estimate
    const tooltipH = tooltipRef.current
      ? tooltipRef.current.getBoundingClientRect().height
      : 280;

    const spaceBelow = vh - rect.bottom - PAD - 8;
    const spaceAbove = rect.top - PAD - 8;

    let top;
    if (s.preferBelow && spaceBelow >= tooltipH + MARGIN) {
      top = rect.bottom + PAD + 8;
    } else if (spaceAbove >= tooltipH + MARGIN) {
      top = rect.top - PAD - 8 - tooltipH;
    } else if (spaceBelow >= spaceAbove) {
      // Not enough room either way — pick the bigger side and clamp
      top = rect.bottom + PAD + 8;
    } else {
      top = rect.top - PAD - 8 - tooltipH;
    }

    // Horizontally center on element, clamped to viewport
    let left = rect.left + rect.width / 2 - TOOLTIP_W / 2;
    left = Math.max(MARGIN, Math.min(vw - TOOLTIP_W - MARGIN, left));

    // Clamp vertically so the tooltip is always fully on screen
    top = Math.max(MARGIN, Math.min(vh - tooltipH - MARGIN, top));

    setTooltipPos({ top, left });
  }, []);

  // After the tooltip renders, measure its actual height and correct if overflowing
  useEffect(() => {
    if (!tooltipRef.current || !tooltipPos) return;
    const vh = window.innerHeight;
    const { bottom } = tooltipRef.current.getBoundingClientRect();
    if (bottom > vh - MARGIN) {
      const overflow = bottom - (vh - MARGIN);
      setTooltipPos(p => ({ ...p, top: Math.max(MARGIN, p.top - overflow) }));
    }
  }, [tooltipPos]);

  useEffect(() => {
    const done = localStorage.getItem(STORAGE_KEY);
    if (!done) {
      setTimeout(() => {
        setVisible(true);
        positionForStep(0);
      }, 700);
    }
  }, [positionForStep]);

  useEffect(() => {
    if (!visible) return;
    positionForStep(step);

    const handleResize = () => positionForStep(step);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [step, visible, positionForStep]);

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, '1');
    setVisible(false);
    onComplete?.();
  }

  function next() {
    if (step < STEPS.length - 1) {
      setStep(s => s + 1);
    } else {
      dismiss();
    }
  }

  function prev() {
    setStep(s => Math.max(0, s - 1));
  }

  if (!visible || !highlight || !tooltipPos) return null;

  const current = STEPS[step];

  return (
    <div className="onboarding-overlay" role="dialog" aria-modal="true" aria-label="Onboarding tour">
      {/* Clickable full-screen dismiss layer */}
      <div
        onClick={dismiss}
        style={{ position: 'fixed', inset: 0, zIndex: 200, pointerEvents: 'all' }}
      />
      {/* Backdrop with cutout using box-shadow — no inset, just the highlight rect */}
      <div
        className="onboarding-backdrop"
        style={{
          position: 'fixed',
          zIndex: 201,
          top: highlight.top,
          left: highlight.left,
          width: highlight.width,
          height: highlight.height,
          borderRadius: 8,
          boxShadow: `0 0 0 9999px rgba(0,0,0,0.45)`,
          pointerEvents: 'none',
        }}
      />
      {/* Highlight ring */}
      <div
        className="onboarding-highlight"
        style={{
          position: 'fixed',
          top: highlight.top,
          left: highlight.left,
          width: highlight.width,
          height: highlight.height,
          zIndex: 202,
          pointerEvents: 'none',
        }}
      />

      {/* Tooltip card */}
      <div
        ref={tooltipRef}
        className="onboarding-tooltip"
        style={{
          position: 'fixed',
          top: tooltipPos.top,
          left: tooltipPos.left,
          width: TOOLTIP_W,
          zIndex: 203,
          pointerEvents: 'auto',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div className="onboarding-header">
          <span className="onboarding-step">{step + 1} of {STEPS.length}</span>
          <button className="onboarding-skip" onClick={dismiss}>Skip</button>
        </div>
        <h3 className="onboarding-title">{current.title}</h3>
        <p className="onboarding-body">{current.body}</p>
        <div className="onboarding-nav">
          {step > 0 && (
            <button className="onboarding-btn secondary" onClick={prev}>Prev</button>
          )}
          <button className="onboarding-btn primary" onClick={next}>
            {step === STEPS.length - 1 ? 'Get started' : 'Next'}
          </button>
        </div>
        <div className="onboarding-dots">
          {STEPS.map((_, i) => (
            <span key={i} className={`dot ${i === step ? 'active' : ''}`} />
          ))}
        </div>
      </div>
    </div>
  );
}

export function retriggerOnboarding() {
  localStorage.removeItem(STORAGE_KEY);
  window.location.reload();
}
