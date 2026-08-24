'use client'

import { createContext, useContext } from 'react'
import { ANONYMOUS_VIEWER } from '@/lib/viewer'

/** @typedef {import('@/lib/viewer').Viewer} Viewer */

/**
 * Carries the viewer down to client components.
 *
 * The session is resolved once, on the server, in the root layout — so
 * <EditorGate> can decide synchronously on first render. Fetching it from the
 * browser instead would make every editing control flash into existence a beat
 * after the page paints.
 */
const ViewerContext = createContext(/** @type {Viewer} */ (ANONYMOUS_VIEWER))

/**
 * @param {{ viewer: Viewer, children: import('react').ReactNode }} props
 */
export function EditorProvider({ viewer, children }) {
  return <ViewerContext.Provider value={viewer}>{children}</ViewerContext.Provider>
}

/** @returns {Viewer} */
export function useViewer() {
  return useContext(ViewerContext)
}

/** @returns {boolean} */
export function useIsEditor() {
  return useContext(ViewerContext).isEditor
}
