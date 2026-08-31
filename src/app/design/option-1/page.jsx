import { Space_Grotesk, Space_Mono } from 'next/font/google'

const grotesk = Space_Grotesk({ subsets: ['latin'], weight: ['400', '500', '700'], variable: '--cal-sans' })
const mono = Space_Mono({ subsets: ['latin'], weight: ['400', '700'], variable: '--cal-mono' })

const ROWS = [
  { brand: 'Bruker', manager: 'B Krishna', target: 12, published: 12, pct: 100 },
  { brand: 'Heidolph', manager: 'Praveen Reddy', target: 10, published: 7, pct: 70 },
  { brand: 'Waters', manager: 'Anantha Chakravarthi', target: 14, published: 6, pct: 43 },
  { brand: 'Polyscience', manager: 'Praveen Reddy', target: 8, published: 0, pct: 0 },
  { brand: 'Radleys', manager: 'Praveen Reddy', target: 6, published: 6, pct: 100 },
]

/** @param {{ pct: number }} props */
function Dial({ pct }) {
  const angle = -90 + (pct / 100) * 180
  return (
    <svg width="72" height="44" viewBox="0 0 72 44" className="cal-dial">
      <path d="M4 40 A32 32 0 0 1 68 40" fill="none" stroke="var(--cal-track)" strokeWidth="6" strokeLinecap="round" />
      <path
        d="M4 40 A32 32 0 0 1 68 40"
        fill="none"
        stroke={pct >= 100 ? 'var(--cal-cyan)' : 'var(--cal-amber)'}
        strokeWidth="6"
        strokeLinecap="round"
        strokeDasharray={`${(pct / 100) * 100.5} 200`}
      />
      <circle cx="36" cy="40" r="2.5" fill="var(--cal-mist)" />
      <line
        x1="36" y1="40"
        x2={36 + 26 * Math.cos((angle * Math.PI) / 180)}
        y2={40 + 26 * Math.sin((angle * Math.PI) / 180)}
        stroke="var(--cal-text)" strokeWidth="2" strokeLinecap="round"
      />
    </svg>
  )
}

