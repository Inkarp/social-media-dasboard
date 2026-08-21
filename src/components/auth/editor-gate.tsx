'use client'

import type { ReactNode } from 'react'
import { useIsEditor } from '@/components/auth/editor-provider'

/**
 * Wraps a control that writes, inside an already-client tree. Viewers do not see it.
 *
 * Prefer <EditorOnly> in server components. Because this is a client component,
 * React serialises BOTH `children` and `fallback` into the flight payload — only
 * one renders, but both reach the browser. Fine for a button label; not fine for
 * anything a viewer should not have. <EditorOnly> never serialises the branch it
 * does not render.
 *
 * Neither is a security boundary. Row-level security is: the anon key cannot
 * write to any table, so a viewer who reconstructs a request by hand still gets
 * refused. What these components prevent is the worse experience — offering
 * someone a button that will fail.
 */
export function EditorGate({
  children,
  /** Shown to viewers instead. Use sparingly; usually absence is the right answer. */
  fallback = null,
}: {
  children: ReactNode
  fallback?: ReactNode
}) {
  return useIsEditor() ? <>{children}</> : <>{fallback}</>
}
