import { Source_Serif_4, Inter, IBM_Plex_Mono } from 'next/font/google'

const serif = Source_Serif_4({ subsets: ['latin'], weight: ['500', '600', '700'], variable: '--tl-serif' })
const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600'], variable: '--tl-sans' })
const plexMono = IBM_Plex_Mono({ subsets: ['latin'], weight: ['400', '500'], variable: '--tl-mono' })

const ROWS = [
  { brand: 'Bruker', manager: 'B Krishna', country: 'Germany', target: 12, published: 12, pct: 100 },
  { brand: 'Heidolph', manager: 'Praveen Reddy', country: 'Germany', target: 10, published: 7, pct: 70 },
  { brand: 'Waters', manager: 'Anantha Chakravarthi', country: 'United States', target: 14, published: 6, pct: 43 },
  { brand: 'Polyscience', manager: 'Praveen Reddy', country: 'United States', target: 8, published: 0, pct: 0 },
  { brand: 'Radleys', manager: 'Praveen Reddy', country: 'United Kingdom', target: 6, published: 6, pct: 100 },
]

function RegMark() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" className="tl-regmark" aria-hidden="true">
      <circle cx="7" cy="7" r="5.5" fill="none" stroke="currentColor" strokeWidth="1" />
      <line x1="7" y1="0" x2="7" y2="14" stroke="currentColor" strokeWidth="1" />
      <line x1="0" y1="7" x2="14" y2="7" stroke="currentColor" strokeWidth="1" />
    </svg>
  )
}

