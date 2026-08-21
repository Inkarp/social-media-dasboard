'use client'

import { createContext, useContext, type ReactNode } from 'react'
import { ANONYMOUS_VIEWER, type Viewer } from '@/lib/viewer'

/**
 * Carries the viewer down to client components.
 *
 * The session is resolved once, on the server, in the root layout — so
 * <EditorGate> can decide synchronously on first render. Fetching it from the
 * browser instead would make every editing control flash into existence a beat
 * after the page paints.
 */
const ViewerContext = createContext<Viewer>(ANONYMOUS_VIEWER)

export function EditorProvider({ viewer, children }: { viewer: Viewer; children: ReactNode }) {
  return <ViewerContext.Provider value={viewer}>{children}</ViewerContext.Provider>
}

export function useViewer(): Viewer {
  return useContext(ViewerContext)
}

export function useIsEditor(): boolean {
  return useContext(ViewerContext).isEditor
}
