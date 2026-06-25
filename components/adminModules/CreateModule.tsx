'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'

import styles from './CreateModule.module.css'

export default function CreateModule() {
	const [title, setTitle] = useState('')
	const [description, setDescription] = useState('')
	const [isPending, startTransition] = useTransition()

	const supabase = createClient()
	const router = useRouter()

	const createModule = async () => {
		if (!title.trim()) return

		const { data: lastModules } = await supabase
			.from('modules')
			.select('order_index')
			.order('order_index', { ascending: false })
			.limit(1)

		const lastModule = lastModules?.[0]

		const nextOrder = (lastModule?.order_index ?? -1) + 1

		const { error } = await supabase.from('modules').insert({
			title,
			description,
			order_index: nextOrder
		})

		if (error) {
			console.error(error)
			return
		}

		setTitle('')
		setDescription('')

		startTransition(() => {
			router.refresh()
		})
	}

	return (
		<div className={styles.createCard}>
			<h3 className={styles.cardTitle}>Новий модуль</h3>

			<input
				className={styles.input}
				placeholder="Назва модуля"
				value={title}
				onChange={e => setTitle(e.target.value)}
			/>

			<textarea
				className={styles.textarea}
				rows={3}
				placeholder="Опис (необовʼязково)"
				value={description}
				onChange={e => setDescription(e.target.value)}
			/>

			<button
				className={styles.saveBtn}
				onClick={createModule}
				disabled={isPending}
			>
				{isPending ? 'Створення...' : 'Створити модуль'}
			</button>
		</div>
	)
}