export default function Option1() {
  return (
    <div className={`${grotesk.variable} ${mono.variable} cal-root`}>
      <style>{`
        .cal-root {
          position: fixed; inset: 0; overflow: auto; z-index: 9999;
          --cal-bg: #12161B; --cal-surface: #1B2129; --cal-raised: #232B34;
          --cal-hairline: rgba(255,255,255,.08); --cal-text: #EDEFF1; --cal-mist: #8A96A3;
          --cal-amber: #E8A33D; --cal-cyan: #4FC1E0; --cal-red: #E0524F; --cal-track: #2C3540;
          background: var(--cal-bg); color: var(--cal-text);
          font-family: var(--cal-sans), sans-serif; font-size: 14px; line-height: 1.5;
        }
        .cal-root :focus-visible { outline: 2px solid var(--cal-amber); outline-offset: 2px; }
        .cal-num { font-family: var(--cal-mono), monospace; font-variant-numeric: tabular-nums; }
        .cal-shell { max-width: 1180px; margin: 0 auto; padding: 40px 32px 80px; }
        .cal-back { color: var(--cal-mist); text-decoration: none; font-size: 12.5px; display: inline-block; margin-bottom: 24px; }
        .cal-back:hover { color: var(--cal-text); }
        .cal-hero { display: flex; justify-content: space-between; align-items: flex-end; gap: 24px; border-bottom: 1px solid var(--cal-hairline); padding-bottom: 24px; margin-bottom: 32px; }
        .cal-eyebrow { color: var(--cal-amber); font-size: 11px; letter-spacing: .04em; text-transform: uppercase; margin: 0 0 8px; font-weight: 700; }
        .cal-h1 { font-size: 32px; font-weight: 700; margin: 0 0 6px; letter-spacing: -0.01em; }
        .cal-sub { color: var(--cal-mist); font-size: 14px; margin: 0; max-width: 44ch; }
        .cal-hero-meta { text-align: right; }
        .cal-hero-meta .cal-num { font-size: 28px; font-weight: 700; display: block; }
        .cal-hero-meta span.cal-lbl { color: var(--cal-mist); font-size: 11px; text-transform: uppercase; letter-spacing: .06em; }

        .cal-section-label { color: var(--cal-mist); font-size: 11px; text-transform: uppercase; letter-spacing: .08em; margin: 0 0 14px; font-weight: 500; }

        .cal-cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 40px; }
        .cal-card { background: var(--cal-surface); border: 1px solid var(--cal-hairline); border-radius: 3px; padding: 18px; }
        .cal-card .cal-num { font-size: 26px; font-weight: 700; display: block; }
        .cal-card .cal-lbl { color: var(--cal-mist); font-size: 11px; text-transform: uppercase; letter-spacing: .06em; }
        .cal-card--dial { display: flex; align-items: center; justify-content: space-between; }

        table.cal-table { width: 100%; border-collapse: collapse; background: var(--cal-surface); border: 1px solid var(--cal-hairline); border-radius: 3px; overflow: hidden; margin-bottom: 40px; }
        .cal-table th { text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: .06em; color: var(--cal-mist); font-weight: 500; padding: 12px 16px; border-bottom: 1px solid var(--cal-hairline); }
        .cal-table td { padding: 13px 16px; border-bottom: 1px solid var(--cal-hairline); font-size: 13.5px; }
        .cal-table tr:last-child td { border-bottom: none; }
        .cal-table tr:hover td { background: var(--cal-raised); }
        .cal-brand-dot { width: 6px; height: 6px; border-radius: 50%; display: inline-block; margin-right: 8px; background: var(--cal-cyan); }

        .cal-row2 { display: grid; grid-template-columns: 1fr 320px; gap: 24px; }
        .cal-panel { background: var(--cal-surface); border: 1px solid var(--cal-hairline); border-radius: 3px; padding: 24px; }

        .cal-btn-row { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 22px; }
        .cal-btn { font-family: var(--cal-sans); font-size: 13px; font-weight: 500; padding: 9px 16px; border-radius: 3px; border: 1px solid transparent; cursor: pointer; }
        .cal-btn--primary { background: var(--cal-amber); color: #1B1300; }
        .cal-btn--primary:hover { background: #f2b158; }
        .cal-btn--secondary { background: transparent; border-color: var(--cal-hairline); color: var(--cal-text); }
        .cal-btn--secondary:hover { background: var(--cal-raised); }
        .cal-btn--ghost { background: transparent; color: var(--cal-mist); }
        .cal-btn--ghost:hover { color: var(--cal-text); }
        .cal-btn--danger { background: transparent; border-color: var(--cal-red); color: var(--cal-red); }
        .cal-btn--danger:hover { background: rgba(224,82,79,.12); }

        .cal-field { margin-bottom: 16px; }
        .cal-field label { display: block; font-size: 11px; text-transform: uppercase; letter-spacing: .06em; color: var(--cal-mist); margin-bottom: 7px; }
        .cal-field input, .cal-field select { width: 100%; background: var(--cal-bg); border: 1px solid var(--cal-hairline); border-radius: 3px; padding: 9px 12px; color: var(--cal-text); font-family: var(--cal-sans); font-size: 13.5px; }
        .cal-field input:focus, .cal-field select:focus { border-color: var(--cal-amber); outline: none; }
        .cal-hint { font-size: 12px; color: var(--cal-mist); margin-top: 6px; }
      `}</style>

      <div className="cal-shell">
        <a href="/design" className="cal-back">← Back to all directions</a>

        <div className="cal-hero">
          <div>
            <p className="cal-eyebrow">Console · FY 2026-27</p>
            <h1 className="cal-h1">Campaign readout</h1>
            <p className="cal-sub">Planned against published activity across every principal, calibrated to plan.</p>
          </div>
          <div className="cal-hero-meta">
            <span className="cal-num">63%</span>
            <span className="cal-lbl">Against plan</span>
          </div>
        </div>

        <p className="cal-section-label">Summary</p>
        <div className="cal-cards">
          <div className="cal-card"><span className="cal-num">46</span><span className="cal-lbl">Brands</span></div>
          <div className="cal-card"><span className="cal-num">31</span><span className="cal-lbl">Published</span></div>
          <div className="cal-card"><span className="cal-num" style={{ color: 'var(--cal-red)' }}>9</span><span className="cal-lbl">Pending</span></div>
          <div className="cal-card cal-card--dial">
            <div><span className="cal-num">63%</span><span className="cal-lbl">Completion</span></div>
            <Dial pct={63} />
          </div>
        </div>

        <div className="cal-row2">
          <div>
            <p className="cal-section-label">By principal</p>
            <table className="cal-table">
              <thead>
                <tr><th>Brand</th><th>Manager</th><th>Target</th><th>Published</th><th>Reading</th></tr>
              </thead>
              <tbody>
                {ROWS.map((r) => (
                  <tr key={r.brand}>
                    <td><span className="cal-brand-dot" style={{ background: r.pct >= 100 ? 'var(--cal-cyan)' : r.pct === 0 ? 'var(--cal-red)' : 'var(--cal-amber)' }} />{r.brand}</td>
                    <td style={{ color: 'var(--cal-mist)' }}>{r.manager}</td>
                    <td className="cal-num">{r.target}</td>
                    <td className="cal-num">{r.published}</td>
                    <td className="cal-num">{r.pct}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="cal-panel">
            <p className="cal-section-label">Actions &amp; input</p>
            <div className="cal-btn-row">
              <button className="cal-btn cal-btn--primary">Save changes</button>
              <button className="cal-btn cal-btn--secondary">Export</button>
              <button className="cal-btn cal-btn--ghost">Cancel</button>
              <button className="cal-btn cal-btn--danger">Delete</button>
            </div>
            <div className="cal-field">
              <label htmlFor="c1-brand">Brand</label>
              <input id="c1-brand" placeholder="Search brand, manager or country" />
            </div>
            <div className="cal-field">
              <label htmlFor="c1-status">Status</label>
              <select id="c1-status"><option>All statuses</option><option>On target</option><option>Behind</option></select>
              <p className="cal-hint">Filters apply to the table on the left instantly.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
