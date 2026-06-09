import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

import { getTopics } from '@/api/getTopicsData'
import { enrichTopics } from '@/lib/manager/enrichTopics'

import { TopicCard } from '@/components/managerTopics/TopicCard'
import { TopicsEmpty } from '@/components/managerTopics/TopicsEmpty'
import { TopicsHeader } from '@/components/managerTopics/TopicsHeader'

import styles from './topics.module.css'

export default async function ManagerTopicsPage() {
	const supabase = await createClient()

	const {
		data: { user }
	} = await supabase.auth.getUser()

	if (!user) {
		redirect('/auth/login')
	}

	const topics = await getTopics()

	const enrichedTopics = enrichTopics(topics, user.id)

	return (
		<div className={styles.page}>
			<TopicsHeader />

			<div className={styles.grid}>
				{enrichedTopics.length > 0 ? (
					enrichedTopics.map((topic, index) => (
						<TopicCard
							key={topic.id}
							topic={topic}
							index={index}
						/>
					))
				) : (
					<TopicsEmpty />
				)}
			</div>
		</div>
	)
}
