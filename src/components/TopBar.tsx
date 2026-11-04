const NAV = ['Home', 'Organization', 'Projects', 'Strategy', 'Knowledge']

export function TopBar({
  pending,
  onHome,
  onStub,
}: {
  pending: number
  onHome: () => void
  onStub: (what: string) => void
}) {
  return (
    <div className="topbar-wrap">
      <header className="topbar">
        <button className="brand" onClick={onHome} title="Back to the floor">
          <span className="brand-mark" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="26" height="26">
              <g fill="none" stroke="#7fb0ff" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2.4l8.3 4.8v9.6L12 21.6 3.7 16.8V7.2z" strokeOpacity=".55" />
                <path d="M8.4 15.4V8.6l3.6 4 3.6-4v6.8" />
              </g>
            </svg>
          </span>
          <span className="brand-text">
            <span className="brand-name">HELMARCHY</span>
            <span className="brand-sub">AI organization</span>
          </span>
        </button>

        <nav className="nav">
          {NAV.map((item, i) => (
            <button
              key={item}
              className={`nav-item ${i === 0 ? 'active' : ''}`}
              onClick={() => (i === 0 ? onHome() : onStub(item))}
            >
              {item}
            </button>
          ))}
        </nav>

        <div className="top-right">
          <div className="top-clock">
            <span className="day">DAY 142</span>
            <span className="clock">Mon 3 Nov · 09:42</span>
          </div>
          <button className="icon-btn" onClick={() => onStub('Search')} title="Search">
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.7">
              <circle cx="10.5" cy="10.5" r="6.5" />
              <path d="M15.4 15.4L20 20" strokeLinecap="round" />
            </svg>
          </button>
          <button className="icon-btn has-dot" onClick={() => onStub('Notifications')} title="Notifications">
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.7">
              <path d="M6.5 10a5.5 5.5 0 0111 0c0 4 1.5 5 1.5 5H5s1.5-1 1.5-5z" strokeLinejoin="round" />
              <path d="M10.5 18.5a1.7 1.7 0 003 0" strokeLinecap="round" />
            </svg>
          </button>
          <span className="avatar" title="James · Founder / CEO">
            J
          </span>
        </div>
      </header>

      <div className="kpis">
        <div className="kpi">
          <span className="kpi-label">Waiting on you</span>
          <span className="kpi-value accent">{pending}</span>
        </div>
        <div className="kpi">
          <span className="kpi-label">Spend today</span>
          <span className="kpi-value">$41.20</span>
        </div>
        <div className="kpi">
          <span className="kpi-label">Org health</span>
          <span className="kpi-value">
            87<span className="kpi-trend">↑ 8% this week</span>
          </span>
        </div>
        <div className="kpi-status">
          <span>
            <i className="dot s-working" /> 12 working
          </span>
          <span>
            <i className="dot s-blocked" /> 3 blocked
          </span>
          <span>
            <i className="dot s-idle" /> 9 idle
          </span>
        </div>
      </div>
    </div>
  )
}
