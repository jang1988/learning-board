import { useEffect, useRef } from 'react'
import type { RefObject } from 'react'
import type { QuizMetaSafe, SubmitResult, UserAnswers } from '@/types'

export interface UseQuizSubmissionParams {
	quiz: QuizMetaSafe
	attemptNum: number
	userAnswers: UserAnswers
	startTimeRef: RefObject<number>
	finishedRef: RefObject<boolean> // ← единый флаг из QuizPlayer
}

type SubmitOptions = {
	forceFail?: boolean
}

export function useQuizSubmission({
	quiz,
	attemptNum,
	userAnswers,
	startTimeRef,
	finishedRef,
}: UseQuizSubmissionParams) {
	// Всегда актуальный userAnswers независимо от closure
	const userAnswersRef = useRef(userAnswers)
	useEffect(() => {
		userAnswersRef.current = userAnswers
	}, [userAnswers])

	const submit = async (options: SubmitOptions = {}): Promise<SubmitResult> => {
		if (finishedRef.current) return { passed: false, percent: 0, pending: false }
		finishedRef.current = true

		const spentTime = Math.floor((Date.now() - (startTimeRef.current ?? Date.now())) / 1000)

		const response = await fetch('/api/quiz/submit', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				quizId: quiz.id,
				attemptNum,
				userAnswers: userAnswersRef.current,
				forceFail: options.forceFail ?? false,
				timeSpentSec: spentTime,
			}),
		})

		if (!response.ok) {
			throw new Error('Failed to submit quiz')
		}

		return (await response.json()) as SubmitResult
	}

	return { submit }
}
