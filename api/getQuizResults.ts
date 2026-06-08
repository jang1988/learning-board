import type { SupabaseClient } from '@supabase/supabase-js'

export async function getQuizAttemptsCount(
	supabase: SupabaseClient,
	userId: string,
	quizId: string
) {
	const { count, error } = await supabase
		.from('quiz_results')
		.select('*', {
			count: 'exact',
			head: true
		})
		.eq('user_id', userId)
		.eq('quiz_id', quizId)

	if (error) {
		throw error
	}

	return count ?? 0
}