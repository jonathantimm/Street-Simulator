const SOURCES = [
  {
    source: 'Highway Capacity Manual, 6th Ed. (TRB, 2016)',
    usedFor: 'SOV lane capacity, saturation flow, v/c ratios',
    link: 'https://www.trb.org',
  },
  {
    source: 'NACTO Urban Street Design Guide (2016)',
    usedFor: 'Lane throughput benchmarks, design parameters',
    link: 'https://nacto.org/publication/urban-street-design-guide',
  },
  {
    source: 'NACTO Transit Street Design Guide (2016)',
    usedFor: 'Bus lane throughput, stop design',
    link: 'https://nacto.org',
  },
  {
    source: 'TCRP Report 165 (TRB, 2013)',
    usedFor: 'Bus capacity, load factors',
    link: 'https://www.trb.org',
  },
  {
    source: 'FTA Transit Capacity & Quality of Service Manual, 3rd Ed. (2013)',
    usedFor: 'Bus capacity guidelines',
    link: 'https://www.transit.dot.gov',
  },
  {
    source: 'National Household Travel Survey (NHTS) 2017',
    usedFor: 'Vehicle occupancy (1.1 persons/vehicle)',
    link: 'https://nhts.ornl.gov',
  },
  {
    source: 'NACTO Cycling Streets Data (2019)',
    usedFor: 'Mode shift assumptions for bike lanes',
    link: 'https://nacto.org',
  },
];

const MODEL_PARAMS = [
  { param: 'Saturation flow rate', value: '1,800 vehicles/hour/lane', source: 'HCM 6th Ed., §16' },
  { param: 'Urban arterial adjustment', value: '0.80 × saturation', source: 'HCM, signal/turning penalties' },
  { param: 'Effective green ratio', value: '0.50', source: 'Typical urban arterial signal' },
  { param: 'Vehicle occupancy (peak)', value: '1.1 persons/vehicle', source: 'NHTS 2017' },
  { param: 'Congestion onset', value: 'v/c > 0.85', source: 'HCM LOS D/E threshold' },
  { param: 'Standard bus capacity', value: '60 riders', source: 'FTA transit capacity guidelines' },
  { param: 'Articulated bus capacity', value: '100 riders', source: 'FTA transit capacity guidelines' },
  { param: 'Bus peak load factor', value: '0.85', source: 'TCRP Report 165' },
  { param: 'Bus operating speed', value: '12 mph avg (urban, with stops)', source: 'NACTO Bus Design Guide' },
  { param: 'Protected bike lane capacity', value: '1,500–2,000 cyclists/hour', source: 'NACTO Urban Street Design Guide' },
  { param: 'Mode shift default (bike)', value: '15% of displaced car demand', source: 'NACTO Cycling Streets 2019' },
  { param: 'Average cycling speed', value: '11 mph', source: 'Standard urban assumption' },
];

const LIMITATIONS = [
  'The model assumes a uniform block with no driveways, which slightly overstates car lane capacity.',
  'Mode shift assumptions for bikes are based on city-level research and may not reflect every local context.',
  'The model does not account for induced demand — adding capacity may attract new trips over time.',
  'Bus throughput depends heavily on frequency; the model shows potential throughput, not guaranteed outcomes.',
  'The model does not simulate pedestrians or turning movements, which affect intersection capacity.',
  'Real-world outcomes depend on implementation quality, enforcement, and local conditions.',
];

