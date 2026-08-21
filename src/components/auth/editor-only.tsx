import 'server-only'

import type { ReactNode } from 'react'
import { getViewer } from '@/lib/auth'

/**
 * Server-side counterpart to <EditorGate>. Prefer this one.
 *
 * Why both exist:
 *
 * <EditorGate> is a client component, so React serialises BOTH its `children`
 * and its `fallback` into the flight payload — only one renders, but both travel
 * to the browser. For a button labelled "Add post" that costs nothing and leaks
 * nothing. For anything an editor should see and a viewer should not, it would
 * quietly ship the very thing you meant to withhold.
 *
 * <EditorOnly> resolves the session on the server and never serialises the
 * branch it does not render. Use it in server components — which is most
 * page-level toolbars and action buttons. Reach for <EditorGate> only inside an
 * already-client tree, where a server component cannot go.
 *
 * Neither is a security boundary. Row-level security is: the anon key cannot
 * write to any table, so a viewer who hand-crafts the request is still refused.
 * These components exist so nobody is offered a button that would fail.
 */
export async function EditorOnly({
  children,
  fallback = null,
}: {
  children: ReactNode
  fallback?: ReactNode
}) {
  const { isEditor } = await getViewer()
  return <>{isEditor ? children : fallback}</>
}
