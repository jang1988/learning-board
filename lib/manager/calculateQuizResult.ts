import type { QuizAnswerDB, QuizQuestion, UserAnswers } from '@/types'

export function calculateQuizResult({
	questions,
	answers,
	userAnswers,
}: {
	questions: QuizQuestion[]
	answers: QuizAnswerDB[]
	userAnswers: UserAnswers
}): { earned: number; maxScore: number; percent: number } {
	const autoQuestions = questions.filter(q => q.type !== 'text')

	let earned = 0

	for (const q of autoQuestions) {
		const correctIds = answers
			.filter(a => a.question_id === q.id && a.is_correct)
			.map(a => a.id)
			.sort()

		const selected = [...(userAnswers[q.id] ?? [])].sort()

		if (correctIds.join(',') === selected.join(',')) {
			earned += q.points ?? 1 // ← was missing fallback
		}
	}

	const maxScore = questions.reduce((sum, q) => sum + (q.points ?? 1), 0)
	const percent = maxScore > 0 ? Math.round((earned / maxScore) * 100) : 0

	return { earned, maxScore, percent }
}