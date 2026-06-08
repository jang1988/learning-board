import { useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { QuizAnswerDB, QuizMeta, QuizQuestion, SubmitResult, UserAnswers } from '@/types'

export interface UseQuizSubmissionParams {
	quiz: QuizMeta
	userId: string
	attemptNum: number
	userAnswers: UserAnswers
	questions: QuizQuestion[]
	startTimeRef: React.RefObject<number>
	finishedRef: React.RefObject<boolean> // ← единый флаг из QuizPlayer
}

export function useQuizSubmission({
	quiz,
	userId,
	attemptNum,
	userAnswers,
	questions,
	startTimeRef,
	finishedRef,
}: UseQuizSubmissionParams) {
	// Всегда актуальный userAnswers независимо от closure
	const userAnswersRef = useRef(userAnswers)
	useEffect(() => {
		userAnswersRef.current = userAnswers
	}, [userAnswers])

	const submit = async (): Promise<SubmitResult> => {
		if (finishedRef.current) return { passed: false, percent: 0, pending: false }
		finishedRef.current = true

		const answers = userAnswersRef.current
		const supabase = createClient()

		const autoQuestions = questions.filter(q => q.type !== 'text')
		const textQuestions = questions.filter(q => q.type === 'text')

		let allAnswers: QuizAnswerDB[] = []

		if (autoQuestions.length) {
			const { data } = await supabase
				.from('answers')
				.select('id, question_id, is_correct')
				.in('question_id', autoQuestions.map(q => q.id))

			allAnswers = (data ?? []) as QuizAnswerDB[]
		}

		let earned = 0

		for (const q of autoQuestions) {
			const correctIds = allAnswers
				.filter(a => a.question_id === q.id && a.is_correct)
				.map(a => a.id)
				.sort()

			const chosen = [...(answers[q.id] ?? [])].sort()

			if (correctIds.join(',') === chosen.join(',')) {
				earned += q.points ?? 1
			}
		}

		const maxScore = questions.reduce((sum, q) => sum + (q.points ?? 1), 0)
		const percent = maxScore > 0 ? Math.round((earned / maxScore) * 100) : 0

		const filledTextQuestions = textQuestions.filter(
			q => (answers[q.id]?.[0] ?? '').trim().length > 0,
		)
		const pending = filledTextQuestions.length > 0
		const passed = !pending && percent >= quiz.passing_score

		const spentTime = Math.floor((Date.now() - (startTimeRef.current ?? Date.now())) / 1000)

		const { data: result } = await supabase
			.from('quiz_results')
			.insert({
				user_id: userId,
				quiz_id: quiz.id,
				score: earned,
				max_score: maxScore,
				percent,
				passed,
				attempt_num: attemptNum,
				status: pending ? 'pending' : 'reviewed',
				time_spent_sec: spentTime,
			})
			.select('id')
			.single()

		if (result && filledTextQuestions.length) {
			await supabase.from('text_answers').insert(
				filledTextQuestions.map(q => ({
					quiz_result_id: result.id,
					question_id: q.id,
					user_id: userId,
					answer_text: (answers[q.id]?.[0] ?? '').trim(),
					is_correct: null,
				})),
			)
		}

		return { passed, percent, pending }
	}

	return { submit }
}