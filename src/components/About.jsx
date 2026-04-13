export default function About() {
  return (
    <section id="about" className="about-section">
      <div className="about-inner">
        <h2 className="section-title">About Street Simulator</h2>

        <div className="about-block about-block--highlight">
          <h3>New York City Is Redesigning Its Streets</h3>
          <p>
            In February 2025, Mayor Zohran Mamdani announced the revival of New York City's Streets
            Master Plan — a commitment to fundamentally rethink how the city's road space is
            allocated. The plan calls for dedicated bus lanes, protected bike lanes, and safer
            crossings on corridors across all five boroughs.
          </p>
          <p>
            Transportation Alternatives and other advocates are pushing for bold implementation:
            center-running bus rapid transit on five or more major routes, including Nostrand Avenue,
            Fordham Road, and Woodhaven Boulevard, and a goal of one million daily bike trips by 2030.
          </p>
          <p>
            Street Simulator was built to support that conversation — to give New Yorkers a way to
            see, in real numbers, what these changes actually mean for how many people can move
            through a street each hour.
          </p>
        </div>

        <div className="about-block">
          <h3>What the Numbers Show</h3>

          <div className="misconception">
            <p className="misconception-claim">"Removing a car lane will make traffic worse."</p>
            <p>
              New York City data consistently shows otherwise. When a lane is converted to a
              dedicated bus or protected bike lane, some trips shift modes. A single articulated bus
              carries 80 to 120 people — riders who would otherwise be spread across dozens of cars.
              Fewer cars on the remaining lanes often means those lanes move faster, not slower.
            </p>
          </div>

          <div className="misconception">
            <p className="misconception-claim">"Bike lanes are mostly empty."</p>
            <p>
              Protected bike infrastructure generates trips that weren't happening before. Research
              shows each new mile of protected bike lane in NYC produces roughly 1,100 additional
              daily bike trips, with 15–20% of those replacing vehicle trips entirely. And a
              protected lane can move 1,500 to 7,500 people per hour — often more than the car lane
              it replaced.
            </p>
          </div>

          <div className="misconception">
            <p className="misconception-claim">"Most New Yorkers want to keep car lanes."</p>
            <p>
              Polling consistently shows the opposite. 67% of NYC voters support protected bike
              lanes. 56% support dedicated bus lanes — a number that rises to 66% among the
              city's lowest-income residents, who rely most heavily on public transit. These are
              majority positions across every borough.
            </p>
          </div>

          <div className="misconception">
            <p className="misconception-claim">"Cars are essential — you can't ask people to give them up."</p>
            <p>
              Owning a car in New York City costs roughly $9,000 per year. A MetroCard costs about
              $1,500. Streets that make transit and biking faster and safer don't just move more
              people — they reduce the financial pressure on households that are stuck paying for
              cars because alternatives don't feel safe or reliable enough.
            </p>
          </div>
        </div>

        <div className="about-block">
          <h3>How to Use This Tool</h3>
          <ul className="how-to-list">
            <li>Change a lane by tapping the Car / Bus / Bike buttons below each lane in the simulator above</li>
            <li>The large number is total people moving through that block per hour — watch it change as you adjust lanes</li>
            <li>Try converting one car lane to a bus lane and see what happens to car speed</li>
            <li>Switch to Expert Mode to adjust bus frequency, ridership, time of day, and more</li>
            <li>Hover or tap any number for an explanation of where it comes from</li>
            <li>Share your configuration — the URL updates automatically to reflect the current setup</li>
          </ul>
        </div>

        <div className="about-block">
          <h3>Why This Tool Exists</h3>
          <p>
            Street redesign proposals are debated at community boards, in local press, and at
            kitchen tables across the city. Those debates are often shaped more by fear of change
            than by data — because the data has never been easy to interact with.
          </p>
          <p>
            This tool is built for community outreach and public education. It's meant to be used
            in conversations with neighbors, at town halls, or anywhere New Yorkers are asking what
            a proposed street change would actually mean for their block.
          </p>
          <p>
            The math comes from the same sources city agencies use: the Highway Capacity Manual,
            NACTO urban street design guidelines, and federal transit data. If you think an
            assumption is wrong, we want to hear it.
          </p>
          <p>
            Built by Jonathan Timm. Questions or feedback:{' '}
            <a href="mailto:jonathantimm@gmail.com">jonathantimm@gmail.com</a>
          </p>
        </div>

        <div className="about-block">
          <h3>Beyond Throughput</h3>
          <p>
            This tool focuses on people per hour because that's the number most often missing from
            street debates. But throughput is not the only reason cities redesign streets.
          </p>
          <p>
            Protected bike lanes and slower car speeds are consistently associated with fewer
            traffic deaths and serious injuries — for cyclists, pedestrians, and drivers alike.
            NYC has lost more than 200 New Yorkers to traffic violence every year for the past
            decade. Street design is a life-safety issue as much as a mobility one.
          </p>
          <p className="safety-links-note">
            Further reading:{' '}
            <a href="https://transalt.org" target="_blank" rel="noopener noreferrer">Transportation Alternatives</a>
            {' · '}
            <a href="https://nacto.org" target="_blank" rel="noopener noreferrer">NACTO Urban Street Design</a>
            {' · '}
            <a href="https://www1.nyc.gov/site/visionzero/index.page" target="_blank" rel="noopener noreferrer">NYC Vision Zero</a>
          </p>
        </div>
      </div>
    </section>
  );
}
