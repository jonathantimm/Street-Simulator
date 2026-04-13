import { useState } from 'react';
import useSimStore from '../store/useSimStore';

export default function Header() {
  const mode = useSimStore(s => s.mode);
  const setMode = useSimStore(s => s.setMode);
  const getShareURL = useSimStore(s => s.getShareURL);
  const [shareToast, setShareToast] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  function handleShare() {
    navigator.clipboard.writeText(getShareURL()).then(() => {
      setShareToast(true);
      setTimeout(() => setShareToast(false), 2000);
    });
  }

  return (
    <header className="header">
      <div className="header-inner">
        <div className="header-left">
          <span className="wordmark">Street Simulator</span>
        </div>

        <nav className="header-nav desktop-only">
          <div id="onboarding-mode-toggle" className="mode-toggle">
            <button
              className={`mode-btn ${mode === 'simple' ? 'active' : ''}`}
              onClick={() => setMode('simple')}
            >
              Simple
            </button>
            <button
              className={`mode-btn ${mode === 'expert' ? 'active' : ''}`}
              onClick={() => setMode('expert')}
            >
              Expert
            </button>
          </div>
          <a href="#assumptions" className="nav-link">Assumptions</a>
          <a href="#about" className="nav-link">About</a>
          <button className="share-btn" onClick={handleShare}>
            {shareToast ? 'Copied!' : 'Share'}
          </button>
        </nav>

        <div className="header-mobile mobile-only">
          <button className="share-btn" onClick={handleShare}>
            {shareToast ? '✓' : 'Share'}
          </button>
          <button className="hamburger" onClick={() => setMenuOpen(m => !m)} aria-label="Menu">
            ☰
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="mobile-menu">
          <div className="mode-toggle">
            <button
              className={`mode-btn ${mode === 'simple' ? 'active' : ''}`}
              onClick={() => { setMode('simple'); setMenuOpen(false); }}
            >
              Simple
            </button>
            <button
              className={`mode-btn ${mode === 'expert' ? 'active' : ''}`}
              onClick={() => { setMode('expert'); setMenuOpen(false); }}
            >
              Expert
            </button>
          </div>
          <a href="#assumptions" className="nav-link" onClick={() => setMenuOpen(false)}>Assumptions</a>
          <a href="#about" className="nav-link" onClick={() => setMenuOpen(false)}>About</a>
        </div>
      )}
    </header>
  );
}
