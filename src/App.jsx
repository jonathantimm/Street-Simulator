import Header from './components/Header';
import StreetCanvas from './components/StreetCanvas';
import LaneControls from './components/LaneControls';
import Dashboard from './components/Dashboard';
import Onboarding from './components/Onboarding';
import About from './components/About';
import Assumptions from './components/Assumptions';
import Footer from './components/Footer';
import StickyCounter from './components/StickyCounter';

export default function App() {
  return (
    <div className="app">
      <Header />

      <main className="sim-section">
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
    </div>
  );
}
