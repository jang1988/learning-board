'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'

import styles from './ModuleCard.module.css'

import ModuleTopicList from './ModuleTopicList'
import TopicPicker from './TopicPicker'

type Topic = {
	id: string
	title: string
}

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

type Module = {
	id: string
	title: string
	description?: string | null
	order_index: number
	module_topics: ModuleTopic[]
}

interface Props {
	module: Module
	allTopics: Topic[]
}

export function ModuleCard({ module, allTopics }: Props) {
	const router = useRouter()
	const supabase = createClient()

	const [title, setTitle] = useState(module.title)
	const [description, setDescription] = useState(module.description ?? '')

	const [editing, setEditing] = useState(false)

	const [isPending, startTransition] = useTransition()

	const save = async () => {
		const { error } = await supabase
			.from('modules')
			.update({
				title,
				description
			})
			.eq('id', module.id)

		if (error) {
			console.error(error)
			return
		}

		setEditing(false)

		startTransition(() => router.refresh())
	}

	const removeModule = async () => {
		const ok = confirm('Видалити модуль?')

		if (!ok) return

		const { error } = await supabase.from('modules').delete().eq('id', module.id)

		if (error) {
			console.error(error)
			return
		}

		startTransition(() => router.refresh())
	}

	return (
		<div className={styles.card}>
			{editing ? (
				<>
					<input
						className={styles.input}
						value={title}
						onChange={e => setTitle(e.target.value)}
					/>

					<textarea
						className={styles.textarea}
						rows={3}
						value={description}
						onChange={e => setDescription(e.target.value)}
					/>

					<div className={styles.actions}>
						<button
							className={styles.saveBtn}
							onClick={save}
							disabled={isPending}
						>
							Зберегти
						</button>

						<button
							className={styles.cancelBtn}
							onClick={() => setEditing(false)}
						>
							Скасувати
						</button>
					</div>
				</>
			) : (
				<>
					<div className={styles.moduleHeader}>
						<div>
							<h2 className={styles.moduleTitle}>{module.title}</h2>

							{module.description && (
								<p className={styles.moduleDescription}>{module.description}</p>
							)}
						</div>

						<div className={styles.actions}>
							<button
								className={styles.deleteBtn}
								onClick={removeModule}
							>
								Видалити
							</button>
						</div>
					</div>

					<TopicPicker
						moduleId={module.id}
						topics={allTopics}
						usedTopics={module.module_topics.map(t => t.topic.id)}
					/>

					<ModuleTopicList items={module.module_topics} />
				</>
			)}
		</div>
	)
}
