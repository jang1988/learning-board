'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import styles from './new.module.css'

export default function NewTopicPage() {
	const router = useRouter()
	const [form, setForm] = useState({
		title: '',
		description: '',
		is_required: true,
		order_index: 0
	})
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState('')

	const update =
		(field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
			setForm(prev => ({ ...prev, [field]: e.target.value }))

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		setLoading(true)
		setError('')

		const supabase = createClient()
		const {
			data: { user }
		} = await supabase.auth.getUser()

		const { data: topic, error: err } = await supabase
			.from('topics')
			.insert({
				title: form.title,
				description: form.description || null,
				is_required: form.is_required,
				order_index: Number(form.order_index),
				created_by: user?.id
			})
			.select()
			.single()

		if (err) {
			setError(err.message)
			setLoading(false)
			return
		}

		router.push(`/admin/topics/${topic.id}`)
	}

	return (
		<div className={styles.page}>
			<div className={styles.header}>
				<button
					className={styles.back}
					onClick={() => router.back()}
				>
					← Назад
				</button>
				<h1 className={styles.title}>Нова тема</h1>
			</div>

			<form
				onSubmit={handleSubmit}
				className={styles.form}
			>
				<div className={styles.card}>
					<h2 className={styles.cardTitle}>Основна інформація</h2>

					<div className={styles.field}>
						<label className={styles.label}>Назва теми *</label>
						<input
							type="text"
							className={styles.input}
							placeholder="Наприклад: Введення в компанію"
							value={form.title}
							onChange={update('title')}
							required
						/>
					</div>

					<div className={styles.field}>
						<label className={styles.label}>Опис</label>
						<textarea
							className={styles.textarea}
							placeholder="Короткий опис теми..."
							value={form.description}
							onChange={update('description')}
							rows={3}
						/>
					</div>

					<div className={styles.row}>
						<div className={styles.field}>
							<label className={styles.label}>Порядковий номер</label>
							<input
								type="number"
								className={styles.input}
								min={0}
								value={form.order_index}
								onChange={update('order_index')}
							/>
						</div>
						<div className={styles.field}>
							<label className={styles.label}>Обов'язкова тема</label>
							<div className={styles.toggle}>
								<button
									type="button"
									className={`${styles.toggleBtn} ${form.is_required ? styles.toggleOn : ''}`}
									onClick={() => setForm(prev => ({ ...prev, is_required: !prev.is_required }))}
								>
									{form.is_required ? 'Так' : 'Ні'}
								</button>
							</div>
						</div>
					</div>
				</div>

				{error && <div className={styles.error}>{error}</div>}

				<div className={styles.actions}>
					<button
						type="button"
						className={styles.cancelBtn}
						onClick={() => router.back()}
					>
						Відміна
					</button>
					<button
						type="submit"
						className={styles.submitBtn}
						disabled={loading}
					>
						{loading ? 'Створення...' : 'Створити тему →'}
					</button>
				</div>
			</form>
		</div>
	)
}
