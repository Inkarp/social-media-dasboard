import { ArrowUpRight, Sparkles } from 'lucide-react'

/** @param {{ title: string, description?: string, actions?: import('react').ReactNode, accent?: import('@/lib/nav').SectionAccent }} props */
export function PageHeader({ title, description, actions, accent = 'forest' }) {
  return (
    <section className="studio-hero" data-accent={accent}>
      <div className="studio-hero-art" aria-hidden="true">
        <span className="orbit orbit-one" />
        <span className="orbit orbit-two" />
        <span className="orbit-core"><ArrowUpRight strokeWidth={1.2} /></span>
        <Sparkles className="orbit-spark" strokeWidth={1.3} />
      </div>
      <div className="studio-hero-copy">
        <span className="studio-eyebrow"><span /> INKARP SOCIAL STUDIO</span>
        <h2>{title}<span className="hero-period">.</span></h2>
        {description && <p>{description}</p>}
        {actions && <div className="mt-6 flex flex-wrap items-center gap-3">{actions}</div>}
      </div>
      <span className="hero-caption" aria-hidden="true">IDEAS INTO IMPACT &#8599;</span>
    </section>
  )
}
