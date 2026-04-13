import { retriggerOnboarding } from './Onboarding';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-links">
          <a href="mailto:jonathantimm@gmail.com">jonathantimm@gmail.com</a>
          <a href="https://github.com" target="_blank" rel="noopener noreferrer">GitHub</a>
          <button className="footer-link-btn" onClick={retriggerOnboarding}>Take the tour</button>
        </div>
        <p className="footer-attribution">
          Model assumptions based on HCM, NACTO, and FTA standards. Open source under MIT License.
        </p>
      </div>
    </footer>
  );
}
