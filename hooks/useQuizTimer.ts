import { useEffect, useRef, useState } from 'react'

export function useQuizTimer(
	active: boolean,
	initialTime: number,
	onExpire: () => void,
	resetKey: number,
) {
	const [timer, setTimer] = useState({
		resetKey,
		timeLeft: initialTime,
	})
	const onExpireRef = useRef(onExpire)

	useEffect(() => {
		onExpireRef.current = onExpire
	}, [onExpire])

	const timeLeft = timer.resetKey === resetKey ? timer.timeLeft : initialTime

	useEffect(() => {
		if (!active) return

		if (timeLeft <= 0) {
			onExpireRef.current()
			return
		}

		const timer = setTimeout(() => {
			setTimer(prev => {
				const currentTime = prev.resetKey === resetKey ? prev.timeLeft : initialTime

				return {
					resetKey,
					timeLeft: Math.max(0, currentTime - 1),
				}
			})
		}, 1000)

		return () => clearTimeout(timer)
	}, [active, initialTime, resetKey, timeLeft])

	return { timeLeft }
}
