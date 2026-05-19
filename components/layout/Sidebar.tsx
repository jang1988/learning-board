'use client'

import { createClient } from '@/lib/supabase/client'
import { Profile } from '@/types'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import s from './Sidebar.module.css'

interface NavItem {
	href: string
	label: string
	icon: string
}

const managerNav: NavItem[] = [
	{ href: '/manager/dashboard', label: 'Головна', icon: '⊞' },
	{ href: '/manager/topics', label: 'Теми', icon: '▤' },
	{ href: '/manager/results', label: 'Результати', icon: '✓' }
]

const adminNav: NavItem[] = [
	{ href: '/admin/dashboard', label: 'Дашборд', icon: '⊞' },
	{ href: '/admin/topics', label: 'Теми', icon: '▤' },
	{ href: '/admin/users', label: 'Співробітники', icon: '◎' },
	{ href: '/admin/reports', label: 'Звіти', icon: '↗' },
	{ href: '/admin/text-answers', label: 'Перевірка', icon: '✏️' }
]

interface SidebarProps {
	profile: Profile
	hidden?: boolean
}

export default function Sidebar({ profile, hidden }: SidebarProps) {
	const pathname = usePathname()
	const router = useRouter()

	const [open, setOpen] = useState(false)

	const isAdmin = profile.role === 'admin'
	const nav = isAdmin ? adminNav : managerNav

	const handleLogout = async () => {
		const supabase = createClient()
		await supabase.auth.signOut()
		router.push('/auth/login')
	}

	const initials = profile.full_name
		.split(' ')
		.slice(0, 2)
		.map(w => w[0])
		.join('')
		.toUpperCase()

	return (
		<>
			<button
				className={`${s.sideTrigger} ${open ? s.sideTriggerHidden : ''}`}
				onClick={() => setOpen(true)}
			>
				›
			</button>

			{open && (
				<div
					className={s.overlay}
					onClick={() => setOpen(false)}
				/>
			)}

			<aside
				className={`
		${s.sidebar}
		${open ? s.open : ''}
		${hidden ? s.sidebarHidden : ''}
	`}
			>
				<div className={s.logo}>
					<div className={s.logoIcon}>S</div>

					<div>
						<div className={s.logoText}>SPECIALIST</div>
						<div className={s.logoSub}>Платформа навчання</div>
					</div>

					<button
						className={s.close}
						onClick={() => setOpen(false)}
					>
						✕
					</button>
				</div>

				<nav className={s.nav}>
					<div className={s.navSection}>
						<div className={s.navLabel}>{isAdmin ? 'Управління' : 'Навчання'}</div>

						{nav.map(item => (
							<Link
								key={item.href}
								href={item.href}
								className={`${s.navItem} ${pathname === item.href ? s.active : ''}`}
								onClick={() => setOpen(false)}
							>
								<span className={s.navIcon}>{item.icon}</span>
								{item.label}
							</Link>
						))}
					</div>
				</nav>

				<div className={s.bottom}>
					<div className={s.userCard}>
						<div className={s.avatar}>{initials}</div>

						<div>
							<div className={s.userName}>{profile.full_name}</div>

							<div className={s.userRole}>{isAdmin ? 'Адміністратор' : 'Співробітник'}</div>
						</div>
					</div>

					<button
						className={s.navItem}
						onClick={handleLogout}
					>
						<span className={s.navIcon}>⎋</span>
						Вийти
					</button>
				</div>
			</aside>
		</>
	)
}
