import { useEffect } from 'react'

export function useQuizSecurity(enabled: boolean, onViolation: () => void) {
	// ── Tab visibility ──────────────────────────────────────────────────────
	useEffect(() => {
		if (!enabled) return

		const handler = () => {
			if (document.hidden) onViolation()
		}

		document.addEventListener('visibilitychange', handler)
		return () => document.removeEventListener('visibilitychange', handler)
	}, [enabled, onViolation])

	// ── Fullscreen exit ─────────────────────────────────────────────────────
	useEffect(() => {
		if (!enabled) return

		const handler = () => {
			if (!document.fullscreenElement) onViolation()
		}

		document.addEventListener('fullscreenchange', handler)
		return () => document.removeEventListener('fullscreenchange', handler)
	}, [enabled, onViolation])

	// ── History lock (back button) ──────────────────────────────────────────
	useEffect(() => {
		if (!enabled) return

		history.pushState(null, '', location.href)

		const handler = () => history.pushState(null, '', location.href)

		window.addEventListener('popstate', handler)
		return () => window.removeEventListener('popstate', handler)
	}, [enabled])

	// ── DevTools keyboard shortcuts (always blocked) ────────────────────────
	useEffect(() => {
		const handler = (e: KeyboardEvent) => {
			if (
				e.key === 'F12' ||
				(e.ctrlKey && e.shiftKey && e.key === 'I') ||
				(e.ctrlKey && e.key === 'u')
			) {
				e.preventDefault()
			}
		}

		window.addEventListener('keydown', handler)
		return () => window.removeEventListener('keydown', handler)
	}, [])
}
