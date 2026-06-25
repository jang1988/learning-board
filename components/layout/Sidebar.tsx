'use client'

import { createClient } from '@/lib/supabase/client'
import { Profile } from '@/types'
import {
	BarChart3,
	BookOpen,
	CheckCircle2,
	Component,
	FilePenLine,
	LayoutDashboard,
	LogOut,
	LucideIcon,
	Users
} from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import s from './Sidebar.module.css'

interface NavItem {
	href: string
	label: string
	icon: LucideIcon
}

const managerNav: NavItem[] = [
	{
		href: '/manager/dashboard',
		label: 'Головна',
		icon: LayoutDashboard
	},
	{
		href: '/manager/modules',
		label: 'Категорії',
		icon: Component
	},
	{
		href: '/manager/topics',
		label: 'Теми',
		icon: BookOpen
	},
	{
		href: '/manager/results',
		label: 'Результати',
		icon: CheckCircle2
	}
]

const adminNav: NavItem[] = [
	{
		href: '/admin/dashboard',
		label: 'Дашборд',
		icon: LayoutDashboard
	},
	{
		href: '/admin/modules',
		label: 'Категорії',
		icon: Component
	},
	{
		href: '/admin/topics',
		label: 'Теми',
		icon: BookOpen
	},
	{
		href: '/admin/users',
		label: 'Співробітники',
		icon: Users
	},
	{
		href: '/admin/reports',
		label: 'Звіти',
		icon: BarChart3
	},
	{
		href: '/admin/text-answers',
		label: 'Перевірка',
		icon: FilePenLine
	}
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
				onClick={() => setOpen(prev => !prev)}
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

						{nav.map(item => {
							const Icon = item.icon

							return (
								<Link
									key={item.href}
									href={item.href}
									className={`${s.navItem} ${pathname === item.href ? s.active : ''}`}
									onClick={() => setOpen(false)}
								>
									<span className={s.navIcon}>
										<Icon size={20} />
									</span>

									{item.label}
								</Link>
							)
						})}
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
						<LogOut
							color="var(--color-danger)"
							size={20}
							style={{ transform: 'rotate(180deg)' }}
						/>
						Вийти
					</button>
				</div>
			</aside>
		</>
	)
}
