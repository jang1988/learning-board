import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { mapEmployees } from '@/lib/admin/mapEmployees'

export async function getEmployees() {
	const supabase = await createClient()

	const {
		data: { user }
	} = await supabase.auth.getUser()

	if (!user) {
		redirect('/auth/login')
	}

	const { data: profile } = await supabase
		.from('profiles')
		.select('role')
		.eq('id', user.id)
		.single()

	if (profile?.role !== 'admin') {
		redirect('/manager/dashboard')
	}

	const [{ data: employees }, { count: topicsTotal }] = await Promise.all([
		supabase
			.from('profiles')
			.select(`
				*,
				topic_progress(status, topic_id),
				quiz_results(percent, passed, status)
			`)
			.eq('role', 'manager')
			.order('created_at', { ascending: false }),

		supabase
			.from('topics')
			.select('*', {
				count: 'exact',
				head: true
			})
	])

	return mapEmployees(
		employees ?? [],
		topicsTotal ?? 0
	)
}