import { redirect, notFound } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'

import { getQuizByTopicId } from '@/api/getQuizzes'
import { getQuizAttemptsCount } from '@/api/getQuizResults'
import { sanitizeQuiz } from '@/lib/manager/sanitizeQuiz'

import QuizPageClient from './QuizPageClient'

interface PageProps {
	params: Promise<{
		id: string
	}>
}

export default async function QuizPage({
	params
}: PageProps) {
	const { id } = await params

	if (!id) notFound()

	const supabase = await createClient()

	const {
		data: { user }
	} = await supabase.auth.getUser()

	if (!user) {
		redirect('/auth/login')
	}

	const quiz = await getQuizByTopicId(
		supabase,
		id
	)

	if (!quiz) {
		notFound()
	}

	const attemptsDone =
		await getQuizAttemptsCount(
			supabase,
			user.id,
			quiz.id
		)

	const attemptNum = attemptsDone + 1

	if (attemptNum > quiz.max_attempts) {
		redirect(`/manager/topics/${id}`)
	}

	return (
		<QuizPageClient
			quiz={sanitizeQuiz(quiz)}
			userId={user.id}
			topicId={id}
			attemptNum={attemptNum}
			attemptsLeft={
				quiz.max_attempts - attemptNum
			}
		/>
	)
}