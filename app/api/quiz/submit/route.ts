import { getQuizAttemptsCount } from '@/api/getQuizResults'
import { calculateQuizResult } from '@/lib/manager/calculateQuizResult'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import type { QuizAnswerDB, QuizMeta, QuizQuestion, SubmitResult, UserAnswers } from '@/types'
import { NextResponse } from 'next/server'

type SubmitQuizBody = {
	quizId?: string
	attemptNum?: number
	userAnswers?: UserAnswers
	forceFail?: boolean
	timeSpentSec?: number
}

type QuizForSubmit = QuizMeta & {
	max_attempts: number
	questions: (QuizQuestion & { answers?: QuizAnswerDB[] })[]
}

function badRequest(message: string, status = 400) {
	return NextResponse.json({ error: message }, { status })
}

function isUserAnswers(value: unknown): value is UserAnswers {
	if (!value || typeof value !== 'object' || Array.isArray(value)) return false

	return Object.values(value).every(
		answerIds =>
			Array.isArray(answerIds) &&
			answerIds.every(answerId => typeof answerId === 'string'),
	)
}

export async function POST(request: Request) {
	const supabase = await createClient()
	const {
		data: { user },
	} = await supabase.auth.getUser()

	if (!user) return badRequest('Unauthorized', 401)

	const body = (await request.json().catch(() => null)) as SubmitQuizBody | null

	if (!body?.quizId || typeof body.quizId !== 'string') {
		return badRequest('quizId is required')
	}

	if (!Number.isInteger(body.attemptNum) || (body.attemptNum ?? 0) < 1) {
		return badRequest('attemptNum must be a positive integer')
	}

	if (!isUserAnswers(body.userAnswers)) {
		return badRequest('userAnswers has an invalid shape')
	}

	const admin = createAdminClient()

	const { data: quiz, error: quizError } = await admin
		.from('quizzes')
		.select(
			`
			id,
			passing_score,
			max_attempts,
			questions(
				id,
				text,
				type,
				points,
				order_index,
				answers(id, question_id, text, is_correct, order_index)
			)
		`,
		)
		.eq('id', body.quizId)
		.maybeSingle()

	if (quizError) return badRequest(quizError.message, 500)
	if (!quiz) return badRequest('Quiz not found', 404)

	const typedQuiz = quiz as QuizForSubmit
	const attemptsDone = await getQuizAttemptsCount(admin, user.id, typedQuiz.id)
	const expectedAttempt = attemptsDone + 1

	if (body.attemptNum !== expectedAttempt || expectedAttempt > typedQuiz.max_attempts) {
		return badRequest('Quiz attempt is no longer available', 409)
	}

	const questions = typedQuiz.questions ?? []
	const maxScore = questions.reduce((sum, question) => sum + (question.points ?? 1), 0)
	const timeSpentSec = Math.max(0, Math.floor(body.timeSpentSec ?? 0))

	if (body.forceFail) {
		const { error } = await admin.from('quiz_results').insert({
			user_id: user.id,
			quiz_id: typedQuiz.id,
			score: 0,
			max_score: maxScore,
			percent: 0,
			passed: false,
			attempt_num: body.attemptNum,
			status: 'reviewed',
			time_spent_sec: timeSpentSec,
		})

		if (error) return badRequest(error.message, 500)

		return NextResponse.json({ passed: false, percent: 0, pending: false } satisfies SubmitResult)
	}

	const autoQuestions = questions.filter(question => question.type !== 'text')
	const textQuestions = questions.filter(question => question.type === 'text')
	const answers = autoQuestions.flatMap(question => question.answers ?? [])
	const result = calculateQuizResult({
		questions,
		answers,
		userAnswers: body.userAnswers,
	})

	const filledTextQuestions = textQuestions.filter(
		question => (body.userAnswers?.[question.id]?.[0] ?? '').trim().length > 0,
	)
	const pending = filledTextQuestions.length > 0
	const passed = !pending && result.percent >= typedQuiz.passing_score

	const { data: savedResult, error: insertError } = await admin
		.from('quiz_results')
		.insert({
			user_id: user.id,
			quiz_id: typedQuiz.id,
			score: result.earned,
			max_score: result.maxScore,
			percent: result.percent,
			passed,
			attempt_num: body.attemptNum,
			status: pending ? 'pending' : 'reviewed',
			time_spent_sec: timeSpentSec,
		})
		.select('id')
		.single()

	if (insertError) return badRequest(insertError.message, 500)

	if (savedResult && filledTextQuestions.length) {
		const { error } = await admin.from('text_answers').insert(
			filledTextQuestions.map(question => ({
				quiz_result_id: savedResult.id,
				question_id: question.id,
				user_id: user.id,
				answer_text: (body.userAnswers?.[question.id]?.[0] ?? '').trim(),
				is_correct: null,
			})),
		)

		if (error) return badRequest(error.message, 500)
	}

	return NextResponse.json({
		passed,
		percent: result.percent,
		pending,
	} satisfies SubmitResult)
}
