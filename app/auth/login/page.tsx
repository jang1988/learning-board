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

	const handleGoogleLogin = async () => {
		const supabase = createClient()

		await supabase.auth.signInWithOAuth({
			provider: 'google',
			options: {
				redirectTo: `${window.location.origin}/auth/callback`
			}
		})
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

				<button
					type="button"
					onClick={handleGoogleLogin}
					className={styles.googleBtn}
				>
					<svg
						width="20"
						height="20"
						viewBox="0 0 48 48"
						aria-hidden="true"
					>
						<path
							fill="#FFC107"
							d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.7 1.1 7.8 3l5.7-5.7C34.1 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"
						/>
						<path
							fill="#FF3D00"
							d="M6.3 14.7l6.6 4.8C14.7 15 18.9 12 24 12c3 0 5.7 1.1 7.8 3l5.7-5.7C34.1 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
						/>
						<path
							fill="#4CAF50"
							d="M24 44c5.2 0 10-2 13.6-5.2l-6.3-5.3c-2.1 1.6-4.7 2.5-7.3 2.5-5.3 0-9.8-3.3-11.4-8l-6.5 5C9.5 39.5 16.2 44 24 44z"
						/>
						<path
							fill="#1976D2"
							d="M43.6 20.5H42V20H24v8h11.3c-1.1 3.2-3.4 5.6-6.7 7.2l6.3 5.3C38.5 37.2 44 31.3 44 24c0-1.3-.1-2.4-.4-3.5z"
						/>
					</svg>

					<span>Увійти через Google</span>
				</button>

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
