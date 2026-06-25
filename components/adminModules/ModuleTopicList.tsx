'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'

import styles from '@/app/admin/modules/modules.module.css'

type ModuleTopic = {
	id: string
	order_index: number
	is_required: boolean
	topic: {
		id: string
		title: string
		description?: string | null
		cover_url?: string | null
	}
}

interface Props {
	items: ModuleTopic[]
}

export default function ModuleTopicList({ items }: Props) {
	const router = useRouter()
	const supabase = createClient()

	const [isPending, startTransition] = useTransition()

	const remove = async (id: string) => {
		const ok = confirm('Видалити тему з модуля?')

		if (!ok) return

		const { error } = await supabase
			.from('module_topics')
			.delete()
			.eq('id', id)

		if (error) {
			console.error(error)
			return
		}

		startTransition(() => router.refresh())
	}

	const sorted = [...items].sort(
		(a, b) => a.order_index - b.order_index
	)

	if (!sorted.length) {
		return (
			<div className={styles.emptyTopics}>
				У модулі ще немає тем
			</div>
		)
	}

	return (
		<div className={styles.topics}>
			{sorted.map(item => (
				<div
					key={item.id}
					className={styles.topicRow}
				>
					<div className={styles.topicView}>
						<div>
							<Link
								href={`/admin/topics/${item.topic.id}`}
								className={styles.topicTitle}
							>
								{item.topic.title}
							</Link>

							{item.topic.description && (
								<div className={styles.topicDescription}>
									{item.topic.description}
								</div>
							)}
						</div>

						<div className={styles.topicActions}>
							<button
								className={styles.deleteBtn}
								onClick={() =>
									remove(item.id)
								}
								disabled={isPending}
							>
								🗑
							</button>
						</div>
					</div>
				</div>
			))}
		</div>
	)
}