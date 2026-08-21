/**
 * Check that every `'use server'` file exports only async functions.
 *
 *   npm run verify:actions
 *
 * Next.js turns every export of a `'use server'` module into a callable server
 * endpoint, so exporting a type is fine (types vanish at compile time) but
 * exporting a constant, an object or a synchronous function is rejected.
 *
 * This exists because `next build` does NOT catch it. A file exporting a plain
 * object builds successfully and then throws at request time:
 *
 *   A "use server" file can only export async functions, found object.
 *
 * which means the broken page reaches production looking fine. Typecheck and
 * lint do not catch it either — it is a framework constraint, not a type error.
 * So it gets its own check.
 */

import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'

const ROOT = resolve(process.cwd(), 'src')

let failures = 0
let scanned = 0

function walk(dir: string): string[] {
  const found: string[] = []
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) found.push(...walk(full))
    else if (/\.tsx?$/.test(entry)) found.push(full)
  }
  return found
}

/** True when the file's first non-comment, non-blank line is the directive. */
function isUseServerFile(source: string): boolean {
  for (const raw of source.split(/\r?\n/)) {
    const line = raw.trim()
    if (line === '' || line.startsWith('//') || line.startsWith('/*') || line.startsWith('*')) {
      continue
    }
    return line === "'use server'" || line === '"use server"'
  }
  return false
}

console.log("\nScanning for 'use server' files")

for (const file of walk(ROOT)) {
  const source = readFileSync(file, 'utf8')
  if (!isUseServerFile(source)) continue

  scanned++
  const shown = relative(process.cwd(), file).replace(/\\/g, '/')
  const problems: string[] = []

  // Strip comments so a commented-out export is not reported.
  const code = source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split(/\r?\n/)
    .filter((line) => !line.trim().startsWith('//'))
    .join('\n')

  // `export type` / `export interface` are erased at compile time — allowed.
  const exportPattern = /^export\s+(.+)$/gm
  let match: RegExpExecArray | null

  while ((match = exportPattern.exec(code)) !== null) {
    const rest = (match[1] ?? '').trim()

    if (rest.startsWith('type ') || rest.startsWith('interface ')) continue
    if (rest.startsWith('async function ')) continue

    // `export { ... }` re-exports and `export default` need a closer look, but a
    // plain report is enough to prompt one.
    if (rest.startsWith('const ') || rest.startsWith('let ') || rest.startsWith('var ')) {
      problems.push(`exports a value, not an async function:  export ${rest.slice(0, 60)}`)
      continue
    }
    if (rest.startsWith('function ')) {
      problems.push(`exports a synchronous function:  export ${rest.slice(0, 60)}`)
      continue
    }
    if (rest.startsWith('class ')) {
      problems.push(`exports a class:  export ${rest.slice(0, 60)}`)
      continue
    }
    if (rest.startsWith('{')) {
      problems.push(`re-exports — confirm every name is an async function:  export ${rest.slice(0, 60)}`)
      continue
    }
    if (rest.startsWith('default ')) {
      problems.push(`default export — must be an async function:  export ${rest.slice(0, 60)}`)
      continue
    }
  }

  if (problems.length === 0) {
    console.log(`  ok    ${shown}`)
  } else {
    failures += problems.length
    console.log(`  FAIL  ${shown}`)
    for (const problem of problems) console.log(`          ${problem}`)
  }
}

if (scanned === 0) {
  console.log("  (no 'use server' files found)")
}

console.log(
  `\n${failures === 0 ? '✓' : '✗'} ${scanned} file(s) scanned, ${failures} problem(s)\n`,
)
process.exit(failures === 0 ? 0 : 1)
