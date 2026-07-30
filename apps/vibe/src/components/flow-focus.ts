'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useSyncExternalStore } from 'react'

import { isFocusedFlow, ownsBottomEdge } from './nav'

/**
 * Whether the current screen is a focused flow, for the screens whose route cannot say so on its own.
 *
 * The route is the default and it answers for every case but one: `deep-type/result` renders a paywall, a
 * refinement run and a paid report off the same URL, and only the free result among them is a browsing surface.
 * Reading the route alone would either leak two free quizzes into a payment screen or drop the navigation from a
 * result page. So the route decides and a screen may contradict it.
 *
 * A module-level value rather than context because the writer is a leaf of the page tree and the readers are the
 * header and the bottom navigation, which sit outside it. `null` means 'no screen has an opinion' and is what
 * the server snapshot returns, so prerendered HTML always matches the route rule and nothing flashes on hydrate.
 */
let override: boolean | null = null
const listeners = new Set<() => void>()

function emit() {
  for (const listener of listeners) {
    listener()
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener)

  return () => {
    listeners.delete(listener)
  }
}

function readOverride() {
  return override
}

function readServerOverride(): boolean | null {
  return null
}

/** Declares that this screen is (or is not) a focused flow, whatever its route says. Reverts on unmount. */
export function useFlowFocusOverride(focused: boolean) {
  useEffect(() => {
    override = focused
    emit()

    return () => {
      override = null
      emit()
    }
  }, [focused])
}

/** For the header: whether primary navigation should step aside. */
export function useFocusedFlow() {
  const pathname = usePathname()
  const declared = useSyncExternalStore(subscribe, readOverride, readServerOverride)

  return declared ?? isFocusedFlow(pathname)
}

/**
 * For the bottom island and for the clearance the page owes it. Both read the same hook so the pill and the
 * space under the content can never disagree.
 */
export function useBottomNavVisible() {
  const focused = useFocusedFlow()
  const pathname = usePathname()

  return !focused && !ownsBottomEdge(pathname)
}
