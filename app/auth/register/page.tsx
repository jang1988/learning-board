'use client'

import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import styles from '../auth.module.css'

export default function RegisterPage() {
	const router = useRouter()
	const [form, setForm] = useState({ full_name: '', email: '', password: '', department: '' })
	const [error, setError] = useState('')
	const [loading, setLoading] = useState(false)

	const update = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
		setForm(prev => ({ ...prev, [field]: e.target.value }))

	const handleRegister = async (e: React.FormEvent) => {
		e.preventDefault()
		setLoading(true)
		setError('')

		const supabase = createClient()

		// 1. Регистрация через Supabase Auth
		const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
			email: form.email,
			password: form.password,
			options: {
				data: { full_name: form.full_name }
			}
		})

		if (signUpError) {
			setError(signUpError.message)
			setLoading(false)
			return
		}

		const userId = signUpData.user?.id
		if (!userId) {
			setError('Не вдалося створити користувача. Спробуйте ще раз.')
			setLoading(false)
			return
		}

		// 2. Создать профиль вручную (на случай если триггер не отработал)
		const { error: profileError } = await supabase.from('profiles').upsert({
			id: userId,
			email: form.email,
			full_name: form.full_name || form.email.split('@')[0],
			department: form.department || null,
			role: 'manager'
		})

		if (profileError) {
			// Профиль уже создан триггером — это нормально, игнорируем
			console.warn('Profile upsert warning:', profileError.message)
		}

		router.push('/manager/dashboard')
		router.refresh()
	}

	return (
		<div className={styles.wrap}>
			<div className={styles.card}>
				<div className={styles.logo}>
					<div className={styles.logoIcon}>S</div>
					<div className={styles.logoText}>SPECIALIST</div>
				</div>

				<h1 className={styles.title}>Реєстрація</h1>
				<p className={styles.sub}>Створіть обліковий запис нового співробітника</p>

				<form
					onSubmit={handleRegister}
					className={styles.form}
				>
					<div className={styles.field}>
						<label className={styles.label}>Повне ім'я</label>
						<input
							type="text"
							className={styles.input}
							placeholder="Петро Петрович"
							value={form.full_name}
							onChange={update('full_name')}
							required
						/>
					</div>
					<div className={styles.field}>
						<label className={styles.label}>Email</label>
						<input
							type="email"
							className={styles.input}
							placeholder="you@company.com"
							value={form.email}
							onChange={update('email')}
							required
						/>
					</div>
					<div className={styles.field}>
						<label className={styles.label}>Відділ</label>
						<input
							type="text"
							className={styles.input}
							placeholder="Продажі, Розробка..."
							value={form.department}
							onChange={update('department')}
						/>
					</div>
					<div className={styles.field}>
						<label className={styles.label}>Пароль</label>
						<input
							type="password"
							className={styles.input}
							placeholder="Мінімум 6 символів"
							value={form.password}
							onChange={update('password')}
							required
							minLength={6}
						/>
					</div>

					{error && <div className={styles.error}>{error}</div>}

					<button
						type="submit"
						className={styles.btn}
						disabled={loading}
					>
						{loading ? 'Створення...' : 'Створити аккаунт'}
					</button>
				</form>

				<p className={styles.footer}>
					Вже є обліковий запис?{' '}
					<Link
						href="/auth/login"
						className={styles.link}
					>
						Войти
					</Link>
				</p>
				<p className={styles.hint}>
					Після реєстрації адміністратор назначить вам необхідні теми навчання.
				</p>
			</div>
		</div>
	)
}
