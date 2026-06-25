'use client'

import styles from '@/app/manager/modules/modules.module.css'
import { useRouter } from 'next/navigation'

type Props = {
	modules: any[]
}

export function ModuleViewer({ modules }: Props) {
	const router = useRouter()

	return (
		<div className={styles.wrapper}>
			{modules.map(module => (
				<div
					key={module.id}
					className={styles.card}
					style={{
						background: module.color
					}}
					onClick={() => router.push(`/manager/modules/${module.id}`)}
				>
					<div className={styles.header}>
						<h3>{module.title}</h3>

						{module.description && <p>{module.description}</p>}

						<span
							style={{
								background: module.color
							}}
						>
							{module.module_topics?.length ?? 0} тем
						</span>
					</div>
				</div>
			))}
		</div>
	)
}
