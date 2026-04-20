import useSimStore from '../store/useSimStore';

export default function ScenarioTabs() {
  const activeTab = useSimStore(s => s.activeTab);
  const scenarios = useSimStore(s => s.scenarios);
  const switchTab = useSimStore(s => s.switchTab);

  const proposedReady = scenarios.proposed !== null || activeTab === 'proposed';

  return (
    <div className="scenario-tabs-wrap">
      <div className="scenario-tabs" role="tablist">
        <button
          role="tab"
          aria-selected={activeTab === 'statusQuo'}
          className={`scenario-tab ${activeTab === 'statusQuo' ? 'active' : ''}`}
          onClick={() => switchTab('statusQuo')}
        >
          Status Quo
        </button>
        <button
          role="tab"
          aria-selected={activeTab === 'proposed'}
          className={`scenario-tab ${activeTab === 'proposed' ? 'active' : ''}`}
          onClick={() => switchTab('proposed')}
        >
          Proposed Design
          {!proposedReady && <span className="scenario-tab-badge">compare →</span>}
        </button>
      </div>
      {activeTab === 'proposed' && (
        <span className="scenario-editing-label">Editing Proposed Design</span>
      )}
    </div>
  );
}
