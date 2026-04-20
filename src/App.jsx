import Header from './components/Header';
import Intro from './components/Intro';
import StreetCanvas from './components/StreetCanvas';
import LaneControls from './components/LaneControls';
import Dashboard from './components/Dashboard';
import Onboarding from './components/Onboarding';
import About from './components/About';
import Assumptions from './components/Assumptions';
import Footer from './components/Footer';
import StickyCounter from './components/StickyCounter';
import ScenarioTabs from './components/ScenarioTabs';
import ComparisonBar from './components/ComparisonBar';
import PrintComparison from './components/PrintComparison';

export default function App() {
  return (
    <div className="app">
      <Header />
      <Intro />

      <main className="sim-section">
        <ScenarioTabs />
        <ComparisonBar />
        <div className="sim-layout">
          <div className="sim-left">
            <div id="onboarding-canvas">
              <StreetCanvas />
            </div>
            <LaneControls />
          </div>
          <div className="sim-right">
            <Dashboard />
          </div>
        </div>
      </main>

      <About />
      <Assumptions />
      <Footer />

      <Onboarding />
      <StickyCounter />
      <PrintComparison />
    </div>
  );
}
