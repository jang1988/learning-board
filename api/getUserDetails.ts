import { createClient } from '@/lib/supabase/server'

export async function getUserDetails(userId: string) {
	const supabase = await createClient()

	const { data: profile } = await supabase
		.from('profiles')
		.select(
			`
		id,
		full_name,
		department,

		topic_progress(
			id,
			status,
			started_at,
			completed_at,
			lessons_done,
			lessons_total,
			topic:topics(
				id,
				title
			)
		),

		lesson_progress(
			id,
			status,
			watch_time_sec,
			completed_at,
			lesson:lessons(
				id,
				title
			)
		),

		quiz_results(
			*,
				quiz:quizzes(
					id,
					title,
					passing_score,
					max_attempts,
					time_limit_sec,
					topic:topics(
						id,
						title
					)
		)
	)
	`
		)
		.eq('id', userId)
		.single()

	return profile
}
