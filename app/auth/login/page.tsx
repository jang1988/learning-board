'use client'

import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import styles from '../auth.module.css'

export default function LoginPage() {
	const router = useRouter()
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [error, setError] = useState('')
	const [loading, setLoading] = useState(false)

	const handleLogin = async (e: React.FormEvent) => {
		e.preventDefault()
		setLoading(true)
		setError('')

		const supabase = createClient()

		// 1. Вход
		const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
			email,
			password
		})

		if (authError || !authData.user) {
			setError('Невірний email або пароль')
			setLoading(false)
			return
		}

		// 2. Получить роль из profiles
		const { data: profile, error: profileError } = await supabase
			.from('profiles')
			.select('role')
			.eq('id', authData.user.id)
			.single()

		if (profileError || !profile) {
			// Профиль не найден — создать с ролью manager
			await supabase.from('profiles').upsert({
				id: authData.user.id,
				email: authData.user.email ?? '',
				full_name: authData.user.user_metadata?.full_name ?? email.split('@')[0],
				role: 'manager'
			})
			router.push('/manager/dashboard')
			router.refresh()
			return
		}

		// 3. Редирект по роли
		router.push(profile.role === 'admin' ? '/admin/dashboard' : '/manager/dashboard')
		router.refresh()
	}

	return (
		<div className={styles.wrap}>
			<div className={styles.card}>
				<div className={styles.logo}>
					<div className={styles.logoIcon}>S</div>
					<div className={styles.logoText}>SPECIALIST</div>
				</div>

				<h1 className={styles.title}>Вхід у платформу</h1>
				<p className={styles.sub}>Введіть дані вашого облікового запису</p>

				<form
					onSubmit={handleLogin}
					className={styles.form}
				>
					<div className={styles.field}>
						<label className={styles.label}>Email</label>
						<input
							type="email"
							className={styles.input}
							placeholder="you@company.com"
							value={email}
							onChange={e => setEmail(e.target.value)}
							required
						/>
					</div>
					<div className={styles.field}>
						<label className={styles.label}>Пароль</label>
						<input
							type="password"
							className={styles.input}
							placeholder="••••••••"
							value={password}
							onChange={e => setPassword(e.target.value)}
							required
						/>
					</div>

					{error && <div className={styles.error}>{error}</div>}

					<button
						type="submit"
						className={styles.btn}
						disabled={loading}
					>
						{loading ? 'Вхід...' : 'Увійти'}
					</button>
				</form>

				<p className={styles.footer}>
					Немає облікового запису ?{' '}
					<Link
						href="/auth/register"
						className={styles.link}
					>
						Зареєструватися
					</Link>
				</p>
			</div>
		</div>
	)
}
