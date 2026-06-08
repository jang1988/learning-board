import type { QuizMeta, QuizMetaSafe, QuizQuestion } from '@/types'

export function sanitizeQuiz(quiz: QuizMeta): QuizMetaSafe {
	return {
		...quiz,
		questions: [...(quiz.questions ?? [])]
			.sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
			.map((question: QuizQuestion) => ({
				...question,
				answers: [...(question.answers ?? [])]
					.sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
					.map(({ is_correct: _stripped, ...answer }) => answer)
			}))
	}
}
