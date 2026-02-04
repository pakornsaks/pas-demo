import './App.css'

const highlights = [
  {
    title: 'Signal-first dashboards',
    description:
      'Compose the story before the charting. Build narrative blocks that line up with each decision.'
  },
  {
    title: 'Frictionless handoffs',
    description:
      'Share ready-to-use review packets that merge design, data, and delivery notes in one place.'
  },
  {
    title: 'Operational tempo',
    description:
      'Track momentum across launches with a single cadence board that stays light and readable.'
  }
]

const metrics = [
  { label: 'Launch window', value: '14 days' },
  { label: 'Live cohorts', value: '8 active' },
  { label: 'Weekly insights', value: '42 signals' }
]

const steps = [
  {
    title: 'Capture the pulse',
    detail: 'Centralize discovery notes, data pulls, and competitive scans in a single workspace.'
  },
  {
    title: 'Shape the narrative',
    detail: 'Arrange insights into a clear sequence that leadership can act on quickly.'
  },
  {
    title: 'Activate the rollout',
    detail: 'Ship a launch plan, monitor metrics, and feed learnings back into the loop.'
  }
]

function App() {
  return (
    <div className="page">
      <header className="hero" id="top">
        <nav className="nav">
          <div className="brand">
            <span className="brand-mark">PAS</span>
            <span className="brand-name">Product Atlas Studio</span>
          </div>
          <div className="nav-actions">
            <a className="nav-link" href="#features">
              Features
            </a>
            <a className="nav-link" href="#workflow">
              Workflow
            </a>
            <a className="nav-link" href="#insights">
              Insights
            </a>
            <button className="button ghost" type="button">
              View deck
            </button>
          </div>
        </nav>

        <div className="hero-grid">
          <div className="hero-copy">
            <span className="eyebrow">Launch orchestration for product teams</span>
            <h1>
              Build a launch narrative that is as clear as the data behind it.
            </h1>
            <p>
              PAS Demo is a focused workspace for aligning insight, design, and delivery. Turn
              fragmented updates into a crisp sequence your stakeholders can trust.
            </p>
            <div className="hero-actions">
              <button className="button primary" type="button">
                Start the demo
              </button>
              <button className="button secondary" type="button">
                Download overview
              </button>
            </div>
            <div className="hero-meta">
              <span>Next review: Feb 12</span>
              <span>Live briefing: 9:30 AM PT</span>
            </div>
          </div>

          <div className="hero-card" aria-label="Launch overview">
            <div className="hero-card-header">
              <span>Atlas Board</span>
              <span className="status">Live</span>
            </div>
            <div className="hero-card-body">
              <div className="hero-card-line">
                <span>Decision readiness</span>
                <strong>86%</strong>
              </div>
              <div className="hero-card-line">
                <span>Pipeline velocity</span>
                <strong>+18%</strong>
              </div>
              <div className="hero-card-line">
                <span>Signal quality</span>
                <strong>High</strong>
              </div>
            </div>
            <div className="hero-card-footer">
              <div>
                <p>Launch room</p>
                <h3>Falcon v2</h3>
              </div>
              <button className="button ghost small" type="button">
                Open
              </button>
            </div>
          </div>
        </div>
      </header>

      <main>
        <section className="metrics" id="insights">
          {metrics.map((metric) => (
            <div className="metric" key={metric.label}>
              <p>{metric.label}</p>
              <h3>{metric.value}</h3>
            </div>
          ))}
        </section>

        <section className="features" id="features">
          <div className="section-header">
            <h2>Everything you need to stage a confident launch.</h2>
            <p>
              Build the plan, align the narrative, and keep your partners in sync without the
              last-minute scramble.
            </p>
          </div>
          <div className="feature-grid">
            {highlights.map((item) => (
              <article className="feature" key={item.title}>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="workflow" id="workflow">
          <div className="section-header">
            <h2>A three-part workflow that keeps momentum high.</h2>
            <p>Move from raw insights to launch activation without switching tools.</p>
          </div>
          <div className="step-list">
            {steps.map((step, index) => (
              <div className="step" key={step.title}>
                <span className="step-number">0{index + 1}</span>
                <div>
                  <h3>{step.title}</h3>
                  <p>{step.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="footer">
        <div>
          <h2>Ready to walk through the demo?</h2>
          <p>Bring your next launch brief and we will map it live in PAS.</p>
        </div>
        <button className="button primary" type="button">
          Book a session
        </button>
      </footer>
    </div>
  )
}

export default App