export default function Assumptions() {
  return (
    <section id="assumptions" className="assumptions-section">
      <div className="assumptions-inner">
        <h2 className="section-title">Assumptions & Methodology</h2>
        <p className="assumptions-intro">
          This simulation uses a macroscopic traffic flow model — essentially a well-parameterized
          calculator, not a real-time simulation of individual vehicles. All input values are drawn
          from standard transportation engineering references. The model is intentionally
          transparent: if you disagree with an assumption, you can see exactly where it comes from.
        </p>

        <h3>How the Numbers Are Calculated</h3>

        <div className="math-section">
          <div className="math-block">
            <h4 className="math-block-title">Car lane (SOV) people/hour</h4>
            <div className="math-steps">
              <div className="math-step">
                <span className="math-label">Saturation flow rate</span>
                <span className="math-value">1,800 vehicles/hr/lane</span>
                <span className="math-note">HCM 6th Ed. — theoretical max at ideal conditions</span>
              </div>
              <div className="math-step">
                <span className="math-label">× Arterial adjustment</span>
                <span className="math-value">× 0.80</span>
                <span className="math-note">Signal timing, turn penalties, urban conditions</span>
              </div>
              <div className="math-step">
                <span className="math-label">× Effective green ratio</span>
                <span className="math-value">× 0.50</span>
                <span className="math-note">Fraction of signal cycle available for through movement</span>
              </div>
              <div className="math-step">
                <span className="math-label">× Time-of-day factor</span>
                <span className="math-value">× 0.35–1.0</span>
                <span className="math-note">AM peak = 1.0, midday = 0.65, PM peak = 0.95, evening = 0.35</span>
              </div>
              <div className="math-result">
                <span>= vehicles/hr/lane</span>
                <span className="math-example">e.g. AM peak: 1,800 × 0.80 × 0.50 × 1.0 = <strong>720 vehicles/hr</strong></span>
              </div>
              <div className="math-step">
                <span className="math-label">× Vehicle occupancy</span>
                <span className="math-value">× 1.1 persons/vehicle</span>
                <span className="math-note">NHTS 2017 — average for urban peak trips</span>
              </div>
              <div className="math-result">
                <span>= people/hr/lane</span>
                <span className="math-example">720 × 1.1 = <strong>792 people/hr</strong></span>
              </div>
            </div>
            <p className="math-congestion-note">
              Congestion display: when volume/capacity ratio exceeds 0.85 (HCM LOS D/E threshold),
              animated vehicles slow and the speed indicator turns red.
            </p>
          </div>

          <div className="math-block">
            <h4 className="math-block-title">Bus lane people/hour</h4>
            <div className="math-steps">
              <div className="math-step">
                <span className="math-label">Buses per hour</span>
                <span className="math-value">= 60 ÷ headway (min)</span>
                <span className="math-note">e.g. 10-min headway → 6 buses/hr</span>
              </div>
              <div className="math-step">
                <span className="math-label">× Passenger capacity</span>
                <span className="math-value">60 or 100 riders/bus</span>
                <span className="math-note">Standard 40ft bus = 60; articulated 60ft = 100 (FTA)</span>
              </div>
              <div className="math-step">
                <span className="math-label">× Peak load factor</span>
                <span className="math-value">× 0.85</span>
                <span className="math-note">Average occupancy relative to capacity (TCRP Report 165)</span>
              </div>
              <div className="math-step">
                <span className="math-label">× Time-of-day factor</span>
                <span className="math-value">× 0.35–1.0</span>
                <span className="math-note">Same demand factors as SOV</span>
              </div>
              <div className="math-result">
                <span>= people/hr/lane</span>
                <span className="math-example">e.g. 10-min headway, standard bus, AM peak: 6 × 60 × 0.85 × 1.0 = <strong>306 people/hr</strong></span>
              </div>
            </div>
          </div>

          <div className="math-block">
            <h4 className="math-block-title">Bike lane people/hour</h4>
            <div className="math-steps">
              <div className="math-step">
                <span className="math-label">Base lane capacity</span>
                <span className="math-value">1,750 cyclists/hr</span>
                <span className="math-note">Midpoint of 1,500–2,000 range (NACTO Urban Street Design Guide)</span>
              </div>
              <div className="math-step">
                <span className="math-label">× Time-of-day factor</span>
                <span className="math-value">× 0.35–1.0</span>
                <span className="math-note">Same demand factors applied</span>
              </div>
              <div className="math-step">
                <span className="math-label">+ Mode shift riders</span>
                <span className="math-value">displaced car demand × shift %</span>
                <span className="math-note">Default 15% of people displaced from converted car lanes shift to bike (NACTO Cycling Streets 2019). Adjustable in Expert Mode.</span>
              </div>
              <div className="math-result">
                <span>= people/hr/lane</span>
                <span className="math-example">e.g. AM peak, 15% shift, 1 converted lane: (1,750 × 1.0) + (792 × 0.15) = <strong>1,869 people/hr</strong></span>
              </div>
            </div>
          </div>

          <div className="math-block">
            <h4 className="math-block-title">Speed display</h4>
            <p className="math-prose">
              Car speed is estimated from the volume-to-capacity (v/c) ratio. Below v/c 0.70,
              free-flow speed is shown (approximately 28 mph for a typical urban arterial). Above
              v/c 0.85, the HCM LOS D/E threshold, vehicles enter forced-flow conditions — the
              animation slows visibly and the speed indicator turns red. Between those thresholds,
              speed is interpolated linearly.
            </p>
          </div>
        </div>

        <h3>Model Parameters</h3>
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Parameter</th>
                <th>Value</th>
                <th>Source</th>
              </tr>
            </thead>
            <tbody>
              {MODEL_PARAMS.map(row => (
                <tr key={row.param}>
                  <td>{row.param}</td>
                  <td>{row.value}</td>
                  <td>{row.source}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h3>Sources</h3>
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Source</th>
                <th>Used For</th>
              </tr>
            </thead>
            <tbody>
              {SOURCES.map(row => (
                <tr key={row.source}>
                  <td>
                    <a href={row.link} target="_blank" rel="noopener noreferrer">{row.source}</a>
                  </td>
                  <td>{row.usedFor}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h3>Model Limitations</h3>
        <ul className="limitations-list">
          {LIMITATIONS.map((l, i) => <li key={i}>{l}</li>)}
        </ul>
      </div>
    </section>
  );
}
