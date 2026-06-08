import type { SupabaseClient } from '@supabase/supabase-js'

export async function getQuizByTopicId(
	supabase: SupabaseClient,
	topicId: string
) {
	const { data, error } = await supabase
		.from('quizzes')
		.select(`
			*,
			questions(
				*,
				answers(*)
			)
		`)
		.eq('topic_id', topicId)
		.maybeSingle()

	if (error) {
		console.error(error)
		throw error
	}

	return data
}