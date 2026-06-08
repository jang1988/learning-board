// ─── Fullscreen Utilities ─────────────────────────────────────────────────────

export async function enterFullscreen(): Promise<void> {
	try {
		await document.documentElement.requestFullscreen()
	} catch (e) {
		console.warn('Fullscreen blocked:', e)
	}
}

export async function exitFullscreen(): Promise<void> {
	if (!document.fullscreenElement) return
	try {
		await document.exitFullscreen()
	} catch (e) {
		console.warn('Exit fullscreen failed:', e)
	}
}
