import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import AdminTopicEditor from './AdminTopicEditor'

export default async function AdminTopicPage({ params }: { params: Promise<{ id: string }> }) {
	const { id } = await params

	const supabase = await createClient()

	const {
		data: { user }
	} = await supabase.auth.getUser()
	if (!user) redirect('/auth/login')

	const { data: topic } = await supabase.from('topics').select('*').eq('id', id).maybeSingle()

	if (!topic) notFound()

	const { data: lessons } = await supabase
		.from('lessons')
		.select('*, materials(*)')
		.eq('topic_id', id)

	const { data: quiz } = await supabase
		.from('quizzes')
		.select('*, questions(*, answers(*))')
		.eq('topic_id', id)
		.maybeSingle()

	return (
		<AdminTopicEditor
			topic={topic}
			lessons={lessons ?? []}
			quiz={quiz ?? null}
		/>
	)
}
