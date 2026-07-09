import type { QuizAnswerRaw, QuizAnswerSafe, QuizMeta, QuizMetaSafe, QuizQuestion } from '@/types'

function sanitizeAnswer(answer: QuizAnswerRaw): QuizAnswerSafe {
	return {
		id: answer.id,
		question_id: answer.question_id,
		text: answer.text,
		order_index: answer.order_index,
	}
}

export function sanitizeQuiz(quiz: QuizMeta): QuizMetaSafe {
	return {
		...quiz,
		questions: [...(quiz.questions ?? [])]
			.sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
			.map((question: QuizQuestion) => ({
				...question,
				answers: [...(question.answers ?? [])]
					.sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
					.map(sanitizeAnswer)
			}))
	}
}
