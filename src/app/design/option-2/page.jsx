import { Public_Sans, Roboto_Mono } from 'next/font/google'

const sans = Public_Sans({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--lg-sans' })
const mono = Roboto_Mono({ subsets: ['latin'], weight: ['400', '500'], variable: '--lg-mono' })

const ROWS = [
  { brand: 'Bruker', manager: 'B Krishna', target: 12, published: 12, planned: 0, pending: 0 },
  { brand: 'Heidolph', manager: 'Praveen Reddy', target: 10, published: 7, planned: 1, pending: 2 },
  { brand: 'Waters', manager: 'Anantha Chakravarthi', target: 14, published: 6, planned: 2, pending: 6 },
  { brand: 'Polyscience', manager: 'Praveen Reddy', target: 8, published: 0, planned: 0, pending: 8 },
  { brand: 'Radleys', manager: 'Praveen Reddy', target: 6, published: 6, planned: 0, pending: 0 },
]

/** @param {{ target: number, published: number, planned: number, pending: number }} props */
function Strip({ target, published, planned, pending }) {
  const pub = (published / target) * 100
  const pl = (planned / target) * 100
  const pd = (pending / target) * 100
  const balance = published - target
  return (
    <div className="lg-strip-wrap">
      <div className="lg-strip">
        <div className="lg-strip-seg" style={{ width: `${pub}%`, background: 'var(--lg-teal)' }} />
        <div className="lg-strip-seg" style={{ width: `${pl}%`, background: 'var(--lg-amber)' }} />
        <div className="lg-strip-seg" style={{ width: `${pd}%`, background: 'var(--lg-track)' }} />
      </div>
      <span className={`lg-num lg-balance ${balance < 0 ? 'lg-balance--red' : ''}`}>
        {balance < 0 ? `(${Math.abs(balance)})` : balance}
      </span>
    </div>
  )
}

export default function Option2() {
  return (
    <div className={`${sans.variable} ${mono.variable} lg-root`}>
      <style>{`
        .lg-root {
          position: fixed; inset: 0; overflow: auto; z-index: 9999;
          --lg-bg: #0D1117; --lg-surface: #151B23; --lg-raised: #1D2530;
          --lg-rule: rgba(255,255,255,.09); --lg-text: #E6E9EE; --lg-mist: #7C8797;
          --lg-red: #D9636B; --lg-teal: #2FB897; --lg-amber: #C9924A; --lg-track: #2C333D;
          background: var(--lg-bg); color: var(--lg-text);
          font-family: var(--lg-sans), sans-serif; font-size: 13.5px; line-height: 1.5;
        }
        .lg-root :focus-visible { outline: 2px solid var(--lg-teal); outline-offset: 2px; }
        .lg-num { font-family: var(--lg-mono), monospace; font-variant-numeric: tabular-nums; }
        .lg-shell { max-width: 1180px; margin: 0 auto; padding: 40px 32px 80px; }
        .lg-back { color: var(--lg-mist); text-decoration: none; font-size: 12px; display: inline-block; margin-bottom: 24px; }
        .lg-back:hover { color: var(--lg-text); }

        .lg-hero { border-bottom: 2px solid var(--lg-rule); padding-bottom: 20px; margin-bottom: 28px; display: flex; justify-content: space-between; align-items: flex-end; }
        .lg-mast { font-size: 11px; letter-spacing: .08em; text-transform: uppercase; color: var(--lg-mist); margin: 0 0 10px; }
        .lg-h1 { font-size: 26px; font-weight: 700; margin: 0 0 6px; }
        .lg-sub { color: var(--lg-mist); margin: 0; max-width: 46ch; font-size: 13px; }
        .lg-hero-bal { text-align: right; }
        .lg-hero-bal .lg-num { font-size: 24px; font-weight: 700; }
        .lg-hero-bal .lg-num.lg-balance--red { color: var(--lg-red); }
        .lg-hero-bal span.lg-lbl { display: block; color: var(--lg-mist); font-size: 11px; text-transform: uppercase; letter-spacing: .05em; }

        .lg-cards { display: grid; grid-template-columns: repeat(4,1fr); gap: 1px; background: var(--lg-rule); border: 1px solid var(--lg-rule); margin-bottom: 36px; }
        .lg-card { background: var(--lg-surface); padding: 16px 18px; }
        .lg-card .lg-num { font-size: 22px; font-weight: 600; display: block; }
        .lg-card .lg-lbl { color: var(--lg-mist); font-size: 11px; text-transform: uppercase; letter-spacing: .05em; }

        .lg-section-label { color: var(--lg-mist); font-size: 11px; text-transform: uppercase; letter-spacing: .07em; margin: 0 0 12px; }

        table.lg-table { width: 100%; border-collapse: collapse; margin-bottom: 36px; }
        .lg-table th { text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: .05em; color: var(--lg-mist); font-weight: 500; padding: 8px 12px; border-bottom: 1px solid var(--lg-rule); }
        .lg-table td { padding: 11px 12px; border-bottom: 1px solid var(--lg-rule); font-size: 13px; vertical-align: middle; }
        .lg-table tr:hover td { background: var(--lg-raised); }
        .lg-strip-wrap { display: flex; align-items: center; gap: 10px; }
        .lg-strip { flex: 1; height: 8px; border-radius: 1px; overflow: hidden; display: flex; background: var(--lg-track); min-width: 120px; }
        .lg-strip-seg { height: 100%; }
        .lg-balance { min-width: 34px; text-align: right; display: inline-block; }
        .lg-balance--red { color: var(--lg-red); }

        .lg-legend { display: flex; gap: 16px; margin-bottom: 20px; font-size: 12px; color: var(--lg-mist); }
        .lg-legend span { display: inline-flex; align-items: center; gap: 6px; }
        .lg-legend i { width: 8px; height: 8px; border-radius: 1px; display: inline-block; }

        .lg-row2 { display: grid; grid-template-columns: 1fr 340px; gap: 24px; }
        .lg-panel { background: var(--lg-surface); border: 1px solid var(--lg-rule); padding: 22px; }

        .lg-btn-row { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 20px; }
        .lg-btn { font-family: var(--lg-sans); font-size: 12.5px; font-weight: 600; padding: 8px 12px; border-radius: 2px; border: 1px solid transparent; cursor: pointer; white-space: nowrap; }
        .lg-btn--primary { background: var(--lg-teal); color: #06231A; }
        .lg-btn--primary:hover { background: #48d1af; }
        .lg-btn--secondary { background: transparent; border-color: var(--lg-rule); color: var(--lg-text); }
        .lg-btn--secondary:hover { background: var(--lg-raised); }
        .lg-btn--ghost { background: transparent; color: var(--lg-mist); }
        .lg-btn--ghost:hover { color: var(--lg-text); }
        .lg-btn--danger { background: transparent; border-color: var(--lg-red); color: var(--lg-red); }
        .lg-btn--danger:hover { background: rgba(217,99,107,.12); }

        .lg-field { margin-bottom: 14px; }
        .lg-field label { display: block; font-size: 11px; text-transform: uppercase; letter-spacing: .05em; color: var(--lg-mist); margin-bottom: 6px; }
        .lg-field input, .lg-field select { width: 100%; background: var(--lg-bg); border: 1px solid var(--lg-rule); border-radius: 2px; padding: 8px 10px; color: var(--lg-text); font-family: var(--lg-sans); font-size: 13px; }
        .lg-field input:focus, .lg-field select:focus { border-color: var(--lg-teal); outline: none; }
        .lg-hint { font-size: 11.5px; color: var(--lg-mist); margin-top: 6px; }
      `}</style>

      <div className="lg-shell">
        <a href="/design" className="lg-back">← Back to all directions</a>

        <div className="lg-hero">
          <div>
            <p className="lg-mast">Register · FY 2026-27</p>
            <h1 className="lg-h1">Posting ledger</h1>
            <p className="lg-sub">Every principal's balance against its yearly quota, posted quarter by quarter.</p>
          </div>
          <div className="lg-hero-bal">
            <span className="lg-num lg-balance--red">(19)</span>
            <span className="lg-lbl">Net against plan</span>
          </div>
        </div>

        <p className="lg-section-label">Summary</p>
        <div className="lg-cards">
          <div className="lg-card"><span className="lg-num">46</span><span className="lg-lbl">Brands</span></div>
          <div className="lg-card"><span className="lg-num">31</span><span className="lg-lbl">Published</span></div>
          <div className="lg-card"><span className="lg-num lg-balance--red">(19)</span><span className="lg-lbl">Deficit</span></div>
          <div className="lg-card"><span className="lg-num" style={{ color: 'var(--lg-teal)' }}>2</span><span className="lg-lbl">In surplus</span></div>
        </div>

        <div className="lg-row2">
          <div>
            <p className="lg-section-label">By principal</p>
            <div className="lg-legend">
              <span><i style={{ background: 'var(--lg-teal)' }} />Published</span>
              <span><i style={{ background: 'var(--lg-amber)' }} />Planned</span>
              <span><i style={{ background: 'var(--lg-track)' }} />Pending</span>
            </div>
            <table className="lg-table">
              <thead><tr><th>Brand</th><th>Manager</th><th>Target</th><th style={{ width: 220 }}>Allocation</th></tr></thead>
              <tbody>
                {ROWS.map((r) => (
                  <tr key={r.brand}>
                    <td>{r.brand}</td>
                    <td style={{ color: 'var(--lg-mist)' }}>{r.manager}</td>
                    <td className="lg-num">{r.target}</td>
                    <td><Strip {...r} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="lg-panel">
            <p className="lg-section-label">Actions &amp; input</p>
            <div className="lg-btn-row">
              <button className="lg-btn lg-btn--primary">Post entry</button>
              <button className="lg-btn lg-btn--secondary">Export</button>
              <button className="lg-btn lg-btn--ghost">Cancel</button>
              <button className="lg-btn lg-btn--danger">Reverse</button>
            </div>
            <div className="lg-field">
              <label htmlFor="c2-brand">Brand</label>
              <input id="c2-brand" placeholder="Search brand, manager or country" />
            </div>
            <div className="lg-field">
              <label htmlFor="c2-status">Balance</label>
              <select id="c2-status"><option>All balances</option><option>In surplus</option><option>In deficit</option></select>
              <p className="lg-hint">Deficit brands are the ones behind their yearly quota.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
