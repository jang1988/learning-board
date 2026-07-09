import { redirect, notFound } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

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

	const admin = createAdminClient()

	const quiz = await getQuizByTopicId(
		admin,
		id
	)

	if (!quiz) {
		notFound()
	}

	const attemptsDone =
		await getQuizAttemptsCount(
			admin,
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
			topicId={id}
			attemptNum={attemptNum}
			attemptsLeft={
				quiz.max_attempts - attemptNum
			}
		/>
	)
}
