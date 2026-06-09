import { createClient } from '@/lib/supabase/server'

export async function getGlobalStats() {
	const supabase = await createClient()

	const [{ count: topicsTotal }, { count: lessonsTotal }] =
		await Promise.all([
			supabase.from('topics').select('*', {
				count: 'exact',
				head: true
			}),
			supabase.from('lessons').select('*', {
				count: 'exact',
				head: true
			})
		])

	return {
		topicsTotal: topicsTotal || 0,
		lessonsTotal: lessonsTotal || 0
	}
}