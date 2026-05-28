import { notFound, redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'

import { getTopicPageData } from '@/api/getTopicPageData'

import TopicPageClient from './TopicPageClient'

type Props = {
	params: Promise<{
		id: string
	}>
}

export default async function TopicPage({ params }: Props) {
	const { id } = await params

	const supabase = await createClient()

	const {
		data: { user }
	} = await supabase.auth.getUser()

	if (!user) {
		redirect('/auth/login')
	}

	const data = await getTopicPageData({
		topicId: id,
		userId: user.id
	})

	if (!data.topic) {
		notFound()
	}

	return (
		<TopicPageClient
			{...data}
			userId={user.id}
		/>
	)
}
