'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useTransition } from 'react'

import styles from '@/app/admin/modules/modules.module.css'

type Topic = {
	id: string
	title: string
}

interface Props {
	moduleId: string
	topics: Topic[]
	usedTopics: string[]
}

export default function TopicPicker({
	moduleId,
	topics,
	usedTopics
}: Props) {
	const router = useRouter()
	const supabase = createClient()

	const [selected, setSelected] = useState('')
	const [open, setOpen] = useState(false)
	const [isPending, startTransition] = useTransition()

	const availableTopics = topics.filter(
		t => !usedTopics.includes(t.id)
	)

	// click outside
	useEffect(() => {
		const handler = () => setOpen(false)
		window.addEventListener('click', handler)
		return () => window.removeEventListener('click', handler)
	}, [])

	const addTopic = async (topicId: string) => {
		if (!topicId) return

		const { data: last } = await supabase
			.from('module_topics')
			.select('order_index')
			.eq('module_id', moduleId)
			.order('order_index', { ascending: false })
			.limit(1)
			.maybeSingle()

		const nextOrder = (last?.order_index ?? -1) + 1

		const { error } = await supabase
			.from('module_topics')
			.insert({
				module_id: moduleId,
				topic_id: topicId,
				order_index: nextOrder,
				is_required: true
			})

		if (error) {
			console.error(error)
			return
		}

		setSelected('')
		setOpen(false)

		startTransition(() => {
			router.refresh()
		})
	}

	return (
		<div
			className={styles.dropdown}
			onClick={e => e.stopPropagation()}
		>
			<button
				className={styles.trigger}
				onClick={() => setOpen(v => !v)}
			>
				{selected
					? topics.find(t => t.id === selected)?.title
					: 'Оберіть тему'}
			</button>

			{open && (
				<div className={styles.menu}>
					{availableTopics.map(topic => (
						<div
							key={topic.id}
							className={styles.option}
							onClick={() => {
								setSelected(topic.id)
								addTopic(topic.id) // 🔥 ВАЖНО: сразу добавляем
							}}
						>
							{topic.title}
						</div>
					))}
				</div>
			)}
		</div>
	)
}