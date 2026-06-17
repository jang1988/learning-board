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

		quiz_results(*)
	`
		)
		.eq('id', userId)
		.single()

	return profile
}
