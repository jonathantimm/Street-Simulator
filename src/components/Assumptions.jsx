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
  {
    source: 'Cairns et al., "Traffic Impact of Highway Capacity Reductions" (1998)',
    usedFor: 'Traffic evaporation — 30–40% of car trips disappear when road capacity is reduced',
    link: 'https://www.vtpi.org',
  },
  {
    source: 'Ha et al., "The effects of the Cheonggyecheon stream restoration on traffic in Seoul" (2007)',
    usedFor: 'Traffic evaporation — observed after urban freeway removal',
    link: 'https://www.vtpi.org',
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
  { param: 'Traffic evaporation multiplier', value: '0.6 + 0.4 × (car lane fraction)', source: 'Cairns et al. 1998; Ha et al. 2007; VTPI TDM Encyclopedia' },
  { param: 'Mode shift default (bike)', value: '25% of displaced car demand', source: 'NACTO Cycling Streets 2019; NYC DOT' },
  { param: 'Average cycling speed', value: '11 mph', source: 'Standard urban assumption' },
];

const LIMITATIONS = [
  'The model assumes a uniform block with no driveways, which slightly overstates car lane capacity.',
  'Mode shift and traffic evaporation estimates are based on observed city-level outcomes and may not reflect every local context. Neighborhoods with low transit access or high car dependency may see less evaporation.',
  'The model captures traffic evaporation (fewer car lanes → less car demand) but does not simulate long-run induced demand in the other direction — adding car capacity may attract new car trips over time, a well-documented but harder-to-quantify effect.',
  'Bus throughput depends heavily on frequency and stop design; the model shows potential throughput at a given headway, not a guaranteed outcome.',
  'The model does not simulate pedestrians, cyclists interacting with turning vehicles, or intersection capacity constraints.',
  'Real-world outcomes depend on implementation quality, enforcement, and local land use patterns.',
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
                <span className="math-note">Default 25% of people displaced from converted car lanes shift specifically to bike (NACTO Cycling Streets 2019, NYC DOT). Adjustable in Expert Mode.</span>
              </div>
              <div className="math-result">
                <span>= people/hr/lane</span>
                <span className="math-example">e.g. AM peak, 25% shift, 1 converted lane: (1,750 × 1.0) + (792 × 0.25) = <strong>1,948 people/hr</strong></span>
              </div>
            </div>
          </div>

          <div className="math-block">
            <h4 className="math-block-title">Car speed and the corridor demand model</h4>
            <p className="math-prose">
              Car speed is estimated from the volume-to-capacity (v/c) ratio of the remaining
              car lanes. The model uses a three-step process to estimate how many vehicles
              actually compete for those lanes.
            </p>
            <div className="math-steps">
              <div className="math-step">
                <span className="math-label">Step 1 — Baseline corridor demand</span>
                <span className="math-value">total lanes × 720 veh/hr × 0.65 × time factor</span>
                <span className="math-note">Represents realistic vehicle demand for the full corridor width at typical urban arterial loading (CORRIDOR_BASE_VC = 0.65)</span>
              </div>
              <div className="math-step">
                <span className="math-label">× Traffic evaporation multiplier</span>
                <span className="math-value">0.6 + 0.4 × (car lanes ÷ total lanes)</span>
                <span className="math-note">
                  When car lanes are replaced, not all displaced drivers simply pile onto
                  remaining car lanes — research on road removals and lane reductions
                  consistently shows 30–40% of car trips disappear entirely (mode shift,
                  trip consolidation, route change). This multiplier ranges from 1.0 on an
                  all-car street to 0.6 if every lane were non-car. Sources: London
                  Embankment study (Cairns et al. 1998), Seoul Cheonggyecheon freeway
                  removal (Ha et al. 2007), VTPI TDM Encyclopedia.
                </span>
              </div>
              <div className="math-step">
                <span className="math-label">− Bus ridership (vehicles equivalent)</span>
                <span className="math-value">bus passengers/hr ÷ 1.1 occupancy</span>
                <span className="math-note">Every person on the bus is one fewer person who would otherwise drive. The model removes these vehicle-equivalents from car demand.</span>
              </div>
              <div className="math-step">
                <span className="math-label">− Additional mode shift (slider)</span>
                <span className="math-value">displaced car capacity × shift % ÷ 1.1</span>
                <span className="math-note">The Expert Mode slider controls the share of remaining displaced car demand that shifts specifically to cycling.</span>
              </div>
              <div className="math-result">
                <span>= remaining vehicle demand on car lanes → v/c ratio → speed</span>
                <span className="math-example">Below v/c 0.85 (HCM LOS D/E): free-flow (~28 mph). Above: speed drops linearly to ~4 mph at deep congestion.</span>
              </div>
            </div>
            <div className="math-insight">
              <strong>Key result:</strong> A well-designed street with one car lane, one dedicated
              bus lane, and one protected bike lane can produce <em>faster car speeds</em> than an
              all-car street — even with fewer car lanes. Bus and bike infrastructure removes
              enough vehicle demand (through evaporation and direct mode shift) that the remaining
              car lane operates below congestion threshold. The all-car street, by contrast,
              concentrates all trips into cars, the least space-efficient mode, and pushes every
              lane toward its capacity. Those who must drive are better served by a street that
              gives alternatives to those who don't.
            </div>
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
