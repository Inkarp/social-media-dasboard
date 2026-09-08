import { Atom, Dna, FlaskConical, Microscope, Orbit, TestTubeDiagonal } from 'lucide-react'

const particles = [Atom, Dna, FlaskConical, Orbit, TestTubeDiagonal, Microscope, Dna, Atom, Orbit, FlaskConical, TestTubeDiagonal, Atom]

/** Decorative, deterministic particles keep server and client markup identical. */
export function ScienceBackground() {
  return (
    <div className="science-background" aria-hidden="true" data-print="hide">
      {particles.map((Icon, index) => (
        <span
          key={index}
          className="science-particle"
          style={{
            left: `${4 + index * 8}%`,
            animationDuration: `${28 + (index % 5) * 7}s`,
            animationDelay: `-${index * 7 + 4}s`,
            width: `${24 + (index % 4) * 10}px`,
          }}
        >
          <Icon strokeWidth={1} />
        </span>
      ))}
    </div>
  )
}
