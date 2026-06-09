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

			lesson_progress(*),
			quiz_results(*)
		`
		)
		.eq('id', userId)
		.single()

	return profile
}