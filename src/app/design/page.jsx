const OPTIONS = [
  {
    href: '/design/option-1',
    name: 'Option 1 — Calibration',
    blurb: 'Dark instrument console. Tick-marked dials, amber/cyan signal colors, Space Grotesk + Space Mono.',
  },
  {
    href: '/design/option-2',
    name: 'Option 2 — Ledger',
    blurb: 'A bookkeeping register. Red-ink/black-ink balances, an allocation strip per brand, Public Sans + Roboto Mono.',
  },
  {
    href: '/design/option-3',
    name: 'Option 3 — Trade Ledger',
    blurb: 'A print/catalog production register. Serif masthead, ruled spec-sheet cards, Source Serif 4 + Inter + IBM Plex Mono.',
  },
]

export default function DesignIndex() {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        overflow: 'auto',
        zIndex: 9999,
        background: '#fff',
        color: '#111',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '64px 32px' }}>
        <p style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '.08em', color: '#888', margin: '0 0 8px' }}>
          Phase 2 — redesign proposals
        </p>
        <h1 style={{ fontSize: 28, margin: '0 0 8px' }}>Three directions</h1>
        <p style={{ color: '#555', margin: '0 0 40px', maxWidth: '58ch' }}>
          See <code>DESIGN.md</code> at the repo root for the full write-up — palette, type, signature
          element, and what each direction trades away. These pages are static previews only; nothing
          in the real app has been touched.
        </p>
        {OPTIONS.map((o) => (
          <a
            key={o.href}
            href={o.href}
            style={{
              display: 'block',
              border: '1px solid #ddd',
              borderRadius: 6,
              padding: '20px 22px',
              marginBottom: 14,
              textDecoration: 'none',
              color: 'inherit',
            }}
          >
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>{o.name}</div>
            <div style={{ fontSize: 13.5, color: '#666' }}>{o.blurb}</div>
          </a>
        ))}
      </div>
    </div>
  )
}
