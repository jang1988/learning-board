import { createClient } from '@/lib/supabase/server'

export async function getDashboardData(userId: string) {
	const supabase = await createClient()

	const [profileRes, topicsRes, recentRes] = await Promise.all([
		supabase
			.from('profiles')
			.select('id, full_name, role')
			.eq('id', userId)
			.maybeSingle(),

		supabase
			.from('topics')
			.select(`
				id,
				title,
				order_index,
				lessons(
					id,
					lesson_progress(status, user_id)
				)
			`)
			.order('order_index'),

		supabase
			.from('quiz_results')
			.select('*, quizzes(title, topics(title))')
			.eq('user_id', userId)
			.order('submitted_at', { ascending: false })
			.limit(3)
	])

	return {
		profile: profileRes.data,
		topics: topicsRes.data,
		recentResults: recentRes.data
	}
}