import { useEffect, useRef, useState } from 'react'

export function useQuizTimer(
	active: boolean,
	initialTime: number,
	onExpire: () => void,
	resetKey: number,
) {
	const [timeLeft, setTimeLeft] = useState(initialTime)
	const onExpireRef = useRef(onExpire)
	const resetKeyRef = useRef(resetKey)

	useEffect(() => {
		onExpireRef.current = onExpire
	}, [onExpire])

	// Сброс при смене вопроса
	useEffect(() => {
		resetKeyRef.current = resetKey
		setTimeLeft(initialTime)
	}, [resetKey, initialTime])

	useEffect(() => {
		if (!active) return

		const keyAtSchedule = resetKeyRef.current

		if (timeLeft <= 0) {
			if (keyAtSchedule === resetKeyRef.current) {
				onExpireRef.current()
			}
			return
		}

		const timer = setTimeout(() => {
			if (keyAtSchedule === resetKeyRef.current) {
				setTimeLeft(prev => prev - 1)
			}
		}, 1000)

		return () => clearTimeout(timer)
	}, [active, timeLeft, resetKey])

	return { timeLeft }
}