export default function Option3() {
  return (
    <div className={`${serif.variable} ${inter.variable} ${plexMono.variable} tl-root`}>
      <style>{`
        .tl-root {
          position: fixed; inset: 0; overflow: auto; z-index: 9999;
          --tl-paper: #F1F3EF; --tl-sheet: #FFFFFF; --tl-ink: #1F2A3A; --tl-rule: #D6D9CF;
          --tl-muted: #6B7267; --tl-forest: #2E6B4F; --tl-ochre: #B98A2E; --tl-slate: #3B5875;
          background: var(--tl-paper); color: var(--tl-ink);
          font-family: var(--tl-sans), sans-serif; font-size: 14px; line-height: 1.55;
        }
        .tl-root :focus-visible { outline: 2px solid var(--tl-forest); outline-offset: 2px; }
        .tl-num { font-family: var(--tl-mono), monospace; font-variant-numeric: tabular-nums; }
        .tl-shell { max-width: 1180px; margin: 0 auto; padding: 40px 32px 80px; }
        .tl-back { color: var(--tl-muted); text-decoration: none; font-size: 12.5px; display: inline-block; margin-bottom: 24px; }
        .tl-back:hover { color: var(--tl-ink); }

        .tl-hero { border-bottom: 2px solid var(--tl-ink); padding-bottom: 22px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: flex-end; }
        .tl-mast { font-family: var(--tl-sans); font-size: 11px; letter-spacing: .1em; text-transform: uppercase; color: var(--tl-forest); margin: 0 0 8px; font-weight: 600; }
        .tl-h1 { font-family: var(--tl-serif); font-size: 34px; font-weight: 600; margin: 0 0 8px; letter-spacing: -0.01em; }
        .tl-sub { color: var(--tl-muted); margin: 0; max-width: 48ch; font-size: 13.5px; }
        .tl-hero-meta { text-align: right; }
        .tl-hero-meta .tl-num { font-size: 26px; font-weight: 600; }
        .tl-hero-meta span.tl-lbl { display: block; color: var(--tl-muted); font-family: var(--tl-sans); font-size: 11px; text-transform: uppercase; letter-spacing: .05em; }

        .tl-section-label { font-family: var(--tl-sans); color: var(--tl-muted); font-size: 11px; text-transform: uppercase; letter-spacing: .08em; margin: 0 0 12px; font-weight: 600; }

        .tl-cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 38px; }
        .tl-spec { position: relative; background: var(--tl-sheet); border: 1px solid var(--tl-rule); padding: 16px 18px; }
        .tl-spec .tl-regmark { position: absolute; top: 8px; right: 8px; color: var(--tl-rule); }
        .tl-spec .tl-num { font-size: 24px; font-weight: 500; display: block; }
        .tl-spec .tl-lbl { font-family: var(--tl-sans); color: var(--tl-muted); font-size: 11px; text-transform: uppercase; letter-spacing: .05em; border-top: 1px solid var(--tl-rule); margin-top: 10px; padding-top: 8px; display: block; }

        table.tl-table { width: 100%; border-collapse: collapse; background: var(--tl-sheet); border: 1px solid var(--tl-rule); margin-bottom: 38px; }
        .tl-table th { font-family: var(--tl-sans); text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: .05em; color: var(--tl-muted); font-weight: 600; padding: 10px 14px; border-bottom: 1px solid var(--tl-ink); }
        .tl-table td { padding: 12px 14px; border-bottom: 1px solid var(--tl-rule); font-size: 13.5px; }
        .tl-table tr:last-child td { border-bottom: none; }
        .tl-table tr:hover td { background: var(--tl-paper); }
        .tl-swatch { width: 3px; height: 14px; display: inline-block; margin-right: 10px; vertical-align: -2px; }

        .tl-row2 { display: grid; grid-template-columns: 1fr 300px; gap: 24px; }
        .tl-panel { position: relative; background: var(--tl-sheet); border: 1px solid var(--tl-rule); padding: 22px; }
        .tl-panel .tl-regmark { position: absolute; top: 10px; right: 10px; color: var(--tl-rule); }

        .tl-btn-row { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 20px; font-family: var(--tl-sans); }
        .tl-btn { font-family: var(--tl-sans); font-size: 12.5px; font-weight: 600; padding: 9px 15px; border-radius: 1px; border: 1px solid transparent; cursor: pointer; }
        .tl-btn--primary { background: var(--tl-forest); color: #fff; }
        .tl-btn--primary:hover { background: #24573f; }
        .tl-btn--secondary { background: transparent; border-color: var(--tl-ink); color: var(--tl-ink); }
        .tl-btn--secondary:hover { background: var(--tl-paper); }
        .tl-btn--ghost { background: transparent; color: var(--tl-muted); }
        .tl-btn--ghost:hover { color: var(--tl-ink); }
        .tl-btn--danger { background: transparent; border-color: #A8433C; color: #A8433C; }
        .tl-btn--danger:hover { background: rgba(168,67,60,.08); }

        .tl-field { margin-bottom: 15px; font-family: var(--tl-sans); }
        .tl-field label { display: block; font-size: 11px; text-transform: uppercase; letter-spacing: .05em; color: var(--tl-muted); margin-bottom: 6px; font-weight: 600; }
        .tl-field input, .tl-field select { width: 100%; background: var(--tl-paper); border: 1px solid var(--tl-rule); border-radius: 1px; padding: 9px 11px; color: var(--tl-ink); font-family: var(--tl-sans); font-size: 13.5px; }
        .tl-field input:focus, .tl-field select:focus { border-color: var(--tl-forest); outline: none; }
        .tl-hint { font-size: 12px; color: var(--tl-muted); margin-top: 6px; font-family: var(--tl-sans); }
      `}</style>

      <div className="tl-shell">
        <a href="/design" className="tl-back">← Back to all directions</a>

        <div className="tl-hero">
          <div>
            <p className="tl-mast">Production register · FY 2026-27</p>
            <h1 className="tl-h1">Catalog activity</h1>
            <p className="tl-sub">Planned against published trade material across every principal, for 2026-27.</p>
          </div>
          <div className="tl-hero-meta">
            <span className="tl-num">63%</span>
            <span className="tl-lbl">Against plan</span>
          </div>
        </div>

        <p className="tl-section-label">Summary</p>
        <div className="tl-cards">
          <div className="tl-spec"><RegMark /><span className="tl-num">46</span><span className="tl-lbl">Brands</span></div>
          <div className="tl-spec"><RegMark /><span className="tl-num">31</span><span className="tl-lbl">Published</span></div>
          <div className="tl-spec"><RegMark /><span className="tl-num" style={{ color: 'var(--tl-ochre)' }}>9</span><span className="tl-lbl">Pending</span></div>
          <div className="tl-spec"><RegMark /><span className="tl-num" style={{ color: 'var(--tl-forest)' }}>63%</span><span className="tl-lbl">Completion</span></div>
        </div>

        <div className="tl-row2">
          <div>
            <p className="tl-section-label">By principal</p>
            <table className="tl-table">
              <thead><tr><th>Brand</th><th>Manager</th><th>Country</th><th>Target</th><th>Published</th></tr></thead>
              <tbody>
                {ROWS.map((r) => (
                  <tr key={r.brand}>
                    <td><span className="tl-swatch" style={{ background: r.pct >= 100 ? 'var(--tl-forest)' : r.pct === 0 ? '#A8433C' : 'var(--tl-ochre)' }} />{r.brand}</td>
                    <td style={{ color: 'var(--tl-muted)' }}>{r.manager}</td>
                    <td style={{ color: 'var(--tl-muted)' }}>{r.country}</td>
                    <td className="tl-num">{r.target}</td>
                    <td className="tl-num">{r.published}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="tl-panel">
            <RegMark />
            <p className="tl-section-label">Actions &amp; input</p>
            <div className="tl-btn-row">
              <button className="tl-btn tl-btn--primary">Save changes</button>
              <button className="tl-btn tl-btn--secondary">Export</button>
              <button className="tl-btn tl-btn--ghost">Cancel</button>
              <button className="tl-btn tl-btn--danger">Delete</button>
            </div>
            <div className="tl-field">
              <label htmlFor="c3-brand">Brand</label>
              <input id="c3-brand" placeholder="Search brand, manager or country" />
            </div>
            <div className="tl-field">
              <label htmlFor="c3-status">Status</label>
              <select id="c3-status"><option>All statuses</option><option>On target</option><option>Behind</option></select>
              <p className="tl-hint">Filters apply to the register on the left instantly.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
