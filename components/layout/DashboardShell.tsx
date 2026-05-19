'use client'

import { useEffect, useState } from 'react'
import Sidebar from './Sidebar'
import s from './Sidebar.module.css'

interface Props {
	children: React.ReactNode
	profile: any
}

export default function DashboardShell({
	children,
	profile
}: Props) {
	const [fullscreenQuiz, setFullscreenQuiz] = useState(false)

	useEffect(() => {
		const handler = () => {
			setFullscreenQuiz(!!document.fullscreenElement)
		}

		document.addEventListener('fullscreenchange', handler)

		return () => {
			document.removeEventListener('fullscreenchange', handler)
		}
	}, [])

	return (
		<div className={s.layout}>
			<Sidebar
				profile={profile}
				hidden={fullscreenQuiz}
			/>

			<main
				className={`${s.main} ${
					fullscreenQuiz ? s.mainFull : ''
				}`}
			>
				{children}
			</main>
		</div>
	)
}